import React, { useState, useEffect } from 'react';
import {
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineUserGroup,
  HiOutlineRefresh,
  HiOutlineFilter,
  HiSearch,
  HiX,
  HiLockClosed,
  HiPaperAirplane,
  HiStar,
  HiOutlinePhone,
  HiOutlineTrendingUp,
  HiArrowSmUp,
} from 'react-icons/hi';
import api from '../services/api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './SupportDeskPage.css';

export default function SupportDeskPage() {
  const { user } = useAuth();

  // Desk State
  const [activeTab, setActiveTab] = useState('QUEUE'); // 'QUEUE' | 'CALLBACKS' | 'ANALYTICS'
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Ticket Workspace State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Status Change Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Escalation Modal State
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateToTier, setEscalateToTier] = useState('TIER_2_SPECIALIST');
  const [escalationReason, setEscalationReason] = useState('');
  const [escalating, setEscalating] = useState(false);

  // Voice Callbacks State
  const [callbacks, setCallbacks] = useState([]);
  const [callbacksLoading, setCallbacksLoading] = useState(false);

  // SLA Sweeper State
  const [sweepingSla, setSweepingSla] = useState(false);

  // ─── Fetch Staff Queue ─────────────────────────────────────
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/support/desk/tickets', {
        params: {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
          tier: tierFilter !== 'ALL' ? tierFilter : undefined,
          search: searchQuery.trim() || undefined,
        },
      });
      if (res.data.success) {
        setTickets(res.data.tickets || []);
      }
    } catch (err) {
      console.error('Error fetching desk tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch Support Analytics ───────────────────────────────
  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/support/desk/analytics');
      if (res.data.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  // ─── Fetch Voice Callbacks ─────────────────────────────────
  const fetchCallbacks = async () => {
    try {
      setCallbacksLoading(true);
      const res = await api.get('/support/callbacks');
      if (res.data.success) {
        setCallbacks(res.data.callbacks || []);
      }
    } catch (err) {
      console.error('Error fetching callbacks:', err);
    } finally {
      setCallbacksLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchAnalytics();
  }, [statusFilter, priorityFilter, tierFilter]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab === 'CALLBACKS') {
      fetchCallbacks();
    }
  }, [activeTab]);

  // ─── Run SLA Breach Sweeper ────────────────────────────────
  const handleRunSlaSweep = async () => {
    try {
      setSweepingSla(true);
      const res = await api.post('/support/desk/sla-sweep');
      if (res.data.success) {
        if (res.data.breachedCount > 0) {
          toast.error(`SLA Alert: ${res.data.breachedCount} overdue ticket(s) detected and escalated to Tier 2!`);
        } else {
          toast.success('SLA Audit Complete: All active tickets are currently on track!');
        }
        fetchTickets();
        fetchAnalytics();
      }
    } catch (err) {
      toast.error('Failed to run SLA breach audit');
    } finally {
      setSweepingSla(false);
    }
  };

  // ─── Open Ticket Details Workspace ─────────────────────────
  const openWorkspace = async (ticketId) => {
    try {
      const res = await api.get(`/support/tickets/${ticketId}`);
      if (res.data.success) {
        setSelectedTicket(res.data.ticket);
        setIsInternalNote(false);
        setReplyText('');
      }
    } catch (err) {
      toast.error('Unable to load ticket details');
    }
  };

  // ─── Send Reply or Internal Staff Note ─────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    try {
      setSendingMessage(true);
      const res = await api.post(`/support/tickets/${selectedTicket.id}/messages`, {
        message: replyText.trim(),
        isInternalNote,
      });

      if (res.data.success) {
        setSelectedTicket((prev) => ({
          ...prev,
          status: res.data.ticket?.status || prev.status,
          messages: [...(prev.messages || []), res.data.message],
        }));
        setReplyText('');
        toast.success(isInternalNote ? 'Internal note saved (Private)' : 'Reply sent to customer');
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post message');
    } finally {
      setSendingMessage(false);
    }
  };

  // ─── Update Ticket Status ──────────────────────────────────
  const handleUpdateStatus = async () => {
    if (!selectedTicket) return;
    try {
      setUpdatingStatus(true);
      const res = await api.patch(`/support/tickets/${selectedTicket.id}/status`, {
        status: targetStatus,
        notes: resolutionNotes.trim() || undefined,
      });

      if (res.data.success) {
        toast.success(`Ticket status updated to ${targetStatus}`);
        setSelectedTicket(res.data.ticket);
        setShowStatusModal(false);
        setResolutionNotes('');
        fetchTickets();
        fetchAnalytics();
      }
    } catch (err) {
      toast.error('Failed to update ticket status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ─── Escalate Ticket Tier ──────────────────────────────────
  const handleEscalateTicket = async () => {
    if (!selectedTicket || !escalationReason.trim()) {
      toast.error('Please specify the reason for escalation.');
      return;
    }

    try {
      setEscalating(true);
      const res = await api.patch(`/support/tickets/${selectedTicket.id}/escalate`, {
        toTier: escalateToTier,
        reason: escalationReason.trim(),
      });

      if (res.data.success) {
        toast.success(`Ticket successfully escalated to ${escalateToTier.replace(/_/g, ' ')}`);
        setSelectedTicket(res.data.ticket);
        setShowEscalateModal(false);
        setEscalationReason('');
        fetchTickets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to escalate ticket');
    } finally {
      setEscalating(false);
    }
  };

  // ─── Update Callback Request Status ────────────────────────
  const handleUpdateCallback = async (callbackId, newStatus) => {
    try {
      const res = await api.patch(`/support/callbacks/${callbackId}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Callback marked as ${newStatus}`);
        fetchCallbacks();
      }
    } catch (err) {
      toast.error('Failed to update callback status');
    }
  };

  return (
    <div className="desk-container">
      {/* ─── Header & Top Actions ────────────────────────────── */}
      <div className="desk-header">
        <div className="desk-header-title">
          <HiOutlineShieldCheck size={32} style={{ color: '#2563eb' }} />
          <div>
            <h1>Staff Support Desk & SLA Command</h1>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Real-time multi-channel ticket resolution, tiered escalation, and SLA compliance monitoring
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline btn-sm" onClick={handleRunSlaSweep} disabled={sweepingSla}>
            <HiOutlineRefresh className={sweepingSla ? 'spin' : ''} />
            {sweepingSla ? 'Auditing SLAs...' : 'Run SLA Breach Sweep'}
          </button>
        </div>
      </div>

      {/* ─── Metric KPI Cards ─────────────────────────────────── */}
      {analytics && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-title">Active Tickets</div>
            <div className="kpi-value">{analytics.openTickets + analytics.inProgressTickets}</div>
            <div className="kpi-footer">
              {analytics.openTickets} Open • {analytics.inProgressTickets} In Progress
            </div>
          </div>

          <div className={`kpi-card ${analytics.breachedTickets > 0 ? 'kpi-breached' : ''}`}>
            <div className="kpi-title">SLA Breached</div>
            <div className={`kpi-value ${analytics.breachedTickets > 0 ? 'breached-val' : ''}`}>
              {analytics.breachedTickets}
            </div>
            <div className="kpi-footer">
              {analytics.breachedTickets > 0 ? '⚠️ Immediate Action Required' : '0 Overdue Breaches'}
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-title">SLA Compliance</div>
            <div className="kpi-value" style={{ color: analytics.slaComplianceRate >= 95 ? '#059669' : '#d97706' }}>
              {analytics.slaComplianceRate}%
            </div>
            <div className="kpi-footer">IRDAI Benchmark: ≥95%</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-title">Avg CSAT Rating</div>
            <div className="kpi-value" style={{ color: '#f59e0b' }}>
              ★ {analytics.avgCsat} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ 5.0</span>
            </div>
            <div className="kpi-footer">Customer Satisfaction</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-title">Avg Response (FRT)</div>
            <div className="kpi-value">{analytics.avgFrtMinutes}m</div>
            <div className="kpi-footer">First Response Target: ≤30m</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-title">Mean Resolution (MTTR)</div>
            <div className="kpi-value">{analytics.avgMttrHours}h</div>
            <div className="kpi-footer">Resolved: {analytics.resolvedTickets} tickets</div>
          </div>
        </div>
      )}

      {/* ─── Navigation Tabs ─────────────────────────────────── */}
      <div className="desk-tabs-bar">
        <div className="desk-tabs">
          <button
            className={`desk-tab-btn ${activeTab === 'QUEUE' ? 'active' : ''}`}
            onClick={() => setActiveTab('QUEUE')}
          >
            <HiOutlineClock /> Ticket Queue ({tickets.length})
          </button>
          <button
            className={`desk-tab-btn ${activeTab === 'CALLBACKS' ? 'active' : ''}`}
            onClick={() => setActiveTab('CALLBACKS')}
          >
            <HiOutlinePhone /> Voice Callbacks ({callbacks.filter((c) => c.status === 'REQUESTED').length})
          </button>
        </div>
      </div>

      {/* ─── Tab 1: Ticket Queue ──────────────────────────────── */}
      {activeTab === 'QUEUE' && (
        <div>
          {/* Filters Bar */}
          <div className="desk-filters-bar">
            <div className="filter-group">
              <input
                type="text"
                className="filter-search-input"
                placeholder="Search ticket #, customer name, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_ON_CUSTOMER">Waiting on Customer</option>
                <option value="RESOLVED">Resolved</option>
                <option value="BREACHED">🚨 SLA Breached</option>
              </select>

              <select
                className="filter-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="ALL">All Priorities</option>
                <option value="URGENT">Urgent (4h)</option>
                <option value="HIGH">High (12h)</option>
                <option value="MEDIUM">Medium (24h)</option>
                <option value="LOW">Low (48h)</option>
              </select>

              <select className="filter-select" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
                <option value="ALL">All Tiers</option>
                <option value="TIER_1_AGENT">Tier 1 Support Agent</option>
                <option value="TIER_2_SPECIALIST">Tier 2 Specialist</option>
                <option value="TIER_3_MANAGEMENT">Tier 3 Management</option>
              </select>
            </div>

            <button className="btn btn-ghost btn-sm" onClick={fetchTickets}>
              <HiOutlineRefresh /> Refresh
            </button>
          </div>

          {/* Table of Tickets */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              Loading ticket queue...
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: '12px' }}>
              <HiOutlineCheckCircle size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0f172a' }}>Zero Pending Tickets in this Queue</h3>
              <p style={{ color: '#64748b' }}>All customer requests matching selected filters are addressed.</p>
            </div>
          ) : (
            <div className="desk-table-container">
              <table className="desk-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Customer</th>
                    <th>Subject & Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Tier</th>
                    <th>SLA Countdown</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className="ticket-num-badge">{t.ticketNumber}</span>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                          via {t.channel}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a' }}>
                          {t.user ? `${t.user.firstName} ${t.user.lastName}` : 'Customer'}
                        </strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.user?.email}</div>
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: '#0f172a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {t.subject}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {t.category.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td>
                        <span className={`badge-priority priority-${t.priority.toLowerCase()}`}>{t.priority}</span>
                      </td>
                      <td>
                        <span className={`badge-status badge-${t.status.toLowerCase()}`}>
                          {t.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`tier-badge tier-${t.escalationTier.toLowerCase()}`}>
                          {t.escalationTier === 'TIER_1_AGENT'
                            ? 'Tier 1'
                            : t.escalationTier === 'TIER_2_SPECIALIST'
                            ? 'Tier 2'
                            : 'Tier 3'}
                        </span>
                      </td>
                      <td>
                        {t.status === 'RESOLVED' || t.status === 'CLOSED' ? (
                          <span style={{ color: '#059669', fontWeight: 600, fontSize: '0.8rem' }}>Resolved</span>
                        ) : t.slaState === 'BREACHED' || t.slaBreached ? (
                          <span className="sla-pill sla-breached">⚠️ Overdue</span>
                        ) : t.slaState === 'AT_RISK' ? (
                          <span className="sla-pill sla-atrisk">⚡ At Risk (&lt;1h)</span>
                        ) : (
                          <span className="sla-pill sla-ontrack">
                            Due {new Date(t.slaResolutionDue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => openWorkspace(t.id)}>
                          Open Workspace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Tab 2: Voice Callback Queue ─────────────────────── */}
      {activeTab === 'CALLBACKS' && (
        <div>
          {callbacksLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading callbacks...</div>
          ) : callbacks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: '12px' }}>
              <HiOutlinePhone size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0f172a' }}>No Voice Callback Requests</h3>
              <p style={{ color: '#64748b' }}>Incoming phone callback requests will appear here.</p>
            </div>
          ) : (
            <div className="desk-table-container">
              <table className="desk-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Phone</th>
                    <th>Preferred Window</th>
                    <th>Topic</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {callbacks.map((cb) => (
                    <tr key={cb.id}>
                      <td>
                        <strong>{cb.customerName}</strong>
                      </td>
                      <td>
                        <a href={`tel:${cb.phone}`} style={{ color: '#2563eb', fontWeight: 600 }}>
                          {cb.phone}
                        </a>
                      </td>
                      <td>
                        <span className="sla-pill sla-ontrack">{cb.preferredTime}</span>
                      </td>
                      <td>{cb.category.replace(/_/g, ' ')}</td>
                      <td>
                        <span
                          className={`badge-status ${
                            cb.status === 'COMPLETED' ? 'badge-resolved' : 'badge-in_progress'
                          }`}
                        >
                          {cb.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{cb.notes || '—'}</td>
                      <td>
                        {cb.status === 'REQUESTED' && (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleUpdateCallback(cb.id, 'IN_PROGRESS')}
                            >
                              Calling
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleUpdateCallback(cb.id, 'COMPLETED')}
                            >
                              Done
                            </button>
                          </div>
                        )}
                        {cb.status === 'IN_PROGRESS' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleUpdateCallback(cb.id, 'COMPLETED')}
                          >
                            Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Modal: Staff Workspace for Ticket ───────────────── */}
      {selectedTicket && (
        <div className="modal-backdrop" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content workspace-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="ticket-num-badge">{selectedTicket.ticketNumber}</span>
                  <span className={`badge-status badge-${selectedTicket.status.toLowerCase()}`}>
                    {selectedTicket.status.replace(/_/g, ' ')}
                  </span>
                  <span className={`tier-badge tier-${selectedTicket.escalationTier.toLowerCase()}`}>
                    {selectedTicket.escalationTier.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 style={{ marginTop: '0.35rem' }}>{selectedTicket.subject}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedTicket(null)}>
                <HiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="workspace-layout">
                {/* Left Column: Thread & Composer */}
                <div>
                  <div className="thread-container" style={{ maxHeight: '380px' }}>
                    {selectedTicket.messages &&
                      selectedTicket.messages.map((m) => {
                        const isStaff = m.senderType === 'STAFF' || m.senderType === 'SYSTEM';

                        if (m.isInternalNote) {
                          return (
                            <div key={m.id} className="message-bubble message-internal">
                              <div className="message-header">
                                <span className="internal-note-badge">
                                  <HiLockClosed size={12} /> Internal Staff Note (Private)
                                </span>
                                <span>
                                  {new Date(m.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <div>{m.message}</div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={m.id}
                            className={`message-bubble ${isStaff ? 'message-staff' : 'message-customer'}`}
                          >
                            <div className="message-header">
                              <strong>
                                {isStaff
                                  ? `🛡️ Staff: ${m.sender?.firstName || 'Advisor'}`
                                  : `👤 Customer: ${selectedTicket.user?.firstName || 'Customer'}`}
                              </strong>
                              <span>
                                {new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{m.message}</div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Reply Composer */}
                  <form onSubmit={handleSendMessage} className="composer-container">
                    <div className="reply-toggle-bar">
                      <button
                        type="button"
                        className={`reply-toggle-btn ${!isInternalNote ? 'active-public' : ''}`}
                        onClick={() => setIsInternalNote(false)}
                      >
                        Public Reply (To Customer)
                      </button>
                      <button
                        type="button"
                        className={`reply-toggle-btn ${isInternalNote ? 'active-private' : ''}`}
                        onClick={() => setIsInternalNote(true)}
                      >
                        <HiLockClosed /> Internal Staff Note (Staff Only)
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      className={isInternalNote ? 'private-mode' : ''}
                      placeholder={
                        isInternalNote
                          ? 'Add a private note regarding hospital TPA coordinates, claims specialist review, or approval code (never visible to customer)...'
                          : 'Write response to customer...'
                      }
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      required
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        type="submit"
                        className={`btn ${isInternalNote ? 'btn-outline' : 'btn-primary'}`}
                        disabled={sendingMessage}
                      >
                        <HiPaperAirplane />
                        {sendingMessage ? 'Posting...' : isInternalNote ? 'Save Private Note' : 'Send Public Reply'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Column: Ticket Sidebar & Actions */}
                <div className="workspace-sidebar">
                  {/* Customer Info */}
                  <div className="sidebar-section">
                    <h5>Customer Details</h5>
                    <div className="sidebar-row">
                      <span>Name:</span>
                      <strong>
                        {selectedTicket.user?.firstName} {selectedTicket.user?.lastName}
                      </strong>
                    </div>
                    <div className="sidebar-row">
                      <span>Email:</span>
                      <strong>{selectedTicket.user?.email}</strong>
                    </div>
                    <div className="sidebar-row">
                      <span>Phone:</span>
                      <strong>{selectedTicket.user?.phone || '—'}</strong>
                    </div>
                  </div>

                  {/* SLA Info */}
                  <div className="sidebar-section">
                    <h5>SLA Status</h5>
                    <div className="sidebar-row">
                      <span>Priority:</span>
                      <span className={`badge-priority priority-${selectedTicket.priority.toLowerCase()}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <div className="sidebar-row">
                      <span>Resolution Due:</span>
                      <strong>{new Date(selectedTicket.slaResolutionDue).toLocaleString()}</strong>
                    </div>
                    <div className="sidebar-row">
                      <span>SLA State:</span>
                      <strong>
                        {selectedTicket.slaBreached ? '⚠️ BREACHED' : 'ON TRACK'}
                      </strong>
                    </div>
                  </div>

                  {/* CSAT Rating if resolved */}
                  {selectedTicket.csatRating && (
                    <div className="sidebar-section">
                      <h5>Customer CSAT</h5>
                      <div style={{ color: '#f59e0b', fontSize: '1.25rem' }}>
                        {'★'.repeat(selectedTicket.csatRating)}
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          {' '}
                          ({selectedTicket.csatRating}/5)
                        </span>
                      </div>
                      {selectedTicket.csatFeedback && (
                        <div style={{ fontSize: '0.78rem', color: '#475569', fontStyle: 'italic', marginTop: '0.25rem' }}>
                          "{selectedTicket.csatFeedback}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Escalation History */}
                  {selectedTicket.escalationLogs && selectedTicket.escalationLogs.length > 0 && (
                    <div className="sidebar-section">
                      <h5>Escalation Audit Trail</h5>
                      <div className="escalation-history-box">
                        {selectedTicket.escalationLogs.map((log) => (
                          <div key={log.id} className="escalation-step">
                            <div>
                              <strong>{log.fromTier}</strong> → <strong>{log.toTier}</strong>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Reason: {log.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="sidebar-section" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h5>Workflow Actions</h5>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setTargetStatus(selectedTicket.status === 'RESOLVED' ? 'CLOSED' : 'RESOLVED');
                        setShowStatusModal(true);
                      }}
                    >
                      Update Status
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setEscalateToTier(
                          selectedTicket.escalationTier === 'TIER_1_AGENT'
                            ? 'TIER_2_SPECIALIST'
                            : 'TIER_3_MANAGEMENT'
                        );
                        setShowEscalateModal(true);
                      }}
                    >
                      <HiArrowSmUp /> Escalate Tier
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedTicket(null)}>
                Close Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Update Status Modal ──────────────────────── */}
      {showStatusModal && (
        <div className="modal-backdrop" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Ticket Status</h3>
              <button className="modal-close-btn" onClick={() => setShowStatusModal(false)}>
                <HiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Target Status</label>
                <select value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)}>
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="WAITING_ON_CUSTOMER">WAITING_ON_CUSTOMER</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div className="form-group">
                <label>Resolution Summary / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Provide resolution details or reason for state transition..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowStatusModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpdateStatus} disabled={updatingStatus}>
                {updatingStatus ? 'Updating...' : 'Confirm Status Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Escalate Tier Modal ──────────────────────── */}
      {showEscalateModal && (
        <div className="modal-backdrop" onClick={() => setShowEscalateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Escalate Ticket to Higher Tier</h3>
              <button className="modal-close-btn" onClick={() => setShowEscalateModal(false)}>
                <HiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Target Escalation Tier</label>
                <select value={escalateToTier} onChange={(e) => setEscalateToTier(e.target.value)}>
                  <option value="TIER_2_SPECIALIST">Tier 2 Specialist (Underwriting & Claims Experts)</option>
                  <option value="TIER_3_MANAGEMENT">Tier 3 Management (Executive Escalations & Grievance)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Escalation Justification</label>
                <textarea
                  rows={3}
                  placeholder="State the technical or business justification for this escalation..."
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowEscalateModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleEscalateTicket} disabled={escalating}>
                {escalating ? 'Escalating...' : 'Confirm Escalation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
