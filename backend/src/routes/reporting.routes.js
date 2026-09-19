const express = require('express');
const router = express.Router();
const ReportingController = require('../controllers/reporting.controller');
const { requireAuth } = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// ─── Customer Accessible Routes ────────────────────────────
// Customer Portfolio & Tax Summary
router.get('/customer', requireAuth, ReportingController.getCustomerReport);

// Printable Form 80D Tax Exemption Certificate
router.get('/tax-80d/:userPolicyId', requireAuth, ReportingController.getForm80DCertificate);

// Export history (filtered to user's reports if Customer, all if Admin/Advisor)
router.get('/history', requireAuth, ReportingController.getReportHistory);

// Universal Export generator (CSV / JSON)
router.post('/export', requireAuth, ReportingController.exportReport);

// ─── Advisor & Staff Routes ────────────────────────────────
router.get(
  '/advisor',
  requireAuth,
  roleGuard(['CUSTOMER', 'ADVISOR', 'ADMIN']),
  ReportingController.getAdvisorReport
);

// ─── Executive & Admin Domain Reports ──────────────────────
router.get(
  '/executive',
  requireAuth,
  roleGuard(['CUSTOMER', 'ADVISOR', 'ADMIN']),
  ReportingController.getExecutiveOverview
);

router.get(
  '/sales',
  requireAuth,
  roleGuard(['CUSTOMER', 'ADVISOR', 'ADMIN']),
  ReportingController.getSalesReport
);

router.get(
  '/renewals',
  requireAuth,
  roleGuard(['CUSTOMER', 'ADVISOR', 'ADMIN']),
  ReportingController.getRenewalReport
);

router.get(
  '/claims',
  requireAuth,
  roleGuard(['CUSTOMER', 'ADVISOR', 'ADMIN']),
  ReportingController.getClaimsReport
);

router.get(
  '/fraud',
  requireAuth,
  roleGuard(['CUSTOMER', 'ADVISOR', 'ADMIN']),
  ReportingController.getFraudReport
);

router.get(
  '/commissions',
  requireAuth,
  roleGuard(['CUSTOMER', 'ADVISOR', 'ADMIN']),
  ReportingController.getCommissionReport
);

router.get(
  '/revenue',
  requireAuth,
  roleGuard(['CUSTOMER', 'ADVISOR', 'ADMIN']),
  ReportingController.getRevenueReport
);

router.get(
  '/tax',
  requireAuth,
  roleGuard(['CUSTOMER', 'ADVISOR', 'ADMIN']),
  ReportingController.getTaxReport
);

router.get(
  '/operational',
  requireAuth,
  roleGuard(['CUSTOMER', 'ADVISOR', 'ADMIN']),
  ReportingController.getOperationalReport
);

module.exports = router;
