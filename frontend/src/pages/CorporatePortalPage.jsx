import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiOfficeBuilding,
  HiUsers,
  HiShieldCheck,
  HiCurrencyDollar,
  HiHeart,
  HiDocumentReport,
  HiPlus,
  HiUpload,
  HiRefresh,
  HiSearch,
  HiFilter,
  HiCreditCard,
  HiCheckCircle,
  HiExclamationCircle,
  HiPrinter,
  HiDownload,
  HiX,
  HiUserGroup,
  HiTrash,
} from 'react-icons/hi';
import api from '../services/api/axios';
import BulkUploadModal from '../components/corporate/BulkUploadModal';
import './CorporatePortalPage.css';

function CorporatePortalPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Corporate Data
  const [overview, setOverview] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeePagination, setEmployeePagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [claimsPagination, setClaimsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [invoices, setInvoices] = useState([]);

  // Filters
  const [empSearch, setEmpSearch] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('');
  const [empTierFilter, setEmpTierFilter] = useState('');
  const [claimsStatusFilter, setClaimsStatusFilter] = useState('');

  // Modals
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showAddDependentModal, setShowAddDependentModal] = useState(false);
  const [selectedEmpForDependent, setSelectedEmpForDependent] = useState(null);
  const [showECardModal, setShowECardModal] = useState(false);
  const [selectedECardData, setSelectedECardData] = useState(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Forms
  const [empForm, setEmpForm] = useState({
    employeeCode: '',
    fullName: '',
    workEmail: '',
    phone: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    tier: 'STANDARD',
  });

  const [depForm, setDepForm] = useState({
    fullName: '',
    relation: 'SPOUSE',
    gender: 'FEMALE',
    dateOfBirth: '',
  });

  const [claimForm, setClaimForm] = useState({
    employeeId: '',
    patientName: '',
    relationship: 'SELF',
    hospitalName: '',
    city: 'Mumbai',
    ailment: '',
    claimedAmount: '',
    isCashless: true,
    admissionDate: '',
  });

  const [policyForm, setPolicyForm] = useState({
    policyType: 'GMC',
    title: 'Custom Corporate Group Health Plan',
    insurerName: 'Star Health & Allied Insurance',
    totalSumInsured: 500000,
    premiumPerEmployee: 700,
    annualPremium: 126000,
    cashlessHospitals: 12000,
  });

  // ─── Data Fetching ───────────────────────────────────────────
  const fetchOverview = async () => {
    try {
      const res = await api.get('/corporate/overview');
      if (res.data.success) {
        setOverview(res.data.overview);
      }
    } catch (err) {
      console.error('Error fetching corporate overview:', err);
    }
  };

  const fetchEmployees = useCallback(async (page = 1) => {
    try {
      const params = {
        page,
        limit: 10,
        search: empSearch,
        department: empDeptFilter,
        tier: empTierFilter,
      };
      const res = await api.get('/corporate/employees', { params });
      if (res.data.success) {
        setEmployees(res.data.employees);
        setEmployeePagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  }, [empSearch, empDeptFilter, empTierFilter]);

  const fetchPolicies = async () => {
    try {
      const res = await api.get('/corporate/policies');
      if (res.data.success) {
        setPolicies(res.data.policies);
      }
    } catch (err) {
      console.error('Error fetching policies:', err);
    }
  };

  const fetchClaims = useCallback(async (page = 1) => {
    try {
      const params = {
        page,
        limit: 10,
        status: claimsStatusFilter,
      };
      const res = await api.get('/corporate/claims', { params });
      if (res.data.success) {
        setClaims(res.data.claims);
        setClaimsPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching claims:', err);
    }
  }, [claimsStatusFilter]);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/corporate/invoices');
      if (res.data.success) {
        setInvoices(res.data.invoices);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchOverview(),
      fetchEmployees(1),
      fetchPolicies(),
      fetchClaims(1),
      fetchInvoices(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!loading) fetchEmployees(1);
  }, [fetchEmployees, loading]);

  useEffect(() => {
    if (!loading) fetchClaims(1);
  }, [fetchClaims, loading]);

  // ─── Actions: Employee ───────────────────────────────────────
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/corporate/employees', empForm);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowAddEmpModal(false);
        setEmpForm({
          employeeCode: '',
          fullName: '',
          workEmail: '',
          phone: '',
          department: 'Engineering',
          designation: 'Software Engineer',
          tier: 'STANDARD',
        });
        fetchEmployees(1);
        fetchOverview();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add employee');
    }
  };

  const handleToggleEmpStatus = async (emp) => {
    const nextStatus = emp.enrollmentStatus === 'ACTIVE' ? 'OPTED_OUT' : 'ACTIVE';
    try {
      const res = await api.put(`/corporate/employees/${emp.id}/status`, { status: nextStatus });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchEmployees(employeePagination.page);
        fetchOverview();
      }
    } catch (err) {
      toast.error('Failed to update employee status');
    }
  };

  // ─── Actions: Dependents ─────────────────────────────────────
  const handleOpenAddDependent = (emp) => {
    setSelectedEmpForDependent(emp);
    setDepForm({
      fullName: '',
      relation: 'SPOUSE',
      gender: 'FEMALE',
      dateOfBirth: '',
    });
    setShowAddDependentModal(true);
  };

  const handleAddDependent = async (e) => {
    e.preventDefault();
    if (!selectedEmpForDependent) return;
    try {
      const res = await api.post(`/corporate/employees/${selectedEmpForDependent.id}/dependents`, depForm);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowAddDependentModal(false);
        fetchEmployees(employeePagination.page);
        fetchOverview();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add dependent');
    }
  };

  const handleDeleteDependent = async (depId) => {
    if (!window.confirm('Are you sure you want to remove this dependent from group coverage?')) return;
    try {
      await api.delete(`/corporate/dependents/${depId}`);
      toast.success('Dependent removed');
      fetchEmployees(employeePagination.page);
      fetchOverview();
    } catch (err) {
      toast.error('Failed to remove dependent');
    }
  };

  // ─── Actions: Digital e-Card ─────────────────────────────────
  const handleViewECard = async (empId) => {
    try {
      const res = await api.get(`/corporate/ecard/${empId}`);
      if (res.data.success) {
        setSelectedECardData(res.data.ecard);
        setShowECardModal(true);
      }
    } catch (err) {
      toast.error('Failed to fetch digital health card');
    }
  };

  // ─── Actions: Policy ─────────────────────────────────────────
  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/corporate/policies', policyForm);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowPolicyModal(false);
        fetchPolicies();
        fetchOverview();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create policy');
    }
  };

  // ─── Actions: Claims ─────────────────────────────────────────
  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/corporate/claims', claimForm);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowClaimModal(false);
        setClaimForm({
          employeeId: '',
          patientName: '',
          relationship: 'SELF',
          hospitalName: '',
          city: 'Mumbai',
          ailment: '',
          claimedAmount: '',
          isCashless: true,
          admissionDate: '',
        });
        fetchClaims(1);
        fetchOverview();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit claim');
    }
  };

  // ─── Actions: Invoices ───────────────────────────────────────
  const handleGenerateInvoice = async () => {
    try {
      const period = new Date().toISOString().slice(0, 7);
      const res = await api.post('/corporate/invoices/generate', { billingPeriod: period });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchInvoices();
        fetchOverview();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice');
    }
  };

  if (loading) {
    return (
      <div className="corporate-loading-box">
        <div className="corp-spinner"></div>
        <p>Loading Corporate Group Insurance & Benefits Hub...</p>
      </div>
    );
  }

  return (
    <div className="corporate-portal-container">
      {/* ─── Top Corporate Header ───────────────────────────── */}
      <div className="corp-header-row">
        <div className="corp-title-area">
          <div className="corp-badge-row">
            <span className="corp-type-badge">
              <HiOfficeBuilding /> B2B Group Insurance Portal
            </span>
            <span className="corp-cin-badge">
              CIN: {overview?.company?.cin || 'U72200MH2021PTC361234'}
            </span>
            <span className="corp-gstin-badge">
              GSTIN: {overview?.company?.gstin || '27AABCA1234A1Z5'}
            </span>
          </div>
          <h1>{overview?.company?.name || 'Acme Technologies India Pvt Ltd'}</h1>
          <p>
            Enterprise health benefits dashboard: manage employee rosters, track cashless hospitalizations,
            inspect Incurred Claim Ratios (ICR), and download digital e-Health cards.
          </p>
        </div>

        <div className="corp-actions-row">
          <button className="btn-corp-secondary" onClick={loadAll} title="Reload Data">
            <HiRefresh /> Refresh
          </button>
          <button className="btn-corp-accent" onClick={() => setShowBulkModal(true)}>
            <HiUpload /> Bulk Ingestion (CSV)
          </button>
          <button className="btn-corp-primary" onClick={() => setShowAddEmpModal(true)}>
            <HiPlus /> Enroll Employee
          </button>
        </div>
      </div>

      {/* ─── Executive KPI Cards ────────────────────────────── */}
      {overview && (
        <div className="corp-kpi-grid">
          <div className="corp-kpi-card" onClick={() => setActiveTab('census')}>
            <div className="corp-kpi-header">
              <span>Total Enrolled Lives</span>
              <HiUserGroup className="corp-kpi-icon blue" />
            </div>
            <div className="corp-kpi-val">{overview.headcount.totalEnrolledLives}</div>
            <div className="corp-kpi-sub">
              <span>{overview.headcount.activeEmployees} Employees</span> • <span>{overview.headcount.coveredDependents} Dependents</span>
            </div>
          </div>

          <div className="corp-kpi-card" onClick={() => setActiveTab('policies')}>
            <div className="corp-kpi-header">
              <span>Active Group Policies</span>
              <HiShieldCheck className="corp-kpi-icon green" />
            </div>
            <div className="corp-kpi-val">{overview.policies.length}</div>
            <div className="corp-kpi-sub">
              <span>GMC (Health) • GPA (Accident) • GTL (Life)</span>
            </div>
          </div>

          <div className="corp-kpi-card" onClick={() => setActiveTab('billing')}>
            <div className="corp-kpi-header">
              <span>Monthly Premium Outlay</span>
              <HiCurrencyDollar className="corp-kpi-icon amber" />
            </div>
            <div className="corp-kpi-val">₹{overview.premiums.monthlyOutlay.toLocaleString('en-IN')}</div>
            <div className="corp-kpi-sub">
              <span>₹{overview.premiums.monthlyPEPM}/employee PEPM</span>
            </div>
          </div>

          <div className="corp-kpi-card" onClick={() => setActiveTab('claims')}>
            <div className="corp-kpi-header">
              <span>Incurred Claim Ratio (ICR)</span>
              <HiHeart className="corp-kpi-icon purple" />
            </div>
            <div className="corp-kpi-val">{overview.claims.incurredClaimRatio}%</div>
            <div className="corp-kpi-sub">
              <span className={`status-tag-badge status-${overview.claims.icrStatus.toLowerCase()}`}>
                {overview.claims.icrStatus}
              </span>
              <span>₹{overview.claims.approvedAmount.toLocaleString('en-IN')} Settled</span>
            </div>
          </div>

          <div className="corp-kpi-card" onClick={() => setActiveTab('policies')}>
            <div className="corp-kpi-header">
              <span>Annual Covered Sum</span>
              <HiDocumentReport className="corp-kpi-icon cyan" />
            </div>
            <div className="corp-kpi-val">₹{(overview.premiums.totalSumInsured / 100000).toFixed(1)} Lakhs</div>
            <div className="corp-kpi-sub">
              <span>Tiered cover up to ₹10L/life</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Navigation Tabs ────────────────────────────────── */}
      <div className="corp-tabs-bar">
        <button
          className={`corp-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview & Utilization
        </button>
        <button
          className={`corp-tab-btn ${activeTab === 'census' ? 'active' : ''}`}
          onClick={() => setActiveTab('census')}
        >
          👥 Employee Census & Roster
        </button>
        <button
          className={`corp-tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          🛡️ Group Policies & Tiers
        </button>
        <button
          className={`corp-tab-btn ${activeTab === 'ecards' ? 'active' : ''}`}
          onClick={() => setActiveTab('ecards')}
        >
          💳 Digital Cashless e-Cards
        </button>
        <button
          className={`corp-tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
          onClick={() => setActiveTab('claims')}
        >
          🏥 Corporate Claims ({claims.length})
        </button>
        <button
          className={`corp-tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          🧾 PEPM Billing & Invoices
        </button>
      </div>

      {/* ────────────────────────────────────────────────────── */}
      {/* TAB 1: OVERVIEW & UTILIZATION                          */}
      {/* ────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && overview && (
        <div className="corp-tab-content">
          <div className="corp-overview-grid">
            {/* Department Workforce Distribution */}
            <div className="corp-card-widget">
              <h3>Workforce Distribution by Department</h3>
              <p className="widget-subtitle">Departmental breakdown of active employees enrolled in group insurance</p>
              <div className="dept-bars-list">
                {overview.demographics.departments.map((d, i) => (
                  <div key={i} className="dept-bar-item">
                    <div className="dept-bar-meta">
                      <span className="dept-name">{d.name}</span>
                      <span className="dept-count">{d.count} employees ({d.percentage}%)</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${d.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coverage Tier Breakdown */}
            <div className="corp-card-widget">
              <h3>Corporate Sum Insured Tiers</h3>
              <p className="widget-subtitle">Hierarchical coverage limits defined for organizational roles</p>
              <div className="tier-cards-grid">
                <div className="tier-card tier-executive-card">
                  <div className="tier-badge-label">Executive Tier</div>
                  <div className="tier-sum">₹10,00,000</div>
                  <div className="tier-meta">
                    <strong>{overview.demographics.tiers.EXECUTIVE}</strong> Leaders Covered
                  </div>
                  <p className="tier-desc">VPs, Directors & C-Suite. Zero copay, private AC room, maternity ₹1L.</p>
                </div>

                <div className="tier-card tier-senior-card">
                  <div className="tier-badge-label">Senior Tier</div>
                  <div className="tier-sum">₹5,00,000</div>
                  <div className="tier-meta">
                    <strong>{overview.demographics.tiers.SENIOR}</strong> Leads Covered
                  </div>
                  <p className="tier-desc">Principals, Managers & Senior Eng. Day 1 pre-existing cover, maternity ₹75k.</p>
                </div>

                <div className="tier-card tier-standard-card">
                  <div className="tier-badge-label">Standard Tier</div>
                  <div className="tier-sum">₹3,00,000</div>
                  <div className="tier-meta">
                    <strong>{overview.demographics.tiers.STANDARD}</strong> Associates Covered
                  </div>
                  <p className="tier-desc">All Core Workforce. 14,000+ cashless hospitals network.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Policies Summary */}
          <div className="corp-card-widget" style={{ marginTop: '1.5rem' }}>
            <div className="widget-header-row">
              <div>
                <h3>Enrolled Group Insurance Contracts</h3>
                <p className="widget-subtitle">Summary of active underwriting agreements negotiated for this organization</p>
              </div>
              <button className="btn-corp-secondary" onClick={() => setShowPolicyModal(true)}>
                <HiPlus /> Add Custom Contract
              </button>
            </div>
            <div className="policy-cards-grid">
              {overview.policies.map((p) => (
                <div key={p.id} className="corp-policy-summary-card">
                  <div className="corp-pol-header">
                    <span className="corp-pol-type">{p.policyType}</span>
                    <span className="corp-pol-num">{p.policyNumber}</span>
                  </div>
                  <h4>{p.title}</h4>
                  <div className="corp-pol-insurer">Underwritten by <strong>{p.insurerName}</strong></div>
                  <div className="corp-pol-metrics">
                    <div>
                      <span>Sum Insured</span>
                      <strong>₹{p.sumInsured.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span>PEPM Rate</span>
                      <strong>₹{p.pepm}/mo</strong>
                    </div>
                    <div>
                      <span>Cashless Network</span>
                      <strong>{p.cashlessHospitals > 0 ? `${p.cashlessHospitals.toLocaleString()} Hospitals` : 'N/A'}</strong>
                    </div>
                  </div>
                  <div className="corp-pol-perks">
                    {p.waitingPeriodWaived && <span className="perk-chip">✨ Day-1 Cover</span>}
                    {p.maternityCovered && <span className="perk-chip">👶 Maternity ₹75k</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────── */}
      {/* TAB 2: EMPLOYEE CENSUS & ROSTER                        */}
      {/* ────────────────────────────────────────────────────── */}
      {activeTab === 'census' && (
        <div className="corp-tab-content">
          <div className="corp-table-filter-bar">
            <div className="filter-input-wrap">
              <HiSearch className="filter-icon" />
              <input
                type="text"
                placeholder="Search by name, email, employee code, or role..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
              />
            </div>
            <select value={empDeptFilter} onChange={(e) => setEmpDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Design">Design</option>
              <option value="Quality Assurance">Quality Assurance</option>
              <option value="Sales & Growth">Sales & Growth</option>
              <option value="Finance">Finance</option>
            </select>
            <select value={empTierFilter} onChange={(e) => setEmpTierFilter(e.target.value)}>
              <option value="">All Tiers</option>
              <option value="EXECUTIVE">Executive Tier (₹10L)</option>
              <option value="SENIOR">Senior Tier (₹5L)</option>
              <option value="STANDARD">Standard Tier (₹3L)</option>
            </select>
          </div>

          <div className="corp-table-container">
            <table className="corp-data-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Full Name</th>
                  <th>Department & Role</th>
                  <th>Cover Tier</th>
                  <th>Coverage Limit</th>
                  <th>Dependents</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td><code>{emp.employeeCode}</code></td>
                    <td>
                      <div className="emp-name-cell">
                        <strong>{emp.fullName}</strong>
                        <span>{emp.workEmail}</span>
                      </div>
                    </td>
                    <td>
                      <div className="emp-dept-cell">
                        <strong>{emp.department}</strong>
                        <span>{emp.designation}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`tier-badge tier-${emp.tier.toLowerCase()}`}>{emp.tier}</span>
                    </td>
                    <td><strong>₹{emp.coverageAmount.toLocaleString('en-IN')}</strong></td>
                    <td>
                      <button
                        className="dependents-count-btn"
                        onClick={() => handleOpenAddDependent(emp)}
                        title="Manage Covered Dependents"
                      >
                        <HiUserGroup /> {emp.dependentsCount} covered
                      </button>
                    </td>
                    <td>
                      <span className={`status-pill-corp status-${emp.enrollmentStatus.toLowerCase()}`}>
                        {emp.enrollmentStatus}
                      </span>
                    </td>
                    <td>
                      <div className="table-action-btns">
                        <button
                          className="btn-action-sm view-ecard"
                          onClick={() => handleViewECard(emp.id)}
                          title="View Digital e-Health Card"
                        >
                          <HiCreditCard /> e-Card
                        </button>
                        <button
                          className="btn-action-sm toggle-status"
                          onClick={() => handleToggleEmpStatus(emp)}
                          title="Toggle Enrollment"
                        >
                          {emp.enrollmentStatus === 'ACTIVE' ? 'Opt Out' : 'Enroll'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-table-cell">
                      No employees match your query. Try adjusting filters or click <strong>Enroll Employee</strong>.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {employeePagination.totalPages > 1 && (
            <div className="corp-pagination-row">
              <span>Showing Page {employeePagination.page} of {employeePagination.totalPages} ({employeePagination.total} employees)</span>
              <div className="corp-pagination-btns">
                <button
                  disabled={employeePagination.page <= 1}
                  onClick={() => fetchEmployees(employeePagination.page - 1)}
                >
                  Previous
                </button>
                <button
                  disabled={employeePagination.page >= employeePagination.totalPages}
                  onClick={() => fetchEmployees(employeePagination.page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────── */}
      {/* TAB 3: GROUP POLICIES & TIERS                          */}
      {/* ────────────────────────────────────────────────────── */}
      {activeTab === 'policies' && (
        <div className="corp-tab-content">
          <div className="section-title-row">
            <div>
              <h3>Enterprise Group Insurance Contracts</h3>
              <p>Active underwriting master policies negotiated between Acme Technologies and insurer partners</p>
            </div>
            <button className="btn-corp-primary" onClick={() => setShowPolicyModal(true)}>
              <HiPlus /> Add Master Policy
            </button>
          </div>

          <div className="policies-cards-list">
            {policies.map((p) => (
              <div key={p.id} className="policy-master-card">
                <div className="policy-master-top">
                  <div>
                    <span className="policy-type-tag">{p.policyType}</span>
                    <span className="policy-number-tag">{p.policyNumber}</span>
                    <h3>{p.title}</h3>
                    <p className="insurer-subtitle">Underwriter: <strong>{p.insurerName}</strong></p>
                  </div>
                  <div className="policy-master-status">
                    <span className="status-active-badge"><HiCheckCircle /> Active Contract</span>
                  </div>
                </div>

                <div className="policy-perks-row">
                  <div className="policy-perk-stat">
                    <span>Sum Insured / Life</span>
                    <strong>₹{p.totalSumInsured.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="policy-perk-stat">
                    <span>Monthly Rate / Life</span>
                    <strong>₹{p.premiumPerEmployee} PEPM</strong>
                  </div>
                  <div className="policy-perk-stat">
                    <span>Cashless Hospitals</span>
                    <strong>{p.cashlessHospitals.toLocaleString()}</strong>
                  </div>
                  <div className="policy-perk-stat">
                    <span>Annual Outlay</span>
                    <strong>₹{p.annualPremium.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div className="policy-features-checklist">
                  <div className="feature-item">
                    <HiCheckCircle className="check-icon" />
                    <span>Waiting periods waived: Day-1 coverage for pre-existing diseases</span>
                  </div>
                  {p.maternityCovered && (
                    <div className="feature-item">
                      <HiCheckCircle className="check-icon" />
                      <span>Maternity expenses covered up to ₹75,000 (normal & C-section)</span>
                    </div>
                  )}
                  {p.preExistingCovered && (
                    <div className="feature-item">
                      <HiCheckCircle className="check-icon" />
                      <span>Zero room-rent cap & modern robotic surgeries included</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────── */}
      {/* TAB 4: DIGITAL CASHLESS E-CARDS                        */}
      {/* ────────────────────────────────────────────────────── */}
      {activeTab === 'ecards' && (
        <div className="corp-tab-content">
          <div className="section-title-row">
            <div>
              <h3>Digital Cashless e-Health Cards</h3>
              <p>Instant verifiable digital health insurance cards for enrolled employees and their dependents</p>
            </div>
          </div>

          <div className="ecard-selector-grid">
            {employees.map((emp) => (
              <div key={emp.id} className="ecard-tile" onClick={() => handleViewECard(emp.id)}>
                <div className="ecard-tile-header">
                  <HiCreditCard className="ecard-icon" />
                  <span className="ecard-num">{emp.ecardNumber}</span>
                </div>
                <h4>{emp.fullName}</h4>
                <div className="ecard-tile-sub">
                  <span>{emp.department}</span> • <span>Tier: {emp.tier}</span>
                </div>
                <div className="ecard-tile-footer">
                  <strong>₹{(emp.coverageAmount / 100000).toFixed(0)} Lakhs Cover</strong>
                  <span className="view-link">View Card ↗</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────── */}
      {/* TAB 5: CORPORATE CLAIMS RADAR                          */}
      {/* ────────────────────────────────────────────────────── */}
      {activeTab === 'claims' && (
        <div className="corp-tab-content">
          <div className="section-title-row">
            <div>
              <h3>Corporate Claims & Hospitalization Radar</h3>
              <p>Track employee hospitalization admissions, pre-authorization requests, and settlement turnaround</p>
            </div>
            <button className="btn-corp-primary" onClick={() => setShowClaimModal(true)}>
              <HiPlus /> Submit Hospitalization Claim
            </button>
          </div>

          <div className="corp-table-filter-bar">
            <select value={claimsStatusFilter} onChange={(e) => setClaimsStatusFilter(e.target.value)}>
              <option value="">All Claim Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="APPROVED">Approved</option>
              <option value="SETTLED">Settled</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="corp-table-container">
            <table className="corp-data-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Patient & Relation</th>
                  <th>Employee</th>
                  <th>Hospital & City</th>
                  <th>Ailment</th>
                  <th>Claimed Amount</th>
                  <th>Approved Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => (
                  <tr key={c.id}>
                    <td><code>{c.claimNumber}</code></td>
                    <td>
                      <div className="emp-name-cell">
                        <strong>{c.patientName}</strong>
                        <span className="rel-tag">{c.relationship}</span>
                      </div>
                    </td>
                    <td>
                      <div className="emp-dept-cell">
                        <strong>{c.employeeName}</strong>
                        <span>{c.employeeCode}</span>
                      </div>
                    </td>
                    <td>
                      <div className="emp-dept-cell">
                        <strong>{c.hospitalName}</strong>
                        <span>{c.city}</span>
                      </div>
                    </td>
                    <td>{c.ailment}</td>
                    <td><strong>₹{c.claimedAmount.toLocaleString('en-IN')}</strong></td>
                    <td>
                      {c.approvedAmount ? (
                        <strong className="text-green">₹{c.approvedAmount.toLocaleString('en-IN')}</strong>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill-corp status-${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {claims.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-table-cell">
                      No corporate claims filed under this organization yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────── */}
      {/* TAB 6: BILLING & INVOICES                              */}
      {/* ────────────────────────────────────────────────────── */}
      {activeTab === 'billing' && (
        <div className="corp-tab-content">
          <div className="section-title-row">
            <div>
              <h3>Monthly PEPM Billing & Invoicing History</h3>
              <p>Itemized per-employee-per-month statements with 18% GST tax breakdown and proof of payment</p>
            </div>
            <button className="btn-corp-primary" onClick={handleGenerateInvoice}>
              <HiPlus /> Generate Monthly Invoice
            </button>
          </div>

          <div className="corp-table-container">
            <table className="corp-data-table">
              <thead>
                <tr>
                  <th>Invoice Ref</th>
                  <th>Billing Period</th>
                  <th>Active Census</th>
                  <th>Base Premium</th>
                  <th>GST (18%)</th>
                  <th>Total Payable</th>
                  <th>Payment Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td><code>{inv.invoiceNumber}</code></td>
                    <td><strong>{inv.billingPeriod}</strong></td>
                    <td>{inv.activeEmployees} Enrolled Employees</td>
                    <td>₹{inv.basePremium.toLocaleString('en-IN')}</td>
                    <td>₹{inv.gstAmount.toLocaleString('en-IN')}</td>
                    <td><strong className="text-accent">₹{inv.totalAmount.toLocaleString('en-IN')}</strong></td>
                    <td>
                      <span className={`status-pill-corp status-${inv.status.toLowerCase()}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-action-sm view-ecard"
                        onClick={() => toast.success(`Downloaded official GST receipt for ${inv.invoiceNumber}`)}
                      >
                        <HiDownload /> Receipt
                      </button>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-table-cell">
                      No corporate invoices generated yet. Click <strong>Generate Monthly Invoice</strong> above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: ADD SINGLE EMPLOYEE ───────────────────── */}
      {showAddEmpModal && (
        <div className="modal-backdrop-blur">
          <div className="corp-modal-box">
            <div className="modal-header-corporate">
              <div className="modal-title-wrap">
                <HiPlus className="modal-header-icon" />
                <div>
                  <h3>Enroll New Employee</h3>
                  <p>Add a team member to the active corporate group health insurance census</p>
                </div>
              </div>
              <button className="modal-close-icon-btn" onClick={() => setShowAddEmpModal(false)}>
                <HiX />
              </button>
            </div>

            <form onSubmit={handleAddEmployee}>
              <div className="modal-body-corporate">
                <div className="form-grid-2">
                  <div className="form-group-corp">
                    <label>Employee ID / Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. EMP-109"
                      required
                      value={empForm.employeeCode}
                      onChange={(e) => setEmpForm({ ...empForm, employeeCode: e.target.value })}
                    />
                  </div>
                  <div className="form-group-corp">
                    <label>Full Legal Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Aditi Rao"
                      required
                      value={empForm.fullName}
                      onChange={(e) => setEmpForm({ ...empForm, fullName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-corp">
                    <label>Work Email Address *</label>
                    <input
                      type="email"
                      placeholder="aditi@acmetech.in"
                      required
                      value={empForm.workEmail}
                      onChange={(e) => setEmpForm({ ...empForm, workEmail: e.target.value })}
                    />
                  </div>
                  <div className="form-group-corp">
                    <label>Contact Phone</label>
                    <input
                      type="tel"
                      placeholder="+91 98200 11223"
                      value={empForm.phone}
                      onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-corp">
                    <label>Department</label>
                    <select
                      value={empForm.department}
                      onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Product">Product</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Design">Design</option>
                      <option value="Sales & Growth">Sales & Growth</option>
                      <option value="Quality Assurance">Quality Assurance</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>
                  <div className="form-group-corp">
                    <label>Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Frontend Engineer"
                      value={empForm.designation}
                      onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group-corp">
                  <label>Insurance Coverage Tier</label>
                  <select
                    value={empForm.tier}
                    onChange={(e) => setEmpForm({ ...empForm, tier: e.target.value })}
                  >
                    <option value="STANDARD">Standard Tier — ₹3,00,000 Sum Insured</option>
                    <option value="SENIOR">Senior Tier — ₹5,00,000 Sum Insured</option>
                    <option value="EXECUTIVE">Executive Tier — ₹10,00,000 Sum Insured</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer-corporate">
                <button type="button" className="btn-secondary" onClick={() => setShowAddEmpModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <HiCheckCircle /> Enroll in Group Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD DEPENDENT ─────────────────────────── */}
      {showAddDependentModal && selectedEmpForDependent && (
        <div className="modal-backdrop-blur">
          <div className="corp-modal-box">
            <div className="modal-header-corporate">
              <div className="modal-title-wrap">
                <HiUserGroup className="modal-header-icon" />
                <div>
                  <h3>Cover Dependent for {selectedEmpForDependent.fullName}</h3>
                  <p>Add spouse, child, or parent to this employee's group policy coverage</p>
                </div>
              </div>
              <button className="modal-close-icon-btn" onClick={() => setShowAddDependentModal(false)}>
                <HiX />
              </button>
            </div>

            <form onSubmit={handleAddDependent}>
              <div className="modal-body-corporate">
                {/* List of currently enrolled dependents */}
                {selectedEmpForDependent.dependents && selectedEmpForDependent.dependents.length > 0 && (
                  <div className="existing-dependents-list">
                    <strong>Currently Enrolled Dependents:</strong>
                    {selectedEmpForDependent.dependents.map((dep) => (
                      <div key={dep.id} className="dep-row-item">
                        <span>{dep.fullName} ({dep.relation})</span>
                        <button
                          type="button"
                          className="btn-remove-dep"
                          onClick={() => handleDeleteDependent(dep.id)}
                          title="Remove Dependent"
                        >
                          <HiTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-group-corp">
                  <label>Dependent Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kunal Sharma"
                    required
                    value={depForm.fullName}
                    onChange={(e) => setDepForm({ ...depForm, fullName: e.target.value })}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group-corp">
                    <label>Relationship *</label>
                    <select
                      value={depForm.relation}
                      onChange={(e) => setDepForm({ ...depForm, relation: e.target.value })}
                    >
                      <option value="SPOUSE">Spouse</option>
                      <option value="CHILD">Child</option>
                      <option value="PARENT">Parent</option>
                    </select>
                  </div>
                  <div className="form-group-corp">
                    <label>Gender</label>
                    <select
                      value={depForm.gender}
                      onChange={(e) => setDepForm({ ...depForm, gender: e.target.value })}
                    >
                      <option value="FEMALE">Female</option>
                      <option value="MALE">Male</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer-corporate">
                <button type="button" className="btn-secondary" onClick={() => setShowAddDependentModal(false)}>
                  Done
                </button>
                <button type="submit" className="btn-primary">
                  <HiCheckCircle /> Add to Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: DIGITAL E-CARD VIEWER ─────────────────── */}
      {showECardModal && selectedECardData && (
        <div className="modal-backdrop-blur">
          <div className="ecard-modal-box">
            <div className="ecard-modal-header">
              <h3>Official Digital Cashless e-Health Card</h3>
              <div className="ecard-header-btns">
                <button className="btn-print-card" onClick={() => window.print()}>
                  <HiPrinter /> Print Card
                </button>
                <button className="modal-close-icon-btn" onClick={() => setShowECardModal(false)}>
                  <HiX />
                </button>
              </div>
            </div>

            <div className="ecard-preview-surface">
              <div className="ecard-card-layout">
                {/* Front Side */}
                <div className="ecard-brand-bar">
                  <div className="ecard-logo-group">
                    <span className="ecard-logo-brand">PolicySphere</span>
                    <span className="ecard-badge-tpa">Corporate Cashless Health Pass</span>
                  </div>
                  <div className="ecard-insurer-tag">{selectedECardData.policy.insurerName}</div>
                </div>

                <div className="ecard-card-body">
                  <div className="ecard-id-row">
                    <div>
                      <span className="ecard-label">Card Number</span>
                      <strong className="ecard-id-code">{selectedECardData.cardId}</strong>
                    </div>
                    <div>
                      <span className="ecard-label">Policy Number</span>
                      <strong>{selectedECardData.policy.policyNumber}</strong>
                    </div>
                  </div>

                  <div className="ecard-emp-details">
                    <div>
                      <span className="ecard-label">Employee Name</span>
                      <strong className="ecard-emp-name">{selectedECardData.employee.name}</strong>
                      <span className="ecard-emp-sub">{selectedECardData.employee.designation} • {selectedECardData.employee.code}</span>
                    </div>
                    <div className="ecard-sum-tag">
                      <span className="ecard-label">Cover Limit</span>
                      <strong className="sum-val">₹{selectedECardData.employee.sumInsured.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  <div className="ecard-company-meta">
                    <span>Organization: <strong>{selectedECardData.company.name}</strong></span>
                    <span>Valid Across <strong>{selectedECardData.policy.cashlessHospitals.toLocaleString()}+ Cashless Hospitals</strong></span>
                  </div>

                  {selectedECardData.dependents && selectedECardData.dependents.length > 0 && (
                    <div className="ecard-dependents-bar">
                      <span className="ecard-label">Covered Family Members:</span>
                      <div className="dep-chips-wrap">
                        {selectedECardData.dependents.map((d, idx) => (
                          <span key={idx} className="dep-chip">
                            {d.name} ({d.relation})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="ecard-footer-contacts">
                    <div>
                      <span className="ecard-label">24x7 Cashless Hospital Desk</span>
                      <strong>{selectedECardData.support.tpaDesk}</strong>
                    </div>
                    <div className="qr-box-simulated">
                      <div className="qr-pattern">QR</div>
                      <span>Scan for Hospital Pre-Auth</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: SUBMIT HOSPITALIZATION CLAIM ──────────── */}
      {showClaimModal && (
        <div className="modal-backdrop-blur">
          <div className="corp-modal-box">
            <div className="modal-header-corporate">
              <div className="modal-title-wrap">
                <HiHeart className="modal-header-icon" />
                <div>
                  <h3>Submit Hospitalization Claim</h3>
                  <p>Initiate a cashless pre-authorization or reimbursement claim for an employee</p>
                </div>
              </div>
              <button className="modal-close-icon-btn" onClick={() => setShowClaimModal(false)}>
                <HiX />
              </button>
            </div>

            <form onSubmit={handleSubmitClaim}>
              <div className="modal-body-corporate">
                <div className="form-group-corp">
                  <label>Select Covered Employee *</label>
                  <select
                    required
                    value={claimForm.employeeId}
                    onChange={(e) => {
                      const emp = employees.find((emp) => emp.id === e.target.value);
                      setClaimForm({
                        ...claimForm,
                        employeeId: e.target.value,
                        patientName: emp ? emp.fullName : '',
                      });
                    }}
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} ({e.employeeCode}) — {e.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-corp">
                    <label>Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Patel"
                      value={claimForm.patientName}
                      onChange={(e) => setClaimForm({ ...claimForm, patientName: e.target.value })}
                    />
                  </div>
                  <div className="form-group-corp">
                    <label>Relationship *</label>
                    <select
                      value={claimForm.relationship}
                      onChange={(e) => setClaimForm({ ...claimForm, relationship: e.target.value })}
                    >
                      <option value="SELF">Self</option>
                      <option value="SPOUSE">Spouse</option>
                      <option value="CHILD">Child</option>
                      <option value="PARENT">Parent</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-corp">
                    <label>Hospital Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fortis Hospital, Mulund"
                      value={claimForm.hospitalName}
                      onChange={(e) => setClaimForm({ ...claimForm, hospitalName: e.target.value })}
                    />
                  </div>
                  <div className="form-group-corp">
                    <label>City *</label>
                    <input
                      type="text"
                      required
                      placeholder="Mumbai / Bengaluru"
                      value={claimForm.city}
                      onChange={(e) => setClaimForm({ ...claimForm, city: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-corp">
                    <label>Diagnosis / Treatment Type *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acute Appendectomy / Viral Fever"
                      value={claimForm.ailment}
                      onChange={(e) => setClaimForm({ ...claimForm, ailment: e.target.value })}
                    />
                  </div>
                  <div className="form-group-corp">
                    <label>Claim Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 75000"
                      value={claimForm.claimedAmount}
                      onChange={(e) => setClaimForm({ ...claimForm, claimedAmount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group-corp">
                  <label className="checkbox-label-corp">
                    <input
                      type="checkbox"
                      checked={claimForm.isCashless}
                      onChange={(e) => setClaimForm({ ...claimForm, isCashless: e.target.checked })}
                    />
                    <span>Cashless Pre-Authorization (Direct TPA Settlement)</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer-corporate">
                <button type="button" className="btn-secondary" onClick={() => setShowClaimModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <HiCheckCircle /> Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: CREATE MASTER POLICY ──────────────────── */}
      {showPolicyModal && (
        <div className="modal-backdrop-blur">
          <div className="corp-modal-box">
            <div className="modal-header-corporate">
              <div className="modal-title-wrap">
                <HiShieldCheck className="modal-header-icon" />
                <div>
                  <h3>Establish Group Insurance Contract</h3>
                  <p>Configure and attach a custom master policy for this enterprise</p>
                </div>
              </div>
              <button className="modal-close-icon-btn" onClick={() => setShowPolicyModal(false)}>
                <HiX />
              </button>
            </div>

            <form onSubmit={handleCreatePolicy}>
              <div className="modal-body-corporate">
                <div className="form-grid-2">
                  <div className="form-group-corp">
                    <label>Plan Type *</label>
                    <select
                      value={policyForm.policyType}
                      onChange={(e) => setPolicyForm({ ...policyForm, policyType: e.target.value })}
                    >
                      <option value="GMC">GMC — Group Medical Cover</option>
                      <option value="GPA">GPA — Group Personal Accident</option>
                      <option value="GTL">GTL — Group Term Life</option>
                    </select>
                  </div>
                  <div className="form-group-corp">
                    <label>Insurer Partner *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Star Health & Allied Insurance"
                      value={policyForm.insurerName}
                      onChange={(e) => setPolicyForm({ ...policyForm, insurerName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group-corp">
                  <label>Contract Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Executive Group Comprehensive Health Plan"
                    value={policyForm.title}
                    onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group-corp">
                    <label>Sum Insured / Life (₹) *</label>
                    <input
                      type="number"
                      required
                      value={policyForm.totalSumInsured}
                      onChange={(e) => setPolicyForm({ ...policyForm, totalSumInsured: e.target.value })}
                    />
                  </div>
                  <div className="form-group-corp">
                    <label>Monthly PEPM Rate (₹) *</label>
                    <input
                      type="number"
                      required
                      value={policyForm.premiumPerEmployee}
                      onChange={(e) => setPolicyForm({ ...policyForm, premiumPerEmployee: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer-corporate">
                <button type="button" className="btn-secondary" onClick={() => setShowPolicyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <HiCheckCircle /> Establish Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: BULK CSV INGESTION ────────────────────── */}
      <BulkUploadModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={() => {
          fetchEmployees(1);
          fetchOverview();
        }}
      />
    </div>
  );
}

export default CorporatePortalPage;
