const { z } = require('zod');
const ClaimService = require('../services/claim.service');

const createClaimSchema = z.object({
  userPolicyId: z.string().min(1, 'User Policy ID is required'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  incidentDate: z.string().transform((str) => new Date(str)),
  documents: z.array(z.any()).optional(),
});

class ClaimController {
  static async uploadDocuments(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded.' });
      }

      const fileData = req.files.map((file) => ({
        originalName: file.originalname,
        filename: file.filename,
        url: `/uploads/claims/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
      }));

      return res.status(200).json({
        message: 'Files uploaded successfully',
        files: fileData,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createClaim(req, res, next) {
    try {
      const data = createClaimSchema.parse(req.body);
      const claim = await ClaimService.createClaim(req.user.id, data);
      res.status(201).json({ message: 'Claim created successfully', claim });
    } catch (err) {
      if (err.message === 'UNAUTHORIZED_POLICY_ACCESS') {
        return res.status(403).json({ error: 'You are not authorized to file a claim for this policy.' });
      }
      next(err);
    }
  }

  static async getUserClaims(req, res, next) {
    try {
      const claims = await ClaimService.getUserClaims(req.user.id);
      res.json({ claims });
    } catch (err) {
      next(err);
    }
  }

  static async getClaimById(req, res, next) {
    try {
      const claim = await ClaimService.getClaimById(req.user.id, req.params.id);
      if (!claim) {
        return res.status(404).json({ error: 'Claim not found' });
      }
      res.json({ claim });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ClaimController;
