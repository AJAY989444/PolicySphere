const prisma = require('../config/db');

class SupportService {
  /**
   * SLA Thresholds in hours
   */
  static SLA_CONFIG = {
    URGENT: { frtHours: 1, resolutionHours: 4 },
    HIGH: { frtHours: 4, resolutionHours: 12 },
    MEDIUM: { frtHours: 8, resolutionHours: 24 },
    LOW: { frtHours: 24, resolutionHours: 48 },
  };

  /**
   * Calculate dynamic SLA deadlines based on ticket priority
   */
  static calculateSlaDeadlines(priority = 'MEDIUM', fromDate = new Date()) {
    const config = this.SLA_CONFIG[priority] || this.SLA_CONFIG.MEDIUM;
    const nowMs = fromDate.getTime();

    const slaFirstResponseDue = new Date(nowMs + config.frtHours * 60 * 60 * 1000);
    const slaResolutionDue = new Date(nowMs + config.resolutionHours * 60 * 60 * 1000);

    return { slaFirstResponseDue, slaResolutionDue };
  }

  /**
   * Auto-assign ticket to an active Advisor or Admin with the lowest open ticket count
   */
  static async autoAssignAgent() {
    try {
      const activeAgents = await prisma.user.findMany({
        where: {
          role: { in: ['ADVISOR', 'ADMIN'] },
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          _count: {
            select: {
              supportTicketsAssigned: {
                where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER'] } },
              },
            },
          },
        },
      });

      if (!activeAgents || activeAgents.length === 0) return null;

      // Pick agent with lowest active ticket workload
      activeAgents.sort(
        (a, b) => a._count.supportTicketsAssigned - b._count.supportTicketsAssigned
      );

      return activeAgents[0].id;
    } catch (err) {
      console.error('Error auto-assigning support agent:', err);
      return null;
    }
  }

