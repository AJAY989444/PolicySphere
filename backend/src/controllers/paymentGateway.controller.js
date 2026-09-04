const PaymentGatewayService = require('../services/paymentGateway.service');

class PaymentGatewayController {
  static async checkout(req, res) {
    try {
      const userId = req.user.id;
      const result = await PaymentGatewayService.processGatewayCheckout(userId, req.body);
      res.json({
        success: result.success,
        message: result.success ? 'Payment processed successfully via Gateway' : 'Gateway authorization failed',
        data: result,
      });
    } catch (err) {
      res.status(400).json({ message: err.message || 'Payment processing failed' });
    }
  }

  static async issueRefund(req, res) {
    try {
      const actorId = req.user.id;
      const result = await PaymentGatewayService.processRefund(actorId, req.body);
      res.json({
        success: true,
        message: `Refund of ₹${req.body.amount} processed successfully`,
        data: result,
      });
    } catch (err) {
      res.status(400).json({ message: err.message || 'Failed to process refund' });
    }
  }

  static async triggerReconciliation(req, res) {
    try {
      const report = await PaymentGatewayService.runDailyReconciliation();
      res.json({
        success: true,
        message: 'Daily financial reconciliation audit completed',
        data: report,
      });
    } catch (err) {
      res.status(500).json({ message: err.message || 'Reconciliation execution failed' });
    }
  }

  static async getTransactions(req, res) {
    try {
      const transactions = await PaymentGatewayService.getPaymentTransactions(req.query);
      res.json({ success: true, data: transactions });
    } catch (err) {
      res.status(500).json({ message: err.message || 'Failed to fetch transactions' });
    }
  }

  static async getRefunds(req, res) {
    try {
      const refunds = await PaymentGatewayService.getRefundLogs();
      res.json({ success: true, data: refunds });
    } catch (err) {
      res.status(500).json({ message: err.message || 'Failed to fetch refund logs' });
    }
  }

  static async getReconciliationLogs(req, res) {
    try {
      const logs = await PaymentGatewayService.getReconciliationLogs();
      res.json({ success: true, data: logs });
    } catch (err) {
      res.status(500).json({ message: err.message || 'Failed to fetch reconciliation logs' });
    }
  }

  static async getMetrics(req, res) {
    try {
      const metrics = await PaymentGatewayService.getPaymentMetrics();
      res.json({ success: true, data: metrics });
    } catch (err) {
      res.status(500).json({ message: err.message || 'Failed to fetch payment metrics' });
    }
  }
}

module.exports = PaymentGatewayController;
