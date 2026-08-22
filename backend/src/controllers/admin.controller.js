const { z } = require('zod');
const PolicyService = require('../services/policy.service');

const policySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  provider: z.string().min(2, 'Provider must be at least 2 characters'),
  category: z.enum(['HEALTH', 'LIFE', 'MOTOR', 'TRAVEL', 'HOME']),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  coverageAmount: z.number().positive('Coverage amount must be positive').or(z.string().transform(v => parseFloat(v))),
  premium: z.number().positive('Premium must be positive').or(z.string().transform(v => parseFloat(v))),
  duration: z.number().int().positive('Duration must be positive in months').or(z.string().transform(v => parseInt(v, 10))),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

class AdminController {
  static async getStats(req, res, next) {
    try {
      const stats = await PolicyService.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  static async getAllPolicies(req, res, next) {
    try {
      const policies = await PolicyService.getAllPoliciesForAdmin();
      res.json(policies);
    } catch (error) {
      next(error);
    }
  }

  static async createPolicy(req, res, next) {
    try {
      const validatedData = policySchema.parse(req.body);
      const policy = await PolicyService.createPolicy(validatedData);
      res.status(201).json(policy);
    } catch (error) {
      next(error);
    }
  }

  static async updatePolicy(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = policySchema.partial().parse(req.body);
      const policy = await PolicyService.updatePolicy(id, validatedData);
      res.json(policy);
    } catch (error) {
      next(error);
    }
  }

  static async deactivatePolicy(req, res, next) {
    try {
      const { id } = req.params;
      const policy = await PolicyService.deactivatePolicy(id);
      res.json({ message: 'Policy deactivated successfully', policy });
    } catch (error) {
      next(error);
    }
  }

  static async seedDemo(req, res, next) {
    try {
      const { exec } = require('child_process');
      const path = require('path');
      const seedPath = path.join(__dirname, '../../prisma/seed.js');
      
      exec(`node "${seedPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error('Seed execution error:', stderr);
          return res.status(500).json({ error: 'Failed to execute seed script.' });
        }
        res.json({ message: 'Catalog policies seeded successfully!', output: stdout });
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;
