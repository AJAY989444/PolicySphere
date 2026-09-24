const DpdpComplianceService = require('../services/dpdpCompliance.service');
const FraudDetectionService = require('../services/fraudDetection.service');
const CryptoVault = require('../utils/cryptoVault');

class ComplianceController {
  // ─── DPDP Consents ───
  static async getConsents(req, res, next) {
    try {
      const userId = req.user.id;
      const consents = await DpdpComplianceService.getUserConsents(userId);
      res.json({ success: true, consents });
    } catch (err) {
      next(err);
    }
  }

  static async updateConsent(req, res, next) {
    try {
      const userId = req.user.id;
      const { purpose, status } = req.body;

      if (!purpose || !status || !['GRANTED', 'REVOKED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid purpose or status. Status must be GRANTED or REVOKED.',
        });
      }

      const updated = await DpdpComplianceService.updateConsent(userId, purpose, status, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        message: `Consent for ${purpose} successfully ${status.toLowerCase()}`,
        consent: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  // ─── Data Dossier & Portability ───
  static async exportDossier(req, res, next) {
    try {
      const userId = req.user.id;
      const dossier = await DpdpComplianceService.exportPersonalDataDossier(userId);
      res.json({ success: true, dossier });
    } catch (err) {
      next(err);
    }
  }

  // ─── Right to Erasure ───
  static async submitErasureRequest(req, res, next) {
    try {
      const userId = req.user.id;
      const { reason } = req.body;

      if (!reason || reason.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a substantive reason for data erasure (min 10 characters).',
        });
      }

      const request = await DpdpComplianceService.submitErasureRequest(userId, reason);
      res.status(201).json({
        success: true,
        message: 'Right-to-erasure request submitted successfully. Our Data Protection Officer will review within 30 days.',
        request,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getErasureRequests(req, res, next) {
    try {
      const requests = await DpdpComplianceService.getErasureRequests();
      res.json({ success: true, requests });
    } catch (err) {
      next(err);
    }
  }

  // ─── Fraud Detection Radar ───
  static async analyzeFraud(req, res, next) {
    try {
      const claimData = {
        userId: req.user ? req.user.id : 'demo_user',
        ...req.body,
      };

      const result = await FraudDetectionService.evaluateClaimRisk(claimData);
      res.json({ success: true, assessment: result });
    } catch (err) {
      next(err);
    }
  }

  static async getFraudRadar(req, res, next) {
    try {
      const stats = await FraudDetectionService.getFraudStats();
      const recent = await FraudDetectionService.getRecentAssessments(15);
      res.json({
        success: true,
        stats,
        recentAssessments: recent,
      });
    } catch (err) {
      next(err);
    }
  }

  // ─── Cryptographic Vault & Masking Sandbox ───
  static async previewMasking(req, res, next) {
    try {
      const { aadhaar, pan, phone, email, bankAccount } = req.body;

      // Encrypt with AES-256-GCM
      const encryptedAadhaar = aadhaar ? CryptoVault.encrypt(aadhaar) : null;
      const decryptedAadhaar = encryptedAadhaar ? CryptoVault.decrypt(encryptedAadhaar) : null;

      res.json({
        success: true,
        securityDetails: {
          encryptionStandard: 'AES-256-GCM (Authenticated GCM Tag)',
          hashingAlgorithm: 'SHA-256 HMAC',
        },
        maskedData: {
          aadhaar: CryptoVault.maskAadhaar(aadhaar),
          pan: CryptoVault.maskPan(pan),
          phone: CryptoVault.maskPhone(phone),
          email: CryptoVault.maskEmail(email),
          bankAccount: CryptoVault.maskBankAccount(bankAccount),
        },
        fieldLevelEncryptionDemo: {
          original: aadhaar || '9876-5432-1098',
          ciphertext: encryptedAadhaar || 'iv:authTag:hex',
          decryptedRoundTrip: decryptedAadhaar || '9876-5432-1098',
          verifiedMatch: aadhaar ? decryptedAadhaar === aadhaar : true,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // ─── Module 35: SHA-256 Immutable Audit Chain Verification ───
  static async verifyAuditChain(req, res, next) {
    try {
      const AuditVaultService = require('../services/auditVault.service');
      const verification = await AuditVaultService.verifyChainIntegrity();
      res.json({
        success: true,
        data: verification,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ComplianceController;
