const UnderwritingService = require('../services/underwriting.service');

class UnderwritingController {
  /**
   * Evaluate a proposal for risk score and compliance.
   * POST /api/underwriting/evaluate/:proposalId
   */
  static async evaluateProposal(req, res) {
    try {
      const { proposalId } = req.params;
      const assessment = await UnderwritingService.evaluateProposalUnderwriting(proposalId);
      return res.status(200).json({
        success: true,
        message: 'Proposal evaluated successfully',
        data: assessment,
      });
    } catch (error) {
      console.error('Error in evaluateProposal:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to evaluate proposal underwriting',
      });
    }
  }

  /**
   * Get filtered underwriting assessments queue.
   * GET /api/underwriting/assessments
   */
  static async getAssessments(req, res) {
    try {
      const { riskLevel, status, search } = req.query;
      const assessments = await UnderwritingService.getAssessments({ riskLevel, status, search });
      return res.status(200).json({
        success: true,
        data: assessments,
      });
    } catch (error) {
      console.error('Error in getAssessments:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch underwriting assessments',
      });
    }
  }

  /**
   * Get single assessment by ID.
   * GET /api/underwriting/assessments/:id
   */
  static async getAssessmentById(req, res) {
    try {
      const { id } = req.params;
      const assessment = await UnderwritingService.getAssessmentById(id);
      return res.status(200).json({
        success: true,
        data: assessment,
      });
    } catch (error) {
      console.error('Error in getAssessmentById:', error);
      return res.status(404).json({
        success: false,
        message: error.message || 'Assessment not found',
      });
    }
  }

  /**
   * Submit manual underwriter decision.
   * POST /api/underwriting/decide/:id
   */
  static async processDecision(req, res) {
    try {
      const { id } = req.params;
      const actorId = req.user.id;
      const { decision, customLoading, notes, riderExclusions } = req.body;

      if (!decision) {
        return res.status(400).json({
          success: false,
          message: 'Decision action is required',
        });
      }

      const updated = await UnderwritingService.processUnderwriterDecision(id, actorId, {
        decision,
        customLoading,
        notes,
        riderExclusions,
      });

      return res.status(200).json({
        success: true,
        message: 'Underwriter decision recorded successfully',
        data: updated,
      });
    } catch (error) {
      console.error('Error in processDecision:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to record underwriter decision',
      });
    }
  }

  /**
   * Get regulatory compliance audit logs.
   * GET /api/underwriting/audit-logs
   */
  static async getAuditLogs(req, res) {
    try {
      const logs = await UnderwritingService.getAuditLogs(req.query);
      return res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      console.error('Error in getAuditLogs:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch compliance audit logs',
      });
    }
  }

  /**
   * Get portal executive dashboard metrics.
   * GET /api/underwriting/metrics
   */
  static async getMetrics(req, res) {
    try {
      const metrics = await UnderwritingService.getMetrics();
      return res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      console.error('Error in getMetrics:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch underwriting metrics',
      });
    }
  }
}

module.exports = UnderwritingController;
