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

  static async getDeliveryLogs(req, res, next) {
    try {
      const userId = req.user.role === 'ADMIN' && req.query.allUsers === 'true' ? null : req.user.id;
      const { channel, eventType, limit } = req.query;
      const data = await NotificationService.getDeliveryLogs(userId, {
        channel,
        eventType,
        limit: limit ? parseInt(limit, 10) : 100,
      });
      return res.json({ success: true, ...data });
    } catch (error) {
      next(error);
    }
  }

  static async sendOtp(req, res, next) {
    try {
      const userId = req.user.id;
      const email = req.body.email || req.user.email;
      const phone = req.body.phone || req.user.phone;

      const result = await NotificationService.sendOtpNotification({ userId, email, phone });
      return res.json({
        success: true,
        message: 'Security OTP dispatched via Email, SMS & WhatsApp',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(req, res, next) {
    try {
      const userId = req.user.id;
      const { code, email, phone } = req.body;

      if (!code) {
        return res.status(400).json({ success: false, message: 'Verification code is required' });
      }

      const result = NotificationService.verifyOtpCode({
        userId,
        email: email || req.user.email,
        phone: phone || req.user.phone,
        enteredCode: code,
      });

      if (!result.verified) {
        return res.status(400).json({ success: false, message: result.message });
      }

      return res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }

  static async testDispatch(req, res, next) {
    try {
      const userId = req.user.id;
      const { eventType, data, channels, forceAllChannels } = req.body;

      if (!eventType) {
        return res.status(400).json({ success: false, message: 'eventType is required (OTP, PURCHASE, RENEWAL, CLAIM_UPDATE, PAYMENT_SUCCESS, REMINDER)' });
      }

      const result = await NotificationService.dispatchMultiChannelEvent({
        userId,
        eventType,
        data: data || {},
        channels,
        forceAllChannels: forceAllChannels ?? true,
      });

      return res.json({
        success: true,
        message: `Dispatched ${eventType} notification across channels`,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async triggerRenewals(req, res, next) {
    try {
      const result = await NotificationService.triggerRenewalCheck();
      return res.json({
        success: true,
        message: 'Automated renewal cycle evaluated successfully',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = NotificationController;
