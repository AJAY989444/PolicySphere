const prisma = require('../config/db');

class ProposalService {
  /**
   * Helper: Generate a unique proposal reference like PROP-849201
   */
  static generateProposalRef() {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `PROP-${randomNum}`;
  }

  /**
   * Save or update proposal draft
   */
  static async createOrUpdateDraft(userId, data) {
    const { id, policyId, step = 1, proposerInfo = {}, membersInfo = [], medicalHistory = {}, nomineeInfo = {} } = data;

    if (!policyId) {
      const error = new Error('policyId is required to create or update a proposal');
      error.statusCode = 400;
      throw error;
    }

    // Verify policy exists
    const policy = await prisma.insurancePolicy.findUnique({
      where: { id: policyId }
    });
    if (!policy) {
      const error = new Error('Selected insurance policy not found');
      error.statusCode = 44;
      throw error;
    }

    // If ID provided, update existing
    if (id) {
      const existing = await prisma.proposal.findFirst({
        where: { id, userId }
      });
      if (!existing) {
        const error = new Error('Proposal draft not found');
        error.statusCode = 404;
        throw error;
      }

      return await prisma.proposal.update({
        where: { id },
        data: {
          step: Math.max(existing.step, step),
          proposerInfo: proposerInfo || existing.proposerInfo,
          membersInfo: membersInfo || existing.membersInfo,
          medicalHistory: medicalHistory || existing.medicalHistory,
          nomineeInfo: nomineeInfo || existing.nomineeInfo,
          updatedAt: new Date()
        },
        include: {
          policy: true
        }
      });
    }

    // Otherwise create new draft
    const proposalRef = this.generateProposalRef();
    return await prisma.proposal.create({
      data: {
        proposalRef,
        userId,
        policyId,
        step,
        status: 'DRAFT',
        proposerInfo,
        membersInfo,
        medicalHistory,
        nomineeInfo,
        lockedPremium: policy.premium
      },
      include: {
        policy: true
      }
    });
  }

  /**
   * Get single proposal by ID
   */
  static async getProposalById(userId, proposalId) {
    const proposal = await prisma.proposal.findFirst({
      where: { id: proposalId, userId },
      include: { policy: true }
    });

    if (!proposal) {
      const error = new Error('Proposal application not found');
      error.statusCode = 404;
      throw error;
    }

    return proposal;
  }

  /**
   * List all user proposals
   */
  static async getUserProposals(userId) {
    return await prisma.proposal.findMany({
      where: { userId },
      include: { policy: true },
      orderBy: { updatedAt: 'desc' }
    });
  }

  /**
   * Perform automated underwriting pre-checks & lock premium for 30 days
   */
  static async validateAndLockProposal(userId, proposalId) {
    const proposal = await prisma.proposal.findFirst({
      where: { id: proposalId, userId },
      include: { policy: true }
    });

    if (!proposal) {
      const error = new Error('Proposal not found');
      error.statusCode = 404;
      throw error;
    }

    const { medicalHistory = {}, membersInfo = [], proposerInfo = {} } = proposal;
    const policy = proposal.policy;

    // Automated Underwriting Pre-check Logic
    const riskFlags = [];
    let extraLoadingPercent = 0;
    let medicalTestRequired = false;

    // 1. Pre-existing condition checks
    if (medicalHistory.hasPreExisting) {
      riskFlags.push({ code: 'PRE_EXISTING', label: 'Declared Pre-existing Medical Conditions' });
      extraLoadingPercent += 10;
    }
    if (medicalHistory.tobaccoOrAlcohol) {
      riskFlags.push({ code: 'LIFESTYLE_HABIT', label: 'Tobacco / Alcohol Consumption Declared' });
      extraLoadingPercent += 5;
    }
    if (medicalHistory.recentSurgeries) {
      riskFlags.push({ code: 'SURGICAL_HISTORY', label: 'Surgeries or Hospitalizations in Past 3 Years' });
      medicalTestRequired = true;
    }

    // 2. Age-based underwriting check
    const eldestMemberAge = Array.isArray(membersInfo) && membersInfo.length > 0 
      ? Math.max(...membersInfo.map(m => Number(m.age) || 0)) 
      : 0;

    if (eldestMemberAge >= 55) {
      riskFlags.push({ code: 'SENIOR_MEMBER', label: 'Insured Member Aged 55+' });
      medicalTestRequired = true;
    }

    // Calculate final locked premium (base policy premium + optional loading)
    const basePremium = policy.premium;
    const lockedPremium = Math.round(basePremium * (1 + extraLoadingPercent / 100));

    // Expiration timestamp = 30 days from now
    const premiumExpiresAt = new Date();
    premiumExpiresAt.setDate(premiumExpiresAt.getDate() + 30);

    // Determine status
    const status = medicalTestRequired ? 'PENDING_UNDERWRITING' : 'APPROVED';

    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status,
        step: 4,
        lockedPremium,
        premiumExpiresAt,
        underwritingFlags: {
          riskFlags,
          extraLoadingPercent,
          medicalTestRequired,
          underwritingNote: medicalTestRequired 
            ? 'Tele-medical health review required prior to final policy issuance.' 
            : 'Instant automated underwriting pre-check passed successfully!'
        }
      },
      include: {
        policy: true
      }
    });

    return updatedProposal;
  }

  /**
   * Delete draft proposal
   */
  static async deleteProposal(userId, proposalId) {
    const existing = await prisma.proposal.findFirst({
      where: { id: proposalId, userId }
    });

    if (!existing) {
      const error = new Error('Proposal not found');
      error.statusCode = 404;
      throw error;
    }

    await prisma.proposal.delete({
      where: { id: proposalId }
    });

    return { message: 'Proposal draft deleted successfully' };
  }
}

module.exports = ProposalService;
