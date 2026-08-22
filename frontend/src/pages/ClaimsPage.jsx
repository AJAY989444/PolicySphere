import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiPlus,
  HiDocumentText,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiExclamationCircle,
  HiCalendar,
  HiCurrencyDollar,
  HiSearch,
  HiFolderOpen,
} from 'react-icons/hi';
import api from '../services/api/axios';
import DocumentViewerModal from '../components/claims/DocumentViewerModal';
import './ClaimsPage.css';

const ClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeClaimDocs, setActiveClaimDocs] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const res = await api.get('/claims');
        setClaims(res.data.claims || []);
      } catch (err) {
        console.error('Failed to fetch claims', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);

  // Compute Summary Statistics
  const totalClaimsCount = claims.length;
  const pendingCount = claims.filter((c) => c.status === 'PENDING' || c.status === 'IN_REVIEW').length;
  const approvedCount = claims.filter((c) => c.status === 'APPROVED').length;
  const totalApprovedPayout = claims
    .filter((c) => c.status === 'APPROVED')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  // Filtered Claims List
  const filteredClaims = claims.filter((claim) => {
    const matchesStatus = filterStatus === 'ALL' || claim.status === filterStatus;
    const policyName = claim.userPolicy?.policy?.name || '';
    const desc = claim.description || '';
    const matchesSearch =
      policyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="container claims-page animate-fade-in">
      {/* Header */}
      <div className="claims-header">
        <div>
          <h1>My Insurance Claims</h1>
          <p className="subtitle">Track claim statuses, upload proof documents, and inspect payout history.</p>
        </div>
        <Link to="/claims/new" className="btn btn-primary">
          <HiPlus /> Submit New Claim
        </Link>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="claims-kpi-grid">
        <div className="claims-kpi-card glassmorphism">
          <div className="claims-kpi-icon total">
            <HiFolderOpen />
          </div>
          <div>
            <span className="claims-kpi-label">Total Claims</span>
            <div className="claims-kpi-val">{totalClaimsCount}</div>
          </div>
        </div>

        <div className="claims-kpi-card glassmorphism">
          <div className="claims-kpi-icon pending">
            <HiClock />
          </div>
          <div>
            <span className="claims-kpi-label">Pending Review</span>
            <div className="claims-kpi-val">{pendingCount}</div>
          </div>
        </div>

        <div className="claims-kpi-card glassmorphism">
          <div className="claims-kpi-icon approved">
            <HiCheckCircle />
          </div>
          <div>
            <span className="claims-kpi-label">Approved Claims</span>
            <div className="claims-kpi-val">{approvedCount}</div>
          </div>
        </div>

        <div className="claims-kpi-card glassmorphism">
          <div className="claims-kpi-icon payout">
            <HiCurrencyDollar />
          </div>
          <div>
            <span className="claims-kpi-label">Approved Payout</span>
            <div className="claims-kpi-val">${totalApprovedPayout.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="claims-controls-bar glassmorphism">
        <div className="claims-filter-tabs">
          {[
            { key: 'ALL', label: 'All Claims', count: totalClaimsCount },
            { key: 'PENDING', label: 'Pending', count: claims.filter((c) => c.status === 'PENDING').length },
            { key: 'IN_REVIEW', label: 'In Review', count: claims.filter((c) => c.status === 'IN_REVIEW').length },
            { key: 'APPROVED', label: 'Approved', count: approvedCount },
            { key: 'REJECTED', label: 'Rejected', count: claims.filter((c) => c.status === 'REJECTED').length },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`claim-tab-btn ${filterStatus === tab.key ? 'active' : ''}`}
              onClick={() => setFilterStatus(tab.key)}
            >
              {tab.label}
              <span className="tab-count-chip">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="claims-search-wrapper">
          <HiSearch className="claims-search-icon" />
          <input
            type="text"
            className="claims-search-input"
            placeholder="Search claims or policy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Claims List Grid */}
      {filteredClaims.length === 0 ? (
        <div className="empty-claims-box">
          <HiFolderOpen className="empty-claims-icon" />
          <h3>No claims found</h3>
          <p className="text-secondary" style={{ fontSize: '0.9rem', maxWidth: '400px' }}>
            {claims.length === 0
              ? "You haven't submitted any insurance claims yet."
              : 'No claims match your current filter or search criteria.'}
          </p>
          {claims.length === 0 && (
            <Link to="/claims/new" className="btn btn-primary mt-3">
              <HiPlus /> File Your First Claim
            </Link>
          )}
        </div>
      ) : (
        <div className="claims-grid">
          {filteredClaims.map((claim) => {
            const policy = claim.userPolicy?.policy;
            const category = policy?.category || 'GENERAL';

            return (
              <div key={claim.id} className="claim-card glassmorphism">
                <div className="claim-card-top">
                  <div className="claim-title-area">
                    <div className="claim-meta-tags mb-1">
                      <span className={`badge badge-category badge-${category.toLowerCase()}`}>
                        {category}
                      </span>
                      <span className="text-xs text-secondary">ID: #{claim.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="claim-policy-name">{policy?.name || 'Insurance Claim'}</h3>
                  </div>

                  {/* Status Pill */}
                  <span className={`claim-status-pill ${claim.status.toLowerCase()}`}>
                    {claim.status === 'APPROVED' && <HiCheckCircle />}
                    {claim.status === 'REJECTED' && <HiXCircle />}
                    {claim.status === 'PENDING' && <HiClock />}
                    {claim.status === 'IN_REVIEW' && <HiExclamationCircle />}
                    {claim.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Details Bar */}
                <div className="claim-details-grid">
                  <div className="claim-detail-item">
                    <span>
                      <HiCalendar /> Incident Date
                    </span>
                    <strong>{new Date(claim.incidentDate).toLocaleDateString()}</strong>
                  </div>

                  <div className="claim-detail-item">
                    <span>
                      <HiClock /> Filed On
                    </span>
                    <strong>{new Date(claim.createdAt).toLocaleDateString()}</strong>
                  </div>

                  <div className="claim-detail-item">
                    <span>
                      <HiCurrencyDollar /> Amount Claimed
                    </span>
                    <strong style={{ color: 'var(--color-primary)' }}>
                      ${claim.amount?.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Description */}
                <div className="claim-desc-box">
                  <strong>Description:</strong> {claim.description}
                </div>

                {/* Reviewer Notes if present */}
                {claim.reviewerNotes && (
                  <div className="claim-reviewer-notes">
                    <strong>Advisor Review Notes:</strong>
                    {claim.reviewerNotes}
                  </div>
                )}

                {/* Footer Action */}
                <div className="claim-footer-actions">
                  <div>
                    {claim.documents && claim.documents.length > 0 ? (
                      <button
                        className="evidence-btn"
                        onClick={() =>
                          setActiveClaimDocs({
                            docs: claim.documents,
                            title: `Evidence Proof for ${policy?.name || 'Claim'}`,
                          })
                        }
                      >
                        <HiDocumentText size={18} /> View Attached Evidence ({claim.documents.length} File{claim.documents.length > 1 ? 's' : ''})
                      </button>
                    ) : (
                      <span className="no-evidence-text">No evidence documents attached</span>
                    )}
                  </div>

                  <div className="text-xs text-secondary">
                    Provider: <strong>{policy?.provider || 'PolicySphere Partner'}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Evidence Viewer Modal */}
      {activeClaimDocs && (
        <DocumentViewerModal
          isOpen={Boolean(activeClaimDocs)}
          documents={activeClaimDocs.docs}
          claimTitle={activeClaimDocs.title}
          onClose={() => setActiveClaimDocs(null)}
        />
      )}
    </div>
  );
};

export default ClaimsPage;
