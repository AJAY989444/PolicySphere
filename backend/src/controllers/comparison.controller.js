const ComparisonService = require('../services/comparison.service');

class ComparisonController {
  /**
   * POST /api/policies/compare
   * Request body: { policyIds: string[] }
   */
  static async compare(req, res, next) {
    try {
      const { policyIds } = req.body;
      const result = await ComparisonService.comparePolicies(policyIds);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ComparisonController;
