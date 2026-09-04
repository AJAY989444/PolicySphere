import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiBell, HiMail, HiDeviceMobile, HiShieldCheck, HiDocumentText, HiSpeakerphone } from 'react-icons/hi';
import api from '../services/api/axios';
import { useAuth } from '../context/AuthContext';
import KYCVerificationModal from '../components/profile/KYCVerificationModal';
import './ProfilePage.css';

function ProfilePage() {
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'notifications'

  const [notifPrefs, setNotifPrefs] = useState({
    email: true,
    sms: false,
    inApp: true,
    claims: true,
    renewals: true,
    marketing: false,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    }
  });

  useEffect(() => {
    const fetchProfileAndData = async () => {
      try {
        const [profileRes, kycRes, prefsRes] = await Promise.allSettled([
          api.get('/users/profile'),
          api.get('/documents/my-kyc'),
          api.get('/notifications/preferences')
        ]);
        
        if (profileRes.status === 'fulfilled') {
          const profileData = profileRes.value.data.user;
          reset({
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
          });
        }

        if (kycRes.status === 'fulfilled' && kycRes.value.data.isSubmitted) {
          setKycStatus(kycRes.value.data.kyc);
        }

        if (prefsRes.status === 'fulfilled' && prefsRes.value.data.preferences) {
          setNotifPrefs((prev) => ({ ...prev, ...prefsRes.value.data.preferences }));
        }
      } catch (error) {
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndData();
  }, [reset]);

  const onSubmit = async (data) => {
    try {
      const { firstName, lastName, phone } = data;
      const response = await api.put('/users/profile', { firstName, lastName, phone });
      
      toast.success('Profile updated successfully');
      
      if (user) {
        setUser({
          ...user,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const handlePrefToggle = (key) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const res = await api.put('/notifications/preferences', notifPrefs);
      if (res.data.preferences) {
        setNotifPrefs(res.data.preferences);
      }
      toast.success('Notification preferences updated!');
    } catch (error) {
      toast.error('Failed to update notification preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const getKycHeaderBadge = () => {
    if (user?.role === 'ADMIN' || user?.role === 'ADVISOR') {
      return (
        <span className="badge badge-primary" style={{ padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold' }}>
          🛡️ Internal Staff Account ({user.role})
        </span>
      );
    }
    if (!kycStatus || kycStatus.status === 'NOT_SUBMITTED') {
      return (
        <button 
          type="button" 
          className="btn kyc-btn-warning"
          onClick={() => setIsKycModalOpen(true)}
        >
          ⚠️ Action Required: Submit KYC
        </button>
      );
    }
    if (kycStatus.status === 'VERIFIED') {
      return (
        <span className="badge kyc-badge-verified">
          KYC Verified ✅ ({kycStatus.documentNumber})
        </span>
      );
    }
    if (kycStatus.status === 'REJECTED') {
      return (
        <button 
          type="button" 
          className="btn"
          style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', color: '#ef4444' }}
          onClick={() => setIsKycModalOpen(true)}
        >
          ❌ KYC Rejected - Resubmit
        </button>
      );
    }
    return (
      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: 'bold' }}>
        ⏳ KYC Pending Advisor Review
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container card">
        <div className="profile-header">
          <div className="profile-title-group">
            <h2>Account Settings</h2>
            <p>Manage your personal profile & notification channels</p>
          </div>
          <div className="kyc-badge-container">
            {getKycHeaderBadge()}
          </div>
        </div>

        <div className="profile-nav-tabs">
          <button
            className={`profile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Personal Info & KYC
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <HiBell /> Notification Preferences
          </button>
        </div>

        {activeTab === 'profile' ? (
          <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address (Read-only)</label>
              <input
                id="email"
                type="email"
                className="form-input"
                {...register('email')}
                disabled
              />
              <span className="form-error" style={{ color: 'var(--color-text-muted)' }}>Email address cannot be changed currently.</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  className={`form-input ${errors.firstName ? 'error' : ''}`}
                  {...register('firstName', { required: 'First name is required' })}
                />
                {errors.firstName && <span className="form-error">{errors.firstName.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  className={`form-input ${errors.lastName ? 'error' : ''}`}
                  {...register('lastName', { required: 'Last name is required' })}
                />
                {errors.lastName && <span className="form-error">{errors.lastName.message}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                className="form-input"
                placeholder="+1 (555) 000-0000"
                {...register('phone')}
              />
            </div>

            {kycStatus && (
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0 }}>KYC Document Submission Status</h4>
                  <span style={{ 
                    fontWeight: 'bold', 
                    fontSize: '0.85rem',
                    color: kycStatus.status === 'VERIFIED' ? '#10b981' : kycStatus.status === 'REJECTED' ? '#ef4444' : '#60a5fa' 
                  }}>
                    {kycStatus.status === 'VERIFIED' ? '✅ Approved' : kycStatus.status === 'REJECTED' ? '❌ Rejected' : '⏳ Pending Review'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                  Document: <strong>{kycStatus.documentType}</strong> | Card No: <strong>{kycStatus.documentNumber}</strong><br />
                  Status Note: <em>{kycStatus.notes || 'Awaiting Advisor Review'}</em>
                </p>
              </div>
            )}

            <div className="form-actions">
              {user?.role !== 'ADMIN' && user?.role !== 'ADVISOR' && (!kycStatus || kycStatus.status === 'REJECTED') && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsKycModalOpen(true)}
                >
                  🪪 Upload ID for Advisor Review
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="notification-preferences-panel">
            <div className="pref-section">
              <h3>Communication Channels</h3>
              <p className="pref-subtitle">Choose how you want to receive PolicySphere alerts</p>

              <div className="pref-toggle-list">
                <div className="pref-toggle-item">
                  <div className="pref-info">
                    <HiMail className="pref-icon" />
                    <div>
                      <strong>Email Notifications</strong>
                      <p>Receive policy schedules, receipts, and important updates via email</p>
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifPrefs.email}
                      onChange={() => handlePrefToggle('email')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="pref-toggle-item">
                  <div className="pref-info">
                    <HiDeviceMobile className="pref-icon" />
                    <div>
                      <strong>SMS Alerts</strong>
                      <p>Get instant text messages for urgent claim and policy updates</p>
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifPrefs.sms}
                      onChange={() => handlePrefToggle('sms')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="pref-toggle-item">
                  <div className="pref-info">
                    <HiBell className="pref-icon" />
                    <div>
                      <strong>In-App Notifications</strong>
                      <p>Show notifications in the top bar header when logged in</p>
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifPrefs.inApp}
                      onChange={() => handlePrefToggle('inApp')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pref-section" style={{ marginTop: '2rem' }}>
              <h3>Notification Categories</h3>
              <p className="pref-subtitle">Select which alert types you would like to receive</p>

              <div className="pref-toggle-list">
                <div className="pref-toggle-item">
                  <div className="pref-info">
                    <HiDocumentText className="pref-icon claim-icon" />
                    <div>
                      <strong>Claim Progress & Updates</strong>
                      <p>Alerts regarding claim status changes, approvals, and payouts</p>
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifPrefs.claims}
                      onChange={() => handlePrefToggle('claims')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="pref-toggle-item">
                  <div className="pref-info">
                    <HiShieldCheck className="pref-icon policy-icon" />
                    <div>
                      <strong>Policy Renewals & Expirations</strong>
                      <p>Reminders before policy coverage expires or renewal discounts apply</p>
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifPrefs.renewals}
                      onChange={() => handlePrefToggle('renewals')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="pref-toggle-item">
                  <div className="pref-info">
                    <HiSpeakerphone className="pref-icon promo-icon" />
                    <div>
                      <strong>Promotions & Special Offers</strong>
                      <p>Exclusive partner discounts, seasonal offers, and news</p>
                    </div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifPrefs.marketing}
                      onChange={() => handlePrefToggle('marketing')}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '2rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSavePreferences}
                disabled={savingPrefs}
              >
                {savingPrefs ? 'Saving Preferences...' : 'Save Notification Preferences'}
              </button>
            </div>
          </div>
        )}
      </div>

      <KYCVerificationModal
        isOpen={isKycModalOpen}
        onClose={() => setIsKycModalOpen(false)}
        onVerificationSuccess={(kycData) => setKycStatus(kycData)}
      />
    </div>
  );
}

export default ProfilePage;
