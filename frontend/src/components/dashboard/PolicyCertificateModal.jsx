import React, { useState, useEffect } from 'react';
import { HiX, HiPrinter, HiDownload, HiShieldCheck, HiCheckCircle, HiQrcode } from 'react-icons/hi';
import api from '../../services/api/axios';
import './PolicyCertificateModal.css';

function PolicyCertificateModal({ isOpen, onClose, userPolicyId }) {
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userPolicyId) {
      fetchCertificate();
    }
  }, [isOpen, userPolicyId]);

  const fetchCertificate = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/policies/my-policies/${userPolicyId}/certificate`);
      setCertData(response.data);
    } catch (error) {
      console.error('Failed to load certificate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="cert-modal-content animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header Actions */}
        <div className="cert-modal-bar no-print">
          <div className="cert-bar-title">
            <HiShieldCheck className="text-primary" size={24} />
            <span>Digital Policy Certificate</span>
          </div>
          <div className="cert-bar-actions">
            <button className="btn btn-secondary btn-sm" onClick={handlePrint}>
              <HiPrinter /> Print / Save as PDF
            </button>
            <button className="close-btn" onClick={onClose}>
              <HiX />
            </button>
          </div>
        </div>

        {/* Certificate Printable Document Body */}
        {loading ? (
          <div className="cert-loading">
            <div className="spinner spinner-lg"></div>
            <p>Generating Official Policy Certificate...</p>
          </div>
        ) : certData ? (
          <div className="printable-certificate-document" id="policy-certificate-doc">
            {/* Header & Crest */}
            <div className="cert-doc-header">
              <div className="cert-brand">
                <div className="cert-logo-badge">P</div>
                <div>
                  <h2>PolicySphere</h2>
                  <span className="cert-subtitle">Digital Insurance Marketplace & Underwriting</span>
                </div>
              </div>
              <div className="cert-meta">
                <span className="cert-badge-official">OFFICIAL CERTIFICATE</span>
                <span className="cert-number">{certData.certificateNumber}</span>
              </div>
            </div>

            <div className="cert-divider"></div>

            {/* Document Title */}
            <div className="cert-title-section">
              <h1>CERTIFICATE OF INSURANCE</h1>
              <p>This certifies that the insurance policy described below has been issued to the named insured party for the specified period and coverage terms.</p>
            </div>

            {/* Grid Schedule */}
            <div className="cert-grid">
              <div className="cert-section-box">
                <h4>INSURED DETAILS</h4>
                <div className="cert-data-row">
                  <span className="label">Policyholder Name:</span>
                  <span className="val bold">{certData.userPolicy.user.firstName} {certData.userPolicy.user.lastName}</span>
                </div>
                <div className="cert-data-row">
                  <span className="label">Email Address:</span>
                  <span className="val">{certData.userPolicy.user.email}</span>
                </div>
                <div className="cert-data-row">
                  <span className="label">Registered Phone:</span>
                  <span className="val">{certData.userPolicy.user.phone || 'N/A'}</span>
                </div>
              </div>

              <div className="cert-section-box">
                <h4>COVERAGE SPECIFICATIONS</h4>
                <div className="cert-data-row">
                  <span className="label">Policy Plan Name:</span>
                  <span className="val bold text-primary">{certData.userPolicy.policy.name}</span>
                </div>
                <div className="cert-data-row">
                  <span className="label">Underwriter / Provider:</span>
                  <span className="val">{certData.userPolicy.policy.provider}</span>
                </div>
                <div className="cert-data-row">
                  <span className="label">Category:</span>
                  <span className="val category-pill">{certData.userPolicy.policy.category}</span>
                </div>
              </div>
            </div>

            {/* Dates & Coverage Financials */}
            <div className="cert-financials-table">
              <div className="fin-col">
                <span className="fin-label">SUM ASSURED / COVERAGE</span>
                <span className="fin-value font-large">${certData.userPolicy.policy.coverageAmount.toLocaleString()}</span>
              </div>
              <div className="fin-col">
                <span className="fin-label">ANNUAL PREMIUM PAID</span>
                <span className="fin-value">${certData.userPolicy.premiumPaid.toLocaleString()}</span>
              </div>
              <div className="fin-col">
                <span className="fin-label">EFFECTIVE START DATE</span>
                <span className="fin-value">{new Date(certData.userPolicy.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="fin-col">
                <span className="fin-label">EXPIRY / RENEWAL DATE</span>
                <span className="fin-value">{new Date(certData.userPolicy.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            {/* Security & Authenticity Seal Footer */}
            <div className="cert-footer">
              <div className="cert-qr-block">
                <div className="qr-placeholder">
                  <HiQrcode size={48} />
                </div>
                <div>
                  <span className="qr-label">DIGITAL VERIFICATION HASH</span>
                  <code className="qr-hash">{certData.verificationHash}</code>
                </div>
              </div>

              <div className="cert-seal-block">
                <div className="official-seal">
                  <HiShieldCheck size={36} />
                  <span>VERIFIED ORIGINAL</span>
                </div>
                <div className="sign-block">
                  <div className="signature-line">PolicySphere Registrar</div>
                  <span className="sign-label">Authorized Underwriter Signature</span>
                </div>
              </div>
            </div>

            <div className="cert-disclaimer">
              Notice: This digital certificate is issued under PolicySphere Electronic Document Standard 2026. For claims or support, present certificate number {certData.certificateNumber}.
            </div>
          </div>
        ) : (
          <div className="cert-error">Failed to generate policy certificate.</div>
        )}
      </div>
    </div>
  );
}

export default PolicyCertificateModal;
