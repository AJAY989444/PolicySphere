const AnalyticsService = require('../services/analytics.service');

class AnalyticsController {
  static async getOverview(req, res, next) {
    try {
      const data = await AnalyticsService.getOverview();
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AnalyticsController;
