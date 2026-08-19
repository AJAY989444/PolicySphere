import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdvisorDashboardPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'ADVISOR' && user.role !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }
    fetchClaims();
  }, [user, navigate]);

  const fetchClaims = async () => {
    try {
      const res = await api.get('/advisor/claims');
      setClaims(res.data.claims);
    } catch (err) {
      toast.error('Failed to load claims');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (claimId, newStatus) => {
    try {
      await api.patch(`/advisor/claims/${claimId}/status`, { status: newStatus });
      toast.success(`Claim marked as ${newStatus}`);
      fetchClaims();
    } catch (err) {
      toast.error('Failed to update claim status');
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return <span className="badge badge-warning">Pending</span>;
      case 'IN_REVIEW': return <span className="badge badge-primary">In Review</span>;
      case 'APPROVED': return <span className="badge badge-success">Approved</span>;
      case 'REJECTED': return <span className="badge badge-error">Rejected</span>;
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>Advisor Portal</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Review and manage customer claims.</p>
        </div>
      </div>

      {claims.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>No claims found</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>There are currently no claims in the system.</p>
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
                    {getStatusBadge(claim.status)}
                  </td>
                  <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                    <select 
                      className="form-input" 
                      style={{ padding: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}
                      value={claim.status}
                      onChange={(e) => handleStatusChange(claim.id, e.target.value)}
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
    </div>
  );
};

export default AdvisorDashboardPage;
