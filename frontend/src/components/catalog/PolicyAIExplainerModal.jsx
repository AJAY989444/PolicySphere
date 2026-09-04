import React, { useState, useEffect } from 'react';
import {
  HiSparkles,
  HiX,
  HiCheckCircle,
  HiExclamation,
  HiClock,
  HiShieldCheck,
  HiInformationCircle,
  HiGift,
  HiArrowRight
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api/axios';
import './PolicyAIExplainerModal.css';

function PolicyAIExplainerModal({ policyId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!policyId) return;
    setLoading(true);
    setError('');

    api.get(`/ai/explain/${policyId}`)
      .then((res) => {
        if (res.data.success) {
          setData(res.data);
        } else {
          setError('Could not fetch AI analysis. Please try again.');
        }
      })
      .catch((err) => {
        console.error('AI Explainer error:', err);
        setError('Failed to load plain English fine print breakdown.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [policyId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div
        className="explainer-modal-container animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="explainer-header">
          <div className="brand-badge">
            <div className="brand-icon-pulse">
              <HiSparkles size={22} />
            </div>
            <div>
              <h3 className="explainer-title">SphereAI Plain English Explainer</h3>
              <p className="explainer-subtitle">Fine-Print & Clause Simplifier Engine</p>
            </div>
          </div>
          <button className="explainer-close-btn" onClick={onClose} aria-label="Close modal">
            <HiX size={20} />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="explainer-body">
          {loading ? (
            <div className="explainer-loading">
              <div className="ai-spinner">
                <HiSparkles className="spin-icon" size={36} />
              </div>
              <h4>Analyzing Policy Terms & Clauses...</h4>
              <p>Extracting waiting periods, hidden exclusions, co-pay rules, and benefits.</p>
            </div>
          ) : error ? (
            <div className="explainer-error">
              <HiExclamation size={40} className="text-danger" />
              <p>{error}</p>
              <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
            </div>
          ) : data ? (
            <>
              {/* Policy Quick Info Header */}
              <div className="policy-meta-banner">
                <div>
                  <div className="policy-meta-tags">
                    <span className="cat-badge">{data.category}</span>
                    <span className="provider-name">{data.provider}</span>
                  </div>
                  <h4 className="meta-policy-name">{data.policyName}</h4>
                </div>
                <div className="policy-meta-financials">
                  <div>
                    <span className="lbl">Sum Insured:</span>
                    <strong>{formatCurrency(data.coverageAmount)}</strong>
                  </div>
                  <div>
                    <span className="lbl">Annual Premium:</span>
                    <strong className="text-primary">{formatCurrency(data.premium)}/yr</strong>
                  </div>
                </div>
              </div>

              {/* AI Verdict */}
              {data.aiVerdict && (
                <div className="ai-verdict-card">
                  <div className="verdict-icon">
                    <HiShieldCheck size={28} />
                  </div>
                  <div className="verdict-text">
                    {data.aiVerdict.replace(/\*\*/g, '')}
                  </div>
                </div>
              )}

              {/* Grid: Pros vs Exclusions */}
              <div className="explainer-grid">
                {/* Highlights & Pros */}
                <div className="explainer-card pros-card">
                  <div className="card-heading text-success">
                    <HiCheckCircle size={20} />
                    <h5>Key Coverage Highlights</h5>
                  </div>
                  <ul>
                    {data.pros?.map((pro, i) => (
                      <li key={i}>
                        <HiCheckCircle className="icon-bullet text-success" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Fine Print Warnings & Exclusions */}
                <div className="explainer-card exclusions-card">
                  <div className="card-heading text-danger">
                    <HiExclamation size={20} />
                    <h5>Fine-Print Warnings & Exclusions</h5>
                  </div>
                  <ul>
                    {data.exclusions?.map((exc, i) => (
                      <li key={i}>
                        <HiExclamation className="icon-bullet text-danger" />
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Clauses Breakdown Row */}
              <div className="clauses-grid">
                <div className="clause-item">
                  <div className="clause-header">
                    <HiClock className="text-warning" size={20} />
                    <h6>Waiting Period Terms</h6>
                  </div>
                  <p>{data.waitingPeriod}</p>
                </div>
                <div className="clause-item">
                  <div className="clause-header">
                    <HiInformationCircle className="text-primary" size={20} />
                    <h6>Co-Payment Rule</h6>
                  </div>
                  <p>{data.copayClause}</p>
                </div>
              </div>

              {/* Hidden Benefits */}
              {data.hiddenBenefits && data.hiddenBenefits.length > 0 && (
                <div className="hidden-benefits-section">
                  <div className="benefits-title">
                    <HiGift size={20} className="text-primary" />
                    <h5>Bonus & Hidden Benefits Included</h5>
                  </div>
                  <div className="benefits-tags">
                    {data.hiddenBenefits.map((ben, i) => (
                      <div key={i} className="benefit-pill">
                        <HiSparkles size={14} className="text-primary" />
                        <span>{ben}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        {data && (
          <div className="explainer-footer">
            <button className="btn btn-ghost" onClick={onClose}>
              Close Analysis
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                onClose();
                navigate(`/proposals/wizard?policyId=${policyId}`);
              }}
            >
              Apply for Plan <HiArrowRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PolicyAIExplainerModal;
