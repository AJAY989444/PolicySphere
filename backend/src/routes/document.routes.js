const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const { requireRole } = require('../middleware/roleGuard');

// Customer endpoints
router.post('/verify-kyc', requireAuth, upload.single('file'), documentController.submitKycDocument);
router.get('/my-kyc', requireAuth, documentController.getMyKycStatus);

// Advisor verification endpoints
router.get('/advisor/all', requireAuth, documentController.getAllPendingKyc);
router.patch('/advisor/:id/review', requireAuth, documentController.reviewKycDocument);

module.exports = router;
