const express = require('express');
const router = express.Router();
const PaymentGatewayController = require('../controllers/paymentGateway.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

// All payment routes require authentication
router.use(requireAuth);

// Customer & Staff routes
router.post('/checkout', PaymentGatewayController.checkout);

// Admin & Advisor restricted financial routes
router.get('/transactions', requireRole(['ADMIN', 'ADVISOR']), PaymentGatewayController.getTransactions);
router.get('/refunds', requireRole(['ADMIN', 'ADVISOR']), PaymentGatewayController.getRefunds);
router.post('/refunds', requireRole(['ADMIN', 'ADVISOR']), PaymentGatewayController.issueRefund);
router.get('/reconciliation', requireRole(['ADMIN', 'ADVISOR']), PaymentGatewayController.getReconciliationLogs);
router.post('/reconciliation/run', requireRole(['ADMIN', 'ADVISOR']), PaymentGatewayController.triggerReconciliation);
router.get('/metrics', requireRole(['ADMIN', 'ADVISOR']), PaymentGatewayController.getMetrics);

module.exports = router;
