const nodemailer = require('nodemailer');
const config = require('../../config');

class EmailChannel {
  static transporter = null;

  static getTransporter() {
    if (!this.transporter) {
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      } else {
        // Fallback simulated transporter for local dev / testing
        this.transporter = {
          sendMail: async (mailOptions) => {
            console.log(`\n[EMAIL CHANNEL SIMULATION] 📧`);
            console.log(`To: ${mailOptions.to}`);
            console.log(`Subject: ${mailOptions.subject}`);
            console.log(`Preview: ${mailOptions.text?.slice(0, 100) || 'HTML Email Body'}...\n`);
            return {
              messageId: `sim-email-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              response: 'Simulated 250 OK: Message accepted for delivery',
            };
          },
        };
      }
    }
    return this.transporter;
  }

  /**
   * Generates branded HTML email layout
   */
  static getBaseHtmlTemplate({ title, subtitle, contentHtml, ctaText, ctaUrl, footerNote }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 32px 28px; line-height: 1.6; }
          .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
          .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px; }
          .details-row:last-child { border-bottom: none; }
          .details-label { color: #64748b; }
          .details-value { font-weight: 600; color: #0f172a; }
          .cta-container { text-align: center; margin: 32px 0 16px; }
          .cta-btn { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 14px 28px; font-weight: 700; border-radius: 9999px; font-size: 15px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); }
          .footer { background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .badge-otp { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; background: #e0e7ff; padding: 16px 24px; border-radius: 12px; text-align: center; margin: 20px 0; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ PolicySphere</h1>
            <p>${subtitle || 'Digital Insurance Marketplace'}</p>
          </div>
          <div class="content">
            <h2 style="margin-top:0; font-size: 20px; color: #0f172a;">${title}</h2>
            ${contentHtml}
            ${ctaText && ctaUrl ? `
              <div class="cta-container">
                <a href="${ctaUrl}" class="cta-btn">${ctaText}</a>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>${footerNote || 'You received this email because of your PolicySphere account activity.'}</p>
            <p>© ${new Date().getFullYear()} PolicySphere Inc. All rights reserved. • IRDAI Reg No: PS-2026-IRDAI</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Dispatch email according to event type
   */
  static async send({ to, eventType, data = {} }) {
    const transporter = this.getTransporter();
    let subject = 'PolicySphere Notification';
    let text = '';
    let html = '';

    const appUrl = config.corsOrigin || 'http://localhost:5173';

    switch (eventType) {
      case 'OTP': {
        const otp = data.otpCode || Math.floor(100000 + Math.random() * 900000);
        subject = `🔐 Your PolicySphere Verification Code: ${otp}`;
        text = `Your PolicySphere verification code is ${otp}. Valid for 10 minutes. Do not share this OTP with anyone.`;
        html = this.getBaseHtmlTemplate({
          title: 'One-Time Verification Code',
          subtitle: 'Secure Identity Verification',
          contentHtml: `
            <p>Hello ${data.userName || 'Valued Customer'},</p>
            <p>Use the following verification code to complete your verification or login request:</p>
            <div style="text-align:center;">
              <div class="badge-otp">${otp}</div>
            </div>
            <p style="color: #64748b; font-size: 13px;">⏱️ This code will expire in <strong>10 minutes</strong>. If you did not request this verification, please contact PolicySphere security immediately.</p>
          `,
          footerNote: 'Never share your PolicySphere OTP with anyone, including customer representatives.',
        });
        break;
      }

      case 'PURCHASE':
      case 'POLICY_ISSUED': {
        subject = `🎉 Policy Issued: ${data.policyName || 'Your Insurance Policy'}`;
        text = `Congratulations! Your insurance policy ${data.policyName || ''} (Ref: ${data.policyNumber || 'POL-' + Date.now()}) is now active.`;
        html = this.getBaseHtmlTemplate({
          title: 'Policy Issuance Confirmation',
          subtitle: 'Digital Policy Pack',
          contentHtml: `
            <p>Congratulations <strong>${data.userName || 'Customer'}</strong>,</p>
            <p>Your insurance policy has been successfully issued and is now active on PolicySphere.</p>
            <div class="details-box">
              <div class="details-row"><span class="details-label">Policy Plan:</span><span class="details-value">${data.policyName || 'Comprehensive Protection'}</span></div>
              <div class="details-row"><span class="details-label">Provider:</span><span class="details-value">${data.provider || 'PolicySphere Underwriting'}</span></div>
              <div class="details-row"><span class="details-label">Coverage Sum Assured:</span><span class="details-value">$${Number(data.coverageAmount || 500000).toLocaleString()}</span></div>
              <div class="details-row"><span class="details-label">Premium Paid:</span><span class="details-value">$${data.premium || '450'}/yr</span></div>
              <div class="details-row"><span class="details-label">Effective Date:</span><span class="details-value">${new Date().toLocaleDateString()}</span></div>
            </div>
            <p>Your policy schedule and digital e-Card are attached and available inside your customer dashboard.</p>
          `,
          ctaText: 'View Policy & Download e-Card',
          ctaUrl: `${appUrl}/dashboard`,
        });
        break;
      }

      case 'RENEWAL':
      case 'RENEWAL_REMINDER': {
        subject = `⏳ Renewal Notice: Policy #${data.policyNumber || 'PS-POL'} expires soon`;
        text = `Your policy ${data.policyName || ''} is due for renewal on ${data.expiryDate || 'upcoming date'}. Renew early to retain your No Claim Bonus (NCB).`;
        html = this.getBaseHtmlTemplate({
          title: 'Insurance Policy Renewal Reminder',
          subtitle: 'Continuous Coverage Advisory',
          contentHtml: `
            <p>Hello <strong>${data.userName || 'Customer'}</strong>,</p>
            <p>This is a gentle reminder that your <strong>${data.policyName || 'Active Policy'}</strong> is due for annual renewal.</p>
            <div class="details-box">
              <div class="details-row"><span class="details-label">Policy:</span><span class="details-value">${data.policyName || 'Health Guard'}</span></div>
              <div class="details-row"><span class="details-label">Expiry Date:</span><span class="details-value" style="color:#ef4444;">${data.expiryDate || 'In 14 Days'}</span></div>
              <div class="details-row"><span class="details-label">Renewal Premium:</span><span class="details-value">$${data.renewalPremium || data.premium || '420'}</span></div>
              <div class="details-row"><span class="details-label">NCB Bonus Discount:</span><span class="details-value" style="color:#10b981;">10% Applied</span></div>
            </div>
            <p>Renewing before expiry ensures seamless coverage with zero waiting period re-applicability.</p>
          `,
          ctaText: 'Renew Policy Now with 1-Click',
          ctaUrl: `${appUrl}/dashboard`,
        });
        break;
      }

      case 'CLAIM_UPDATE': {
        const status = data.claimStatus || 'IN_REVIEW';
        subject = `📋 Claim Status Update: ${status} (Claim #${data.claimId || 'CLM-1001'})`;
        text = `Your insurance claim #${data.claimId || ''} for ${data.policyName || 'Policy'} is now ${status}.`;
        html = this.getBaseHtmlTemplate({
          title: `Claim Status: ${status}`,
          subtitle: 'Claims Resolution Tracker',
          contentHtml: `
            <p>Hello <strong>${data.userName || 'Customer'}</strong>,</p>
            <p>There is an official status update on your claim application.</p>
            <div class="details-box">
              <div class="details-row"><span class="details-label">Claim Reference:</span><span class="details-value">${data.claimId || 'CLM-2026-891'}</span></div>
              <div class="details-row"><span class="details-label">Policy:</span><span class="details-value">${data.policyName || 'Comprehensive Cover'}</span></div>
              <div class="details-row"><span class="details-label">Current Status:</span><span class="details-value" style="color: #4f46e5; font-weight: 700;">${status}</span></div>
              ${data.amount ? `<div class="details-row"><span class="details-label">Claim Amount:</span><span class="details-value">$${data.amount}</span></div>` : ''}
              ${data.notes ? `<div class="details-row"><span class="details-label">Surveyor Note:</span><span class="details-value">${data.notes}</span></div>` : ''}
            </div>
            <p>You can upload additional documents or track real-time settlement progress from your Claims Portal.</p>
          `,
          ctaText: 'View Claims Dashboard',
          ctaUrl: `${appUrl}/claims`,
        });
        break;
      }

      case 'PAYMENT_SUCCESS': {
        subject = `💳 Payment Receipt: $${data.amount || '0.00'} Successful (Ref: ${data.transactionRef || 'TXN'})`;
        text = `Payment received successfully! Ref: ${data.transactionRef || ''}, Amount: $${data.amount || '0.00'}.`;
        html = this.getBaseHtmlTemplate({
          title: 'Payment Successful',
          subtitle: 'Official Tax Invoice & Receipt',
          contentHtml: `
            <p>Hello <strong>${data.userName || 'Customer'}</strong>,</p>
            <p>We have successfully processed your premium transaction. Your transaction details are below:</p>
            <div class="details-box">
              <div class="details-row"><span class="details-label">Transaction Ref:</span><span class="details-value">${data.transactionRef || 'TXN-' + Date.now()}</span></div>
              <div class="details-row"><span class="details-label">Amount Paid:</span><span class="details-value" style="color:#10b981;">$${data.amount || '0.00'} ${data.currency || 'USD'}</span></div>
              <div class="details-row"><span class="details-label">Payment Mode:</span><span class="details-value">${data.paymentMethod || 'Credit / Debit Card'}</span></div>
              <div class="details-row"><span class="details-label">Date & Time:</span><span class="details-value">${new Date().toLocaleString()}</span></div>
              <div class="details-row"><span class="details-label">Tax Benefit Eligibility:</span><span class="details-value">Section 80D Eligible</span></div>
            </div>
          `,
          ctaText: 'Download Itemized Receipt',
          ctaUrl: `${appUrl}/billing`,
        });
        break;
      }

      case 'REMINDER':
      case 'PROPOSAL_LOCK_EXPIRING':
      case 'KYC_UPDATE':
      default: {
        subject = `🔔 Reminder: ${data.title || 'Action Required on PolicySphere'}`;
        text = `${data.message || 'You have an action pending in your PolicySphere account.'}`;
        html = this.getBaseHtmlTemplate({
          title: data.title || 'PolicySphere Account Reminder',
          subtitle: 'Important Action Reminder',
          contentHtml: `
            <p>Hello <strong>${data.userName || 'Customer'}</strong>,</p>
            <p>${data.message || 'You have an important update waiting in your PolicySphere account. Please review the details below:'}</p>
            ${data.details ? `
              <div class="details-box">
                ${Object.entries(data.details).map(([k, v]) => `
                  <div class="details-row"><span class="details-label">${k}:</span><span class="details-value">${v}</span></div>
                `).join('')}
              </div>
            ` : ''}
          `,
          ctaText: data.ctaText || 'Open Account Dashboard',
          ctaUrl: data.linkUrl ? `${appUrl}${data.linkUrl.startsWith('/') ? '' : '/'}${data.linkUrl}` : `${appUrl}/dashboard`,
        });
        break;
      }
    }

    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"PolicySphere Support" <notifications@policysphere.com>',
        to,
        subject,
        text,
        html,
      });

      return {
        success: true,
        channel: 'EMAIL',
        recipient: to,
        subject,
        contentSnippet: text.slice(0, 160),
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null,
      };
    } catch (error) {
      console.error('EmailChannel send error:', error);
      return {
        success: false,
        channel: 'EMAIL',
        recipient: to,
        subject,
        contentSnippet: text.slice(0, 160),
        error: error.message,
      };
    }
  }
}

module.exports = EmailChannel;
