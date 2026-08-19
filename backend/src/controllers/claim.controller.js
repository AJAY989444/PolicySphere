const { z } = require('zod');
const ClaimService = require('../services/claim.service');

const createClaimSchema = z.object({
  userPolicyId: z.string().min(1, 'User Policy ID is required'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  incidentDate: z.string().transform((str) => new Date(str)),
  documents: z.array(z.string()).optional(),
});

class ClaimController {
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
