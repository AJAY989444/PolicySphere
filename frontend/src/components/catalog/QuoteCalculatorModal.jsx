import React, { useState, useEffect } from 'react';
import { HiX, HiCalculator, HiSparkles, HiShieldCheck, HiCheckCircle, HiArrowRight, HiTag } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../services/api/axios';
import './QuoteCalculatorModal.css';

function QuoteCalculatorModal({ isOpen, onClose, policy = null, onProceedToCheckout }) {
  const [loading, setLoading] = useState(false);
  const [quoteResult, setQuoteResult] = useState(null);

  const [formData, setFormData] = useState({
    policyId: policy ? policy.id : null,
    category: policy ? policy.category : 'HEALTH',
    age: 32,
    gender: 'MALE',
    cityTier: 'TIER_1',
    sumAssured: policy ? policy.coverageAmount || 500000 : 500000,
    ncbPercent: 20,
    deductible: 0,
    selectedAddons: [],
  });

  // Update policy state when modal opens with a different policy
  useEffect(() => {
    if (policy) {
      setFormData((prev) => ({
        ...prev,
        policyId: policy.id,
        category: policy.category || 'HEALTH',
        sumAssured: policy.coverageAmount || 500000,
      }));
    }
  }, [policy]);

  // Recalculate quote whenever form values change
  useEffect(() => {
    if (isOpen) {
      fetchQuote();
    }
  }, [
    isOpen,
    formData.policyId,
    formData.age,
    formData.gender,
    formData.cityTier,
    formData.sumAssured,
    formData.ncbPercent,
    formData.deductible,
    formData.selectedAddons,
  ]);

  if (!isOpen) return null;

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const response = await api.post('/quotes/calculate', {
        ...formData,
        age: parseInt(formData.age, 10),
        sumAssured: parseInt(formData.sumAssured, 10),
        ncbPercent: parseInt(formData.ncbPercent, 10),
        deductible: parseInt(formData.deductible, 10),
      });
      if (response.data?.success) {
        setQuoteResult(response.data.quote);
      }
    } catch (error) {
      console.error('Error calculating quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddonToggle = (addonId) => {
    setFormData((prev) => {
      const exists = prev.selectedAddons.includes(addonId);
      const newAddons = exists
        ? prev.selectedAddons.filter((id) => id !== addonId)
        : [...prev.selectedAddons, addonId];
      return { ...prev, selectedAddons: newAddons };
    });
  };

  const handleProceed = () => {
    if (onProceedToCheckout && quoteResult) {
      onProceedToCheckout({
        policy: policy || quoteResult.policyDetails,
        customPremium: quoteResult.calculatedAnnualPremium,
        quoteDetails: quoteResult,
      });
      onClose();
    } else {
      toast.success('Custom quote applied! Proceeding to checkout...');
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="quote-calculator-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-banner">
          <div className="header-title">
            <h3>
              <HiCalculator className="icon-badge" /> Dynamic Quote Engine
            </h3>
            <p>
              {policy
                ? `Customizing Quote for ${policy.name}`
                : 'Calculate personalized insurance premiums in real time'}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <HiX />
          </button>
        </div>

        <div className="quote-calculator-body">
          {/* Left Side: Parameters Form */}
          <div className="params-pane">
            <h4 className="section-subtitle">1. Risk & Coverage Parameters</h4>

            <div className="form-grid">
              {/* Age */}
              <div className="form-group">
                <label className="form-label">Applicant Age (Years)</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="18"
                  max="85"
                  className="form-input"
                />
              </div>

              {/* Gender */}
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* City Tier */}
              <div className="form-group">
                <label className="form-label">City Tier / Region</label>
                <select
                  name="cityTier"
                  value={formData.cityTier}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="TIER_1">Tier 1 (Metros: Delhi, Mumbai, Blr)</option>
                  <option value="TIER_2">Tier 2 (State Capitals & Cities)</option>
                  <option value="TIER_3">Tier 3 / Rural Districts</option>
                </select>
              </div>

              {/* Sum Assured */}
              <div className="form-group">
                <label className="form-label">Sum Assured Coverage</label>
                <select
                  name="sumAssured"
                  value={formData.sumAssured}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="300000">₹3,00,000</option>
                  <option value="500000">₹5,00,000</option>
                  <option value="1000000">₹10,00,000</option>
                  <option value="2500000">₹25,00,000</option>
                  <option value="5000000">₹50,00,000</option>
                  <option value="10000000">₹1,00,00,000 (1 Cr)</option>
                </select>
              </div>

              {/* NCB Discount */}
              <div className="form-group">
                <label className="form-label">No-Claim Bonus (NCB)</label>
                <select
                  name="ncbPercent"
                  value={formData.ncbPercent}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="0">0% (New / Previous Claim)</option>
                  <option value="20">20% (1 Claim-free Year)</option>
                  <option value="25">25% (2 Claim-free Years)</option>
                  <option value="35">35% (3 Claim-free Years)</option>
                  <option value="45">45% (4 Claim-free Years)</option>
                  <option value="50">50% (5+ Claim-free Years)</option>
                </select>
              </div>

              {/* Voluntary Deductible */}
              <div className="form-group">
                <label className="form-label">Voluntary Deductible</label>
                <select
                  name="deductible"
                  value={formData.deductible}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="0">₹0 (Full Coverage)</option>
                  <option value="10000">₹10,000 (Save 5% Premium)</option>
                  <option value="25000">₹25,000 (Save 10% Premium)</option>
                  <option value="50000">₹50,000 (Save 15% Premium)</option>
                </select>
              </div>
            </div>

            {/* Optional Add-on Riders */}
            <h4 className="section-subtitle mt-4">2. Optional Add-on Covers</h4>
            <div className="addons-list">
              {quoteResult?.availableAddons?.map((addon) => {
                const checked = formData.selectedAddons.includes(addon.id);
                return (
                  <div
                    key={addon.id}
                    className={`addon-chip ${checked ? 'active' : ''}`}
                    onClick={() => handleAddonToggle(addon.id)}
                  >
                    <div className="addon-checkbox">
                      {checked && <HiCheckCircle className="check-icon" />}
                    </div>
                    <div className="addon-info">
                      <span className="addon-name">{addon.name}</span>
                      <span className="addon-price">+₹{addon.price.toLocaleString()}/yr</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Live Calculation Result Breakdown */}
          <div className="breakdown-pane">
            <h4 className="section-subtitle">Live Premium Summary</h4>

            {quoteResult ? (
              <div className="quote-result-card">
                <div className="price-hero">
                  <span className="hero-label">Calculated Annual Premium</span>
                  <div className="main-price">
                    ₹{quoteResult.finalAnnualPremium.toLocaleString()}
                    <span className="price-term">/year</span>
                  </div>
                  <div className="monthly-sub">
                    or approx. <strong>₹{quoteResult.finalMonthlyPremium.toLocaleString()}</strong> / month
                  </div>
                  {quoteResult.totalSavings > 0 && (
                    <div className="savings-tag">
                      <HiTag /> Total Savings: ₹{quoteResult.totalSavings.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="breakdown-details">
                  <div className="breakdown-row">
                    <span>Base Premium</span>
                    <strong>₹{quoteResult.basePolicyPremium.toLocaleString()}</strong>
                  </div>
                  <div className="breakdown-row">
                    <span>Age Multiplier ({quoteResult.ageMultiplier}x)</span>
                    <span className="factor-pill">{quoteResult.ageMultiplier}x</span>
                  </div>
                  <div className="breakdown-row">
                    <span>City Tier Factor ({quoteResult.cityRiskFactor}x)</span>
                    <span className="factor-pill">{quoteResult.cityRiskFactor}x</span>
                  </div>

                  {quoteResult.ncbDiscountAmount > 0 && (
                    <div className="breakdown-row discount">
                      <span>NCB Discount ({quoteResult.ncbDiscountPercent}%)</span>
                      <strong className="text-green">-₹{quoteResult.ncbDiscountAmount.toLocaleString()}</strong>
                    </div>
                  )}

                  {quoteResult.deductibleDiscountAmount > 0 && (
                    <div className="breakdown-row discount">
                      <span>Deductible Discount</span>
                      <strong className="text-green">-₹{quoteResult.deductibleDiscountAmount.toLocaleString()}</strong>
                    </div>
                  )}

                  {quoteResult.addonsTotal > 0 && (
                    <div className="breakdown-row">
                      <span>Add-on Riders ({quoteResult.activeAddons.length})</span>
                      <strong>+₹{quoteResult.addonsTotal.toLocaleString()}</strong>
                    </div>
                  )}

                  <div className="breakdown-divider" />

                  <div className="breakdown-row">
                    <span>Taxable Subtotal</span>
                    <strong>₹{quoteResult.taxableSubtotal.toLocaleString()}</strong>
                  </div>
                  <div className="breakdown-row">
                    <span>GST Tax (18%)</span>
                    <strong>+₹{quoteResult.gstAmount.toLocaleString()}</strong>
                  </div>

                  <div className="breakdown-divider highlight" />

                  <div className="breakdown-row total">
                    <span>Final Payable Premium</span>
                    <strong className="text-primary">
                      ₹{quoteResult.finalAnnualPremium.toLocaleString()}
                    </strong>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-full btn-lg mt-4 proceed-btn"
                  onClick={handleProceed}
                  disabled={loading}
                >
                  Proceed with Custom Quote <HiArrowRight />
                </button>
              </div>
            ) : (
              <div className="loading-quote-placeholder">
                <HiSparkles className="spin-icon" />
                <p>Calculating custom rate...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuoteCalculatorModal;
