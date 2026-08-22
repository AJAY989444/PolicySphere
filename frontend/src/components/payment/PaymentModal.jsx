import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../services/api/axios';
import { HiCreditCard, HiX, HiCheckCircle, HiLockClosed, HiShieldCheck } from 'react-icons/hi';
import './PaymentModal.css';

function PaymentModal({ policy, isOpen, onClose, onSuccess }) {
  const [method, setMethod] = useState('CARD');
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
    },
  });

  const cardNumber = watch('cardNumber') || '•••• •••• •••• ••••';
  const cardHolder = watch('cardHolder') || 'YOUR NAME';
  const expiryDate = watch('expiryDate') || 'MM/YY';

  if (!isOpen || !policy) return null;

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const payload = {
        policyId: policy.id,
        paymentMethod: method,
        cardNumber: data.cardNumber,
        cardHolder: data.cardHolder,
        expiryDate: data.expiryDate,
        cvv: data.cvv,
      };

      const res = await api.post('/payments/checkout', payload);
      toast.success(res.data.message || 'Payment Successful!');
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
            <HiLockClosed /> 256-Bit Encrypted Secure Checkout
          </div>
          <h2>Complete Your Purchase</h2>
          <p className="policy-summary-title">
            Subscription for <strong>{policy.name}</strong> ({policy.provider})
          </p>
        </div>

        {/* Live Visual Card */}
        {method === 'CARD' && (
          <div className="credit-card-preview">
            <div className="card-chip"></div>
            <div className="card-logo">PolicySphere Pay</div>
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
            <HiCreditCard /> Credit / Debit Card
          </button>
          <button
            type="button"
            className={`tab-btn ${method === 'UPI' ? 'active' : ''}`}
            onClick={() => setMethod('UPI')}
          >
            Instant UPI
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
          {method === 'CARD' ? (
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
          ) : (
            <div className="alternative-payment-box">
              <HiShieldCheck className="alt-icon" />
              <p>You will be securely redirected to your provider portal to authorize payment.</p>
            </div>
          )}

          {/* Pricing summary footer */}
          <div className="checkout-summary-box">
            <div className="summary-row">
              <span>Monthly Premium</span>
              <span>${policy.premium} / mo</span>
            </div>
            <div className="summary-row">
              <span>Coverage Duration</span>
              <span>{policy.duration} Months</span>
            </div>
            <div className="summary-row total">
              <span>Due Today</span>
              <span className="total-amount">${policy.premium}</span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block pay-btn" disabled={submitting}>
            {submitting ? 'Processing Payment...' : `Pay $${policy.premium} & Activate Policy`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PaymentModal;
