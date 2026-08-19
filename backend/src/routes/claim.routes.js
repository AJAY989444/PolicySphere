const express = require('express');
const router = express.Router();
const ClaimController = require('../controllers/claim.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

// All claim routes require authentication and customer role
router.use(requireAuth);
router.use(requireRole(['CUSTOMER']));

router.post('/', ClaimController.createClaim);
router.get('/', ClaimController.getUserClaims);
router.get('/:id', ClaimController.getClaimById);

module.exports = router;
