import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  fetchPaymentTransactions,
  fetchRefundLogs,
  processRefundRequest,
  fetchReconciliationLogs,
  triggerReconciliationRun,
  fetchPaymentMetrics,
} from '../services/api/paymentEngineApi';
import {
  HiCreditCard,
  HiRefresh,
  HiShieldCheck,
  HiExclamationCircle,
  HiCheckCircle,
  HiSearch,
  HiFilter,
  HiCash,
  HiDocumentReport,
  HiTerminal,
  HiX,
} from 'react-icons/hi';
import './PaymentReconciliationPage.css';

function PaymentReconciliationPage() {
  const [activeTab, setActiveTab] = useState('TRANSACTIONS'); // TRANSACTIONS, RECONCILIATION, WEBHOOKS
  const [metrics, setMetrics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [reconciliationLogs, setReconciliationLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Refund Modal State
  const [selectedTxnForRefund, setSelectedTxnForRefund] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('CUSTOMER_REQUEST');
  const [refundNotes, setRefundNotes] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);

  // Reconciliation Running State
  const [runningReconciliation, setRunningReconciliation] = useState(false);

  useEffect(() => {
    loadData();
  }, [gatewayFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsRes, txnsRes, refundsRes, recRes] = await Promise.all([
        fetchPaymentMetrics(),
        fetchPaymentTransactions({ gateway: gatewayFilter, status: statusFilter, search }),
        fetchRefundLogs(),
        fetchReconciliationLogs(),
      ]);

      if (metricsRes.success) setMetrics(metricsRes.data);
      if (txnsRes.success) setTransactions(txnsRes.data);
      if (refundsRes.success) setRefunds(refundsRes.data);
      if (recRes.success) setReconciliationLogs(recRes.data);
    } catch (err) {
      toast.error('Failed to load payment engine metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenRefundModal = (txn) => {
    setSelectedTxnForRefund(txn);
    const available = txn.amount - (txn.totalRefunded || 0);
    setRefundAmount(available.toString());
    setRefundReason('CUSTOMER_REQUEST');
    setRefundNotes('');
  };

  const handleIssueRefundSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTxnForRefund) return;

    try {
      setProcessingRefund(true);
      const payload = {
        transactionId: selectedTxnForRefund.id,
        amount: parseFloat(refundAmount),
        reason: refundReason,
        notes: refundNotes,
      };

      const res = await processRefundRequest(payload);
      toast.success(res.message || 'Refund processed successfully!');
      setSelectedTxnForRefund(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process refund');
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleRunReconciliation = async () => {
    try {
      setRunningReconciliation(true);
      const res = await triggerReconciliationRun();
      toast.success('Daily Financial Reconciliation Audit completed!');
      loadData();
    } catch (err) {
      toast.error('Failed to execute reconciliation run');
    } finally {
      setRunningReconciliation(false);
    }
  };

  return (
    <div className="reconciliation-page">
      {/* Page Header */}
      <div className="reconciliation-header">
        <div>
          <div className="header-badge">
            <HiShieldCheck /> Enterprise Payment Engine & Reconciliation
          </div>
          <h1>Payments, Refunds & Audit Ledgers</h1>
          <p>Manage multi-gateway transactions, execute instant customer refunds, and run nightly financial reconciliation audits.</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={loadData} title="Reload Financial Data">
            <HiRefresh className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button
            className="btn-trigger-rec"
            onClick={handleRunReconciliation}
            disabled={runningReconciliation}
          >
            <HiDocumentReport /> {runningReconciliation ? 'Reconciling...' : '⚡ Run Daily Audit'}
          </button>
        </div>
      </div>

      {/* Metrics Highlights Cards */}
      <div className="payment-metrics-grid">
        <div className="pay-metric-card">
          <div className="pay-icon-box icon-indigo"><HiCash /></div>
          <div className="pay-metric-info">
            <label>Total Processed Volume</label>
            <h3>₹{(metrics?.totalRevenue || 0).toLocaleString()}</h3>
            <span>{metrics?.totalTxns || 0} Total Transactions</span>
          </div>
        </div>

        <div className="pay-metric-card">
          <div className="pay-icon-box icon-rose"><HiExclamationCircle /></div>
          <div className="pay-metric-info">
            <label>Total Refunds Issued</label>
            <h3>₹{(metrics?.totalRefundsAmount || 0).toLocaleString()}</h3>
            <span>{metrics?.totalRefundsCount || 0} Refund Records</span>
          </div>
        </div>

        <div className="pay-metric-card">
          <div className="pay-icon-box icon-emerald"><HiCreditCard /></div>
          <div className="pay-metric-info">
            <label>Gateway Breakdown</label>
            <h3>
              {metrics?.gatewayBreakdown?.RAZORPAY || 0} Razorpay / {metrics?.gatewayBreakdown?.STRIPE || 0} Stripe
            </h3>
            <span>{metrics?.gatewayBreakdown?.UPI_AUTOPAY || 0} UPI AutoPay</span>
          </div>
        </div>

        <div className="pay-metric-card">
          <div className="pay-icon-box icon-amber"><HiCheckCircle /></div>
          <div className="pay-metric-info">
            <label>Latest Audit Run</label>
            <h3>{metrics?.latestReconciliation?.status || 'OPTIMAL'}</h3>
            <span>Ref: {metrics?.latestReconciliation?.reconciliationRef || 'REC-INITIAL'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="reconciliation-tab-bar">
        <button
          className={`rec-tab-btn ${activeTab === 'TRANSACTIONS' ? 'active' : ''}`}
          onClick={() => setActiveTab('TRANSACTIONS')}
        >
          <HiCreditCard /> Transactions & Refund Hub ({transactions.length})
        </button>
        <button
          className={`rec-tab-btn ${activeTab === 'RECONCILIATION' ? 'active' : ''}`}
          onClick={() => setActiveTab('RECONCILIATION')}
        >
          <HiDocumentReport /> Reconciliation Logs ({reconciliationLogs.length})
        </button>
        <button
          className={`rec-tab-btn ${activeTab === 'WEBHOOKS' ? 'active' : ''}`}
          onClick={() => setActiveTab('WEBHOOKS')}
        >
          <HiTerminal /> Gateway Webhook Feed
        </button>
      </div>

      {/* TAB 1: TRANSACTIONS & REFUNDS */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="tab-pane">
          {/* Controls Bar */}
          <form className="pay-controls-bar" onSubmit={handleSearchSubmit}>
            <div className="search-box">
              <HiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search transaction ref, gateway ID, user email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <select value={gatewayFilter} onChange={(e) => setGatewayFilter(e.target.value)}>
                <option value="ALL">All Gateways</option>
                <option value="RAZORPAY">Razorpay</option>
                <option value="STRIPE">Stripe</option>
                <option value="UPI_AUTOPAY">UPI AutoPay</option>
                <option value="NET_BANKING">Net Banking</option>
              </select>

              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All Payment Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>

              <button type="submit" className="btn-filter-apply">
                <HiFilter /> Apply
              </button>
            </div>
          </form>

          {/* Transactions Table */}
          <div className="table-wrapper">
            <table className="rec-table">
              <thead>
                <tr>
                  <th>Txn Reference & Date</th>
                  <th>Customer & Policy</th>
                  <th>Gateway & Method</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Refund Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      No payment transactions found matching current filters.
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => {
                    const availableRefund = txn.amount - (txn.totalRefunded || 0);
                    return (
                      <tr key={txn.id}>
                        <td>
                          <div className="txn-ref-cell">
                            <strong>{txn.transactionRef}</strong>
                            <span>{new Date(txn.createdAt).toLocaleString()}</span>
                            {txn.gatewayTxnId && <code className="gw-txn-code">{txn.gatewayTxnId}</code>}
                          </div>
                        </td>

                        <td>
                          <div className="user-policy-cell">
                            <strong>{txn.user?.firstName} {txn.user?.lastName}</strong>
                            <span>{txn.user?.email}</span>
                            <span className="policy-name-tag">{txn.userPolicy?.policy?.name || 'General Premium'}</span>
                          </div>
                        </td>

                        <td>
                          <span className={`gw-badge gw-${txn.paymentGateway?.toLowerCase()}`}>
                            {txn.paymentGateway}
                          </span>
                          <div className="method-sub">{txn.paymentMethod}</div>
                        </td>

                        <td>
                          <strong className="amount-val">₹{txn.amount.toLocaleString()}</strong>
                        </td>

                        <td>
                          <span className={`status-pill status-${txn.paymentStatus?.toLowerCase()}`}>
                            {txn.paymentStatus}
                          </span>
                        </td>

                        <td>
                          <span className={`refund-pill refund-${txn.refundStatus?.toLowerCase()}`}>
                            {txn.refundStatus}
                            {txn.totalRefunded > 0 && ` (₹${txn.totalRefunded})`}
                          </span>
                        </td>

                        <td>
                          {txn.paymentStatus === 'SUCCESS' && availableRefund > 0 ? (
                            <button
                              className="btn-refund-action"
                              onClick={() => handleOpenRefundModal(txn)}
                            >
                              💸 Issue Refund
                            </button>
                          ) : (
                            <span className="no-action-text">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RECONCILIATION LOGS */}
      {activeTab === 'RECONCILIATION' && (
        <div className="tab-pane">
          <div className="reconciliation-history-feed">
            {reconciliationLogs.length === 0 ? (
              <div className="empty-card">No financial reconciliation audits recorded yet. Click "Run Daily Audit" above.</div>
            ) : (
              reconciliationLogs.map((log) => (
                <div key={log.id} className="rec-log-card">
                  <div className="rec-log-header">
                    <div>
                      <span className="rec-ref-badge">{log.reconciliationRef}</span>
                      <h4>Audit Run - {new Date(log.runDate).toLocaleString()}</h4>
                    </div>
                    <span className={`status-pill status-${log.status === 'SUCCESS' ? 'success' : 'failed'}`}>
                      {log.status}
                    </span>
                  </div>

                  <div className="rec-log-body">
                    <div className="rec-stat-box">
                      <label>Total Audited Txns</label>
                      <strong>{log.totalTransactions}</strong>
                    </div>
                    <div className="rec-stat-box">
                      <label>Total Audited Volume</label>
                      <strong>₹{log.totalAmount.toLocaleString()}</strong>
                    </div>
                    <div className="rec-stat-box">
                      <label>Ledger Matches</label>
                      <strong style={{ color: '#059669' }}>{log.matchedCount}</strong>
                    </div>
                    <div className="rec-stat-box">
                      <label>Discrepancy Flags</label>
                      <strong style={{ color: log.discrepancyCount > 0 ? '#dc2626' : '#64748b' }}>
                        {log.discrepancyCount}
                      </strong>
                    </div>
                  </div>

                  {log.reportSummary?.gatewayLedgerMatchRate && (
                    <div className="rec-log-footer">
                      <span>Gateway Match Rate: <strong>{log.reportSummary.gatewayLedgerMatchRate}</strong></span>
                      <span>Verified at: {new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: WEBHOOK LOGS */}
      {activeTab === 'WEBHOOKS' && (
        <div className="tab-pane">
          <div className="webhook-feed-box">
            <div className="webhook-log-item">
              <div className="wh-header">
                <span className="wh-event">payment.captured</span>
                <span className="wh-time">2 mins ago</span>
              </div>
              <pre className="wh-code">
{`{
  "event": "payment.captured",
  "gateway": "RAZORPAY",
  "entity": {
    "id": "pay_Kx9281a9x",
    "amount": 1450000,
    "currency": "INR",
    "status": "captured",
    "method": "card"
  }
}`}
              </pre>
            </div>

            <div className="webhook-log-item">
              <div className="wh-header">
                <span className="wh-event">refund.processed</span>
                <span className="wh-time">15 mins ago</span>
              </div>
              <pre className="wh-code">
{`{
  "event": "refund.processed",
  "gateway": "STRIPE",
  "entity": {
    "id": "rfd_921a8x31",
    "payment_id": "pay_Stripe8192",
    "amount": 250000,
    "status": "succeeded"
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {selectedTxnForRefund && (
        <div className="modal-overlay">
          <div className="refund-modal-card">
            <div className="modal-header">
              <h2>💸 Issue Customer Refund</h2>
              <button className="btn-close" onClick={() => setSelectedTxnForRefund(null)}>
                <HiX />
              </button>
            </div>

            <form onSubmit={handleIssueRefundSubmit} className="refund-modal-body">
              <div className="txn-refund-summary">
                <div>
                  <label>TRANSACTION REF</label>
                  <strong>{selectedTxnForRefund.transactionRef}</strong>
                </div>
                <div>
                  <label>MAX REFUNDABLE BALANCE</label>
                  <strong style={{ color: '#059669' }}>
                    ₹{(selectedTxnForRefund.amount - (selectedTxnForRefund.totalRefunded || 0)).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className="form-group">
                <label>Refund Amount (₹):</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedTxnForRefund.amount - (selectedTxnForRefund.totalRefunded || 0)}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Select Refund Reason (IRDAI Compliance Code):</label>
                <select value={refundReason} onChange={(e) => setRefundReason(e.target.value)}>
                  <option value="CUSTOMER_REQUEST">Customer Request (Free Look Period Cancellation)</option>
                  <option value="UNDERWRITING_REJECTED">Proposal Declined by Underwriting</option>
                  <option value="DUPLICATE_PAYMENT">Duplicate Gateway Charge</option>
                  <option value="CANCELLED_POLICY">Policy Cancellation & Endorsement</option>
                  <option value="OVERPAYMENT">Excess Premium Adjustment</option>
                </select>
              </div>

              <div className="form-group">
                <label>Underwriter / Financial Justification Notes:</label>
                <textarea
                  rows="3"
                  placeholder="Enter audit notes for issuing this refund..."
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                ></textarea>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setSelectedTxnForRefund(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit-refund" disabled={processingRefund}>
                  {processingRefund ? 'Processing Refund...' : 'Confirm & Process Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentReconciliationPage;
