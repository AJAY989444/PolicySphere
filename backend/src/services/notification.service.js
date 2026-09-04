const prisma = require('../config/db');

const DEFAULT_PREFERENCES = {
  email: true,
  sms: false,
  inApp: true,
  claims: true,
  renewals: true,
  marketing: false,
};

class NotificationService {
  /**
   * Helper to create a notification for a user (respects user preferences)
   */
  static async createNotification({ userId, title, message, type = 'SYSTEM', linkUrl = null }) {
    try {
      if (!userId) return null;

      // Check notification preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true },
      });

      const prefs = user?.notificationPreferences || DEFAULT_PREFERENCES;
      if (prefs.inApp === false) return null;

      if (type === 'CLAIM_UPDATE' && prefs.claims === false) return null;
      if ((type === 'RENEWAL_REMINDER' || type === 'POLICY_ISSUED' || type === 'PROPOSAL_LOCK_EXPIRING') && prefs.renewals === false) return null;

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

  static async getUserNotifications(userId, category = 'ALL') {
    const whereClause = { userId };

    if (category === 'UNREAD') {
      whereClause.isRead = false;
    } else if (category === 'CLAIMS') {
      whereClause.type = 'CLAIM_UPDATE';
    } else if (category === 'POLICIES') {
      whereClause.type = { in: ['POLICY_ISSUED', 'RENEWAL_REMINDER', 'PROPOSAL_LOCK_EXPIRING'] };
    } else if (category !== 'ALL' && category) {
      whereClause.type = category;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
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

  static async clearAllNotifications(userId) {
    return prisma.notification.deleteMany({
      where: { userId },
    });
  }

  static async getUserPreferences(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPreferences: true },
    });
    return user?.notificationPreferences || DEFAULT_PREFERENCES;
  }

  static async updateUserPreferences(userId, preferences) {
    const currentPrefs = await this.getUserPreferences(userId);
    const updatedPreferences = { ...currentPrefs, ...preferences };

    const user = await prisma.user.update({
      where: { id: userId },
      data: { notificationPreferences: updatedPreferences },
      select: { notificationPreferences: true },
    });

    return user.notificationPreferences;
  }
}

module.exports = NotificationService;
