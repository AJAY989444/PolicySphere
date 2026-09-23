const InsurerService = require('../services/insurer.service');

class InsurerController {
  /**
   * List all active partner insurers
   * GET /api/insurer/list
   */
  static async getInsurerList(req, res) {
    try {
      const insurers = await InsurerService.getInsurerList();
      res.json({ success: true, count: insurers.length, insurers });
    } catch (err) {
      console.error('[InsurerController.getInsurerList] Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Executive Cockpit & Actuarial Health Overview
   * GET /api/insurer/overview
   */
  static async getOverview(req, res) {
    try {
      const { insurerId } = req.query;
      const overview = await InsurerService.getInsurerOverview(insurerId);
      res.json({ success: true, overview });
    } catch (err) {
      console.error('[InsurerController.getOverview] Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get Actuarial Product Rules
   * GET /api/insurer/products/rules
   */
  static async getProductRules(req, res) {
    try {
      const { insurerId } = req.query;
      const rules = await InsurerService.getProductRules(insurerId);
      res.json({ success: true, count: rules.length, rules });
    } catch (err) {
      console.error('[InsurerController.getProductRules] Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Update Actuarial Product Rule
   * PUT /api/insurer/products/rules/:id
   */
  static async updateProductRule(req, res) {
    try {
      const { id } = req.params;
      const updated = await InsurerService.updateProductRule(id, req.body);
      res.json({ success: true, message: 'Actuarial rule updated successfully.', rule: updated });
    } catch (err) {
      console.error('[InsurerController.updateProductRule] Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get Underwriting Referrals Queue
   * GET /api/insurer/underwriting/queue
   */
  static async getUnderwritingQueue(req, res) {
    try {
      const { insurerId, decision } = req.query;
      const queue = await InsurerService.getUnderwritingQueue(insurerId, decision);
      res.json({ success: true, count: queue.length, queue });
    } catch (err) {
      console.error('[InsurerController.getUnderwritingQueue] Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Submit Underwriting Decision (Counter-Offer / Exclusions / Approval / Decline)
   * POST /api/insurer/underwriting/decide/:id
   */
  static async submitUnderwritingDecision(req, res) {
    try {
      const { id } = req.params;
      const reviewer = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Chief Insurer Underwriter';
      const decision = await InsurerService.submitUnderwritingDecision(id, {
        ...req.body,
        reviewedBy: reviewer,
      });
      res.json({
        success: true,
        message: `Underwriting decision (${decision.decision}) processed successfully.`,
        decision,
      });
    } catch (err) {
      console.error('[InsurerController.submitUnderwritingDecision] Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get TPA & Cashless Claims Queue
   * GET /api/insurer/claims/queue
   */
  static async getClaimsQueue(req, res) {
    try {
      const { insurerId, status } = req.query;
      const claims = await InsurerService.getClaimsQueue(insurerId, status);
      res.json({ success: true, count: claims.length, claims });
    } catch (err) {
      console.error('[InsurerController.getClaimsQueue] Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Adjudicate Cashless Pre-Auth / Settlement
   * POST /api/insurer/claims/adjudicate/:id
   */
  static async adjudicateClaim(req, res) {
    try {
      const { id } = req.params;
      const officer = req.user ? `${req.user.firstName} ${req.user.lastName}` : 'TPA Medical Claims Officer';
      const adjudicated = await InsurerService.adjudicateClaim(id, {
        ...req.body,
        adjudicatedBy: officer,
      });
      res.json({
        success: true,
        message: `Claim ${adjudicated.claimNumber} adjudicated as ${adjudicated.status}.`,
        claim: adjudicated,
      });
    } catch (err) {
      console.error('[InsurerController.adjudicateClaim] Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * List Remittance & Settlement Batches
   * GET /api/insurer/settlements
   */
  static async getSettlementBatches(req, res) {
    try {
      const { insurerId } = req.query;
      const batches = await InsurerService.getSettlementBatches(insurerId);
      res.json({ success: true, count: batches.length, batches });
    } catch (err) {
      console.error('[InsurerController.getSettlementBatches] Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Generate Monthly Brokerage Settlement Batch
   * POST /api/insurer/settlements/generate
   */
  static async generateSettlementBatch(req, res) {
    try {
      const { insurerId, billingPeriod, policiesBound, grossPremium } = req.body;
      const batch = await InsurerService.generateSettlementBatch(insurerId, {
        billingPeriod,
        policiesBound,
        grossPremium,
      });
      res.json({
        success: true,
        message: `Settlement batch ${batch.batchNumber} generated for ${batch.billingPeriod}.`,
        batch,
      });
    } catch (err) {
      console.error('[InsurerController.generateSettlementBatch] Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Machine-to-Machine Open Insurance API: Policy Binding
   * POST /api/insurer/v1/policy/bind
   */
  static async bindPolicyApi(req, res) {
    try {
      const apiKey = req.headers['x-api-key'] || req.body.apiKey;
      const result = await InsurerService.bindPolicyApi(apiKey, req.body);
      res.json({ success: true, ...result });
    } catch (err) {
      console.error('[InsurerController.bindPolicyApi] Error:', err);
      res.status(err.message.includes('Unauthorized') ? 401 : 500).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Machine-to-Machine Open Insurance API: Hospital Cashless Pre-Auth
   * POST /api/insurer/v1/claims/preauth
   */
  static async preAuthClaimApi(req, res) {
    try {
      const apiKey = req.headers['x-api-key'] || req.body.apiKey;
      const result = await InsurerService.preAuthClaimApi(apiKey, req.body);
      res.json({ success: true, ...result });
    } catch (err) {
      console.error('[InsurerController.preAuthClaimApi] Error:', err);
      res.status(err.message.includes('Unauthorized') ? 401 : 500).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * Simulate Webhook Callback Event
   * POST /api/insurer/v1/webhook/simulate
   */
  static async simulateWebhook(req, res) {
    try {
      const { insurerId, eventType, reference } = req.body;
      const result = await InsurerService.simulateWebhook(insurerId, { eventType, reference });
      res.json({ success: true, ...result });
    } catch (err) {
      console.error('[InsurerController.simulateWebhook] Error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = InsurerController;
