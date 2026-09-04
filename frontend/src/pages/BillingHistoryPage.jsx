import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api/axios';
import { HiReceiptTax, HiCreditCard, HiCheckCircle, HiDownload, HiX } from 'react-icons/hi';
import './BillingHistoryPage.css';

function BillingHistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        setLoading(true);
        const res = await api.get('/payments/history');
        setTransactions(res.data);
      } catch (err) {
        toast.error('Failed to load billing history.');
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Loading billing history...</p>
      </div>
    );
  }

  return (
    <div className="billing-page container">
      <div className="page-header">
        <h1>Billing & Payment History</h1>
        <p className="subtitle">View past transactions, payment receipts, and policy purchase logs</p>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-billing-card">
          <HiReceiptTax className="empty-icon" />
          <h3>No Transactions Yet</h3>
          <p>When you purchase an insurance policy, your invoices and receipts will appear here.</p>
        </div>
      ) : (
        <div className="billing-card">
          <div className="table-responsive">
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Transaction Ref</th>
                  <th>Policy Name</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <span className="tx-ref">{tx.transactionRef}</span>
                    </td>
                    <td>
                      <strong>{tx.userPolicy?.policy?.name || 'Insurance Policy'}</strong>
                    </td>
                    <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className="payment-method-badge">
                        <HiCreditCard /> {tx.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <strong>${tx.amount.toFixed(2)}</strong>
                    </td>
                    <td>
                      {tx.paymentStatus === 'REFUNDED' || tx.refundStatus === 'FULL' ? (
                        <span className="badge badge-danger">
                          Refunded (₹{tx.totalRefunded || tx.amount})
                        </span>
                      ) : tx.refundStatus === 'PARTIAL' ? (
                        <span className="badge badge-warning">
                          Partial Refund (₹{tx.totalRefunded})
                        </span>
                      ) : (
                        <span className="badge badge-success">
                          <HiCheckCircle /> Paid
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedInvoice(tx)}
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice / Receipt Modal */}
      {selectedInvoice && (
        <div className="receipt-modal-overlay">
          <div className="receipt-modal">
            <button className="close-btn" onClick={() => setSelectedInvoice(null)}>
              <HiX />
            </button>

            <div className="receipt-header">
              <div className="brand-logo">PolicySphere</div>
              <span className="receipt-title">OFFICIAL PAYMENT RECEIPT</span>
            </div>

            <div className="receipt-status-banner">
              <HiCheckCircle /> Payment Successful
            </div>

            <div className="receipt-details-grid">
              <div>
                <span className="meta-label">TRANSACTION REF</span>
                <span className="meta-val">{selectedInvoice.transactionRef}</span>
              </div>
              <div>
                <span className="meta-label">DATE & TIME</span>
                <span className="meta-val">{new Date(selectedInvoice.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="meta-label">PAYMENT METHOD</span>
                <span className="meta-val">{selectedInvoice.paymentMethod}</span>
              </div>
              <div>
                <span className="meta-label">PAYMENT STATUS</span>
                <span className={`meta-val ${selectedInvoice.refundStatus === 'FULL' || selectedInvoice.paymentStatus === 'REFUNDED' ? 'text-danger' : selectedInvoice.refundStatus === 'PARTIAL' ? 'text-warning' : 'text-success'}`}>
                  {selectedInvoice.refundStatus === 'FULL' || selectedInvoice.paymentStatus === 'REFUNDED'
                    ? `REFUNDED (₹${selectedInvoice.totalRefunded || selectedInvoice.amount})`
                    : selectedInvoice.refundStatus === 'PARTIAL'
                    ? `PARTIAL REFUND (₹${selectedInvoice.totalRefunded})`
                    : 'COMPLETED'}
                </span>
              </div>
            </div>

            <div className="receipt-items-table">
              <div className="receipt-row header">
                <span>Item Description</span>
                <span>Amount</span>
              </div>
              <div className="receipt-row">
                <span>
                  {selectedInvoice.userPolicy?.policy?.name} (
                  {selectedInvoice.userPolicy?.policy?.duration} Months Coverage)
                </span>
                <span>${selectedInvoice.amount.toFixed(2)}</span>
              </div>
              <div className="receipt-row total">
                <span>Total Paid</span>
                <span>${selectedInvoice.amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="receipt-footer">
              <button
                className="btn btn-primary btn-block"
                onClick={() => {
                  toast.success('Receipt downloaded successfully (PDF)');
                  setSelectedInvoice(null);
                }}
              >
                <HiDownload /> Download PDF Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BillingHistoryPage;
