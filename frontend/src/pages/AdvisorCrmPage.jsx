import React, { useState, useEffect, useRef } from 'react';
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
  HiCalendar,
  HiTrendingUp,
  HiDownload,
  HiRefresh,
  HiTag,
  HiChatAlt2,
  HiVideoCamera,
  HiExclamationCircle,
  HiArrowRight,
  HiCheck,
} from 'react-icons/hi';
import api from '../services/api/axios';
import toast from 'react-hot-toast';
import './AdvisorCrmPage.css';

const STAGES = [
  { key: 'NEW', label: 'New Inquiry', color: '#6366f1', bg: '#eef2ff' },
  { key: 'CONTACTED', label: 'Contacted', color: '#0284c7', bg: '#e0f2fe' },
  { key: 'QUOTE_SENT', label: 'Quote Sent', color: '#d97706', bg: '#fef3c7' },
  { key: 'PROPOSAL_IN_PROGRESS', label: 'Proposal Open', color: '#8b5cf6', bg: '#f3e8ff' },
  { key: 'CONVERTED', label: 'Converted', color: '#059669', bg: '#d1fae5' },
  { key: 'LOST', label: 'Lost / Closed', color: '#dc2626', bg: '#fee2e2' },
];

const CATEGORIES = [
  { key: 'ALL', label: 'All Categories' },
  { key: 'HEALTH', label: 'Health' },
  { key: 'LIFE', label: 'Life' },
  { key: 'MOTOR', label: 'Motor' },
  { key: 'TRAVEL', label: 'Travel' },
  { key: 'HOME', label: 'Home' },
];

