const express = require('express');
const router = express.Router();
const ComplianceController = require('../controllers/compliance.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

// ─── Public / Sandbox Security Preview ─────────────────────
router.post('/security/mask-preview', ComplianceController.previewMasking);
router.post('/fraud/analyze-public', ComplianceController.analyzeFraud);
router.get('/audit/verify-chain', ComplianceController.verifyAuditChain);

// ─── Authenticated DPDP Compliance ─────────────────────────
router.use(requireAuth);

// Consents
router.get('/consents', ComplianceController.getConsents);
router.post('/consents', ComplianceController.updateConsent);

// Personal Data Dossier
router.get('/dossier', ComplianceController.exportDossier);

// Right to Erasure
router.post('/erasure', ComplianceController.submitErasureRequest);

// Fraud Radar & Scoring
router.post('/fraud/analyze', ComplianceController.analyzeFraud);
router.get('/fraud/radar', ComplianceController.getFraudRadar);

// Admin-only Compliance Management
router.get('/erasure/requests', requireRole(['ADMIN']), ComplianceController.getErasureRequests);

module.exports = router;
