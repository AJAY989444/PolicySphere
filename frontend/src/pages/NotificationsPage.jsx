import React, { useState, useEffect } from 'react';
import { 
  HiBell, 
  HiCheckCircle, 
  HiMail, 
  HiDeviceMobile, 
  HiChatAlt, 
  HiRefresh, 
  HiAdjustments, 
  HiTrash, 
  HiExternalLink,
  HiClock,
  HiShieldCheck,
  HiCreditCard,
  HiDocumentText,
  HiPaperAirplane
} from 'react-icons/hi';
import { Link } from 'react-router-dom';
import api from '../services/api/axios';
import NotificationPreferencesModal from '../components/notifications/NotificationPreferencesModal';
import NotificationSimulatorModal from '../components/notifications/NotificationSimulatorModal';
import './NotificationsPage.css';

const EVENT_TABS = [
  { id: 'ALL', label: 'All Events' },
  { id: 'UNREAD', label: 'Unread Only' },
  { id: 'POLICIES', label: 'Purchases & Renewals' },
  { id: 'CLAIMS', label: 'Claims' },
  { id: 'PAYMENTS', label: 'Payments' },
  { id: 'OTP', label: 'Security & OTP' },
];

export default function NotificationsPage() {
  const [activeMainTab, setActiveMainTab] = useState('FEED'); // FEED or AUDIT
  const [eventCategory, setEventCategory] = useState('ALL');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [deliveryLogs, setDeliveryLogs] = useState([]);
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [renewalsChecking, setRenewalsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Modals
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [eventCategory]);

  useEffect(() => {
    if (activeMainTab === 'AUDIT') {
      fetchDeliveryLogs();
    }
  }, [activeMainTab, channelFilter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/notifications?category=${eventCategory}`);
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get(`/notifications/delivery-logs?channel=${channelFilter}&allUsers=true`);
      setDeliveryLogs(res.data.logs || []);
    } catch (err) {
      console.error('Failed to load delivery logs', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all in-app notifications? Delivery audit logs will be preserved.')) return;
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
  };

  const handleTriggerRenewals = async () => {
    setRenewalsChecking(true);
    try {
      const res = await api.post('/notifications/trigger-renewals');
      setStatusMessage(`Evaluated renewal cycle: Dispatched ${res.data.dispatchedCount} renewal notices for expiring policies.`);
      setTimeout(() => setStatusMessage(null), 5000);
      fetchNotifications();
      if (activeMainTab === 'AUDIT') fetchDeliveryLogs();
    } catch (err) {
      alert('Failed to trigger renewals: ' + (err.response?.data?.message || err.message));
    } finally {
      setRenewalsChecking(false);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'OTP': return <span className="feed-icon-box otp">🔐</span>;
      case 'PURCHASE':
      case 'POLICY_ISSUED': return <span className="feed-icon-box purchase"><HiShieldCheck /></span>;
      case 'RENEWAL':
      case 'RENEWAL_REMINDER': return <span className="feed-icon-box renewal"><HiClock /></span>;
      case 'CLAIM_UPDATE': return <span className="feed-icon-box claim"><HiDocumentText /></span>;
      case 'PAYMENT_SUCCESS': return <span className="feed-icon-box payment"><HiCreditCard /></span>;
      case 'REMINDER':
      default: return <span className="feed-icon-box reminder"><HiBell /></span>;
    }
  };

  const getChannelBadge = (channel) => {
    switch (channel) {
      case 'EMAIL': return <span className="badge-channel email"><HiMail /> Email</span>;
      case 'SMS': return <span className="badge-channel sms"><HiDeviceMobile /> SMS</span>;
      case 'WHATSAPP': return <span className="badge-channel whatsapp"><HiChatAlt /> WhatsApp</span>;
      case 'PUSH': return <span className="badge-channel push"><HiBell /> Web Push</span>;
      case 'IN_APP':
      default: return <span className="badge-channel inapp"><HiCheckCircle /> In-App</span>;
    }
  };

  return (
    <div className="notifications-page">
      {/* Page Header */}
      <div className="notif-page-header">
        <div>
          <h1>Multi-Channel Notification Hub</h1>
          <p>Real-time communications, automated lifecycle event alerts, and delivery audit logs.</p>
        </div>
        <div className="notif-header-actions">
          <button 
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => setIsSimModalOpen(true)}
          >
            <HiPaperAirplane /> Simulator & Tester
          </button>
          <button 
            className="btn btn-outline-secondary d-flex align-items-center gap-2"
            onClick={() => setIsPrefModalOpen(true)}
          >
            <HiAdjustments /> Channel Preferences
          </button>
          <button
            className="btn btn-outline-primary d-flex align-items-center gap-2"
            onClick={handleTriggerRenewals}
            disabled={renewalsChecking}
            title="Scan active policies nearing expiry and fire multi-channel notices"
          >
            <HiRefresh className={renewalsChecking ? 'spin' : ''} />
            {renewalsChecking ? 'Evaluating...' : 'Check Renewals'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="alert alert-info alert-dismissible fade show shadow-sm mb-4" role="alert">
          <strong>ℹ️ Automated Notification:</strong> {statusMessage}
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="notif-kpi-grid">
        <div className="notif-kpi-card">
          <div className="kpi-icon-circle inapp"><HiBell /></div>
          <div>
            <div className="kpi-label">Active In-App</div>
            <div className="kpi-value">{notifications.length}</div>
          </div>
        </div>
        <div className="notif-kpi-card">
          <div className="kpi-icon-circle unread"><HiClock /></div>
          <div>
            <div className="kpi-label">Unread Alerts</div>
            <div className="kpi-value text-danger">{unreadCount}</div>
          </div>
        </div>
        <div className="notif-kpi-card">
          <div className="kpi-icon-circle email"><HiMail /></div>
          <div>
            <div className="kpi-label">Email Channel</div>
            <div className="kpi-value">Active (HTML)</div>
          </div>
        </div>
        <div className="notif-kpi-card">
          <div className="kpi-icon-circle whatsapp"><HiChatAlt /></div>
          <div>
            <div className="kpi-label">WhatsApp Channel</div>
            <div className="kpi-value">Interactive</div>
          </div>
        </div>
      </div>

      {/* Main Tabs: In-App Feed vs Delivery Audit Logs */}
      <div className="notif-main-tabs">
        <button
          className={`notif-main-tab ${activeMainTab === 'FEED' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('FEED')}
        >
          <HiBell /> Notification Feed {unreadCount > 0 && <span className="tab-pill">{unreadCount}</span>}
        </button>
        <button
          className={`notif-main-tab ${activeMainTab === 'AUDIT' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('AUDIT')}
        >
          <HiDocumentText /> Multi-Channel Delivery Logs
        </button>
      </div>

      {/* TAB 1: NOTIFICATION FEED */}
      {activeMainTab === 'FEED' && (
        <div className="notif-feed-container">
          <div className="feed-controls-bar">
            <div className="feed-category-tabs">
              {EVENT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`feed-tab-btn ${eventCategory === tab.id ? 'active' : ''}`}
                  onClick={() => setEventCategory(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="feed-actions-group">
              {unreadCount > 0 && (
                <button className="btn-feed-action text-primary" onClick={handleMarkAllRead}>
                  <HiCheckCircle /> Mark All Read
                </button>
              )}
              {notifications.length > 0 && (
                <button className="btn-feed-action text-danger" onClick={handleClearAll}>
                  <HiTrash /> Clear All
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-secondary">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty-card">
              <div className="empty-bell-icon">🔔</div>
              <h3>No Notifications in this Category</h3>
              <p>You are all caught up! Use the Simulator above to test any lifecycle event.</p>
              <button className="btn btn-outline-primary rounded-pill px-4" onClick={() => setIsSimModalOpen(true)}>
                Open Event Simulator
              </button>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notif-feed-card ${!notif.isRead ? 'unread' : ''}`}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                >
                  {getEventIcon(notif.type)}
                  <div className="feed-card-main">
                    <div className="feed-card-header">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <strong className="feed-card-title">{notif.title}</strong>
                        {getChannelBadge(notif.channel)}
                        {!notif.isRead && <span className="badge-new">NEW</span>}
                      </div>
                      <span className="feed-card-time">
                        {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="feed-card-message">{notif.message}</p>

                    <div className="feed-card-footer">
                      {notif.linkUrl && (
                        <Link to={notif.linkUrl} className="feed-action-link" onClick={(e) => e.stopPropagation()}>
                          View Related Resource <HiExternalLink />
                        </Link>
                      )}
                      {!notif.isRead && (
                        <button
                          className="btn-mark-read"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notif.id);
                          }}
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MULTI-CHANNEL DELIVERY AUDIT LOGS */}
      {activeMainTab === 'AUDIT' && (
        <div className="notif-audit-container">
          <div className="audit-controls-bar">
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted fw-bold">Filter by Medium:</span>
              {['ALL', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'IN_APP'].map((ch) => (
                <button
                  key={ch}
                  className={`audit-filter-btn ${channelFilter === ch ? 'active' : ''}`}
                  onClick={() => setChannelFilter(ch)}
                >
                  {ch}
                </button>
              ))}
            </div>
            <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={fetchDeliveryLogs}>
              <HiRefresh /> Refresh Logs
            </button>
          </div>

          {logsLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-secondary">Loading delivery audit log...</p>
            </div>
          ) : deliveryLogs.length === 0 ? (
            <div className="notif-empty-card">
              <h3>No Delivery Records Found</h3>
              <p>Trigger an event via the Simulator or check back after making a purchase or filing a claim.</p>
            </div>
          ) : (
            <div className="audit-table-wrapper">
              <table className="table table-hover audit-table mb-0">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Event Type</th>
                    <th>Recipient</th>
                    <th>Subject & Snippet</th>
                    <th>Status</th>
                    <th>Dispatched At</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{getChannelBadge(log.channel)}</td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {log.eventType}
                        </span>
                      </td>
                      <td className="font-monospace small">{log.recipient}</td>
                      <td>
                        <strong className="d-block text-dark">{log.subject}</strong>
                        <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: '340px' }}>
                          {log.contentSnippet}
                        </small>
                      </td>
                      <td>
                        <span className={`status-pill ${log.status.toLowerCase()}`}>
                          {log.status === 'DELIVERED' ? '✓ Delivered' : log.status}
                        </span>
                      </td>
                      <td className="small text-muted text-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Interactive Modals */}
      <NotificationPreferencesModal
        isOpen={isPrefModalOpen}
        onClose={() => setIsPrefModalOpen(false)}
        onUpdated={() => fetchNotifications()}
      />

      <NotificationSimulatorModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        onDispatched={() => {
          fetchNotifications();
          if (activeMainTab === 'AUDIT') fetchDeliveryLogs();
        }}
      />
    </div>
  );
}
