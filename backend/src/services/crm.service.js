const prisma = require('../config/db');

// Built-in insurance email templates
const EMAIL_TEMPLATES = {
  QUOTE_FOLLOWUP: {
    name: 'Quote Follow-up & Recommendations',
    subject: 'PolicySphere Quote Follow-up: Tailored {{category}} Insurance Recommendation',
    body: `Hello {{name}},\n\nThank you for exploring {{category}} Insurance on PolicySphere. Based on your profile and estimated budget of ₹{{budget}}, we have shortlisted top-rated plans offering comprehensive coverage and instant cashless hospital/garage settlement.\n\nWould you like to schedule a quick 15-minute consultation to walk through the waiting periods and rider benefits?\n\nWarm regards,\n{{advisorName}}\nPolicySphere Senior Insurance Advisor`,
  },
  TAX_SAVER_80D: {
    name: 'Tax Savings Alert (Section 80D / 80C)',
    subject: 'Maximize Your Tax Savings with {{category}} Insurance — Section 80D / 80C',
    body: `Dear {{name}},\n\nInvesting in your family's {{category}} protection also unlocks significant tax deductions under Section 80D/80C of the Income Tax Act:\n\n• Self & Family: Up to ₹25,000 deduction/year\n• Senior Citizen Parents: Additional deduction up to ₹50,000/year\n\nLock in your tax savings before the deadline while safeguarding what matters most. Let's connect to review your instant quote.\n\nBest regards,\n{{advisorName}}\nPolicySphere Advisory Team`,
  },
  KYC_REMINDER: {
    name: 'KYC & Proposal Document Reminder',
    subject: 'Action Required: Complete KYC Verification for Your {{category}} Policy',
    body: `Hello {{name}},\n\nYour insurance proposal for {{category}} Insurance is in progress! To lock in your quoted premium of ₹{{budget}} and finalize policy issuance, please complete your Aadhaar / PAN verification.\n\nYou can upload your documents securely via your PolicySphere Dashboard in under 2 minutes.\n\nFeel free to reach out if you need assistance.\n\nRegards,\n{{advisorName}}\nPolicySphere Underwriting Support`,
  },
  WELCOME_ONBOARDING: {
    name: 'Policy Activation & Onboarding Welcome',
    subject: 'Welcome to PolicySphere: Your {{category}} Coverage is Now Active!',
    body: `Dear {{name}},\n\nCongratulations on choosing PolicySphere for your {{category}} insurance! Your digital policy schedule, e-cards, and 24/7 cashless claim helpline numbers are now live in your customer portal.\n\nThank you for placing your trust in us.\n\nWarm regards,\n{{advisorName}}\nPolicySphere Team`,
  },
};

class CRMService {
  /**
   * Calculate dynamic lead score (0-100) based on budget, priority, source & profile
   */
  static calculateLeadScore({ estimatedBudget, priority, source, phone, email, notes }) {
    let score = 30; // base score

    // Budget weighting
    const budget = parseFloat(estimatedBudget) || 0;
    if (budget >= 50000) score += 30;
    else if (budget >= 25000) score += 20;
    else if (budget >= 10000) score += 10;

    // Priority weighting
    if (priority === 'HOT') score += 25;
    else if (priority === 'WARM') score += 15;
    else if (priority === 'COLD') score += 5;

    // Source weighting
    if (source === 'REFERRAL') score += 20;
    else if (source === 'SMART_ADVISOR') score += 15;
    else if (source === 'CATALOG_INQUIRY') score += 10;
    else if (source === 'LANDING_PAGE') score += 10;
    else score += 5;

    // Completeness weighting
    if (phone && phone.trim().length >= 10) score += 5;
    if (email && email.includes('@')) score += 5;
    if (notes && notes.trim().length > 15) score += 5;

    return Math.min(99, Math.max(15, Math.round(score)));
  }

