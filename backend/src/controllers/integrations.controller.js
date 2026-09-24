const IntegrationsService = require('../services/integrations.service');

class IntegrationsController {
  static async getDigiLockerDocs(req, res, next) {
    try {
      const { consentToken = 'CONSENT_GRANTED', docType = 'ALL' } = req.query;
      const result = await IntegrationsService.fetchDigiLockerDocuments(consentToken, docType);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async verifyPan(req, res, next) {
    try {
      const { panNumber, expectedName } = req.body;
      if (!panNumber) {
        return res.status(400).json({ success: false, message: 'PAN number is required' });
      }
      const result = await IntegrationsService.verifyPan(panNumber, expectedName);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async generateAadhaarOtp(req, res, next) {
    try {
      const { aadhaarNumber } = req.body;
      if (!aadhaarNumber) {
        return res.status(400).json({ success: false, message: 'Aadhaar number is required' });
      }
      const result = await IntegrationsService.requestAadhaarOtp(aadhaarNumber);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async verifyAadhaarOtp(req, res, next) {
    try {
      const { txnId, otp, aadhaarNumber } = req.body;
      if (!otp) {
        return res.status(400).json({ success: false, message: 'OTP is required' });
      }
      const result = await IntegrationsService.verifyAadhaarOtp(txnId, otp, aadhaarNumber);
      if (!result.success) {
        return res.status(400).json({ success: false, ...result });
      }
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async lookupCkyc(req, res, next) {
    try {
      const { ckycNumber } = req.body;
      if (!ckycNumber) {
        return res.status(400).json({ success: false, message: '14-digit CKYC number is required' });
      }
      const result = await IntegrationsService.lookupCkyc(ckycNumber);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async searchHospitals(req, res, next) {
    try {
      const { city, pincode, specialty, search, limit } = req.query;
      const hospitals = await IntegrationsService.searchHospitals({
        city,
        pincode,
        specialty,
        search,
        limit,
      });
      res.json({
        success: true,
        count: hospitals.length,
        data: hospitals,
      });
    } catch (err) {
      next(err);
    }
  }

  static async checkCashlessPreAuthEligibility(req, res, next) {
    try {
      const { id } = req.params;
      const { policyNumber, requestedSum } = req.body;
      const result = await IntegrationsService.checkCashlessPreAuthEligibility(
        id,
        policyNumber,
        requestedSum
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = IntegrationsController;
