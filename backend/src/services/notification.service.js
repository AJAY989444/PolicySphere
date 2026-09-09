const prisma = require('../config/db');
const EmailChannel = require('./channels/email.channel');
const SmsChannel = require('./channels/sms.channel');
const WhatsAppChannel = require('./channels/whatsapp.channel');
const PushChannel = require('./channels/push.channel');

const DEFAULT_PREFERENCES = {
  email: true,
  sms: true,
  whatsapp: true,
  push: true,
  inApp: true,
  claims: true,
  renewals: true,
  payments: true,
  reminders: true,
  marketing: false,
};

// In-memory OTP storage for OTP verification with TTL
const activeOtpStore = new Map();

class NotificationService {
  /**
   * Helper to create an In-App notification in DB (respects user preferences)
   */
  static async createNotification({ userId, title, message, type = 'SYSTEM', linkUrl = null, channel = 'IN_APP' }) {
    try {
      if (!userId) return null;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true },
      });

      const prefs = user?.notificationPreferences || DEFAULT_PREFERENCES;
      if (prefs.inApp === false) return null;

      if (type === 'CLAIM_UPDATE' && prefs.claims === false) return null;
      if ((type === 'RENEWAL_REMINDER' || type === 'RENEWAL') && prefs.renewals === false) return null;
      if (type === 'PAYMENT_SUCCESS' && prefs.payments === false) return null;
      if (type === 'REMINDER' && prefs.reminders === false) return null;

      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          channel,
          linkUrl,
        },
      });

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }

  /**
   * Dispatches an event across all channels (Email, SMS, WhatsApp, Push, In-App)
   * Respecting user preferences and logging an audit trail for each channel.
   */
  static async dispatchMultiChannelEvent({ userId, eventType, data = {}, channels = null, forceAllChannels = false }) {
    try {
      let user = null;
      if (userId) {
        user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, phone: true, firstName: true, lastName: true, notificationPreferences: true },
        });
      }

      const prefs = user?.notificationPreferences || DEFAULT_PREFERENCES;
      const userName = user ? `${user.firstName} ${user.lastName}` : (data.userName || 'Customer');
      const enrichedData = {
        ...data,
        userId: user?.id || userId,
        userName,
        userEmail: user?.email || data.userEmail,
        phone: user?.phone || data.phone || '+1 (555) 019-2834',
      };

      const results = [];
      let inAppNotification = null;

      // 1. IN-APP CHANNEL
      const allowInApp = forceAllChannels || (channels ? channels.includes('IN_APP') : prefs.inApp !== false);
      if (allowInApp && userId) {
        const title = data.title || this.getEventDefaultTitle(eventType, enrichedData);
        const message = data.message || this.getEventDefaultMessage(eventType, enrichedData);
        const linkUrl = data.linkUrl || this.getEventDefaultLink(eventType, enrichedData);

        inAppNotification = await this.createNotification({
          userId,
          title,
          message,
          type: eventType,
          channel: 'IN_APP',
          linkUrl,
        });

        if (inAppNotification) {
          await this.logDelivery({
            userId,
            notificationId: inAppNotification.id,
            channel: 'IN_APP',
            eventType,
            recipient: user?.email || `User #${userId}`,
            subject: title,
            contentSnippet: message.slice(0, 160),
            status: 'DELIVERED',
            metadata: { inAppId: inAppNotification.id },
          });

          results.push({ channel: 'IN_APP', success: true, notification: inAppNotification });
        }
      }

      // 2. EMAIL CHANNEL
      const allowEmail = forceAllChannels || (channels ? channels.includes('EMAIL') : prefs.email !== false);
      const recipientEmail = enrichedData.userEmail || user?.email;
      if (allowEmail && recipientEmail) {
        const emailResult = await EmailChannel.send({
          to: recipientEmail,
          eventType,
          data: enrichedData,
        });

        if (userId) {
          await this.logDelivery({
            userId,
            notificationId: inAppNotification?.id,
            channel: 'EMAIL',
            eventType,
            recipient: recipientEmail,
            subject: emailResult.subject,
            contentSnippet: emailResult.contentSnippet,
            status: emailResult.success ? 'DELIVERED' : 'FAILED',
            metadata: { messageId: emailResult.messageId, error: emailResult.error },
          });
        }
        results.push(emailResult);
      }

      // 3. SMS CHANNEL
      const allowSms = forceAllChannels || (channels ? channels.includes('SMS') : prefs.sms !== false);
      const recipientPhone = enrichedData.phone || user?.phone;
      if (allowSms && recipientPhone) {
        const smsResult = await SmsChannel.send({
          to: recipientPhone,
          eventType,
          data: enrichedData,
        });

        if (userId) {
          await this.logDelivery({
            userId,
            notificationId: inAppNotification?.id,
            channel: 'SMS',
            eventType,
            recipient: recipientPhone,
            subject: smsResult.subject,
            contentSnippet: smsResult.contentSnippet,
            status: smsResult.success ? 'DELIVERED' : 'FAILED',
            metadata: { messageId: smsResult.messageId, otp: smsResult.otp },
          });
        }
        results.push(smsResult);
      }

      // 4. WHATSAPP CHANNEL
      const allowWhatsApp = forceAllChannels || (channels ? channels.includes('WHATSAPP') : prefs.whatsapp !== false);
      if (allowWhatsApp && recipientPhone) {
        const waResult = await WhatsAppChannel.send({
          to: recipientPhone,
          eventType,
          data: enrichedData,
        });

        if (userId) {
          await this.logDelivery({
            userId,
            notificationId: inAppNotification?.id,
            channel: 'WHATSAPP',
            eventType,
            recipient: recipientPhone,
            subject: waResult.subject,
            contentSnippet: waResult.contentSnippet,
            status: waResult.success ? 'DELIVERED' : 'FAILED',
            metadata: { messageId: waResult.messageId, template: waResult.template?.templateName },
          });
        }
        results.push(waResult);
      }

      // 5. PUSH NOTIFICATIONS CHANNEL
      const allowPush = forceAllChannels || (channels ? channels.includes('PUSH') : prefs.push !== false);
      if (allowPush) {
        const pushResult = await PushChannel.send({
          to: userId || 'browser-client',
          eventType,
          data: enrichedData,
        });

        if (userId) {
          await this.logDelivery({
            userId,
            notificationId: inAppNotification?.id,
            channel: 'PUSH',
            eventType,
            recipient: user?.email || `User Device #${userId}`,
            subject: pushResult.subject,
            contentSnippet: pushResult.contentSnippet,
            status: pushResult.success ? 'DELIVERED' : 'FAILED',
            metadata: { messageId: pushResult.messageId },
          });
        }
        results.push(pushResult);
      }

      return {
        success: true,
        eventType,
        dispatchedChannels: results.map((r) => r.channel),
        results,
      };
    } catch (error) {
      console.error('Failed multi-channel dispatch:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log entry in NotificationDeliveryLog
   */
  static async logDelivery({ userId, notificationId = null, channel, eventType, recipient, subject, contentSnippet, status = 'DELIVERED', metadata = {} }) {
    try {
      return await prisma.notificationDeliveryLog.create({
        data: {
          userId,
          notificationId,
          channel,
          eventType,
          recipient: String(recipient),
          subject: String(subject),
          contentSnippet: String(contentSnippet),
          status,
          deliveryMetadata: metadata,
        },
      });
    } catch (err) {
      console.error('Failed to write delivery audit log:', err);
      return null;
    }
  }

  /**
   * Send and register OTP verification code across Email, SMS & WhatsApp
   */
  static async sendOtpNotification({ userId, email, phone }) {
    const otpCode = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const key = email || phone || userId;
    activeOtpStore.set(key, { otpCode, expiresAt, userId });

    const dispatchResult = await this.dispatchMultiChannelEvent({
      userId,
      eventType: 'OTP',
      data: {
        otpCode,
        userEmail: email,
        phone,
      },
      channels: ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'],
      forceAllChannels: true,
    });

    return {
      success: true,
      otpCode,
      expiresAt: new Date(expiresAt).toISOString(),
      channels: dispatchResult.dispatchedChannels,
    };
  }

  /**
   * Verify an OTP code
   */
  static verifyOtpCode({ email, phone, userId, enteredCode }) {
    const key = email || phone || userId;
    const record = activeOtpStore.get(key);

    if (!record) {
      return { verified: false, message: 'OTP not found or expired. Please request a new one.' };
    }

    if (Date.now() > record.expiresAt) {
      activeOtpStore.delete(key);
      return { verified: false, message: 'OTP has expired. Please request a fresh code.' };
    }

    if (String(record.otpCode) !== String(enteredCode).trim()) {
      return { verified: false, message: 'Invalid OTP code entered. Please double check.' };
    }

    activeOtpStore.delete(key);
    return { verified: true, message: 'OTP verified successfully!' };
  }

  /**
   * Trigger automatic renewal check for policies expiring in the next 30 days
   */
  static async triggerRenewalCheck() {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const expiringPolicies = await prisma.userPolicy.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: today,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        user: true,
        policy: true,
      },
    });

    const dispatched = [];
    for (const userPolicy of expiringPolicies) {
      const daysLeft = Math.ceil((new Date(userPolicy.endDate) - today) / (1000 * 60 * 60 * 24));
      const res = await this.dispatchMultiChannelEvent({
        userId: userPolicy.userId,
        eventType: 'RENEWAL',
        data: {
          policyNumber: userPolicy.policyNumber,
          policyName: userPolicy.policy.name,
          expiryDate: new Date(userPolicy.endDate).toLocaleDateString(),
          premium: userPolicy.policy.premium,
          daysLeft,
          renewalPremium: Math.round(userPolicy.policy.premium * 0.9), // 10% NCB bonus
        },
      });
      dispatched.push({ userPolicyId: userPolicy.id, user: userPolicy.user.email, daysLeft, res });
    }

    return {
      evaluatedCount: expiringPolicies.length,
      dispatchedCount: dispatched.length,
      details: dispatched,
    };
  }

  /**
   * Query delivery audit logs
   */
  static async getDeliveryLogs(userId, options = {}) {
    const where = {};
    if (userId) where.userId = userId;
    if (options.channel && options.channel !== 'ALL') where.channel = options.channel;
    if (options.eventType && options.eventType !== 'ALL') where.eventType = options.eventType;

    const logs = await prisma.notificationDeliveryLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 100,
    });

    const channelStats = await prisma.notificationDeliveryLog.groupBy({
      by: ['channel'],
      where: userId ? { userId } : {},
      _count: { id: true },
    });

    return { logs, channelStats };
  }

  static async getUserNotifications(userId, category = 'ALL') {
    const whereClause = { userId };

    if (category === 'UNREAD') {
      whereClause.isRead = false;
    } else if (category === 'CLAIMS') {
      whereClause.type = 'CLAIM_UPDATE';
    } else if (category === 'POLICIES') {
      whereClause.type = { in: ['POLICY_ISSUED', 'PURCHASE', 'RENEWAL_REMINDER', 'RENEWAL', 'PROPOSAL_LOCK_EXPIRING'] };
    } else if (category === 'PAYMENTS') {
      whereClause.type = 'PAYMENT_SUCCESS';
    } else if (category === 'OTP') {
      whereClause.type = 'OTP';
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

  // ─── Helpers for default titles/messages ─────────────────────
  static getEventDefaultTitle(eventType, data) {
    switch (eventType) {
      case 'OTP': return '🔐 Verification Code';
      case 'PURCHASE':
      case 'POLICY_ISSUED': return `🎉 Policy Issued: ${data.policyName || 'Protection Plan'}`;
      case 'RENEWAL':
      case 'RENEWAL_REMINDER': return `⏳ Policy Due for Renewal: #${data.policyNumber || 'PS-POL'}`;
      case 'CLAIM_UPDATE': return `📋 Claim Update: ${data.claimStatus || 'Status Changed'}`;
      case 'PAYMENT_SUCCESS': return `💳 Payment Successful: $${data.amount || '0.00'}`;
      case 'REMINDER':
      default: return data.title || '🔔 Account Update';
    }
  }

  static getEventDefaultMessage(eventType, data) {
    switch (eventType) {
      case 'OTP': return `Your verification code is ${data.otpCode || '******'}. Valid for 10 minutes.`;
      case 'PURCHASE':
      case 'POLICY_ISSUED': return `Your policy #${data.policyNumber || 'POL'} has been successfully activated. Coverage: $${Number(data.coverageAmount || 500000).toLocaleString()}.`;
      case 'RENEWAL':
      case 'RENEWAL_REMINDER': return `Your policy expires on ${data.expiryDate || 'upcoming date'}. Renew before expiry to protect your NCB bonus.`;
      case 'CLAIM_UPDATE': return `Claim #${data.claimId || 'CLM'} status is now ${data.claimStatus || 'IN_REVIEW'}.${data.amount ? ` Amount: $${data.amount}.` : ''}`;
      case 'PAYMENT_SUCCESS': return `Received $${data.amount || '0.00'} (Ref: ${data.transactionRef || 'TXN'}). Official receipt generated.`;
      case 'REMINDER':
      default: return data.message || 'You have an important update pending in your PolicySphere account.';
    }
  }

  static getEventDefaultLink(eventType, data) {
    switch (eventType) {
      case 'PURCHASE':
      case 'POLICY_ISSUED':
      case 'RENEWAL':
      case 'RENEWAL_REMINDER': return '/dashboard';
      case 'CLAIM_UPDATE': return '/claims';
      case 'PAYMENT_SUCCESS': return '/billing';
      case 'OTP': return '/profile';
      case 'REMINDER':
      default: return data.linkUrl || '/dashboard';
    }
  }
}

module.exports = NotificationService;
