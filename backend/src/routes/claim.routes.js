const express = require('express');
const router = express.Router();
const ClaimController = require('../controllers/claim.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

const upload = require('../middleware/upload');

// All claim routes require authentication and customer role
router.use(requireAuth);
router.use(requireRole(['CUSTOMER']));

router.post('/upload', upload.array('files', 5), ClaimController.uploadDocuments);
router.post('/', ClaimController.createClaim);
router.get('/', ClaimController.getUserClaims);
router.get('/:id', ClaimController.getClaimById);

module.exports = router;
