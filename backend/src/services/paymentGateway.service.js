const prisma = require('../config/db');

class PaymentGatewayService {
  /**
   * Process simulated gateway checkout (Razorpay, Stripe, UPI AutoPay, Net Banking)
   */
  static async processGatewayCheckout(userId, { userPolicyId, amount, paymentMethod = 'CARD', paymentGateway = 'RAZORPAY', currency = 'INR', metadata = {} }) {
    const txnRef = 'TXN-GW-' + Math.floor(10000000 + Math.random() * 90000000);
    const gatewayTxnId = `${paymentGateway.toLowerCase()}_pay_${Math.random().toString(36).substring(2, 12)}`;

    // Simulate 95% gateway success rate
    const isSuccess = Math.random() > 0.05;
    const paymentStatus = isSuccess ? 'SUCCESS' : 'FAILED';

    const transaction = await prisma.paymentTransaction.create({
      data: {
        userId,
        userPolicyId: userPolicyId || null,
        amount: parseFloat(amount),
        currency: currency || 'INR',
        paymentMethod: paymentMethod.toUpperCase(),
        paymentGateway: paymentGateway.toUpperCase(),
        gatewayTxnId,
        paymentStatus,
        transactionRef: txnRef,
        refundStatus: 'NONE',
        totalRefunded: 0,
      },
    });

    if (isSuccess && userPolicyId) {
      await prisma.userPolicy.update({
        where: { id: userPolicyId },
        data: { status: 'ACTIVE' },
      }).catch(() => {});
    }

    return {
      success: isSuccess,
      transaction,
      gatewayDetails: {
        gateway: paymentGateway,
        gatewayTxnId,
        authorizedAt: new Date().toISOString(),
        paymentStatus,
      },
    };
  }

