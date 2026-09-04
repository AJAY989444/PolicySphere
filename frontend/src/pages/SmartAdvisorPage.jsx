import React, { useState, useEffect } from 'react';
import {
  HiSparkles,
  HiShieldCheck,
  HiLightBulb,
  HiCheckCircle,
  HiTrendingUp,
  HiBadgeCheck,
  HiArrowRight,
  HiAdjustments,
  HiRefresh,
  HiExclamationCircle,
  HiExternalLink
} from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api/axios';
import PolicyAIExplainerModal from '../components/catalog/PolicyAIExplainerModal';
import './SmartAdvisorPage.css';

function SmartAdvisorPage() {
  const navigate = useNavigate();

  // Step 1: Form, Step 2: Calculating, Step 3: Results
  const [step, setStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    age: 32,
    income: 850000,
    dependents: 2,
    category: 'ALL',
    budget: 40000,
    medicalHistory: '',
    smoker: false,
    preExistingConditions: false,
    drivingHistory: 'CLEAN',
    vehicleAge: 2,
  });

  // Results State
  const [riskData, setRiskData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedExplainerPolicyId, setSelectedExplainerPolicyId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRunAssessment = async (e) => {
    e?.preventDefault();
    setStep(2);
    setLoading(true);

    try {
      // Execute backend AI calculations in parallel
      const [riskRes, recsRes] = await Promise.all([
        api.post('/ai/risk-assessment', formData),
        api.post('/ai/recommendations', formData),
      ]);

      if (riskRes.data.success) {
        setRiskData(riskRes.data);
      }
      if (recsRes.data.success) {
        setRecommendations(recsRes.data.recommendations || []);
      }

      // Smooth step transition after processing animation
      setTimeout(() => {
        setLoading(false);
        setStep(3);
      }, 1200);
    } catch (err) {
      console.error('Smart Advisor assessment error:', err);
      toast.error('Failed to run AI assessment. Please try again.');
      setLoading(false);
      setStep(1);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getMatchColor = (score) => {
    if (score >= 90) return '#10b981'; // Green
    if (score >= 75) return '#6366f1'; // Indigo
    if (score >= 60) return '#f59e0b'; // Amber
    return '#6b7280';
  };

  return (
    <div className="smart-advisor-page animate-fade-in">
      <div className="container">
        {/* Header */}
        <div className="advisor-hero-header">
          <div className="advisor-badge">
            <HiSparkles size={20} className="sparkle-pulse" />
            <span>SphereAI Engine v2.4</span>
          </div>
          <h1>AI Insurance Engine & Smart Advisor</h1>
          <p>
            Get personalized coverage recommendations with match scoring, dynamic risk profiling, and plain-English clause analysis.
          </p>
        </div>

        {/* STEP 1: Assessment Form Wizard */}
        {step === 1 && (
          <div className="advisor-wizard-card card animate-slide-up">
            <div className="wizard-card-header">
              <HiAdjustments size={24} className="text-primary" />
              <div>
                <h3>Personalize Your Insurance Profile</h3>
                <p>Provide a few quick parameters to generate dynamic risk ratings and policy match scores.</p>
              </div>
            </div>

            <form onSubmit={handleRunAssessment} className="advisor-form">
              <div className="form-section-title">
                <span>1</span> Demographics & Financial Budget
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Age (Years)</label>
                  <input
                    type="number"
                    name="age"
                    min="18"
                    max="80"
                    value={formData.age}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Annual Income (₹)</label>
                  <input
                    type="number"
                    name="income"
                    step="50000"
                    value={formData.income}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Number of Dependents</label>
                  <select name="dependents" value={formData.dependents} onChange={handleInputChange}>
                    <option value={0}>0 (Individual)</option>
                    <option value={1}>1 Dependent</option>
                    <option value={2}>2 Dependents</option>
                    <option value={3}>3 Dependents</option>
                    <option value={4}>4+ Family Members</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Target Category Focus</label>
                  <select name="category" value={formData.category} onChange={handleInputChange}>
                    <option value="ALL">All Categories</option>
                    <option value="HEALTH">Health Insurance</option>
                    <option value="LIFE">Life Insurance</option>
                    <option value="MOTOR">Motor / Vehicle</option>
                    <option value="TRAVEL">Travel Insurance</option>
                    <option value="HOME">Home Insurance</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Max Annual Budget (₹)</label>
                  <input
                    type="number"
                    name="budget"
                    step="5000"
                    value={formData.budget}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Driving History Rating</label>
                  <select name="drivingHistory" value={formData.drivingHistory} onChange={handleInputChange}>
                    <option value="CLEAN">Clean Record (No Claims/Violations)</option>
                    <option value="MODERATE">Moderate (Minor Infractions)</option>
                    <option value="ACCIDENTS">Prior Motor Claims / Incidents</option>
                  </select>
                </div>
              </div>

              <div className="form-section-title mt-4">
                <span>2</span> Health & Lifestyle Parameters
              </div>
              <div className="form-grid">
                <div className="checkbox-card">
                  <label className="custom-checkbox">
                    <input
                      type="checkbox"
                      name="smoker"
                      checked={formData.smoker}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    <div>
                      <strong>Tobacco / Smoker Status</strong>
                      <span className="sub-text">Used tobacco products within the past 24 months</span>
                    </div>
                  </label>
                </div>

                <div className="checkbox-card">
                  <label className="custom-checkbox">
                    <input
                      type="checkbox"
                      name="preExistingConditions"
                      checked={formData.preExistingConditions}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    <div>
                      <strong>Pre-existing Health Conditions</strong>
                      <span className="sub-text">Diabetes, Hypertension, Thyroid, Asthma, etc.</span>
                    </div>
                  </label>
                </div>

                <div className="form-group span-2">
                  <label>Medical History Notes (Optional)</label>
                  <input
                    type="text"
                    name="medicalHistory"
                    placeholder="e.g. Mild Type-2 diabetes managed with diet, no hospitalizations."
                    value={formData.medicalHistory}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="wizard-actions">
                <button type="submit" className="btn btn-primary btn-lg wizard-submit-btn">
                  <HiSparkles /> Calculate AI Match & Dynamic Risk Score
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Processing Animation */}
        {step === 2 && (
          <div className="advisor-processing-card card animate-fade-in">
            <div className="ai-processing-ring">
              <HiSparkles size={48} className="spin-icon text-primary" />
            </div>
            <h3>SphereAI Underwriting Engine Running...</h3>
            <p>Cross-matching catalog features, calculating risk multipliers, and evaluating cost efficiency.</p>
            <div className="progress-bar-container">
              <div className="progress-bar-fill"></div>
            </div>
          </div>
        )}

        {/* STEP 3: Assessment Results Dashboard */}
        {step === 3 && (
          <div className="advisor-results-dashboard animate-slide-up">
            {/* Top Bar Navigation */}
            <div className="results-top-bar">
              <div>
                <h3>Your Personalized Smart Advisor Report</h3>
                <p>Calculated based on your demographic, lifestyle, and financial profile.</p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setStep(1)}>
                <HiRefresh /> Re-run Assessment
              </button>
            </div>

            {/* Risk Assessment Profile Header Card */}
            {riskData && (
              <div className="risk-profile-card card">
                <div className="risk-header-row">
                  <div className="risk-gauge-container">
                    <div className="risk-score-circle" style={{ borderColor: riskData.riskTierColor }}>
                      <span className="risk-number">{riskData.riskScore}</span>
                      <span className="risk-max">/ 100</span>
                    </div>
                    <div>
                      <div className="risk-tier-badge" style={{ backgroundColor: riskData.riskTierColor }}>
                        {riskData.riskTier} RISK TIER
                      </div>
                      <h4 className="risk-adjustment-title">{riskData.estimatedAdjustment}</h4>
                    </div>
                  </div>

                  {/* Mitigation Tips Box */}
                  <div className="risk-tips-box">
                    <div className="tips-title">
                      <HiLightBulb className="text-warning" size={20} />
                      <strong>SphereAI Mitigation Advice</strong>
                    </div>
                    <ul>
                      {riskData.mitigationTips?.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Risk Factor Breakdown Grid */}
                <div className="risk-breakdown-section">
                  <h5 className="breakdown-title">Underwriting Factor Breakdown</h5>
                  <div className="breakdown-grid">
                    {riskData.breakdown?.map((item, idx) => (
                      <div key={idx} className="breakdown-item">
                        <div className="breakdown-item-header">
                          <strong>{item.factor}</strong>
                          <span className="impact-tag">{item.impact}</span>
                        </div>
                        <p>{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recommended Policies Section */}
            <div className="recommendations-section">
              <div className="recs-title-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HiBadgeCheck size={26} className="text-primary" />
                  <h4>Ranked Policy Match Scoring ({recommendations.length})</h4>
                </div>
                <span className="text-muted text-sm">Sorted by highest AI Match Score %</span>
              </div>

              <div className="recommendations-grid">
                {recommendations.map((policy) => (
                  <div key={policy.id} className="rec-card card">
                    <div className="rec-card-header">
                      <div>
                        <span className="rec-cat-badge">{policy.category}</span>
                        <span className="rec-provider">{policy.provider}</span>
                      </div>

                      {/* AI Match Score Badge */}
                      <div
                        className="match-score-badge"
                        style={{
                          backgroundColor: `${getMatchColor(policy.matchScore)}15`,
                          color: getMatchColor(policy.matchScore),
                          borderColor: `${getMatchColor(policy.matchScore)}40`
                        }}
                      >
                        <HiSparkles size={16} />
                        <span>{policy.matchScore}% Match</span>
                      </div>
                    </div>

                    <h3 className="rec-policy-title">{policy.name}</h3>

                    {/* Rationale Callout */}
                    <div className="rec-rationale">
                      <HiLightBulb size={18} className="rationale-icon" />
                      <span>{policy.rationale}</span>
                    </div>

                    <p className="rec-description">{policy.description}</p>

                    {/* Stats Grid */}
                    <div className="rec-stats">
                      <div>
                        <span className="stat-lbl">Sum Insured</span>
                        <strong className="stat-val">{formatCurrency(policy.coverageAmount)}</strong>
                      </div>
                      <div>
                        <span className="stat-lbl">Annual Premium</span>
                        <strong className="stat-val text-primary">{formatCurrency(policy.premium)}/yr</strong>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="rec-actions">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedExplainerPolicyId(policy.id)}
                      >
                        <HiSparkles /> Fine Print Breakdown
                      </button>
                      <Link
                        to={`/proposals/wizard?policyId=${policy.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        Apply Now <HiArrowRight />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Explainer Modal */}
      {selectedExplainerPolicyId && (
        <PolicyAIExplainerModal
          policyId={selectedExplainerPolicyId}
          onClose={() => setSelectedExplainerPolicyId(null)}
        />
      )}
    </div>
  );
}

export default SmartAdvisorPage;
