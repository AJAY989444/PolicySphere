import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { HiEye, HiEyeOff, HiKey, HiX } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api/axios';
import toast from 'react-hot-toast';
import './AuthPages.css';

function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password Modal State
  // Step 1: Request OTP -> Step 2: Verify OTP -> Step 3: Enter New Password
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = Email, 2 = Verify OTP, 3 = New Password
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const onSubmit = async (data) => {
    try {
      await login(data);
      navigate('/');
    } catch (error) {
      // Error handled in context/api
    }
  };

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setResetLoading(true);
    try {
      const res = await api.post('/auth/request-otp', { email: resetEmail });
      if (res.data.success) {
        toast.success(res.data.message || 'OTP sent to your email!');
        setResetStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Please check your email.');
    } finally {
      setResetLoading(false);
    }
  };

  // Step 2: Verify OTP Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP sent to your email');
      return;
    }

    setResetLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email: resetEmail, otp });
      if (res.data.success) {
        toast.success('OTP verified successfully!');
        setResetStep(3); // Unlock new password input
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setResetLoading(false);
    }
  };

  // Step 3: Update to New Password
  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    setResetLoading(true);
    try {
      const res = await api.post('/auth/reset-password-final', {
        email: resetEmail,
        newPassword
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Password updated successfully!');
        closeForgotModal();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setResetLoading(false);
    }
  };

  const closeForgotModal = () => {
    setIsForgotOpen(false);
    setResetStep(1);
    setResetEmail('');
    setOtp('');
    setNewPassword('');
  };

  return (
    <div className="auth-page">
      <div className="auth-container card animate-fade-in-up">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your PolicySphere account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              {...register('email', { 
                required: 'Email is required',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' }
              })}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <div className="label-with-link">
              <label className="form-label" htmlFor="password">Password</label>
              <button 
                type="button" 
                className="forgot-password-link"
                onClick={() => setIsForgotOpen(true)}
              >
                Forgot password?
              </button>
            </div>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <HiEyeOff /> : <HiEye />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 'var(--space-4)' }} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: '20px', height: '20px' }}></div> : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup">Create one now</Link></p>
        </div>
      </div>

      {/* Forgot Password OTP Verification Modal */}
      {isForgotOpen && (
        <div className="modal-backdrop">
          <div className="forgot-modal-content card animate-fade-in-up">
            <div className="forgot-modal-header">
              <div className="icon-badge">
                <HiKey />
              </div>
              <h3>Reset Your Password</h3>
              <button className="close-btn" onClick={closeForgotModal}>
                <HiX />
              </button>
            </div>

            {/* STEP 1: Enter Email */}
            {resetStep === 1 && (
              <>
                <p className="forgot-modal-subtitle">
                  Enter your account email address below. We will send a 6-digit OTP verification code to your email inbox.
                </p>

                <form onSubmit={handleSendOtp} className="auth-form mt-4">
                  <div className="form-group">
                    <label className="form-label">Account Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="modal-actions-row">
                    <button type="button" className="btn btn-secondary" onClick={closeForgotModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={resetLoading}>
                      {resetLoading ? 'Sending OTP...' : 'Send OTP Code'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* STEP 2: Enter & Verify OTP */}
            {resetStep === 2 && (
              <>
                <p className="forgot-modal-subtitle">
                  Enter the 6-digit OTP code sent to your email <strong>{resetEmail}</strong>.
                </p>

                <form onSubmit={handleVerifyOtp} className="auth-form mt-4">
                  <div className="form-group">
                    <label className="form-label">6-Digit OTP Code</label>
                    <input
                      type="text"
                      className="form-input otp-input"
                      placeholder="• • • • • •"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="modal-actions-row">
                    <button type="button" className="btn btn-secondary" onClick={() => setResetStep(1)}>
                      Back
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={resetLoading}>
                      {resetLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* STEP 3: Create New Password (ONLY after OTP is verified) */}
            {resetStep === 3 && (
              <>
                <p className="forgot-modal-subtitle">
                  ✅ <strong>OTP Verified!</strong> Please enter your new password below.
                </p>

                <form onSubmit={handleSetNewPassword} className="auth-form mt-4">
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Minimum 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <HiEyeOff /> : <HiEye />}
                      </button>
                    </div>
                  </div>

                  <div className="modal-actions-row">
                    <button type="submit" className="btn btn-primary" disabled={resetLoading}>
                      {resetLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
