const NotificationService = require('../services/notification.service');

class NotificationController {
  static async getNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const category = req.query.category || 'ALL';
      const data = await NotificationService.getUserNotifications(userId, category);
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

  static async clearAll(req, res, next) {
    try {
      const userId = req.user.id;
      await NotificationService.clearAllNotifications(userId);
      return res.json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
      next(error);
    }
  }

  static async getPreferences(req, res, next) {
    try {
      const userId = req.user.id;
      const preferences = await NotificationService.getUserPreferences(userId);
      return res.json({ success: true, preferences });
    } catch (error) {
      next(error);
    }
  }

  static async updatePreferences(req, res, next) {
    try {
      const userId = req.user.id;
      const preferences = req.body;
      const updated = await NotificationService.updateUserPreferences(userId, preferences);
      return res.json({ success: true, message: 'Preferences updated successfully', preferences: updated });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = NotificationController;
