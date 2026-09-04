const express = require('express');
const ProposalController = require('../controllers/proposal.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// All proposal endpoints require authentication
router.use(requireAuth);

router.post('/draft', ProposalController.saveDraft);
router.get('/', ProposalController.getUserProposals);
router.get('/:id', ProposalController.getById);
router.post('/:id/submit', ProposalController.submitProposal);
router.delete('/:id', ProposalController.deleteProposal);

module.exports = router;
