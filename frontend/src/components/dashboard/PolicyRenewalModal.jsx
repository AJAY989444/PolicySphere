import React, { useState, useEffect } from 'react';
import { HiX, HiRefresh, HiSparkles, HiCheckCircle, HiShieldCheck } from 'react-icons/hi';
import api from '../../services/api/axios';
import './PolicyRenewalModal.css';

function PolicyRenewalModal({ isOpen, onClose, userPolicy, onRenewSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSuccessData(null);
      setError('');
      setLoading(false);
    }
  }, [isOpen, userPolicy]);

  const handleCloseModal = () => {
    setSuccessData(null);
    setError('');
    onClose();
  };

  if (!isOpen || !userPolicy) return null;

  // Calculate projected renewal discount
  const basePremium = userPolicy.policy.premium;
  const ncbRate = 15; // 15% No-Claim-Bonus discount
  const discount = (basePremium * ncbRate) / 100;
  const finalAmount = basePremium - discount;

  const handleConfirmRenewal = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post(`/policies/my-policies/${userPolicy.id}/renew`);
      setSuccessData(response.data);
      if (onRenewSuccess) {
        onRenewSuccess();
      }
    } catch (err) {
      console.error('Renewal error:', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to process renewal.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt);
  };

  return (
    <div className="modal-backdrop" onClick={handleCloseModal}>
      <div className="renewal-modal-content animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="renewal-modal-header">
          <div className="renewal-header-title">
            <HiRefresh className="spin-slow text-primary" size={24} />
            <div>
              <h3>1-Click Policy Renewal</h3>
              <span className="sub">Extend coverage & claim No-Claim Bonus</span>
            </div>
          </div>
          <button className="close-btn" onClick={handleCloseModal}>
            <HiX />
          </button>
        </div>

        {/* Modal Body */}
        {successData ? (
          <div className="renewal-success-body">
            <div className="success-icon">
              <HiCheckCircle size={56} />
            </div>
            <h2>Policy Renewed Successfully! 🎉</h2>
            <p>Your policy has been extended for another 12 months.</p>

            <div className="renewal-receipt-box">
              <div className="receipt-row">
                <span>Policy Name:</span>
                <strong>{userPolicy.policy.name}</strong>
              </div>
              <div className="receipt-row">
                <span>New Expiry Date:</span>
                <strong className="text-success">{formatDate(successData.extendedUntil)}</strong>
              </div>
              <div className="receipt-row">
                <span>NCB Savings:</span>
                <strong className="text-accent">{formatCurrency(successData.discountAmount)} Saved (15%)</strong>
              </div>
              <div className="receipt-row">
                <span>Renewal Paid:</span>
                <strong>{formatCurrency(successData.finalRenewalPremium)}</strong>
              </div>
            </div>

            <button className="btn btn-primary w-full" onClick={handleCloseModal}>
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="renewal-modal-body">
            {error && <div className="alert alert-error mb-4">{error}</div>}

            {/* Policy Summary Header */}
            <div className="policy-summary-card">
              <span className="badge badge-primary">{userPolicy.policy.category}</span>
              <h4>{userPolicy.policy.name}</h4>
              <p className="provider">Underwritten by {userPolicy.policy.provider}</p>
            </div>

            {/* NCB Savings Banner */}
            <div className="ncb-banner">
              <div className="ncb-icon">
                <HiSparkles size={28} />
              </div>
              <div>
                <h5>15% No-Claim Bonus (NCB) Discount Applied!</h5>
                <p>Because you maintained 0 claims on this policy, you automatically qualify for 15% renewal savings!</p>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="cost-breakdown-box">
              <div className="cost-row">
                <span>Standard Base Annual Premium</span>
                <span>{formatCurrency(basePremium)}</span>
              </div>
              <div className="cost-row discount">
                <span>No-Claim Bonus (NCB) Discount (15%)</span>
                <span className="discount-val">-{formatCurrency(discount)}</span>
              </div>
              <div className="cost-divider"></div>
              <div className="cost-row total">
                <span>Final Renewal Amount</span>
                <span className="total-val">{formatCurrency(finalAmount)}</span>
              </div>
            </div>

            {/* Renewal Schedule Dates */}
            <div className="date-schedule-box">
              <div>
                <span className="lbl">Current Expiry:</span>
                <strong>{formatDate(userPolicy.endDate)}</strong>
              </div>
              <div className="arrow">➔</div>
              <div>
                <span className="lbl">New Expiry:</span>
                <strong className="text-primary">
                  {formatDate(new Date(new Date(userPolicy.endDate).setMonth(new Date(userPolicy.endDate).getMonth() + userPolicy.policy.duration)))}
                </strong>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="renewal-modal-actions">
              <button className="btn btn-secondary" onClick={handleCloseModal} disabled={loading}>
                Cancel
              </button>
              <button className="btn btn-primary btn-renew-action" onClick={handleConfirmRenewal} disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner spinner-sm"></div> Renewing...
                  </>
                ) : (
                  <>
                    <HiShieldCheck /> Confirm & Renew for {formatCurrency(finalAmount)}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PolicyRenewalModal;