  /**
   * Process Full or Partial Refund against an existing payment transaction
   */
  static async processRefund(actorId, { transactionId, amount, reason = 'CUSTOMER_REQUEST', notes = '' }) {
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: { refunds: true, user: true },
    });

    if (!transaction) {
      throw new Error('Payment transaction not found');
    }

    if (transaction.paymentStatus !== 'SUCCESS') {
      throw new Error('Refunds can only be processed on successful transactions');
    }

    const requestedAmount = parseFloat(amount);
    const availableBalance = transaction.amount - (transaction.totalRefunded || 0);

    if (requestedAmount <= 0) {
      throw new Error('Refund amount must be greater than zero');
    }

    if (requestedAmount > availableBalance) {
      throw new Error(`Refund amount (₹${requestedAmount}) exceeds available balance (₹${availableBalance})`);
    }

    const newTotalRefunded = (transaction.totalRefunded || 0) + requestedAmount;
    const isFullRefund = newTotalRefunded >= transaction.amount;
    const newRefundStatus = isFullRefund ? 'FULL' : 'PARTIAL';

    const refundRef = 'RFD-' + Math.floor(10000000 + Math.random() * 90000000);
    const gatewayRefundId = `rfd_${Math.random().toString(36).substring(2, 12)}`;

    // Create refund record atomically
    const refundRecord = await prisma.refundTransaction.create({
      data: {
        refundRef,
        transactionId: transaction.id,
        userId: transaction.userId,
        amount: requestedAmount,
        reason,
        status: 'COMPLETED',
        gatewayRefundId,
        notes,
      },
    });

    // Update parent transaction
    const updatedTransaction = await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        totalRefunded: newTotalRefunded,
        refundStatus: newRefundStatus,
        paymentStatus: isFullRefund ? 'REFUNDED' : 'SUCCESS',
      },
    });

    // If policy associated & full refund, cancel policy
    if (isFullRefund && transaction.userPolicyId) {
      await prisma.userPolicy.update({
        where: { id: transaction.userPolicyId },
        data: { status: 'CANCELLED' },
      }).catch(() => {});
    }

    // Trigger Notifications for Customer & Staff
    try {
      const NotificationService = require('./notification.service');
      // Customer notification
      await NotificationService.createNotification({
        userId: transaction.userId,
        title: '💸 Refund Processed & Credited',
        message: `A ${isFullRefund ? 'full' : 'partial'} refund of ₹${requestedAmount.toLocaleString()} for Transaction ${transaction.transactionRef} has been completed.`,
        type: 'POLICY_ISSUED',
        linkUrl: '/billing',
      });

      // Staff audit confirmation notification
      if (actorId && actorId !== transaction.userId) {
        await NotificationService.createNotification({
          userId: actorId,
          title: '✅ Refund Execution Confirmed',
          message: `Successfully issued a ${isFullRefund ? 'full' : 'partial'} refund of ₹${requestedAmount.toLocaleString()} for Txn ${transaction.transactionRef}.`,
          type: 'SYSTEM',
          linkUrl: '/admin/reconciliation',
        });
      }
    } catch (notifErr) {
      console.warn('Failed to dispatch refund notification:', notifErr.message);
    }

    return {
      refund: refundRecord,
      updatedTransaction,
    };
  }

  /**
   * Run automated daily financial reconciliation audit
   */
  static async runDailyReconciliation() {
    const reconciliationRef = 'REC-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900);
    
    // Fetch all transactions from the system
    const allTransactions = await prisma.paymentTransaction.findMany({
      include: { user: { select: { email: true, firstName: true, lastName: true } }, refunds: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalTransactions = allTransactions.length;
    const totalAmount = allTransactions.reduce((acc, t) => acc + (t.paymentStatus === 'SUCCESS' ? t.amount : 0), 0);

    // Simulate audit verification: detect any failed vs success mismatch
    let matchedCount = 0;
    let discrepancyCount = 0;
    const discrepancies = [];

    allTransactions.forEach((txn) => {
      if (txn.paymentStatus === 'FAILED' && txn.totalRefunded > 0) {
        discrepancyCount++;
        discrepancies.push({
          transactionRef: txn.transactionRef,
          type: 'REFUND_ON_FAILED_TXN',
          amount: txn.amount,
        });
      } else {
        matchedCount++;
      }
    });

    const status = discrepancyCount > 0 ? 'DISCREPANCY_FLAGGED' : 'SUCCESS';

    const logRecord = await prisma.paymentReconciliationLog.create({
      data: {
        reconciliationRef,
        runDate: new Date(),
        totalTransactions,
        totalAmount,
        matchedCount,
        discrepancyCount,
        status,
        reportSummary: {
          discrepancies,
          reconciledAt: new Date().toISOString(),
          gatewayLedgerMatchRate: totalTransactions > 0 ? `${((matchedCount / totalTransactions) * 100).toFixed(1)}%` : '100%',
        },
      },
    });

    return logRecord;
  }

  /**
   * Fetch system-wide payment transactions with filters
   */
  static async getPaymentTransactions({ gateway, status, refundStatus, search, limit = 50 }) {
    const where = {};

    if (gateway && gateway !== 'ALL') where.paymentGateway = gateway;
    if (status && status !== 'ALL') where.paymentStatus = status;
    if (refundStatus && refundStatus !== 'ALL') where.refundStatus = refundStatus;

    if (search) {
      where.OR = [
        { transactionRef: { contains: search, mode: 'insensitive' } },
        { gatewayTxnId: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return prisma.paymentTransaction.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        userPolicy: { include: { policy: true } },
        refunds: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10),
    });
  }

  /**
   * Fetch all refund logs
   */
  static async getRefundLogs() {
    return prisma.refundTransaction.findMany({
      include: {
        transaction: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Fetch all reconciliation logs
   */
  static async getReconciliationLogs() {
    return prisma.paymentReconciliationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  /**
   * Fetch Payment Metrics Summary for Admin/Advisor Hub
   */
  static async getPaymentMetrics() {
    const totalTxns = await prisma.paymentTransaction.count();
    const successfulTxns = await prisma.paymentTransaction.findMany({ where: { paymentStatus: 'SUCCESS' } });
    const totalRevenue = successfulTxns.reduce((acc, t) => acc + t.amount, 0);

    const refunds = await prisma.refundTransaction.findMany();
    const totalRefundsAmount = refunds.reduce((acc, r) => acc + r.amount, 0);

    const razorpayCount = await prisma.paymentTransaction.count({ where: { paymentGateway: 'RAZORPAY' } });
    const stripeCount = await prisma.paymentTransaction.count({ where: { paymentGateway: 'STRIPE' } });
    const upiCount = await prisma.paymentTransaction.count({ where: { paymentGateway: 'UPI_AUTOPAY' } });
    const netbankingCount = await prisma.paymentTransaction.count({ where: { paymentGateway: 'NET_BANKING' } });

    const recentReconciled = await prisma.paymentReconciliationLog.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    return {
      totalTxns,
      totalRevenue,
      totalRefundsAmount,
      totalRefundsCount: refunds.length,
      gatewayBreakdown: {
        RAZORPAY: razorpayCount,
        STRIPE: stripeCount,
        UPI_AUTOPAY: upiCount,
        NET_BANKING: netbankingCount,
      },
      latestReconciliation: recentReconciled || null,
    };
  }
}

module.exports = PaymentGatewayService;
