const { z } = require('zod');
const ProposalService = require('../services/proposal.service');

// Zod Validation Schema for Proposal Draft
const draftSchema = z.object({
  id: z.string().optional(),
  policyId: z.string().min(1, 'policyId is required'),
  step: z.number().int().min(1).max(4).optional(),
  proposerInfo: z.object({
    fullName: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    occupation: z.string().optional(),
    annualIncome: z.string().optional()
  }).optional(),
  membersInfo: z.array(z.object({
    name: z.string().optional(),
    relation: z.string().optional(),
    age: z.union([z.string(), z.number()]).optional(),
    gender: z.string().optional()
  })).optional(),
  medicalHistory: z.object({
    hasPreExisting: z.boolean().optional(),
    preExistingDetails: z.string().optional(),
    tobaccoOrAlcohol: z.boolean().optional(),
    recentSurgeries: z.boolean().optional()
  }).optional(),
  nomineeInfo: z.object({
    fullName: z.string().optional(),
    relation: z.string().optional(),
    age: z.union([z.string(), z.number()]).optional(),
    allocationPercent: z.union([z.string(), z.number()]).optional()
  }).optional()
});

class ProposalController {
  /**
   * POST /api/proposals/draft — Save or update proposal draft
   */
  static async saveDraft(req, res, next) {
    try {
      const validatedData = draftSchema.parse(req.body);
      const proposal = await ProposalService.createOrUpdateDraft(req.user.id, validatedData);
      res.status(200).json({
        success: true,
        message: 'Proposal draft saved successfully',
        proposal
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/proposals — Get user proposals list
   */
  static async getUserProposals(req, res, next) {
    try {
      const proposals = await ProposalService.getUserProposals(req.user.id);
      res.json({ success: true, proposals });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/proposals/:id — Get single proposal details
   */
  static async getById(req, res, next) {
    try {
      const proposal = await ProposalService.getProposalById(req.user.id, req.params.id);
      res.json({ success: true, proposal });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/proposals/:id/submit — Submit proposal for underwriting & premium lock
   */
  static async submitProposal(req, res, next) {
    try {
      const proposal = await ProposalService.validateAndLockProposal(req.user.id, req.params.id);
      res.json({
        success: true,
        message: 'Proposal underwriting check completed and premium locked!',
        proposal
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/proposals/:id — Discard proposal draft
   */
  static async deleteProposal(req, res, next) {
    try {
      const result = await ProposalService.deleteProposal(req.user.id, req.params.id);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ProposalController;
