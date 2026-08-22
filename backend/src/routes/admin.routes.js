const { Router } = require('express');
const AdminController = require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

const AnalyticsController = require('../controllers/analytics.controller');

const router = Router();

// Protect all admin routes
router.use(requireAuth);

router.get('/analytics', requireRole(['ADMIN', 'ADVISOR']), AnalyticsController.getOverview);

router.use(requireRole(['ADMIN']));
router.post('/seed-demo', AdminController.seedDemo);
router.get('/stats', AdminController.getStats);
router.get('/policies', AdminController.getAllPolicies);
router.post('/policies', AdminController.createPolicy);
router.put('/policies/:id', AdminController.updatePolicy);
router.delete('/policies/:id', AdminController.deactivatePolicy);

module.exports = router;