  /**
   * Automatically assign lead using workload-balancing & round-robin
   */
  static async autoAssignLead(category = 'HEALTH') {
    const activeAdvisors = await prisma.user.findMany({
      where: { role: 'ADVISOR', isActive: true },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!activeAdvisors || activeAdvisors.length === 0) {
      return null;
    }

    // Workload-balanced: Find advisor with fewest active open leads
    const openLeadsCounts = await Promise.all(
      activeAdvisors.map(async (adv) => {
        const count = await prisma.lead.count({
          where: {
            advisorId: adv.id,
            stage: { in: ['NEW', 'CONTACTED', 'QUOTE_SENT', 'PROPOSAL_IN_PROGRESS'] },
          },
        });
        return { advisorId: adv.id, count };
      })
    );

    openLeadsCounts.sort((a, b) => a.count - b.count);
    return openLeadsCounts[0].advisorId;
  }

  /**
   * Create a new sales lead (with source attribution, scoring & auto-assignment)
   */
  static async createLead(data) {
    const {
      name,
      email,
      phone,
      category = 'HEALTH',
      estimatedBudget = null,
      notes = '',
      advisorId = null,
      source = 'CATALOG_INQUIRY',
      priority = 'WARM',
      sentiment = 'INTERESTED',
      policyId = null,
    } = data;

    // Auto-assign if no advisor specified
    let targetAdvisorId = advisorId;
    if (!targetAdvisorId) {
      targetAdvisorId = await this.autoAssignLead(category);
    }

    // Dynamic lead score
    const leadScore = this.calculateLeadScore({
      estimatedBudget,
      priority,
      source,
      phone,
      email,
      notes,
    });

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        category,
        estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : null,
        stage: 'NEW',
        source,
        priority,
        leadScore,
        sentiment,
        policyId: policyId || null,
        notes,
        advisorId: targetAdvisorId || null,
      },
      include: {
        advisor: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Auto-create initial activity log
    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        advisorId: targetAdvisorId || (await this.getRandomAdvisorId()),
        type: 'SYSTEM',
        description: `Lead captured via ${source} for ${category} Insurance with score ${leadScore}/100. Priority: ${priority}.`,
      },
    });

    return lead;
  }

  /**
   * Fetch leads for an advisor or admin with filtering & search
   */
  static async getAdvisorLeads(advisorId, filters = {}) {
    const { stage, category, priority, source, search } = filters;

    const whereClause = {};

    // If advisor, show assigned leads or unassigned pool; if admin, show all
    if (advisorId) {
      whereClause.OR = [{ advisorId }, { advisorId: null }];
    }

    if (stage && stage !== 'ALL') {
      whereClause.stage = stage;
    }

    if (category && category !== 'ALL') {
      whereClause.category = category;
    }

    if (priority && priority !== 'ALL') {
      whereClause.priority = priority;
    }

    if (source && source !== 'ALL') {
      whereClause.source = source;
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
        followUps: {
          where: { status: 'PENDING' },
          orderBy: { scheduledAt: 'asc' },
          take: 3,
        },
        calls: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        meetings: {
          orderBy: { scheduledAt: 'desc' },
          take: 3,
        },
        emailLogs: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
    });

    // Seed demo leads if DB is completely empty
    if (leads.length === 0 && !search && (!stage || stage === 'ALL')) {
      return this.seedDemoLeads(advisorId);
    }

    return leads;
  }

  /**
   * Get single lead by ID with full 360-degree timeline
   */
  static async getLeadById(leadId) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        advisor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
        },
        followUps: {
          orderBy: { scheduledAt: 'asc' },
        },
        calls: {
          orderBy: { createdAt: 'desc' },
        },
        meetings: {
          orderBy: { scheduledAt: 'asc' },
        },
        emailLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    return lead;
  }

  /**
   * Reassign a lead to another advisor with audit trail
   */
  static async reassignLead(leadId, newAdvisorId, reason = 'Workload rebalancing', reassignerId = null) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { advisor: true },
    });
    if (!lead) throw new Error('Lead not found');

    const newAdvisor = await prisma.user.findUnique({
      where: { id: newAdvisorId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    if (!newAdvisor) throw new Error('Target advisor not found');

    const previousAdvisorName = lead.advisor
      ? `${lead.advisor.firstName} ${lead.advisor.lastName}`
      : 'Unassigned';
    const newAdvisorName = `${newAdvisor.firstName} ${newAdvisor.lastName}`;

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { advisorId: newAdvisorId },
      include: { advisor: true },
    });

    // Log reassignment activity
    await prisma.leadActivity.create({
      data: {
        leadId,
        advisorId: reassignerId || newAdvisorId,
        type: 'REASSIGNMENT',
        description: `Lead reassigned from ${previousAdvisorName} to ${newAdvisorName}. Reason: ${reason}`,
      },
    });

    return updatedLead;
  }

  /**
   * Update lead stage (e.g. NEW -> CONTACTED -> CONVERTED)
   */
  static async updateLeadStage(leadId, stage, advisorId, notes = '') {
    const existingLead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!existingLead) throw new Error('Lead not found');

    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        stage,
        advisorId: advisorId || existingLead.advisorId,
        notes: notes || existingLead.notes,
      },
      include: { advisor: true },
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

    // If stage converted, record commission
    if (stage === 'CONVERTED' && existingLead.stage !== 'CONVERTED') {
      const estimated = updatedLead.estimatedBudget || 25000;
      const commissionAmount = Math.round(estimated * 0.12);
      await prisma.advisorCommission.create({
        data: {
          advisorId: updatedLead.advisorId || advisorId || (await this.getRandomAdvisorId()),
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
   * Log an interaction activity (Note, Call, Email, Meeting)
   */
  static async addLeadActivity(leadId, advisorId, activityData) {
    const { type = 'NOTE', description } = activityData;

    const activity = await prisma.leadActivity.create({
      data: {
        leadId,
        advisorId: advisorId || (await this.getRandomAdvisorId()),
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
   * Update lead sentiment, priority, or pinned notes
   */
  static async updateLeadMetadata(leadId, { priority, sentiment, pinnedNotes }) {
    const data = {};
    if (priority) data.priority = priority;
    if (sentiment) data.sentiment = sentiment;
    if (pinnedNotes !== undefined) data.pinnedNotes = pinnedNotes;

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data,
      include: { advisor: true },
    });

    return updated;
  }

  // ─── Follow-ups Management ────────────────────────────────────────

  /**
   * Schedule a new follow-up
   */
  static async createFollowUp(leadId, advisorId, followUpData) {
    const { title, scheduledAt, priority = 'MEDIUM', notes = '' } = followUpData;

    const followUp = await prisma.leadFollowUp.create({
      data: {
        leadId,
        advisorId: advisorId || (await this.getRandomAdvisorId()),
        title,
        scheduledAt: new Date(scheduledAt),
        priority,
        status: 'PENDING',
        notes,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId,
        advisorId: followUp.advisorId,
        type: 'NOTE',
        description: `Follow-up scheduled: "${title}" for ${new Date(scheduledAt).toLocaleString('en-IN')}`,
      },
    });

    return followUp;
  }

  /**
   * Update follow-up status (e.g. mark COMPLETED or MISSED)
   */
  static async updateFollowUpStatus(followUpId, status, completionNotes = '') {
    const followUp = await prisma.leadFollowUp.update({
      where: { id: followUpId },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        notes: completionNotes || undefined,
      },
    });

    if (status === 'COMPLETED') {
      await prisma.leadActivity.create({
        data: {
          leadId: followUp.leadId,
          advisorId: followUp.advisorId,
          type: 'NOTE',
          description: `Follow-up completed: "${followUp.title}". ${completionNotes ? `Notes: ${completionNotes}` : ''}`,
        },
      });
    }

    return followUp;
  }

  /**
   * Get upcoming, today's due, and overdue follow-ups for advisor
   */
  static async getDueFollowUps(advisorId = null) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const whereBase = {
      status: 'PENDING',
      ...(advisorId ? { advisorId } : {}),
    };

    const overdue = await prisma.leadFollowUp.findMany({
      where: {
        ...whereBase,
        scheduledAt: { lt: startOfToday },
      },
      include: {
        lead: { select: { id: true, name: true, phone: true, category: true, priority: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const dueToday = await prisma.leadFollowUp.findMany({
      where: {
        ...whereBase,
        scheduledAt: { gte: startOfToday, lte: endOfToday },
      },
      include: {
        lead: { select: { id: true, name: true, phone: true, category: true, priority: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const upcoming = await prisma.leadFollowUp.findMany({
      where: {
        ...whereBase,
        scheduledAt: { gt: endOfToday },
      },
      include: {
        lead: { select: { id: true, name: true, phone: true, category: true, priority: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    });

    return {
      overdue,
      dueToday,
      upcoming,
      overdueCount: overdue.length,
      dueTodayCount: dueToday.length,
    };
  }

  // ─── Calls Management ─────────────────────────────────────────────

  /**
   * Log an interaction call
   */
  static async logCall(leadId, advisorId, callData) {
    const { durationSeconds = 0, outcome = 'CONNECTED', notes = '', recordingUrl = null } = callData;

    const call = await prisma.leadCall.create({
      data: {
        leadId,
        advisorId: advisorId || (await this.getRandomAdvisorId()),
        durationSeconds: parseInt(durationSeconds, 10) || 0,
        outcome,
        notes,
        recordingUrl,
      },
    });

    const mins = Math.floor(call.durationSeconds / 60);
    const secs = call.durationSeconds % 60;
    const durationText = `${mins}m ${secs}s`;

    await prisma.leadActivity.create({
      data: {
        leadId,
        advisorId: call.advisorId,
        type: 'CALL',
        description: `Phone call (${outcome}) lasting ${durationText}. Notes: ${notes || 'None'}`,
      },
    });

    return call;
  }

  // ─── Meetings Management ──────────────────────────────────────────

  /**
   * Schedule a video/consultation meeting
   */
  static async scheduleMeeting(leadId, advisorId, meetingData) {
    const {
      title,
      scheduledAt,
      durationMinutes = 30,
      agenda = '',
      meetingLink = null,
    } = meetingData;

    // Generate smart virtual meeting link if none provided
    const cleanAdvisor = advisorId || (await this.getRandomAdvisorId());
    const generatedLink = meetingLink || `https://meet.policysphere.com/advisor-${cleanAdvisor.slice(-6)}-lead-${leadId.slice(-6)}`;

    const meeting = await prisma.leadMeeting.create({
      data: {
        leadId,
        advisorId: cleanAdvisor,
        title,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: parseInt(durationMinutes, 10) || 30,
        meetingLink: generatedLink,
        agenda,
        status: 'SCHEDULED',
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId,
        advisorId: cleanAdvisor,
        type: 'MEETING',
        description: `Video Consultation scheduled: "${title}" on ${new Date(scheduledAt).toLocaleString('en-IN')}. Link: ${generatedLink}`,
      },
    });

    return meeting;
  }

  /**
   * Update meeting status (e.g. COMPLETED, NO_SHOW, CANCELLED)
   */
  static async updateMeetingStatus(meetingId, status, outcomeNotes = '') {
    const meeting = await prisma.leadMeeting.update({
      where: { id: meetingId },
      data: {
        status,
        outcomeNotes: outcomeNotes || undefined,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: meeting.leadId,
        advisorId: meeting.advisorId,
        type: 'MEETING',
        description: `Meeting status updated to ${status}. ${outcomeNotes ? `Notes: ${outcomeNotes}` : ''}`,
      },
    });

    return meeting;
  }

  // ─── Email Tracking & Templates ───────────────────────────────────

  /**
   * Get available insurance email templates
   */
  static getEmailTemplates() {
    return Object.entries(EMAIL_TEMPLATES).map(([key, t]) => ({
      key,
      name: t.name,
      subject: t.subject,
      body: t.body,
    }));
  }

  /**
   * Dispatch and track lead email
   */
  static async sendLeadEmail(leadId, advisorId, { templateKey, customSubject, customBody, recipientEmail }) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { advisor: true },
    });
    if (!lead) throw new Error('Lead not found');

    const advisor = lead.advisor || (await prisma.user.findFirst({ where: { role: 'ADVISOR' } }));
    const advisorName = advisor ? `${advisor.firstName} ${advisor.lastName}` : 'PolicySphere Advisor';

    let subject = customSubject;
    let body = customBody;

    if (templateKey && EMAIL_TEMPLATES[templateKey]) {
      const tmpl = EMAIL_TEMPLATES[templateKey];
      const categoryLabel = lead.category.charAt(0) + lead.category.slice(1).toLowerCase();
      const budgetFormatted = lead.estimatedBudget
        ? lead.estimatedBudget.toLocaleString('en-IN')
        : '25,000';

      subject = (customSubject || tmpl.subject)
        .replace(/{{category}}/g, categoryLabel)
        .replace(/{{name}}/g, lead.name)
        .replace(/{{budget}}/g, budgetFormatted)
        .replace(/{{advisorName}}/g, advisorName);

      body = (customBody || tmpl.body)
        .replace(/{{category}}/g, categoryLabel)
        .replace(/{{name}}/g, lead.name)
        .replace(/{{budget}}/g, budgetFormatted)
        .replace(/{{advisorName}}/g, advisorName);
    }

    const emailLog = await prisma.leadEmailLog.create({
      data: {
        leadId,
        advisorId: advisorId || (await this.getRandomAdvisorId()),
        recipientEmail: recipientEmail || lead.email,
        subject: subject || 'PolicySphere Insurance Consultation',
        body: body || 'Hello from PolicySphere.',
        templateName: templateKey || 'CUSTOM',
        status: 'DELIVERED',
        openedAt: new Date(Date.now() + 1000 * 60 * 2), // simulated open
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId,
        advisorId: emailLog.advisorId,
        type: 'EMAIL',
        description: `Email dispatched to ${emailLog.recipientEmail}: "${emailLog.subject}". Status: DELIVERED`,
      },
    });

    return emailLog;
  }

  // ─── Conversion Reports & Sales Analytics ─────────────────────────

  /**
   * Generate comprehensive conversion funnel and sales reports
   */
  static async getConversionReports(advisorId = null, timeRange = '30d') {
    const whereBase = advisorId ? { advisorId } : {};

    const allLeads = await prisma.lead.findMany({
      where: whereBase,
      select: {
        id: true,
        stage: true,
        category: true,
        source: true,
        priority: true,
        estimatedBudget: true,
        advisorId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const totalLeads = allLeads.length;

    // 1. Stage Funnel Counts & Drop-off
    const stageOrder = ['NEW', 'CONTACTED', 'QUOTE_SENT', 'PROPOSAL_IN_PROGRESS', 'CONVERTED', 'LOST'];
    const funnelCounts = {};
    stageOrder.forEach((s) => (funnelCounts[s] = 0));
    allLeads.forEach((l) => {
      funnelCounts[l.stage] = (funnelCounts[l.stage] || 0) + 1;
    });

    const convertedLeads = funnelCounts['CONVERTED'] || 0;
    const overallConversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    // 2. Sales Cycle Velocity (average days to convert)
    const convertedItems = allLeads.filter((l) => l.stage === 'CONVERTED');
    let totalCycleDays = 0;
    convertedItems.forEach((item) => {
      const diffMs = new Date(item.updatedAt) - new Date(item.createdAt);
      const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      totalCycleDays += diffDays;
    });
    const avgCycleDays = convertedItems.length > 0 ? Math.round(totalCycleDays / convertedItems.length) : 5;

    // 3. Lead Source Breakdown & Conversion ROI
    const sourceMap = {};
    allLeads.forEach((l) => {
      const src = l.source || 'CATALOG_INQUIRY';
      if (!sourceMap[src]) {
        sourceMap[src] = { total: 0, converted: 0, totalPipeline: 0 };
      }
      sourceMap[src].total += 1;
      sourceMap[src].totalPipeline += l.estimatedBudget || 0;
      if (l.stage === 'CONVERTED') {
        sourceMap[src].converted += 1;
      }
    });

    const sourceBreakdown = Object.entries(sourceMap).map(([source, stats]) => ({
      source,
      totalLeads: stats.total,
      convertedLeads: stats.converted,
      conversionRate: stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0,
      totalPipeline: stats.totalPipeline,
    }));

    // 4. Category Pipeline & Revenue
    const categoryMap = {};
    ['HEALTH', 'LIFE', 'MOTOR', 'TRAVEL', 'HOME'].forEach((c) => {
      categoryMap[c] = { totalLeads: 0, convertedLeads: 0, pipelineValue: 0, wonRevenue: 0 };
    });
    allLeads.forEach((l) => {
      if (!categoryMap[l.category]) {
        categoryMap[l.category] = { totalLeads: 0, convertedLeads: 0, pipelineValue: 0, wonRevenue: 0 };
      }
      categoryMap[l.category].totalLeads += 1;
      categoryMap[l.category].pipelineValue += l.estimatedBudget || 0;
      if (l.stage === 'CONVERTED') {
        categoryMap[l.category].convertedLeads += 1;
        categoryMap[l.category].wonRevenue += l.estimatedBudget || 0;
      }
    });

    // 5. Total Pipeline Value
    const totalPipelineValue = allLeads.reduce((sum, l) => sum + (l.estimatedBudget || 0), 0);
    const totalWonRevenue = convertedItems.reduce((sum, l) => sum + (l.estimatedBudget || 0), 0);

    // 6. Advisor Team Leaderboard
    const advisors = await prisma.user.findMany({
      where: { role: 'ADVISOR', isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        commissions: { select: { commissionAmount: true, status: true } },
      },
    });

    const leaderboard = await Promise.all(
      advisors.map(async (adv) => {
        const advLeads = allLeads.filter((l) => l.advisorId === adv.id);
        const advConverted = advLeads.filter((l) => l.stage === 'CONVERTED').length;
        const advTotal = advLeads.length;
        const advRate = advTotal > 0 ? Math.round((advConverted / advTotal) * 100) : 0;
        const totalCommissionEarned = (adv.commissions || []).reduce((sum, c) => sum + c.commissionAmount, 0);

        return {
          advisorId: adv.id,
          name: `${adv.firstName} ${adv.lastName}`,
          email: adv.email,
          totalLeads: advTotal,
          convertedLeads: advConverted,
          conversionRate: advRate,
          totalCommissionEarned,
        };
      })
    );

    leaderboard.sort((a, b) => b.convertedLeads - a.convertedLeads || b.totalCommissionEarned - a.totalCommissionEarned);

    return {
      totalLeads,
      convertedLeads,
      overallConversionRate,
      avgCycleDays,
      totalPipelineValue,
      totalWonRevenue,
      funnel: {
        stages: stageOrder.map((stage) => ({
          stage,
          count: funnelCounts[stage] || 0,
          percentage: totalLeads > 0 ? Math.round(((funnelCounts[stage] || 0) / totalLeads) * 100) : 0,
        })),
      },
      sourceBreakdown,
      categoryPipeline: Object.entries(categoryMap).map(([category, stats]) => ({
        category,
        ...stats,
      })),
      leaderboard,
    };
  }

  /**
   * Export leads in standard CSV format
   */
  static async exportLeadsCSV(advisorId = null, filters = {}) {
    const leads = await this.getAdvisorLeads(advisorId, filters);

    const headers = [
      'Lead ID',
      'Customer Name',
      'Email',
      'Phone',
      'Insurance Category',
      'Sales Stage',
      'Priority',
      'Lead Score',
      'Source',
      'Customer Sentiment',
      'Estimated Budget (INR)',
      'Assigned Advisor',
      'Created Date',
    ];

    const rows = leads.map((l) => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      l.email,
      l.phone,
      l.category,
      l.stage,
      l.priority,
      l.leadScore,
      l.source,
      l.sentiment,
      l.estimatedBudget || 0,
      l.advisor ? `"${l.advisor.firstName} ${l.advisor.lastName}"` : 'Unassigned',
      new Date(l.createdAt).toISOString().split('T')[0],
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csvContent;
  }

  // ─── Helper Functions & Demo Seeder ───────────────────────────────

  /**
   * Helper: Get first available advisor or create fallback
   */
  static async getRandomAdvisorId() {
    const advisor = await prisma.user.findFirst({ where: { role: 'ADVISOR' } });
    return advisor ? advisor.id : null;
  }

  /**
   * Helper: Seed realistic demo leads if database has none
   */
  static async seedDemoLeads(advisorId) {
    const targetAdvisorId = advisorId || (await this.getRandomAdvisorId());

    const demoLeads = [
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        phone: '+91 98765 43210',
        category: 'HEALTH',
        estimatedBudget: 35000,
        stage: 'NEW',
        source: 'CATALOG_INQUIRY',
        priority: 'HOT',
        sentiment: 'READY_TO_BUY',
        notes: 'Inquired about Family Health Shield for spouse and child. Wants cashless network hospitals in Bangalore.',
      },
      {
        name: 'Priya Verma',
        email: 'priya.v@example.com',
        phone: '+91 98123 76543',
        category: 'LIFE',
        estimatedBudget: 50000,
        stage: 'CONTACTED',
        source: 'SMART_ADVISOR',
        priority: 'HOT',
        sentiment: 'INTERESTED',
        notes: 'Needs ₹1 Crore Pure Term plan with accidental death rider.',
      },
      {
        name: 'Vikram Patel',
        email: 'vikram.patel@example.com',
        phone: '+91 97654 32109',
        category: 'MOTOR',
        estimatedBudget: 18000,
        stage: 'QUOTE_SENT',
        source: 'LANDING_PAGE',
        priority: 'WARM',
        sentiment: 'PRICE_SENSITIVE',
        notes: 'Shared Zero-Dep car insurance quote for new Hyundai Creta SUV.',
      },
      {
        name: 'Ananya Roy',
        email: 'ananya.roy@example.com',
        phone: '+91 99887 76655',
        category: 'TRAVEL',
        estimatedBudget: 12000,
        stage: 'CONVERTED',
        source: 'REFERRAL',
        priority: 'WARM',
        sentiment: 'READY_TO_BUY',
        notes: 'Policy issued for 21-day European vacation. Happy with instant PDF certificate.',
      },
      {
        name: 'Amitabh Sen',
        email: 'amitabh.sen@example.com',
        phone: '+91 98234 56789',
        category: 'HOME',
        estimatedBudget: 15000,
        stage: 'PROPOSAL_IN_PROGRESS',
        source: 'MANUAL',
        priority: 'WARM',
        sentiment: 'INTERESTED',
        notes: 'Property insurance for 3BHK apartment covering structure and contents against fire & earthquake.',
      },
    ];

    for (const lead of demoLeads) {
      await this.createLead({ ...lead, advisorId: targetAdvisorId });
    }

    return prisma.lead.findMany({
      where: targetAdvisorId ? { advisorId: targetAdvisorId } : {},
      include: {
        advisor: { select: { id: true, firstName: true, lastName: true, email: true } },
        activities: { orderBy: { createdAt: 'desc' } },
        followUps: true,
        calls: true,
        meetings: true,
        emailLogs: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Commission summary
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
}

module.exports = CRMService;
