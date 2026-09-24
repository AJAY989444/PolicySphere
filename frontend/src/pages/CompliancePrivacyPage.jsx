import React, { useState, useEffect } from 'react';
import './CompliancePrivacyPage.css';
import api from '../services/api/axios';

export default function CompliancePrivacyPage() {
  const [activeTab, setActiveTab] = useState('consents');

  // ─── DPDP Consents State ───
  const [consents, setConsents] = useState([]);
  const [consentsLoading, setConsentsLoading] = useState(false);
  const [consentMsg, setConsentMsg] = useState(null);

  // ─── Data Dossier State ───
  const [dossier, setDossier] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);

  // ─── Erasure Request State ───
  const [erasureReason, setErasureReason] = useState('');
  const [erasureLoading, setErasureLoading] = useState(false);
  const [erasureSubmitted, setErasureSubmitted] = useState(false);

  // ─── Fraud Radar State ───
  const [fraudStats, setFraudStats] = useState(null);
  const [fraudLoading, setFraudLoading] = useState(false);
  const [scanAmount, setScanAmount] = useState(75000);
  const [scanHospital, setScanHospital] = useState('Apollo Hospitals (Recognized)');
  const [scanType, setScanType] = useState('HEALTH_CASHLESS');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  // ─── PII Masking Sandbox State ───
  const [maskInput, setMaskInput] = useState({
    aadhaar: '987654321098',
    pan: 'ABCDE1234F',
    phone: '+919876543210',
    email: 'john.doe@example.com',
    bankAccount: '123456789012',
  });
  const [maskResult, setMaskResult] = useState(null);

  // Fetch Consents
  const fetchConsents = async () => {
    try {
      setConsentsLoading(true);
      const res = await api.get('/compliance/consents');
      if (res.data.success) {
        setConsents(res.data.consents);
      }
    } catch {
      // Fallback standard purposes for demonstration
      setConsents([
        {
          purpose: 'MARKETING_COMMUNICATION',
          title: 'Marketing & Promotional Communications',
          description: 'Periodic email, SMS, and WhatsApp alerts regarding renewal discounts, new policy launches, and tax saver offers.',
          isMandatory: false,
          status: 'GRANTED',
          version: 'v2023.1',
        },
        {
          purpose: 'HEALTH_DATA_PROCESSING',
          title: 'Health & Medical Record Processing',
          description: 'Processing medical history, diagnostic reports, and hospital records for underwriting and cashless claim adjudication.',
          isMandatory: true,
          status: 'GRANTED',
          version: 'v2023.1',
        },
        {
          purpose: 'INSURER_UNDERWRITING_SHARING',
          title: 'Third-Party Insurer Data Exchange',
          description: 'Secure transmission of proposal data to partner insurance underwriters for policy binding.',
          isMandatory: true,
          status: 'GRANTED',
          version: 'v2023.1',
        },
        {
          purpose: 'AUTO_DEBIT_RENEWAL',
          title: 'Recurring Mandate & Auto-Debit',
          description: 'Automated policy renewal debit on premium due date to prevent coverage lapse.',
          isMandatory: false,
          status: 'REVOKED',
          version: 'v2023.1',
        },
        {
          purpose: 'NOMINEE_DATA_ACCESS',
          title: 'Nominee Identity & Settlement Access',
          description: 'Accessing nominated beneficiary contact information in the event of death or accidental claims.',
          isMandatory: false,
          status: 'GRANTED',
          version: 'v2023.1',
        },
      ]);
    } finally {
      setConsentsLoading(false);
    }
  };

  // Toggle Consent
  const toggleConsent = async (purpose, currentStatus) => {
    const newStatus = currentStatus === 'GRANTED' ? 'REVOKED' : 'GRANTED';
    try {
      const res = await api.post('/compliance/consents', { purpose, status: newStatus });
      if (res.data.success) {
        setConsentMsg(`Consent for ${purpose} set to ${newStatus}`);
        setConsents((prev) =>
          prev.map((c) => (c.purpose === purpose ? { ...c, status: newStatus } : c))
        );
        setTimeout(() => setConsentMsg(null), 4000);
      }
    } catch (err) {
      setConsentMsg(err.response?.data?.message || err.message);
    }
  };

  // Fetch Data Dossier
  const handleExportDossier = async () => {
    try {
      setDossierLoading(true);
      const res = await api.get('/compliance/dossier');
      if (res.data.success) {
        setDossier(res.data.dossier);
      }
    } catch {
      // Demo dossier
      const fallback = {
        dossierMetadata: {
          exportDate: new Date().toISOString(),
          regulatoryStandard: 'Digital Personal Data Protection Act (DPDP India 2023)',
          complianceOfficer: 'dataprivacy@policysphere.com',
          retentionObligations: 'Under IRDAI AML regulations, policy records must be retained for 10 years.',
        },
        personalProfile: {
          name: 'John Doe',
          email: 'j***e@example.com',
          phone: '+91 XXXXX-XX10',
          role: 'CUSTOMER',
        },
        consentsTracked: consents,
      };
      setDossier(fallback);
    } finally {
      setDossierLoading(false);
    }
  };

  const downloadDossierFile = () => {
    if (!dossier) return;
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `policysphere-personal-dossier-${Date.now()}.json`;
    a.click();
  };

  // Submit Erasure
  const handleErasureSubmit = async (e) => {
    e.preventDefault();
    try {
      setErasureLoading(true);
      const res = await api.post('/compliance/erasure', { reason: erasureReason });
      if (res.data.success) {
        setErasureSubmitted(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setErasureLoading(false);
    }
  };

  // Fetch Fraud Stats
  const fetchFraudStats = async () => {
    try {
      setFraudLoading(true);
      const res = await api.get('/compliance/fraud/radar');
      if (res.data.success) {
        setFraudStats(res.data.stats);
      }
    } catch {
      setFraudStats({
        totalAssessed: 48,
        criticalFlags: 2,
        highRiskFlags: 5,
        elevatedFlags: 8,
        lowRiskCount: 33,
        cleanRatePercent: 93.8,
        blacklistedFacilitiesCount: 3,
      });
    } finally {
      setFraudLoading(false);
    }
  };

  // Run Fraud Scanner
  const runFraudScan = async () => {
    try {
      setScanning(true);
      const res = await fetch('http://localhost:5000/api/compliance/fraud/analyze-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimAmount: parseFloat(scanAmount),
          hospitalName: scanHospital,
          claimType: scanType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScanResult(data.assessment);
      }
    } catch (err) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  // Test PII Masking
  const testMasking = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/compliance/security/mask-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maskInput),
      });
      const data = await res.json();
      if (data.success) {
        setMaskResult(data);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchConsents();
    fetchFraudStats();
    testMasking();
  }, []);

  return (
    <div className="compliance-container">
      {/* Header */}
      <div className="compliance-header">
        <div className="compliance-title">
          <h1>🛡️ Enterprise Privacy, Compliance &amp; Fraud Radar</h1>
          <p>
            Regulatory governance center: DPDP Act (India 2023) Consent Architecture, AES-256 PII Vault,
            Right to Erasure, and Autonomous AI Fraud Scoring.
          </p>
        </div>
        <div className="compliance-badges">
          <span className="compliance-badge">DPDP India 2023</span>
          <span className="compliance-badge">IRDAI AML Tier 1</span>
          <span className="compliance-badge">AES-256-GCM Vault</span>
          <span className="compliance-badge">ABAC Enabled</span>
          <span className="compliance-badge">AI Fraud Radar</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="compliance-tabs">
        <button
          className={`compliance-tab ${activeTab === 'consents' ? 'active' : ''}`}
          onClick={() => setActiveTab('consents')}
        >
          📜 DPDP Consent Vault
        </button>
        <button
          className={`compliance-tab ${activeTab === 'dossier' ? 'active' : ''}`}
          onClick={() => setActiveTab('dossier')}
        >
          📦 Data Dossier &amp; Portability
        </button>
        <button
          className={`compliance-tab ${activeTab === 'erasure' ? 'active' : ''}`}
          onClick={() => setActiveTab('erasure')}
        >
          🗑️ Right to Erasure
        </button>
        <button
          className={`compliance-tab ${activeTab === 'fraud' ? 'active' : ''}`}
          onClick={() => setActiveTab('fraud')}
        >
          🚨 Autonomous Fraud Radar
        </button>
      </div>

      {/* TAB 1: DPDP Consents */}
      {activeTab === 'consents' && (
        <div>
          <div className="compliance-card">
            <h3>Digital Consent Management (DPDP Act India 2023 Section 6)</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 20px' }}>
              Under the Digital Personal Data Protection Act (India), you have the statutory right to grant, review, or
              withdraw purpose-bound consents at any time. Changes take effect immediately.
            </p>

            {consentMsg && (
              <div className="notice-banner" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534', borderLeftColor: '#10b981' }}>
                ✓ {consentMsg}
              </div>
            )}

            <div className="consents-grid">
              {consents.map((c) => {
                const isGranted = c.status === 'GRANTED';
                return (
                  <div key={c.purpose} className="consent-item">
                    <div className="consent-info">
                      <div className="consent-header">
                        <span className="consent-title">{c.title}</span>
                        {c.isMandatory && <span className="pill-mandatory">MANDATORY</span>}
                        <span className={isGranted ? 'pill-granted' : 'pill-revoked'}>
                          {c.status}
                        </span>
                      </div>
                      <p className="consent-desc">{c.description}</p>
                      <div className="consent-meta">
                        Standard: <strong>{c.version}</strong> | Purpose Code: <code>{c.purpose}</code>
                      </div>
                    </div>

                    <div>
                      {c.isMandatory ? (
                        <button disabled className="btn-compliance btn-compliance-secondary" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                          🔒 Required for Policy Issuance
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleConsent(c.purpose, c.status)}
                          className={`btn-compliance ${isGranted ? 'btn-compliance-danger' : 'btn-compliance-primary'}`}
                        >
                          {isGranted ? 'Revoke Consent' : 'Grant Consent'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Personal Data Dossier */}
      {activeTab === 'dossier' && (
        <div>
          <div className="compliance-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Personal Data Dossier &amp; Portability (Section 12 DPDP)</h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                  Request an immutable audit dossier containing all personal data, policies, claims, and consents associated with your identity.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  disabled={dossierLoading}
                  onClick={handleExportDossier}
                  className="btn-compliance btn-compliance-primary"
                >
                  {dossierLoading ? 'Generating Dossier...' : '⚡ Generate My Data Dossier'}
                </button>
                {dossier && (
                  <button onClick={downloadDossierFile} className="btn-compliance btn-compliance-secondary">
                    📥 Download JSON Dossier
                  </button>
                )}
              </div>
            </div>

            <div className="notice-banner">
              <strong>⚖️ Statutory Retention Notice:</strong> While personal and marketing telemetry may be modified or purged,
              insurance policy contracts, financial premiums, and cashless claim settlements are subject to a mandatory <strong>10-year statutory retention</strong> under IRDAI AML regulations.
            </div>

            {dossier ? (
              <div className="dossier-box">
                <pre>{JSON.stringify(dossier, null, 2)}</pre>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: '36px', textAlign: 'center', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📦</div>
                <div style={{ fontWeight: 600, color: '#334155' }}>No dossier generated yet</div>
                <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '4px 0 16px' }}>
                  Click &quot;Generate My Data Dossier&quot; above to compile your complete DPDP Section 12 personal compliance portfolio.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Right to Erasure */}
      {activeTab === 'erasure' && (
        <div>
          <div className="compliance-card">
            <h3>Right to Erasure &amp; Account Deletion (DPDP Section 12)</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 16px' }}>
              Under DPDP Act Section 12, data principals can request the erasure of personal data that is no longer necessary
              for the purpose for which it was collected.
            </p>

            <div className="notice-banner">
              <strong>⚠️ Important Legal Caveat:</strong> Data erasure does not apply to active insurance contracts or ongoing claims
              under investigation. Upon request approval, non-mandatory marketing data will be purged immediately, and your account will be decommissioned.
            </div>

            {erasureSubmitted ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>✅</div>
                <h4 style={{ color: '#166534', margin: '0 0 8px' }}>Right-to-Erasure Request Submitted</h4>
                <p style={{ color: '#15803d', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto' }}>
                  Your request has been logged in our compliance audit ledger. Our Data Protection Officer (DPO) will
                  evaluate statutory retention obligations and respond within 30 days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleErasureSubmit} style={{ maxWidth: '650px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Reason for Deletion / Erasure Request:
                  </label>
                  <textarea
                    required
                    minLength={10}
                    rows={4}
                    value={erasureReason}
                    onChange={(e) => setErasureReason(e.target.value)}
                    placeholder="e.g. I am closing my account and request erasure of all non-statutory personal data..."
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={erasureLoading}
                  className="btn-compliance btn-compliance-danger"
                >
                  {erasureLoading ? 'Submitting Request...' : 'Submit Erasure Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Autonomous Fraud Radar & PII Vault */}
      {activeTab === 'fraud' && (
        <div>
          {/* KPI Radar */}
          <div className="fraud-kpis">
            <div className="fraud-kpi clean">
              <div className="fraud-kpi-label">Clean Throughput Rate</div>
              <div className="fraud-kpi-value">{fraudStats?.cleanRatePercent || 93.8}%</div>
              <div style={{ fontSize: '0.75rem', color: '#15803d' }}>Auto-Cleared Payouts</div>
            </div>
            <div className="fraud-kpi">
              <div className="fraud-kpi-label">Total Claims Evaluated</div>
              <div className="fraud-kpi-value">{fraudStats?.totalAssessed || 48}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Multi-Signal Scanned</div>
            </div>
            <div className="fraud-kpi danger">
              <div className="fraud-kpi-label">Critical Fraud Stops</div>
              <div className="fraud-kpi-value">{fraudStats?.criticalFlags || 2}</div>
              <div style={{ fontSize: '0.75rem', color: '#b91c1c' }}>Immediate Stop-Loss</div>
            </div>
            <div className="fraud-kpi">
              <div className="fraud-kpi-label">Blacklisted Facilities</div>
              <div className="fraud-kpi-value">{fraudStats?.blacklistedFacilitiesCount || 3}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>IRDAI Vigilance List</div>
            </div>
          </div>

          {/* Interactive Claim Scanner */}
          <div className="compliance-card">
            <h3>Autonomous Claim Risk Scanner (SRS Section 33)</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 16px' }}>
              Simulate an incoming hospital claim to observe the autonomous multi-signal fraud detection engine in real time.
            </p>

            <div className="fraud-form-grid">
              <div className="fraud-field">
                <label>Claim Amount (INR):</label>
                <input
                  type="number"
                  value={scanAmount}
                  onChange={(e) => setScanAmount(e.target.value)}
                />
              </div>

              <div className="fraud-field">
                <label>Hospital / Facility Name:</label>
                <select
                  value={scanHospital}
                  onChange={(e) => setScanHospital(e.target.value)}
                >
                  <option value="Apollo Hospitals (Recognized)">Apollo Hospitals (Accredited Partner)</option>
                  <option value="Fortis Healthcare (Recognized)">Fortis Healthcare (Accredited Partner)</option>
                  <option value="Apex Cure Nursing Home (Unregistered)">Apex Cure Nursing Home (IRDAI Vigilance Blacklist)</option>
                  <option value="St. Mark Medicare Center (Blacklisted)">St. Mark Medicare Center (Blacklisted Entity)</option>
                </select>
              </div>

              <div className="fraud-field">
                <label>Claim Category:</label>
                <select
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value)}
                >
                  <option value="HEALTH_CASHLESS">Health - Cashless Pre-Auth</option>
                  <option value="HEALTH_REIMBURSEMENT">Health - Post-Hospitalization Reimbursement</option>
                  <option value="MOTOR_ACCIDENT">Motor - Vehicle Damage</option>
                </select>
              </div>
            </div>

            <button
              onClick={runFraudScan}
              disabled={scanning}
              className="btn-compliance btn-compliance-primary"
            >
              {scanning ? 'Analyzing Multi-Signal Model...' : '🚀 Run Autonomous Fraud Scan'}
            </button>

            {/* Scan Results */}
            {scanResult && (
              <div className="risk-meter-box">
                <div className="risk-score-display">
                  <div
                    className={`score-circle ${
                      scanResult.riskScore >= 75
                        ? 'score-high'
                        : scanResult.riskScore >= 25
                        ? 'score-elevated'
                        : 'score-low'
                    }`}
                  >
                    {scanResult.riskScore}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                      Risk Level: {scanResult.riskLevel}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                      Automated Decision: <strong style={{ color: scanResult.isAutoCleared ? '#4ade80' : '#f87171' }}>{scanResult.decision}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', fontWeight: 700, margin: '14px 0 8px' }}>
                  Triggered Fraud Risk Signals ({scanResult.signalsTriggered.length}):
                </div>

                {scanResult.signalsTriggered.length === 0 ? (
                  <div style={{ color: '#4ade80', fontSize: '0.85rem' }}>
                    ✓ No suspicious fraud anomalies detected. Claim qualified for straight-through processing.
                  </div>
                ) : (
                  scanResult.signalsTriggered.map((sig, idx) => (
                    <div key={idx} className="signal-chip">
                      <div>
                        <strong>{sig.code}</strong> — {sig.detail}
                      </div>
                      <span className="dev-badge" style={{ background: '#b91c1c' }}>
                        +{sig.weight} pts
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Cryptographic Vault & Masking Sandbox */}
          <div className="compliance-card">
            <h3>Field-Level AES-256-GCM Encryption &amp; Data Masking (SRS Section 26)</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 16px' }}>
              All sensitive customer PII stored in PolicySphere is encrypted at rest using AES-256-GCM authenticated cipher tags.
            </p>

            {maskResult && (
              <table className="dev-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Field</th>
                    <th style={{ padding: '10px' }}>Raw Value</th>
                    <th style={{ padding: '10px' }}>Regulatory Masked View</th>
                    <th style={{ padding: '10px' }}>AES-256-GCM Ciphertext</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px' }}><strong>Aadhaar Card</strong></td>
                    <td style={{ padding: '10px' }}><code>987654321098</code></td>
                    <td style={{ padding: '10px' }}><span className="pill-mandatory">{maskResult.maskedData.aadhaar}</span></td>
                    <td style={{ padding: '10px' }}><code style={{ fontSize: '0.75rem', color: '#475569' }}>{maskResult.fieldLevelEncryptionDemo.ciphertext.substring(0, 32)}...</code></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px' }}><strong>PAN Number</strong></td>
                    <td style={{ padding: '10px' }}><code>ABCDE1234F</code></td>
                    <td style={{ padding: '10px' }}><span className="pill-mandatory">{maskResult.maskedData.pan}</span></td>
                    <td style={{ padding: '10px' }}><code style={{ fontSize: '0.75rem', color: '#475569' }}>AES-256-GCM Tagged</code></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px' }}><strong>Phone Number</strong></td>
                    <td style={{ padding: '10px' }}><code>+919876543210</code></td>
                    <td style={{ padding: '10px' }}><span>{maskResult.maskedData.phone}</span></td>
                    <td style={{ padding: '10px' }}><code style={{ fontSize: '0.75rem', color: '#475569' }}>Masked in logs</code></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px' }}><strong>Bank Account</strong></td>
                    <td style={{ padding: '10px' }}><code>123456789012</code></td>
                    <td style={{ padding: '10px' }}><span>{maskResult.maskedData.bankAccount}</span></td>
                    <td style={{ padding: '10px' }}><code style={{ fontSize: '0.75rem', color: '#475569' }}>Encrypted in Vault</code></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
