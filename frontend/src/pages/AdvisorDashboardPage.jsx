import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import DocumentViewerModal from '../components/claims/DocumentViewerModal';
import { HiDocumentText, HiShieldCheck, HiUserGroup } from 'react-icons/hi';

const AdvisorDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('CLAIMS'); // 'CLAIMS' or 'KYC'
  const [claims, setClaims] = useState([]);
  const [kycList, setKycList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDocViewer, setActiveDocViewer] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [claimsRes, kycRes] = await Promise.allSettled([
        api.get('/advisor/claims'),
        api.get('/documents/advisor/all')
      ]);

      if (claimsRes.status === 'fulfilled') {
        setClaims(claimsRes.value.data.claims || []);
      }
      if (kycRes.status === 'fulfilled') {
        setKycList(kycRes.value.data.kycList || []);
      }
    } catch (err) {
      toast.error('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimStatusChange = async (claimId, newStatus) => {
    try {
      await api.patch(`/advisor/claims/${claimId}/status`, { status: newStatus });
      toast.success(`Claim marked as ${newStatus}`);
      loadData();
    } catch (err) {
      toast.error('Failed to update claim status');
    }
  };

  const handleKycReview = async (kycId, newStatus) => {
    try {
      await api.patch(`/documents/advisor/${kycId}/review`, { 
        status: newStatus,
        notes: newStatus === 'VERIFIED' ? 'Approved by Advisor after ID document verification' : 'Rejected by Advisor due to invalid document proof'
      });
      toast.success(`KYC status updated to ${newStatus}`);
      loadData();
    } catch (err) {
      toast.error('Failed to update KYC status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
      case 'PENDING_REVIEW': 
        return <span className="badge badge-warning">Pending Review</span>;
      case 'IN_REVIEW': return <span className="badge badge-primary">In Review</span>;
      case 'APPROVED':
      case 'VERIFIED': 
        return <span className="badge badge-success">✅ Verified</span>;
      case 'REJECTED': 
        return <span className="badge badge-error">❌ Rejected</span>;
      default: return <span className="badge badge-secondary">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-10) 0' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: 'var(--space-8) var(--space-6)' }}>
      {/* Portal Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>Advisor Verification Portal</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Review customer insurance claims and manual identity card KYC approvals.</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
        <button
          className={`btn ${activeTab === 'CLAIMS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('CLAIMS')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <HiShieldCheck style={{ fontSize: '1.2rem' }} /> Insurance Claims ({claims.length})
        </button>
        <button
          className={`btn ${activeTab === 'KYC' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('KYC')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <HiUserGroup style={{ fontSize: '1.2rem' }} /> Customer KYC Verification ({kycList.length})
        </button>
      </div>

      {/* TAB 1: CLAIMS MANAGEMENT */}
      {activeTab === 'CLAIMS' && (
        <>
          {claims.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
              <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>No claims found</h3>
              <p style={{ color: 'var(--color-text-muted)' }}>There are currently no claims requiring review.</p>
            </div>
          ) : (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Policy</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Amount</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Proof Documents</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                      <td style={{ padding: 'var(--space-4)' }}>
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        {claim.userPolicy.user.firstName} {claim.userPolicy.user.lastName}<br />
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{claim.userPolicy.user.email}</span>
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        {claim.userPolicy.policy.name}
                      </td>
                      <td style={{ padding: 'var(--space-4)', fontWeight: 600 }}>
                        ${claim.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        {claim.documents && claim.documents.length > 0 ? (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setActiveDocViewer({ docs: claim.documents, title: `Proof Documents - ${claim.userPolicy.user.firstName}'s Claim` })}
                          >
                            <HiDocumentText /> View ({claim.documents.length})
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No Files</span>
                        )}
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        {getStatusBadge(claim.status)}
                      </td>
                      <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                        <select 
                          className="form-input" 
                          style={{ padding: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}
                          value={claim.status}
                          onChange={(e) => handleClaimStatusChange(claim.id, e.target.value)}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_REVIEW">In Review</option>
                          <option value="APPROVED">Approve</option>
                          <option value="REJECTED">Reject</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* TAB 2: CUSTOMER KYC VERIFICATION SECTION */}
      {activeTab === 'KYC' && (
        <>
          {kycList.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
              <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>No Customer KYC Submissions</h3>
              <p style={{ color: 'var(--color-text-muted)' }}>No customer identity cards submitted for verification yet.</p>
            </div>
          ) : (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Submitted Date</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Customer Name</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Document Type</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Submitted ID Number</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Identity Proof Card</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 600, textAlign: 'right' }}>Advisor Action</th>
                  </tr>
                </thead>
                <tbody>
                  {kycList.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                      <td style={{ padding: 'var(--space-4)', fontSize: '0.875rem' }}>
                        {new Date(item.submittedAt).toLocaleString()}
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <strong>{item.userName}</strong><br />
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{item.userEmail}</span>
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <span className="badge badge-secondary" style={{ fontWeight: 'bold' }}>{item.documentType}</span>
                      </td>
                      <td style={{ padding: 'var(--space-4)', fontFamily: 'monospace', fontWeight: 600 }}>
                        {item.documentNumber}
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setActiveDocViewer({ docs: [{ url: item.fileUrl, filename: item.fileName, fileType: 'IMAGE' }], title: `Identity Card - ${item.userName} (${item.documentType})` })}
                        >
                          <HiDocumentText /> Inspect Card File
                        </button>
                      </td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        {getStatusBadge(item.status)}
                      </td>
                      <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#10b981', color: '#fff', padding: '0.35rem 0.75rem' }}
                            onClick={() => handleKycReview(item.id, 'VERIFIED')}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#ef4444', color: '#fff', padding: '0.35rem 0.75rem' }}
                            onClick={() => handleKycReview(item.id, 'REJECTED')}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Document Inspector Modal */}
      {activeDocViewer && (
        <DocumentViewerModal
          isOpen={Boolean(activeDocViewer)}
          documents={activeDocViewer.docs}
          claimTitle={activeDocViewer.title}
          onClose={() => setActiveDocViewer(null)}
        />
      )}
    </div>
  );
};

export default AdvisorDashboardPage;
