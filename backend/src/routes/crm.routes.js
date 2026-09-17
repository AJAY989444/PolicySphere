const express = require('express');
const router = express.Router();
const CRMController = require('../controllers/crm.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

// Public callback request lead creation
router.post('/leads/public', CRMController.createPublicLead);

// Protected routes (Advisor / Admin)
router.use(requireAuth);
router.use(requireRole(['ADVISOR', 'ADMIN']));

// Leads Management
router.get('/leads', CRMController.getLeads);
router.post('/leads', CRMController.createLead);
router.get('/leads/:id', CRMController.getLeadDetails);
router.patch('/leads/:id/stage', CRMController.updateStage);
router.patch('/leads/:id/reassign', CRMController.reassignLead);
router.patch('/leads/:id/metadata', CRMController.updateMetadata);
router.post('/leads/:id/activities', CRMController.addActivity);

// Follow-ups & Reminders
router.get('/followups/due', CRMController.getDueFollowUps);
router.post('/leads/:id/followups', CRMController.createFollowUp);
router.patch('/followups/:id', CRMController.updateFollowUp);

// Calls & Dialer
router.post('/leads/:id/calls', CRMController.logCall);

// Meetings Management
router.post('/leads/:id/meetings', CRMController.scheduleMeeting);
router.patch('/meetings/:id', CRMController.updateMeeting);

// Email Templates & Dispatch
router.get('/emails/templates', CRMController.getEmailTemplates);
router.post('/leads/:id/emails', CRMController.sendLeadEmail);

// Conversion Analytics & Reports
router.get('/reports/conversion', CRMController.getConversionReports);
router.get('/reports/export-csv', CRMController.exportCSV);
router.get('/commissions', CRMController.getCommissions);

module.exports = router;
