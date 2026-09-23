import React, { useState, useEffect } from 'react';
import api from '../services/api/axios';
import './InsurerPortalPage.css';

export default function InsurerPortalPage() {
  const [insurers, setInsurers] = useState([]);
  const [selectedInsurerId, setSelectedInsurerId] = useState('');
  const [overview, setOverview] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Tab Data States
  const [rules, setRules] = useState([]);
  const [underwritingQueue, setUnderwritingQueue] = useState([]);
  const [claimsQueue, setClaimsQueue] = useState([]);
  const [settlements, setSettlements] = useState([]);

  // Modals
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const [showUwModal, setShowUwModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [uwDecision, setUwDecision] = useState('COUNTER_OFFER_LOADING');
  const [loadingPct, setLoadingPct] = useState(15);
  const [exclusionInput, setExclusionInput] = useState('');
  const [uwRemarks, setUwRemarks] = useState('');

  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [claimStatus, setClaimStatus] = useState('SETTLED');
  const [preAuthInput, setPreAuthInput] = useState(0);
  const [approvedInput, setApprovedInput] = useState(0);
  const [copayInput, setCopayInput] = useState(0);
  const [nonMedicalInput, setNonMedicalInput] = useState(0);
  const [claimRemarks, setClaimRemarks] = useState('');

  const [showGenerateBatchModal, setShowGenerateBatchModal] = useState(false);
  const [batchGross, setBatchGross] = useState(2500000);
  const [batchPolicies, setBatchPolicies] = useState(180);

  // API Tester & Webhook Simulator state
  const [webhookSimResult, setWebhookSimResult] = useState(null);
  const [apiBindResult, setApiBindResult] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load initial partner list
  useEffect(() => {
    fetchInsurerList();
  }, []);

  // When insurer changes, load all data for that insurer
  useEffect(() => {
    if (selectedInsurerId) {
      loadInsurerData(selectedInsurerId);
    }
  }, [selectedInsurerId]);

  const fetchInsurerList = async () => {
    try {
      setLoading(true);
      const res = await api.get('/insurer/list');
      if (res.data.success && res.data.insurers.length > 0) {
        setInsurers(res.data.insurers);
        setSelectedInsurerId(res.data.insurers[0].id);
      }
    } catch (err) {
      console.error('Error fetching insurer list:', err);
      showToast('Failed to load partner insurer list.');
    } finally {
      setLoading(false);
    }
  };

  const loadInsurerData = async (id) => {
    try {
      setLoading(true);
      const [overviewRes, rulesRes, uwRes, claimsRes, settleRes] = await Promise.all([
        api.get(`/insurer/overview?insurerId=${id}`),
        api.get(`/insurer/products/rules?insurerId=${id}`),
        api.get(`/insurer/underwriting/queue?insurerId=${id}`),
        api.get(`/insurer/claims/queue?insurerId=${id}`),
        api.get(`/insurer/settlements?insurerId=${id}`),
      ]);

      if (overviewRes.data.success) setOverview(overviewRes.data.overview);
      if (rulesRes.data.success) setRules(rulesRes.data.rules);
      if (uwRes.data.success) setUnderwritingQueue(uwRes.data.queue);
      if (claimsRes.data.success) setClaimsQueue(claimsRes.data.claims);
      if (settleRes.data.success) setSettlements(settleRes.data.batches);
    } catch (err) {
      console.error('Error loading insurer data:', err);
      showToast('Error loading insurer portfolio data.');
    } finally {
      setLoading(false);
    }
  };

  // Update Actuarial Rules
  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/insurer/products/rules/${editingRule.id}`, editingRule);
      showToast('Actuarial guideline updated successfully.');
      setShowRuleModal(false);
      loadInsurerData(selectedInsurerId);
    } catch (err) {
      console.error('Error updating rule:', err);
      showToast('Failed to update actuarial rule.');
    }
  };

  // Submit Underwriting Decision
  const handleSubmitUnderwriting = async (e) => {
    e.preventDefault();
    try {
      const exclusions = exclusionInput.split(',').map(s => s.trim()).filter(Boolean);
      await api.post(`/insurer/underwriting/decide/${selectedProposal.id}`, {
        decision: uwDecision,
        loadingPercentage: parseFloat(loadingPct) || 0,
        exclusionList: exclusions,
        underwriterRemarks: uwRemarks,
      });
      showToast(`Proposal decision (${uwDecision}) recorded successfully.`);
      setShowUwModal(false);
      loadInsurerData(selectedInsurerId);
    } catch (err) {
      console.error('Error submitting underwriting decision:', err);
      showToast('Failed to record underwriting decision.');
    }
  };

  // Adjudicate Claim
  const handleAdjudicateClaim = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/insurer/claims/adjudicate/${selectedClaim.id}`, {
        status: claimStatus,
        preAuthAmount: parseFloat(preAuthInput) || 0,
        approvedAmount: parseFloat(approvedInput) || 0,
        copayDeduction: parseFloat(copayInput) || 0,
        nonMedicalDeduction: parseFloat(nonMedicalInput) || 0,
        remarks: claimRemarks,
      });
      showToast(`Claim ${selectedClaim.claimNumber} adjudicated as ${claimStatus}.`);
      setShowClaimModal(false);
      loadInsurerData(selectedInsurerId);
    } catch (err) {
      console.error('Error adjudicating claim:', err);
      showToast('Failed to adjudicate claim.');
    }
  };

  // Generate Remittance Batch
  const handleGenerateBatch = async (e) => {
    e.preventDefault();
    try {
      await api.post('/insurer/settlements/generate', {
        insurerId: selectedInsurerId,
        grossPremium: batchGross,
        policiesBound: batchPolicies,
      });
      showToast('New remittance disbursement batch generated.');
      setShowGenerateBatchModal(false);
      loadInsurerData(selectedInsurerId);
    } catch (err) {
      console.error('Error generating settlement batch:', err);
      showToast('Failed to generate remittance batch.');
    }
  };

  // Simulate Open Insurance API Bind
  const handleTestBindApi = async () => {
    try {
      const partner = insurers.find(i => i.id === selectedInsurerId);
      const res = await api.post('/insurer/v1/policy/bind', {
        apiKey: partner.apiKey,
        policyNumber: `STAR-M2M-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: 'Anandita Roy (API Test)',
        productTitle: 'Comprehensive Shield',
        sumInsured: 1500000,
        premiumAmount: 24500,
      });
      setApiBindResult(res.data);
      showToast('M2M Policy Bind API tested successfully.');
    } catch (err) {
      console.error('Error in Bind API:', err);
      showToast('API Bind test failed.');
    }
  };

  // Simulate Webhook Event
  const handleSimulateWebhook = async () => {
    try {
      const res = await api.post('/insurer/v1/webhook/simulate', {
        insurerId: selectedInsurerId,
        eventType: 'POLICY_ISSUANCE_CALLBACK',
        reference: `M2M-REF-${Math.floor(1000 + Math.random() * 9000)}`,
      });
      setWebhookSimResult(res.data);
      showToast('Live simulated webhook callback dispatched.');
    } catch (err) {
      console.error('Error simulating webhook:', err);
      showToast('Webhook simulation failed.');
    }
  };

  const currentInsurer = insurers.find(i => i.id === selectedInsurerId) || (overview && overview.insurer);

  return (
    <div className="insurer-portal-page">
      {/* Toast Notification */}
      {toastMessage && <div className="insurer-toast">{toastMessage}</div>}

      {/* Header & Insurer Switcher */}
      <header className="insurer-header">
        <div className="insurer-header-left">
          <div className="insurer-badge-row">
            <span className="insurer-category-chip">🏛️ Underwriter B2B Hub</span>
            <span className="insurer-license-chip">IRDAI: {currentInsurer?.irdaRegNo || 'IRDAI/NL-01/2006'}</span>
            <span className="insurer-solvency-chip">Solvency: {currentInsurer?.solvencyRatio || '2.15'}x (Statutory: 1.50x)</span>
            <span className="insurer-csr-chip">CSR: {currentInsurer?.claimSettlementRatio || '98.2'}%</span>
          </div>
          <h1 className="insurer-title">{currentInsurer?.name || 'Star Health & Allied Insurance'}</h1>
          <p className="insurer-subtitle">
            Underwriter Cockpit &middot; Headquarters: {currentInsurer?.headquarters || 'Mumbai, Maharashtra'} &middot; Cashless Hospitals: {currentInsurer?.networkHospitals?.toLocaleString() || '14,200'}
          </p>
        </div>

        <div className="insurer-header-right">
          <div className="insurer-switcher-box">
            <label className="switcher-label">Switch Insurer:</label>
            <select
              className="insurer-select"
              value={selectedInsurerId}
              onChange={(e) => setSelectedInsurerId(e.target.value)}
            >
              {insurers.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          <button className="btn-refresh-insurer" onClick={() => loadInsurerData(selectedInsurerId)}>
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* Executive KPI Cards */}
      <section className="insurer-kpi-grid">
        <div className="insurer-kpi-card">
          <div className="kpi-icon-wrap icon-blue">💼</div>
          <div className="kpi-info">
            <span className="kpi-label">Gross Written Premium (GWP)</span>
            <span className="kpi-value">₹{(overview?.kpis?.grossWrittenPremium || 4035000).toLocaleString()}</span>
            <span className="kpi-meta">Across {overview?.kpis?.totalPoliciesBound || 310} bound policies</span>
          </div>
        </div>

        <div className="insurer-kpi-card">
          <div className="kpi-icon-wrap icon-emerald">📊</div>
          <div className="kpi-info">
            <span className="kpi-label">Incurred Claim Ratio (ICR)</span>
            <span className="kpi-value">{overview?.kpis?.incurredClaimRatio || 68.4}%</span>
            <span className={`kpi-tag tag-${(overview?.kpis?.icrStatus || 'OPTIMAL').toLowerCase()}`}>
              {overview?.kpis?.icrStatus || 'OPTIMAL'}
            </span>
          </div>
        </div>

        <div className="insurer-kpi-card">
          <div className="kpi-icon-wrap icon-purple">🏥</div>
          <div className="kpi-info">
            <span className="kpi-label">Active Claims Liability</span>
            <span className="kpi-value">₹{(overview?.kpis?.claimsLiabilityOutstanding || 78000).toLocaleString()}</span>
            <span className="kpi-meta">{overview?.kpis?.activeClaimsCount || 3} claims under review</span>
          </div>
        </div>

        <div className="insurer-kpi-card">
          <div className="kpi-icon-wrap icon-amber">🛡️</div>
          <div className="kpi-info">
            <span className="kpi-label">Solvency Headroom</span>
            <span className="kpi-value">+{((overview?.kpis?.solvencyRatio || 2.15) - 1.50).toFixed(2)}x</span>
            <span className="kpi-meta">Min 1.50x required by IRDAI</span>
          </div>
        </div>

        <div className="insurer-kpi-card">
          <div className="kpi-icon-wrap icon-indigo">⏱️</div>
          <div className="kpi-info">
            <span className="kpi-label">Avg Underwriting TAT</span>
            <span className="kpi-value">{overview?.kpis?.avgUnderwritingTatDays || 1.8} Days</span>
            <span className="kpi-meta">Auto-approval: {overview?.underwriting?.autoApprovalRate || 84.5}%</span>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="insurer-tabs-nav">
        <button
          className={`insurer-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview & Actuarial Health
        </button>
        <button
          className={`insurer-tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          🛡️ Products & Actuarial Rules ({rules.length})
        </button>
        <button
          className={`insurer-tab-btn ${activeTab === 'underwriting' ? 'active' : ''}`}
          onClick={() => setActiveTab('underwriting')}
        >
          ⚖️ Underwriting & Counter-Offers ({underwritingQueue.length})
        </button>
        <button
          className={`insurer-tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
          onClick={() => setActiveTab('claims')}
        >
          🏥 TPA & Cashless Claims Desk ({claimsQueue.length})
        </button>
        <button
          className={`insurer-tab-btn ${activeTab === 'settlements' ? 'active' : ''}`}
          onClick={() => setActiveTab('settlements')}
        >
          🧾 Remittance & Settlements ({settlements.length})
        </button>
        <button
          className={`insurer-tab-btn ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          🔌 Open Insurance API Gateway
        </button>
      </nav>

      {/* Tab 1: Overview & Actuarial Health */}
      {activeTab === 'overview' && (
        <section className="insurer-tab-content">
          <div className="overview-split-layout">
            <div className="overview-card-panel">
              <h3 className="panel-title">🏛️ Underwriter Solvency & Capital Sufficiency</h3>
              <p className="panel-desc">
                In compliance with IRDAI (Assets, Liabilities and Solvency Margin of General Insurance Business) Regulations.
              </p>
              <div className="solvency-bar-wrapper">
                <div className="solvency-labels">
                  <span>Available Solvency: {currentInsurer?.solvencyRatio || 2.15}x</span>
                  <span className="statutory-label">Statutory Minimum: 1.50x</span>
                </div>
                <div className="solvency-bar-track">
                  <div
                    className="solvency-bar-fill"
                    style={{ width: `${Math.min(100, ((currentInsurer?.solvencyRatio || 2.15) / 3.0) * 100)}%` }}
                  />
                  <div className="statutory-marker" style={{ left: '50%' }} title="1.50x Regulatory Threshold" />
                </div>
              </div>

              <div className="solvency-metrics-row">
                <div className="solvency-pill">
                  <span className="sp-title">Solvency Surplus</span>
                  <span className="sp-val">+{((currentInsurer?.solvencyRatio || 2.15) - 1.50).toFixed(2)}x Margin</span>
                </div>
                <div className="solvency-pill">
                  <span className="sp-title">Settlement Efficiency</span>
                  <span className="sp-val">{currentInsurer?.claimSettlementRatio || 98.2}% CSR</span>
                </div>
                <div className="solvency-pill">
                  <span className="sp-title">Cashless Network</span>
                  <span className="sp-val">{currentInsurer?.networkHospitals?.toLocaleString() || '14,200'} Hospitals</span>
                </div>
              </div>
            </div>

            <div className="overview-card-panel">
              <h3 className="panel-title">📈 Underwriting Incurred Claim Ratio (ICR)</h3>
              <p className="panel-desc">
                Measures total claim outlays against gross earned premium to evaluate portfolio profitability.
              </p>
              <div className="icr-gauge-display">
                <div className="icr-score-wrap">
                  <span className="icr-big-number">{overview?.kpis?.incurredClaimRatio || 68.4}%</span>
                  <span className="icr-status-badge tag-optimal">OPTIMAL HEALTH</span>
                </div>
                <p className="icr-explanation">
                  Target IRDAI Benchmark: <strong>65% – 75%</strong>. Loss ratios within this bracket ensure both competitive customer pricing and robust insurer solvency.
                </p>
              </div>

              <div className="remittance-quick-summary">
                <div className="rq-row">
                  <span>Platform Brokerage Fee:</span>
                  <strong>15.0%</strong>
                </div>
                <div className="rq-row">
                  <span>Section 194H TDS Withholding:</span>
                  <strong>5.0%</strong>
                </div>
                <div className="rq-row">
                  <span>Total Net Remitted to Insurer:</span>
                  <strong className="rq-net">₹{(overview?.kpis?.netRemittedToInsurer || 3399487).toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tab 2: Products & Actuarial Rules */}
      {activeTab === 'rules' && (
        <section className="insurer-tab-content">
          <div className="tab-header-actions">
            <div>
              <h3 className="tab-section-heading">Actuarial Policy Parameters & Underwriting Guidelines</h3>
              <p className="tab-section-desc">
                Configure waiting periods, room rent sub-limits, copays, and restoration benefits for {currentInsurer?.name}.
              </p>
            </div>
          </div>

          <div className="rules-cards-grid">
            {rules.map(r => (
              <div key={r.id} className="rule-card">
                <div className="rule-card-header">
                  <span className="rule-category-badge">{r.category}</span>
                  <h4 className="rule-title">{r.productTitle}</h4>
                </div>

                <div className="rule-details-list">
                  <div className="rule-detail-item">
                    <span>Entry Age Range:</span>
                    <strong>{r.minEntryAge} – {r.maxEntryAge} Years</strong>
                  </div>
                  <div className="rule-detail-item">
                    <span>Pre-Existing Waiting Period:</span>
                    <strong>{r.waitingPeriodMonths} Months</strong>
                  </div>
                  <div className="rule-detail-item">
                    <span>Room Rent Sub-Limit:</span>
                    <strong>{r.roomRentLimitPercent > 0 ? `${r.roomRentLimitPercent}% of Sum Insured` : 'No Sub-limit (100% Covered)'}</strong>
                  </div>
                  <div className="rule-detail-item">
                    <span>Co-Payment Requirement:</span>
                    <strong>{r.copayPercentage > 0 ? `${r.copayPercentage}% Co-Pay` : '0% Co-Pay (Full Cashless)'}</strong>
                  </div>
                  <div className="rule-detail-item">
                    <span>Maternity Waiting Period:</span>
                    <strong>{r.maternityWaitingMonths} Months</strong>
                  </div>
                  <div className="rule-detail-item">
                    <span>Restoration Benefit:</span>
                    <strong>{r.restorationBenefit ? '✅ Included (100%)' : '❌ Not Covered'}</strong>
                  </div>
                  <div className="rule-detail-item">
                    <span>AYUSH Hospitalization:</span>
                    <strong>{r.ayushCovered ? '✅ Covered' : '❌ Excluded'}</strong>
                  </div>
                </div>

                <div className="rule-card-footer">
                  <button
                    className="btn-edit-rule"
                    onClick={() => {
                      setEditingRule(r);
                      setShowRuleModal(true);
                    }}
                  >
                    ✏️ Configure Actuarial Guidelines
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab 3: Underwriting & Counter-Offers */}
      {activeTab === 'underwriting' && (
        <section className="insurer-tab-content">
          <div className="tab-header-actions">
            <div>
              <h3 className="tab-section-heading">High-Risk Referrals & Proposal Scrutiny Deck</h3>
              <p className="tab-section-desc">
                Review medical disclosures, adjust risk loading percentages, impose exclusion riders, or counter-offer to applicants.
              </p>
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="insurer-table">
              <thead>
                <tr>
                  <th>Proposal Ref</th>
                  <th>Applicant</th>
                  <th>Product & Coverage</th>
                  <th>Medical Disclosures & Risk</th>
                  <th>Quoted & Final Premium</th>
                  <th>Decision Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {underwritingQueue.map(q => (
                  <tr key={q.id}>
                    <td><code>{q.proposalRef}</code></td>
                    <td>
                      <strong>{q.customerName}</strong>
                      <div className="sub-text">{q.customerAge} Yrs</div>
                    </td>
                    <td>
                      <div>{q.productName}</div>
                      <div className="sub-text">Sum Insured: ₹{q.sumInsured?.toLocaleString()}</div>
                    </td>
                    <td>
                      <div className="disclosure-list">
                        {Array.isArray(q.medicalDisclosures) && q.medicalDisclosures.length > 0 ? (
                          q.medicalDisclosures.map((d, idx) => (
                            <span key={idx} className="disclosure-chip">{d}</span>
                          ))
                        ) : (
                          <span className="text-muted">Standard Health Declaration</span>
                        )}
                      </div>
                      <div className="sub-text">AI Risk Score: {q.aiRiskScore}/100</div>
                    </td>
                    <td>
                      <div>Quoted: ₹{q.quotedPremium?.toLocaleString()}</div>
                      <div className="final-premium-text">
                        Final: ₹{q.finalPremium?.toLocaleString()}
                        {q.loadingPercentage > 0 && <span className="loading-tag">+{q.loadingPercentage}%</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill pill-${q.decision?.toLowerCase()}`}>
                        {q.decision?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-action-sm"
                        onClick={() => {
                          setSelectedProposal(q);
                          setUwDecision(q.decision || 'COUNTER_OFFER_LOADING');
                          setLoadingPct(q.loadingPercentage || 15);
                          setExclusionInput(Array.isArray(q.exclusionList) ? q.exclusionList.join(', ') : '');
                          setUwRemarks(q.underwriterRemarks || '');
                          setShowUwModal(true);
                        }}
                      >
                        ⚖️ Underwrite
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 4: TPA & Cashless Claims Desk */}
      {activeTab === 'claims' && (
        <section className="insurer-tab-content">
          <div className="tab-header-actions">
            <div>
              <h3 className="tab-section-heading">TPA & Cashless Hospitalization Claims Desk</h3>
              <p className="tab-section-desc">
                Pre-authorization guarantees (GOP), bill scrutiny, copay/consumable deductions, and final claim settlement.
              </p>
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="insurer-table">
              <thead>
                <tr>
                  <th>Claim Number</th>
                  <th>Patient & Network Hospital</th>
                  <th>Diagnosis / Ailment</th>
                  <th>Claimed & Pre-Auth Amount</th>
                  <th>Approved Settlement</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {claimsQueue.map(c => (
                  <tr key={c.id}>
                    <td><code>{c.claimNumber}</code></td>
                    <td>
                      <strong>{c.patientName}</strong>
                      <div className="sub-text">{c.hospitalName} ({c.hospitalCity})</div>
                      <span className="network-tag">{c.networkTier}</span>
                    </td>
                    <td>
                      <strong>{c.ailment}</strong>
                      {c.remarks && <div className="sub-text remarks-text">{c.remarks}</div>}
                    </td>
                    <td>
                      <div>Claimed: ₹{c.claimedAmount?.toLocaleString()}</div>
                      {c.preAuthAmount && (
                        <div className="sub-text text-blue">Pre-Auth: ₹{c.preAuthAmount?.toLocaleString()}</div>
                      )}
                    </td>
                    <td>
                      {c.approvedAmount ? (
                        <strong className="text-emerald">₹{c.approvedAmount?.toLocaleString()}</strong>
                      ) : (
                        <span className="text-muted">Awaiting final bill</span>
                      )}
                      {c.copayDeduction > 0 && (
                        <div className="sub-text">Copay: -₹{c.copayDeduction?.toLocaleString()}</div>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill pill-${c.status?.toLowerCase()}`}>
                        {c.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-action-sm"
                        onClick={() => {
                          setSelectedClaim(c);
                          setClaimStatus(c.status || 'SETTLED');
                          setPreAuthInput(c.preAuthAmount || Math.round(c.claimedAmount * 0.85));
                          setApprovedInput(c.approvedAmount || c.claimedAmount);
                          setCopayInput(c.copayDeduction || 0);
                          setNonMedicalInput(c.nonMedicalDeduction || 0);
                          setClaimRemarks(c.remarks || '');
                          setShowClaimModal(true);
                        }}
                      >
                        🏥 Adjudicate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 5: Remittance & Settlements */}
      {activeTab === 'settlements' && (
        <section className="insurer-tab-content">
          <div className="tab-header-actions">
            <div>
              <h3 className="tab-section-heading">Brokerage Remittance & Monthly Financial Settlements</h3>
              <p className="tab-section-desc">
                Monthly gross written premium remittances, 15% platform brokerage deductions, and Section 194H 5% TDS accounting.
              </p>
            </div>
            <button
              className="btn-primary-action"
              onClick={() => setShowGenerateBatchModal(true)}
            >
              + Generate Settlement Batch
            </button>
          </div>

          <div className="table-responsive-wrapper">
            <table className="insurer-table">
              <thead>
                <tr>
                  <th>Batch Ref</th>
                  <th>Billing Period</th>
                  <th>Policies Bound</th>
                  <th>Gross Written Premium</th>
                  <th>Platform Brokerage (15%)</th>
                  <th>TDS (5% Sec 194H)</th>
                  <th>Net Remitted Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map(b => (
                  <tr key={b.id}>
                    <td><code>{b.batchNumber}</code></td>
                    <td><strong>{b.billingPeriod}</strong></td>
                    <td>{b.policiesBound} policies</td>
                    <td><strong>₹{b.grossPremium?.toLocaleString()}</strong></td>
                    <td className="text-amber">-₹{b.platformBrokerage?.toLocaleString()}</td>
                    <td className="text-blue">+₹{b.tdsDeduction?.toLocaleString()}</td>
                    <td><strong className="text-emerald">₹{b.netPayoutAmount?.toLocaleString()}</strong></td>
                    <td>
                      <span className="status-pill pill-disbursed">{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 6: Open Insurance API Gateway */}
      {activeTab === 'api' && (
        <section className="insurer-tab-content">
          <div className="api-gateway-layout">
            <div className="api-panel credentials-card">
              <h3 className="panel-title">🔑 Machine-to-Machine API Credentials</h3>
              <p className="panel-desc">
                Use these secure credentials to integrate core insurer administrative systems with PolicySphere APIs.
              </p>

              <div className="credential-field">
                <label>Insurer API Key:</label>
                <div className="key-display-box">
                  <code>{currentInsurer?.apiKey || 'ps_live_star_health_84920482'}</code>
                  <button
                    className="btn-copy-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(currentInsurer?.apiKey || '');
                      showToast('API Key copied to clipboard!');
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="credential-field">
                <label>Webhook Callback URL:</label>
                <div className="key-display-box">
                  <code>{currentInsurer?.webhookUrl || 'https://api.starhealth.in/v1/policysphere-webhook'}</code>
                </div>
              </div>

              <div className="api-meta-list">
                <div>⚡ Rate Limit: <strong>1,200 Requests / Minute</strong></div>
                <div>🔒 Authentication: <strong>x-api-key HTTP Header</strong></div>
                <div>🌐 API Protocol: <strong>REST / JSON (TLS 1.3)</strong></div>
              </div>
            </div>

            <div className="api-panel interactive-tester-card">
              <h3 className="panel-title">⚡ Interactive Open Insurance API Simulator</h3>
              <p className="panel-desc">
                Test real-time policy binding and dispatch simulated webhook events into PolicySphere.
              </p>

              <div className="tester-btn-row">
                <button className="btn-secondary-tester" onClick={handleTestBindApi}>
                  🚀 Test M2M Policy Bind API (`/v1/policy/bind`)
                </button>
                <button className="btn-secondary-tester" onClick={handleSimulateWebhook}>
                  📡 Dispatch Simulated Webhook (`/v1/webhook/simulate`)
                </button>
              </div>

              {apiBindResult && (
                <div className="result-code-box">
                  <div className="rc-header">Policy Bind API Response (200 OK):</div>
                  <pre>{JSON.stringify(apiBindResult, null, 2)}</pre>
                </div>
              )}

              {webhookSimResult && (
                <div className="result-code-box">
                  <div className="rc-header">Webhook Dispatcher Receipt:</div>
                  <pre>{JSON.stringify(webhookSimResult, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Modal: Edit Actuarial Rules */}
      {showRuleModal && editingRule && (
        <div className="modal-backdrop-blur">
          <div className="insurer-modal-box">
            <div className="modal-header">
              <h3>Configure Actuarial Guidelines</h3>
              <button className="modal-close-btn" onClick={() => setShowRuleModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveRule} className="modal-body-form">
              <div className="form-group">
                <label>Product Title:</label>
                <input
                  type="text"
                  value={editingRule.productTitle || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, productTitle: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Min Entry Age (Yrs):</label>
                  <input
                    type="number"
                    value={editingRule.minEntryAge || 18}
                    onChange={(e) => setEditingRule({ ...editingRule, minEntryAge: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Max Entry Age (Yrs):</label>
                  <input
                    type="number"
                    value={editingRule.maxEntryAge || 65}
                    onChange={(e) => setEditingRule({ ...editingRule, maxEntryAge: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Waiting Period (Months):</label>
                  <input
                    type="number"
                    value={editingRule.waitingPeriodMonths || 24}
                    onChange={(e) => setEditingRule({ ...editingRule, waitingPeriodMonths: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Room Rent Limit (% of SI, 0 = None):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingRule.roomRentLimitPercent || 0}
                    onChange={(e) => setEditingRule({ ...editingRule, roomRentLimitPercent: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Co-Pay Percentage (%):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingRule.copayPercentage || 0}
                    onChange={(e) => setEditingRule({ ...editingRule, copayPercentage: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Maternity Waiting (Months):</label>
                  <input
                    type="number"
                    value={editingRule.maternityWaitingMonths || 24}
                    onChange={(e) => setEditingRule({ ...editingRule, maternityWaitingMonths: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-checkbox-row">
                <label>
                  <input
                    type="checkbox"
                    checked={editingRule.restorationBenefit || false}
                    onChange={(e) => setEditingRule({ ...editingRule, restorationBenefit: e.target.checked })}
                  />
                  100% Restoration Benefit
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={editingRule.ayushCovered || false}
                    onChange={(e) => setEditingRule({ ...editingRule, ayushCovered: e.target.checked })}
                  />
                  AYUSH Hospitalization Cover
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowRuleModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Guidelines</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Underwrite Proposal / Counter-Offer */}
      {showUwModal && selectedProposal && (
        <div className="modal-backdrop-blur">
          <div className="insurer-modal-box">
            <div className="modal-header">
              <h3>Underwriting Scrutiny & Counter-Offer</h3>
              <button className="modal-close-btn" onClick={() => setShowUwModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitUnderwriting} className="modal-body-form">
              <div className="summary-banner">
                <div>Applicant: <strong>{selectedProposal.customerName} ({selectedProposal.customerAge} Yrs)</strong></div>
                <div>Proposal: <strong>{selectedProposal.proposalRef}</strong></div>
                <div>Base Quoted Premium: <strong>₹{selectedProposal.quotedPremium?.toLocaleString()}</strong></div>
              </div>

              <div className="form-group">
                <label>Underwriting Decision:</label>
                <select
                  value={uwDecision}
                  onChange={(e) => setUwDecision(e.target.value)}
                  className="modal-select"
                >
                  <option value="STANDARD_APPROVAL">Standard Approval (Bind at Quoted Rate)</option>
                  <option value="COUNTER_OFFER_LOADING">Counter-Offer with Risk Loading %</option>
                  <option value="EXCLUSION_IMPOSED">Impose Specific Disease Exclusions</option>
                  <option value="DECLINED">Decline / Repudiate Application</option>
                </select>
              </div>

              {uwDecision === 'COUNTER_OFFER_LOADING' && (
                <div className="form-group">
                  <label>Loading Surcharge (%):</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={loadingPct}
                    onChange={(e) => setLoadingPct(e.target.value)}
                    required
                  />
                  <div className="sub-hint">
                    Revised Premium to Customer: <strong>₹{Math.round((selectedProposal.quotedPremium || 20000) * (1 + (parseFloat(loadingPct) || 0) / 100)).toLocaleString()}</strong>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Disease Specific Exclusions (comma separated):</label>
                <input
                  type="text"
                  value={exclusionInput}
                  onChange={(e) => setExclusionInput(e.target.value)}
                  placeholder="e.g. Pre-existing Joint Replacement 24m, Diabetic Retinopathy"
                />
              </div>

              <div className="form-group">
                <label>Underwriter Medical Rationale:</label>
                <textarea
                  rows="3"
                  value={uwRemarks}
                  onChange={(e) => setUwRemarks(e.target.value)}
                  placeholder="State medical findings, lab report interpretations, and justification."
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowUwModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Underwriting Decision</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjudicate Claim */}
      {showClaimModal && selectedClaim && (
        <div className="modal-backdrop-blur">
          <div className="insurer-modal-box">
            <div className="modal-header">
              <h3>TPA Claims Adjudication Desk</h3>
              <button className="modal-close-btn" onClick={() => setShowClaimModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdjudicateClaim} className="modal-body-form">
              <div className="summary-banner">
                <div>Claim: <strong>{selectedClaim.claimNumber}</strong> &middot; Patient: <strong>{selectedClaim.patientName}</strong></div>
                <div>Hospital: <strong>{selectedClaim.hospitalName}</strong></div>
                <div>Claimed Amount: <strong>₹{selectedClaim.claimedAmount?.toLocaleString()}</strong></div>
              </div>

              <div className="form-group">
                <label>Adjudication Action:</label>
                <select
                  value={claimStatus}
                  onChange={(e) => setClaimStatus(e.target.value)}
                  className="modal-select"
                >
                  <option value="PREAUTH_APPROVED">Issue Pre-Auth Guarantee of Payment (GOP)</option>
                  <option value="SETTLED">Final Settlement (Issue Discharge Payout)</option>
                  <option value="ADDITIONAL_DOCS_REQUESTED">Query Deficiency Documents</option>
                  <option value="REPUDIATED">Repudiate / Reject Claim</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pre-Auth GOP Sanction (₹):</label>
                  <input
                    type="number"
                    value={preAuthInput}
                    onChange={(e) => setPreAuthInput(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Net Approved Settlement (₹):</label>
                  <input
                    type="number"
                    value={approvedInput}
                    onChange={(e) => setApprovedInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Copay Deduction (₹):</label>
                  <input
                    type="number"
                    value={copayInput}
                    onChange={(e) => setCopayInput(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Non-Medical Deduction (₹):</label>
                  <input
                    type="number"
                    value={nonMedicalInput}
                    onChange={(e) => setNonMedicalInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Adjudication Notes & Remarks:</label>
                <textarea
                  rows="2"
                  value={claimRemarks}
                  onChange={(e) => setClaimRemarks(e.target.value)}
                  placeholder="Itemized scrutiny rationale, surveyor review, and policy clause citations."
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowClaimModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Confirm Adjudication</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Generate Settlement Statement */}
      {showGenerateBatchModal && (
        <div className="modal-backdrop-blur">
          <div className="insurer-modal-box">
            <div className="modal-header">
              <h3>Generate Monthly Remittance Batch</h3>
              <button className="modal-close-btn" onClick={() => setShowGenerateBatchModal(false)}>✕</button>
            </div>
            <form onSubmit={handleGenerateBatch} className="modal-body-form">
              <div className="form-group">
                <label>Gross Written Premium Collected (₹):</label>
                <input
                  type="number"
                  value={batchGross}
                  onChange={(e) => setBatchGross(parseFloat(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Policies Bound Headcount:</label>
                <input
                  type="number"
                  value={batchPolicies}
                  onChange={(e) => setBatchPolicies(parseInt(e.target.value))}
                  required
                />
              </div>

              <div className="remittance-preview-box">
                <div>Gross Premium: <strong>₹{batchGross?.toLocaleString()}</strong></div>
                <div>Platform Brokerage Fee (15%): <strong className="text-amber">-₹{Math.round(batchGross * 0.15).toLocaleString()}</strong></div>
                <div>Section 194H TDS (5% on fee): <strong className="text-blue">+₹{Math.round(batchGross * 0.15 * 0.05).toLocaleString()}</strong></div>
                <div className="np-total">Net Remittance to Insurer: <strong className="text-emerald">₹{Math.round(batchGross - (batchGross * 0.15) + (batchGross * 0.15 * 0.05)).toLocaleString()}</strong></div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowGenerateBatchModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Disburse Remittance</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
