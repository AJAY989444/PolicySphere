class WhatsAppChannel {
  /**
   * Formats WhatsApp Business Template Message with interactive CTA buttons
   */
  static formatTemplate(eventType, data = {}) {
    switch (eventType) {
      case 'OTP': {
        const otp = data.otpCode || Math.floor(100000 + Math.random() * 900000);
        return {
          templateName: 'auth_verification_otp',
          header: '🛡️ PolicySphere Verification',
          body: `Hello ${data.userName || 'Customer'},\n\nYour PolicySphere verification code is *${otp}*.\n\n⏱️ This code expires in 10 minutes.\n⚠️ Never share this security code with anyone.`,
          buttons: [
            { type: 'COPY_CODE', text: 'Copy OTP Code', payload: String(otp) },
          ],
          otp,
        };
      }

      case 'PURCHASE':
      case 'POLICY_ISSUED':
        return {
          templateName: 'policy_issuance_confirmation',
          header: '🎉 Policy Issued & Active!',
          body: `Dear *${data.userName || 'Customer'}*,\n\nYour insurance policy is now officially active!\n\n📋 *Plan:* ${data.policyName || 'Comprehensive Health Guard'}\n🏢 *Insurer:* ${data.provider || 'PolicySphere Underwriting'}\n🛡️ *Coverage:* $${Number(data.coverageAmount || 500000).toLocaleString()}\n💳 *Premium:* $${data.premium || '450'}/yr\n\nYour digital policy documents are available anytime in your dashboard.`,
          buttons: [
            { type: 'URL', text: '📥 Download Policy Card', url: 'https://policysphere.com/dashboard' },
            { type: 'QUICK_REPLY', text: '💬 Chat with Support' },
          ],
        };

      case 'RENEWAL':
      case 'RENEWAL_REMINDER':
        return {
          templateName: 'policy_renewal_advisory',
          header: '⏳ Policy Renewal Due Soon',
          body: `Hello *${data.userName || 'Customer'}*,\n\nYour policy *${data.policyName || 'Active Policy'}* is due for renewal on *${data.expiryDate || 'upcoming date'}*.\n\n💰 *Renewal Premium:* $${data.renewalPremium || data.premium || '420'}\n🎁 *No-Claim Discount:* 10% NCB Bonus Applied\n\nRenew now to maintain continuous coverage without any waiting period restart.`,
          buttons: [
            { type: 'URL', text: '⚡ 1-Click Renew Now', url: 'https://policysphere.com/dashboard' },
            { type: 'QUICK_REPLY', text: '📞 Request Call from Advisor' },
          ],
        };

      case 'CLAIM_UPDATE':
        return {
          templateName: 'claim_status_update',
          header: `📋 Claim Status: ${data.claimStatus || 'IN_REVIEW'}`,
          body: `Dear *${data.userName || 'Customer'}*,\n\nUpdate on Claim *#${data.claimId || 'CLM-2026-891'}* for *${data.policyName || 'Cover'}*:\n\n📌 *Status:* ${data.claimStatus || 'APPROVED'}\n${data.amount ? `💵 *Claim Amount:* $${data.amount}\n` : ''}${data.notes ? `📝 *Notes:* ${data.notes}\n` : ''}\nYou can check complete surveyor audit notes in your claims portal.`,
          buttons: [
            { type: 'URL', text: '🔍 View Claim Details', url: 'https://policysphere.com/claims' },
          ],
        };

      case 'PAYMENT_SUCCESS':
        return {
          templateName: 'payment_success_receipt',
          header: '💳 Payment Received',
          body: `Dear *${data.userName || 'Customer'}*,\n\nThank you! Your payment of *$${data.amount || '0.00'}* was successfully processed.\n\n🧾 *Transaction Ref:* ${data.transactionRef || 'TXN-' + Date.now()}\n💳 *Mode:* ${data.paymentMethod || 'Online Payment'}\n📅 *Date:* ${new Date().toLocaleDateString()}\n\nThis transaction is eligible for tax deduction under Section 80D.`,
          buttons: [
            { type: 'URL', text: '📄 Download Tax Receipt', url: 'https://policysphere.com/billing' },
          ],
        };

      case 'REMINDER':
      case 'PROPOSAL_LOCK_EXPIRING':
      default:
        return {
          templateName: 'customer_action_reminder',
          header: `🔔 Reminder: ${data.title || 'PolicySphere Alert'}`,
          body: `Hello *${data.userName || 'Customer'}*,\n\n${data.message || 'You have a pending application awaiting your action.'}\n\nPlease resume your application before your 30-day premium price guarantee expires.`,
          buttons: [
            { type: 'URL', text: '🚀 Resume Application', url: 'https://policysphere.com/proposals' },
          ],
        };
    }
  }

  /**
   * Dispatches WhatsApp Business API message
   */
  static async send({ to, eventType, data = {} }) {
    const template = this.formatTemplate(eventType, data);
    const recipientPhone = to || data.phone || '+1 (555) 234-5678';

    console.log(`\n[WHATSAPP BUSINESS DISPATCH] 🟢`);
    console.log(`To: ${recipientPhone}`);
    console.log(`Template: ${template.templateName}`);
    console.log(`Header: ${template.header}`);
    console.log(`Body: ${template.body.slice(0, 120)}...`);
    console.log(`Buttons:`, template.buttons?.map((b) => b.text).join(' | '));
    console.log('');

    const messageId = `wa-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    return {
      success: true,
      channel: 'WHATSAPP',
      recipient: recipientPhone,
      subject: `WhatsApp: ${template.header}`,
      contentSnippet: `${template.header} - ${template.body.slice(0, 100)}`,
      messageId,
      template,
      otp: template.otp,
      providerResponse: 'SENT_TO_WHATSAPP_SERVER',
    };
  }
}

module.exports = WhatsAppChannel;
