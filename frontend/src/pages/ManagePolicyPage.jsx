import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api/axios';
import './ManagePolicyPage.css';

function ManagePolicyPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      category: 'HEALTH',
      duration: 12,
      features: '',
    },
  });

  useEffect(() => {
    if (isEdit) {
      const fetchPolicy = async () => {
        try {
          const res = await api.get(`/admin/policies`);
          const target = res.data.find((p) => p.id === id);
          if (target) {
            setValue('name', target.name);
            setValue('provider', target.provider);
            setValue('category', target.category);
            setValue('description', target.description);
            setValue('coverageAmount', target.coverageAmount);
            setValue('premium', target.premium);
            setValue('duration', target.duration);
            setValue('features', Array.isArray(target.features) ? target.features.join(', ') : '');
          } else {
            toast.error('Policy not found');
            navigate('/admin');
          }
        } catch (err) {
          toast.error('Failed to load policy details');
        } finally {
          setLoading(false);
        }
      };
      fetchPolicy();
    }
  }, [id, isEdit, setValue, navigate]);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      const formattedFeatures = data.features
        ? data.features.split(',').map((f) => f.trim()).filter(Boolean)
        : [];

      const payload = {
        ...data,
        coverageAmount: parseFloat(data.coverageAmount),
        premium: parseFloat(data.premium),
        duration: parseInt(data.duration, 10),
        features: formattedFeatures,
      };

      if (isEdit) {
        await api.put(`/admin/policies/${id}`, payload);
        toast.success('Policy updated successfully!');
      } else {
        await api.post('/admin/policies', payload);
        toast.success('Policy created successfully!');
      }

      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save policy');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Loading policy details...</p>
      </div>
    );
  }

  return (
    <div className="manage-policy-page container">
      <div className="form-card">
        <h1>{isEdit ? 'Edit Policy' : 'Create New Policy'}</h1>
        <p className="subtitle">
          {isEdit ? 'Update details of an existing policy' : 'Add a new insurance offering to the marketplace'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Policy Name</label>
            <input
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="e.g. HealthGuard Platinum"
              {...register('name', { required: 'Policy name is required' })}
            />
            {errors.name && <span className="error-message">{errors.name.message}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Provider</label>
              <input
                type="text"
                className={`input ${errors.provider ? 'input-error' : ''}`}
                placeholder="e.g. CareHealth"
                {...register('provider', { required: 'Provider name is required' })}
              />
              {errors.provider && <span className="error-message">{errors.provider.message}</span>}
            </div>

            <div className="form-group">
              <label>Category</label>
              <select className="input" {...register('category')}>
                <option value="HEALTH">Health</option>
                <option value="LIFE">Life</option>
                <option value="MOTOR">Motor</option>
                <option value="TRAVEL">Travel</option>
                <option value="HOME">Home</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className={`input ${errors.description ? 'input-error' : ''}`}
              rows="3"
              placeholder="Comprehensive details about the policy coverage..."
              {...register('description', { required: 'Description is required' })}
            ></textarea>
            {errors.description && <span className="error-message">{errors.description.message}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Coverage Amount ($)</label>
              <input
                type="number"
                step="0.01"
                className={`input ${errors.coverageAmount ? 'input-error' : ''}`}
                placeholder="e.g. 500000"
                {...register('coverageAmount', { required: 'Coverage amount is required' })}
              />
              {errors.coverageAmount && <span className="error-message">{errors.coverageAmount.message}</span>}
            </div>

            <div className="form-group">
              <label>Monthly Premium ($)</label>
              <input
                type="number"
                step="0.01"
                className={`input ${errors.premium ? 'input-error' : ''}`}
                placeholder="e.g. 99"
                {...register('premium', { required: 'Premium is required' })}
              />
              {errors.premium && <span className="error-message">{errors.premium.message}</span>}
            </div>

            <div className="form-group">
              <label>Duration (Months)</label>
              <input
                type="number"
                className={`input ${errors.duration ? 'input-error' : ''}`}
                placeholder="e.g. 12"
                {...register('duration', { required: 'Duration is required' })}
              />
              {errors.duration && <span className="error-message">{errors.duration.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Features (comma-separated)</label>
            <input
              type="text"
              className="input"
              placeholder="Cashless Hospitalization, Zero Deductible, Free Annual Checkup"
              {...register('features')}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/admin')}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Update Policy' : 'Create Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ManagePolicyPage;
