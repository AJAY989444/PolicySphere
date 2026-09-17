import React, { useState } from 'react';
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
  HiChartBar,
  HiShieldExclamation,
  HiScale,
  HiCash,
} from 'react-icons/hi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api/axios';
import PolicyAIExplainerModal from '../components/catalog/PolicyAIExplainerModal';
import './SmartAdvisorPage.css';

function SmartAdvisorPage() {

  // Active Hub Tab: 'recommendations' | 'predictor' | 'probability' | 'risk' | 'fraud'
  const [activeTab, setActiveTab] = useState('recommendations');

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
    annualMileage: 12000,
    hospitalizationInPast2Years: false,
  });

  // Results State
  const [riskData, setRiskData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [predictionData, setPredictionData] = useState(null);
  const [probabilityData, setProbabilityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedExplainerPolicyId, setSelectedExplainerPolicyId] = useState(null);

  // Dedicated Interactive Fraud Simulator State
  const [fraudForm, setFraudForm] = useState({
    claimAmount: 85000,
    coverageAmount: 500000,
    policyAgeDays: 42,
    priorClaimsCount: 1,
    hospitalType: 'NETWORK',
    documentCount: 3,
    ocrConfidence: 88,
    incidentTiming: 'STANDARD',
  });
  const [fraudResult, setFraudResult] = useState(null);
  const [fraudLoading, setFraudLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFraudInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFraudForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRunAssessment = async (e) => {
    e?.preventDefault();
    setStep(2);
    setLoading(true);

    try {
      // Execute backend AI calculations in parallel across all 4 analytical engines
      const [riskRes, recsRes, predRes, probRes] = await Promise.all([
        api.post('/ai/risk-assessment', formData),
        api.post('/ai/recommendations', formData),
        api.post('/ai/predict-premium', {
          currentAge: formData.age,
          basePremium: formData.budget ? Math.round(formData.budget * 0.65) : 24000,
          category: formData.category === 'ALL' ? 'HEALTH' : formData.category,
          coverageAmount: formData.income ? formData.income * 3 : 1000000,
          smoker: formData.smoker,
          preExistingConditions: formData.preExistingConditions,
        }),
        api.post('/ai/claim-probability', {
          category: formData.category === 'ALL' ? 'HEALTH' : formData.category,
          age: formData.age,
          smoker: formData.smoker,
          preExistingConditions: formData.preExistingConditions,
          drivingHistory: formData.drivingHistory,
          coverageAmount: formData.income ? formData.income * 3 : 500000,
          annualMileage: formData.annualMileage,
          hospitalizationInPast2Years: formData.hospitalizationInPast2Years,
        }),
      ]);

      if (riskRes.data.success) {
        setRiskData(riskRes.data);
      }
      if (recsRes.data.success) {
        setRecommendations(recsRes.data.recommendations || []);
      }
      if (predRes.data.success) {
        setPredictionData(predRes.data);
      }
      if (probRes.data.success) {
        setProbabilityData(probRes.data);
      }

      // Smooth step transition after processing animation
      setTimeout(() => {
        setLoading(false);
        setStep(3);
      }, 1000);
    } catch (err) {
      console.error('Smart Advisor assessment error:', err);
      toast.error('Failed to run AI assessment. Please try again.');
      setLoading(false);
      setStep(1);
    }
  };

  // Run Fraud Simulator Scan
  const handleRunFraudScan = async (e) => {
    e?.preventDefault();
    setFraudLoading(true);
    try {
      const res = await api.post('/ai/fraud-analysis', fraudForm);
      if (res.data.success || res.data.fraudScore !== undefined) {
        setFraudResult(res.data);
        toast.success(`Anomaly scan complete: ${res.data.riskTier} Risk`);
      }
    } catch (err) {
      console.error('Fraud analysis error:', err);
      toast.error('Failed to run fraud anomaly analysis.');
    } finally {
      setFraudLoading(false);
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

  const getFraudTierBadge = (tier) => {
    if (tier === 'HIGH_RISK') return { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' };
    if (tier === 'ELEVATED') return { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' };
    return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
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

                <div className="checkbox-card">
                  <label className="custom-checkbox">
                    <input
                      type="checkbox"
                      name="hospitalizationInPast2Years"
                      checked={formData.hospitalizationInPast2Years}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark"></span>
                    <div>
                      <strong>Hospitalization History</strong>
                      <span className="sub-text">Inpatient admission within past 24 months</span>
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

        {/* STEP 3: Assessment Results Dashboard with Hub Navigation */}
        {step === 3 && (
          <div className="advisor-results-dashboard animate-slide-up">
            {/* Top Bar Navigation */}
            <div className="results-top-bar">
              <div>
                <h3>SphereAI Intelligence Suite</h3>
                <p>Comprehensive underwriting, forecasting, and claims risk intelligence for your profile.</p>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setStep(1)}>
                <HiRefresh /> Reconfigure Profile
              </button>
            </div>

            {/* AI Module Tabs Navigation */}
            <div className="ai-hub-tabs">
              <button
                className={`ai-tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
                onClick={() => setActiveTab('recommendations')}
              >
                <HiBadgeCheck size={18} />
                <span>Ranked Matches ({recommendations.length})</span>
              </button>
              <button
                className={`ai-tab-btn ${activeTab === 'predictor' ? 'active' : ''}`}
                onClick={() => setActiveTab('predictor')}
              >
                <HiTrendingUp size={18} />
                <span>5-Yr Premium Predictor</span>
              </button>
              <button
                className={`ai-tab-btn ${activeTab === 'probability' ? 'active' : ''}`}
                onClick={() => setActiveTab('probability')}
              >
                <HiScale size={18} />
                <span>Claim Probability & Deductibles</span>
              </button>
              <button
                className={`ai-tab-btn ${activeTab === 'risk' ? 'active' : ''}`}
                onClick={() => setActiveTab('risk')}
              >
                <HiShieldCheck size={18} />
                <span>Dynamic Risk Index</span>
              </button>
              <button
                className={`ai-tab-btn ${activeTab === 'fraud' ? 'active' : ''}`}
                onClick={() => setActiveTab('fraud')}
              >
                <HiShieldExclamation size={18} />
                <span>AI Fraud Anomaly Scanner</span>
              </button>
            </div>

            {/* TAB 1: RANKED RECOMMENDATIONS */}
            {activeTab === 'recommendations' && (
              <div className="tab-pane animate-fade-in">
                <div className="recs-title-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <HiBadgeCheck size={26} className="text-primary" />
                    <h4>AI-Ranked Policy Matches</h4>
                  </div>
                  <span className="text-muted text-sm">Sorted by highest multi-factor Match Score %</span>
                </div>

                <div className="recommendations-grid">
                  {recommendations.map((policy) => (
                    <div key={policy.id} className="rec-card card">
                      <div className="rec-card-header">
                        <div>
                          <span className="rec-cat-badge">{policy.category}</span>
                          <span className="rec-provider">{policy.provider}</span>
                        </div>

                        <div
                          className="match-score-badge"
                          style={{
                            backgroundColor: `${getMatchColor(policy.matchScore)}15`,
                            color: getMatchColor(policy.matchScore),
                            borderColor: `${getMatchColor(policy.matchScore)}40`,
                          }}
                        >
                          <HiSparkles size={16} />
                          <span>{policy.matchScore}% Match</span>
                        </div>
                      </div>

                      <h3 className="rec-policy-title">{policy.name}</h3>

                      <div className="rec-rationale">
                        <HiLightBulb size={18} className="rationale-icon" />
                        <span>{policy.rationale}</span>
                      </div>

                      <p className="rec-description">{policy.description}</p>

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
            )}

            {/* TAB 2: 5-YEAR PREMIUM PREDICTOR */}
            {activeTab === 'predictor' && predictionData && (
              <div className="tab-pane animate-fade-in">
                <div className="predictor-summary-grid">
                  <div className="pred-metric-card card">
                    <span className="pred-metric-label">Current Year 1 Base</span>
                    <strong className="pred-metric-val">{formatCurrency(predictionData.summary.year1Premium)}</strong>
                    <span className="pred-subtext">Baseline entry quote</span>
                  </div>
                  <div className="pred-metric-card card">
                    <span className="pred-metric-label">Year 5 Projected Premium</span>
                    <strong className="pred-metric-val text-warning">{formatCurrency(predictionData.summary.year5Premium)}</strong>
                    <span className="pred-subtext">+{predictionData.summary.year5IncreasePercent}% compounding escalation</span>
                  </div>
                  <div className="pred-metric-card card highlight">
                    <span className="pred-metric-label">5-Year Multi-Year Lock Savings</span>
                    <strong className="pred-metric-val text-success">{formatCurrency(predictionData.summary.fiveYearSavingsWithLock)}</strong>
                    <span className="pred-subtext">Saved by locking multi-year rate today</span>
                  </div>
                  <div className="pred-metric-card card">
                    <span className="pred-metric-label">Inflation Benchmark</span>
                    <strong className="pred-metric-val text-primary">{predictionData.summary.inflationRatePercent}% / yr</strong>
                    <span className="pred-subtext">Compounded healthcare index</span>
                  </div>
                </div>

                {/* Recharts Visual Trajectory Chart */}
                <div className="chart-card card mt-4">
                  <div className="chart-card-header">
                    <div>
                      <h4>5-Year Actuarial Premium Trajectory Simulation</h4>
                      <p>Comparing Unlocked Market Inflation vs No-Claim Bonus (NCB) vs Multi-Year Locked Rate</p>
                    </div>
                  </div>

                  <div className="chart-wrapper" style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                      <AreaChart
                        data={predictionData.trajectory}
                        margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
                      >
                        <defs>
                          <linearGradient id="marketGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="ncbGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="lockedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="yearLabel" stroke="#64748b" />
                        <YAxis
                          tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                          stroke="#64748b"
                        />
                        <Tooltip
                          formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, '']}
                          labelFormatter={(label) => `Projection: ${label}`}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Area
                          type="monotone"
                          name="Market Rate (with Inflation & Age)"
                          dataKey="standardPremium"
                          stroke="#ef4444"
                          fillOpacity={1}
                          fill="url(#marketGrad)"
                          strokeWidth={2.5}
                        />
                        <Area
                          type="monotone"
                          name="With No-Claim Bonus (NCB)"
                          dataKey="ncbPremium"
                          stroke="#3b82f6"
                          fillOpacity={1}
                          fill="url(#ncbGrad)"
                          strokeWidth={2.5}
                        />
                        <Area
                          type="monotone"
                          name="Locked Multi-Year Rate (Fixed)"
                          dataKey="lockedPremium"
                          stroke="#10b981"
                          fillOpacity={1}
                          fill="url(#lockedGrad)"
                          strokeWidth={2.5}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Actuarial Trajectory Table */}
                <div className="trajectory-table-card card mt-4">
                  <h5>Year-by-Year Actuarial Breakdown</h5>
                  <div className="table-responsive actuarial-table-wrapper">
                    <table className="actuarial-breakdown-table">
                      <thead>
                        <tr>
                          <th>Year</th>
                          <th>Projected Age</th>
                          <th>Inflation Impact</th>
                          <th>Age Band Jump</th>
                          <th>Standard Premium</th>
                          <th>NCB Rate (0 Claims)</th>
                          <th>Locked Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {predictionData.trajectory.map((row, i) => (
                          <tr key={i}>
                            <td className="year-cell">
                              <span className="year-tag">{row.yearLabel}</span>
                            </td>
                            <td>
                              <span className="age-pill">{row.projectedAge} yrs</span>
                            </td>
                            <td>
                              <span className={`inflation-pill ${row.inflationImpact > 0 ? 'active' : ''}`}>
                                +{row.inflationImpact}%
                              </span>
                            </td>
                            <td>
                              <span className={`band-pill ${row.ageBracketLoading > 0 ? 'jump' : ''}`}>
                                {row.ageBracketLoading > 0 ? `+${row.ageBracketLoading}%` : 'Standard'}
                              </span>
                            </td>
                            <td className="premium-market font-semibold">{formatCurrency(row.standardPremium)}</td>
                            <td className="premium-ncb font-semibold">{formatCurrency(row.ncbPremium)}</td>
                            <td className="premium-locked font-semibold">{formatCurrency(row.lockedPremium)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="actuarial-notes-box mt-3">
                    <strong>Actuarial Underwriting Drivers:</strong>
                    <ul>
                      {predictionData.actuarialDrivers.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CLAIM PROBABILITY & DEDUCTIBLE OPTIMIZATION */}
            {activeTab === 'probability' && probabilityData && (
              <div className="tab-pane animate-fade-in">
                <div className="probability-grid">
                  {/* Gauge Cards */}
                  <div className="prob-card card">
                    <span className="prob-window-badge">12 Months</span>
                    <div className="prob-circle-stat">
                      <span className="prob-value">{probabilityData.probabilities.next12Months}%</span>
                      <span className="prob-label">Claim Probability</span>
                    </div>
                    <p className="prob-desc">Likelihood of filing at least one hospital or motor claim within 1 year.</p>
                  </div>

                  <div className="prob-card card">
                    <span className="prob-window-badge">24 Months</span>
                    <div className="prob-circle-stat">
                      <span className="prob-value">{probabilityData.probabilities.next24Months}%</span>
                      <span className="prob-label">Compounded 2-Year</span>
                    </div>
                    <p className="prob-desc">Cumulative incidence probability considering age progression.</p>
                  </div>

                  <div className="prob-card card">
                    <span className="prob-window-badge">36 Months</span>
                    <div className="prob-circle-stat">
                      <span className="prob-value">{probabilityData.probabilities.next36Months}%</span>
                      <span className="prob-label">3-Year Rolling Horizon</span>
                    </div>
                    <p className="prob-desc">Long-term claim probability benchmark across demographic cohorts.</p>
                  </div>
                </div>

                {/* Financial Payout & Risk Drivers */}
                <div className="prob-detail-row mt-4">
                  <div className="card p-4 flex-1">
                    <h5 className="flex items-center gap-2 mb-3">
                      <HiCash className="text-primary" size={22} />
                      Estimated Financial Claim Exposure
                    </h5>
                    <div className="payout-stats-row">
                      <div className="payout-box">
                        <span className="lbl">Estimated Average Claim Size</span>
                        <strong className="val text-primary">{formatCurrency(probabilityData.payoutEstimations.estimatedAveragePayout)}</strong>
                      </div>
                      <div className="payout-box">
                        <span className="lbl">Expected Annual Value Loss</span>
                        <strong className="val text-warning">{formatCurrency(probabilityData.payoutEstimations.expectedValueLoss)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="card p-4 flex-1">
                    <h5 className="flex items-center gap-2 mb-3">
                      <HiChartBar className="text-primary" size={22} />
                      Primary Statistical Risk Drivers
                    </h5>
                    <div className="drivers-list">
                      {probabilityData.riskDrivers.map((driver, idx) => (
                        <div key={idx} className="driver-row">
                          <div>
                            <strong>{driver.driver}</strong>
                            <p>{driver.description}</p>
                          </div>
                          <span className="driver-weight-badge">{driver.weight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Deductible Sweet Spot Optimizer */}
                <div className="card p-4 mt-4">
                  <h5 className="flex items-center gap-2 mb-1">
                    <HiScale className="text-primary" size={22} />
                    Deductible Sweet Spot Optimizer
                  </h5>
                  <p className="text-muted text-sm mb-3">
                    Compare voluntary deductible choices to balance upfront premium savings vs out-of-pocket claim expenses.
                  </p>

                  <div className="deductibles-grid">
                    {probabilityData.deductibleOptions.map((opt, idx) => (
                      <div key={idx} className={`deductible-card ${opt.recommended ? 'recommended-sweet-spot' : ''}`}>
                        {opt.recommended && (
                          <div className="sweet-spot-banner">
                            <HiSparkles size={14} /> Recommended Sweet Spot
                          </div>
                        )}
                        <h4>{opt.deductibleAmount === 0 ? 'Zero Deductible' : `₹${opt.deductibleAmount.toLocaleString('en-IN')} Deductible`}</h4>
                        <div className="deductible-discount-tag">{opt.premiumDiscount}</div>
                        <p className="deductible-analysis">{opt.analysis}</p>
                      </div>
                    ))}
                  </div>

                  <div className="risk-tips-box mt-4">
                    <div className="tips-title">
                      <HiLightBulb className="text-warning" size={20} />
                      <strong>SphereAI Preventive Recommendations</strong>
                    </div>
                    <ul>
                      {probabilityData.safetyRecommendations.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: DYNAMIC RISK INDEX */}
            {activeTab === 'risk' && riskData && (
              <div className="tab-pane animate-fade-in">
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
              </div>
            )}

            {/* TAB 5: AI FRAUD ANOMALY SCANNER */}
            {activeTab === 'fraud' && (
              <div className="tab-pane animate-fade-in">
                <div className="fraud-scanner-container card p-4">
                  <div className="fraud-scanner-header mb-4">
                    <div className="flex items-center gap-2">
                      <HiShieldExclamation size={26} className="text-warning" />
                      <h4>AI Claim Fraud Anomaly Scanner</h4>
                    </div>
                    <p className="text-muted text-sm">
                      Evaluate claims or proposal declarations against velocity spikes, inception latency anomalies, OCR tampering, and billing ratio anomalies.
                    </p>
                  </div>

                  {/* Simulator Controls Form */}
                  <form onSubmit={handleRunFraudScan} className="fraud-sim-form">
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="fraud-form-label">Claim Amount (₹)</label>
                        <input
                          type="number"
                          name="claimAmount"
                          value={fraudForm.claimAmount}
                          onChange={handleFraudInputChange}
                          step="5000"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="fraud-form-label">Policy Sum Insured (₹)</label>
                        <input
                          type="number"
                          name="coverageAmount"
                          value={fraudForm.coverageAmount}
                          onChange={handleFraudInputChange}
                          step="50000"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="fraud-form-label">Policy Inception Latency (Days)</label>
                        <input
                          type="number"
                          name="policyAgeDays"
                          value={fraudForm.policyAgeDays}
                          onChange={handleFraudInputChange}
                          min="1"
                          max="3650"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="fraud-form-label">Prior Claims in Past 12 Months</label>
                        <select
                          name="priorClaimsCount"
                          value={fraudForm.priorClaimsCount}
                          onChange={handleFraudInputChange}
                        >
                          <option value={0}>0 (First Claim)</option>
                          <option value={1}>1 Prior Claim</option>
                          <option value={2}>2 Prior Claims (Velocity Warning)</option>
                          <option value={3}>3+ Prior Claims (Velocity Anomaly)</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="fraud-form-label">Hospital / Workshop Network Tier</label>
                        <select
                          name="hospitalType"
                          value={fraudForm.hospitalType}
                          onChange={handleFraudInputChange}
                        >
                          <option value="NETWORK">Empaneled Cashless Network</option>
                          <option value="NON_NETWORK">Non-Network Reimbursement</option>
                          <option value="UNLISTED_CLINIC">Unlisted / High-Risk Facility</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="fraud-form-label">Uploaded Corroborating Bills/Docs</label>
                        <select
                          name="documentCount"
                          value={fraudForm.documentCount}
                          onChange={handleFraudInputChange}
                        >
                          <option value={1}>1 Document (Deficient)</option>
                          <option value={2}>2 Documents</option>
                          <option value={3}>3+ Comprehensive Invoices/Reports</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="fraud-form-label">OCR Digital Integrity Score (%)</label>
                        <input
                          type="number"
                          name="ocrConfidence"
                          min="10"
                          max="100"
                          value={fraudForm.ocrConfidence}
                          onChange={handleFraudInputChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="fraud-form-label">Incident Timing Window</label>
                        <select
                          name="incidentTiming"
                          value={fraudForm.incidentTiming}
                          onChange={handleFraudInputChange}
                        >
                          <option value="STANDARD">Standard Policy Term</option>
                          <option value="RENEWAL_EVE">Renewal / Expiry Eve (Within 48 hrs)</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button type="submit" className="btn btn-warning btn-md" disabled={fraudLoading}>
                        <HiSparkles /> {fraudLoading ? 'Scanning Anomalies...' : 'Run AI Fraud Scan'}
                      </button>
                    </div>
                  </form>

                  {/* Fraud Result Presentation */}
                  {fraudResult && (
                    <div className="fraud-result-card card mt-4 p-4 animate-slide-up">
                      <div className="fraud-result-header">
                        <div className="flex items-center gap-3">
                          <div className="fraud-score-box">
                            <span className="fraud-score-number">{fraudResult.fraudScore}</span>
                            <span className="fraud-score-lbl">/ 100</span>
                          </div>
                          <div>
                            <div
                              className="fraud-tier-pill"
                              style={{
                                backgroundColor: getFraudTierBadge(fraudResult.riskTier).bg,
                                color: getFraudTierBadge(fraudResult.riskTier).text,
                                border: `1px solid ${getFraudTierBadge(fraudResult.riskTier).border}`,
                              }}
                            >
                              {fraudResult.riskTier.replace('_', ' ')}
                            </div>
                            <h4 className="fraud-action-title mt-1">{fraudResult.recommendation.replace(/_/g, ' ')}</h4>
                          </div>
                        </div>

                        <span className="text-muted text-xs">
                          Evaluated: {new Date(fraudResult.evaluatedAt).toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="fraud-result-summary mt-3">
                        {fraudResult.recommendationText}
                      </p>

                      {/* Anomaly Indicators */}
                      <h5 className="mt-4 mb-2 font-bold text-sm">Detected Fraud Anomaly Indicators ({fraudResult.indicators.length})</h5>
                      <div className="fraud-indicators-list">
                        {fraudResult.indicators.map((ind, idx) => (
                          <div key={idx} className={`indicator-item severity-${ind.severity.toLowerCase()}`}>
                            <div className="flex justify-between items-center mb-1">
                              <strong>{ind.title}</strong>
                              <span className={`badge-severity ${ind.severity.toLowerCase()}`}>{ind.severity}</span>
                            </div>
                            <p>{ind.description}</p>
                          </div>
                        ))}
                      </div>

                      {/* Auditor Checklist */}
                      <h5 className="mt-4 mb-2 font-bold text-sm">Claims Auditor Protocol Checklist</h5>
                      <ul className="auditor-checklist">
                        {fraudResult.auditChecklist.map((check, idx) => (
                          <li key={idx}>
                            <HiCheckCircle className="text-primary flex-shrink-0" size={18} />
                            <span>{check}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
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
