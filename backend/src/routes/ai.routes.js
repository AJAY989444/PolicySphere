const { Router } = require('express');
const AIController = require('../controllers/ai.controller');

const router = Router();

// Public / open access AI endpoints
router.post('/chat', AIController.chat);
router.post('/recommendations', AIController.getRecommendations);
router.post('/risk-assessment', AIController.getRiskAssessment);
router.get('/explain/:policyId', AIController.explainPolicy);

module.exports = router;

