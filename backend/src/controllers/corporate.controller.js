const CorporateService = require('../services/corporate.service');

class CorporateController {
  static async getOverview(req, res, next) {
    try {
      const corporateAccountId = req.query.corporateAccountId || null;
      const overview = await CorporateService.getOverview(corporateAccountId);
      res.json({ success: true, overview });
    } catch (err) {
      next(err);
    }
  }

  static async listEmployees(req, res, next) {
    try {
      const corporateAccountId = req.query.corporateAccountId || null;
      const { search, department, tier, status, page, limit } = req.query;
      const result = await CorporateService.listEmployees(corporateAccountId, {
        search,
        department,
        tier,
        status,
        page,
        limit,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async addEmployee(req, res, next) {
    try {
      const corporateAccountId = req.body.corporateAccountId || null;
      const employee = await CorporateService.addEmployee(corporateAccountId, req.body);
      res.status(201).json({
        success: true,
        message: 'Employee successfully enrolled in corporate group cover.',
        employee,
      });
    } catch (err) {
      next(err);
    }
  }

  static async bulkUploadEmployees(req, res, next) {
    try {
      const corporateAccountId = req.body.corporateAccountId || null;
      const employeesList = req.body.employees || [];
      const result = await CorporateService.bulkUploadEmployees(corporateAccountId, employeesList);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async updateEmployeeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await CorporateService.updateEmployeeStatus(id, status);
      res.json({
        success: true,
        message: `Employee enrollment status updated to ${status}.`,
        employee: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static async addDependent(req, res, next) {
    try {
      const { id } = req.params;
      const dependent = await CorporateService.addDependent(id, req.body);
      res.status(201).json({
        success: true,
        message: 'Dependent added to employee health coverage.',
        dependent,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteDependent(req, res, next) {
    try {
      const { dependentId } = req.params;
      await CorporateService.deleteDependent(dependentId);
      res.json({ success: true, message: 'Dependent coverage removed.' });
    } catch (err) {
      next(err);
    }
  }

  static async listGroupPolicies(req, res, next) {
    try {
      const corporateAccountId = req.query.corporateAccountId || null;
      const policies = await CorporateService.listGroupPolicies(corporateAccountId);
      res.json({ success: true, policies });
    } catch (err) {
      next(err);
    }
  }

  static async createGroupPolicy(req, res, next) {
    try {
      const corporateAccountId = req.body.corporateAccountId || null;
      const policy = await CorporateService.createGroupPolicy(corporateAccountId, req.body);
      res.status(201).json({
        success: true,
        message: 'Custom corporate group policy contract established.',
        policy,
      });
    } catch (err) {
      next(err);
    }
  }

  static async listClaims(req, res, next) {
    try {
      const corporateAccountId = req.query.corporateAccountId || null;
      const { status, search, page, limit } = req.query;
      const result = await CorporateService.listClaims(corporateAccountId, {
        status,
        search,
        page,
        limit,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async submitClaim(req, res, next) {
    try {
      const corporateAccountId = req.body.corporateAccountId || null;
      const claim = await CorporateService.submitClaim(corporateAccountId, req.body);
      res.status(201).json({
        success: true,
        message: 'Hospitalization claim submitted for pre-authorization / reimbursement.',
        claim,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateClaimStatus(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await CorporateService.updateClaimStatus(id, req.body);
      res.json({
        success: true,
        message: `Claim status updated to ${req.body.status}.`,
        claim: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static async listInvoices(req, res, next) {
    try {
      const corporateAccountId = req.query.corporateAccountId || null;
      const invoices = await CorporateService.listInvoices(corporateAccountId);
      res.json({ success: true, invoices });
    } catch (err) {
      next(err);
    }
  }

  static async generateMonthlyInvoice(req, res, next) {
    try {
      const corporateAccountId = req.body.corporateAccountId || null;
      const { billingPeriod } = req.body;
      const invoice = await CorporateService.generateMonthlyInvoice(corporateAccountId, billingPeriod);
      res.json({
        success: true,
        message: 'Monthly PEPM invoice generated successfully.',
        invoice,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getDigitalECard(req, res, next) {
    try {
      const { employeeId } = req.params;
      const ecard = await CorporateService.getDigitalECard(employeeId);
      res.json({ success: true, ecard });
    } catch (err) {
      next(err);
    }
  }

  static async getMyBenefits(req, res, next) {
    try {
      const userEmail = req.user?.email;
      const benefits = await CorporateService.getMyBenefits(userEmail);
      res.json({ success: true, benefits });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = CorporateController;
