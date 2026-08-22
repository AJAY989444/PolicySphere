import React, { useState, useEffect, useRef } from 'react';
import { HiBell, HiCheck, HiShieldCheck, HiCreditCard, HiDocumentText, HiClock } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api/axios';
import { useAuth } from '../../context/AuthContext';
import './NotificationCenter.css';

function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Polling for live notifications every 15 seconds
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

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
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
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
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  };

  const handleItemClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id, { stopPropagation: () => {} });
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
        return <HiShieldCheck className="notif-icon notif-policy" />;
      default:
        return <HiBell className="notif-icon notif-system" />;
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                <span className="unread-pill">{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <HiBell className="empty-bell" />
                <p>No notifications yet</p>
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
