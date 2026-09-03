const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const prisma = require('../config/db');
const config = require('../config');

// In-memory OTP storage: email -> { otp, expiresAt, verified: boolean }
const otpStore = new Map();

class AuthService {
  static async getMailer() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    // Auto-create Ethereal test mailer if real SMTP credentials are not in .env
    try {
      if (!this.testAccount) {
        this.testAccount = await nodemailer.createTestAccount();
        console.log(`\n📧 Created temporary Ethereal SMTP test account: ${this.testAccount.user}`);
      }
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: this.testAccount.user,
          pass: this.testAccount.pass,
        },
      });
    } catch (err) {
      console.error('Failed to create test mailer:', err.message);
      return null;
    }
  }

  static async registerUser(data) {
    const { email, password, firstName, lastName, role } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const error = new Error('Email already in use.');
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role || 'CUSTOMER',
      },
    });

    return this.generateTokens(user);
  }

  static async loginUser(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const error = new Error('Invalid credentials.');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid credentials.');
      error.statusCode = 401;
      throw error;
    }

    return this.generateTokens(user);
  }

  static async refreshTokens(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!tokenRecord) {
        throw new Error('Refresh token revoked');
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) {
        throw new Error('User not found');
      }

      // Invalidate old refresh token
      await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

      return this.generateTokens(user);
    } catch (err) {
      const error = new Error('Invalid or expired refresh token.');
      error.statusCode = 401;
      throw error;
    }
  }

  static async logoutUser(refreshToken) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
  }

  static async generateTokens(user) {
    const payload = { userId: user.id, role: user.role };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiry,
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry,
    });

    // Store refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  // Step 1: Send 6-digit OTP to user's email
  static async sendPasswordResetOtp(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const error = new Error('No account found with that email address.');
      error.statusCode = 404;
      throw error;
    }

    // Generate random 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins valid

    otpStore.set(email.toLowerCase(), { otp, expiresAt, verified: false });

    console.log(`\n=================================================`);
    console.log(`✉️ SENT OTP EMAIL TO [${email}]`);
    console.log(`🔑 VERIFICATION CODE: ${otp}`);
    console.log(`=================================================\n`);

    const mailer = await this.getMailer();
    if (mailer) {
      try {
        const info = await mailer.sendMail({
          from: `"PolicySphere Security" <${process.env.SMTP_USER || mailer.options.auth.user}>`,
          to: email,
          subject: 'PolicySphere — Password Reset OTP Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #4f46e5; text-align: center;">PolicySphere Security</h2>
              <p>Hello <strong>${user.firstName || 'User'}</strong>,</p>
              <p>We received a request to reset your PolicySphere account password.</p>
              <div style="background: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 6px; color: #1e293b; margin: 20px 0;">
                ${otp}
              </div>
              <p style="font-size: 13px; color: #64748b;">This OTP code is valid for 10 minutes. If you did not request a password reset, please ignore this message.</p>
            </div>
          `,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`🔗 PREVIEW SENT EMAIL IN BROWSER: ${previewUrl}`);
        }
      } catch (err) {
        console.error('Failed to send email via SMTP:', err.message);
      }
    }

    return {
      success: true,
      message: `OTP sent to ${email}. Please check your email inbox.`,
    };
  }

  // Step 2: Validate OTP alone (returns verification token/success flag)
  static async verifyOnlyOtp(email, otp) {
    const record = otpStore.get(email.toLowerCase());
    if (!record) {
      const error = new Error('No OTP request found. Please request a new OTP.');
      error.statusCode = 400;
      throw error;
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email.toLowerCase());
      const error = new Error('OTP has expired. Please request a new OTP.');
      error.statusCode = 400;
      throw error;
    }

    if (record.otp !== otp.trim()) {
      const error = new Error('Invalid OTP code. Please check your email.');
      error.statusCode = 400;
      throw error;
    }

    // Mark as verified so password update step can proceed
    record.verified = true;
    otpStore.set(email.toLowerCase(), record);

    return {
      success: true,
      message: 'OTP verified successfully! You may now set your new password.',
    };
  }

  // Step 3: Reset password only if OTP was pre-verified
  static async resetPasswordAfterVerification(email, newPassword) {
    const record = otpStore.get(email.toLowerCase());
    if (!record || !record.verified) {
      const error = new Error('OTP has not been verified. Please verify your OTP code first.');
      error.statusCode = 400;
      throw error;
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email.toLowerCase());
      const error = new Error('Session expired. Please request a new OTP.');
      error.statusCode = 400;
      throw error;
    }

    // Hash new password and update user in database
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    // Invalidate OTP session after successful reset
    otpStore.delete(email.toLowerCase());

    return {
      success: true,
      message: 'Password updated successfully! Please sign in with your new password.',
    };
  }
}

module.exports = AuthService;
