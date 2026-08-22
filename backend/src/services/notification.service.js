const prisma = require('../config/db');

class NotificationService {
  /**
   * Helper to create a notification for a user
   */
  static async createNotification({ userId, title, message, type = 'SYSTEM', linkUrl = null }) {
    try {
      if (!userId) return null;
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          linkUrl,
        },
      });
      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null; // non-blocking error for triggers
    }
  }

  static async getUserNotifications(userId) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { notifications, unreadCount };
  }

  static async markAsRead(id, userId) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

module.exports = NotificationService;
