const express = require('express');
const router = express.Router();
const AdvisorController = require('../controllers/advisor.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

// All advisor routes require authentication and ADVISOR or ADMIN role
router.use(requireAuth);
router.use(requireRole(['ADVISOR', 'ADMIN']));

router.get('/claims', AdvisorController.getAllClaims);
router.patch('/claims/:id/status', AdvisorController.updateClaimStatus);

module.exports = router;
