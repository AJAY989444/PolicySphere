class PushChannel {
  /**
   * Formats Web Push Notification payload
   */
  static formatPayload(eventType, data = {}) {
    const defaultIcon = '/favicon.ico';
    const defaultBadge = '/favicon.ico';

    switch (eventType) {
      case 'OTP':
        return {
          title: '🔐 Security Verification Code',
          body: `Your PolicySphere OTP is ${data.otpCode || '******'}. Valid for 10 minutes.`,
          icon: defaultIcon,
          badge: defaultBadge,
          tag: 'auth-otp',
          requireInteraction: true,
          actions: [
            { action: 'copy', title: 'Copy Code' },
            { action: 'dismiss', title: 'Dismiss' },
          ],
          data: { url: '/profile' },
        };

      case 'PURCHASE':
      case 'POLICY_ISSUED':
        return {
          title: '🎉 Policy Issued & Active!',
          body: `Your policy for ${data.policyName || 'Protection Plan'} has been successfully issued.`,
          icon: defaultIcon,
          badge: defaultBadge,
          tag: 'policy-purchase',
          actions: [
            { action: 'view', title: 'View Policy' },
          ],
          data: { url: '/dashboard' },
        };

      case 'RENEWAL':
      case 'RENEWAL_REMINDER':
        return {
          title: '⏳ Policy Renewal Due',
          body: `Policy #${data.policyNumber || 'PS-POL'} expires on ${data.expiryDate || 'soon'}. Renew now with 1-click!`,
          icon: defaultIcon,
          badge: defaultBadge,
          tag: 'policy-renewal',
          actions: [
            { action: 'renew', title: 'Renew Now' },
          ],
          data: { url: '/dashboard' },
        };

      case 'CLAIM_UPDATE':
        return {
          title: `📋 Claim Status: ${data.claimStatus || 'Updated'}`,
          body: `Claim #${data.claimId || 'CLM-901'} has been updated to ${data.claimStatus || 'IN_REVIEW'}.`,
          icon: defaultIcon,
          badge: defaultBadge,
          tag: 'claim-update',
          actions: [
            { action: 'view', title: 'Check Claim' },
          ],
          data: { url: '/claims' },
        };

      case 'PAYMENT_SUCCESS':
        return {
          title: '💳 Payment Successful',
          body: `Received $${data.amount || '0.00'} for ${data.policyName || 'Policy'} (Ref: ${data.transactionRef || 'TXN'}).`,
          icon: defaultIcon,
          badge: defaultBadge,
          tag: 'payment-receipt',
          actions: [
            { action: 'view', title: 'View Invoice' },
          ],
          data: { url: '/billing' },
        };

      case 'REMINDER':
      case 'PROPOSAL_LOCK_EXPIRING':
      default:
        return {
          title: `🔔 ${data.title || 'PolicySphere Alert'}`,
          body: data.message || 'You have an important account update waiting.',
          icon: defaultIcon,
          badge: defaultBadge,
          tag: 'system-reminder',
          actions: [
            { action: 'view', title: 'Review' },
          ],
          data: { url: data.linkUrl || '/dashboard' },
        };
    }
  }

  /**
   * Dispatch push notification
   */
  static async send({ to, eventType, data = {} }) {
    const payload = this.formatPayload(eventType, data);
    const recipient = to || data.userId || 'browser-client';

    console.log(`\n[PUSH NOTIFICATION DISPATCH] 🔔`);
    console.log(`To: ${recipient}`);
    console.log(`Title: ${payload.title}`);
    console.log(`Body: ${payload.body}\n`);

    const messageId = `push-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    return {
      success: true,
      channel: 'PUSH',
      recipient,
      subject: payload.title,
      contentSnippet: payload.body,
      messageId,
      payload,
      providerResponse: 'PUSH_DELIVERED_TO_DEVICE',
    };
  }
}

module.exports = PushChannel;
