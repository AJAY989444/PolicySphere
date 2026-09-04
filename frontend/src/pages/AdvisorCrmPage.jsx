import React, { useState, useEffect } from 'react';
import {
  HiPlus,
  HiSearch,
  HiFilter,
  HiPhone,
  HiMail,
  HiCurrencyRupee,
  HiUserGroup,
  HiCheckCircle,
  HiClock,
  HiBriefcase,
  HiSparkles,
  HiDocumentText,
  HiX,
  HiPaperAirplane,
} from 'react-icons/hi';
import api from '../services/api/axios';
import './AdvisorCrmPage.css';

const STAGES = [
  { key: 'NEW', label: 'New Inquiry', color: '#6366f1', bg: '#eef2ff' },
  { key: 'CONTACTED', label: 'Contacted', color: '#0284c7', bg: '#e0f2fe' },
  { key: 'QUOTE_SENT', label: 'Quote Sent', color: '#d97706', bg: '#fef3c7' },
  { key: 'PROPOSAL_IN_PROGRESS', label: 'Proposal Open', color: '#8b5cf6', bg: '#f3e8ff' },
  { key: 'CONVERTED', label: 'Converted', color: '#059669', bg: '#d1fae5' },
  { key: 'LOST', label: 'Lost / Closed', color: '#dc2626', bg: '#fee2e2' },
];

