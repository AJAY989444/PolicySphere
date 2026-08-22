const { Router } = require('express');
const PolicyController = require('../controllers/policy.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// Public routes — catalog
router.get('/', PolicyController.getAll);
router.get('/my-policies', requireAuth, PolicyController.getMyPolicies);
router.get('/my-policies/:userPolicyId/certificate', requireAuth, PolicyController.getCertificate);
router.get('/dashboard-stats', requireAuth, PolicyController.getDashboardStats);
router.get('/:id', PolicyController.getById);

// Protected routes — purchase & renewal
router.post('/my-policies/:userPolicyId/renew', requireAuth, PolicyController.renewPolicy);
router.post('/:id/purchase', requireAuth, PolicyController.purchase);

module.exports = router;
