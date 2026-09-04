const prisma = require('../config/db');

class UnderwritingService {
  /**
   * Evaluates proposal risk score, applies risk factors, assigns risk level,
   * generates IRDAI compliance audit logs, and creates/updates UnderwritingAssessment.
   */
  static async evaluateProposalUnderwriting(proposalIdentifier) {
    const proposal = await prisma.proposal.findFirst({
      where: {
        OR: [
          { id: proposalIdentifier },
          { proposalRef: proposalIdentifier },
        ],
      },
      include: {
        user: true,
        policy: true,
      },
    });

    if (!proposal) {
      throw new Error(`Proposal not found for ID / Ref: "${proposalIdentifier}"`);
    }

    const proposerInfo = proposal.proposerInfo || {};
    const medicalHistory = proposal.medicalHistory || {};
    const membersInfo = Array.isArray(proposal.membersInfo) ? proposal.membersInfo : [];

    let riskScore = 10; // Baseline healthy score
    const riskFactors = [];

    // 1. Age Factor
    const age = parseInt(proposerInfo.age || proposerInfo.dob ? (new Date().getFullYear() - new Date(proposerInfo.dob).getFullYear()) : 30, 10);
    if (age > 60) {
      riskScore += 25;
      riskFactors.push({ category: 'AGE', factor: 'Senior Applicant (> 60 yrs)', points: 25 });
    } else if (age > 50) {
      riskScore += 15;
      riskFactors.push({ category: 'AGE', factor: 'Mature Applicant (51-60 yrs)', points: 15 });
    } else if (age > 40) {
      riskScore += 8;
      riskFactors.push({ category: 'AGE', factor: 'Middle-Aged Applicant (41-50 yrs)', points: 8 });
    }

    // 2. BMI Calculation (weight / heightInMeters^2)
    const weight = parseFloat(proposerInfo.weight || 70);
    const heightCm = parseFloat(proposerInfo.height || 170);
    const heightM = heightCm / 100;
    const bmi = heightM > 0 ? (weight / (heightM * heightM)) : 22;

    if (bmi > 35) {
      riskScore += 25;
      riskFactors.push({ category: 'BMI', factor: `Class II/III Obesity (BMI: ${bmi.toFixed(1)})`, points: 25 });
    } else if (bmi > 30) {
      riskScore += 15;
      riskFactors.push({ category: 'BMI', factor: `Overweight / Class I Obesity (BMI: ${bmi.toFixed(1)})`, points: 15 });
    } else if (bmi < 17) {
      riskScore += 10;
      riskFactors.push({ category: 'BMI', factor: `Underweight (BMI: ${bmi.toFixed(1)})`, points: 10 });
    }

    // 3. Tobacco / Smoking Usage
    const consumesTobacco = medicalHistory.tobaccoUse || medicalHistory.smoker || proposerInfo.smoker || false;
    if (consumesTobacco) {
      riskScore += 22;
      riskFactors.push({ category: 'LIFESTYLE', factor: 'Tobacco / Nicotine Usage', points: 22 });
    }

    // 4. Alcohol Usage
    const consumesAlcohol = medicalHistory.alcoholUse || proposerInfo.alcoholUse || false;
    if (consumesAlcohol) {
      riskScore += 10;
      riskFactors.push({ category: 'LIFESTYLE', factor: 'Frequent Alcohol Consumption', points: 10 });
    }

    // 5. Pre-existing Conditions
    const conditions = Array.isArray(medicalHistory.conditions) ? medicalHistory.conditions : [];
    const conditionStr = JSON.stringify(medicalHistory).toLowerCase();

    if (conditions.includes('DIABETES') || conditionStr.includes('diabetes')) {
      riskScore += 25;
      riskFactors.push({ category: 'MEDICAL', factor: 'Pre-existing Diabetes Mellitus', points: 25 });
    }
    if (conditions.includes('HYPERTENSION') || conditionStr.includes('hypertension') || conditionStr.includes('bp')) {
      riskScore += 15;
      riskFactors.push({ category: 'MEDICAL', factor: 'Pre-existing Hypertension (High BP)', points: 15 });
    }
    if (conditions.includes('CARDIAC') || conditionStr.includes('heart') || conditionStr.includes('cardiac')) {
      riskScore += 35;
      riskFactors.push({ category: 'MEDICAL', factor: 'Cardiovascular History / Heart Condition', points: 35 });
    }
    if (conditions.includes('CANCER') || conditionStr.includes('cancer') || conditionStr.includes('tumor')) {
      riskScore += 45;
      riskFactors.push({ category: 'MEDICAL', factor: 'Oncology / Cancer History', points: 45 });
    }
    if (conditions.includes('ASTHMA') || conditionStr.includes('asthma')) {
      riskScore += 12;
      riskFactors.push({ category: 'MEDICAL', factor: 'Chronic Respiratory / Asthma', points: 12 });
    }
    if (medicalHistory.hasPriorSurgery || conditionStr.includes('surgery')) {
      riskScore += 15;
      riskFactors.push({ category: 'MEDICAL', factor: 'Prior Surgical Procedure History', points: 15 });
    }

    // 6. High Coverage to Annual Income Ratio
    const annualIncome = parseFloat(proposerInfo.annualIncome || 500000);
    const coverageAmount = proposal.policy?.coverageAmount || 500000;
    if (annualIncome > 0 && (coverageAmount / annualIncome) > 15) {
      riskScore += 15;
      riskFactors.push({ category: 'FINANCIAL', factor: 'High Sum Insured to Income Ratio (> 15x)', points: 15 });
    }

    // Cap Risk Score at 100
    riskScore = Math.min(Math.round(riskScore), 100);

    // Determine Risk Level & Assessment Status
    let riskLevel = 'LOW';
    let status = 'AUTO_APPROVED';
    let defaultLoading = 0;

    if (riskScore >= 90) {
      riskLevel = 'DECLINED';
      status = 'REJECTED';
      defaultLoading = 0;
    } else if (riskScore > 65) {
      riskLevel = 'HIGH';
      status = 'PENDING_REVIEW';
      defaultLoading = 25;
    } else if (riskScore >= 25) {
      riskLevel = 'MEDIUM';
      status = 'PENDING_REVIEW';
      defaultLoading = 15;
    } else {
      riskLevel = 'LOW';
      status = 'AUTO_APPROVED';
      defaultLoading = 0;
    }

    const basePremium = proposal.policy.premium || 10000;
    const finalPremium = Math.round(basePremium * (1 + defaultLoading / 100));

    // Upsert UnderwritingAssessment
    const assessment = await prisma.underwritingAssessment.upsert({
      where: { proposalId: proposal.id },
      create: {
        proposalId: proposal.id,
        userId: proposal.userId,
        policyId: proposal.policyId,
        riskScore,
        riskLevel,
        appliedLoading: defaultLoading,
        basePremium,
        finalPremium,
        riskFactors,
        status,
        underwriterNotes: status === 'AUTO_APPROVED' ? 'Automated IRDAI Rule Engine approval - Low Risk' : 'Assigned for Underwriter Review',
      },
      update: {
        riskScore,
        riskLevel,
        appliedLoading: defaultLoading,
        basePremium,
        finalPremium,
        riskFactors,
        status,
        underwriterNotes: status === 'AUTO_APPROVED' ? 'Automated IRDAI Rule Engine approval - Low Risk' : 'Re-evaluated for Underwriter Review',
      },
    });

    // Update Proposal Status accordingly
    let newProposalStatus = 'PENDING_UNDERWRITING';
    if (status === 'AUTO_APPROVED') {
      newProposalStatus = 'APPROVED';
    } else if (status === 'REJECTED') {
      newProposalStatus = 'REJECTED';
    }

    await prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: newProposalStatus,
        lockedPremium: finalPremium,
        underwritingFlags: {
          riskScore,
          riskLevel,
          appliedLoading: defaultLoading,
          riskFactorsCount: riskFactors.length,
        },
      },
    });

    // Record Compliance Audit Log
    await prisma.complianceAuditLog.create({
      data: {
        assessmentId: assessment.id,
        proposalId: proposal.id,
        actorId: proposal.userId,
        action: 'AUTOMATED_RISK_EVALUATION',
        ruleTriggered: `IRDAI_UW_RULE_SCORE_${riskLevel}`,
        compliancePassed: riskLevel !== 'DECLINED',
        metadata: {
          riskScore,
          riskLevel,
          status,
          factorsCount: riskFactors.length,
          calculatedLoading: defaultLoading,
        },
      },
    });

    return this.getAssessmentById(assessment.id);
  }

  /**
   * Process manual underwriter decision (Approve with Loading, Counter-Offer, Reject).
   */
  static async processUnderwriterDecision(assessmentId, actorId, { decision, customLoading = 0, notes = '', riderExclusions = [] }) {
    const existing = await prisma.underwritingAssessment.findUnique({
      where: { id: assessmentId },
      include: { proposal: true, policy: true },
    });

    if (!existing) {
      throw new Error('Underwriting Assessment record not found');
    }

    const appliedLoading = parseFloat(customLoading || 0);
    const basePremium = existing.basePremium || existing.policy?.premium || 10000;
    const finalPremium = Math.round(basePremium * (1 + appliedLoading / 100));

    let updatedAssessmentStatus = decision; // 'APPROVED_WITH_LOADING', 'COUNTER_OFFERED', 'REJECTED', 'AUTO_APPROVED'
    let proposalStatus = 'APPROVED';

    if (decision === 'REJECTED') {
      proposalStatus = 'REJECTED';
    } else if (decision === 'COUNTER_OFFERED') {
      proposalStatus = 'PENDING_UNDERWRITING';
    }

    const updatedAssessment = await prisma.underwritingAssessment.update({
      where: { id: assessmentId },
      data: {
        status: updatedAssessmentStatus,
        appliedLoading,
        finalPremium,
        underwriterNotes: notes,
        riderExclusions,
      },
    });

    // Update main proposal
    await prisma.proposal.update({
      where: { id: existing.proposalId },
      data: {
        status: proposalStatus,
        lockedPremium: finalPremium,
        underwritingFlags: {
          ...(existing.proposal.underwritingFlags || {}),
          underwriterDecision: decision,
          appliedLoading,
          riderExclusions,
        },
      },
    });

    // Audit log entry
    await prisma.complianceAuditLog.create({
      data: {
        assessmentId: existing.id,
        proposalId: existing.proposalId,
        actorId,
        action: `UNDERWRITER_${decision}`,
        ruleTriggered: 'IRDAI_UNDERWRITER_OVERRIDE',
        compliancePassed: decision !== 'REJECTED',
        metadata: {
          decision,
          appliedLoading,
          finalPremium,
          underwriterNotes: notes,
          riderExclusions,
        },
      },
    });

    return this.getAssessmentById(existing.id);
  }

  /**
   * Fetch assessment queue with filters.
   */
  static async getAssessments({ riskLevel, status, search }) {
    const where = {};

    if (riskLevel && riskLevel !== 'ALL') {
      where.riskLevel = riskLevel;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { proposal: { proposalRef: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return prisma.underwritingAssessment.findMany({
      where,
      include: {
        proposal: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        policy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Fetch detailed assessment.
   */
  static async getAssessmentById(id) {
    const assessment = await prisma.underwritingAssessment.findUnique({
      where: { id },
      include: {
        proposal: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        policy: true,
        auditLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    return assessment;
  }

  /**
   * Fetch IRDAI compliance audit logs.
   */
  static async getAuditLogs(query = {}) {
    const { proposalId, assessmentId, limit = 50 } = query;
    const where = {};

    if (proposalId) where.proposalId = proposalId;
    if (assessmentId) where.assessmentId = assessmentId;

    return prisma.complianceAuditLog.findMany({
      where,
      include: {
        assessment: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            proposal: { select: { proposalRef: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10),
    });
  }

  /**
   * Fetch executive summary metrics for underwriting portal.
   */
  static async getMetrics() {
    const totalCount = await prisma.underwritingAssessment.count();
    const autoApprovedCount = await prisma.underwritingAssessment.count({ where: { status: 'AUTO_APPROVED' } });
    const pendingCount = await prisma.underwritingAssessment.count({ where: { status: 'PENDING_REVIEW' } });
    const highRiskCount = await prisma.underwritingAssessment.count({ where: { riskLevel: 'HIGH' } });

    const avgLoadingAgg = await prisma.underwritingAssessment.aggregate({
      _avg: { appliedLoading: true },
    });

    const autoApprovalRate = totalCount > 0 ? ((autoApprovedCount / totalCount) * 100).toFixed(1) : 0;
    const avgLoading = avgLoadingAgg._avg.appliedLoading ? avgLoadingAgg._avg.appliedLoading.toFixed(1) : 0;

    return {
      totalAssessments: totalCount,
      autoApprovedCount,
      autoApprovalRate: parseFloat(autoApprovalRate),
      pendingReferrals: pendingCount,
      highRiskCount,
      avgLoadingPercent: parseFloat(avgLoading),
    };
  }
}

module.exports = UnderwritingService;
