const { z } = require('zod');
const PolicyService = require('../services/policy.service');

const categoryEnum = z.enum(['HEALTH', 'LIFE', 'MOTOR', 'TRAVEL', 'HOME']);

class PolicyController {
  /**
   * GET /api/policies — public catalog listing
   */
  static async getAll(req, res, next) {
    try {
      const { category, search, sortBy, order } = req.query;

      // Validate category if provided
      if (category) {
        categoryEnum.parse(category);
      }

      const policies = await PolicyService.getAllPolicies({
        category,
        search,
        sortBy,
        order,
      });

      res.json({ policies });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/policies/:id — single policy details
   */
  static async getById(req, res, next) {
    try {
      const policy = await PolicyService.getPolicyById(req.params.id);
      res.json({ policy });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/policies/:id/purchase — purchase a policy (protected)
   */
  static async purchase(req, res, next) {
    try {
      const userPolicy = await PolicyService.purchasePolicy(
        req.user.id,
        req.params.id
      );

      res.status(201).json({
        message: 'Policy purchased successfully',
        userPolicy,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/policies/my-policies — user's purchased policies (protected)
   */
  static async getMyPolicies(req, res, next) {
    try {
      const policies = await PolicyService.getUserPolicies(req.user.id);
      res.json({ policies });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/policies/my-policies/:userPolicyId/certificate — official digital certificate
   */
  static async getCertificate(req, res, next) {
    try {
      const { userPolicyId } = req.params;
      const certificate = await PolicyService.getPolicyCertificate(req.user.id, userPolicyId);
      res.json({ success: true, ...certificate });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/policies/dashboard-stats — user's dashboard stats (protected)
   */
  static async getDashboardStats(req, res, next) {
    try {
      const stats = await PolicyService.getUserDashboardStats(req.user.id);
      res.json({ stats });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PolicyController;
