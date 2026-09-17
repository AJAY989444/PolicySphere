const AIService = require('../services/ai.service');

class AIController {
  static async chat(req, res, next) {
    try {
      const { message, conversationHistory } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message text is required.' });
      }

      const result = await AIService.processChatQuery(message, conversationHistory);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getRecommendations(req, res, next) {
    try {
      const result = await AIService.calculatePersonalizedRecommendations(req.body || {}, req.user?.id);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getRiskAssessment(req, res, next) {
    try {
      const result = await AIService.calculateRiskScore(req.body || {}, req.user?.id);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async explainPolicy(req, res, next) {
    try {
      const { policyId } = req.params;
      if (!policyId) {
        return res.status(400).json({ error: 'Policy ID is required' });
      }
      const result = await AIService.explainPolicyFinePrint(policyId);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async predictPremium(req, res, next) {
    try {
      const result = await AIService.predictPremiumTrajectory(req.body || {}, req.user?.id);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async claimProbability(req, res, next) {
    try {
      const result = await AIService.calculateClaimProbability(req.body || {}, req.user?.id);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async fraudAnalysis(req, res, next) {
    try {
      const result = await AIService.analyzeClaimFraud(req.body || {}, req.user?.id);
      return res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getAssessmentHistory(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required for assessment history.' });
      }
      const history = await AIService.getUserAssessments(userId);
      return res.json({ success: true, history });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AIController;

