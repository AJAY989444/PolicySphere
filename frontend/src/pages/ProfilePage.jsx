import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api/axios';
import { useAuth } from '../context/AuthContext';
import KYCVerificationModal from '../components/profile/KYCVerificationModal';
import './ProfilePage.css';

function ProfilePage() {
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    }
  });

  useEffect(() => {
    const fetchProfileAndKyc = async () => {
      try {
        const [profileRes, kycRes] = await Promise.allSettled([
          api.get('/users/profile'),
          api.get('/documents/my-kyc')
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
      } catch (error) {
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndKyc();
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
            <h2>My Profile</h2>
            <p>Manage your personal information & KYC compliance</p>
          </div>
          <div className="kyc-badge-container">
            {getKycHeaderBadge()}
          </div>
        </div>

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
