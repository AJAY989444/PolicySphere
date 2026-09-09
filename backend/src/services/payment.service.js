const prisma = require('../config/db');
const NotificationService = require('./notification.service');

class PaymentService {
  /**
   * Process policy checkout payment.
   * Creates a PaymentTransaction, activates the UserPolicy, and records the purchase.
   */
  static async checkout({ userId, policyId, paymentMethod, cardDetails }) {
    // 1. Verify policy exists and is active
    const policy = await prisma.insurancePolicy.findUnique({
      where: { id: policyId },
    });

    if (!policy || !policy.isActive) {
      const error = new Error('Policy is not available for purchase.');
      error.statusCode = 404;
      throw error;
    }

    // 2. Check if user already has an active subscription to this policy
    const existingActive = await prisma.userPolicy.findFirst({
      where: {
        userId,
        policyId,
        status: 'ACTIVE',
      },
    });

    if (existingActive) {
      const error = new Error('You already have an active subscription to this policy.');
      error.statusCode = 409;
      throw error;
    }

    // 3. Calculate start and end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + policy.duration);

    // 4. Generate unique transaction reference ID
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const transactionRef = `TXN-${randomCode}`;

    // 5. Execute transaction in Prisma with extended timeout
    const result = await prisma.$transaction(
      async (tx) => {
        // Create UserPolicy subscription
        const userPolicy = await tx.userPolicy.create({
          data: {
            userId,
            policyId,
            status: 'ACTIVE',
            startDate,
            endDate,
            premiumPaid: policy.premium,
          },
          include: {
            policy: true,
          },
        });

        // Create PaymentTransaction
        const transaction = await tx.paymentTransaction.create({
          data: {
            userId,
            userPolicyId: userPolicy.id,
            amount: policy.premium,
            currency: 'INR',
            paymentMethod: paymentMethod || 'CARD',
            paymentStatus: 'SUCCESS',
            transactionRef,
          },
        });

        return { userPolicy, transaction };
      },
      { timeout: 15000 }
    );

    // Trigger Multi-Channel Notifications for Purchase and Payment Success (Email, SMS, WhatsApp, Push, In-App)
    try {
      await NotificationService.dispatchMultiChannelEvent({
        userId,
        eventType: 'PURCHASE',
        data: {
          policyName: policy.name,
          provider: policy.provider,
          policyNumber: result.userPolicy.policyNumber,
          coverageAmount: policy.coverageAmount,
          premium: policy.premium,
          transactionRef,
          amount: policy.premium,
          paymentMethod,
        },
      });

      await NotificationService.dispatchMultiChannelEvent({
        userId,
        eventType: 'PAYMENT_SUCCESS',
        data: {
          policyName: policy.name,
          amount: policy.premium,
          transactionRef,
          paymentMethod,
        },
      });
    } catch (notifErr) {
      console.warn('Failed to dispatch purchase notifications:', notifErr.message);
    }

    return result;
  }

  /**
   * Get transaction billing history for a user.
   */
  static async getUserBillingHistory(userId) {
    return prisma.paymentTransaction.findMany({
      where: { userId },
      include: {
        userPolicy: {
          include: {
            policy: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single transaction receipt.
   */
  static async getTransactionById(userId, transactionId) {
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        userPolicy: {
          include: {
            policy: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!transaction || transaction.userId !== userId) {
      const error = new Error('Transaction record not found.');
      error.statusCode = 404;
      throw error;
    }

    return transaction;
  }
}

module.exports = PaymentService;
