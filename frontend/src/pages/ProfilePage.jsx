import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api/axios';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

function ProfilePage() {
  const { user, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/profile');
        const profileData = response.data.user;
        reset({
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
        });
      } catch (error) {
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [reset]);

  const onSubmit = async (data) => {
    try {
      // Don't send email as it's read-only for now
      const { firstName, lastName, phone } = data;
      const response = await api.put('/users/profile', { firstName, lastName, phone });
      
      toast.success('Profile updated successfully');
      
      // Update global user context with new name
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
          <h2>My Profile</h2>
          <p>Manage your personal information</p>
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

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
