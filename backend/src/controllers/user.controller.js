const { z } = require('zod');
const UserService = require('../services/user.service');

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().optional().nullable(),
});

class UserController {
  static async getProfile(req, res, next) {
    try {
      // req.user is set by the requireAuth middleware
      const user = await UserService.getUserProfile(req.user.id);
      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const validatedData = updateProfileSchema.parse(req.body);
      const user = await UserService.updateUserProfile(req.user.id, validatedData);
      res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
