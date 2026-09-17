const SupportService = require('../services/support.service');

class SupportController {
  /**
   * Customer: Create support ticket
   * POST /api/support/tickets
   */
  static async createTicket(req, res) {
    try {
      const { category, priority, subject, description, relatedPolicyId, relatedClaimId, tags, attachments } =
        req.body;

      const result = await SupportService.createTicket({
        userId: req.user.id,
        category,
        priority,
        channel: 'PORTAL',
        subject,
        description,
        relatedPolicyId,
        relatedClaimId,
        tags,
        attachments,
      });

      return res.status(201).json({
        success: true,
        ticket: result.ticket,
        suggestedArticles: result.suggestedArticles,
        message: 'Support ticket registered successfully.',
      });
    } catch (err) {
      console.error('Error creating ticket:', err);
      return res.status(400).json({ success: false, error: err.message || 'Failed to register support ticket.' });
    }
  }

  /**
   * Customer: Get my tickets
   * GET /api/support/tickets/my
   */
  static async getMyTickets(req, res) {
    try {
      const { status, category } = req.query;
      const tickets = await SupportService.getCustomerTickets(req.user.id, { status, category });
      return res.json({ success: true, tickets });
    } catch (err) {
      console.error('Error fetching customer tickets:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve support tickets.' });
    }
  }

  /**
   * Customer & Staff: Get ticket details
   * GET /api/support/tickets/:id
   */
  static async getTicketDetails(req, res) {
    try {
      const { id } = req.params;
      const ticket = await SupportService.getTicketDetails(id, req.user);
      return res.json({ success: true, ticket });
    } catch (err) {
      console.error('Error fetching ticket details:', err);
      const isNotFound = err.message === 'Support ticket not found.';
      const isForbidden = err.message.includes('Unauthorized');
      return res.status(isNotFound ? 404 : isForbidden ? 403 : 500).json({
        success: false,
        error: err.message || 'Failed to retrieve ticket details.',
      });
    }
  }

  /**
   * Customer & Staff: Post reply or internal note
   * POST /api/support/tickets/:id/messages
   */
  static async addMessage(req, res) {
    try {
      const { id } = req.params;
      const { message, attachments, isInternalNote } = req.body;

      const result = await SupportService.addTicketMessage(id, req.user, {
        message,
        attachments,
        isInternalNote,
      });

      return res.status(201).json({
        success: true,
        message: result.message,
        ticket: result.ticket,
      });
    } catch (err) {
      console.error('Error posting ticket message:', err);
      return res.status(400).json({ success: false, error: err.message || 'Failed to post message.' });
    }
  }

  /**
   * Customer: Submit CSAT satisfaction rating
   * POST /api/support/tickets/:id/csat
   */
  static async rateCSAT(req, res) {
    try {
      const { id } = req.params;
      const { rating, feedback } = req.body;

      const ticket = await SupportService.rateTicketCSAT(id, req.user.id, { rating, feedback });
      return res.json({ success: true, ticket, message: 'Thank you for your feedback!' });
    } catch (err) {
      console.error('Error submitting CSAT rating:', err);
      return res.status(400).json({ success: false, error: err.message || 'Failed to submit rating.' });
    }
  }

  /**
   * Staff: Get all helpdesk tickets with SLA filters
   * GET /api/support/desk/tickets
   */
  static async getStaffTickets(req, res) {
    try {
      const {
        status,
        priority,
        category,
        channel,
        escalationTier,
        assignedToId,
        slaFilter,
        search,
      } = req.query;

      const tickets = await SupportService.getStaffTickets({
        status,
        priority,
        category,
        channel,
        escalationTier,
        assignedToId,
        slaFilter,
        search,
      });

      return res.json({ success: true, tickets });
    } catch (err) {
      console.error('Error fetching staff tickets:', err);
      return res.status(500).json({ success: false, error: 'Failed to fetch support desk queue.' });
    }
  }

  /**
   * Staff: Update ticket status
   * PATCH /api/support/tickets/:id/status
   */
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      const ticket = await SupportService.updateTicketStatus(id, status, req.user.id, note);
      return res.json({ success: true, ticket, message: `Ticket status changed to ${status}` });
    } catch (err) {
      console.error('Error updating ticket status:', err);
      return res.status(400).json({ success: false, error: err.message || 'Failed to update ticket status.' });
    }
  }

  /**
   * Staff: Escalate ticket tier
   * PATCH /api/support/tickets/:id/escalate
   */
  static async escalateTicket(req, res) {
    try {
      const { id } = req.params;
      const { toTier, reason } = req.body;

      const ticket = await SupportService.escalateTicket(id, {
        toTier,
        reason,
        actorId: req.user.id,
      });

      return res.json({ success: true, ticket, message: `Ticket successfully escalated to ${toTier}` });
    } catch (err) {
      console.error('Error escalating ticket:', err);
      return res.status(400).json({ success: false, error: err.message || 'Failed to escalate ticket.' });
    }
  }

  /**
   * Staff: Reassign ticket
   * PATCH /api/support/tickets/:id/reassign
   */
  static async reassignTicket(req, res) {
    try {
      const { id } = req.params;
      const { newAgentId, reason } = req.body;

      const ticket = await SupportService.reassignTicket(id, newAgentId, req.user.id, reason);
      return res.json({ success: true, ticket, message: 'Ticket reassigned successfully.' });
    } catch (err) {
      console.error('Error reassigning ticket:', err);
      return res.status(400).json({ success: false, error: err.message || 'Failed to reassign ticket.' });
    }
  }

  /**
   * Staff/System: Check and trigger SLA breaches
   * POST /api/support/desk/sla-sweep
   */
  static async checkSlaBreaches(req, res) {
    try {
      const breached = await SupportService.checkAndEscalateSLABreaches();
      return res.json({
        success: true,
        breachedCount: breached.length,
        tickets: breached,
        message: `SLA sweep executed. ${breached.length} tickets flagged/escalated.`,
      });
    } catch (err) {
      console.error('Error checking SLA breaches:', err);
      return res.status(500).json({ success: false, error: 'Failed to execute SLA breach sweep.' });
    }
  }

  /**
   * Staff: Get support metrics and SLA analytics
   * GET /api/support/desk/analytics
   */
  static async getAnalytics(req, res) {
    try {
      const analytics = await SupportService.getSupportAnalytics();
      return res.json({ success: true, analytics });
    } catch (err) {
      console.error('Error fetching support analytics:', err);
      return res.status(500).json({ success: false, error: 'Failed to generate support analytics.' });
    }
  }

  /**
   * Public/Customer: Search Knowledge Base
   * GET /api/support/kb
   */
  static async searchKnowledgeBase(req, res) {
    try {
      // Auto-seed default articles if DB empty
      await SupportService.seedDefaultArticles();

      const { query, category, limit } = req.query;
      const articles = await SupportService.searchKnowledgeBase({
        query,
        category,
        limit: limit ? parseInt(limit, 10) : 20,
      });

      return res.json({ success: true, articles });
    } catch (err) {
      console.error('Error searching knowledge base:', err);
      return res.status(500).json({ success: false, error: 'Failed to search knowledge base.' });
    }
  }

  /**
   * Public/Customer: Get single Knowledge Base article
   * GET /api/support/kb/:slug
   */
  static async getArticleBySlug(req, res) {
    try {
      const { slug } = req.params;
      const article = await SupportService.getKnowledgeArticleBySlug(slug);
      return res.json({ success: true, article });
    } catch (err) {
      console.error('Error fetching knowledge article:', err);
      return res.status(404).json({ success: false, error: 'Knowledge article not found.' });
    }
  }

  /**
   * Public/Customer: Vote on Knowledge Base article
   * POST /api/support/kb/:slug/vote
   */
  static async voteArticle(req, res) {
    try {
      const { slug } = req.params;
      const { isHelpful, voterId } = req.body;
      const effectiveVoterId = req.user?.id || voterId || req.ip || 'anonymous';

      const result = await SupportService.voteKnowledgeArticle(
        slug,
        Boolean(isHelpful),
        effectiveVoterId
      );

      return res.json({
        success: true,
        article: result.article,
        alreadyVoted: result.alreadyVoted,
        currentVote: result.currentVote,
        message: result.alreadyVoted
          ? 'You have already recorded your vote for this guide.'
          : 'Thank you for your feedback!',
      });
    } catch (err) {
      console.error('Error voting on article:', err);
      return res.status(400).json({ success: false, error: 'Failed to record article feedback.' });
    }
  }

  /**
   * Customer/Guest: Start Live Chat session
   * POST /api/support/chat/start
   */
  static async startLiveChat(req, res) {
    try {
      const { customerName, customerEmail, category, initialMessage } = req.body;
      const userId = req.user ? req.user.id : null;

      const session = await SupportService.startLiveChat({
        userId,
        customerName: customerName || (req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Guest User'),
        customerEmail: customerEmail || (req.user ? req.user.email : 'guest@example.com'),
        category,
        initialMessage,
      });

      return res.status(201).json({ success: true, session });
    } catch (err) {
      console.error('Error starting live chat:', err);
      return res.status(400).json({ success: false, error: err.message || 'Failed to initiate live chat.' });
    }
  }

  /**
   * Customer/Guest: Send Live Chat message
   * POST /api/support/chat/:sessionRef/message
   */
  static async sendChatMessage(req, res) {
    try {
      const { sessionRef } = req.params;
      const { text, sender, customerName } = req.body;

      const result = await SupportService.sendLiveChatMessage(sessionRef, {
        sender: sender || 'CUSTOMER',
        text,
        customerName,
      });

      return res.json({ success: true, ...result });
    } catch (err) {
      console.error('Error sending chat message:', err);
      return res.status(400).json({ success: false, error: err.message || 'Failed to send chat message.' });
    }
  }

  /**
   * Customer/Guest: Request Phone Voice Callback
   * POST /api/support/callback
   */
  static async requestVoiceCallback(req, res) {
    try {
      const { customerName, phone, preferredTime, category, notes } = req.body;
      const userId = req.user ? req.user.id : null;

      const callback = await SupportService.requestVoiceCallback({
        userId,
        customerName: customerName || (req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Customer'),
        phone,
        preferredTime,
        category,
        notes,
      });

      return res.status(201).json({
        success: true,
        callback,
        message: 'Your callback request has been scheduled. An advisor will reach out shortly.',
      });
    } catch (err) {
      console.error('Error requesting callback:', err);
      return res.status(400).json({ success: false, error: err.message || 'Failed to schedule callback.' });
    }
  }

  /**
   * Staff: Get callback requests queue
   * GET /api/support/callbacks
   */
  static async getVoiceCallbacks(req, res) {
    try {
      const { status } = req.query;
      const callbacks = await SupportService.getVoiceCallbacks(status);
      return res.json({ success: true, callbacks });
    } catch (err) {
      console.error('Error fetching voice callbacks:', err);
      return res.status(500).json({ success: false, error: 'Failed to retrieve callbacks queue.' });
    }
  }

  /**
   * Staff: Update callback request status
   * PATCH /api/support/callbacks/:id
   */
  static async updateCallbackStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const callback = await SupportService.updateVoiceCallbackStatus(id, status, notes);
      return res.json({ success: true, callback, message: `Callback status updated to ${status}` });
    } catch (err) {
      console.error('Error updating callback status:', err);
      return res.status(400).json({ success: false, error: 'Failed to update callback status.' });
    }
  }

  /**
   * Customer: Simulate incoming WhatsApp inquiry
   * POST /api/support/whatsapp/simulate
   */
  static async simulateWhatsApp(req, res) {
    try {
      const { customerName, phone, message, category } = req.body;
      const userId = req.user ? req.user.id : null;

      const result = await SupportService.simulateWhatsAppInquiry({
        userId,
        customerName: customerName || (req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Policyholder'),
        phone: phone || '+91 98765 43210',
        message,
        category,
      });

      return res.json({ success: true, ...result });
    } catch (err) {
      console.error('Error simulating WhatsApp message:', err);
      return res.status(400).json({ success: false, error: 'Failed to simulate WhatsApp inquiry.' });
    }
  }
}

module.exports = SupportController;
