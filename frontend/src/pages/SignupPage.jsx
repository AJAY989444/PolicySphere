import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

function SignupPage() {
  const { register: formRegister, handleSubmit, formState: { errors }, watch } = useForm();
  const { user, register: registerUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const password = watch("password");

  const onSubmit = async (data) => {
    try {
      await registerUser(data);
      navigate('/');
    } catch (error) {
      // Error handled in context/api
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container card animate-fade-in-up" style={{ maxWidth: '500px' }}>
        <div className="auth-header">
          <h2>Create an Account</h2>
          <p>Join PolicySphere to find your perfect insurance</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                className="form-input"
                placeholder="John"
                {...formRegister('firstName', { required: 'Required' })}
              />
              {errors.firstName && <span className="form-error">{errors.firstName.message}</span>}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                className="form-input"
                placeholder="Doe"
                {...formRegister('lastName', { required: 'Required' })}
              />
              {errors.lastName && <span className="form-error">{errors.lastName.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              {...formRegister('email', { 
                required: 'Email is required',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email address' }
              })}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              {...formRegister('password', { 
                required: 'Password is required',
                minLength: { value: 8, message: 'Must be at least 8 characters' }
              })}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              placeholder="••••••••"
              {...formRegister('confirmPassword', { 
                required: 'Please confirm password',
                validate: value => value === password || 'Passwords do not match'
              })}
            />
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="role">I am a...</label>
            <select id="role" className="form-input" {...formRegister('role')}>
              <option value="CUSTOMER">Customer (Looking for insurance)</option>
              <option value="ADVISOR">Advisor (Selling insurance)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 'var(--space-4)' }} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: '20px', height: '20px' }}></div> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