  /**
   * Create new support ticket from Customer, Portal, Chat, WhatsApp, or Email
   */
  static async createTicket({
    userId,
    category = 'GENERAL',
    priority = 'MEDIUM',
    channel = 'PORTAL',
    subject,
    description,
    relatedPolicyId = null,
    relatedClaimId = null,
    tags = [],
    attachments = [],
  }) {
    if (!userId) throw new Error('User ID is required to create a support ticket.');
    if (!subject || !subject.trim()) throw new Error('Ticket subject is required.');
    if (!description || !description.trim()) throw new Error('Ticket description is required.');

    const cleanSubject = subject.trim();
    const cleanDesc = description.trim();

    // Generate unique sequential ticket code
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TCK-${dateStr}-${randomSuffix}`;

    // SLA deadlines
    const { slaFirstResponseDue, slaResolutionDue } = this.calculateSlaDeadlines(priority);

    // Auto-assign to frontline support agent
    const assignedToId = await this.autoAssignAgent();

    // AI Deflection: Find relevant Knowledge Base articles
    const suggestedArticles = await this.findDeflectionArticles(cleanSubject, cleanDesc, category);

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId,
        assignedToId,
        category,
        priority,
        status: 'OPEN',
        channel,
        subject: cleanSubject,
        description: cleanDesc,
        relatedPolicyId: relatedPolicyId || null,
        relatedClaimId: relatedClaimId || null,
        slaFirstResponseDue,
        slaResolutionDue,
        escalationTier: 'TIER_1_AGENT',
        tags: Array.isArray(tags) ? tags : [],
        messages: {
          create: {
            senderId: userId,
            senderType: 'CUSTOMER',
            isInternalNote: false,
            message: cleanDesc,
            attachments: Array.isArray(attachments) ? attachments : [],
          },
        },
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    return {
      ticket,
      suggestedArticles,
    };
  }

  /**
   * AI Deflection Article Matcher
   */
  static async findDeflectionArticles(subject, description, category) {
    try {
      const text = `${subject} ${description}`.toLowerCase();
      const keywords = text
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3);

      const articles = await prisma.knowledgeArticle.findMany({
        where: {
          isPublished: true,
          OR: [
            { category },
            ...keywords.slice(0, 5).map((kw) => ({
              OR: [
                { title: { contains: kw, mode: 'insensitive' } },
                { summary: { contains: kw, mode: 'insensitive' } },
              ],
            })),
          ],
        },
        take: 3,
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          category: true,
          helpfulCount: true,
        },
      });

      return articles;
    } catch (err) {
      console.error('Error finding deflection articles:', err);
      return [];
    }
  }

  /**
   * Get tickets for a specific customer
   */
  static async getCustomerTickets(userId, filters = {}) {
    const { status, category } = filters;
    const where = { userId };

    if (status && status !== 'ALL') where.status = status;
    if (category && category !== 'ALL') where.category = category;

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { messages: true } },
      },
    });

    const now = new Date();
    return tickets.map((t) => {
      const isBreached = t.slaBreached || (t.status !== 'RESOLVED' && t.status !== 'CLOSED' && now > t.slaResolutionDue);
      const remainingMinutes = Math.round((new Date(t.slaResolutionDue).getTime() - now.getTime()) / 60000);

      return {
        ...t,
        isBreached,
        remainingMinutes,
      };
    });
  }

  /**
   * Get single ticket details with messages & security visibility rules
   */
  static async getTicketDetails(ticketId, user) {
    const isStaff = user.role === 'ADVISOR' || user.role === 'ADMIN';

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        messages: {
          where: isStaff ? {} : { isInternalNote: false },
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
        },
        escalationLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) throw new Error('Support ticket not found.');

    // Customers can only view their own tickets
    if (!isStaff && ticket.userId !== user.id) {
      throw new Error('Unauthorized to view this ticket.');
    }

    const now = new Date();
    const isBreached =
      ticket.slaBreached ||
      (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && now > ticket.slaResolutionDue);
    const remainingResolutionMinutes = Math.round(
      (new Date(ticket.slaResolutionDue).getTime() - now.getTime()) / 60000
    );

    return {
      ...ticket,
      isBreached,
      remainingResolutionMinutes,
    };
  }

  /**
   * Add message or internal staff note to a ticket
   */
  static async addTicketMessage(ticketId, user, { message, attachments = [], isInternalNote = false }) {
    if (!message || !message.trim()) throw new Error('Message content cannot be empty.');

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error('Support ticket not found.');

    const isStaff = user.role === 'ADVISOR' || user.role === 'ADMIN';
    if (!isStaff && ticket.userId !== user.id) {
      throw new Error('Unauthorized to post messages on this ticket.');
    }

    // Customers cannot post internal notes
    const finalInternalNote = isStaff ? Boolean(isInternalNote) : false;
    const senderType = isStaff ? 'AGENT' : 'CUSTOMER';

    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: user.id,
        senderType,
        isInternalNote: finalInternalNote,
        message: message.trim(),
        attachments: Array.isArray(attachments) ? attachments : [],
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    // Update ticket timestamps and status flow
    const updateData = { updatedAt: new Date() };

    // If first response by an agent
    if (isStaff && !finalInternalNote && !ticket.firstResponseAt) {
      updateData.firstResponseAt = new Date();
    }

    // Status auto-transitions
    if (isStaff && !finalInternalNote && ticket.status === 'OPEN') {
      updateData.status = 'IN_PROGRESS';
    } else if (!isStaff && ticket.status === 'WAITING_ON_CUSTOMER') {
      updateData.status = 'IN_PROGRESS';
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    return { message: newMessage, ticket: updatedTicket };
  }

  /**
   * Rate customer satisfaction (CSAT) for a resolved ticket
   */
  static async rateTicketCSAT(ticketId, userId, { rating, feedback = '' }) {
    const starRating = parseInt(rating, 10);
    if (isNaN(starRating) || starRating < 1 || starRating > 5) {
      throw new Error('CSAT rating must be an integer between 1 and 5 stars.');
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error('Support ticket not found.');
    if (ticket.userId !== userId) throw new Error('Only the ticket owner can rate satisfaction.');
    if (ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED') {
      throw new Error('CSAT rating can only be provided for resolved or closed tickets.');
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        csatRating: starRating,
        csatFeedback: feedback ? feedback.trim() : null,
      },
    });

    return updated;
  }

  /**
   * Staff Helpdesk: Fetch all tickets with SLA indicators, tier filters, and search
   */
  static async getStaffTickets(filters = {}) {
    const { status, priority, category, channel, escalationTier, assignedToId, slaFilter, search } =
      filters;
    const where = {};

    if (status && status !== 'ALL') where.status = status;
    if (priority && priority !== 'ALL') where.priority = priority;
    if (category && category !== 'ALL') where.category = category;
    if (channel && channel !== 'ALL') where.channel = channel;
    if (escalationTier && escalationTier !== 'ALL') where.escalationTier = escalationTier;
    if (assignedToId && assignedToId !== 'ALL') where.assignedToId = assignedToId;

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { ticketNumber: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { user: { firstName: { contains: q, mode: 'insensitive' } } },
        { user: { lastName: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { messages: true } },
      },
    });

    const now = new Date();
    const enriched = tickets.map((t) => {
      const isBreached =
        t.slaBreached ||
        (t.status !== 'RESOLVED' && t.status !== 'CLOSED' && now > t.slaResolutionDue);
      const remainingMs = new Date(t.slaResolutionDue).getTime() - now.getTime();
      const remainingMinutes = Math.round(remainingMs / 60000);

      let slaState = 'ON_TRACK';
      if (isBreached) {
        slaState = 'BREACHED';
      } else if (remainingMinutes <= 120 && t.status !== 'RESOLVED' && t.status !== 'CLOSED') {
        slaState = 'AT_RISK';
      }

      return {
        ...t,
        slaState,
        isBreached,
        remainingMinutes,
      };
    });

    if (slaFilter && slaFilter !== 'ALL') {
      return enriched.filter((t) => t.slaState === slaFilter);
    }

    return enriched;
  }

  /**
   * Staff action: Update ticket status (e.g. OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED)
   */
  static async updateTicketStatus(ticketId, status, actorId, note = '') {
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error('Support ticket not found.');

    const updateData = { status, updatedAt: new Date() };
    if (status === 'RESOLVED' && !ticket.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    // Create system note in ticket message
    await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: actorId,
        senderType: 'AGENT',
        isInternalNote: false,
        message: `[STATUS UPDATE] Ticket status changed from ${ticket.status} to ${status}.${
          note ? ` Note: ${note}` : ''
        }`,
      },
    });

    return updated;
  }

  /**
   * Staff action: Escalate ticket to higher tier (Tier 1 -> Tier 2 -> Tier 3)
   */
  static async escalateTicket(ticketId, { toTier, reason, actorId }) {
    const validTiers = ['TIER_1_AGENT', 'TIER_2_SPECIALIST', 'TIER_3_MANAGEMENT'];
    if (!validTiers.includes(toTier)) {
      throw new Error(`Invalid escalation tier. Must be one of: ${validTiers.join(', ')}`);
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error('Support ticket not found.');

    const fromTier = ticket.escalationTier;

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        escalationTier: toTier,
        escalationReason: reason || 'Manual escalation by support staff',
        updatedAt: new Date(),
      },
    });

    // Log escalation entry
    await prisma.ticketEscalationLog.create({
      data: {
        ticketId,
        fromTier,
        toTier,
        reason: reason || 'Escalated for senior review',
        escalatedById: actorId,
      },
    });

    // Post internal note in message history
    await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: actorId,
        senderType: 'AGENT',
        isInternalNote: true,
        message: `[ESCALATION] Escalated from ${fromTier} to ${toTier}. Reason: ${
          reason || 'Senior intervention requested'
        }`,
      },
    });

    return updated;
  }

  /**
   * Staff action: Reassign ticket to another agent
   */
  static async reassignTicket(ticketId, newAgentId, actorId, reason = '') {
    const agent = await prisma.user.findUnique({
      where: { id: newAgentId },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!agent) throw new Error('Target agent not found.');

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { assignedTo: true },
    });
    if (!ticket) throw new Error('Support ticket not found.');

    const prevName = ticket.assignedTo
      ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
      : 'Unassigned';
    const newName = `${agent.firstName} ${agent.lastName}`;

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedToId: newAgentId, updatedAt: new Date() },
      include: { assignedTo: true },
    });

    await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: actorId,
        senderType: 'AGENT',
        isInternalNote: true,
        message: `[REASSIGNMENT] Reassigned from ${prevName} to ${newName}.${
          reason ? ` Reason: ${reason}` : ''
        }`,
      },
    });

    return updated;
  }

  /**
   * Automated SLA Breach Sweeper: Detects overdue tickets, marks breach, and escalates
   */
  static async checkAndEscalateSLABreaches() {
    const now = new Date();

    const overdueTickets = await prisma.supportTicket.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CUSTOMER'] },
        slaResolutionDue: { lt: now },
        slaBreached: false,
      },
    });

    const results = [];

    for (const ticket of overdueTickets) {
      let nextTier = 'TIER_2_SPECIALIST';
      if (ticket.escalationTier === 'TIER_2_SPECIALIST') {
        nextTier = 'TIER_3_MANAGEMENT';
      } else if (ticket.escalationTier === 'TIER_3_MANAGEMENT') {
        nextTier = 'TIER_3_MANAGEMENT';
      }

      const updated = await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: {
          slaBreached: true,
          escalationTier: nextTier,
          escalationReason: 'Automated SLA resolution deadline breach',
          updatedAt: now,
        },
      });

      await prisma.ticketEscalationLog.create({
        data: {
          ticketId: ticket.id,
          fromTier: ticket.escalationTier,
          toTier: nextTier,
          reason: 'Automated system escalation due to resolution SLA timeout.',
          escalatedById: null,
        },
      });

      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderType: 'SYSTEM_AI',
          isInternalNote: true,
          message: `[SLA BREACH ALERT] Ticket resolution SLA breached (${new Date(
            ticket.slaResolutionDue
          ).toLocaleString()}). Escalated to ${nextTier}.`,
        },
      });

      results.push(updated);
    }

    return results;
  }

  /**
   * ─── Knowledge Base Services ─────────────────────────────────
   */

  /**
   * Search knowledge base with query and category filters
   */
  static async searchKnowledgeBase({ query, category, limit = 20 }) {
    const where = { isPublished: true };

    const validCategories = [
      'POLICY_INQUIRY',
      'CLAIM_ASSISTANCE',
      'PAYMENT_BILLING',
      'KYC_VERIFICATION',
      'CANCELLATION_REFUND',
      'TECHNICAL_SUPPORT',
      'GENERAL',
    ];

    if (category && category !== 'ALL' && validCategories.includes(category)) {
      where.category = category;
    }

    if (query && query.trim()) {
      const q = query.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
    }

    const articles = await prisma.knowledgeArticle.findMany({
      where,
      take: limit,
      orderBy: [{ helpfulCount: 'desc' }, { viewCount: 'desc' }],
    });

    return articles;
  }

  /**
   * Fetch single knowledge base article by slug and increment views
   */
  static async getKnowledgeArticleBySlug(slug) {
    const article = await prisma.knowledgeArticle.findUnique({
      where: { slug },
    });

    if (!article || !article.isPublished) {
      throw new Error('Knowledge article not found.');
    }

    // Increment view count
    await prisma.knowledgeArticle.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });

    return article;
  }

  // In-memory ledger of article votes: slug -> Map<voterId, boolean>
  static articleVoters = new Map();

  /**
   * Helpfulness voting on Knowledge Article (Thumbs Up / Down)
   * Prevents repeated voting from the same user/ID and supports vote switching
   */
  static async voteKnowledgeArticle(slug, isHelpful, voterId = 'anonymous') {
    const article = await prisma.knowledgeArticle.findUnique({ where: { slug } });
    if (!article) throw new Error('Knowledge article not found.');

    if (!this.articleVoters.has(slug)) {
      this.articleVoters.set(slug, new Map());
    }

    const voters = this.articleVoters.get(slug);
    const prevVote = voters.get(voterId);

    // If already cast the identical vote, reject duplicate increment
    if (prevVote === isHelpful) {
      return { article, alreadyVoted: true, currentVote: isHelpful };
    }

    let updateData = {};
    if (prevVote === undefined) {
      // First vote from this ID
      updateData = isHelpful
        ? { helpfulCount: { increment: 1 } }
        : { notHelpfulCount: { increment: 1 } };
    } else {
      // Switching vote from No to Yes or Yes to No
      if (isHelpful) {
        updateData = {
          helpfulCount: { increment: 1 },
          notHelpfulCount: { decrement: article.notHelpfulCount > 0 ? 1 : 0 },
        };
      } else {
        updateData = {
          helpfulCount: { decrement: article.helpfulCount > 0 ? 1 : 0 },
          notHelpfulCount: { increment: 1 },
        };
      }
    }

    voters.set(voterId, isHelpful);

    const updated = await prisma.knowledgeArticle.update({
      where: { slug },
      data: updateData,
    });

    return { article: updated, alreadyVoted: false, currentVote: isHelpful };
  }

  /**
   * ─── Multi-Channel Simulators: Live Chat, WhatsApp, Voice ───
   */

  /**
   * Start Live Chat with SphereSupport AI
   */
  static async startLiveChat({ userId = null, customerName, customerEmail, category = 'GENERAL', initialMessage }) {
    if (!customerName || !customerEmail) {
      throw new Error('Customer name and email are required to start a chat session.');
    }

    const sessionRef = `CHAT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const initialText = initialMessage ? initialMessage.trim() : 'Hello! I need assistance with my insurance policy.';

    // Generate intelligent first response from SphereSupport AI
    const aiResponse = this.generateAiChatResponse(initialText, category);

    const messages = [
      {
        id: 'msg-1',
        sender: 'CUSTOMER',
        name: customerName,
        text: initialText,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'msg-2',
        sender: 'AI',
        name: 'SphereSupport AI',
        text: aiResponse,
        timestamp: new Date().toISOString(),
      },
    ];

    const session = await prisma.liveChatSession.create({
      data: {
        sessionRef,
        userId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        category,
        status: 'ACTIVE',
        messages,
      },
    });

    return session;
  }

