import React, { useState, useEffect } from 'react';
import { HiX, HiCheck, HiMail, HiChatAlt, HiDeviceMobile, HiBell, HiShieldCheck } from 'react-icons/hi';
import api from '../../services/api/axios';
import './NotificationPreferencesModal.css';

export default function NotificationPreferencesModal({ isOpen, onClose, onUpdated }) {
  const [preferences, setPreferences] = useState({
    email: true,
    sms: true,
    whatsapp: true,
    push: true,
    inApp: true,
    claims: true,
    renewals: true,
    payments: true,
    reminders: true,
    marketing: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPreferences();
    }
  }, [isOpen]);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/preferences');
      if (res.data.preferences) {
        setPreferences((prev) => ({ ...prev, ...res.data.preferences }));
      }
    } catch (err) {
      console.error('Failed to load preferences', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await api.put('/notifications/preferences', preferences);
      setSavedSuccess(true);
      if (onUpdated) onUpdated(res.data.preferences);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      alert('Failed to save preferences: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notif-modal-overlay" onClick={onClose}>
      <div className="notif-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="notif-modal-header">
          <div>
            <h3>⚙️ Multi-Channel Preferences</h3>
            <p>Customize how and where PolicySphere delivers your notifications.</p>
          </div>
          <button className="notif-close-btn" onClick={onClose} aria-label="Close">
            <HiX />
          </button>
        </div>

        {loading ? (
          <div className="notif-modal-loading">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2">Loading preferences...</p>
          </div>
        ) : (
          <div className="notif-modal-body">
            {/* Communication Channels Section */}
            <div className="notif-section">
              <h4>Delivery Channels</h4>
              <p className="notif-section-desc">Select which mediums PolicySphere can use to send important updates.</p>

              <div className="notif-toggle-list">
                <div className="notif-toggle-item">
                  <div className="notif-toggle-info">
                    <span className="channel-icon email"><HiMail /></span>
                    <div>
                      <strong>Email Notifications</strong>
                      <small>Receive detailed HTML policy certificates, invoices, and renewal packs.</small>
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={preferences.email}
                      onChange={() => handleToggle('email')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="notif-toggle-item">
                  <div className="notif-toggle-info">
                    <span className="channel-icon sms"><HiDeviceMobile /></span>
                    <div>
                      <strong>SMS Alerts</strong>
                      <small>Instant security OTPs, payment receipts, and claim milestone SMS.</small>
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={preferences.sms}
                      onChange={() => handleToggle('sms')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="notif-toggle-item">
                  <div className="notif-toggle-info">
                    <span className="channel-icon whatsapp"><HiChatAlt /></span>
                    <div>
                      <strong>WhatsApp Business</strong>
                      <small>Interactive policy cards, 1-click renewal buttons, and direct support.</small>
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={preferences.whatsapp}
                      onChange={() => handleToggle('whatsapp')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="notif-toggle-item">
                  <div className="notif-toggle-info">
                    <span className="channel-icon push"><HiBell /></span>
                    <div>
                      <strong>Browser Push Notifications</strong>
                      <small>Real-time desktop/mobile browser alerts even when you are on other tabs.</small>
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={preferences.push}
                      onChange={() => handleToggle('push')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="notif-toggle-item">
                  <div className="notif-toggle-info">
                    <span className="channel-icon inapp"><HiShieldCheck /></span>
                    <div>
                      <strong>In-App Notification Feed</strong>
                      <small>Show badges and alerts in your top navigation notification bell.</small>
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={preferences.inApp}
                      onChange={() => handleToggle('inApp')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Event Category Preferences */}
            <div className="notif-section">
              <h4>Event Subscriptions</h4>
              <p className="notif-section-desc">Choose which lifecycle events trigger outgoing alerts.</p>

              <div className="notif-events-grid">
                <label className="event-checkbox-card">
                  <input
                    type="checkbox"
                    checked={preferences.claims}
                    onChange={() => handleToggle('claims')}
                  />
                  <div>
                    <strong>Claims Updates</strong>
                    <small>Surveyor assignments, approvals, and payout alerts.</small>
                  </div>
                </label>

                <label className="event-checkbox-card">
                  <input
                    type="checkbox"
                    checked={preferences.renewals}
                    onChange={() => handleToggle('renewals')}
                  />
                  <div>
                    <strong>Renewal & Expiry Notices</strong>
                    <small>Upcoming policy expiry and NCB discount preservation alerts.</small>
                  </div>
                </label>

                <label className="event-checkbox-card">
                  <input
                    type="checkbox"
                    checked={preferences.payments}
                    onChange={() => handleToggle('payments')}
                  />
                  <div>
                    <strong>Payment Receipts & Invoices</strong>
                    <small>Instant payment confirmations, refund updates, and 80D receipts.</small>
                  </div>
                </label>

                <label className="event-checkbox-card">
                  <input
                    type="checkbox"
                    checked={preferences.reminders}
                    onChange={() => handleToggle('reminders')}
                  />
                  <div>
                    <strong>Reminders & Lock Expiry</strong>
                    <small>30-day proposal price locks and pending KYC upload notices.</small>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="notif-modal-footer">
          <button className="btn btn-light" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : savedSuccess ? <>Saved <HiCheck /></> : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
