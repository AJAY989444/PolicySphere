const express = require('express');
const router = express.Router();
const CRMController = require('../controllers/crm.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

// Public callback request lead creation
router.post('/leads/public', CRMController.createPublicLead);

// Protected routes (Advisor / Admin)
router.use(requireAuth);
router.use(requireRole(['ADVISOR', 'ADMIN']));

router.get('/leads', CRMController.getLeads);
router.post('/leads', CRMController.createLead);
router.patch('/leads/:id/stage', CRMController.updateStage);
router.post('/leads/:id/activities', CRMController.addActivity);
router.get('/commissions', CRMController.getCommissions);

module.exports = router;
