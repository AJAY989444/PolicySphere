const { z } = require('zod');
const AuthService = require('../services/auth.service');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['CUSTOMER', 'ADVISOR']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

class AuthController {
  static async register(req, res, next) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await AuthService.registerUser(validatedData);

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        success: true,
        user,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await AuthService.loginUser(email, password);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        user,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'No refresh token provided.' });
      }

      const { user, accessToken, refreshToken: newRefreshToken } = await AuthService.refreshTokens(refreshToken);

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        user,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      await AuthService.logoutUser(refreshToken);
      
      res.clearCookie('refreshToken');
      res.json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
      next(error);
    }
  }

  static async requestPasswordResetOtp(req, res, next) {
    try {
      const schema = z.object({
        email: z.string().email('Invalid email address'),
      });
      const { email } = schema.parse(req.body);
      const result = await AuthService.sendPasswordResetOtp(email);
      res.json(result);
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  static async verifyOtp(req, res, next) {
    try {
      const schema = z.object({
        email: z.string().email('Invalid email address'),
        otp: z.string().length(6, 'OTP must be exactly 6 digits'),
      });
      const { email, otp } = schema.parse(req.body);
      const result = await AuthService.verifyOnlyOtp(email, otp);
      res.json(result);
    } catch (error) {
      if (error.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  static async setNewPassword(req, res, next) {
    try {
      const schema = z.object({
        email: z.string().email('Invalid email address'),
        newPassword: z.string().min(8, 'New password must be at least 8 characters'),
      });
      const { email, newPassword } = schema.parse(req.body);
      const result = await AuthService.resetPasswordAfterVerification(email, newPassword);
      res.json(result);
    } catch (error) {
      if (error.statusCode === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }
}

module.exports = AuthController;
