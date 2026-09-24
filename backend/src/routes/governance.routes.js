const { Router } = require('express');
const GovernanceController = require('../controllers/governance.controller');
const { requireAuth } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

const router = Router();

// ─── Public Endpoints (Announcements & Coupons) ─────────────
router.get('/public/announcements/active', GovernanceController.getActiveAnnouncement);
router.post('/public/coupons/validate', GovernanceController.validateCoupon);

// ─── Protected Governance Endpoints (Super Admin & Staff) ───
router.use(requireAuth);

// Overview
router.get('/overview', roleGuard(['ADMIN', 'ADVISOR']), GovernanceController.getOverview);

// User & RBAC Management (Strict Admin Only)
router.get('/users', roleGuard(['ADMIN']), GovernanceController.getUsers);
router.put('/users/:id/role', roleGuard(['ADMIN']), GovernanceController.updateUserRole);
router.put('/users/:id/status', roleGuard(['ADMIN']), GovernanceController.toggleUserStatus);

// Coupons & Promotions
router.get('/coupons', roleGuard(['ADMIN', 'ADVISOR']), GovernanceController.listCoupons);
router.post('/coupons', roleGuard(['ADMIN']), GovernanceController.createCoupon);
router.put('/coupons/:id/toggle', roleGuard(['ADMIN']), GovernanceController.toggleCouponStatus);

// Insurer Partners
router.get('/insurers', roleGuard(['ADMIN', 'ADVISOR']), GovernanceController.listInsurers);
router.post('/insurers', roleGuard(['ADMIN']), GovernanceController.createInsurer);
router.put('/insurers/:id/toggle', roleGuard(['ADMIN']), GovernanceController.toggleInsurerStatus);

// CMS Announcements
router.get('/announcements', roleGuard(['ADMIN', 'ADVISOR']), GovernanceController.listAnnouncements);
router.post('/announcements', roleGuard(['ADMIN']), GovernanceController.createAnnouncement);
router.put('/announcements/:id/toggle', roleGuard(['ADMIN']), GovernanceController.toggleAnnouncement);
router.delete('/announcements/:id', roleGuard(['ADMIN']), GovernanceController.deleteAnnouncement);

// Security Audit Trail (Strict Admin Only)
router.get('/audit-trail', roleGuard(['ADMIN']), GovernanceController.getAuditLogs);

// System Settings (Strict Admin Only)
router.get('/settings', roleGuard(['ADMIN']), GovernanceController.getSettings);
router.put('/settings/:key', roleGuard(['ADMIN']), GovernanceController.updateSetting);

// Disaster Recovery & High Availability (SRS Module 31)
router.get('/dr-status', roleGuard(['ADMIN']), GovernanceController.getDrStatus);
router.post('/dr-backup', roleGuard(['ADMIN']), GovernanceController.triggerDrBackup);
router.post('/dr-rehearsal', roleGuard(['ADMIN']), GovernanceController.simulateDrRehearsal);

module.exports = router;
