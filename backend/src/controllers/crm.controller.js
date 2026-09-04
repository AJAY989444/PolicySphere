const CRMService = require('../services/crm.service');

class CRMController {
  /**
   * Public/Customer endpoint: Request callback or create sales lead
   * POST /api/crm/leads/public
   */
  static async createPublicLead(req, res) {
    try {
      const { name, email, phone, category, estimatedBudget, notes } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Name, email, and phone number are required.' });
      }

      const lead = await CRMService.createLead({
        name,
        email,
        phone,
        category: category || 'HEALTH',
        estimatedBudget,
        notes,
      });

      return res.status(201).json({
        message: 'Your request has been received! A dedicated PolicySphere Insurance Advisor will reach out shortly.',
        lead,
      });
    } catch (error) {
      console.error('Error creating lead:', error);
      return res.status(500).json({ error: 'Failed to create lead inquiry.' });
    }
  }

  /**
   * Advisor endpoint: Get advisor leads
   * GET /api/crm/leads
   */
  static async getLeads(req, res) {
    try {
      const advisorId = req.user.role === 'ADMIN' ? null : req.user.id;
      const { stage, category, search } = req.query;

      const leads = await CRMService.getAdvisorLeads(advisorId, { stage, category, search });
      return res.json({ leads });
    } catch (error) {
      console.error('Error fetching leads:', error);
      return res.status(500).json({ error: 'Failed to fetch sales leads.' });
    }
  }

  /**
   * Advisor endpoint: Create new manual lead
   * POST /api/crm/leads
   */
  static async createLead(req, res) {
    try {
      const { name, email, phone, category, estimatedBudget, notes } = req.body;

      if (!name || !email || !phone) {
        return res.status(400).json({ error: 'Name, email, and phone are required.' });
      }

      const lead = await CRMService.createLead({
        name,
        email,
        phone,
        category,
        estimatedBudget,
        notes,
        advisorId: req.user.id,
      });

      return res.status(201).json({ lead });
    } catch (error) {
      console.error('Error creating lead:', error);
      return res.status(500).json({ error: 'Failed to create lead.' });
    }
  }

  /**
   * Advisor endpoint: Update lead stage
   * PATCH /api/crm/leads/:id/stage
   */
  static async updateStage(req, res) {
    try {
      const { id } = req.params;
      const { stage, notes } = req.body;

      if (!stage) {
        return res.status(400).json({ error: 'Pipeline stage is required.' });
      }

      const lead = await CRMService.updateLeadStage(id, stage, req.user.id, notes);
      return res.json({ lead, message: `Lead updated to ${stage}` });
    } catch (error) {
      console.error('Error updating lead stage:', error);
      return res.status(500).json({ error: error.message || 'Failed to update lead stage.' });
    }
  }

  /**
   * Advisor endpoint: Add interaction activity (call, email, meeting note)
   * POST /api/crm/leads/:id/activities
   */
  static async addActivity(req, res) {
    try {
      const { id } = req.params;
      const { type, description } = req.body;

      if (!description) {
        return res.status(400).json({ error: 'Activity description is required.' });
      }

      const activity = await CRMService.addLeadActivity(id, req.user.id, { type, description });
      return res.status(201).json({ activity });
    } catch (error) {
      console.error('Error logging activity:', error);
      return res.status(500).json({ error: 'Failed to log lead activity.' });
    }
  }

  /**
   * Advisor endpoint: Get commission stats and earnings summary
   * GET /api/crm/commissions
   */
  static async getCommissions(req, res) {
    try {
      const advisorId = req.user.role === 'ADMIN' ? null : req.user.id;
      const summary = await CRMService.getAdvisorCommissionSummary(advisorId);
      return res.json(summary);
    } catch (error) {
      console.error('Error fetching commission summary:', error);
      return res.status(500).json({ error: 'Failed to fetch commission summary.' });
    }
  }
}

module.exports = CRMController;
