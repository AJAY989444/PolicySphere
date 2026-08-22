import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiShieldCheck, HiCurrencyRupee, HiCollection, HiTrendingUp, HiArrowRight, HiExternalLink, HiDocumentText, HiRefresh } from 'react-icons/hi';
import api from '../services/api/axios';
import { useAuth } from '../context/AuthContext';
import PolicyCertificateModal from '../components/dashboard/PolicyCertificateModal';
import PolicyRenewalModal from '../components/dashboard/PolicyRenewalModal';
import './DashboardPage.css';

function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Certificate Modal State
  const [selectedCertPolicyId, setSelectedCertPolicyId] = useState(null);
  const [isCertOpen, setIsCertOpen] = useState(false);

  // Renewal Modal State
  const [selectedRenewPolicy, setSelectedRenewPolicy] = useState(null);
  const [isRenewOpen, setIsRenewOpen] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, policiesRes] = await Promise.all([
        api.get('/policies/dashboard-stats'),
        api.get('/policies/my-policies'),
      ]);
      setStats(statsRes.data.stats);
      setPolicies(policiesRes.data.policies);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const map = {
      ACTIVE: 'badge-success',
      EXPIRED: 'badge-error',
      CANCELLED: 'badge-warning',
      PENDING: 'badge-primary',
    };
    return map[status] || 'badge-primary';
  };

  const getCategoryIcon = (category) => {
    const icons = { HEALTH: '🏥', LIFE: '🛡️', MOTOR: '🚗', TRAVEL: '✈️', HOME: '🏠' };
    return icons[category] || '📋';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner spinner-lg"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page animate-fade-in">
      <div className="container">
        {/* Welcome Header */}
        <div className="dashboard-header">
          <div className="dashboard-welcome">
            <h1>Welcome back, <span className="text-gradient">{user?.firstName}</span> 👋</h1>
            <p>Here's an overview of your insurance portfolio.</p>
          </div>
          <Link to="/catalog" className="btn btn-primary">
            <HiCollection /> Browse Catalog
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-stats">
          <div className="stat-card stat-card-primary">
            <div className="stat-card-icon">
              <HiCollection size={24} />
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{stats?.totalPolicies || 0}</span>
              <span className="stat-card-label">Total Policies</span>
            </div>
          </div>

          <div className="stat-card stat-card-success">
            <div className="stat-card-icon">
              <HiShieldCheck size={24} />
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{stats?.activePolicies || 0}</span>
              <span className="stat-card-label">Active Policies</span>
            </div>
          </div>

          <div className="stat-card stat-card-accent">
            <div className="stat-card-icon">
              <HiCurrencyRupee size={24} />
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{formatCurrency(stats?.totalPremiums || 0)}</span>
              <span className="stat-card-label">Total Premiums Paid</span>
            </div>
          </div>

          <div className="stat-card stat-card-warning">
            <div className="stat-card-icon">
              <HiTrendingUp size={24} />
            </div>
            <div className="stat-card-content">
              <span className="stat-card-value">{formatCurrency(stats?.totalCoverage || 0)}</span>
              <span className="stat-card-label">Active Coverage</span>
            </div>
          </div>
        </div>

        {/* Policies Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>My Policies</h2>
            <Link to="/catalog" className="section-link">
              Explore More <HiArrowRight />
            </Link>
          </div>

          {policies.length === 0 ? (
            <div className="dashboard-empty card">
              <span className="dashboard-empty-icon">📋</span>
              <h3>No policies yet</h3>
              <p>Start protecting what matters. Browse our catalog and find the perfect plan.</p>
              <Link to="/catalog" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
                Browse Insurance Plans
              </Link>
            </div>
          ) : (
            <div className="policies-table-wrap card">
              <table className="policies-table">
                <thead>
                  <tr>
                    <th>Policy</th>
                    <th>Provider</th>
                    <th>Coverage</th>
                    <th>Premium Paid</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((up) => (
                    <tr key={up.id}>
                      <td>
                        <div className="policy-name-cell">
                          <span className="policy-cell-icon">{getCategoryIcon(up.policy.category)}</span>
                          <div>
                            <strong>{up.policy.name}</strong>
                            <span className="policy-cell-category">{up.policy.category}</span>
                          </div>
                        </div>
                      </td>
                      <td>{up.policy.provider}</td>
                      <td><strong>{formatCurrency(up.policy.coverageAmount)}</strong></td>
                      <td>{formatCurrency(up.premiumPaid)}</td>
                      <td>{formatDate(up.startDate)}</td>
                      <td>{formatDate(up.endDate)}</td>
                      <td><span className={`badge ${getStatusBadge(up.status)}`}>{up.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            title="Renew Policy & Claim NCB Discount"
                            onClick={() => {
                              setSelectedRenewPolicy(up);
                              setIsRenewOpen(true);
                            }}
                          >
                            <HiRefresh /> Renew
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="View Official Certificate"
                            onClick={() => {
                              setSelectedCertPolicyId(up.id);
                              setIsCertOpen(true);
                            }}
                          >
                            <HiDocumentText /> Certificate
                          </button>
                          <Link to={`/catalog/${up.policy.id}`} className="table-link" title="View Plan Details">
                            <HiExternalLink />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="dashboard-actions">
          <Link to="/catalog" className="action-card">
            <div className="action-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <HiCollection size={28} />
            </div>
            <h3>Browse Catalog</h3>
            <p>Explore insurance plans across all categories</p>
            <span className="action-arrow"><HiArrowRight /></span>
          </Link>
          <Link to="/profile" className="action-card">
            <div className="action-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <HiShieldCheck size={28} />
            </div>
            <h3>My Profile</h3>
            <p>Update your personal information and settings</p>
            <span className="action-arrow"><HiArrowRight /></span>
          </Link>
        </div>

        {/* Policy Certificate Modal */}
        <PolicyCertificateModal
          isOpen={isCertOpen}
          onClose={() => setIsCertOpen(false)}
          userPolicyId={selectedCertPolicyId}
        />

        {/* Policy Renewal Modal */}
        <PolicyRenewalModal
          isOpen={isRenewOpen}
          onClose={() => setIsRenewOpen(false)}
          userPolicy={selectedRenewPolicy}
          onRenewSuccess={() => {
            fetchDashboard();
          }}
        />
      </div>
    </div>
  );
}

export default DashboardPage;
