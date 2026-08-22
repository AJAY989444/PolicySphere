const prisma = require('../config/db');

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

    // 5. Execute transaction in Prisma
    return prisma.$transaction(async (tx) => {
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
          currency: 'USD',
          paymentMethod: paymentMethod || 'CARD',
          paymentStatus: 'SUCCESS',
          transactionRef,
        },
      });

      // Trigger In-App Notification (SRS 14)
      await tx.notification.create({
        data: {
          userId,
          title: 'Policy Purchased Successfully',
          message: `Your payment of $${policy.premium.toLocaleString()} for ${policy.name} was successful. Transaction Ref: ${transactionRef}`,
          type: 'PAYMENT_SUCCESS',
          linkUrl: '/dashboard',
        },
      });

      return {
        userPolicy,
        transaction,
      };
    });
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
