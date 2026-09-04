const prisma = require('../config/db');

class CRMService {
  /**
   * Create a new sales lead (public inquiry or callback request)
   */
  static async createLead(data) {
    const { name, email, phone, category = 'HEALTH', estimatedBudget = null, notes = '', advisorId = null } = data;

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        category,
        estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : null,
        stage: 'NEW',
        notes,
        advisorId: advisorId || null,
      },
    });

    // Auto-create initial activity log
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        advisorId: advisorId || lead.advisorId || (await this.getRandomAdvisorId()),
        type: 'SYSTEM',
        description: `Lead created from public inquiry for ${category} insurance.`,
      },
    });

    return lead;
  }

  /**
   * Fetch leads for an advisor (or all leads if admin/unassigned)
   */
  static async getAdvisorLeads(advisorId, filters = {}) {
    const { stage, category, search } = filters;

    const whereClause = {};

    if (advisorId) {
      whereClause.OR = [{ advisorId }, { advisorId: null }];
    }

    if (stage && stage !== 'ALL') {
      whereClause.stage = stage;
    }

    if (category && category !== 'ALL') {
      whereClause.category = category;
    }

    if (search) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        advisor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Seed demo leads if DB is empty
    if (leads.length === 0 && !search) {
      return this.seedDemoLeads(advisorId);
    }

    return leads;
  }

  /**
   * Update lead stage (e.g. NEW -> CONTACTED -> CONVERTED)
   */
  static async updateLeadStage(leadId, stage, advisorId, notes = '') {
    const existingLead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!existingLead) {
      throw new Error('Lead not found');
    }

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        stage,
        advisorId: advisorId || existingLead.advisorId,
        notes: notes || existingLead.notes,
      },
      include: { activities: true },
    });

    // Log stage change activity
    await prisma.leadActivity.create({
      data: {
        leadId,
        advisorId: advisorId || existingLead.advisorId || (await this.getRandomAdvisorId()),
        type: 'STAGE_CHANGE',
        description: `Stage updated from ${existingLead.stage} to ${stage}. ${notes ? `Notes: ${notes}` : ''}`,
      },
    });

    // If stage converted, record simulated commission
    if (stage === 'CONVERTED' && existingLead.stage !== 'CONVERTED') {
      const estimated = updatedLead.estimatedBudget || 25000;
      const commissionAmount = Math.round(estimated * 0.12); // 12% commission
      await prisma.advisorCommission.create({
        data: {
          advisorId: updatedLead.advisorId || advisorId,
          policyName: `${updatedLead.category} Protection Plan`,
          premiumAmount: estimated,
          commissionRate: 0.12,
          commissionAmount,
          status: 'PENDING',
        },
      });
    }

    return updatedLead;
  }

  /**
   * Log an interaction activity (Call, Email, Note, Meeting)
   */
  static async addLeadActivity(leadId, advisorId, activityData) {
    const { type = 'NOTE', description } = activityData;

    const activity = await prisma.leadActivity.create({
      data: {
        leadId,
        advisorId,
        type,
        description,
      },
    });

    // Touch lead updatedAt
    await prisma.lead.update({
      where: { id: leadId },
      data: { updatedAt: new Date() },
    });

    return activity;
  }

  /**
   * Get commission summary and performance analytics for an advisor
   */
  static async getAdvisorCommissionSummary(advisorId) {
    const commissions = await prisma.advisorCommission.findMany({
      where: advisorId ? { advisorId } : {},
      orderBy: { createdAt: 'desc' },
    });

    const totalEarned = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const pendingAmount = commissions
      .filter((c) => c.status === 'PENDING')
      .reduce((sum, c) => sum + c.commissionAmount, 0);
    const paidAmount = commissions
      .filter((c) => c.status === 'PAID')
      .reduce((sum, c) => sum + c.commissionAmount, 0);

    const totalLeads = await prisma.lead.count({
      where: advisorId ? { advisorId } : {},
    });
    const convertedLeads = await prisma.lead.count({
      where: {
        ...(advisorId ? { advisorId } : {}),
        stage: 'CONVERTED',
      },
    });

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    return {
      totalEarned,
      pendingAmount,
      paidAmount,
      totalLeads,
      convertedLeads,
      conversionRate,
      commissions,
    };
  }

  /**
   * Helper: Get first available advisor or create fallback
   */
  static async getRandomAdvisorId() {
    const advisor = await prisma.user.findFirst({ where: { role: 'ADVISOR' } });
    return advisor ? advisor.id : 'clqfallbackadvisor0001';
  }

  /**
   * Helper: Seed sample leads if database has none
   */
  static async seedDemoLeads(advisorId) {
    const demoLeads = [
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        phone: '+91 98765 43210',
        category: 'HEALTH',
        estimatedBudget: 35000,
        stage: 'NEW',
        notes: 'Inquired about family floater cover for spouse and 1 child.',
      },
      {
        name: 'Priya Verma',
        email: 'priya.v@example.com',
        phone: '+91 98123 76543',
        category: 'LIFE',
        estimatedBudget: 50000,
        stage: 'CONTACTED',
        notes: 'Requested term life quote of ₹1 Crore sum assured.',
      },
      {
        name: 'Vikram Patel',
        email: 'vikram.patel@example.com',
        phone: '+91 97654 32109',
        category: 'MOTOR',
        estimatedBudget: 18000,
        stage: 'QUOTE_SENT',
        notes: 'Shared Zero-Dep car insurance quote for SUV.',
      },
      {
        name: 'Ananya Roy',
        email: 'ananya.roy@example.com',
        phone: '+91 99887 76655',
        category: 'TRAVEL',
        estimatedBudget: 12000,
        stage: 'CONVERTED',
        notes: 'Policy issued for 15-day Schengen visa trip.',
      },
    ];

    const targetAdvisorId = advisorId || (await this.getRandomAdvisorId());

    for (const lead of demoLeads) {
      await this.createLead({ ...lead, advisorId: targetAdvisorId });
    }

    return prisma.lead.findMany({
      where: targetAdvisorId ? { advisorId: targetAdvisorId } : {},
      include: {
        advisor: { select: { id: true, firstName: true, lastName: true, email: true } },
        activities: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}

module.exports = CRMService;
