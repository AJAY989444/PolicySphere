import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { HiArrowLeft, HiShieldCheck, HiClock, HiCurrencyRupee, HiCheckCircle, HiBadgeCheck, HiCalculator } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../services/api/axios';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/payment/PaymentModal';
import QuoteCalculatorModal from '../components/catalog/QuoteCalculatorModal';
import './PolicyDetailPage.css';

function PolicyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [customQuote, setCustomQuote] = useState(null);

  useEffect(() => {
    fetchPolicy();
  }, [id]);

  const fetchPolicy = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/policies/${id}`);
      setPolicy(res.data.policy);
    } catch (err) {
      toast.error('Failed to load policy details');
      navigate('/catalog');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = () => {
    if (!user) {
      toast.error('Please sign in to purchase a policy');
      navigate('/login');
      return;
    }
    setIsModalOpen(true);
  };

  const handleProceedFromQuote = ({ customPremium, quoteDetails }) => {
    setCustomQuote(quoteDetails);
    setPolicy((prev) => ({
      ...prev,
      customPremium,
    }));
    setIsQuoteModalOpen(false);
    if (!user) {
      toast.error('Please sign in to purchase with your calculated quote');
      navigate('/login');
      return;
    }
    setIsModalOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category) => {
    const colors = {
      HEALTH: '#10b981',
      LIFE: '#6366f1',
      MOTOR: '#f59e0b',
      TRAVEL: '#06b6d4',
      HOME: '#ec4899',
    };
    return colors[category] || '#6366f1';
  };

  const getCategoryIcon = (category) => {
    const icons = { HEALTH: '🏥', LIFE: '🛡️', MOTOR: '🚗', TRAVEL: '✈️', HOME: '🏠' };
    return icons[category] || '📋';
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="spinner spinner-lg"></div>
        <p>Loading policy details...</p>
      </div>
    );
  }

  if (!policy) return null;

  const rawFeatures = policy.features;
  const features = Array.isArray(rawFeatures)
    ? rawFeatures
    : typeof rawFeatures === 'string'
    ? JSON.parse(rawFeatures)
    : [];

  const durationLabel = policy.duration >= 12
    ? `${Math.floor(policy.duration / 12)} Year${policy.duration >= 24 ? 's' : ''}`
    : `${policy.duration} Month${policy.duration > 1 ? 's' : ''}`;

  const currentDisplayPremium = policy.customPremium || policy.premium;

  return (
    <div className="detail-page animate-fade-in">
      <div className="container">
        {/* Back Button */}
        <Link to="/catalog" className="detail-back">
          <HiArrowLeft /> Back to Catalog
        </Link>

        <div className="detail-layout">
          {/* Main Content */}
          <div className="detail-main">
            <div className="detail-header">
              <span
                className="detail-category-badge"
                style={{ '--badge-color': getCategoryColor(policy.category) }}
              >
                {getCategoryIcon(policy.category)} {policy.category}
              </span>
              <h1 className="detail-title">{policy.name}</h1>
              <p className="detail-provider">by <strong>{policy.provider}</strong></p>
            </div>

            <div className="detail-description card">
              <h3>About this Plan</h3>
              <p>{policy.description}</p>
            </div>

            <div className="detail-features card">
              <h3>What's Covered</h3>
              <ul className="features-list">
                {features.map((feature, i) => (
                  <li key={i} className="feature-item">
                    <HiCheckCircle className="feature-icon" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="detail-highlights">
              <div className="highlight-card">
                <div className="highlight-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                  <HiShieldCheck size={24} />
                </div>
                <div>
                  <span className="highlight-label">Coverage Amount</span>
                  <span className="highlight-value">{formatCurrency(policy.coverageAmount)}</span>
                </div>
              </div>
              <div className="highlight-card">
                <div className="highlight-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                  <HiCurrencyRupee size={24} />
                </div>
                <div>
                  <span className="highlight-label">Base Premium</span>
                  <span className="highlight-value">{formatCurrency(policy.premium)}</span>
                </div>
              </div>
              <div className="highlight-card">
                <div className="highlight-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                  <HiClock size={24} />
                </div>
                <div>
                  <span className="highlight-label">Duration</span>
                  <span className="highlight-value">{durationLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Purchase Card */}
          <div className="detail-sidebar">
            <div className="purchase-card">
              <div className="purchase-card-header">
                <span className="purchase-label">
                  {policy.customPremium ? 'Custom Calculated Premium' : 'Premium'}
                </span>
                <div className="purchase-price">
                  <span className="purchase-amount">{formatCurrency(currentDisplayPremium)}</span>
                  <span className="purchase-period">/{policy.duration >= 12 ? 'year' : 'month'}</span>
                </div>
                {policy.customPremium && (
                  <span className="badge badge-success mt-1">✓ Custom Quote Applied</span>
                )}
              </div>

              <div className="purchase-details">
                <div className="purchase-detail-row">
                  <span>Coverage</span>
                  <strong>{formatCurrency(policy.coverageAmount)}</strong>
                </div>
                <div className="purchase-detail-row">
                  <span>Duration</span>
                  <strong>{durationLabel}</strong>
                </div>
                <div className="purchase-detail-row">
                  <span>Provider</span>
                  <strong>{policy.provider}</strong>
                </div>
              </div>

              <button
                className="btn btn-outline btn-full mb-3"
                onClick={() => setIsQuoteModalOpen(true)}
              >
                <HiCalculator /> ⚡ Calculate Custom Quote
              </button>

              <button
                className="btn btn-primary btn-lg purchase-btn"
                onClick={handlePurchase}
              >
                <HiBadgeCheck /> Buy This Plan
              </button>

              <div className="purchase-trust">
                <HiShieldCheck className="trust-icon" />
                <span>Secure transaction · Instant activation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <QuoteCalculatorModal
        policy={policy}
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        onProceedToCheckout={handleProceedFromQuote}
      />

      <PaymentModal
        policy={policy}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          navigate('/dashboard');
        }}
      />
    </div>
  );
}

export default PolicyDetailPage;
