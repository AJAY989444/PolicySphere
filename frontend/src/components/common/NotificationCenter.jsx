import React, { useState, useEffect, useRef } from 'react';
import { 
  HiBell, 
  HiShieldCheck, 
  HiCreditCard, 
  HiDocumentText, 
  HiClock, 
  HiTrash, 
  HiCheckCircle,
  HiUser,
  HiExclamation
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api/axios';
import { useAuth } from '../../context/AuthContext';
import './NotificationCenter.css';

const TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'UNREAD', label: 'Unread' },
  { id: 'CLAIMS', label: 'Claims' },
  { id: 'POLICIES', label: 'Policies' },
];

function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user, activeTab]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get(`/notifications?category=${activeTab}`);
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const handleItemClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.linkUrl) {
      navigate(notification.linkUrl);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'CLAIM_UPDATE':
        return <HiDocumentText className="notif-icon notif-claim" />;
      case 'PAYMENT_SUCCESS':
        return <HiCreditCard className="notif-icon notif-payment" />;
      case 'POLICY_ISSUED':
      case 'RENEWAL_REMINDER':
        return <HiShieldCheck className="notif-icon notif-policy" />;
      case 'KYC_UPDATE':
        return <HiUser className="notif-icon notif-kyc" />;
      case 'PROPOSAL_LOCK_EXPIRING':
        return <HiExclamation className="notif-icon notif-warning" />;
      default:
        return <HiBell className="notif-icon notif-system" />;
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (!user) return null;

  return (
    <div className="notification-center-container" ref={dropdownRef}>
      <button
        className="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
      >
        <HiBell />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown animate-fade-in-up">
          <div className="notif-header">
            <div className="notif-title">
              <h4>Notifications</h4>
              {unreadCount > 0 && (
                <span className="unread-pill">{unreadCount} unread</span>
              )}
            </div>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button 
                  className="notif-action-btn" 
                  onClick={handleMarkAllRead} 
                  title="Mark all read"
                >
                  <HiCheckCircle /> Mark read
                </button>
              )}
              {notifications.length > 0 && (
                <button 
                  className="notif-action-btn danger" 
                  onClick={handleClearAll} 
                  title="Clear all"
                >
                  <HiTrash /> Clear
                </button>
              )}
            </div>
          </div>

          <div className="notif-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`notif-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <HiBell className="empty-bell" />
                <p>No {activeTab.toLowerCase() !== 'all' ? activeTab.toLowerCase() : ''} notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => handleItemClick(n)}
                >
                  <div className="notif-item-icon">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="notif-item-body">
                    <div className="notif-item-header">
                      <h5>{n.title}</h5>
                      <span className="notif-time">
                        <HiClock /> {formatDate(n.createdAt)}
                      </span>
                    </div>
                    <p>{n.message}</p>
                  </div>
                  {!n.isRead && (
                    <button
                      className="read-dot-btn"
                      title="Mark as read"
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                    >
                      <span className="read-dot" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
