import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api/axios';
import './KYCVerificationModal.css';

function KYCVerificationModal({ isOpen, onClose, onVerificationSuccess }) {
  const [docType, setDocType] = useState('PAN');
  const [docNumber, setDocNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmitKyc = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please upload your identity card photo or PDF.');
      return;
    }
    if (!docNumber.trim()) {
      toast.error(`Please enter your ${docType} card number.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('documentType', docType);
      formData.append('documentNumber', docNumber.trim());
      formData.append('file', selectedFile);

      const response = await api.post('/documents/verify-kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const kyc = response.data.kyc;
      toast.success('Identity Document submitted successfully! An Advisor will review your card.');
      
      if (onVerificationSuccess) {
        onVerificationSuccess(kyc);
      }
      onClose();
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log out and log in again.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to submit document.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="kyc-modal-overlay">
      <div className="kyc-modal-card">
        <div className="kyc-modal-header">
          <h3>🪪 Submit Identity Card for Advisor Verification</h3>
          <button className="kyc-modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmitKyc} className="kyc-modal-body">
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
            Upload a clear copy of your identity card. An authorized PolicySphere Advisor will verify your document and approve your account KYC.
          </p>

          {/* Document Type Selector */}
          <div className="doc-type-selector">
            <button
              type="button"
              className={`doc-type-btn ${docType === 'PAN' ? 'active' : ''}`}
              onClick={() => setDocType('PAN')}
            >
              💳 PAN Card
            </button>
            <button
              type="button"
              className={`doc-type-btn ${docType === 'AADHAAR' ? 'active' : ''}`}
              onClick={() => setDocType('AADHAAR')}
            >
              🆔 Aadhaar Card
            </button>
            <button
              type="button"
              className={`doc-type-btn ${docType === 'DRIVING_LICENSE' ? 'active' : ''}`}
              onClick={() => setDocType('DRIVING_LICENSE')}
            >
              🚘 Driving License
            </button>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">{docType} Document Number *</label>
            <input
              type="text"
              className="form-input"
              placeholder={docType === 'PAN' ? 'ABCDE1234F' : docType === 'AADHAAR' ? '1234-5678-9012' : 'MH1420190012345'}
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              required
            />
          </div>

          {/* Document Dropzone */}
          <div className="ocr-dropzone" style={{ padding: '2rem 1rem', marginBottom: '1.5rem' }}>
            <input
              type="file"
              id="kyc-file-input"
              accept="image/*,.pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <label htmlFor="kyc-file-input" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📄</div>
              <h4 style={{ margin: '0 0 0.25rem 0' }}>
                {selectedFile ? selectedFile.name : `Upload ${docType} Front/Back Photo`}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Click to attach JPG, PNG, or PDF file (Max 5MB)
              </p>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting to Advisor...' : '📤 Submit for Advisor Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default KYCVerificationModal;
