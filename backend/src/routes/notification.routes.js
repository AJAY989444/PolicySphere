const { Router } = require('express');
const NotificationController = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.use(requireAuth);

router.get('/', NotificationController.getNotifications);
router.delete('/', NotificationController.clearAll);

router.put('/read-all', NotificationController.markAllAsRead);
router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);

router.get('/preferences', NotificationController.getPreferences);
router.put('/preferences', NotificationController.updatePreferences);

module.exports = router;
