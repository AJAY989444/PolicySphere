const { z } = require('zod');
const PaymentService = require('../services/payment.service');

const checkoutSchema = z.object({
  policyId: z.string().min(1, 'Policy ID is required'),
  paymentMethod: z.enum(['CARD', 'NET_BANKING', 'UPI', 'PAYPAL']).default('CARD'),
  cardNumber: z.string().optional(),
  cardHolder: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
});

class PaymentController {
  /**
   * Process checkout
   */
  static async checkout(req, res, next) {
    try {
      const validatedData = checkoutSchema.parse(req.body);
      const result = await PaymentService.checkout({
        userId: req.user.id,
        policyId: validatedData.policyId,
        paymentMethod: validatedData.paymentMethod,
        cardDetails: {
          cardNumber: validatedData.cardNumber,
          cardHolder: validatedData.cardHolder,
        },
      });

      return res.status(201).json({
        message: 'Payment processed successfully! Policy activated.',
        data: result,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        err.statusCode = 400;
        err.message = err.errors.map((e) => e.message).join(', ');
      }
      next(err);
    }
  }

  /**
   * Get user billing history
   */
  static async getBillingHistory(req, res, next) {
    try {
      const transactions = await PaymentService.getUserBillingHistory(req.user.id);
      return res.json(transactions);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get transaction receipt by ID
   */
  static async getTransactionById(req, res, next) {
    try {
      const transaction = await PaymentService.getTransactionById(req.user.id, req.params.id);
      return res.json(transaction);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = PaymentController;