export default function AdvisorCrmPage() {
  const [leads, setLeads] = useState([]);
  const [commissions, setCommissions] = useState({
    totalEarned: 0,
    pendingAmount: 0,
    conversionRate: 0,
    totalLeads: 0,
    convertedLeads: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('kanban'); // kanban | commissions

  // Lead Details Drawer / Modal
  const [selectedLead, setSelectedLead] = useState(null);
  const [newActivity, setNewActivity] = useState({ type: 'NOTE', description: '' });
  const [stageUpdating, setStageUpdating] = useState(false);

  // New Lead Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'HEALTH',
    estimatedBudget: '40000',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [categoryFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leadsRes, commRes] = await Promise.all([
        api.get('/crm/leads', { params: { category: categoryFilter, search } }),
        api.get('/crm/commissions'),
      ]);
      setLeads(leadsRes.data.leads || []);
      setCommissions(commRes.data);
    } catch (err) {
      console.error('Error fetching CRM data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleStageChange = async (leadId, newStage) => {
    try {
      const res = await api.patch(`/crm/leads/${leadId}/stage`, { stage: newStage });
      setLeads((prev) => prev.map((l) => (l.id === leadId ? res.data.lead : l)));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(res.data.lead);
      }
      fetchData(); // Refresh metrics
    } catch (err) {
      console.error('Error updating stage:', err);
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!newActivity.description || !selectedLead) return;

    try {
      const res = await api.post(`/crm/leads/${selectedLead.id}/activities`, newActivity);
      const updatedActivities = [res.data.activity, ...(selectedLead.activities || [])];
      setSelectedLead({ ...selectedLead, activities: updatedActivities });
      setNewActivity({ type: 'NOTE', description: '' });
    } catch (err) {
      console.error('Error adding activity:', err);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/crm/leads', newLeadForm);
      setLeads([res.data.lead, ...leads]);
      setShowAddModal(false);
      setNewLeadForm({ name: '', email: '', phone: '', category: 'HEALTH', estimatedBudget: '40000', notes: '' });
      fetchData();
    } catch (err) {
      console.error('Error creating lead:', err);
    }
  };

  const formatCurrency = (amt) => {
    if (!amt) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
  };

  const filteredLeads = leads.filter((lead) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.phone.includes(q)
    );
  });

  return (
    <div className="advisor-crm-page animate-fade-in container">
      {/* Top Header & Metrics Banner */}
      <div className="crm-header-row">
        <div>
          <span className="crm-badge">
            <HiBriefcase /> Insurance Sales CRM & Pipeline
          </span>
          <h1>Advisor Sales Hub & Commissions</h1>
          <p>Manage customer leads, track pipeline conversions, log client calls, and view live commissions.</p>
        </div>
        <div className="crm-header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <HiPlus /> Add New Lead
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="crm-metrics-grid">
        <div className="crm-metric-card">
          <div className="metric-icon-box bg-primary-light">
            <HiCurrencyRupee size={24} />
          </div>
          <div>
            <span className="metric-lbl">Total Sales Commission</span>
            <h3 className="text-primary">{formatCurrency(commissions.totalEarned)}</h3>
          </div>
        </div>

        <div className="crm-metric-card">
          <div className="metric-icon-box bg-warning-light">
            <HiClock size={24} />
          </div>
          <div>
            <span className="metric-lbl">Pending Commission Payout</span>
            <h3 className="text-warning">{formatCurrency(commissions.pendingAmount)}</h3>
          </div>
        </div>

        <div className="crm-metric-card">
          <div className="metric-icon-box bg-success-light">
            <HiCheckCircle size={24} />
          </div>
          <div>
            <span className="metric-lbl">Sales Conversion Rate</span>
            <h3 className="text-success">{commissions.conversionRate}%</h3>
          </div>
        </div>

        <div className="crm-metric-card">
          <div className="metric-icon-box bg-info-light">
            <HiUserGroup size={24} />
          </div>
          <div>
            <span className="metric-lbl">Active Pipeline Leads</span>
            <h3>{leads.length} Leads</h3>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Filters */}
      <div className="crm-toolbar">
        <div className="crm-tabs">
          <button
            className={`crm-tab ${activeTab === 'kanban' ? 'active' : ''}`}
            onClick={() => setActiveTab('kanban')}
          >
            📊 Visual Pipeline Kanban
          </button>
          <button
            className={`crm-tab ${activeTab === 'commissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('commissions')}
          >
            💰 Commission Earnings Ledger
          </button>
        </div>

        {activeTab === 'kanban' && (
          <div className="crm-filters">
            <form onSubmit={handleSearchSubmit} className="search-box">
              <HiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search lead by name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>

            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="category-select">
              <option value="ALL">All Categories</option>
              <option value="HEALTH">Health</option>
              <option value="LIFE">Term Life</option>
              <option value="MOTOR">Motor & Auto</option>
              <option value="TRAVEL">Travel</option>
              <option value="HOME">Home</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: KANBAN PIPELINE */}
      {activeTab === 'kanban' && (
        <div className="kanban-board-container">
          {loading ? (
            <div className="crm-loading-state">
              <div className="spinner spinner-lg"></div>
              <p>Loading sales pipeline...</p>
            </div>
          ) : (
            <div className="kanban-grid">
              {STAGES.map((col) => {
                const stageLeads = filteredLeads.filter((l) => l.stage === col.key);
                return (
                  <div key={col.key} className="kanban-column">
                    <div className="column-header" style={{ borderTopColor: col.color }}>
                      <div className="col-title-group">
                        <span className="col-dot" style={{ backgroundColor: col.color }}></span>
                        <h4>{col.label}</h4>
                      </div>
                      <span className="col-count-badge" style={{ backgroundColor: col.bg, color: col.color }}>
                        {stageLeads.length}
                      </span>
                    </div>

                    <div className="column-cards">
                      {stageLeads.length === 0 ? (
                        <div className="empty-column-placeholder">No leads in stage</div>
                      ) : (
                        stageLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className="lead-kanban-card"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <div className="card-top-row">
                              <span className="lead-cat-badge">{lead.category}</span>
                              <span className="lead-est-budget">{formatCurrency(lead.estimatedBudget)}/yr</span>
                            </div>
                            <h4 className="lead-name">{lead.name}</h4>
                            <div className="lead-contact-info">
                              <span><HiMail /> {lead.email}</span>
                              <span><HiPhone /> {lead.phone}</span>
                            </div>

                            {lead.notes && <p className="lead-snippet">{lead.notes}</p>}

                            <div className="card-bottom-actions" onClick={(e) => e.stopPropagation()}>
                              <select
                                className="stage-quick-select"
                                value={lead.stage}
                                onChange={(e) => handleStageChange(lead.id, e.target.value)}
                              >
                                {STAGES.map((s) => (
                                  <option key={s.key} value={s.key}>
                                    Move to: {s.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMMISSIONS TABLE */}
      {activeTab === 'commissions' && (
        <div className="commissions-table-card card">
          <h3>Advisor Commission Payout Ledger</h3>
          <p className="subtitle">Real-time breakdown of earned commissions from converted customer policies.</p>

          {(!commissions.commissions || commissions.commissions.length === 0) ? (
            <div className="empty-state">No commissions recorded yet. Convert leads to start earning commissions!</div>
          ) : (
            <table className="commissions-table">
              <thead>
                <tr>
                  <th>Policy Description</th>
                  <th>Customer Premium locked</th>
                  <th>Commission Rate</th>
                  <th>Earned Amount</th>
                  <th>Status</th>
                  <th>Date Earned</th>
                </tr>
              </thead>
              <tbody>
                {commissions.commissions.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.policyName}</strong></td>
                    <td>{formatCurrency(item.premiumAmount)}</td>
                    <td>{(item.commissionRate * 100).toFixed(0)}%</td>
                    <td className="text-primary font-bold">{formatCurrency(item.commissionAmount)}</td>
                    <td>
                      <span className={`badge ${item.status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{new Date(item.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* LEAD DETAIL & ACTIVITY LOG DRAWER / MODAL */}
      {selectedLead && (
        <div className="modal-backdrop animate-fade-in">
          <div className="lead-drawer-modal animate-fade-in-up">
            <div className="drawer-header">
              <div>
                <span className="lead-cat-badge">{selectedLead.category}</span>
                <h2>{selectedLead.name}</h2>
                <span className="lead-sub text-muted">ID: {selectedLead.id}</span>
              </div>
              <button className="close-btn" onClick={() => setSelectedLead(null)}>
                <HiX />
              </button>
            </div>

            <div className="drawer-body-grid">
              {/* Left Column: Lead Info */}
              <div className="drawer-lead-info">
                <h4>Lead Details & Contact</h4>
                <div className="info-item">
                  <span className="info-lbl">Email:</span>
                  <strong>{selectedLead.email}</strong>
                </div>
                <div className="info-item">
                  <span className="info-lbl">Phone:</span>
                  <strong>{selectedLead.phone}</strong>
                </div>
                <div className="info-item">
                  <span className="info-lbl">Estimated Budget:</span>
                  <strong>{formatCurrency(selectedLead.estimatedBudget)}/yr</strong>
                </div>
                <div className="info-item">
                  <span className="info-lbl">Current Stage:</span>
                  <select
                    className="form-select"
                    value={selectedLead.stage}
                    onChange={(e) => handleStageChange(selectedLead.id, e.target.value)}
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="notes-box">
                  <span className="info-lbl">Initial Customer Inquiry Notes:</span>
                  <p>{selectedLead.notes || 'No customer notes specified.'}</p>
                </div>
              </div>

              {/* Right Column: Interaction Activity Timeline */}
              <div className="drawer-activities">
                <h4>Interaction Timeline & Call Notes</h4>

                {/* Add New Activity Form */}
                <form onSubmit={handleAddActivity} className="add-activity-form">
                  <div className="activity-input-row">
                    <select
                      value={newActivity.type}
                      onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
                      className="form-select"
                    >
                      <option value="NOTE">📝 Note</option>
                      <option value="CALL">📞 Call Log</option>
                      <option value="EMAIL">✉️ Email</option>
                      <option value="MEETING">🤝 Meeting</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Add call outcome or meeting notes..."
                      value={newActivity.description}
                      onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                      required
                    />
                    <button type="submit" className="btn btn-primary btn-sm">
                      <HiPaperAirplane /> Log
                    </button>
                  </div>
                </form>

                {/* Activity List */}
                <div className="activities-timeline">
                  {(!selectedLead.activities || selectedLead.activities.length === 0) ? (
                    <div className="empty-activities">No recorded activities yet. Use the input above to log notes!</div>
                  ) : (
                    selectedLead.activities.map((act) => (
                      <div key={act.id} className="activity-item">
                        <div className="activity-type-badge">{act.type}</div>
                        <div className="activity-content">
                          <p>{act.description}</p>
                          <span className="activity-time">
                            {new Date(act.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW LEAD MODAL */}
      {showAddModal && (
        <div className="modal-backdrop animate-fade-in">
          <div className="add-lead-modal animate-fade-in-up">
            <div className="modal-header">
              <h2>Add New Customer Lead</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <HiX />
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="add-lead-form">
              <div className="form-group">
                <label>Customer Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amit Kumar"
                  value={newLeadForm.name}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="amit@example.com"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 12345"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Target Category</label>
                  <select
                    value={newLeadForm.category}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, category: e.target.value })}
                  >
                    <option value="HEALTH">Health Insurance</option>
                    <option value="LIFE">Term Life Insurance</option>
                    <option value="MOTOR">Motor & Auto</option>
                    <option value="TRAVEL">Travel Insurance</option>
                    <option value="HOME">Home Insurance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Annual Premium (₹)</label>
                  <input
                    type="number"
                    placeholder="40000"
                    value={newLeadForm.estimatedBudget}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, estimatedBudget: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Initial Call Notes & Requirements</label>
                <textarea
                  rows="3"
                  placeholder="Specify customer requirements, existing coverage..."
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Add to Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
