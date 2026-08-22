import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api/axios';
import { HiPlus, HiDocumentText, HiUsers, HiShieldCheck, HiClipboardCheck, HiBan, HiPencil } from 'react-icons/hi';
import './AdminDashboardPage.css';

function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, policiesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/policies'),
      ]);
      setStats(statsRes.data);
      setPolicies(policiesRes.data);
    } catch (err) {
      toast.error('Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate policy "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/admin/policies/${id}`);
      toast.success(`Policy "${name}" deactivated`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate policy');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Loading Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page container">
      <div className="admin-header">
        <div>
          <h1>Admin Control Panel</h1>
          <p className="subtitle">Manage insurance catalog, monitor system stats, and administer platform policies</p>
        </div>
        <Link to="/admin/policies/new" className="btn btn-primary">
          <HiPlus /> Add New Policy
        </Link>
      </div>

      {/* Stats Cards Grid */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon icon-users">
              <HiUsers />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Users</span>
              <span className="stat-value">{stats.totalUsers}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon icon-policies">
              <HiShieldCheck />
            </div>
            <div className="stat-info">
              <span className="stat-label">Active Policies</span>
              <span className="stat-value">{stats.activePolicies} / {stats.totalPolicies}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon icon-subscriptions">
              <HiDocumentText />
            </div>
            <div className="stat-info">
              <span className="stat-label">User Subscriptions</span>
              <span className="stat-value">{stats.totalUserPolicies}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon icon-claims">
              <HiClipboardCheck />
            </div>
            <div className="stat-info">
              <span className="stat-label">Pending Claims</span>
              <span className="stat-value">{stats.pendingClaims} / {stats.totalClaims}</span>
            </div>
          </div>
        </div>
      )}

      {/* Policy Catalog Table */}
      <div className="admin-card">
        <div className="card-header-flex">
          <h2>Policy Catalog ({policies.length})</h2>
          <span className="badge badge-info">System Catalog</span>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Policy Name</th>
                <th>Category</th>
                <th>Provider</th>
                <th>Coverage</th>
                <th>Premium</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <tr key={p.id} className={!p.isActive ? 'row-inactive' : ''}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td>
                    <span className={`badge badge-category badge-${p.category.toLowerCase()}`}>
                      {p.category}
                    </span>
                  </td>
                  <td>{p.provider}</td>
                  <td>${p.coverageAmount?.toLocaleString()}</td>
                  <td>${p.premium}/mo</td>
                  <td>{p.duration} Mos</td>
                  <td>
                    {p.isActive ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-danger">Inactive</span>
                    )}
                  </td>
                  <td>
                    <div className="actions-flex">
                      <Link to={`/admin/policies/edit/${p.id}`} className="btn-icon" title="Edit Policy">
                        <HiPencil />
                      </Link>
                      {p.isActive && (
                        <button
                          className="btn-icon btn-danger"
                          title="Deactivate Policy"
                          onClick={() => handleDeactivate(p.id, p.name)}
                        >
                          <HiBan />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
