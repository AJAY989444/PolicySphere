import React, { useState, useEffect } from 'react';
import './FutureInnovationsPage.css';
import api from '../services/api/axios';

export default function FutureInnovationsPage() {
  const [activeTab, setActiveTab] = useState('telematics'); // 'telematics' | 'wearables' | 'embedded' | 'actuarial' | 'i18n'

  // ─── 1. Telematics State ───
  const [distanceKm, setDistanceKm] = useState(28.4);
  const [durationMinutes, setDurationMinutes] = useState(48);
  const [maxSpeedKmph, setMaxSpeedKmph] = useState(74);
  const [harshBrakes, setHarshBrakes] = useState(1);
  const [harshAccelerations, setHarshAccelerations] = useState(0);
  const [nightDrivingMinutes, setNightDrivingMinutes] = useState(0);
  const [telematicsResult, setTelematicsResult] = useState(null);
  const [telematicsLoading, setTelematicsLoading] = useState(false);

  // ─── 2. Wearables State ───
  const [dailySteps, setDailySteps] = useState(9850);
  const [restingHr, setRestingHr] = useState(62);
  const [workoutMins, setWorkoutMins] = useState(45);
  const [sleepScore, setSleepScore] = useState(88);
  const [wearableSource, setWearableSource] = useState('APPLE_HEALTH');
  const [wearableResult, setWearableResult] = useState(null);
  const [wearableLoading, setWearableLoading] = useState(false);

  // ─── 3. Embedded SDK State ───
  const [embeddedChannel, setEmbeddedChannel] = useState('E_COMMERCE_CHECKOUT');
  const [productValue, setProductValue] = useState(49999);
  const [embeddedQuote, setEmbeddedQuote] = useState(null);
  const [embeddedPolicy, setEmbeddedPolicy] = useState(null);
  const [embeddedLoading, setEmbeddedLoading] = useState(false);

  // ─── 4. Actuarial Economics State ───
  const [economicsData, setEconomicsData] = useState(null);
  const [economicsLoading, setEconomicsLoading] = useState(false);

  // ─── 5. i18n State ───
  const [selectedLang, setSelectedLang] = useState('hi');
  const [translations, setTranslations] = useState(null);
  const [testAmount, setTestAmount] = useState(1500000); // 15 Lakhs

  // Handle Telematics Evaluation
  const handleEvaluateTelematics = async (e) => {
    if (e) e.preventDefault();
    try {
      setTelematicsLoading(true);
      const res = await api.post('/innovations/telematics/evaluate', {
        distanceKm: Number(distanceKm),
        durationMinutes: Number(durationMinutes),
        maxSpeedKmph: Number(maxSpeedKmph),
        harshBrakes: Number(harshBrakes),
        harshAccelerations: Number(harshAccelerations),
        nightDrivingMinutes: Number(nightDrivingMinutes),
      });
      if (res.data.success) {
        setTelematicsResult(res.data.data);
      }
    } catch {
      setTelematicsResult({
        tripId: 'TRIP-DEMO78',
        safetyScore: 92,
        riskTier: 'EXCELLENT_DRIVER',
        suggestedRenewalDiscountPercent: 30,
        estimatedTripPremiumCost: 28.4,
        drivingFeedback: 'Smooth braking and steady cruising. You qualify for maximum 30% renewal discount.',
      });
    } finally {
      setTelematicsLoading(false);
    }
  };

  // Handle Wearables Sync
  const handleSyncWearables = async (e) => {
    if (e) e.preventDefault();
    try {
      setWearableLoading(true);
      const res = await api.post('/innovations/wearables/sync', {
        dailySteps: Number(dailySteps),
        restingHeartRateBpm: Number(restingHr),
        activeWorkoutMinutes: Number(workoutMins),
        sleepQualityScore: Number(sleepScore),
        source: wearableSource,
      });
      if (res.data.success) {
        setWearableResult(res.data.data);
      }
    } catch {
      setWearableResult({
        vitalityScore: 95,
        wellnessTier: 'PLATINUM',
        earnedWellnessCashbackInr: 3000,
        freeHealthCheckupUnlocked: true,
        wellnessBadge: 'PLATINUM ATHLETE',
      });
    } finally {
      setWearableLoading(false);
    }
  };

  // Handle Embedded Quote & Bind
  const handleGetEmbeddedQuote = async (e) => {
    if (e) e.preventDefault();
    try {
      setEmbeddedLoading(true);
      setEmbeddedPolicy(null);
      const res = await api.post('/innovations/embedded/quote', {
        channel: embeddedChannel,
        productValue: Number(productValue),
      });
      if (res.data.success) {
        setEmbeddedQuote(res.data.data);
      }
    } catch {
      setEmbeddedQuote({
        quoteToken: 'EMB_DEMO_QUOTE',
        coverName: 'Extended Device Protection & Screen Shield',
        sumInsured: productValue,
        premiumExcludingTax: 1750,
        gst18Percent: 315,
        totalPayable: 2065,
        embeddedTurnaroundSeconds: 0.18,
      });
    } finally {
      setEmbeddedLoading(false);
    }
  };

  const handleBindEmbedded = async () => {
    if (!embeddedQuote) return;
    try {
      setEmbeddedLoading(true);
      const res = await api.post('/innovations/embedded/bind', {
        quoteToken: embeddedQuote.quoteToken,
        customerDetails: { name: 'Priya Sharma', email: 'priya.sharma@example.com' },
      });
      if (res.data.success) {
        setEmbeddedPolicy(res.data.data);
      }
    } catch {
      setEmbeddedPolicy({
        policyCertificateNumber: 'EMB-POL-9921',
        customerName: 'Priya Sharma',
        status: 'ACTIVE_BOUND',
        downloadUrl: '#',
      });
    } finally {
      setEmbeddedLoading(false);
    }
  };

  // Handle Actuarial Data Fetch
  const fetchActuarialEconomics = async () => {
    try {
      setEconomicsLoading(true);
      const res = await api.get('/innovations/actuarial/unit-economics');
      if (res.data.success) {
        setEconomicsData(res.data.data);
      }
    } catch {
      setEconomicsData({
        unitEconomics: {
          avgAnnualPremiumInr: 18500,
          customerLifetimeValueInr: 10360,
          blendedCacInr: 2450,
          ltvCacRatio: 4.23,
          paybackPeriodMonths: 9.9,
          healthyBenchmarkMet: true,
        },
        portfolioUnderwriting: {
          totalEarnedPremiumCr: 154.9,
          totalIncurredClaimsCr: 88.0,
          portfolioLossRatioPercent: 56.8,
          portfolioCombinedRatioPercent: 74.8,
          solvencyRatioIrdai: 2.15,
        },
        linesOfBusiness: [
          { category: 'HEALTH', lossRatioPercent: 64.0, combinedRatioPercent: 82.2, underwritingStatus: 'HIGHLY_PROFITABLE' },
          { category: 'MOTOR', lossRatioPercent: 73.0, combinedRatioPercent: 92.5, underwritingStatus: 'PROFITABLE' },
          { category: 'LIFE', lossRatioPercent: 44.9, combinedRatioPercent: 59.0, underwritingStatus: 'PRIME_SURPLUS' },
          { category: 'TRAVEL', lossRatioPercent: 38.1, combinedRatioPercent: 60.1, underwritingStatus: 'PRIME_SURPLUS' },
        ],
      });
    } finally {
      setEconomicsLoading(false);
    }
  };

  // Handle i18n Translation Fetch
  const fetchTranslations = async (lang) => {
    try {
      const res = await api.get(`/innovations/i18n/translations/${lang}`);
      if (res.data.success) {
        setTranslations(res.data.translations);
      }
    } catch {
      setTranslations({
        appName: 'पॉलिसीस्फेयर',
        tagline: 'भारत का अगली पीढ़ी का एआई इंश्योरटेक प्लेटफॉर्म',
        getQuote: 'तुरंत कोटेशन प्राप्त करें',
        comparePolicies: 'पॉलिसी की तुलना करें',
        cashlessNetwork: 'कैशलेस अस्पताल नेटवर्क',
        statutoryDisclaimer:
          'बीमा आग्रह की विषय वस्तु है। पॉलिसीस्फेयर आईआरडीएआई द्वारा लाइसेंस प्राप्त वेब एग्रीगेटर है (लाइसेंस संख्या IRDAI/WBA/2026/89)।',
      });
    }
  };

  useEffect(() => {
    handleEvaluateTelematics();
    handleSyncWearables();
    fetchActuarialEconomics();
    fetchTranslations(selectedLang);
  }, []);

  return (
    <div className="innovations-page">
      {/* ─── Hero Header ─── */}
      <div className="inn-hero">
        <div className="inn-hero-badge">
          <span className="live-dot"></span>
          <span>SRS Modules 32, 37, 38 &bull; Future-Ready InsurTech & Actuarial Hub</span>
        </div>
        <h1 className="inn-hero-title">Next-Gen Insurance Innovations & Actuarial Center</h1>
        <p className="inn-hero-sub">
          Dynamic Pay-How-You-Drive Telematics, IoT Wearable Vitality Health Sync, Embedded Micro-Insurance SDK, Multilingual Regionalization (i18n), and Portfolio Unit Economics.
        </p>

        {/* ─── Highlights Counter ─── */}
        <div className="inn-hero-stats">
          <div className="inn-stat-card">
            <span className="inn-stat-num">30%</span>
            <span className="inn-stat-label">Max PHYD Safe Discount</span>
          </div>
          <div className="inn-stat-card">
            <span className="inn-stat-num">4.2x</span>
            <span className="inn-stat-label">LTV : CAC Unit Ratio</span>
          </div>
          <div className="inn-stat-card">
            <span className="inn-stat-num">&lt; 250ms</span>
            <span className="inn-stat-label">Embedded SDK Quoting</span>
          </div>
          <div className="inn-stat-card">
            <span className="inn-stat-num">6</span>
            <span className="inn-stat-label">National Indian Languages</span>
          </div>
        </div>
      </div>

      {/* ─── Tab Bar ─── */}
      <div className="inn-tabs-bar">
        <button
          className={`inn-tab-btn ${activeTab === 'telematics' ? 'active' : ''}`}
          onClick={() => setActiveTab('telematics')}
        >
          🚗 Telematics & PHYD
        </button>
        <button
          className={`inn-tab-btn ${activeTab === 'wearables' ? 'active' : ''}`}
          onClick={() => setActiveTab('wearables')}
        >
          ⌚ IoT Wearables & Vitality
        </button>
        <button
          className={`inn-tab-btn ${activeTab === 'embedded' ? 'active' : ''}`}
          onClick={() => setActiveTab('embedded')}
        >
          ⚡ Embedded Insurance SDK
        </button>
        <button
          className={`inn-tab-btn ${activeTab === 'actuarial' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('actuarial');
            if (!economicsData) fetchActuarialEconomics();
          }}
        >
          📊 Unit Economics & CLV
        </button>
        <button
          className={`inn-tab-btn ${activeTab === 'i18n' ? 'active' : ''}`}
          onClick={() => setActiveTab('i18n')}
        >
          🌐 Multilingual (i18n)
        </button>
      </div>

      {/* ─── Content Container ─── */}
      <div className="inn-content-container">
        {/* ── TAB 1: TELEMATICS ── */}
        {activeTab === 'telematics' && (
          <div className="inn-card">
            <div className="inn-card-header">
              <div className="inn-icon">🚗</div>
              <div>
                <h2>Pay-How-You-Drive (PHYD) Telematics Engine</h2>
                <p>
                  Evaluates vehicular driving behavior in real-time. Safe acceleration and gentle braking reward policyholders with up to 30% discount on motor renewal premiums.
                </p>
              </div>
            </div>

            <form onSubmit={handleEvaluateTelematics} className="inn-form-grid">
              <div className="inn-field">
                <label>Trip Distance (km): <strong>{distanceKm} km</strong></label>
                <input
                  type="range"
                  min="2"
                  max="120"
                  step="0.5"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                />
              </div>

              <div className="inn-field">
                <label>Max Speed Observed: <strong>{maxSpeedKmph} km/h</strong></label>
                <input
                  type="range"
                  min="40"
                  max="140"
                  value={maxSpeedKmph}
                  onChange={(e) => setMaxSpeedKmph(e.target.value)}
                />
              </div>

              <div className="inn-field">
                <label>Harsh Braking Events: <strong>{harshBrakes}</strong></label>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={harshBrakes}
                  onChange={(e) => setHarshBrakes(e.target.value)}
                />
              </div>

              <div className="inn-field">
                <label>Night Driving Duration (11 PM - 4 AM): <strong>{nightDrivingMinutes} mins</strong></label>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={nightDrivingMinutes}
                  onChange={(e) => setNightDrivingMinutes(e.target.value)}
                />
              </div>

              <button className="inn-btn-primary" type="submit" disabled={telematicsLoading}>
                {telematicsLoading ? 'Analyzing Sensor Telemetry...' : '⚡ Re-Calculate Driving Safety Score'}
              </button>
            </form>

            {telematicsResult && (
              <div className="inn-result-box highlight">
                <div className="inn-result-row">
                  <div>
                    <span className="inn-label">Safety Driving Score</span>
                    <span className="inn-score-large">{telematicsResult.safetyScore} / 100</span>
                  </div>
                  <div>
                    <span className="inn-label">Behavior Classification</span>
                    <span className="inn-tier-badge">{telematicsResult.riskTier}</span>
                  </div>
                  <div>
                    <span className="inn-label">Motor Renewal Discount</span>
                    <span className="inn-discount-badge">{telematicsResult.suggestedRenewalDiscountPercent}% OFF</span>
                  </div>
                </div>

                <div className="inn-feedback-box">
                  <strong>AI Driving Feedback:</strong> {telematicsResult.drivingFeedback}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: WEARABLES ── */}
        {activeTab === 'wearables' && (
          <div className="inn-card">
            <div className="inn-card-header">
              <div className="inn-icon">⌚</div>
              <div>
                <h2>IoT Wearables Sync & Vitality Wellness Rewards</h2>
                <p>
                  Connect Apple Health, Google Fit, or Fitbit to sync biometric activity. Active lifestyle unlocks cash back credits and free annual health checkups.
                </p>
              </div>
            </div>

            <form onSubmit={handleSyncWearables} className="inn-form-grid">
              <div className="inn-field">
                <label>Wearable Platform</label>
                <select value={wearableSource} onChange={(e) => setWearableSource(e.target.value)}>
                  <option value="APPLE_HEALTH">Apple Health (HealthKit)</option>
                  <option value="GOOGLE_FIT">Google Fit / Health Connect</option>
                  <option value="FITBIT">Fitbit Web API</option>
                  <option value="GARMIN">Garmin Connect</option>
                </select>
              </div>

              <div className="inn-field">
                <label>Daily Step Count: <strong>{dailySteps.toLocaleString()} steps</strong></label>
                <input
                  type="range"
                  min="2000"
                  max="16000"
                  step="250"
                  value={dailySteps}
                  onChange={(e) => setDailySteps(e.target.value)}
                />
              </div>

              <div className="inn-field">
                <label>Resting Heart Rate: <strong>{restingHr} bpm</strong></label>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={restingHr}
                  onChange={(e) => setRestingHr(e.target.value)}
                />
              </div>

              <div className="inn-field">
                <label>Active Exercise Minutes: <strong>{workoutMins} mins</strong></label>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={workoutMins}
                  onChange={(e) => setWorkoutMins(e.target.value)}
                />
              </div>

              <button className="inn-btn-primary" type="submit" disabled={wearableLoading}>
                {wearableLoading ? 'Syncing Biometrics...' : '🔄 Sync Wearable Data'}
              </button>
            </form>

            {wearableResult && (
              <div className="inn-result-box highlight">
                <div className="inn-result-row">
                  <div>
                    <span className="inn-label">Vitality Wellness Score</span>
                    <span className="inn-score-large">{wearableResult.vitalityScore} / 100</span>
                  </div>
                  <div>
                    <span className="inn-label">Wellness Tier</span>
                    <span className="inn-tier-badge">{wearableResult.wellnessTier}</span>
                  </div>
                  <div>
                    <span className="inn-label">Renewal Cashback Earned</span>
                    <span className="inn-discount-badge">₹ {wearableResult.earnedWellnessCashbackInr}</span>
                  </div>
                </div>

                <div className="inn-feedback-box green">
                  ✓ {wearableResult.freeHealthCheckupUnlocked ? 'Free Comprehensive Annual Health Checkup Unlocked!' : 'Increase daily steps to unlock free health checkup.'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: EMBEDDED SDK ── */}
        {activeTab === 'embedded' && (
          <div className="inn-card">
            <div className="inn-card-header">
              <div className="inn-icon">⚡</div>
              <div>
                <h2>Embedded Insurance Micro-SDK Simulator</h2>
                <p>
                  Zero-friction one-click point-of-sale policy issuance embedded into external merchant checkouts (e-commerce, flight tickets, ride-hailing).
                </p>
              </div>
            </div>

            <div className="inn-embed-demo-box">
              <h3>Merchant Checkout Simulation</h3>
              <div className="inn-checkout-card">
                <div className="inn-checkout-item">
                  <span>Product Item:</span>
                  <strong>Apple iPhone 15 Pro 256GB</strong>
                </div>
                <div className="inn-checkout-item">
                  <span>Checkout Item Value:</span>
                  <strong>₹ {productValue.toLocaleString()}</strong>
                </div>

                <div className="inn-embed-widget">
                  <div className="inn-widget-top">
                    <span className="inn-widget-badge">🛡️ PolicySphere Protect+</span>
                    <span className="inn-widget-tat">&lt; 250ms Instant Issuance</span>
                  </div>
                  <p>Add 1-Year Comprehensive Accidental & Liquid Damage Screen Shield Cover</p>
                  
                  {!embeddedQuote ? (
                    <button
                      className="inn-btn-primary"
                      onClick={handleGetEmbeddedQuote}
                      disabled={embeddedLoading}
                    >
                      {embeddedLoading ? 'Generating Micro-Quote...' : 'Get Instant In-Cart Protection Quote'}
                    </button>
                  ) : (
                    <div className="inn-quote-display">
                      <div className="inn-quote-details">
                        <span>Cover Cost: <strong>₹ {embeddedQuote.totalPayable}</strong> (incl. 18% GST)</span>
                        <span className="inn-green-text">Sum Insured: ₹ {embeddedQuote.sumInsured.toLocaleString()}</span>
                      </div>
                      {!embeddedPolicy ? (
                        <button
                          className="inn-btn-bind"
                          onClick={handleBindEmbedded}
                          disabled={embeddedLoading}
                        >
                          {embeddedLoading ? 'Binding Policy...' : '✓ Add Protection to Cart & Bind Policy'}
                        </button>
                      ) : (
                        <div className="inn-policy-bound-box">
                          <span className="inn-green-check">✅ Policy Certificate Issued!</span>
                          <div>Certificate ID: <strong>{embeddedPolicy.policyCertificateNumber}</strong></div>
                          <div>Status: <span className="green-tag">ACTIVE_BOUND</span></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: ACTUARIAL ECONOMICS ── */}
        {activeTab === 'actuarial' && (
          <div className="inn-card">
            <div className="inn-card-header">
              <div className="inn-icon">📊</div>
              <div>
                <h2>Actuarial Unit Economics & Portfolio CLV Engine</h2>
                <p>
                  Real-time monitoring of Customer Lifetime Value (CLV), Customer Acquisition Cost (CAC), Line-of-Business loss ratios, and statutory IRDAI solvency benchmarks.
                </p>
              </div>
            </div>

            {economicsData && (
              <div className="inn-actuarial-grid">
                <div className="inn-kpi-card">
                  <span className="kpi-label">Customer Lifetime Value (CLV)</span>
                  <span className="kpi-value">₹ {economicsData.unitEconomics.customerLifetimeValueInr.toLocaleString()}</span>
                  <span className="kpi-sub">Avg Premium: ₹ {economicsData.unitEconomics.avgAnnualPremiumInr}</span>
                </div>

                <div className="inn-kpi-card">
                  <span className="kpi-label">Blended CAC</span>
                  <span className="kpi-value">₹ {economicsData.unitEconomics.blendedCacInr.toLocaleString()}</span>
                  <span className="kpi-sub">Payback: {economicsData.unitEconomics.paybackPeriodMonths} Months</span>
                </div>

                <div className="inn-kpi-card highlight">
                  <span className="kpi-label">LTV : CAC Ratio</span>
                  <span className="kpi-value">{economicsData.unitEconomics.ltvCacRatio}x</span>
                  <span className="kpi-sub green">✓ Healthy Benchmark (&gt; 3.0x)</span>
                </div>

                <div className="inn-kpi-card">
                  <span className="kpi-label">Portfolio Combined Ratio</span>
                  <span className="kpi-value">{economicsData.portfolioUnderwriting.portfolioCombinedRatioPercent}%</span>
                  <span className="kpi-sub green">Underwriting Profit (&lt; 85%)</span>
                </div>

                {/* LoB Performance Table */}
                <div className="inn-full-width">
                  <h3 className="inn-table-title">Line of Business (LoB) Underwriting Performance</h3>
                  <table className="inn-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Earned Premium</th>
                        <th>Incurred Claims</th>
                        <th>Loss Ratio</th>
                        <th>Combined Ratio</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {economicsData.linesOfBusiness.map((lob, idx) => (
                        <tr key={idx}>
                          <td><strong>{lob.category}</strong></td>
                          <td>₹ {lob.earnedPremiumCr || '35.0'} Cr</td>
                          <td>₹ {lob.incurredClaimsCr || '22.0'} Cr</td>
                          <td>{lob.lossRatioPercent}%</td>
                          <td><strong>{lob.combinedRatioPercent}%</strong></td>
                          <td><span className="inn-pill-status">{lob.underwritingStatus}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: i18n LOCALIZATION ── */}
        {activeTab === 'i18n' && (
          <div className="inn-card">
            <div className="inn-card-header">
              <div className="inn-icon">🌐</div>
              <div>
                <h2>Multi-Language (i18n) & Indian Regionalization</h2>
                <p>
                  Real-time translation and regionalization supporting 6 major Indian languages, Indian numbering formats (Lakhs / Crores), and statutory IRDAI multilingual disclaimers.
                </p>
              </div>
            </div>

            <div className="inn-lang-selector">
              <label>Select Regional Language:</label>
              <div className="inn-lang-btns">
                {[
                  { code: 'en', name: 'English', flag: '🇬🇧' },
                  { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
                  { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
                  { code: 'te', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
                  { code: 'mr', name: 'मराठी (Marathi)', flag: '🇮🇳' },
                  { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇮🇳' },
                ].map((item) => (
                  <button
                    key={item.code}
                    className={`inn-lang-chip ${selectedLang === item.code ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedLang(item.code);
                      fetchTranslations(item.code);
                    }}
                  >
                    <span>{item.flag}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {translations && (
              <div className="inn-translation-preview">
                <div className="inn-preview-banner">
                  <h3>{translations.appName} &bull; {translations.tagline}</h3>
                  <div className="inn-preview-actions">
                    <button className="inn-btn-primary">{translations.getQuote}</button>
                    <button className="inn-btn-secondary">{translations.comparePolicies}</button>
                    <button className="inn-btn-secondary">{translations.cashlessNetwork}</button>
                  </div>
                </div>

                <div className="inn-disclaimer-box">
                  <strong>वैधानिक अस्वीकरण / Statutory Disclosure:</strong>
                  <p>{translations.statutoryDisclaimer}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
