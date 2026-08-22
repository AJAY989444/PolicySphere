import React, { useState } from 'react';
import { HiX, HiCalculator, HiSparkles, HiArrowRight } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api/axios';
import './QuoteEngineModal.css';

function QuoteEngineModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [quoteResult, setQuoteResult] = useState(null);

  const [formData, setFormData] = useState({
    category: 'HEALTH',
    age: 32,
    coverageAmount: 500000,
    familyMembers: 2,
    smoker: false,
    preExistingConditions: false,
    vehicleAgeYears: 2,
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/quotes/calculate', {
        ...formData,
        age: parseInt(formData.age, 10),
        coverageAmount: parseInt(formData.coverageAmount, 10),
        familyMembers: parseInt(formData.familyMembers, 10),
        vehicleAgeYears: parseInt(formData.vehicleAgeYears, 10),
      });

      setQuoteResult(response.data.quote);
      toast.success('Instant quote calculated successfully!');
    } catch (error) {
      toast.error('Failed to calculate quote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPolicy = (policyId) => {
    onClose();
    navigate(`/catalog/${policyId}`);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="quote-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="quote-modal-header">
          <div>
            <h3><HiCalculator className="icon-gold" /> Instant Policy Quote Engine</h3>
            <p>Calculate custom premium quotes based on your age, coverage, and risk profile</p>
          </div>
          <button className="close-btn" onClick={onClose}><HiX /></button>
        </div>

        {!quoteResult ? (
          <form onSubmit={handleCalculate} className="quote-form">
            <div className="form-group">
              <label className="form-label">Insurance Type / Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-input"
              >
                <option value="HEALTH">Health Insurance</option>
                <option value="LIFE">Term / Life Insurance</option>
                <option value="MOTOR">Motor / Car Insurance</option>
                <option value="TRAVEL">Travel Insurance</option>
                <option value="HOME">Home Insurance</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Primary Applicant Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="18"
                  max="85"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Desired Coverage ($)</label>
                <select
                  name="coverageAmount"
                  value={formData.coverageAmount}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="250000">$250,000</option>
                  <option value="500000">$500,000</option>
                  <option value="1000000">$1,000,000</option>
                  <option value="2500000">$2,500,000</option>
                  <option value="5000000">$5,000,000</option>
                </select>
              </div>
            </div>

            {formData.category === 'HEALTH' && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Family Members Covered</label>
                  <input
                    type="number"
                    name="familyMembers"
                    value={formData.familyMembers}
                    onChange={handleChange}
                    min="1"
                    max="10"
                    className="form-input"
                  />
                </div>
                <div className="form-group checkboxes-group mt-4">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="smoker"
                      checked={formData.smoker}
                      onChange={handleChange}
                    /> Tobacco / Smoker
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="preExistingConditions"
                      checked={formData.preExistingConditions}
                      onChange={handleChange}
                    /> Pre-existing Medical Conditions
                  </label>
                </div>
              </div>
            )}

            {formData.category === 'MOTOR' && (
              <div className="form-group">
                <label className="form-label">Vehicle Age (Years)</label>
                <input
                  type="number"
                  name="vehicleAgeYears"
                  value={formData.vehicleAgeYears}
                  onChange={handleChange}
                  min="0"
                  max="20"
                  className="form-input"
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full mt-4"
              disabled={loading}
            >
              {loading ? 'Calculating Custom Rate...' : 'Calculate Premium Quote'}
            </button>
          </form>
        ) : (
          <div className="quote-results-view">
            <div className="quote-summary-card">
              <div className="summary-badge"><HiSparkles /> Instant Quote Calculated</div>
              <div className="premium-price">
                ${quoteResult.calculatedAnnualPremium.toLocaleString()}
                <span className="period">/ year</span>
              </div>
              <p className="monthly-breakdown">
                Approx. <strong>${quoteResult.calculatedMonthlyPremium.toLocaleString()}</strong> per month
              </p>

              <div className="quote-breakdown-box">
                <div className="breakdown-item">
                  <span>Base Risk Premium:</span>
                  <strong>${quoteResult.breakdown.basePremium.toLocaleString()}</strong>
                </div>
                <div className="breakdown-item">
                  <span>Taxes & Regulatory Fees (18%):</span>
                  <strong>${quoteResult.breakdown.gstTax.toLocaleString()}</strong>
                </div>
                <div className="breakdown-item">
                  <span>Risk Profile Tier:</span>
                  <strong>{quoteResult.breakdown.appliedFactors.ageGroup}</strong>
                </div>
              </div>
            </div>

            <div className="recommended-policies-section">
              <h4>Matching Catalog Plans</h4>
              <div className="recommended-grid">
                {quoteResult.recommendedPolicies.map((p) => (
                  <div key={p.id} className="recommended-card">
                    <div className="rec-card-header">
                      <h5>{p.name}</h5>
                      <span className="badge badge-primary">{p.category}</span>
                    </div>
                    <p className="rec-provider">{p.provider}</p>
                    <div className="rec-price">${p.premium.toLocaleString()} / yr</div>
                    <button
                      className="btn btn-outline btn-sm btn-full mt-2"
                      onClick={() => handleSelectPolicy(p.id)}
                    >
                      View & Subscribe <HiArrowRight />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="quote-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setQuoteResult(null)}
              >
                Recalculate Quote
              </button>
              <button className="btn btn-primary" onClick={onClose}>
                Close Engine
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuoteEngineModal;
