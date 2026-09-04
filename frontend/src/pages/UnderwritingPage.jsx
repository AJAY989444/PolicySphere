import React, { useState, useEffect } from 'react';
import underwritingApi from '../services/api/underwritingApi';
import './UnderwritingPage.css';

const RIDER_OPTIONS = [
  { id: 'EXCLUDE_DIABETES_24M', label: 'Exclude Pre-existing Diabetes (24m Waiting Period)' },
  { id: 'EXCLUDE_HYPERTENSION_12M', label: 'Exclude Hypertension Complications (12m)' },
  { id: 'EXCLUDE_CRITICAL_ILLNESS', label: 'Exclude Critical Illness Rider' },
  { id: 'EXCLUDE_EXTREME_SPORTS', label: 'Exclude High Risk / Extreme Sports' },
  { id: 'MANDATORY_HEALTH_CHECK', label: 'Mandatory Medical Tele-Check Required' },
];

export default function UnderwritingPage() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'audit'
  const [metrics, setMetrics] = useState({
    totalAssessments: 0,
    autoApprovedCount: 0,
    autoApprovalRate: 0,
    pendingReferrals: 0,
    highRiskCount: 0,
    avgLoadingPercent: 0,
  });

  const [assessments, setAssessments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluatingProposalId, setEvaluatingProposalId] = useState('');
  const [evalLoading, setEvalLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Review Modal State
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [underwriterNotes, setUnderwriterNotes] = useState('');
  const [selectedRiders, setSelectedRiders] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [riskFilter, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [mRes, aRes, logsRes] = await Promise.all([
        underwritingApi.getMetrics(),
        underwritingApi.getAssessments({ riskLevel: riskFilter, status: statusFilter, search: searchQuery }),
        underwritingApi.getAuditLogs(),
      ]);

      if (mRes.success) setMetrics(mRes.data);
      if (aRes.success) setAssessments(aRes.data);
      if (logsRes.success) setAuditLogs(logsRes.data);
    } catch (err) {
      console.error('Error loading underwriting workspace data:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to load underwriting portal records');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleEvaluateNewProposal = async (e) => {
    e.preventDefault();
    if (!evaluatingProposalId.trim()) return;
    setEvalLoading(true);
    setErrorMsg('');
    try {
      const res = await underwritingApi.evaluateProposal(evaluatingProposalId.trim());
      if (res.success) {
        setEvaluatingProposalId('');
        fetchData();
        openReviewModal(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to evaluate proposal ID. Verify valid ID.');
    } finally {
      setEvalLoading(false);
    }
  };

  const openReviewModal = (item) => {
    setSelectedAssessment(item);
    setLoadingPercent(item.appliedLoading || 0);
    setUnderwriterNotes(item.underwriterNotes || '');
    setSelectedRiders(Array.isArray(item.riderExclusions) ? item.riderExclusions : []);
  };

  const closeReviewModal = () => {
    setSelectedAssessment(null);
  };

  const toggleRiderExclusion = (riderId) => {
    if (selectedRiders.includes(riderId)) {
      setSelectedRiders(selectedRiders.filter((r) => r !== riderId));
    } else {
      setSelectedRiders([...selectedRiders, riderId]);
    }
  };

  const handleDecisionSubmit = async (decision) => {
    if (!selectedAssessment) return;
    setActionLoading(true);
    try {
      const payload = {
        decision,
        customLoading: loadingPercent,
        notes: underwriterNotes,
        riderExclusions: selectedRiders,
      };

      const res = await underwritingApi.submitDecision(selectedAssessment.id, payload);
      if (res.success) {
        closeReviewModal();
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting underwriter decision');
    } finally {
      setActionLoading(false);
    }
  };

  const getRiskMeterClass = (level) => {
    switch (level) {
      case 'LOW': return 'meter-low';
      case 'MEDIUM': return 'meter-medium';
      case 'HIGH': return 'meter-high';
      case 'DECLINED': return 'meter-declined';
      default: return 'meter-medium';
    }
  };

  const getRiskBadgeClass = (level) => {
    switch (level) {
      case 'LOW': return 'badge-low';
      case 'MEDIUM': return 'badge-medium';
      case 'HIGH': return 'badge-high';
      case 'DECLINED': return 'badge-declined';
      default: return 'badge-medium';
    }
  };

  return (
    <div className="underwriting-page">
      {/* Header */}
      <div className="underwriting-header">
        <div>
          <div className="header-title-badge">
            <span>⚖️ AI Underwriting & IRDAI Compliance Engine</span>
          </div>
          <h1>Underwriting & Compliance Portal</h1>
          <p>Automated risk assessment algorithms, premium loading calculators, and regulatory compliance audit trail</p>
        </div>

        <div className="header-actions">
          <form onSubmit={handleEvaluateNewProposal} className="eval-input-group">
            <input
              type="text"
              placeholder="Enter Proposal ID to evaluate..."
              value={evaluatingProposalId}
              onChange={(e) => setEvaluatingProposalId(e.target.value)}
            />
            <button type="submit" className="btn-primary-gradient" disabled={evalLoading}>
              {evalLoading ? 'Evaluating...' : '⚡ Run AI Risk Assessment'}
            </button>
          </form>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Executive Metrics Header Cards */}
      <div className="underwriting-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box metric-icon-indigo">📊</div>
          <div className="metric-info">
            <label>Total Evaluated</label>
            <h3>{metrics.totalAssessments}</h3>
            <span>Proposals Scored</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box metric-icon-emerald">⚡</div>
          <div className="metric-info">
            <label>Auto-Approval Rate</label>
            <h3>{metrics.autoApprovalRate}%</h3>
            <span>Instant Straight-Through</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box metric-icon-amber">🔍</div>
          <div className="metric-info">
            <label>Pending Referrals</label>
            <h3>{metrics.pendingReferrals}</h3>
            <span>Underwriter Action Required</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box metric-icon-rose">📈</div>
          <div className="metric-info">
            <label>Average Loading</label>
            <h3>+{metrics.avgLoadingPercent}%</h3>
            <span>Risk-Adjusted Premium</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="underwriting-tab-bar">
        <button
          className={`tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          📋 Assessment Queue ({assessments.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          🛡️ IRDAI Compliance Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* QUEUE TAB */}
      {activeTab === 'queue' && (
        <div>
          <div className="queue-controls">
            <div className="search-filter-group">
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Search ref, applicant, email..."
                  className="control-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn-sm-action">Search</button>
              </form>

              <select
                className="control-select"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
              >
                <option value="ALL">All Risk Levels</option>
                <option value="LOW">Low Risk (&lt; 25)</option>
                <option value="MEDIUM">Medium Risk (25-65)</option>
                <option value="HIGH">High Risk (&gt; 65)</option>
                <option value="DECLINED">Declined (&gt; 90)</option>
              </select>

              <select
                className="control-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="AUTO_APPROVED">Auto Approved</option>
                <option value="PENDING_REVIEW">Pending Underwriter Review</option>
                <option value="APPROVED_WITH_LOADING">Approved with Loading</option>
                <option value="COUNTER_OFFERED">Counter Offered</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <div className="table-container">
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Loading Underwriting Queue...</div>
            ) : assessments.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#475569', fontWeight: 600 }}>No assessments match current filters.</div>
            ) : (
              <table className="uw-table">
                <thead>
                  <tr>
                    <th>Proposal Ref</th>
                    <th>Applicant</th>
                    <th>Policy Product</th>
                    <th>Risk Score</th>
                    <th>Risk Level</th>
                    <th>Loading %</th>
                    <th>Final Premium</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4f46e5' }}>
                        {item.proposal?.proposalRef || item.proposalId.substring(0, 8)}
                      </td>
                      <td>
                        <div className="applicant-meta">
                          <h4>{item.user ? `${item.user.firstName} ${item.user.lastName}` : 'N/A'}</h4>
                          <span>{item.user?.email}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.policy?.name || 'Standard Plan'}</td>
                      <td>
                        <div className="risk-meter-cell">
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                            <span>Score</span>
                            <span>{item.riskScore} / 100</span>
                          </div>
                          <div className="meter-bar-bg">
                            <div
                              className={`meter-bar-fill ${getRiskMeterClass(item.riskLevel)}`}
                              style={{ width: `${Math.min(item.riskScore, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getRiskBadgeClass(item.riskLevel)}`}>
                          {item.riskLevel}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: item.appliedLoading > 0 ? '#d97706' : '#059669' }}>
                        +{item.appliedLoading}%
                      </td>
                      <td style={{ fontWeight: 800, color: '#0f172a' }}>
                        ₹{item.finalPremium?.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span className={`badge-status status-${item.status.toLowerCase().replace(/_/g, '-')}`}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <button className="btn-sm-action" onClick={() => openReviewModal(item)}>
                          🔍 Review / Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* COMPLIANCE AUDIT LOGS TAB */}
      {activeTab === 'audit' && (
        <div className="audit-log-feed">
          {auditLogs.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>No compliance audit records found.</div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="audit-card">
                <div className="audit-main">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className={`badge ${log.compliancePassed ? 'badge-low' : 'badge-declined'}`}>
                      {log.compliancePassed ? 'PASSED' : 'FLAGGED / FAILED'}
                    </span>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{log.action}</strong>
                  </div>
                  <p>
                    Proposal Ref: <code style={{ color: '#4f46e5', fontWeight: 700 }}>{log.assessment?.proposal?.proposalRef || log.proposalId || 'N/A'}</code>
                    {' • '}
                    Applicant: {log.assessment?.user ? `${log.assessment.user.firstName} ${log.assessment.user.lastName}` : 'System'}
                  </p>
                  <div className="audit-meta-tags">
                    <span className="tag-rule">Rule: {log.ruleTriggered || 'IRDAI_GENERIC_UW'}</span>
                    <span style={{ color: '#475569', fontWeight: 500 }}>Details: {JSON.stringify(log.metadata)}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  {new Date(log.createdAt).toLocaleString('en-IN')}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* UNDERWRITER REVIEW & COUNTER-OFFER MODAL */}
      {selectedAssessment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Underwriting Review — Ref #{selectedAssessment.proposal?.proposalRef || selectedAssessment.proposalId}</h2>
              <button className="btn-close" onClick={closeReviewModal}>&times;</button>
            </div>

            <div className="modal-body">
              {/* Applicant & Policy Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>APPLICANT</label>
                  <h4 style={{ margin: '0.2rem 0', color: '#0f172a', fontWeight: 800 }}>
                    {selectedAssessment.user ? `${selectedAssessment.user.firstName} ${selectedAssessment.user.lastName}` : 'N/A'}
                  </h4>
                  <span style={{ fontSize: '0.825rem', color: '#475569', fontWeight: 500 }}>{selectedAssessment.user?.email}</span>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>PRODUCT COVERAGE</label>
                  <h4 style={{ margin: '0.2rem 0', color: '#4f46e5', fontWeight: 800 }}>{selectedAssessment.policy?.name || 'Insurance Plan'}</h4>
                  <span style={{ fontSize: '0.825rem', color: '#475569', fontWeight: 500 }}>Coverage: ₹{selectedAssessment.policy?.coverageAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Risk Breakdown */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>Automated Risk Factors Identified</h4>
                  <span className={`badge ${getRiskBadgeClass(selectedAssessment.riskLevel)}`}>
                    Score: {selectedAssessment.riskScore} / 100 ({selectedAssessment.riskLevel})
                  </span>
                </div>

                <div className="risk-factors-list">
                  {Array.isArray(selectedAssessment.riskFactors) && selectedAssessment.riskFactors.length > 0 ? (
                    selectedAssessment.riskFactors.map((rf, idx) => (
                      <div key={idx} className="risk-factor-item">
                        <div>
                          <strong style={{ color: '#0f172a', marginRight: '0.5rem' }}>[{rf.category}]</strong>
                          <span style={{ color: '#334155' }}>{rf.factor}</span>
                        </div>
                        <span>+{rf.points} pts</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.875rem', color: '#059669', fontStyle: 'italic', fontWeight: 600 }}>No adverse risk flags detected. Standard baseline risk.</div>
                  )}
                </div>
              </div>

              {/* Interactive Loading Slider */}
              <div className="loading-slider-box">
                <div className="slider-header">
                  <label style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>Adjust Underwriter Loading Percentage</label>
                  <strong style={{ color: '#b45309', fontSize: '1.15rem' }}>+{loadingPercent}% Premium Loading</strong>
                </div>

                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  className="loading-slider"
                  value={loadingPercent}
                  onChange={(e) => setLoadingPercent(parseInt(e.target.value, 10))}
                />

                <div className="premium-calc-preview">
                  <div className="calc-box">
                    <label>Base Premium</label>
                    <strong>₹{selectedAssessment.basePremium?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="calc-box">
                    <label>Loading Amount</label>
                    <strong style={{ color: '#b45309' }}>
                      +₹{Math.round(selectedAssessment.basePremium * (loadingPercent / 100))?.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="calc-box">
                    <label>Final Premium</label>
                    <strong className="accent">
                      ₹{Math.round(selectedAssessment.basePremium * (1 + loadingPercent / 100))?.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Rider Exclusions & Conditions */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', display: 'block', marginBottom: '0.4rem' }}>
                  Select Mandatory Rider Exclusions / Special Clauses:
                </label>
                <div className="rider-exclusions-grid">
                  {RIDER_OPTIONS.map((opt) => (
                    <label key={opt.id} className="exclusion-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedRiders.includes(opt.id)}
                        onChange={() => toggleRiderExclusion(opt.id)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Underwriter Notes */}
              <div>
                <label style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', display: 'block', marginBottom: '0.4rem' }}>
                  Underwriter Notes & Justification:
                </label>
                <textarea
                  rows="3"
                  className="control-input"
                  style={{ width: '100%', resize: 'vertical' }}
                  placeholder="Record underwriting observations, medical report reviews, or IRDAI exception reasoning..."
                  value={underwriterNotes}
                  onChange={(e) => setUnderwriterNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-footer">
              <button
                className="btn-reject-proposal"
                disabled={actionLoading}
                onClick={() => handleDecisionSubmit('REJECTED')}
              >
                ❌ Reject Proposal
              </button>

              <button
                className="btn-counter-offer"
                disabled={actionLoading}
                onClick={() => handleDecisionSubmit('COUNTER_OFFERED')}
              >
                📩 Issue Counter-Offer
              </button>

              <button
                className="btn-approve-loading"
                disabled={actionLoading}
                onClick={() => handleDecisionSubmit('APPROVED_WITH_LOADING')}
              >
                ✅ Approve with Loading (+{loadingPercent}%)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
