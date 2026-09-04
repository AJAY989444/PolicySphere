import React, { useState } from 'react';
import { HiX, HiPhone, HiMail, HiUser, HiSparkles, HiCheckCircle } from 'react-icons/hi';
import api from '../../services/api/axios';
import './RequestAdvisorModal.css';

export default function RequestAdvisorModal({ isOpen, onClose, defaultCategory = 'HEALTH' }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: defaultCategory,
    estimatedBudget: '40000',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/crm/leads/public', formData);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to submit callback request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in">
      <div className="advisor-request-modal animate-fade-in-up">
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-badge">
              <HiSparkles /> Dedicated Advisor Assistance
            </span>
            <h2>Request Expert Callback</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <HiX />
          </button>
        </div>

        {submitted ? (
          <div className="modal-success-state">
            <div className="success-icon-wrap">
              <HiCheckCircle size={48} />
            </div>
            <h3>Callback Request Received!</h3>
            <p>
              A licensed PolicySphere Insurance Advisor has been assigned to your request and will contact you via
              phone/email within 1 business hour.
            </p>
            <button className="btn btn-primary btn-block" onClick={onClose}>
              Got It, Thanks!
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="advisor-request-form">
            {error && <div className="form-error-alert">{error}</div>}

            <div className="form-group">
              <label>Full Legal Name</label>
              <div className="input-with-icon">
                <HiUser className="field-icon" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <HiMail className="field-icon" />
                  <input
                    type="email"
                    required
                    placeholder="rahul@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <div className="input-with-icon">
                  <HiPhone className="field-icon" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Insurance Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="HEALTH">Health Insurance</option>
                  <option value="LIFE">Term Life Insurance</option>
                  <option value="MOTOR">Motor & Auto</option>
                  <option value="TRAVEL">International Travel</option>
                  <option value="HOME">Home & Property</option>
                </select>
              </div>

              <div className="form-group">
                <label>Target Budget (₹/yr)</label>
                <input
                  type="number"
                  placeholder="40000"
                  value={formData.estimatedBudget}
                  onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Special Instructions or Questions (Optional)</label>
              <textarea
                rows="3"
                placeholder="Specify pre-existing conditions, family members, or requested add-on riders..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              ></textarea>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Submitting Request...' : '📞 Request Free Advisor Call'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
