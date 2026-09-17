const CRMService = require('../services/crm.service');

class CRMController {
  /**
   * Public/Customer endpoint: Request callback or create sales lead
   * POST /api/crm/leads/public
   */
  static async createPublicLead(req, res) {
    try {
      const {
        name,
        email,
        phone,
        category,
        estimatedBudget,
        notes,
        source = 'CATALOG_INQUIRY',
        priority = 'WARM',
        policyId = null,
      } = req.body;

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
        source,
        priority,
        policyId,
      });

      return res.status(201).json({
        message: 'Your request has been received! A dedicated PolicySphere Insurance Advisor will reach out shortly.',
        lead,
      });
    } catch (error) {
      console.error('Error creating public lead:', error);
      return res.status(500).json({ error: 'Failed to create lead inquiry.' });
    }
  }

  /**
   * Advisor endpoint: Get advisor leads with filtering & search
   * GET /api/crm/leads
   */
  static async getLeads(req, res) {
    try {
      const advisorId = req.user.role === 'ADMIN' ? null : req.user.id;
      const { stage, category, priority, source, search } = req.query;

      const leads = await CRMService.getAdvisorLeads(advisorId, {
        stage,
        category,
        priority,
        source,
        search,
      });

      return res.json({ leads });
    } catch (error) {
      console.error('Error fetching leads:', error);
      return res.status(500).json({ error: 'Failed to fetch sales leads.' });
    }
  }

  /**
   * Advisor endpoint: Get single lead with full 360 timeline
   * GET /api/crm/leads/:id
   */
  static async getLeadDetails(req, res) {
    try {
      const { id } = req.params;
      const lead = await CRMService.getLeadById(id);
      return res.json({ lead });
    } catch (error) {
      console.error('Error fetching lead details:', error);
      return res.status(error.message === 'Lead not found' ? 404 : 500).json({
        error: error.message || 'Failed to fetch lead details.',
      });
    }
  }

  /**
   * Advisor endpoint: Create new manual lead
   * POST /api/crm/leads
   */
  static async createLead(req, res) {
    try {
      const {
        name,
        email,
        phone,
        category,
        estimatedBudget,
        notes,
        source = 'MANUAL',
        priority = 'WARM',
        sentiment = 'INTERESTED',
        policyId = null,
      } = req.body;

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
        source,
        priority,
        sentiment,
        policyId,
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
   * Admin/Team Lead endpoint: Reassign lead to another advisor
   * PATCH /api/crm/leads/:id/reassign
   */
  static async reassignLead(req, res) {
    try {
      const { id } = req.params;
      const { newAdvisorId, reason } = req.body;

      if (!newAdvisorId) {
        return res.status(400).json({ error: 'New advisor ID is required.' });
      }

      const lead = await CRMService.reassignLead(id, newAdvisorId, reason, req.user.id);
      return res.json({ lead, message: 'Lead reassigned successfully.' });
    } catch (error) {
      console.error('Error reassigning lead:', error);
      return res.status(500).json({ error: error.message || 'Failed to reassign lead.' });
    }
  }

  /**
   * Advisor endpoint: Update lead priority, sentiment, or pinned notes
   * PATCH /api/crm/leads/:id/metadata
   */
  static async updateMetadata(req, res) {
    try {
      const { id } = req.params;
      const { priority, sentiment, pinnedNotes } = req.body;

      const lead = await CRMService.updateLeadMetadata(id, { priority, sentiment, pinnedNotes });
      return res.json({ lead, message: 'Lead metadata updated successfully.' });
    } catch (error) {
      console.error('Error updating lead metadata:', error);
      return res.status(500).json({ error: 'Failed to update lead metadata.' });
    }
  }

  /**
   * Advisor endpoint: Add interaction activity (note, call, email, meeting note)
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

  // ─── Follow-ups Endpoints ─────────────────────────────────────────

  /**
   * POST /api/crm/leads/:id/followups
   */
  static async createFollowUp(req, res) {
    try {
      const { id } = req.params;
      const { title, scheduledAt, priority, notes } = req.body;

      if (!title || !scheduledAt) {
        return res.status(400).json({ error: 'Follow-up title and scheduled date/time are required.' });
      }

      const followUp = await CRMService.createFollowUp(id, req.user.id, {
        title,
        scheduledAt,
        priority,
        notes,
      });

      return res.status(201).json({ followUp });
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      return res.status(500).json({ error: 'Failed to schedule follow-up.' });
    }
  }

  /**
   * PATCH /api/crm/followups/:id
   */
  static async updateFollowUp(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Follow-up status is required.' });
      }

      const followUp = await CRMService.updateFollowUpStatus(id, status, notes);
      return res.json({ followUp });
    } catch (error) {
      console.error('Error updating follow-up status:', error);
      return res.status(500).json({ error: 'Failed to update follow-up.' });
    }
  }

  /**
   * GET /api/crm/followups/due
   */
  static async getDueFollowUps(req, res) {
    try {
      const advisorId = req.user.role === 'ADMIN' ? null : req.user.id;
      const data = await CRMService.getDueFollowUps(advisorId);
      return res.json(data);
    } catch (error) {
      console.error('Error getting due follow-ups:', error);
      return res.status(500).json({ error: 'Failed to fetch due follow-ups.' });
    }
  }

  // ─── Calls Endpoints ──────────────────────────────────────────────

  /**
   * POST /api/crm/leads/:id/calls
   */
  static async logCall(req, res) {
    try {
      const { id } = req.params;
      const { durationSeconds, outcome, notes, recordingUrl } = req.body;

      const call = await CRMService.logCall(id, req.user.id, {
        durationSeconds,
        outcome,
        notes,
        recordingUrl,
      });

      return res.status(201).json({ call });
    } catch (error) {
      console.error('Error logging call:', error);
      return res.status(500).json({ error: 'Failed to log call.' });
    }
  }

  // ─── Meetings Endpoints ───────────────────────────────────────────

  /**
   * POST /api/crm/leads/:id/meetings
   */
  static async scheduleMeeting(req, res) {
    try {
      const { id } = req.params;
      const { title, scheduledAt, durationMinutes, meetingLink, agenda } = req.body;

      if (!title || !scheduledAt) {
        return res.status(400).json({ error: 'Meeting title and date/time are required.' });
      }

      const meeting = await CRMService.scheduleMeeting(id, req.user.id, {
        title,
        scheduledAt,
        durationMinutes,
        meetingLink,
        agenda,
      });

      return res.status(201).json({ meeting });
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      return res.status(500).json({ error: 'Failed to schedule meeting.' });
    }
  }

  /**
   * PATCH /api/crm/meetings/:id
   */
  static async updateMeeting(req, res) {
    try {
      const { id } = req.params;
      const { status, outcomeNotes } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Meeting status is required.' });
      }

      const meeting = await CRMService.updateMeetingStatus(id, status, outcomeNotes);
      return res.json({ meeting });
    } catch (error) {
      console.error('Error updating meeting:', error);
      return res.status(500).json({ error: 'Failed to update meeting.' });
    }
  }

  // ─── Email Endpoints ──────────────────────────────────────────────

  /**
   * GET /api/crm/emails/templates
   */
  static async getEmailTemplates(req, res) {
    try {
      const templates = CRMService.getEmailTemplates();
      return res.json({ templates });
    } catch (error) {
      console.error('Error fetching email templates:', error);
      return res.status(500).json({ error: 'Failed to load email templates.' });
    }
  }

  /**
   * POST /api/crm/leads/:id/emails
   */
  static async sendLeadEmail(req, res) {
    try {
      const { id } = req.params;
      const { templateKey, customSubject, customBody, recipientEmail } = req.body;

      const emailLog = await CRMService.sendLeadEmail(id, req.user.id, {
        templateKey,
        customSubject,
        customBody,
        recipientEmail,
      });

      return res.status(201).json({ emailLog, message: 'Email dispatched successfully.' });
    } catch (error) {
      console.error('Error sending lead email:', error);
      return res.status(500).json({ error: error.message || 'Failed to dispatch email.' });
    }
  }

  // ─── Reports & Export ─────────────────────────────────────────────

  /**
   * GET /api/crm/reports/conversion
   */
  static async getConversionReports(req, res) {
    try {
      const advisorId = req.user.role === 'ADMIN' ? null : req.user.id;
      const { timeRange = '30d' } = req.query;

      const reports = await CRMService.getConversionReports(advisorId, timeRange);
      return res.json(reports);
    } catch (error) {
      console.error('Error generating conversion reports:', error);
      return res.status(500).json({ error: 'Failed to generate conversion analytics.' });
    }
  }

  /**
   * GET /api/crm/reports/export-csv
   */
  static async exportCSV(req, res) {
    try {
      const advisorId = req.user.role === 'ADMIN' ? null : req.user.id;
      const { stage, category, priority, source } = req.query;

      const csvContent = await CRMService.exportLeadsCSV(advisorId, {
        stage,
        category,
        priority,
        source,
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=policysphere-leads-${Date.now()}.csv`);
      return res.status(200).send(csvContent);
    } catch (error) {
      console.error('Error exporting leads to CSV:', error);
      return res.status(500).json({ error: 'Failed to export leads.' });
    }
  }

  /**
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
