const { Router } = require('express');
const NotificationController = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);

// Notification Feed & Status
router.get('/', NotificationController.getNotifications);
router.delete('/', NotificationController.clearAll);
router.put('/read-all', NotificationController.markAllAsRead);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);

// Preferences & Granular Channel Settings
router.get('/preferences', NotificationController.getPreferences);
router.put('/preferences', NotificationController.updatePreferences);

// Multi-Channel Delivery Logs & Audit Trail
router.get('/delivery-logs', NotificationController.getDeliveryLogs);

// OTP Authentication & Verification Event (Email, SMS, WhatsApp)
router.post('/send-otp', NotificationController.sendOtp);
router.post('/verify-otp', NotificationController.verifyOtp);

// Interactive Multi-Channel Test Simulator Dispatcher
router.post('/test-dispatch', NotificationController.testDispatch);

// Policy Expiration & Renewal Automated Evaluation Trigger
router.post('/trigger-renewals', NotificationController.triggerRenewals);

module.exports = router;
