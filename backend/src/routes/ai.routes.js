const { Router } = require('express');
const AIController = require('../controllers/ai.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = Router();

// Public / optional auth AI endpoints
router.post('/chat', optionalAuth, AIController.chat);
router.post('/recommendations', optionalAuth, AIController.getRecommendations);
router.post('/risk-assessment', optionalAuth, AIController.getRiskAssessment);
router.post('/predict-premium', optionalAuth, AIController.predictPremium);
router.post('/claim-probability', optionalAuth, AIController.claimProbability);
router.post('/fraud-analysis', optionalAuth, AIController.fraudAnalysis);
router.get('/explain/:policyId', AIController.explainPolicy);

// Authenticated AI assessment history
router.get('/history', requireAuth, AIController.getAssessmentHistory);

module.exports = router;