  /**
   * Post message in active chat session
   */
  static async sendLiveChatMessage(sessionRef, { sender = 'CUSTOMER', text, customerName }) {
    const session = await prisma.liveChatSession.findUnique({ where: { sessionRef } });
    if (!session) throw new Error('Chat session not found.');

    const currentMessages = Array.isArray(session.messages) ? session.messages : [];
    const newMsg = {
      id: `msg-${currentMessages.length + 1}`,
      sender,
      name: sender === 'CUSTOMER' ? customerName || session.customerName : 'SphereSupport AI',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    currentMessages.push(newMsg);

    // If customer typed, auto-generate AI reply
    if (sender === 'CUSTOMER') {
      const lower = text.toLowerCase();

      // Check if user wants a human agent or ticket
      if (lower.includes('human') || lower.includes('agent') || lower.includes('ticket') || lower.includes('escalate')) {
        currentMessages.push({
          id: `msg-${currentMessages.length + 1}`,
          sender: 'AI',
          name: 'SphereSupport AI',
          text: `I understand your request requires specialized human assistance. I have registered an official priority ticket for our support desk. A senior insurance specialist will contact you shortly!`,
          timestamp: new Date().toISOString(),
        });

        // Convert to ticket if not already converted
        if (!session.ticketId && session.userId) {
          const newTicketResult = await this.createTicket({
            userId: session.userId,
            category: session.category,
            priority: 'HIGH',
            channel: 'LIVE_CHAT',
            subject: `Chat Inquiry: ${text.slice(0, 60)}...`,
            description: `Auto-generated from Live Chat Session ${sessionRef}:\n\n${currentMessages
              .map((m) => `${m.name} (${m.sender}): ${m.text}`)
              .join('\n')}`,
          });

          const updatedSession = await prisma.liveChatSession.update({
            where: { sessionRef },
            data: {
              status: 'TRANSFERRED_TO_TICKET',
              ticketId: newTicketResult.ticket.id,
              messages: currentMessages,
            },
          });

          return { session: updatedSession, newTicket: newTicketResult.ticket, messages: currentMessages };
        }
      } else {
        const aiReply = this.generateAiChatResponse(text, session.category);
        currentMessages.push({
          id: `msg-${currentMessages.length + 1}`,
          sender: 'AI',
          name: 'SphereSupport AI',
          text: aiReply,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const updated = await prisma.liveChatSession.update({
      where: { sessionRef },
      data: { messages: currentMessages, updatedAt: new Date() },
    });

    return { session: updated, messages: currentMessages };
  }

  /**
   * SphereSupport AI Response Knowledge Engine
   */
  static generateAiChatResponse(text, category) {
    const q = text.toLowerCase();

    if (q.includes('claim') || q.includes('reimburse') || q.includes('hospital')) {
      return `For cashless claims, present your PolicySphere Digital Health Card at any network hospital desk. For reimbursement claims, submit the discharge summary and original hospital invoices in the Claims portal within 30 days. Would you like to file a new claim or check claim status?`;
    }
    if (q.includes('tax') || q.includes('80d') || q.includes('certificate')) {
      return `Health insurance premiums qualify for tax deductions under Section 80D up to ₹25,000 for self/family and ₹50,000 for senior parents. You can download your official 80D Tax Exemption Certificate anytime from the Billing & Invoices section!`;
    }
    if (q.includes('renew') || q.includes('expiry') || q.includes('grace')) {
      return `PolicySphere offers instant 1-click renewal with 0% penalty during your 30-day grace period, preserving your accrued No Claim Bonus (NCB). Shall I direct you to the renewal portal?`;
    }
    if (q.includes('cancel') || q.includes('refund')) {
      return `All retail policies come with a mandatory 15 to 30-day Free-Look Period under IRDAI regulations. Cancellations within this period receive a 100% premium refund minus stamp duty and proportionate risk cover.`;
    }
    if (q.includes('kyc') || q.includes('aadhaar') || q.includes('pan')) {
      return `Mandatory C-KYC verification requires a valid Aadhaar or PAN copy. You can complete automated AI-assisted verification in under 60 seconds from your Profile Settings.`;
    }

    return `Hello! I am SphereSupport AI. I can assist you with cashless hospital networks, claims processing, 80D tax receipts, policy renewals, or dispute resolution. How can I help you today? (Type "talk to agent" if you prefer a human specialist).`;
  }

  /**
   * Request Phone Voice Callback
   */
  static async requestVoiceCallback({ userId = null, customerName, phone, preferredTime, category = 'GENERAL', notes = '' }) {
    if (!customerName || !phone) throw new Error('Customer name and phone number are required.');

    const callback = await prisma.voiceCallbackRequest.create({
      data: {
        userId,
        customerName: customerName.trim(),
        phone: phone.trim(),
        preferredTime: preferredTime || 'Within 30 Minutes',
        category,
        status: 'REQUESTED',
        notes: notes ? notes.trim() : null,
      },
    });

    return callback;
  }

  /**
   * Fetch callback queue for staff
   */
  static async getVoiceCallbacks(statusFilter = 'ALL') {
    const where = {};
    if (statusFilter && statusFilter !== 'ALL') where.status = statusFilter;

    return prisma.voiceCallbackRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update callback status
   */
  static async updateVoiceCallbackStatus(callbackId, status, notes = '') {
    return prisma.voiceCallbackRequest.update({
      where: { id: callbackId },
      data: {
        status,
        notes: notes || undefined,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * WhatsApp Simulator: Simulate incoming WhatsApp inquiry
   */
  static async simulateWhatsAppInquiry({ userId, customerName, phone, message, category = 'GENERAL' }) {
    const cleanMsg = message ? message.trim() : 'Hi, I need assistance with my PolicySphere coverage.';
    const ticketResult = await this.createTicket({
      userId,
      category,
      priority: 'MEDIUM',
      channel: 'WHATSAPP',
      subject: `WhatsApp Inquiry from ${customerName} (${phone})`,
      description: cleanMsg,
    });

    return {
      success: true,
      channel: 'WHATSAPP',
      ticket: ticketResult.ticket,
      autoReply: `PolicySphere Support (Official): Hi ${customerName}, your ticket ${ticketResult.ticket.ticketNumber} has been logged under IRDAI guidelines. An advisor will message you here shortly.`,
    };
  }

  /**
   * ─── Support Analytics & SLA Performance ─────────────────────
   */
  static async getSupportAnalytics() {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      breachedTickets,
      ratedTickets,
      allTicketsList,
      categoriesCount,
      channelsCount,
    ] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.supportTicket.count({ where: { slaBreached: true } }),
      prisma.supportTicket.findMany({
        where: { csatRating: { not: null } },
        select: { csatRating: true },
      }),
      prisma.supportTicket.findMany({
        select: {
          id: true,
          createdAt: true,
          firstResponseAt: true,
          resolvedAt: true,
          slaBreached: true,
        },
      }),
      prisma.supportTicket.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
      prisma.supportTicket.groupBy({
        by: ['channel'],
        _count: { id: true },
      }),
    ]);

    // Average CSAT
    const avgCsat =
      ratedTickets.length > 0
        ? Number((ratedTickets.reduce((sum, t) => sum + t.csatRating, 0) / ratedTickets.length).toFixed(1))
        : 4.8;

    // SLA Compliance Rate
    const slaComplianceRate =
      totalTickets > 0 ? Number((((totalTickets - breachedTickets) / totalTickets) * 100).toFixed(1)) : 100;

    // First Response Time (FRT) in minutes
    const frtTickets = allTicketsList.filter((t) => t.firstResponseAt);
    const avgFrtMinutes =
      frtTickets.length > 0
        ? Math.round(
            frtTickets.reduce(
              (sum, t) => sum + (new Date(t.firstResponseAt).getTime() - new Date(t.createdAt).getTime()) / 60000,
              0
            ) / frtTickets.length
          )
        : 18;

    // Mean Time to Resolution (MTTR) in hours
    const mttrTickets = allTicketsList.filter((t) => t.resolvedAt);
    const avgMttrHours =
      mttrTickets.length > 0
        ? Number(
            (
              mttrTickets.reduce(
                (sum, t) =>
                  sum + (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / (3600 * 1000),
                0
              ) / mttrTickets.length
            ).toFixed(1)
          )
        : 4.2;

    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      breachedTickets,
      slaComplianceRate,
      avgCsat,
      avgFrtMinutes,
      avgMttrHours,
      categoryBreakdown: categoriesCount.map((c) => ({ category: c.category, count: c._count.id })),
      channelBreakdown: channelsCount.map((ch) => ({ channel: ch.channel, count: ch._count.id })),
    };
  }

  /**
   * Pre-seed default Knowledge Base articles if empty
   */
  static async seedDefaultArticles() {
    const count = await prisma.knowledgeArticle.count();
    if (count > 0) return count;

    const defaultArticles = [
      {
        slug: 'cashless-hospitalization-process',
        title: 'How to Avail Cashless Hospitalization at Network Hospitals',
        category: 'CLAIM_ASSISTANCE',
        summary:
          'Step-by-step procedure for emergency and planned cashless admissions across 12,000+ partner hospitals.',
        content: `### Cashless Hospitalization Guide
1. **Locate Network Hospital**: Check the PolicySphere hospital locator for cashless facilities.
2. **Present Health Card**: Show your PolicySphere Digital Card and photo ID at the hospital's TPA / Insurance desk.
3. **Pre-Authorization**: The hospital will submit a pre-authorization request within 2 to 4 hours.
4. **Instant Approval**: Our TPA verifies coverage and issues an initial approval limit.
5. **Discharge**: Settle only non-medical expenses (food, attendant charges). The insurer pays the hospital directly.`,
        tags: ['cashless', 'hospital', 'tpa', 'health', 'admission'],
        helpfulCount: 42,
      },
      {
        slug: 'section-80d-tax-saving-guide',
        title: 'Income Tax Benefits Under Section 80D for Health Insurance',
        category: 'POLICY_INQUIRY',
        summary: 'Understand maximum tax deductions available for self, family, and senior citizen parents.',
        content: `### Section 80D Tax Savings Breakdown
- **Self, Spouse & Children**: Up to ₹25,000 per financial year.
- **Parents (Below 60 yrs)**: Additional ₹25,000 deduction.
- **Senior Citizen Parents (60+ yrs)**: Additional ₹50,000 deduction.
- **Preventive Health Check-ups**: Up to ₹5,000 included within the overall limit.
- **Maximum Combined Deduction**: Up to ₹1,00,000 per financial year for senior citizen families.

Download your Form 80D Tax Certificate directly from your **Billing History** dashboard.`,
        tags: ['tax', '80d', 'deduction', 'health', 'income tax'],
        helpfulCount: 88,
      },
      {
        slug: 'reimbursement-claim-documents-checklist',
        title: 'Checklist of Documents Required for Reimbursement Claims',
        category: 'CLAIM_ASSISTANCE',
        summary:
          'Mandatory bills, discharge summaries, and prescriptions required for swift claim approvals within 7 days.',
        content: `### Reimbursement Claim Checklist
1. Duly signed PolicySphere Claim Form.
2. Original Hospital Discharge Summary with admission and discharge timestamps.
3. Itemized final hospital bill with receipt numbers.
4. Diagnostic test reports (blood tests, MRI, CT scans, X-rays) with doctor recommendations.
5. Medicine purchase bills with pharmacy cash memos and prescriptions.
6. Cancelled cheque for NEFT direct bank transfer.`,
        tags: ['reimbursement', 'bills', 'checklist', 'discharge', 'claim'],
        helpfulCount: 65,
      },
      {
        slug: 'no-claim-bonus-ncb-guide',
        title: 'What is No Claim Bonus (NCB) and How Does it Accumulate?',
        category: 'POLICY_INQUIRY',
        summary:
          'Earn up to 50% discount on motor insurance and 100% sum insured bonus on health policies for claim-free years.',
        content: `### No Claim Bonus Explained
- **Motor Insurance**: NCB gives a discount on your Own Damage (OD) premium ranging from 20% in Year 1 up to 50% after 5 consecutive claim-free years.
- **Health Insurance**: Insurers increase your Sum Insured by 10% to 50% every year without increasing your premium!
- **Portability**: NCB belongs to the policyholder, not the insurer. You can transfer 100% of your accumulated NCB when switching providers.`,
        tags: ['ncb', 'bonus', 'discount', 'motor', 'health'],
        helpfulCount: 37,
      },
      {
        slug: 'free-look-period-and-cancellation-refunds',
        title: 'Free-Look Period Cancellation Policy & Refund Timelines',
        category: 'CANCELLATION_REFUND',
        summary: 'IRDAI mandated 15-day to 30-day review period with 100% premium return guarantees.',
        content: `### Free-Look Period Rules
- Every retail health and life insurance policy includes a mandatory **15-day Free-Look Period** (30 days for policies purchased electronically or online).
- If you are unsatisfied with the policy terms, submit a cancellation request via the Support Center.
- **Refund Calculation**: 100% premium paid minus proportionate risk cover for the days insured and stamp duty.
- Refunds are credited to your original bank account within 3 to 5 business days.`,
        tags: ['free look', 'cancellation', 'refund', 'irdai', 'return'],
        helpfulCount: 51,
      },
      {
        slug: 'c-kyc-mandatory-verification-guide',
        title: 'Central KYC (C-KYC) Verification Requirements for Policy Issuance',
        category: 'KYC_VERIFICATION',
        summary: 'How to complete paperless instant KYC using DigiLocker, Aadhaar OTP, or PAN card.',
        content: `### C-KYC Compliance
As per IRDAI master circular, all insurance buyers must have an updated Central KYC record.
- **Methods**: DigiLocker Instant Fetch, Aadhaar e-KYC (XML with OTP), or PAN card verification.
- **Processing Time**: Instant verification via PolicySphere AI Document Scanner.
- **Validity**: Once verified, your 14-digit C-KYC identifier is valid across all Indian insurers.`,
        tags: ['kyc', 'aadhaar', 'pan', 'digilocker', 'verification'],
        helpfulCount: 29,
      },
    ];

    for (const art of defaultArticles) {
      await prisma.knowledgeArticle.upsert({
        where: { slug: art.slug },
        update: {},
        create: art,
      });
    }

    return defaultArticles.length;
  }
}

module.exports = SupportService;
