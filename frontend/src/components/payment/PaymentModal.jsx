import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api/axios';
import { processGatewayCheckout } from '../../services/api/paymentEngineApi';
import { HiCreditCard, HiX, HiCheckCircle, HiLockClosed, HiShieldCheck, HiQrcode, HiCalculator } from 'react-icons/hi';
import './PaymentModal.css';

function PaymentModal({ policy, isOpen, onClose, onSuccess }) {
  const [gateway, setGateway] = useState('RAZORPAY');
  const [method, setMethod] = useState('CARD');
  const [emiTenure, setEmiTenure] = useState(6);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      cardNumber: '4242 •••• •••• 4242',
      cardHolder: 'John Doe',
      expiryDate: '12/28',
      cvv: '123',
      upiId: 'john.doe@upi',
    },
  });

  const cardNumber = watch('cardNumber') || '•••• •••• •••• ••••';
  const cardHolder = watch('cardHolder') || 'YOUR NAME';
  const expiryDate = watch('expiryDate') || 'MM/YY';

  if (!isOpen || !policy) return null;

  const totalAmount = policy.customPremium || policy.premium;
  const emiPerMonth = Math.round((totalAmount * 1.08) / emiTenure);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const payload = {
        policyId: policy.id,
        paymentMethod: method,
        paymentGateway: gateway,
        amount: totalAmount,
        cardNumber: data.cardNumber,
        cardHolder: data.cardHolder,
        expiryDate: data.expiryDate,
        cvv: data.cvv,
        upiId: data.upiId,
        emiTenure: method === 'EMI' ? emiTenure : undefined,
      };

      // Call primary backend payment endpoint (which creates user policy & transaction)
      const res = await api.post('/payments/checkout', payload);
      toast.success(res.data.message || 'Payment Authorized via Gateway!');
      onSuccess(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <button className="close-btn" onClick={onClose}>
          <HiX />
        </button>

        <div className="modal-header">
          <div className="security-tag">
            <HiLockClosed /> 256-Bit Encrypted Multi-Gateway Engine
          </div>
          <h2>Complete Your Purchase</h2>
          <p className="policy-summary-title">
            Subscription for <strong>{policy.name}</strong> ({policy.provider})
          </p>
        </div>

        {/* Gateway Selection */}
        <div className="gateway-selector-box">
          <label className="gw-label">SELECT PAYMENT GATEWAY:</label>
          <div className="gw-options">
            <button
              type="button"
              className={`gw-btn ${gateway === 'RAZORPAY' ? 'active' : ''}`}
              onClick={() => setGateway('RAZORPAY')}
            >
              <span className="gw-dot"></span> Razorpay
            </button>
            <button
              type="button"
              className={`gw-btn ${gateway === 'STRIPE' ? 'active' : ''}`}
              onClick={() => setGateway('STRIPE')}
            >
              <span className="gw-dot"></span> Stripe
            </button>
            <button
              type="button"
              className={`gw-btn ${gateway === 'UPI_AUTOPAY' ? 'active' : ''}`}
              onClick={() => {
                setGateway('UPI_AUTOPAY');
                setMethod('UPI');
              }}
            >
              <span className="gw-dot"></span> UPI AutoPay
            </button>
          </div>
        </div>

        {/* Live Visual Card */}
        {method === 'CARD' && (
          <div className="credit-card-preview">
            <div className="card-chip"></div>
            <div className="card-logo">{gateway} Gateway</div>
            <div className="card-number">{cardNumber}</div>
            <div className="card-footer">
              <div>
                <span className="card-label">CARD HOLDER</span>
                <span className="card-val">{cardHolder.toUpperCase()}</span>
              </div>
              <div>
                <span className="card-label">EXPIRES</span>
                <span className="card-val">{expiryDate}</span>
              </div>
            </div>
          </div>
        )}

        {/* Method Selector Tabs */}
        <div className="payment-method-tabs">
          <button
            type="button"
            className={`tab-btn ${method === 'CARD' ? 'active' : ''}`}
            onClick={() => setMethod('CARD')}
          >
            <HiCreditCard /> Card
          </button>
          <button
            type="button"
            className={`tab-btn ${method === 'UPI' ? 'active' : ''}`}
            onClick={() => setMethod('UPI')}
          >
            <HiQrcode /> UPI / AutoPay
          </button>
          <button
            type="button"
            className={`tab-btn ${method === 'EMI' ? 'active' : ''}`}
            onClick={() => setMethod('EMI')}
          >
            <HiCalculator /> Easy EMI
          </button>
          <button
            type="button"
            className={`tab-btn ${method === 'NET_BANKING' ? 'active' : ''}`}
            onClick={() => setMethod('NET_BANKING')}
          >
            Net Banking
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {method === 'CARD' && (
            <div className="form-fields">
              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  className={`input ${errors.cardNumber ? 'input-error' : ''}`}
                  maxLength="19"
                  {...register('cardNumber', { required: 'Card number is required' })}
                />
              </div>

              <div className="form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  className={`input ${errors.cardHolder ? 'input-error' : ''}`}
                  {...register('cardHolder', { required: 'Cardholder name is required' })}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="MM/YY"
                    maxLength="5"
                    {...register('expiryDate')}
                  />
                </div>
                <div className="form-group">
                  <label>CVV / CVC</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="123"
                    maxLength="4"
                    {...register('cvv')}
                  />
                </div>
              </div>
            </div>
          )}

          {method === 'UPI' && (
            <div className="upi-qr-box">
              <div className="qr-preview-wrapper">
                <div className="qr-code-placeholder">
                  <HiQrcode className="qr-icon" />
                  <span>Scan QR via GPay / PhonePe / Paytm</span>
                </div>
              </div>
              <div className="form-group" style={{ width: '100%' }}>
                <label>Or enter VPA / UPI ID:</label>
                <input
                  type="text"
                  className="input"
                  placeholder="name@upi"
                  {...register('upiId')}
                />
              </div>
            </div>
          )}

          {method === 'EMI' && (
            <div className="emi-calculator-box">
              <label>Select EMI Tenure (No Cost / Standard EMI):</label>
              <div className="tenure-pills">
                {[3, 6, 12].map((months) => (
                  <button
                    key={months}
                    type="button"
                    className={`tenure-pill ${emiTenure === months ? 'active' : ''}`}
                    onClick={() => setEmiTenure(months)}
                  >
                    {months} Months
                    <span>₹{Math.round((totalAmount * 1.08) / months)}/mo</span>
                  </button>
                ))}
              </div>
              <div className="emi-breakdown-note">
                Total Payable: ₹{Math.round(totalAmount * 1.08).toLocaleString()} (incl. 8% p.a interest).
              </div>
            </div>
          )}

          {method === 'NET_BANKING' && (
            <div className="alternative-payment-box">
              <HiShieldCheck className="alt-icon" />
              <p>You will be securely redirected to HDFC / ICICI / SBI portal to authorize payment via {gateway}.</p>
            </div>
          )}

          {/* Pricing summary footer */}
          <div className="checkout-summary-box">
            <div className="summary-row">
              <span>Annual / Term Premium</span>
              <span>₹{totalAmount.toLocaleString()} / yr</span>
            </div>
            <div className="summary-row">
              <span>Selected Gateway</span>
              <span className="gw-badge-summary">{gateway}</span>
            </div>
            <div className="summary-row total">
              <span>Due Today</span>
              <span className="total-amount">
                {method === 'EMI' ? `₹${emiPerMonth.toLocaleString()} / mo` : `₹${totalAmount.toLocaleString()}`}
              </span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block pay-btn" disabled={submitting}>
            {submitting ? 'Authorizing via Gateway...' : `Pay & Activate Policy (${gateway})`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PaymentModal;
