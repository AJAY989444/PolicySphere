const { Router } = require('express');
const UnderwritingController = require('../controllers/underwriting.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

const router = Router();

// Protect all underwriting endpoints for ADVISOR and ADMIN roles
router.use(requireAuth);
router.use(requireRole(['ADVISOR', 'ADMIN']));

// Portal executive metrics
router.get('/metrics', UnderwritingController.getMetrics);

// Queue and detailed view
router.get('/assessments', UnderwritingController.getAssessments);
router.get('/assessments/:id', UnderwritingController.getAssessmentById);

// Evaluate proposal
router.post('/evaluate/:proposalId', UnderwritingController.evaluateProposal);

// Underwriter decision submission
router.post('/decide/:id', UnderwritingController.processDecision);

// Compliance audit trail
router.get('/audit-logs', UnderwritingController.getAuditLogs);

module.exports = router;
