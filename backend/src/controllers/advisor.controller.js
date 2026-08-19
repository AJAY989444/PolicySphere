const { z } = require('zod');
const ClaimService = require('../services/claim.service');

const updateClaimStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: 'Invalid claim status' })
  }),
});

class AdvisorController {
  static async getAllClaims(req, res, next) {
    try {
      const claims = await ClaimService.getAllSystemClaims();
      res.json({ claims });
    } catch (err) {
      next(err);
    }
  }

  static async updateClaimStatus(req, res, next) {
    try {
      const { status } = updateClaimStatusSchema.parse(req.body);
      const claimId = req.params.id;
      
      const claim = await ClaimService.updateClaimStatus(claimId, status);
      res.json({ message: 'Claim status updated successfully', claim });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AdvisorController;
