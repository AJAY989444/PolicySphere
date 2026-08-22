const { Router } = require('express');
const PaymentController = require('../controllers/payment.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// All payment routes require authentication
router.use(requireAuth);

router.post('/checkout', PaymentController.checkout);
router.get('/history', PaymentController.getBillingHistory);
router.get('/invoice/:id', PaymentController.getTransactionById);

module.exports = router;
