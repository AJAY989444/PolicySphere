const { Router } = require('express');
const InsurerController = require('../controllers/insurer.controller');
const { optionalAuth, requireAuth } = require('../middleware/auth');

const router = Router();

// ─── Insurer Partner Portal (B2B Hub) ──────────────────────────
// List partner insurers & executive cockpit (optionalAuth for demo resilience)
router.get('/list', optionalAuth, InsurerController.getInsurerList);
router.get('/overview', optionalAuth, InsurerController.getOverview);

// Actuarial Product Guidelines
router.get('/products/rules', optionalAuth, InsurerController.getProductRules);
router.put('/products/rules/:id', optionalAuth, InsurerController.updateProductRule);

// Underwriting Scrutiny & Counter-Offers
router.get('/underwriting/queue', optionalAuth, InsurerController.getUnderwritingQueue);
router.post('/underwriting/decide/:id', optionalAuth, InsurerController.submitUnderwritingDecision);

// TPA & Cashless Claims Adjudication Desk
router.get('/claims/queue', optionalAuth, InsurerController.getClaimsQueue);
router.post('/claims/adjudicate/:id', optionalAuth, InsurerController.adjudicateClaim);

// Remittance & Monthly Brokerage Settlements
router.get('/settlements', optionalAuth, InsurerController.getSettlementBatches);
router.post('/settlements/generate', optionalAuth, InsurerController.generateSettlementBatch);

// ─── Open Insurance Machine-to-Machine API Gateway (v1) ────────
router.post('/v1/policy/bind', InsurerController.bindPolicyApi);
router.post('/v1/claims/preauth', InsurerController.preAuthClaimApi);
router.post('/v1/webhook/simulate', InsurerController.simulateWebhook);

module.exports = router;
