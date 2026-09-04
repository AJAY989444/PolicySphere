import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api/axios';
import './MyProposalsPage.css';

export default function MyProposalsPage() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/proposals');
      if (res.data.success) {
        setProposals(res.data.proposals);
      }
    } catch (err) {
      console.error('Failed to load user proposals', err);
      setError(err.response?.data?.message || 'Failed to load proposals list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleDiscard = async (id) => {
    if (!window.confirm('Are you sure you want to discard this application draft?')) return;
    try {
      const res = await api.delete(`/proposals/${id}`);
      if (res.data.success) {
        setProposals((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      alert('Failed to discard draft');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return <span className="status-badge status-draft">Draft (In Progress)</span>;
      case 'PENDING_UNDERWRITING':
        return <span className="status-badge status-pending">Underwriting Review</span>;
      case 'APPROVED':
        return <span className="status-badge status-approved">Approved & Price Locked</span>;
      default:
        return <span className="status-badge status-draft">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="my-proposals-page text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3 text-light">Loading your insurance applications...</p>
      </div>
    );
  }

  return (
    <div className="my-proposals-page">
      <div className="proposals-header d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1>My Insurance Applications</h1>
          <p>Track saved proposal drafts, review 30-day locked premiums, and resume multi-step applications.</p>
        </div>
        <Link to="/catalog" className="btn btn-primary btn-lg fw-bold rounded-pill shadow-sm">
          + Start New Application
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {proposals.length === 0 ? (
        <div className="text-center py-5 bg-dark rounded-4 border border-secondary p-5">
          <h3 className="text-light mb-3">No Active Applications Found</h3>
          <p className="text-muted mb-4">Browse our insurance catalog and click "Apply Now" to start a digital proposal wizard.</p>
          <Link to="/catalog" className="btn btn-outline-primary rounded-pill px-4">
            Explore Policies
          </Link>
        </div>
      ) : (
        <div className="proposals-grid">
          {proposals.map((proposal) => {
            const policy = proposal.policy;
            const stepLabels = ['Step 1: Proposer Details', 'Step 2: Members & Medical', 'Step 3: Nominee Declaration', 'Step 4: Premium Lock Summary'];
            
            return (
              <div key={proposal.id} className="proposal-card">
                <div>
                  <div className="proposal-card-top d-flex justify-content-between align-items-start">
                    <span className="proposal-ref">{proposal.proposalRef}</span>
                    {getStatusBadge(proposal.status)}
                  </div>
                  <h3>{policy?.name || 'Insurance Application'}</h3>
                  <div className="text-muted small mb-3">{policy?.provider}</div>

                  <div className="proposal-details-list">
                    <div className="detail-item">
                      <span className="label">Current Progress</span>
                      <span className="val text-primary">{stepLabels[proposal.step - 1] || `Step ${proposal.step}`}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Locked Premium</span>
                      <span className="val text-success font-monospace fw-bold">
                        ${proposal.lockedPremium || policy?.premium}/yr
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Last Modified</span>
                      <span className="val">{new Date(proposal.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {proposal.premiumExpiresAt && (
                    <div className="lock-timer-box">
                      🔒 Price Lock Expires: <strong>{new Date(proposal.premiumExpiresAt).toLocaleDateString()}</strong>
                    </div>
                  )}
                </div>

                <div className="proposal-card-actions">
                  <Link to={`/proposals/wizard/${proposal.id}`} className="btn-resume">
                    {proposal.status === 'APPROVED' ? 'Review & Pay →' : 'Resume Application →'}
                  </Link>
                  <button className="btn-discard" onClick={() => handleDiscard(proposal.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
