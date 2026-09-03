import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  HiScale, HiPrinter, HiShare, HiArrowLeft, HiSparkles, 
  HiCheck, HiOutlineCheckCircle, HiShoppingCart, HiLightningBolt, HiSwitchHorizontal 
} from 'react-icons/hi';
import api from '../services/api/axios';
import QuoteCalculatorModal from '../components/catalog/QuoteCalculatorModal';
import PaymentModal from '../components/payment/PaymentModal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './ComparePage.css';

function ComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [diffOnly, setDiffOnly] = useState(false);

  // Quote & Payment modal states
  const [quotePolicy, setQuotePolicy] = useState(null);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [checkoutPolicy, setCheckoutPolicy] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const policyIdsParam = searchParams.get('ids');

  useEffect(() => {
    fetchComparisonData();
  }, [policyIdsParam]);

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      let ids = [];
      if (policyIdsParam) {
        ids = policyIdsParam.split(',').filter(Boolean);
      }

      if (ids.length === 0) {
        // If no IDs given in URL, fetch 3 default policies for preview
        const catalogRes = await api.get('/policies', { params: { limit: 3 } });
        ids = catalogRes.data.policies.slice(0, 3).map((p) => p.id);
      }

      if (ids.length > 0) {
        const res = await api.post('/policies/compare', { policyIds: ids });
        if (res.data.success) {
          setPolicies(res.data.data.policies || []);
        }
      }
    } catch (err) {
      console.error('Failed to load comparison workspace data:', err);
      toast.error('Failed to load policy comparison data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Comparison link copied to clipboard!');
    }
  };

  const handleOpenQuote = (policy) => {
    setQuotePolicy(policy);
    setIsQuoteOpen(true);
  };

  const handleProceedFromQuote = ({ policy, customPremium }) => {
    setIsQuoteOpen(false);
    if (!user) {
      toast.error('Please sign in to complete purchase with your quote');
      navigate('/login');
      return;
    }
    const targetPolicy = policy || quotePolicy;
    if (targetPolicy) {
      setCheckoutPolicy({ ...targetPolicy, customPremium });
      setIsPaymentOpen(true);
    }
  };

  const isDifferent = (getter) => {
    if (policies.length <= 1) return false;
    const firstVal = JSON.stringify(getter(policies[0]));
    return policies.some((p) => JSON.stringify(getter(p)) !== firstVal);
  };

  return (
    <div className="compare-page">
      <div className="container">
        {/* Workspace Top Navigation Bar */}
        <div className="compare-workspace-nav">
          <Link to="/catalog" className="back-link">
            <HiArrowLeft /> Back to Catalog
          </Link>

          <div className="workspace-title-group">
            <div className="workspace-badge">
              <HiSparkles /> Module 7: Policy Comparison Workspace
            </div>
            <h1>Side-by-Side Insurance Analysis</h1>
          </div>

          <div className="workspace-actions">
            <label className="toggle-diff-label">
              <input
                type="checkbox"
                checked={diffOnly}
                onChange={(e) => setDiffOnly(e.target.checked)}
              />
              <span className="toggle-custom-box">
                <HiSwitchHorizontal /> Highlight Differences Only
              </span>
            </label>

            <button className="btn btn-outline btn-sm" onClick={handleShare}>
              <HiShare /> Share Analysis
            </button>
            <button className="btn btn-outline btn-sm" onClick={handlePrint}>
              <HiPrinter /> Print Matrix
            </button>
          </div>
        </div>

        {/* Comparison Workspace Matrix */}
        {loading ? (
          <div className="compare-workspace-loading">
            <div className="spinner spinner-lg"></div>
            <p>Gathering policy metrics, Claim Settlement Ratios & AI scoring...</p>
          </div>
        ) : policies.length === 0 ? (
          <div className="compare-empty-workspace">
            <HiScale className="empty-icon" />
            <h3>No policies selected for comparison</h3>
            <p>Select policies from our catalog to perform side-by-side analysis.</p>
            <Link to="/catalog" className="btn btn-primary mt-4">
              Explore Policy Catalog
            </Link>
          </div>
        ) : (
          <div className="compare-matrix-card animate-fade-in-up">
            <div className="compare-table-wrapper">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th className="feature-label-col">
                      <div className="col-header-meta">
                        <span>Comparison Factors</span>
                        <small>{policies.length} Plans Loaded</small>
                      </div>
                    </th>
                    {policies.map((p) => (
                      <th key={p.id} className={`policy-col-header ${p.isBestValue ? 'is-best-value' : ''}`}>
                        {p.isBestValue && (
                          <div className="best-value-badge">
                            <HiSparkles /> BEST VALUE RECOMMENDATION
                          </div>
                        )}
                        <span className="badge badge-primary">{p.category}</span>
                        <h4>{p.name}</h4>
                        <p className="provider-name">{p.provider}</p>

                        {p.metrics?.aiValueScore && (
                          <div className="ai-score-pill">
                            <span>AI Value Score</span>
                            <strong>{p.metrics.aiValueScore}/100</strong>
                          </div>
                        )}

                        <div className="policy-price">
                          ${p.premium.toLocaleString()}<span>/yr</span>
                        </div>

                        <div className="header-action-group">
                          <button
                            className="btn btn-outline btn-sm btn-full"
                            onClick={() => handleOpenQuote(p)}
                          >
                            <HiLightningBolt /> Custom Quote
                          </button>
                          <Link
                            to={`/catalog/${p.id}`}
                            className="btn btn-primary btn-sm btn-full"
                          >
                            <HiShoppingCart /> Select Plan
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Sum Assured */}
                  {(!diffOnly || isDifferent((p) => p.coverageAmount)) && (
                    <tr>
                      <td className="feature-label">Sum Assured (Coverage)</td>
                      {policies.map((p) => (
                        <td key={p.id} className="feature-val highlight">
                          ${p.coverageAmount.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Row 2: Claim Settlement Ratio (CSR %) */}
                  {(!diffOnly || isDifferent((p) => p.metrics?.claimSettlementRatio)) && (
                    <tr>
                      <td className="feature-label">Claim Settlement Ratio (CSR)</td>
                      {policies.map((p) => (
                        <td key={p.id} className="feature-val">
                          <span className="metric-badge metric-csr">
                            {p.metrics?.claimSettlementRatio || 98.2}%
                          </span>
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Row 3: Solvency Ratio */}
                  {(!diffOnly || isDifferent((p) => p.metrics?.solvencyRatio)) && (
                    <tr>
                      <td className="feature-label">Solvency Ratio</td>
                      {policies.map((p) => (
                        <td key={p.id} className="feature-val font-semibold">
                          {p.metrics?.solvencyRatio || 1.85}x
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Row 4: Network Density */}
                  {(!diffOnly || isDifferent((p) => p.metrics?.networkDensity?.count)) && (
                    <tr>
                      <td className="feature-label">Network Density</td>
                      {policies.map((p) => (
                        <td key={p.id} className="feature-val">
                          <strong>{(p.metrics?.networkDensity?.count || 10500).toLocaleString()}</strong>
                          <span className="sub-text"> {p.metrics?.networkDensity?.label || 'Cashless Outlets'}</span>
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Row 5: Cashless Approval Speed */}
                  {(!diffOnly || isDifferent((p) => p.metrics?.cashlessSpeed)) && (
                    <tr>
                      <td className="feature-label">Avg. Cashless Speed</td>
                      {policies.map((p) => (
                        <td key={p.id} className="feature-val text-success font-medium">
                          ⚡ {p.metrics?.cashlessSpeed || '30 mins'}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Row 6: Waiting Periods */}
                  {(!diffOnly || isDifferent((p) => p.metrics?.waitingPeriods)) && (
                    <tr>
                      <td className="feature-label">Waiting Periods</td>
                      {policies.map((p) => (
                        <td key={p.id} className="feature-val">
                          <div className="waiting-pill">Initial: {p.metrics?.waitingPeriods?.initial || '30 Days'}</div>
                          {p.metrics?.waitingPeriods?.preExisting !== 'N/A' && (
                            <div className="sub-text">Pre-existing: {p.metrics?.waitingPeriods?.preExisting}</div>
                          )}
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Row 7: Tax Benefit */}
                  {(!diffOnly || isDifferent((p) => p.metrics?.taxBenefits)) && (
                    <tr>
                      <td className="feature-label">Tax Benefit</td>
                      {policies.map((p) => (
                        <td key={p.id} className="feature-val">
                          <span className="text-success"><HiCheck /> {p.metrics?.taxBenefits || 'Section 80D / 80C Eligible'}</span>
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Row 8: Major Exclusions */}
                  {(!diffOnly || isDifferent((p) => p.metrics?.exclusions)) && (
                    <tr>
                      <td className="feature-label">Major Exclusions</td>
                      {policies.map((p) => (
                        <td key={p.id} className="feature-val exclusion-cell">
                          <ul>
                            {(p.metrics?.exclusions || ['Normal Wear & Tear', 'Gross Negligence']).map((exc, i) => (
                              <li key={i}>• {exc}</li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                  )}

                  {/* Row 9: Key Features & Add-ons */}
                  {(!diffOnly || isDifferent((p) => p.features)) && (
                    <tr>
                      <td className="feature-label">Inclusions & Features</td>
                      {policies.map((p) => {
                        let featuresList = [];
                        try {
                          featuresList = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
                        } catch (e) {
                          featuresList = [p.features];
                        }
                        return (
                          <td key={p.id} className="feature-val features-list-cell">
                            <ul>
                              {featuresList.map((f, i) => (
                                <li key={i}><HiOutlineCheckCircle className="icon-check" /> {f}</li>
                              ))}
                            </ul>
                          </td>
                        );
                      })}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Quote & Payment Modals */}
      <QuoteCalculatorModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        policy={quotePolicy}
        onProceedToCheckout={handleProceedFromQuote}
      />

      <PaymentModal
        policy={checkoutPolicy}
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={() => {
          setIsPaymentOpen(false);
          navigate('/dashboard');
        }}
      />
    </div>
  );
}

export default ComparePage;
