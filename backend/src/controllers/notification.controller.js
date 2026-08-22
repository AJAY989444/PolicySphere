const NotificationService = require('../services/notification.service');

class NotificationController {
  static async getNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const data = await NotificationService.getUserNotifications(userId);
      return res.json({ success: true, ...data });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      await NotificationService.markAsRead(id, userId);
      return res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      await NotificationService.markAllAsRead(userId);
      return res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = NotificationController;
