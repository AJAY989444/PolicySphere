const ReportingService = require('../services/reporting.service');

class ReportingController {
  // 1. Executive Overview
  static async getExecutiveOverview(req, res, next) {
    try {
      const { period, startDate, endDate } = req.query;
      const data = await ReportingService.getExecutiveOverview({ period, startDate, endDate });
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // 2. Customer Report & Tax 80D Portfolio
  static async getCustomerReport(req, res, next) {
    try {
      const userId = req.user.role === 'CUSTOMER' ? req.user.id : (req.query.userId || req.user.id);
      const { period } = req.query;
      const data = await ReportingService.getCustomerReport(userId, { period });
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // 3. Official Form 80D Tax Exemption Certificate
  static async getForm80DCertificate(req, res, next) {
    try {
      const { userPolicyId } = req.params;
      const certificate = await ReportingService.generateForm80DCertificate(userPolicyId, req.user.id);
      res.json({ success: true, certificate });
    } catch (err) {
      next(err);
    }
  }

  // 4. Advisor Reports
  static async getAdvisorReport(req, res, next) {
    try {
      const advisorId = req.user.role === 'ADVISOR' ? req.user.id : req.query.advisorId;
      const { period } = req.query;
      const data = await ReportingService.getAdvisorReport(advisorId, { period });
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // 5. Sales & GWP Reports
  static async getSalesReport(req, res, next) {
    try {
      const { period, category, provider } = req.query;
      const data = await ReportingService.getSalesReport({ period, category, provider });
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // 6. Renewal Radar Reports
  static async getRenewalReport(req, res, next) {
    try {
      const data = await ReportingService.getRenewalReport();
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // 7. Claims & ICR Reports
  static async getClaimsReport(req, res, next) {
    try {
      const { period } = req.query;
      const data = await ReportingService.getClaimsReport({ period });
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // 8. Fraud & Anomaly Audit
  static async getFraudReport(req, res, next) {
    try {
      const data = await ReportingService.getFraudReport();
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // 9. Commission & TDS Ledger
  static async getCommissionReport(req, res, next) {
    try {
      const data = await ReportingService.getCommissionReport();
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // 10. Revenue & Financial Reports
  static async getRevenueReport(req, res, next) {
    try {
      const data = await ReportingService.getRevenueReport();
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // 11. Tax Compliance Reports
  static async getTaxReport(req, res, next) {
    try {
      const data = await ReportingService.getTaxReport();
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // 12. Operational & SLA Reports
  static async getOperationalReport(req, res, next) {
    try {
      const data = await ReportingService.getOperationalReport();
      res.json({ success: true, ...data });
    } catch (err) {
      next(err);
    }
  }

  // 13. Universal Export Trigger (CSV / JSON)
  static async exportReport(req, res, next) {
    try {
      const { reportType, format, filters } = req.body;
      const result = await ReportingService.exportReport({
        reportType,
        format,
        filters,
        userId: req.user.id,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // 14. Report Export Audit History
  static async getReportHistory(req, res, next) {
    try {
      const reports = await ReportingService.getReportHistory(req.user.id, req.user.role);
      res.json({ success: true, reports });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReportingController;
