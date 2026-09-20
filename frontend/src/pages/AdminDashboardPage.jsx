import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api/axios';
import {
  HiUsers,
  HiShieldCheck,
  HiTicket,
  HiSpeakerphone,
  HiClipboardList,
  HiCog,
  HiPlus,
  HiRefresh,
  HiSearch,
  HiFilter,
  HiCheckCircle,
  HiXCircle,
  HiPencil,
  HiBan,
  HiEye,
  HiExternalLink,
  HiTrash,
  HiLockClosed,
  HiSparkles,
  HiCurrencyDollar,
  HiDocumentText,
  HiCheck,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import './AdminDashboardPage.css';

function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);

  // Overview Stats
  const [overview, setOverview] = useState(null);

  // 1. Users & RBAC
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [newRoleSelection, setNewRoleSelection] = useState('CUSTOMER');

  // 2. Policies & Insurers
  const [policies, setPolicies] = useState([]);
  const [insurers, setInsurers] = useState([]);
  const [policyCatalogTab, setPolicyCatalogTab] = useState('policies');
  const [showInsurerModal, setShowInsurerModal] = useState(false);
  const [insurerForm, setInsurerForm] = useState({
    name: '',
    irdaRegNo: '',
    category: 'HEALTH',
    commissionRate: 0.125,
    contactEmail: '',
    contactPhone: '',
  });

  // 3. Coupons & Promotions
  const [coupons, setCoupons] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minPremium: 0,
    maxDiscount: '',
    category: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    usageLimit: '',
  });
  // Coupon Tester Simulator
  const [testCode, setTestCode] = useState('');
  const [testPremium, setTestPremium] = useState(10000);
  const [testCategory, setTestCategory] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testingCoupon, setTestingCoupon] = useState(false);

  // 4. CMS Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    severity: 'INFO',
    linkUrl: '',
    endDate: '',
  });

  // 5. Security Audit Trail
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditEntityTypeFilter, setAuditEntityTypeFilter] = useState('');
  const [selectedAuditDiff, setSelectedAuditDiff] = useState(null);

  // 6. Platform Settings
  const [settings, setSettings] = useState([]);
  const [settingsForm, setSettingsForm] = useState({});
  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch Overview Stats
  const fetchOverview = async () => {
    try {
      const res = await api.get('/admin/governance/overview');
      if (res.data.success) {
        setOverview(res.data);
      }
    } catch (err) {
      console.error('Error fetching governance overview:', err);
    }
  };

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', userPage);
      params.append('limit', 12);
      if (userRoleFilter) params.append('role', userRoleFilter);
      if (userStatusFilter) params.append('status', userStatusFilter);
      if (userSearch.trim()) params.append('search', userSearch.trim());

      const res = await api.get(`/admin/governance/users?${params.toString()}`);
      if (res.data.success) {
        setUsers(res.data.users);
        setUserTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      toast.error('Failed to load user directory');
    }
  }, [userPage, userRoleFilter, userStatusFilter, userSearch]);

  // Fetch Policies & Insurers
  const fetchPoliciesAndInsurers = async () => {
    try {
      const [pRes, iRes] = await Promise.all([
        api.get('/admin/policies'),
        api.get('/admin/governance/insurers'),
      ]);
      setPolicies(pRes.data || []);
      setInsurers(iRes.data?.insurers || []);
    } catch (err) {
      console.error('Error fetching policies/insurers:', err);
    }
  };

  // Fetch Coupons
  const fetchCoupons = async () => {
    try {
      const res = await api.get('/admin/governance/coupons');
      if (res.data.success) {
        setCoupons(res.data.coupons);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    }
  };

  // Fetch Announcements
  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/admin/governance/announcements');
      if (res.data.success) {
        setAnnouncements(res.data.announcements);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
    }
  };

  // Fetch Audit Trail
  const fetchAuditLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', auditPage);
      params.append('limit', 15);
      if (auditActionFilter) params.append('action', auditActionFilter);
      if (auditEntityTypeFilter) params.append('entityType', auditEntityTypeFilter);

      const res = await api.get(`/admin/governance/audit-trail?${params.toString()}`);
      if (res.data.success) {
        setAuditLogs(res.data.logs);
        setAuditTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching audit trail:', err);
    }
  }, [auditPage, auditActionFilter, auditEntityTypeFilter]);

  // Fetch Platform Settings
  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/governance/settings');
      if (res.data.success) {
        setSettings(res.data.settings);
        const formMap = {};
        res.data.settings.forEach((s) => {
          formMap[s.key] = s.value;
        });
        setSettingsForm(formMap);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  // Initial Load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchOverview(),
        fetchUsers(),
        fetchPoliciesAndInsurers(),
        fetchCoupons(),
        fetchAnnouncements(),
        fetchAuditLogs(),
        fetchSettings(),
      ]);
      setLoading(false);
    };
    init();
  }, []);

  // Re-fetch users on filter changes
  useEffect(() => {
    if (!loading) fetchUsers();
  }, [fetchUsers, loading]);

  // Re-fetch audit logs on filter changes
  useEffect(() => {
    if (!loading) fetchAuditLogs();
  }, [fetchAuditLogs, loading]);

  // ─── Actions: User & RBAC ────────────────────────────────────
  const handleUpdateRole = async () => {
    if (!selectedUserForRole) return;
    try {
      await api.put(`/admin/governance/users/${selectedUserForRole.id}/role`, {
        role: newRoleSelection,
      });
      toast.success(`Role for ${selectedUserForRole.name || selectedUserForRole.email} updated to ${newRoleSelection}`);
      setSelectedUserForRole(null);
      fetchUsers();
      fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleToggleUserStatus = async (userObj) => {
    const action = userObj.isActive ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} user ${userObj.email}?`)) {
      return;
    }

    try {
      await api.put(`/admin/governance/users/${userObj.id}/status`, {
        isActive: !userObj.isActive,
        reason: `Administrative ${action} via Super Admin Control Center`,
      });
      toast.success(`User ${userObj.email} ${userObj.isActive ? 'suspended' : 'activated'}`);
      fetchUsers();
      fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} user`);
    }
  };

  // ─── Actions: Policies & Insurers ────────────────────────────
  const handleDeactivatePolicy = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate policy "${name}"?`)) return;
    try {
      await api.delete(`/admin/policies/${id}`);
      toast.success(`Policy "${name}" deactivated`);
      fetchPoliciesAndInsurers();
      fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate policy');
    }
  };

  const handleCreateInsurer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/governance/insurers', insurerForm);
      toast.success(`Insurer partner "${insurerForm.name}" registered successfully`);
      setShowInsurerModal(false);
      setInsurerForm({
        name: '',
        irdaRegNo: '',
        category: 'HEALTH',
        commissionRate: 0.125,
        contactEmail: '',
        contactPhone: '',
      });
      fetchPoliciesAndInsurers();
      fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register insurer');
    }
  };

  const handleToggleInsurer = async (insurerObj) => {
    try {
      await api.put(`/admin/governance/insurers/${insurerObj.id}/toggle`, {
        isActive: !insurerObj.isActive,
      });
      toast.success(`Insurer partner "${insurerObj.name}" ${insurerObj.isActive ? 'deactivated' : 'activated'}`);
      fetchPoliciesAndInsurers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle insurer');
    }
  };

  // ─── Actions: Coupons & Promotions ───────────────────────────
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...couponForm,
        minPremium: couponForm.minPremium ? parseFloat(couponForm.minPremium) : 0,
        maxDiscount: couponForm.maxDiscount ? parseFloat(couponForm.maxDiscount) : null,
        usageLimit: couponForm.usageLimit ? parseInt(couponForm.usageLimit, 10) : null,
      };
      await api.post('/admin/governance/coupons', payload);
      toast.success(`Promo code "${couponForm.code.toUpperCase()}" created`);
      setShowCouponModal(false);
      setCouponForm({
        code: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        minPremium: 0,
        maxDiscount: '',
        category: '',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        usageLimit: '',
      });
      fetchCoupons();
      fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleToggleCoupon = async (couponObj) => {
    try {
      await api.put(`/admin/governance/coupons/${couponObj.id}/toggle`, {
        isActive: !couponObj.isActive,
      });
      toast.success(`Promo code "${couponObj.code}" ${couponObj.isActive ? 'paused' : 'activated'}`);
      fetchCoupons();
      fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle coupon');
    }
  };

  const handleTestCoupon = async (e) => {
    e.preventDefault();
    if (!testCode.trim()) return;
    setTestingCoupon(true);
    try {
      const res = await api.post('/governance/public/coupons/validate', {
        code: testCode,
        premiumAmount: parseFloat(testPremium) || 0,
        category: testCategory || null,
      });
      setTestResult(res.data);
    } catch (err) {
      setTestResult(err.response?.data || { isValid: false, reason: 'Validation failed' });
    } finally {
      setTestingCoupon(false);
    }
  };

  // ─── Actions: Announcements ──────────────────────────────────
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/governance/announcements', announcementForm);
      toast.success('Platform announcement broadcasted successfully');
      setShowAnnouncementModal(false);
      setAnnouncementForm({
        title: '',
        message: '',
        severity: 'INFO',
        linkUrl: '',
        endDate: '',
      });
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to broadcast announcement');
    }
  };

  const handleToggleAnnouncement = async (ann) => {
    try {
      await api.put(`/admin/governance/announcements/${ann.id}/toggle`, {
        isActive: !ann.isActive,
      });
      toast.success(`Announcement ${ann.isActive ? 'hidden' : 'broadcasted'}`);
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to toggle announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/admin/governance/announcements/${id}`);
      toast.success('Announcement removed');
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  // ─── Actions: Settings ───────────────────────────────────────
  const handleSaveSetting = async (key, val) => {
    try {
      setSavingSettings(true);
      await api.put(`/admin/governance/settings/${key}`, { value: val });
      toast.success(`Setting '${key}' saved and applied`);
      fetchSettings();
      fetchOverview();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save setting');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading-container">
        <div className="admin-spinner"></div>
        <p>Loading Super Admin Control Center & Governance Hub...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* ─── Top Control Center Header ──────────────────────── */}
      <div className="admin-header-row">
        <div className="admin-title-area">
          <div className="admin-badge-row">
            <span className="admin-role-badge">Super Admin Control Center</span>
            <span className={`admin-status-pill ${overview?.security?.maintenanceMode ? 'maintenance' : 'live'}`}>
              <span className="status-dot" />
              {overview?.security?.maintenanceMode ? 'Maintenance Mode Active' : 'All Systems Operational'}
            </span>
          </div>
          <h1>Enterprise Governance & Platform Cockpit</h1>
          <p>
            Master administration suite for RBAC user directory, insurer registry, promotional discount engine,
            forensic audit trails, and global system parameters.
          </p>
        </div>

        <div className="admin-header-actions">
          <button className="admin-btn secondary" onClick={() => window.location.reload()} title="Reload Workspace">
            <HiRefresh /> Refresh
          </button>
          <Link to="/admin/policies/new" className="admin-btn primary">
            <HiPlus /> Add New Policy
          </Link>
        </div>
      </div>

      {/* ─── Governance KPI Metric Cards ────────────────────── */}
      {overview && (
        <div className="admin-kpi-grid">
          <div className="admin-kpi-card" onClick={() => setActiveTab('users')} style={{ cursor: 'pointer' }}>
            <div className="admin-kpi-header">
              <span>Total Platform Users</span>
              <HiUsers style={{ color: '#3b82f6', fontSize: '1.25rem' }} />
            </div>
            <div className="admin-kpi-val">{overview.users.total.toLocaleString()}</div>
            <div className="admin-kpi-sub">
              <span>{overview.users.customers} Customers</span> • <span>{overview.users.advisors} Advisors</span> • <span>{overview.users.admins} Admins</span>
            </div>
          </div>

          <div className="admin-kpi-card" onClick={() => { setActiveTab('policies'); setPolicyCatalogTab('insurers'); }} style={{ cursor: 'pointer' }}>
            <div className="admin-kpi-header">
              <span>Partner Insurers</span>
              <HiShieldCheck style={{ color: '#10b981', fontSize: '1.25rem' }} />
            </div>
            <div className="admin-kpi-val">{overview.insurers.activeCount}</div>
            <div className="admin-kpi-sub">
              <span className="badge-tag success">IRDAI Licensed</span>
              <span>Under Contract</span>
            </div>
          </div>

          <div className="admin-kpi-card" onClick={() => { setActiveTab('policies'); setPolicyCatalogTab('policies'); }} style={{ cursor: 'pointer' }}>
            <div className="admin-kpi-header">
              <span>Insurance Catalog</span>
              <HiDocumentText style={{ color: '#8b5cf6', fontSize: '1.25rem' }} />
            </div>
            <div className="admin-kpi-val">{overview.policies.active} / {overview.policies.total}</div>
            <div className="admin-kpi-sub">
              <span>Active policies issued across 5 sectors</span>
            </div>
          </div>

          <div className="admin-kpi-card" onClick={() => setActiveTab('coupons')} style={{ cursor: 'pointer' }}>
            <div className="admin-kpi-header">
              <span>Promotions & Coupons</span>
              <HiTicket style={{ color: '#f59e0b', fontSize: '1.25rem' }} />
            </div>
            <div className="admin-kpi-val">{overview.promotions.activeCoupons} Active</div>
            <div className="admin-kpi-sub">
              <span>Promotional discount vouchers</span>
            </div>
          </div>

          <div className="admin-kpi-card" onClick={() => setActiveTab('audit')} style={{ cursor: 'pointer' }}>
            <div className="admin-kpi-header">
              <span>Security Audit Trail</span>
              <HiClipboardList style={{ color: '#ec4899', fontSize: '1.25rem' }} />
            </div>
            <div className="admin-kpi-val">{overview.security.auditEvents24h}</div>
            <div className="admin-kpi-sub">
              <span>Administrative events logged in last 24h</span>
            </div>
          </div>

          <div className="admin-kpi-card" onClick={() => setActiveTab('settings')} style={{ cursor: 'pointer' }}>
            <div className="admin-kpi-header">
              <span>Platform Operation</span>
              <HiCog style={{ color: '#06b6d4', fontSize: '1.25rem' }} />
            </div>
            <div className="admin-kpi-val" style={{ fontSize: '1.35rem' }}>
              {overview.security.maintenanceMode ? 'MAINTENANCE' : 'NORMAL'}
            </div>
            <div className="admin-kpi-sub">
              <span>Brokerage & Underwriting rules active</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Domain Navigation Tabs ───────────────────── */}
      <div className="admin-tabs-bar">
        <button
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <HiUsers /> 👥 User Directory & RBAC
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <HiShieldCheck /> 🛡️ Policies & Insurers
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
          onClick={() => setActiveTab('coupons')}
        >
          <HiTicket /> 🎟️ Coupons & Discounts
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          <HiSpeakerphone /> 📢 CMS & Announcements
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <HiClipboardList /> 📜 Security Audit Trail
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <HiCog /> ⚙️ Platform Parameters
        </button>
      </div>

      {/* ───────────────────────────────────────────────────── */}
      {/* TAB 1: USERS & RBAC GOVERNANCE                       */}
      {/* ───────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="admin-section">
          {/* Filter Toolbar */}
          <div className="admin-filter-bar">
            <div className="search-input-wrapper">
              <HiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search user by name, email, or phone..."
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
              />
              {userSearch && (
                <button className="clear-btn" onClick={() => setUserSearch('')}>×</button>
              )}
            </div>

            <div className="select-filters-group">
              <select
                value={userRoleFilter}
                onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                className="admin-select"
              >
                <option value="">All Roles</option>
                <option value="CUSTOMER">Customers</option>
                <option value="ADVISOR">Advisors</option>
                <option value="ADMIN">Admins</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => { setUserStatusFilter(e.target.value); setUserPage(1); }}
                className="admin-select"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="admin-table-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User / Account</th>
                    <th>Role (RBAC)</th>
                    <th>Status</th>
                    <th>Policies Attached</th>
                    <th>Payment Txns</th>
                    <th>Support Tickets</th>
                    <th>Joined Date</th>
                    <th>Governance Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className={!u.isActive ? 'row-suspended' : ''}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-circle">
                            {(u.name?.[0] || u.email[0]).toUpperCase()}
                          </div>
                          <div>
                            <div className="user-name">{u.name || 'Unnamed User'}</div>
                            <div className="user-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`rbac-badge role-${u.role.toLowerCase()}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u.isActive ? (
                          <span className="status-pill active"><HiCheckCircle /> Active</span>
                        ) : (
                          <span className="status-pill suspended"><HiXCircle /> Suspended</span>
                        )}
                      </td>
                      <td><strong>{u.policyCount}</strong> policies</td>
                      <td>{u.paymentCount} orders</td>
                      <td>{u.ticketCount} tickets</td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(u.joinedAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="action-buttons-flex">
                          <button
                            className="admin-action-btn"
                            title="Change Role"
                            onClick={() => {
                              setSelectedUserForRole(u);
                              setNewRoleSelection(u.role);
                            }}
                          >
                            <HiLockClosed /> Change Role
                          </button>
                          {u.id !== currentUser?.id && (
                            <button
                              className={`admin-action-btn ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                              onClick={() => handleToggleUserStatus(u)}
                              title={u.isActive ? 'Suspend User' : 'Activate User'}
                            >
                              {u.isActive ? <><HiBan /> Suspend</> : <><HiCheck /> Activate</>}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        No users match the selected query or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {userTotalPages > 1 && (
              <div className="admin-pagination">
                <button
                  disabled={userPage <= 1}
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  className="page-btn"
                >
                  Previous
                </button>
                <span>Page {userPage} of {userTotalPages}</span>
                <button
                  disabled={userPage >= userTotalPages}
                  onClick={() => setUserPage((p) => Math.min(userTotalPages, p + 1))}
                  className="page-btn"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* TAB 2: POLICIES & INSURERS                           */}
      {/* ───────────────────────────────────────────────────── */}
      {activeTab === 'policies' && (
        <div className="admin-section">
          <div className="sub-tabs-bar">
            <button
              className={`sub-tab-btn ${policyCatalogTab === 'policies' ? 'active' : ''}`}
              onClick={() => setPolicyCatalogTab('policies')}
            >
              Insurance Policies Catalog ({policies.length})
            </button>
            <button
              className={`sub-tab-btn ${policyCatalogTab === 'insurers' ? 'active' : ''}`}
              onClick={() => setPolicyCatalogTab('insurers')}
            >
              Registered Partner Insurers ({insurers.length})
            </button>
          </div>

          {policyCatalogTab === 'policies' && (
            <div className="admin-table-card">
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Policy Name</th>
                      <th>Category</th>
                      <th>Underwriter Provider</th>
                      <th>Coverage (Sum Assured)</th>
                      <th>Monthly Premium</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.map((p) => (
                      <tr key={p.id} className={!p.isActive ? 'row-inactive' : ''}>
                        <td><strong>{p.name}</strong></td>
                        <td><span className={`badge-category badge-${p.category.toLowerCase()}`}>{p.category}</span></td>
                        <td>{p.provider}</td>
                        <td>${p.coverageAmount?.toLocaleString()}</td>
                        <td><strong>${p.premium}</strong>/mo</td>
                        <td>{p.duration} Months</td>
                        <td>
                          {p.isActive ? (
                            <span className="status-pill active"><HiCheckCircle /> Active</span>
                          ) : (
                            <span className="status-pill suspended"><HiXCircle /> Inactive</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons-flex">
                            <Link to={`/admin/policies/edit/${p.id}`} className="admin-action-btn" title="Edit Policy">
                              <HiPencil /> Edit
                            </Link>
                            {p.isActive && (
                              <button
                                className="admin-action-btn btn-danger"
                                title="Deactivate"
                                onClick={() => handleDeactivatePolicy(p.id, p.name)}
                              >
                                <HiBan /> Deactivate
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
          )}

          {policyCatalogTab === 'insurers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button className="admin-btn primary" onClick={() => setShowInsurerModal(true)}>
                  <HiPlus /> Register Insurer Partner
                </button>
              </div>

              <div className="admin-table-card">
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Insurer Company</th>
                        <th>IRDAI Registration #</th>
                        <th>Primary Category</th>
                        <th>Brokerage Commission</th>
                        <th>Active Products</th>
                        <th>Contact Email</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insurers.map((ins) => (
                        <tr key={ins.id} className={!ins.isActive ? 'row-inactive' : ''}>
                          <td><strong>{ins.name}</strong></td>
                          <td><code>{ins.irdaRegNo}</code></td>
                          <td><span className={`badge-category badge-${ins.category?.toLowerCase() || 'health'}`}>{ins.category}</span></td>
                          <td><strong>{(ins.commissionRate * 100).toFixed(1)}%</strong></td>
                          <td>{ins.activePolicies || 0} active in catalog</td>
                          <td>{ins.contactEmail}</td>
                          <td>
                            {ins.isActive ? (
                              <span className="status-pill active"><HiCheckCircle /> Active Partner</span>
                            ) : (
                              <span className="status-pill suspended"><HiXCircle /> Suspended</span>
                            )}
                          </td>
                          <td>
                            <button
                              className={`admin-action-btn ${ins.isActive ? 'btn-danger' : 'btn-success'}`}
                              onClick={() => handleToggleInsurer(ins)}
                            >
                              {ins.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* TAB 3: COUPONS & PROMOTIONAL ENGINE                   */}
      {/* ───────────────────────────────────────────────────── */}
      {activeTab === 'coupons' && (
        <div className="admin-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Promotions & Coupon Discounts</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Create promotional discount codes for marketing campaigns and checkout price reductions.
              </p>
            </div>
            <button className="admin-btn primary" onClick={() => setShowCouponModal(true)}>
              <HiPlus /> Create Promo Code
            </button>
          </div>

          {/* Coupon Cards Grid */}
          <div className="coupons-grid">
            {coupons.map((c) => (
              <div key={c.id} className={`coupon-admin-card ${!c.isActive ? 'inactive' : ''}`}>
                <div className="coupon-top-row">
                  <div className="coupon-code-badge">{c.code}</div>
                  <span className={`status-pill ${c.isActive ? 'active' : 'suspended'}`}>
                    {c.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>
                <div className="coupon-discount-val">
                  {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `$${c.discountValue} FLAT OFF`}
                </div>
                <p className="coupon-desc">{c.description || 'Promotional marketplace discount'}</p>
                <div className="coupon-details-list">
                  <div>Min Outlay: <strong>${c.minPremium.toLocaleString()}</strong></div>
                  {c.maxDiscount && <div>Max Cap: <strong>${c.maxDiscount.toLocaleString()}</strong></div>}
                  {c.category && <div>Category: <strong>{c.category}</strong></div>}
                  <div>Valid: <strong>{new Date(c.startDate).toLocaleDateString()} – {new Date(c.endDate).toLocaleDateString()}</strong></div>
                  <div>Used: <strong>{c.usedCount}</strong> {c.usageLimit ? `/ ${c.usageLimit} redemptions` : 'unlimited'}</div>
                </div>
                <div className="coupon-card-footer">
                  <button
                    className={`admin-action-btn ${c.isActive ? 'btn-danger' : 'btn-success'}`}
                    onClick={() => handleToggleCoupon(c)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {c.isActive ? 'Pause Promotion' : 'Activate Promotion'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Real-time Coupon Tester Simulator */}
          <div className="admin-card coupon-simulator-card">
            <div className="card-header-flex">
              <div>
                <h3>⚡ Interactive Coupon Validation Simulator</h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Test promotional code redemption rules and verify discount calculation before public marketing.
                </p>
              </div>
            </div>

            <form onSubmit={handleTestCoupon} className="coupon-sim-form">
              <div className="sim-field">
                <label>Promo Code</label>
                <input
                  type="text"
                  placeholder="e.g. WELCOME10"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="sim-field">
                <label>Simulated Premium ($)</label>
                <input
                  type="number"
                  value={testPremium}
                  onChange={(e) => setTestPremium(e.target.value)}
                  required
                />
              </div>
              <div className="sim-field">
                <label>Policy Category (Optional)</label>
                <select value={testCategory} onChange={(e) => setTestCategory(e.target.value)}>
                  <option value="">Any Category</option>
                  <option value="HEALTH">HEALTH</option>
                  <option value="MOTOR">MOTOR</option>
                  <option value="LIFE">LIFE</option>
                  <option value="TRAVEL">TRAVEL</option>
                  <option value="HOME">HOME</option>
                </select>
              </div>
              <button type="submit" className="admin-btn primary" disabled={testingCoupon}>
                {testingCoupon ? 'Testing...' : 'Test Validation'}
              </button>
            </form>

            {testResult && (
              <div className={`sim-result-box ${testResult.isValid ? 'valid' : 'invalid'}`}>
                {testResult.isValid ? (
                  <div>
                    <div style={{ fontWeight: 800, color: '#15803d', marginBottom: '0.25rem' }}>
                      ✅ Promo Code Valid & Applicable!
                    </div>
                    <div>Original: <strong>${testResult.originalPremium}</strong></div>
                    <div>Discount Amount: <strong style={{ color: '#15803d' }}>-${testResult.discountAmount}</strong> ({testResult.discountType === 'PERCENTAGE' ? `${testResult.discountValue}%` : 'Flat'})</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '0.25rem' }}>
                      Final Checkout Price: ${testResult.finalPremium}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 800, color: '#b91c1c', marginBottom: '0.25rem' }}>
                      ❌ Promotion Invalid or Ineligible
                    </div>
                    <div>Reason: {testResult.reason}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* TAB 4: CMS & ANNOUNCEMENTS BROADCASTER               */}
      {/* ───────────────────────────────────────────────────── */}
      {activeTab === 'announcements' && (
        <div className="admin-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Platform Broadcasts & Announcements</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Broadcast emergency maintenance alerts, festival discounts, and IRDAI compliance circulars to all marketplace users.
              </p>
            </div>
            <button className="admin-btn primary" onClick={() => setShowAnnouncementModal(true)}>
              <HiPlus /> Broadcast Announcement
            </button>
          </div>

          <div className="admin-table-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Announcement Title</th>
                    <th>Message Details</th>
                    <th>External Link</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((a) => (
                    <tr key={a.id} className={!a.isActive ? 'row-inactive' : ''}>
                      <td>
                        <span className={`severity-badge severity-${a.severity.toLowerCase()}`}>
                          {a.severity}
                        </span>
                      </td>
                      <td><strong>{a.title}</strong></td>
                      <td style={{ maxWidth: '350px' }}>{a.message}</td>
                      <td>
                        {a.linkUrl ? (
                          <a href={a.linkUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: '0.82rem' }}>
                            View Link <HiExternalLink />
                          </a>
                        ) : '—'}
                      </td>
                      <td>
                        {a.isActive ? (
                          <span className="status-pill active"><HiCheckCircle /> Live Broadcast</span>
                        ) : (
                          <span className="status-pill suspended"><HiXCircle /> Hidden</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(a.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="action-buttons-flex">
                          <button
                            className="admin-action-btn"
                            onClick={() => handleToggleAnnouncement(a)}
                          >
                            {a.isActive ? 'Hide' : 'Publish'}
                          </button>
                          <button
                            className="admin-action-btn btn-danger"
                            onClick={() => handleDeleteAnnouncement(a.id)}
                          >
                            <HiTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {announcements.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        No platform broadcasts configured. Click "Broadcast Announcement" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* TAB 5: SECURITY AUDIT TRAIL (SRS 36)                  */}
      {/* ───────────────────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="admin-section">
          {/* Filter Bar */}
          <div className="admin-filter-bar">
            <select
              value={auditActionFilter}
              onChange={(e) => { setAuditActionFilter(e.target.value); setAuditPage(1); }}
              className="admin-select"
            >
              <option value="">All Audit Actions</option>
              <option value="USER_ROLE_UPDATED">USER_ROLE_UPDATED</option>
              <option value="USER_STATUS_TOGGLED">USER_STATUS_TOGGLED</option>
              <option value="COUPON_CREATED">COUPON_CREATED</option>
              <option value="COUPON_STATUS_TOGGLED">COUPON_STATUS_TOGGLED</option>
              <option value="SETTING_UPDATED">SETTING_UPDATED</option>
              <option value="ANNOUNCEMENT_CREATED">ANNOUNCEMENT_CREATED</option>
              <option value="INSURER_CREATED">INSURER_CREATED</option>
              <option value="INSURER_STATUS_TOGGLED">INSURER_STATUS_TOGGLED</option>
              <option value="POLICY_CREATED">POLICY_CREATED</option>
            </select>

            <select
              value={auditEntityTypeFilter}
              onChange={(e) => { setAuditEntityTypeFilter(e.target.value); setAuditPage(1); }}
              className="admin-select"
            >
              <option value="">All Entities</option>
              <option value="USER">USER</option>
              <option value="POLICY">POLICY</option>
              <option value="COUPON">COUPON</option>
              <option value="INSURER">INSURER</option>
              <option value="CMS">CMS</option>
              <option value="SETTING">SETTING</option>
            </select>

            <button className="admin-btn secondary" onClick={fetchAuditLogs}>
              <HiRefresh /> Refresh Log
            </button>
          </div>

          <div className="admin-table-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Administrator</th>
                    <th>Action</th>
                    <th>Entity Type</th>
                    <th>Entity ID</th>
                    <th>IP Address</th>
                    <th>Audit Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.8rem', color: '#475569', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        {log.user ? (
                          <div>
                            <strong>{log.user.firstName} {log.user.lastName}</strong>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{log.user.email}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>System Event</span>
                        )}
                      </td>
                      <td>
                        <span className="audit-action-pill">{log.action}</span>
                      </td>
                      <td><span className="entity-badge">{log.entityType}</span></td>
                      <td><code>{log.entityId || '—'}</code></td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{log.ipAddress || '127.0.0.1'}</td>
                      <td>
                        <button
                          className="admin-action-btn"
                          onClick={() => setSelectedAuditDiff(log)}
                        >
                          <HiEye /> Inspect Diff
                        </button>
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        No audit records match the selected filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {auditTotalPages > 1 && (
              <div className="admin-pagination">
                <button
                  disabled={auditPage <= 1}
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  className="page-btn"
                >
                  Previous
                </button>
                <span>Page {auditPage} of {auditTotalPages}</span>
                <button
                  disabled={auditPage >= auditTotalPages}
                  onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
                  className="page-btn"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* TAB 6: PLATFORM PARAMETERS & SETTINGS                 */}
      {/* ───────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="admin-section">
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Platform Operating Parameters</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Configure global platform parameters, financial margins, auto-underwriting limits, and operational switches.
            </p>
          </div>

          <div className="settings-grid">
            {settings.map((s) => (
              <div key={s.key} className="setting-card">
                <div className="setting-header">
                  <div>
                    <div className="setting-key">{s.key}</div>
                    <span className="setting-category-tag">{s.category}</span>
                  </div>
                </div>

                <p className="setting-desc">{s.description}</p>

                <div className="setting-control-row">
                  {typeof s.value === 'boolean' ? (
                    <div className="toggle-switch-wrapper">
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={settingsForm[s.key] ?? s.value}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setSettingsForm({ ...settingsForm, [s.key]: val });
                            handleSaveSetting(s.key, val);
                          }}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span>{settingsForm[s.key] ? 'ENABLED' : 'DISABLED'}</span>
                    </div>
                  ) : (
                    <div className="number-input-group">
                      <input
                        type="number"
                        step={s.key.includes('RATE') ? '0.1' : '1'}
                        value={settingsForm[s.key] ?? s.value}
                        onChange={(e) => setSettingsForm({ ...settingsForm, [s.key]: parseFloat(e.target.value) || 0 })}
                        className="setting-input"
                      />
                      <button
                        className="admin-btn primary"
                        style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                        onClick={() => handleSaveSetting(s.key, settingsForm[s.key])}
                        disabled={savingSettings}
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>

                {s.updatedBy && (
                  <div className="setting-footer">
                    Last updated by: <span>{s.updatedBy}</span> ({new Date(s.updatedAt).toLocaleDateString()})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* MODAL: CHANGE USER ROLE (RBAC)                        */}
      {/* ───────────────────────────────────────────────────── */}
      {selectedUserForRole && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUserForRole(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Change Role & Permissions</h3>
              <button className="modal-close" onClick={() => setSelectedUserForRole(null)}>×</button>
            </div>
            <div className="admin-modal-body">
              <p>
                Modify RBAC role assignment for <strong>{selectedUserForRole.name || selectedUserForRole.email}</strong>.
              </p>

              <div className="role-options-list">
                {[
                  {
                    role: 'CUSTOMER',
                    title: 'Customer',
                    desc: 'Standard marketplace user: compare quotes, purchase policies, track claims, view Form 80D certificates.',
                  },
                  {
                    role: 'ADVISOR',
                    title: 'Insurance Advisor',
                    desc: 'Advisor staff workbench: access Sales CRM, generate client proposals, view commission statements.',
                  },
                  {
                    role: 'ADMIN',
                    title: 'Super Administrator',
                    desc: 'Full platform governance: access user directory, manage policy catalog, broadcast announcements, adjust parameters.',
                  },
                ].map((opt) => (
                  <label
                    key={opt.role}
                    className={`role-option-card ${newRoleSelection === opt.role ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="roleChoice"
                      value={opt.role}
                      checked={newRoleSelection === opt.role}
                      onChange={() => setNewRoleSelection(opt.role)}
                    />
                    <div>
                      <div style={{ fontWeight: 800 }}>{opt.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              {newRoleSelection === 'ADMIN' && (
                <div className="alert-box warning">
                  ⚠️ Granting Super Admin permissions allows full governance over all marketplace users and policies.
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn secondary" onClick={() => setSelectedUserForRole(null)}>Cancel</button>
              <button className="admin-btn primary" onClick={handleUpdateRole}>Save Role Assignment</button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* MODAL: REGISTER INSURER PARTNER                       */}
      {/* ───────────────────────────────────────────────────── */}
      {showInsurerModal && (
        <div className="admin-modal-overlay" onClick={() => setShowInsurerModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Register Insurer Partner</h3>
              <button className="modal-close" onClick={() => setShowInsurerModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateInsurer}>
              <div className="admin-modal-body">
                <div className="form-group">
                  <label>Insurer Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Care Health Insurance"
                    value={insurerForm.name}
                    onChange={(e) => setInsurerForm({ ...insurerForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>IRDAI Registration Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IRDAI/NL-GEN/108/2023"
                    value={insurerForm.irdaRegNo}
                    onChange={(e) => setInsurerForm({ ...insurerForm, irdaRegNo: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={insurerForm.category}
                    onChange={(e) => setInsurerForm({ ...insurerForm, category: e.target.value })}
                  >
                    <option value="HEALTH">HEALTH</option>
                    <option value="MOTOR">MOTOR</option>
                    <option value="LIFE">LIFE</option>
                    <option value="TRAVEL">TRAVEL</option>
                    <option value="HOME">HOME</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Contract Commission Rate (e.g. 0.15 = 15%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="0.5"
                    required
                    value={insurerForm.commissionRate}
                    onChange={(e) => setInsurerForm({ ...insurerForm, commissionRate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Partner Contact Email</label>
                  <input
                    type="email"
                    required
                    placeholder="corporate@insurer.com"
                    value={insurerForm.contactEmail}
                    onChange={(e) => setInsurerForm({ ...insurerForm, contactEmail: e.target.value })}
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn secondary" onClick={() => setShowInsurerModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn primary">Register Partner</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* MODAL: CREATE PROMO CODE / COUPON                     */}
      {/* ───────────────────────────────────────────────────── */}
      {showCouponModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCouponModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Create Promotional Discount Code</h3>
              <button className="modal-close" onClick={() => setShowCouponModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateCoupon}>
              <div className="admin-modal-body">
                <div className="form-group">
                  <label>Promo Code (Uppercase)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FESTIVE25"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="form-group">
                  <label>Campaign Description</label>
                  <input
                    type="text"
                    placeholder="e.g. 25% Diwali health insurance promotional voucher"
                    value={couponForm.description}
                    onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Discount Type</label>
                    <select
                      value={couponForm.discountType}
                      onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FLAT">Flat Amount ($)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Discount Value</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={couponForm.discountValue}
                      onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Min Policy Premium ($)</label>
                    <input
                      type="number"
                      placeholder="0 (no min)"
                      value={couponForm.minPremium}
                      onChange={(e) => setCouponForm({ ...couponForm, minPremium: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Cap ($ for % discounts)</label>
                    <input
                      type="number"
                      placeholder="Optional limit"
                      value={couponForm.maxDiscount}
                      onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Valid From</label>
                    <input
                      type="date"
                      required
                      value={couponForm.startDate}
                      onChange={(e) => setCouponForm({ ...couponForm, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Expires On</label>
                    <input
                      type="date"
                      required
                      value={couponForm.endDate}
                      onChange={(e) => setCouponForm({ ...couponForm, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Category Restriction</label>
                    <select
                      value={couponForm.category}
                      onChange={(e) => setCouponForm({ ...couponForm, category: e.target.value })}
                    >
                      <option value="">All Categories</option>
                      <option value="HEALTH">HEALTH</option>
                      <option value="MOTOR">MOTOR</option>
                      <option value="LIFE">LIFE</option>
                      <option value="TRAVEL">TRAVEL</option>
                      <option value="HOME">HOME</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Usage Limit (Redemptions)</label>
                    <input
                      type="number"
                      placeholder="Unlimited if blank"
                      value={couponForm.usageLimit}
                      onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn secondary" onClick={() => setShowCouponModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn primary">Create Promo Code</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* MODAL: BROADCAST PLATFORM ANNOUNCEMENT                */}
      {/* ───────────────────────────────────────────────────── */}
      {showAnnouncementModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAnnouncementModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Broadcast Platform Announcement</h3>
              <button className="modal-close" onClick={() => setShowAnnouncementModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateAnnouncement}>
              <div className="admin-modal-body">
                <div className="form-group">
                  <label>Announcement Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scheduled System Upgrade"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Message Content</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Detailed message displayed on the top notification banner across the website..."
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Severity Theme</label>
                    <select
                      value={announcementForm.severity}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, severity: e.target.value })}
                    >
                      <option value="INFO">Information (Blue)</option>
                      <option value="WARNING">Warning (Amber)</option>
                      <option value="CRITICAL">Critical Alert (Red)</option>
                      <option value="FESTIVE">Festive / Promo (Purple)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>External Action Link (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={announcementForm.linkUrl}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, linkUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn secondary" onClick={() => setShowAnnouncementModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn primary">Broadcast to All Users</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────── */}
      {/* MODAL: SECURITY AUDIT DIFF INSPECTOR (SRS 36)         */}
      {/* ───────────────────────────────────────────────────── */}
      {selectedAuditDiff && (
        <div className="admin-modal-overlay" onClick={() => setSelectedAuditDiff(null)}>
          <div className="admin-modal" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Forensic Audit Inspection</h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Action: <code>{selectedAuditDiff.action}</code> • Entity: <strong>{selectedAuditDiff.entityType} ({selectedAuditDiff.entityId})</strong>
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedAuditDiff(null)}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="audit-meta-grid">
                <div>Actor: <strong>{selectedAuditDiff.user?.email || 'System'}</strong></div>
                <div>IP Address: <code>{selectedAuditDiff.ipAddress || '127.0.0.1'}</code></div>
                <div>Timestamp: {new Date(selectedAuditDiff.createdAt).toLocaleString()}</div>
                <div>Status: <span className="status-pill active">{selectedAuditDiff.status}</span></div>
              </div>

              <div className="diff-view-container">
                <div className="diff-column">
                  <div className="diff-header previous">Previous State (Before Change)</div>
                  <pre className="diff-pre">
                    {selectedAuditDiff.previousValue
                      ? JSON.stringify(selectedAuditDiff.previousValue, null, 2)
                      : 'None (New Record Created)'}
                  </pre>
                </div>
                <div className="diff-column">
                  <div className="diff-header new">New State (After Change)</div>
                  <pre className="diff-pre">
                    {selectedAuditDiff.newValue
                      ? JSON.stringify(selectedAuditDiff.newValue, null, 2)
                      : 'None (Record Deleted)'}
                  </pre>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn primary" onClick={() => setSelectedAuditDiff(null)}>Close Inspection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;