const PRIORITIES = [
  { key: 'ALL', label: 'All Priorities' },
  { key: 'HOT', label: '🔥 Hot' },
  { key: 'WARM', label: '⚡ Warm' },
  { key: 'COLD', label: '❄️ Cold' },
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
  const [dueFollowUps, setDueFollowUps] = useState({
    overdue: [],
    dueToday: [],
    upcoming: [],
    overdueCount: 0,
    dueTodayCount: 0,
  });
  const [conversionReports, setConversionReports] = useState(null);
  const [advisorsList, setAdvisorsList] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban', 'table', 'followups', 'reports', 'commissions'

  // Lead Details 360 Drawer
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadDetailTab, setLeadDetailTab] = useState('timeline'); // 'timeline', 'followups', 'calls', 'meetings', 'emails', 'notes'
  const [newNoteText, setNewNoteText] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);

  // Modal Form States
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'HEALTH',
    estimatedBudget: '40000',
    priority: 'WARM',
    source: 'MANUAL',
    sentiment: 'INTERESTED',
    notes: '',
  });

  // Call Dialer Simulator State
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callOutcome, setCallOutcome] = useState('CONNECTED');
  const [callNotes, setCallNotes] = useState('');
  const callTimerRef = useRef(null);

  // Meeting Form State
  const [meetingForm, setMeetingForm] = useState({
    title: 'Consultation & Proposal Review',
    scheduledAt: '',
    durationMinutes: 30,
    agenda: 'Review customized quote options, deductibles, and hospital networks.',
  });

  // Email Form State
  const [emailForm, setEmailForm] = useState({
    templateKey: 'QUOTE_FOLLOWUP',
    customSubject: '',
    customBody: '',
  });

  // Follow-up Form State
  const [followUpForm, setFollowUpForm] = useState({
    title: 'Review proposal decision',
    scheduledAt: '',
    priority: 'HIGH',
    notes: '',
  });

  // Reassign Form State
  const [reassignForm, setReassignForm] = useState({
    newAdvisorId: '',
    reason: 'Client requested category specialist',
  });

  useEffect(() => {
    fetchData();
    fetchDueFollowUps();
    fetchEmailTemplates();
  }, [categoryFilter, priorityFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (search) params.search = search;

      const [leadsRes, commRes] = await Promise.all([
        api.get('/crm/leads', { params }),
        api.get('/crm/commissions'),
      ]);
      setLeads(leadsRes.data.leads || []);
      setCommissions(commRes.data);
    } catch (err) {
      console.error('Error fetching CRM data:', err);
      toast.error('Failed to load CRM data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDueFollowUps = async () => {
    try {
      const res = await api.get('/crm/followups/due');
      setDueFollowUps(res.data);
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
    }
  };

  const fetchEmailTemplates = async () => {
    try {
      const res = await api.get('/crm/emails/templates');
      setEmailTemplates(res.data.templates || []);
      if (res.data.templates?.length > 0) {
        setEmailForm((prev) => ({ ...prev, templateKey: res.data.templates[0].key }));
      }
    } catch (err) {
      console.error('Error loading email templates:', err);
    }
  };

  const fetchConversionReports = async () => {
    try {
      const res = await api.get('/crm/reports/conversion');
      setConversionReports(res.data);
      if (res.data.leaderboard) {
        setAdvisorsList(res.data.leaderboard);
      }
    } catch (err) {
      console.error('Error loading conversion reports:', err);
      toast.error('Failed to generate conversion analytics');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  // Open single lead details
  const handleOpenLead = async (leadId) => {
    try {
      const res = await api.get(`/crm/leads/${leadId}`);
      setSelectedLead(res.data.lead);
      setLeadDetailTab('timeline');
    } catch (err) {
      console.error('Error opening lead:', err);
      toast.error('Failed to open lead details');
    }
  };

  // Stage Progression
  const handleStageChange = async (leadId, newStage) => {
    try {
      const res = await api.patch(`/crm/leads/${leadId}/stage`, { stage: newStage });
      setLeads((prev) => prev.map((l) => (l.id === leadId ? res.data.lead : l)));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead(res.data.lead);
      }
      toast.success(`Lead moved to ${newStage.replace('_', ' ')}`);
      fetchData();
    } catch (err) {
      console.error('Error updating stage:', err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to update stage');
    }
  };

  // Add Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedLead) return;

    try {
      await api.post(`/crm/leads/${selectedLead.id}/activities`, {
        type: 'NOTE',
        description: newNoteText.trim(),
      });
      toast.success('Note logged to activity timeline');
      setNewNoteText('');
      handleOpenLead(selectedLead.id);
    } catch (err) {
      console.error('Error adding note:', err);
      toast.error('Failed to save note');
    }
  };

  // Update Sentiment or Priority
  const handleUpdateMetadata = async (field, value) => {
    if (!selectedLead) return;
    try {
      const res = await api.patch(`/crm/leads/${selectedLead.id}/metadata`, {
        [field]: value,
      });
      setSelectedLead(res.data.lead);
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? res.data.lead : l)));
      toast.success(`Updated ${field}`);
    } catch (err) {
      toast.error(`Failed to update ${field}`);
    }
  };

  // Create Lead
  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/crm/leads', newLeadForm);
      setLeads([res.data.lead, ...leads]);
      setShowAddModal(false);
      setNewLeadForm({
        name: '',
        email: '',
        phone: '',
        category: 'HEALTH',
        estimatedBudget: '40000',
        priority: 'WARM',
        source: 'MANUAL',
        sentiment: 'INTERESTED',
        notes: '',
      });
      toast.success('New lead added to pipeline!');
      fetchData();
    } catch (err) {
      toast.error('Failed to create lead');
    }
  };

  // Reassign Lead
  const handleReassignLead = async (e) => {
    e.preventDefault();
    if (!selectedLead || !reassignForm.newAdvisorId) return;

    try {
      const res = await api.patch(`/crm/leads/${selectedLead.id}/reassign`, {
        newAdvisorId: reassignForm.newAdvisorId,
        reason: reassignForm.reason,
      });
      setSelectedLead(res.data.lead);
      setShowReassignModal(false);
      toast.success('Lead reassigned successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reassign lead');
    }
  };

  // Follow-up Actions
  const handleScheduleFollowUp = async (e) => {
    e.preventDefault();
    if (!selectedLead || !followUpForm.scheduledAt) return;

    try {
      await api.post(`/crm/leads/${selectedLead.id}/followups`, followUpForm);
      toast.success('Follow-up scheduled');
      setShowFollowUpModal(false);
      setFollowUpForm({
        title: 'Review proposal decision',
        scheduledAt: '',
        priority: 'HIGH',
        notes: '',
      });
      handleOpenLead(selectedLead.id);
      fetchDueFollowUps();
    } catch (err) {
      toast.error('Failed to schedule follow-up');
    }
  };

  const handleCompleteFollowUp = async (followUpId) => {
    try {
      await api.patch(`/crm/followups/${followUpId}`, {
        status: 'COMPLETED',
        notes: 'Follow-up marked done by advisor',
      });
      toast.success('Follow-up marked completed!');
      fetchDueFollowUps();
      if (selectedLead) handleOpenLead(selectedLead.id);
    } catch (err) {
      toast.error('Failed to update follow-up');
    }
  };

  // Call Dialer Actions
  const handleStartCall = () => {
    setIsCalling(true);
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const handleEndCall = async () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setIsCalling(false);

    try {
      await api.post(`/crm/leads/${selectedLead.id}/calls`, {
        durationSeconds: callDuration,
        outcome: callOutcome,
        notes: callNotes,
      });
      toast.success(`Call logged (${Math.floor(callDuration / 60)}m ${callDuration % 60}s)`);
      setShowCallModal(false);
      setCallNotes('');
      setCallDuration(0);
      handleOpenLead(selectedLead.id);
    } catch (err) {
      toast.error('Failed to log call');
    }
  };

  // Meeting Schedule Action
  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    if (!selectedLead || !meetingForm.scheduledAt) return;

    try {
      await api.post(`/crm/leads/${selectedLead.id}/meetings`, meetingForm);
      toast.success('Video consultation meeting scheduled!');
      setShowMeetingModal(false);
      setMeetingForm({
        title: 'Consultation & Proposal Review',
        scheduledAt: '',
        durationMinutes: 30,
        agenda: 'Review customized quote options, deductibles, and hospital networks.',
      });
      handleOpenLead(selectedLead.id);
    } catch (err) {
      toast.error('Failed to schedule meeting');
    }
  };

  // Send Email Action
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      await api.post(`/crm/leads/${selectedLead.id}/emails`, {
        templateKey: emailForm.templateKey,
        customSubject: emailForm.customSubject || undefined,
        customBody: emailForm.customBody || undefined,
      });
      toast.success('Email dispatched to customer!');
      setShowEmailModal(false);
      handleOpenLead(selectedLead.id);
    } catch (err) {
      toast.error('Failed to send email');
    }
  };

  // CSV Export Action
  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
    if (priorityFilter !== 'ALL') params.set('priority', priorityFilter);
    window.open(`${api.defaults.baseURL}/crm/reports/export-csv?${params.toString()}`, '_blank');
  };

  const formatCurrency = (amt) => {
    if (!amt) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amt);
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
      {/* Header */}
      <div className="crm-header-row">
        <div>
          <span className="crm-badge">
            <HiBriefcase /> Insurance Sales CRM & Pipeline
          </span>
          <h1>Advisor Sales Workspace</h1>
          <p>
            Track prospects, auto-score leads, schedule follow-ups, and convert quotes into active policies.
          </p>
        </div>
        <div className="crm-header-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExportCSV}
            title="Export leads to CSV spreadsheet"
          >
            <HiDownload /> Export CSV
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <HiPlus /> New Lead
          </button>
        </div>
      </div>

      {/* Due Follow-ups Alert Banner */}
      {(dueFollowUps.dueTodayCount > 0 || dueFollowUps.overdueCount > 0) && (
        <div className="crm-followup-banner">
          <div className="banner-left">
            <HiClock className="banner-icon" />
            <div>
              <strong>Action Required: </strong>
              {dueFollowUps.dueTodayCount > 0 && (
                <span>
                  <strong>{dueFollowUps.dueTodayCount}</strong> follow-up{dueFollowUps.dueTodayCount > 1 ? 's' : ''} scheduled for today.{' '}
                </span>
              )}
              {dueFollowUps.overdueCount > 0 && (
                <span className="overdue-tag">
                  ⚠️ <strong>{dueFollowUps.overdueCount}</strong> overdue!
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-white"
            onClick={() => setActiveTab('followups')}
          >
            View Follow-ups Queue
          </button>
        </div>
      )}

      {/* Performance Metric Cards */}
      <div className="crm-metrics-grid">
        <div className="crm-metric-card">
          <div className="crm-metric-icon" style={{ background: '#eef2ff', color: '#6366f1' }}>
            <HiCurrencyRupee />
          </div>
          <div>
            <span className="crm-metric-label">Total Commission</span>
            <h3>{formatCurrency(commissions.totalEarned)}</h3>
            <span className="crm-metric-sub">{commissions.convertedLeads || 0} policies issued</span>
          </div>
        </div>

        <div className="crm-metric-card">
          <div className="crm-metric-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <HiClock />
          </div>
          <div>
            <span className="crm-metric-label">Pending Payout</span>
            <h3>{formatCurrency(commissions.pendingAmount)}</h3>
            <span className="crm-metric-sub">Approval in progress</span>
          </div>
        </div>

        <div className="crm-metric-card">
          <div className="crm-metric-icon" style={{ background: '#d1fae5', color: '#059669' }}>
            <HiTrendingUp />
          </div>
          <div>
            <span className="crm-metric-label">Conversion Rate</span>
            <h3>{commissions.conversionRate}%</h3>
            <span className="crm-metric-sub">Lead-to-policy ratio</span>
          </div>
        </div>

        <div className="crm-metric-card">
          <div className="crm-metric-icon" style={{ background: '#f3e8ff', color: '#8b5cf6' }}>
            <HiUserGroup />
          </div>
          <div>
            <span className="crm-metric-label">Total Pipeline</span>
            <h3>{commissions.totalLeads}</h3>
            <span className="crm-metric-sub">Active prospects</span>
          </div>
        </div>
      </div>

      {/* Navigation Toolbar */}
      <div className="crm-toolbar">
        <div className="crm-tabs">
          <button
            type="button"
            className={`crm-tab ${activeTab === 'kanban' ? 'active' : ''}`}
            onClick={() => setActiveTab('kanban')}
          >
            📋 Kanban Pipeline
          </button>
          <button
            type="button"
            className={`crm-tab ${activeTab === 'table' ? 'active' : ''}`}
            onClick={() => setActiveTab('table')}
          >
            📑 All Leads Table
          </button>
          <button
            type="button"
            className={`crm-tab ${activeTab === 'followups' ? 'active' : ''}`}
            onClick={() => setActiveTab('followups')}
          >
            ⏰ Follow-ups ({dueFollowUps.dueTodayCount + dueFollowUps.overdueCount})
          </button>
          <button
            type="button"
            className={`crm-tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('reports');
              fetchConversionReports();
            }}
          >
            📊 Conversion Reports
          </button>
          <button
            type="button"
            className={`crm-tab ${activeTab === 'commissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('commissions')}
          >
            💰 Commission History
          </button>
        </div>

        {/* Filters */}
        <div className="crm-filters">
          <form onSubmit={handleSearchSubmit} className="crm-search-form">
            <HiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input form-input-sm"
            />
          </form>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-input form-input-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="form-input form-input-sm"
          >
            {PRIORITIES.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="crm-loading-state">
          <div className="spinner" />
          <p>Syncing sales pipeline...</p>
        </div>
      ) : activeTab === 'kanban' ? (
        /* KANBAN BOARD */
        <div className="crm-kanban-board">
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stage.key);
            const totalStageBudget = stageLeads.reduce((sum, l) => sum + (l.estimatedBudget || 0), 0);

            return (
              <div key={stage.key} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="stage-title-wrap">
                    <span className="stage-dot" style={{ backgroundColor: stage.color }} />
                    <span className="stage-title">{stage.label}</span>
                    <span className="stage-count">{stageLeads.length}</span>
                  </div>
                  <span className="stage-budget">{formatCurrency(totalStageBudget)}</span>
                </div>

                <div className="kanban-cards-container">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="kanban-lead-card"
                      onClick={() => handleOpenLead(lead.id)}
                    >
                      {/* Priority & Score Header */}
                      <div className="card-top-tags">
                        <span className={`priority-tag priority-${lead.priority.toLowerCase()}`}>
                          {lead.priority === 'HOT' ? '🔥 HOT' : lead.priority === 'WARM' ? '⚡ WARM' : '❄️ COLD'}
                        </span>
                        <span className="score-badge" title="Dynamic Lead Qualification Score">
                          Score: {lead.leadScore || 50}
                        </span>
                      </div>

                      <h4 className="lead-name">{lead.name}</h4>
                      <span className="lead-category-chip">{lead.category} Insurance</span>

                      <div className="lead-contact-info">
                        <span>📞 {lead.phone}</span>
                        <span>✉️ {lead.email}</span>
                      </div>

                      {lead.estimatedBudget && (
                        <div className="lead-budget-row">
                          <span className="budget-label">Est. Budget:</span>
                          <span className="budget-val">{formatCurrency(lead.estimatedBudget)}</span>
                        </div>
                      )}

                      {/* Source & Sentiment */}
                      <div className="card-footer-tags">
                        <span className="source-tag">{lead.source}</span>
                        {lead.sentiment && (
                          <span className="sentiment-tag">{lead.sentiment.replace('_', ' ')}</span>
                        )}
                      </div>

                      {/* Quick Stage Progression */}
                      <div
                        className="card-quick-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={lead.stage}
                          onChange={(e) => handleStageChange(lead.id, e.target.value)}
                          className="stage-selector-mini"
                        >
                          {STAGES.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className="kanban-empty-column">No prospects</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : activeTab === 'table' ? (
        /* TABLE VIEW */
        <div className="crm-table-container">
          <table className="crm-data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Score</th>
                <th>Stage</th>
                <th>Budget</th>
                <th>Sentiment</th>
                <th>Source</th>
                <th>Advisor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} onClick={() => handleOpenLead(lead.id)}>
                  <td>
                    <strong>{lead.name}</strong>
                    <div className="sub-contact">{lead.phone}</div>
                  </td>
                  <td><span className="badge badge-primary">{lead.category}</span></td>
                  <td>
                    <span className={`priority-tag priority-${lead.priority.toLowerCase()}`}>
                      {lead.priority}
                    </span>
                  </td>
                  <td><strong>{lead.leadScore}/100</strong></td>
                  <td>
                    <span
                      className="stage-pill"
                      style={{
                        backgroundColor: STAGES.find((s) => s.key === lead.stage)?.bg,
                        color: STAGES.find((s) => s.key === lead.stage)?.color,
                      }}
                    >
                      {lead.stage}
                    </span>
                  </td>
                  <td>{formatCurrency(lead.estimatedBudget)}</td>
                  <td>{lead.sentiment || 'INTERESTED'}</td>
                  <td>{lead.source}</td>
                  <td>{lead.advisor ? `${lead.advisor.firstName} ${lead.advisor.lastName}` : 'Unassigned'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenLead(lead.id);
                      }}
                    >
                      View 360°
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'followups' ? (
        /* FOLLOW-UPS QUEUE */
        <div className="crm-followups-view">
          <h3>Scheduled Customer Follow-ups</h3>
          <p className="section-desc">
            Keep track of callbacks, proposal discussions, and closing reminders.
          </p>

          <div className="followup-sections-grid">
            {/* Today's Due */}
            <div className="followup-card-block">
              <h4 className="block-title text-amber-600">
                <HiClock /> Due Today ({dueFollowUps.dueToday.length})
              </h4>
              {dueFollowUps.dueToday.map((f) => (
                <div key={f.id} className="followup-item-card">
                  <div className="item-header">
                    <span className="item-title">{f.title}</span>
                    <span className={`priority-tag priority-${f.priority.toLowerCase()}`}>{f.priority}</span>
                  </div>
                  <div className="item-lead">
                    Prospect: <strong>{f.lead?.name}</strong> ({f.lead?.phone})
                  </div>
                  <div className="item-time">
                    ⏰ {new Date(f.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {f.notes && <p className="item-notes">"{f.notes}"</p>}
                  <div className="item-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={() => handleCompleteFollowUp(f.id)}
                    >
                      <HiCheck /> Mark Done
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleOpenLead(f.leadId)}
                    >
                      Open Lead
                    </button>
                  </div>
                </div>
              ))}
              {dueFollowUps.dueToday.length === 0 && <p className="empty-sub">No follow-ups due today!</p>}
            </div>

            {/* Overdue */}
            <div className="followup-card-block">
              <h4 className="block-title text-rose-600">
                <HiExclamationCircle /> Overdue ({dueFollowUps.overdue.length})
              </h4>
              {dueFollowUps.overdue.map((f) => (
                <div key={f.id} className="followup-item-card overdue">
                  <div className="item-header">
                    <span className="item-title">{f.title}</span>
                    <span className="priority-tag priority-hot">{f.priority}</span>
                  </div>
                  <div className="item-lead">
                    Prospect: <strong>{f.lead?.name}</strong> ({f.lead?.phone})
                  </div>
                  <div className="item-time text-rose-600">
                    Was due on {new Date(f.scheduledAt).toLocaleDateString()}
                  </div>
                  <div className="item-actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={() => handleCompleteFollowUp(f.id)}
                    >
                      <HiCheck /> Mark Done
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleOpenLead(f.leadId)}
                    >
                      Open Lead
                    </button>
                  </div>
                </div>
              ))}
              {dueFollowUps.overdue.length === 0 && <p className="empty-sub">Zero overdue follow-ups!</p>}
            </div>

            {/* Upcoming */}
            <div className="followup-card-block">
              <h4 className="block-title text-indigo-600">
                <HiCalendar /> Upcoming ({dueFollowUps.upcoming.length})
              </h4>
              {dueFollowUps.upcoming.map((f) => (
                <div key={f.id} className="followup-item-card">
                  <div className="item-header">
                    <span className="item-title">{f.title}</span>
                    <span className="item-time">
                      {new Date(f.scheduledAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="item-lead">
                    Prospect: <strong>{f.lead?.name}</strong>
                  </div>
                </div>
              ))}
              {dueFollowUps.upcoming.length === 0 && <p className="empty-sub">No upcoming follow-ups scheduled.</p>}
            </div>
          </div>
        </div>
      ) : activeTab === 'reports' ? (
        /* CONVERSION REPORTS & SALES ANALYTICS */
        <div className="crm-reports-view">
          <div className="reports-top-row">
            <div>
              <h3>Conversion Funnel & Sales Performance</h3>
              <p>Real-time analytics on deal stages, sales velocity, and lead attribution ROI.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleExportCSV}
            >
              <HiDownload /> Export Full Report (.CSV)
            </button>
          </div>

          {conversionReports && (
            <>
              {/* Funnel Visualization */}
              <div className="funnel-container-card">
                <h4>Sales Stage Conversion Funnel</h4>
                <div className="funnel-bars-wrap">
                  {conversionReports.funnel?.stages.map((stage, i) => (
                    <div key={stage.stage} className="funnel-step">
                      <div className="step-label-row">
                        <span className="step-name">{stage.stage.replace('_', ' ')}</span>
                        <span className="step-count"><strong>{stage.count}</strong> prospects</span>
                      </div>
                      <div className="funnel-progress-bg">
                        <div
                          className="funnel-progress-bar"
                          style={{
                            width: `${Math.max(8, stage.percentage)}%`,
                            backgroundColor: STAGES.find((s) => s.key === stage.stage)?.color || '#6366f1',
                          }}
                        >
                          {stage.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* KPIs Grid */}
              <div className="reports-kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-title">Average Sales Cycle</span>
                  <h2>{conversionReports.avgCycleDays} Days</h2>
                  <span className="kpi-sub">From initial inquiry to issuance</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-title">Total Pipeline Value</span>
                  <h2>{formatCurrency(conversionReports.totalPipelineValue)}</h2>
                  <span className="kpi-sub">Across all active stages</span>
                </div>
                <div className="kpi-card">
                  <span className="kpi-title">Won Policy Revenue</span>
                  <h2>{formatCurrency(conversionReports.totalWonRevenue)}</h2>
                  <span className="kpi-sub">Converted premium collected</span>
                </div>
              </div>

              {/* Lead Source ROI Table */}
              <div className="reports-section-card">
                <h4>Channel Source Attribution & Conversion Rates</h4>
                <table className="crm-data-table">
                  <thead>
                    <tr>
                      <th>Acquisition Channel</th>
                      <th>Total Inquiries</th>
                      <th>Converted Deals</th>
                      <th>Conversion Rate</th>
                      <th>Total Pipeline Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversionReports.sourceBreakdown?.map((src) => (
                      <tr key={src.source}>
                        <td><strong>{src.source}</strong></td>
                        <td>{src.totalLeads}</td>
                        <td>{src.convertedLeads}</td>
                        <td>
                          <span className="badge badge-success">{src.conversionRate}%</span>
                        </td>
                        <td>{formatCurrency(src.totalPipeline)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Advisor Leaderboard */}
              <div className="reports-section-card">
                <h4>Advisor Team Performance Leaderboard</h4>
                <table className="crm-data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Advisor Name</th>
                      <th>Assigned Pipeline</th>
                      <th>Policies Converted</th>
                      <th>Conversion Rate</th>
                      <th>Commission Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversionReports.leaderboard?.map((adv, idx) => (
                      <tr key={adv.advisorId}>
                        <td><strong>#{idx + 1}</strong></td>
                        <td>{adv.name}</td>
                        <td>{adv.totalLeads}</td>
                        <td>{adv.convertedLeads}</td>
                        <td><strong>{adv.conversionRate}%</strong></td>
                        <td className="text-primary font-bold">
                          {formatCurrency(adv.totalCommissionEarned)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : (
        /* COMMISSIONS TAB */
        <div className="crm-commissions-view">
          <h3>Advisor Commission Payouts</h3>
          <p className="section-desc">Record of commissions earned on converted policy sales.</p>
          <table className="crm-data-table">
            <thead>
              <tr>
                <th>Policy Name</th>
                <th>Premium Amount</th>
                <th>Commission Rate</th>
                <th>Earnings</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(commissions.commissions || []).map((comm) => (
                <tr key={comm.id}>
                  <td><strong>{comm.policyName}</strong></td>
                  <td>{formatCurrency(comm.premiumAmount)}</td>
                  <td>{(comm.commissionRate * 100).toFixed(0)}%</td>
                  <td className="text-success font-bold">{formatCurrency(comm.commissionAmount)}</td>
                  <td>
                    <span className={`badge ${comm.status === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                      {comm.status}
                    </span>
                  </td>
                  <td>{new Date(comm.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {(!commissions.commissions || commissions.commissions.length === 0) && (
                <tr>
                  <td colSpan="6" className="text-center">No commission records found yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* LEAD 360° DRAWER */}
      {selectedLead && (
        <div className="crm-drawer-overlay" onClick={() => setSelectedLead(null)}>
          <div className="crm-drawer-content" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Top Header */}
            <div className="drawer-header">
              <div>
                <div className="drawer-tags-row">
                  <span className={`priority-tag priority-${selectedLead.priority.toLowerCase()}`}>
                    {selectedLead.priority}
                  </span>
                  <span className="score-badge">Lead Score: {selectedLead.leadScore}/100</span>
                  <span className="source-tag">{selectedLead.source}</span>
                </div>
                <h2>{selectedLead.name}</h2>
                <div className="drawer-contact-row">
                  <span>📞 {selectedLead.phone}</span>
                  <span>✉️ {selectedLead.email}</span>
                </div>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setSelectedLead(null)}
              >
                <HiX />
              </button>
            </div>

            {/* Drawer Quick Action Toolbar */}
            <div className="drawer-action-toolbar">
              <button
                type="button"
                className="action-pill-btn"
                onClick={() => setShowCallModal(true)}
              >
                <HiPhone /> Dial / Log Call
              </button>
              <button
                type="button"
                className="action-pill-btn"
                onClick={() => setShowMeetingModal(true)}
              >
                <HiVideoCamera /> Book Meeting
              </button>
              <button
                type="button"
                className="action-pill-btn"
                onClick={() => setShowEmailModal(true)}
              >
                <HiMail /> Send Email
              </button>
              <button
                type="button"
                className="action-pill-btn"
                onClick={() => setShowFollowUpModal(true)}
              >
                <HiClock /> Follow-up
              </button>
              <button
                type="button"
                className="action-pill-btn outline"
                onClick={() => {
                  fetchConversionReports();
                  setShowReassignModal(true);
                }}
              >
                🔄 Reassign
              </button>
            </div>

            {/* Key Customer Parameters */}
            <div className="drawer-params-box">
              <div className="param-item">
                <span className="param-label">Stage</span>
                <select
                  value={selectedLead.stage}
                  onChange={(e) => handleStageChange(selectedLead.id, e.target.value)}
                  className="param-select"
                >
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="param-item">
                <span className="param-label">Priority</span>
                <select
                  value={selectedLead.priority}
                  onChange={(e) => handleUpdateMetadata('priority', e.target.value)}
                  className="param-select"
                >
                  <option value="HOT">🔥 HOT</option>
                  <option value="WARM">⚡ WARM</option>
                  <option value="COLD">❄️ COLD</option>
                </select>
              </div>

              <div className="param-item">
                <span className="param-label">Customer Sentiment</span>
                <select
                  value={selectedLead.sentiment || 'INTERESTED'}
                  onChange={(e) => handleUpdateMetadata('sentiment', e.target.value)}
                  className="param-select"
                >
                  <option value="READY_TO_BUY">Ready to Buy</option>
                  <option value="INTERESTED">Interested</option>
                  <option value="HESITANT">Hesitant</option>
                  <option value="PRICE_SENSITIVE">Price Sensitive</option>
                  <option value="NOT_INTERESTED">Not Interested</option>
                </select>
              </div>

              <div className="param-item">
                <span className="param-label">Est. Budget</span>
                <span className="param-val">{formatCurrency(selectedLead.estimatedBudget)}</span>
              </div>
            </div>

            {/* Internal Drawer Navigation Tabs */}
            <div className="drawer-subtabs">
              <button
                type="button"
                className={`drawer-subtab ${leadDetailTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setLeadDetailTab('timeline')}
              >
                Activity Timeline ({selectedLead.activities?.length || 0})
              </button>
              <button
                type="button"
                className={`drawer-subtab ${leadDetailTab === 'followups' ? 'active' : ''}`}
                onClick={() => setLeadDetailTab('followups')}
              >
                Follow-ups ({selectedLead.followUps?.length || 0})
              </button>
              <button
                type="button"
                className={`drawer-subtab ${leadDetailTab === 'calls' ? 'active' : ''}`}
                onClick={() => setLeadDetailTab('calls')}
              >
                Calls ({selectedLead.calls?.length || 0})
              </button>
              <button
                type="button"
                className={`drawer-subtab ${leadDetailTab === 'meetings' ? 'active' : ''}`}
                onClick={() => setLeadDetailTab('meetings')}
              >
                Meetings ({selectedLead.meetings?.length || 0})
              </button>
              <button
                type="button"
                className={`drawer-subtab ${leadDetailTab === 'emails' ? 'active' : ''}`}
                onClick={() => setLeadDetailTab('emails')}
              >
                Emails ({selectedLead.emailLogs?.length || 0})
              </button>
            </div>

            {/* Subtab Contents */}
            <div className="drawer-tab-body">
              {leadDetailTab === 'timeline' && (
                <div className="timeline-container">
                  {/* Quick Note Input */}
                  <form onSubmit={handleAddNote} className="quick-note-form">
                    <input
                      type="text"
                      placeholder="Add an interaction note, customer comment or update..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="form-input form-input-sm"
                    />
                    <button type="submit" className="btn btn-primary btn-sm">
                      Log Note
                    </button>
                  </form>

                  {/* Activity Stream */}
                  <div className="timeline-list">
                    {(selectedLead.activities || []).map((act) => (
                      <div key={act.id} className="timeline-item">
                        <div className="timeline-bullet" />
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-type">{act.type}</span>
                            <span className="timeline-time">
                              {new Date(act.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="timeline-desc">{act.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {leadDetailTab === 'followups' && (
                <div className="drawer-followups-list">
                  <div className="sub-header-row">
                    <h4>Customer Follow-ups</h4>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowFollowUpModal(true)}
                    >
                      + Schedule Follow-up
                    </button>
                  </div>
                  {(selectedLead.followUps || []).map((f) => (
                    <div key={f.id} className="lead-item-box">
                      <div className="box-top">
                        <strong>{f.title}</strong>
                        <span className={`badge ${f.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                          {f.status}
                        </span>
                      </div>
                      <div className="box-meta">
                        ⏰ Scheduled: {new Date(f.scheduledAt).toLocaleString()}
                      </div>
                      {f.notes && <p className="box-notes">"{f.notes}"</p>}
                      {f.status === 'PENDING' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline mt-2"
                          onClick={() => handleCompleteFollowUp(f.id)}
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  ))}
                  {(!selectedLead.followUps || selectedLead.followUps.length === 0) && (
                    <p className="empty-sub">No follow-ups recorded yet.</p>
                  )}
                </div>
              )}

              {leadDetailTab === 'calls' && (
                <div className="drawer-calls-list">
                  <div className="sub-header-row">
                    <h4>Phone Calls & Discussions</h4>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowCallModal(true)}
                    >
                      + Log Call
                    </button>
                  </div>
                  {(selectedLead.calls || []).map((c) => (
                    <div key={c.id} className="lead-item-box">
                      <div className="box-top">
                        <span className="text-primary font-bold">Outcome: {c.outcome}</span>
                        <span>Duration: {Math.floor(c.durationSeconds / 60)}m {c.durationSeconds % 60}s</span>
                      </div>
                      <div className="box-meta">
                        {new Date(c.createdAt).toLocaleString()}
                      </div>
                      {c.notes && <p className="box-notes">Notes: {c.notes}</p>}
                    </div>
                  ))}
                  {(!selectedLead.calls || selectedLead.calls.length === 0) && (
                    <p className="empty-sub">No calls logged yet.</p>
                  )}
                </div>
              )}

              {leadDetailTab === 'meetings' && (
                <div className="drawer-meetings-list">
                  <div className="sub-header-row">
                    <h4>Consultations & Video Meetings</h4>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowMeetingModal(true)}
                    >
                      + Book Meeting
                    </button>
                  </div>
                  {(selectedLead.meetings || []).map((m) => (
                    <div key={m.id} className="lead-item-box">
                      <div className="box-top">
                        <strong>{m.title}</strong>
                        <span className="badge badge-primary">{m.status}</span>
                      </div>
                      <div className="box-meta">
                        📅 {new Date(m.scheduledAt).toLocaleString()} ({m.durationMinutes} mins)
                      </div>
                      {m.agenda && <p className="box-notes">Agenda: {m.agenda}</p>}
                      {m.meetingLink && (
                        <div className="mt-2">
                          <a
                            href={m.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-primary"
                          >
                            <HiVideoCamera /> Join Video Consultation
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!selectedLead.meetings || selectedLead.meetings.length === 0) && (
                    <p className="empty-sub">No meetings scheduled.</p>
                  )}
                </div>
              )}

              {leadDetailTab === 'emails' && (
                <div className="drawer-emails-list">
                  <div className="sub-header-row">
                    <h4>Dispatched Emails & Tracking</h4>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowEmailModal(true)}
                    >
                      + Send Template Email
                    </button>
                  </div>
                  {(selectedLead.emailLogs || []).map((em) => (
                    <div key={em.id} className="lead-item-box">
                      <div className="box-top">
                        <strong>{em.subject}</strong>
                        <span className="badge badge-success">{em.status}</span>
                      </div>
                      <div className="box-meta">
                        To: {em.recipientEmail} • Sent: {new Date(em.createdAt).toLocaleString()}
                      </div>
                      {em.openedAt && (
                        <span className="tracking-chip">
                          ✓ Opened on {new Date(em.openedAt).toLocaleTimeString()}
                        </span>
                      )}
                      <p className="box-notes email-body-snippet">{em.body}</p>
                    </div>
                  ))}
                  {(!selectedLead.emailLogs || selectedLead.emailLogs.length === 0) && (
                    <p className="empty-sub">No emails sent yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CLICK-TO-CALL SIMULATOR MODAL */}
      {showCallModal && (
        <div className="crm-modal-overlay">
          <div className="crm-modal-box">
            <div className="modal-header">
              <h3>Interactive Phone Dialer & Call Logger</h3>
              <button type="button" onClick={() => setShowCallModal(false)}><HiX /></button>
            </div>
            <div className="modal-body">
              <div className="call-dialer-panel">
                <div className="dialer-avatar">📞</div>
                <h4>Calling {selectedLead?.name}</h4>
                <p className="dialer-phone">{selectedLead?.phone}</p>

                <div className="call-timer-display">
                  {Math.floor(callDuration / 60)
                    .toString()
                    .padStart(2, '0')}
                  :
                  {(callDuration % 60).toString().padStart(2, '0')}
                </div>

                {!isCalling ? (
                  <button
                    type="button"
                    className="btn btn-success btn-lg"
                    onClick={handleStartCall}
                  >
                    Start Simulated Call
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-error btn-lg"
                    onClick={handleEndCall}
                  >
                    End Call & Save
                  </button>
                )}
              </div>

              <div className="form-group mt-4">
                <label>Call Outcome</label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="form-input"
                >
                  <option value="CONNECTED">Connected & Spoke</option>
                  <option value="VOICEMAIL">Left Voicemail</option>
                  <option value="BUSY">Line Busy</option>
                  <option value="SCHEDULED_CALLBACK">Requested Callback</option>
                  <option value="WRONG_NUMBER">Wrong Number</option>
                </select>
              </div>

              <div className="form-group">
                <label>Discussion Summary & Next Steps</label>
                <textarea
                  rows="3"
                  className="form-input"
                  placeholder="Record key talking points, objections, or rider preferences..."
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCallModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleEndCall}
              >
                Save Call Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEETING BOOKING MODAL */}
      {showMeetingModal && (
        <div className="crm-modal-overlay">
          <div className="crm-modal-box">
            <div className="modal-header">
              <h3>Schedule Video Consultation</h3>
              <button type="button" onClick={() => setShowMeetingModal(false)}><HiX /></button>
            </div>
            <form onSubmit={handleScheduleMeeting}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Meeting Title</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={meetingForm.title}
                    onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    className="form-input"
                    value={meetingForm.scheduledAt}
                    onChange={(e) => setMeetingForm({ ...meetingForm, scheduledAt: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Duration (Minutes)</label>
                  <select
                    className="form-input"
                    value={meetingForm.durationMinutes}
                    onChange={(e) => setMeetingForm({ ...meetingForm, durationMinutes: e.target.value })}
                  >
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">1 Hour</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Agenda</label>
                  <textarea
                    rows="3"
                    className="form-input"
                    value={meetingForm.agenda}
                    onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMeetingModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm & Generate Meet URL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMAIL COMPOSER MODAL */}
      {showEmailModal && (
        <div className="crm-modal-overlay">
          <div className="crm-modal-box wide">
            <div className="modal-header">
              <h3>Send Customer Email</h3>
              <button type="button" onClick={() => setShowEmailModal(false)}><HiX /></button>
            </div>
            <form onSubmit={handleSendEmail}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Insurance Email Template</label>
                  <select
                    className="form-input"
                    value={emailForm.templateKey}
                    onChange={(e) => {
                      const tmpl = emailTemplates.find((t) => t.key === e.target.value);
                      setEmailForm({
                        templateKey: e.target.value,
                        customSubject: tmpl ? tmpl.subject : '',
                        customBody: tmpl ? tmpl.body : '',
                      });
                    }}
                  >
                    {emailTemplates.map((t) => (
                      <option key={t.key} value={t.key}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject Line</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Custom or template subject..."
                    value={emailForm.customSubject}
                    onChange={(e) => setEmailForm({ ...emailForm, customSubject: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email Body</label>
                  <textarea
                    rows="6"
                    required
                    className="form-input"
                    value={emailForm.customBody}
                    onChange={(e) => setEmailForm({ ...emailForm, customBody: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEmailModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <HiPaperAirplane /> Dispatch Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOLLOW-UP MODAL */}
      {showFollowUpModal && (
        <div className="crm-modal-overlay">
          <div className="crm-modal-box">
            <div className="modal-header">
              <h3>Schedule Task & Follow-up</h3>
              <button type="button" onClick={() => setShowFollowUpModal(false)}><HiX /></button>
            </div>
            <form onSubmit={handleScheduleFollowUp}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Follow-up Title</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={followUpForm.title}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    className="form-input"
                    value={followUpForm.scheduledAt}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, scheduledAt: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    className="form-input"
                    value={followUpForm.priority}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, priority: e.target.value })}
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Action Notes</label>
                  <textarea
                    rows="3"
                    className="form-input"
                    value={followUpForm.notes}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFollowUpModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN LEAD MODAL */}
      {showReassignModal && (
        <div className="crm-modal-overlay">
          <div className="crm-modal-box">
            <div className="modal-header">
              <h3>Reassign Lead to Colleague</h3>
              <button type="button" onClick={() => setShowReassignModal(false)}><HiX /></button>
            </div>
            <form onSubmit={handleReassignLead}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Target Advisor</label>
                  <select
                    required
                    className="form-input"
                    value={reassignForm.newAdvisorId}
                    onChange={(e) => setReassignForm({ ...reassignForm, newAdvisorId: e.target.value })}
                  >
                    <option value="">-- Choose Advisor --</option>
                    {advisorsList.map((adv) => (
                      <option key={adv.advisorId} value={adv.advisorId}>
                        {adv.name} ({adv.totalLeads} active leads)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Reassignment Reason</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={reassignForm.reason}
                    onChange={(e) => setReassignForm({ ...reassignForm, reason: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReassignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Reassign Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW LEAD MODAL */}
      {showAddModal && (
        <div className="crm-modal-overlay">
          <div className="crm-modal-box">
            <div className="modal-header">
              <h3>Add New Sales Lead</h3>
              <button type="button" onClick={() => setShowAddModal(false)}><HiX /></button>
            </div>
            <form onSubmit={handleCreateLead}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={newLeadForm.name}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    className="form-input"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Insurance Category</label>
                    <select
                      className="form-input"
                      value={newLeadForm.category}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, category: e.target.value })}
                    >
                      <option value="HEALTH">Health</option>
                      <option value="LIFE">Life</option>
                      <option value="MOTOR">Motor</option>
                      <option value="TRAVEL">Travel</option>
                      <option value="HOME">Home</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      className="form-input"
                      value={newLeadForm.priority}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, priority: e.target.value })}
                    >
                      <option value="HOT">🔥 HOT</option>
                      <option value="WARM">⚡ WARM</option>
                      <option value="COLD">❄️ COLD</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Estimated Annual Budget (INR)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newLeadForm.estimatedBudget}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, estimatedBudget: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Initial Inquiry Notes</label>
                  <textarea
                    rows="2"
                    className="form-input"
                    value={newLeadForm.notes}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Score Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
