class SmsChannel {
  /**
   * Formats transactional SMS according to telecom standards
   */
  static formatMessage(eventType, data = {}) {
    switch (eventType) {
      case 'OTP': {
        const otp = data.otpCode || Math.floor(100000 + Math.random() * 900000);
        return {
          text: `[PolicySphere] Your verification OTP is ${otp}. Valid for 10 minutes. Do NOT share this code with anyone. Ref: PS-${Date.now().toString().slice(-4)}`,
          otp,
        };
      }

      case 'PURCHASE':
      case 'POLICY_ISSUED':
        return {
          text: `[PolicySphere] Congratulations! Policy #${data.policyNumber || 'PS-POL'} for ${data.policyName || 'Plan'} is active. Cover: $${Number(data.coverageAmount || 500000).toLocaleString()}. Download card: https://policysphere.com/dashboard`,
        };

      case 'RENEWAL':
      case 'RENEWAL_REMINDER':
        return {
          text: `[PolicySphere] Alert: Your policy #${data.policyNumber || 'PS-POL'} expires on ${data.expiryDate || 'upcoming date'}. Renew before expiry to protect your No Claim Bonus (NCB): https://policysphere.com/dashboard`,
        };

      case 'CLAIM_UPDATE':
        return {
          text: `[PolicySphere] Claim #${data.claimId || 'CLM-901'} updated: Status is ${data.claimStatus || 'IN_REVIEW'}${data.amount ? ` ($${data.amount})` : ''}. View details: https://policysphere.com/claims`,
        };

      case 'PAYMENT_SUCCESS':
        return {
          text: `[PolicySphere] Received $${data.amount || '0.00'} for ${data.policyName || 'Premium'} (Ref: ${data.transactionRef || 'TXN'}). Receipt: https://policysphere.com/billing`,
        };

      case 'REMINDER':
      case 'PROPOSAL_LOCK_EXPIRING':
      default:
        return {
          text: `[PolicySphere] Reminder: ${data.title || 'Action Required'} - ${data.message || 'Please log in to your account'}. Link: https://policysphere.com/dashboard`,
        };
    }
  }

  /**
   * Dispatch SMS to recipient phone
   */
  static async send({ to, eventType, data = {} }) {
    const { text, otp } = this.formatMessage(eventType, data);
    const recipientPhone = to || data.phone || '+1 (555) 234-5678';

    console.log(`\n[SMS CHANNEL DISPATCH] 📱`);
    console.log(`To: ${recipientPhone}`);
    console.log(`Sender ID: POLSPH`);
    console.log(`Message: ${text}\n`);

    const messageId = `sms-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    return {
      success: true,
      channel: 'SMS',
      recipient: recipientPhone,
      subject: `SMS: ${eventType}`,
      contentSnippet: text,
      messageId,
      otp,
      providerResponse: 'DELIVERED_TO_HANDSET',
    };
  }
}

module.exports = SmsChannel;
