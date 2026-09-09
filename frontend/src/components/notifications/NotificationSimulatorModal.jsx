import React, { useState } from 'react';
import { 
  HiX, 
  HiPaperAirplane, 
  HiMail, 
  HiDeviceMobile, 
  HiChatAlt, 
  HiBell, 
  HiCheckCircle,
  HiShieldCheck
} from 'react-icons/hi';
import api from '../../services/api/axios';
import './NotificationSimulatorModal.css';

const EVENTS = [
  { id: 'OTP', label: '1. One-Time Passcode (OTP)', icon: '🔐' },
  { id: 'PURCHASE', label: '2. Policy Purchase & Issuance', icon: '🎉' },
  { id: 'RENEWAL', label: '3. Renewal Reminder & Expiry', icon: '⏳' },
  { id: 'CLAIM_UPDATE', label: '4. Claim Status Milestone', icon: '📋' },
  { id: 'PAYMENT_SUCCESS', label: '5. Payment Receipt & Tax Invoice', icon: '💳' },
  { id: 'REMINDER', label: '6. Application Price Lock Reminder', icon: '🔔' },
];

export default function NotificationSimulatorModal({ isOpen, onClose, onDispatched }) {
  const [selectedEvent, setSelectedEvent] = useState('OTP');
  const [previewChannel, setPreviewChannel] = useState('EMAIL');
  const [dispatching, setDispatching] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // Form states for test payloads
  const [otpCode, setOtpCode] = useState('482910');
  const [policyName, setPolicyName] = useState('Comprehensive Health Guard');
  const [claimStatus, setClaimStatus] = useState('APPROVED');
  const [claimAmount, setClaimAmount] = useState('3200');
  const [paymentAmount, setPaymentAmount] = useState('450');

  if (!isOpen) return null;

  const handleDispatch = async () => {
    setDispatching(true);
    setLastResult(null);

    let data = {};
    if (selectedEvent === 'OTP') {
      data = { otpCode: otpCode || Math.floor(100000 + Math.random() * 900000) };
    } else if (selectedEvent === 'PURCHASE') {
      data = {
        policyName,
        provider: 'Care Health Insurance',
        policyNumber: 'POL-' + Math.floor(100000 + Math.random() * 900000),
        coverageAmount: 500000,
        premium: paymentAmount,
        transactionRef: 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      };
    } else if (selectedEvent === 'RENEWAL') {
      data = {
        policyName,
        policyNumber: 'POL-398214',
        expiryDate: '24 Sep 2026',
        premium: paymentAmount,
        renewalPremium: Math.round(Number(paymentAmount) * 0.9),
      };
    } else if (selectedEvent === 'CLAIM_UPDATE') {
      data = {
        claimId: 'CLM-' + Math.floor(1000 + Math.random() * 9000),
        claimStatus,
        policyName,
        amount: claimAmount,
        notes: claimStatus === 'APPROVED' ? 'Hospital bills verified against cashless network.' : 'Awaiting additional medical discharge summary.',
      };
    } else if (selectedEvent === 'PAYMENT_SUCCESS') {
      data = {
        amount: paymentAmount,
        currency: 'USD',
        transactionRef: 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        paymentMethod: 'UPI / Net Banking',
        policyName,
      };
    } else if (selectedEvent === 'REMINDER') {
      data = {
        title: '30-Day Premium Lock Expiring',
        message: 'Your guaranteed premium lock for Term Life Platinum will expire in 3 days. Complete proposal checkout to secure this rate.',
        linkUrl: '/proposals',
      };
    }

    try {
      const res = await api.post('/notifications/test-dispatch', {
        eventType: selectedEvent,
        data,
        forceAllChannels: true,
      });

      setLastResult(res.data);
      if (onDispatched) onDispatched(res.data);
    } catch (err) {
      alert('Failed to dispatch: ' + (err.response?.data?.message || err.message));
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="notif-modal-overlay" onClick={onClose}>
      <div className="simulator-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="notif-modal-header">
          <div>
            <h3>🚀 Multi-Channel Event Simulator</h3>
            <p>Trigger and preview any of the 6 core events across Email, SMS, WhatsApp, Push & In-App.</p>
          </div>
          <button className="notif-close-btn" onClick={onClose} aria-label="Close">
            <HiX />
          </button>
        </div>

        <div className="simulator-body">
          {/* Left Column: Event Selection & Payload Parameters */}
          <div className="simulator-left">
            <label className="sim-field-label">Select Event Trigger</label>
            <div className="sim-event-selector">
              {EVENTS.map((ev) => (
                <button
                  key={ev.id}
                  className={`sim-event-btn ${selectedEvent === ev.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedEvent(ev.id);
                    setLastResult(null);
                  }}
                >
                  <span className="sim-event-icon">{ev.icon}</span>
                  <span>{ev.label}</span>
                </button>
              ))}
            </div>

            <div className="sim-payload-editor">
              <label className="sim-field-label">Payload Test Data</label>
              {selectedEvent === 'OTP' && (
                <div className="mb-2">
                  <span className="text-muted small">Verification Code</span>
                  <input
                    type="text"
                    className="form-control form-control-sm mt-1"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="e.g. 482910"
                  />
                </div>
              )}

              {(selectedEvent === 'PURCHASE' || selectedEvent === 'RENEWAL' || selectedEvent === 'CLAIM_UPDATE') && (
                <div className="mb-2">
                  <span className="text-muted small">Policy Plan Name</span>
                  <input
                    type="text"
                    className="form-control form-control-sm mt-1"
                    value={policyName}
                    onChange={(e) => setPolicyName(e.target.value)}
                  />
                </div>
              )}

              {selectedEvent === 'CLAIM_UPDATE' && (
                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <span className="text-muted small">Claim Status</span>
                    <select
                      className="form-select form-select-sm mt-1"
                      value={claimStatus}
                      onChange={(e) => setClaimStatus(e.target.value)}
                    >
                      <option value="IN_REVIEW">IN_REVIEW</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="SETTLED">SETTLED</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <span className="text-muted small">Claim Amount ($)</span>
                    <input
                      type="number"
                      className="form-control form-control-sm mt-1"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {(selectedEvent === 'PAYMENT_SUCCESS' || selectedEvent === 'PURCHASE') && (
                <div className="mb-2">
                  <span className="text-muted small">Amount ($)</span>
                  <input
                    type="number"
                    className="form-control form-control-sm mt-1"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
              )}

              {selectedEvent === 'REMINDER' && (
                <div className="text-muted small p-2 bg-light rounded">
                  Will trigger a 30-day price lock guarantee notice linking to /proposals.
                </div>
              )}
            </div>

            <button
              className="btn btn-primary w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 mt-auto"
              onClick={handleDispatch}
              disabled={dispatching}
            >
              <HiPaperAirplane />
              {dispatching ? 'Dispatching Multi-Channel...' : 'Dispatch Across All Channels'}
            </button>

            {lastResult && (
              <div className="sim-dispatch-success alert alert-success mt-3 py-2 px-3 mb-0 small">
                <strong><HiCheckCircle /> Dispatched Successfully!</strong>
                <div className="mt-1">
                  Channels: {lastResult.dispatchedChannels?.join(', ')}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Interactive Live Channel Previews */}
          <div className="simulator-right">
            <div className="sim-preview-tabs">
              <button
                className={`sim-preview-tab ${previewChannel === 'EMAIL' ? 'active' : ''}`}
                onClick={() => setPreviewChannel('EMAIL')}
              >
                <HiMail /> HTML Email
              </button>
              <button
                className={`sim-preview-tab ${previewChannel === 'WHATSAPP' ? 'active' : ''}`}
                onClick={() => setPreviewChannel('WHATSAPP')}
              >
                <HiChatAlt /> WhatsApp
              </button>
              <button
                className={`sim-preview-tab ${previewChannel === 'SMS' ? 'active' : ''}`}
                onClick={() => setPreviewChannel('SMS')}
              >
                <HiDeviceMobile /> SMS
              </button>
              <button
                className={`sim-preview-tab ${previewChannel === 'PUSH' ? 'active' : ''}`}
                onClick={() => setPreviewChannel('PUSH')}
              >
                <HiBell /> Web Push
              </button>
            </div>

            <div className="sim-preview-display">
              {/* 1. EMAIL PREVIEW */}
              {previewChannel === 'EMAIL' && (
                <div className="mockup-email">
                  <div className="mockup-email-chrome">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                    <span className="email-subject-line">
                      Subject: {selectedEvent === 'OTP' ? `🔐 Your PolicySphere Verification Code: ${otpCode}` :
                                selectedEvent === 'PURCHASE' ? `🎉 Policy Issued: ${policyName}` :
                                selectedEvent === 'RENEWAL' ? `⏳ Renewal Notice: ${policyName} expires soon` :
                                selectedEvent === 'CLAIM_UPDATE' ? `📋 Claim Status Update: ${claimStatus}` :
                                selectedEvent === 'PAYMENT_SUCCESS' ? `💳 Payment Receipt: $${paymentAmount} Successful` :
                                '🔔 Reminder: 30-Day Premium Lock Expiring'}
                    </span>
                  </div>
                  <div className="mockup-email-content">
                    <div className="email-header-banner">
                      <h4>🛡️ PolicySphere</h4>
                      <small>Enterprise Digital Insurance</small>
                    </div>
                    <div className="email-inner-body">
                      {selectedEvent === 'OTP' && (
                        <div className="text-center py-2">
                          <h5>One-Time Verification Code</h5>
                          <p className="small text-muted">Use this code to securely verify your identity on PolicySphere.</p>
                          <div className="otp-box-display">{otpCode}</div>
                          <p className="small text-muted">⏱️ Code expires in 10 minutes. Never share this code.</p>
                        </div>
                      )}

                      {selectedEvent === 'PURCHASE' && (
                        <div>
                          <h5>Policy Issuance Confirmation</h5>
                          <p className="small">Your policy <strong>{policyName}</strong> is active!</p>
                          <div className="mock-details-box">
                            <div><span>Coverage:</span> <strong>$500,000</strong></div>
                            <div><span>Premium:</span> <strong>${paymentAmount}/yr</strong></div>
                            <div><span>Insurer:</span> <strong>Care Health Insurance</strong></div>
                          </div>
                          <div className="text-center mt-3">
                            <span className="btn-email-cta">View Policy & Download e-Card</span>
                          </div>
                        </div>
                      )}

                      {selectedEvent === 'RENEWAL' && (
                        <div>
                          <h5>Policy Renewal Advisory</h5>
                          <p className="small">Your policy is due for annual renewal on <strong>24 Sep 2026</strong>.</p>
                          <div className="mock-details-box">
                            <div><span>Plan:</span> <strong>{policyName}</strong></div>
                            <div><span>NCB Discount:</span> <strong className="text-success">10% Applied</strong></div>
                            <div><span>Renewal Premium:</span> <strong>${Math.round(Number(paymentAmount) * 0.9)}</strong></div>
                          </div>
                          <div className="text-center mt-3">
                            <span className="btn-email-cta">1-Click Renew Now</span>
                          </div>
                        </div>
                      )}

                      {selectedEvent === 'CLAIM_UPDATE' && (
                        <div>
                          <h5>Claim Milestone: <span className="text-primary">{claimStatus}</span></h5>
                          <p className="small">Official surveyor assessment update on your claim application.</p>
                          <div className="mock-details-box">
                            <div><span>Status:</span> <strong className="badge bg-primary">{claimStatus}</strong></div>
                            <div><span>Claim Amount:</span> <strong>${claimAmount}</strong></div>
                            <div><span>Surveyor Assessment:</span> <em>Bills verified against cashless tariff.</em></div>
                          </div>
                          <div className="text-center mt-3">
                            <span className="btn-email-cta">Open Claims Portal</span>
                          </div>
                        </div>
                      )}

                      {selectedEvent === 'PAYMENT_SUCCESS' && (
                        <div>
                          <h5>Payment Receipt Confirmed</h5>
                          <p className="small">Thank you! Your premium payment has been credited.</p>
                          <div className="mock-details-box">
                            <div><span>Amount Paid:</span> <strong className="text-success">${paymentAmount} USD</strong></div>
                            <div><span>Payment Method:</span> <strong>UPI / Card</strong></div>
                            <div><span>Tax Exemption:</span> <strong>Eligible under Section 80D</strong></div>
                          </div>
                          <div className="text-center mt-3">
                            <span className="btn-email-cta">Download Tax Invoice</span>
                          </div>
                        </div>
                      )}

                      {selectedEvent === 'REMINDER' && (
                        <div>
                          <h5>30-Day Premium Lock Expiring</h5>
                          <p className="small">Your locked premium rate of ${paymentAmount}/yr will expire in 3 days.</p>
                          <div className="text-center mt-3">
                            <span className="btn-email-cta">Resume Digital Application</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. WHATSAPP PREVIEW */}
              {previewChannel === 'WHATSAPP' && (
                <div className="mockup-whatsapp">
                  <div className="whatsapp-topbar">
                    <span className="wa-avatar">PS</span>
                    <div>
                      <strong>PolicySphere Verified</strong>
                      <small>Official Business Account</small>
                    </div>
                  </div>
                  <div className="whatsapp-chat-area">
                    <div className="whatsapp-bubble">
                      {selectedEvent === 'OTP' && (
                        <>
                          <div className="wa-bubble-header">🛡️ PolicySphere Security</div>
                          <div className="wa-bubble-text">
                            Hello Customer,<br/><br/>
                            Your PolicySphere verification code is *{otpCode}*.<br/><br/>
                            ⏱️ Valid for 10 minutes.<br/>
                            ⚠️ Do not share this security code with anyone.
                          </div>
                          <div className="wa-buttons">
                            <button className="wa-btn">📋 Copy OTP Code</button>
                          </div>
                        </>
                      )}

                      {selectedEvent === 'PURCHASE' && (
                        <>
                          <div className="wa-bubble-header">🎉 Policy Issued & Active!</div>
                          <div className="wa-bubble-text">
                            Dear Customer,<br/><br/>
                            Your insurance plan *{policyName}* has been issued and is now active on PolicySphere.<br/><br/>
                            🛡️ *Coverage:* $500,000<br/>
                            💳 *Premium:* ${paymentAmount}/yr<br/>
                            🏢 *Provider:* Care Health
                          </div>
                          <div className="wa-buttons">
                            <button className="wa-btn">📥 Download Policy Card</button>
                            <button className="wa-btn">💬 Chat with Advisor</button>
                          </div>
                        </>
                      )}

                      {selectedEvent === 'RENEWAL' && (
                        <>
                          <div className="wa-bubble-header">⏳ Policy Renewal Due</div>
                          <div className="wa-bubble-text">
                            Hello Customer,<br/><br/>
                            Your policy *{policyName}* expires on *24 Sep 2026*.<br/><br/>
                            💰 *Renewal Premium:* ${Math.round(Number(paymentAmount) * 0.9)}<br/>
                            🎁 *NCB Bonus:* 10% Discount Applied
                          </div>
                          <div className="wa-buttons">
                            <button className="wa-btn">⚡ 1-Click Renew Now</button>
                          </div>
                        </>
                      )}

                      {selectedEvent === 'CLAIM_UPDATE' && (
                        <>
                          <div className="wa-bubble-header">📋 Claim Status: {claimStatus}</div>
                          <div className="wa-bubble-text">
                            Dear Customer,<br/><br/>
                            Your claim for *{policyName}* is updated to *{claimStatus}* for *${claimAmount}*.<br/><br/>
                            Surveyor remarks updated in claims portal.
                          </div>
                          <div className="wa-buttons">
                            <button className="wa-btn">🔍 View Claim Details</button>
                          </div>
                        </>
                      )}

                      {selectedEvent === 'PAYMENT_SUCCESS' && (
                        <>
                          <div className="wa-bubble-header">💳 Payment Received</div>
                          <div className="wa-bubble-text">
                            Dear Customer,<br/><br/>
                            Your payment of *${paymentAmount}* was processed successfully.<br/><br/>
                            Receipt & Section 80D tax certificate available for instant download.
                          </div>
                          <div className="wa-buttons">
                            <button className="wa-btn">📄 Download Tax Receipt</button>
                          </div>
                        </>
                      )}

                      {selectedEvent === 'REMINDER' && (
                        <>
                          <div className="wa-bubble-header">🔔 Proposal Price Lock Reminder</div>
                          <div className="wa-bubble-text">
                            Your 30-day price guarantee expires in 3 days. Complete proposal before premium resets.
                          </div>
                          <div className="wa-buttons">
                            <button className="wa-btn">🚀 Resume Proposal Wizard</button>
                          </div>
                        </>
                      )}
                      <div className="wa-bubble-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SMS PREVIEW */}
              {previewChannel === 'SMS' && (
                <div className="mockup-phone">
                  <div className="phone-screen">
                    <div className="phone-notch"></div>
                    <div className="phone-sms-header">
                      <span>Sender: POLSPH</span>
                      <small>Transactional SMS Gateway</small>
                    </div>
                    <div className="phone-sms-bubble">
                      {selectedEvent === 'OTP' && `[PolicySphere] Your verification OTP is ${otpCode}. Valid for 10 minutes. Do NOT share this code with anyone. Ref: PS-9104`}
                      {selectedEvent === 'PURCHASE' && `[PolicySphere] Congratulations! Policy #POL-89104 for ${policyName} is active. Cover: $500,000. Download card: https://policysphere.com/dashboard`}
                      {selectedEvent === 'RENEWAL' && `[PolicySphere] Alert: Your policy #POL-89104 expires on 24 Sep. Renew before expiry to protect your 10% NCB bonus: https://policysphere.com/dashboard`}
                      {selectedEvent === 'CLAIM_UPDATE' && `[PolicySphere] Claim #CLM-2026 status updated to ${claimStatus} ($${claimAmount}). View details: https://policysphere.com/claims`}
                      {selectedEvent === 'PAYMENT_SUCCESS' && `[PolicySphere] Received $${paymentAmount} for ${policyName}. Your payment is confirmed. Receipt: https://policysphere.com/billing`}
                      {selectedEvent === 'REMINDER' && `[PolicySphere] Reminder: Your 30-day premium lock for Term Life expires in 3 days. Resume application: https://policysphere.com/proposals`}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. PUSH PREVIEW */}
              {previewChannel === 'PUSH' && (
                <div className="mockup-push-container">
                  <div className="mockup-push-card">
                    <div className="push-card-header">
                      <span className="push-brand-icon">🛡️</span>
                      <span className="push-app-name">PolicySphere</span>
                      <span className="push-time">just now</span>
                    </div>
                    <div className="push-card-title">
                      {selectedEvent === 'OTP' && '🔐 Security Verification Code'}
                      {selectedEvent === 'PURCHASE' && `🎉 Policy Issued: ${policyName}`}
                      {selectedEvent === 'RENEWAL' && `⏳ Policy Renewal Due Soon`}
                      {selectedEvent === 'CLAIM_UPDATE' && `📋 Claim Status: ${claimStatus}`}
                      {selectedEvent === 'PAYMENT_SUCCESS' && `💳 Payment Confirmed: $${paymentAmount}`}
                      {selectedEvent === 'REMINDER' && `🔔 30-Day Premium Lock Expiring`}
                    </div>
                    <div className="push-card-body">
                      {selectedEvent === 'OTP' && `Your PolicySphere OTP is ${otpCode}. Valid for 10 minutes.`}
                      {selectedEvent === 'PURCHASE' && `Your policy for ${policyName} has been successfully issued.`}
                      {selectedEvent === 'RENEWAL' && `Policy #${policyName} expires in 14 days. Renew now with 1-click!`}
                      {selectedEvent === 'CLAIM_UPDATE' && `Claim #CLM-2026 has been updated to ${claimStatus}.`}
                      {selectedEvent === 'PAYMENT_SUCCESS' && `Received $${paymentAmount}. Itemized receipt ready in billing.`}
                      {selectedEvent === 'REMINDER' && `Resume your digital application before your guaranteed rate resets.`}
                    </div>
                    <div className="push-card-actions">
                      <button className="push-action-btn">Open PolicySphere</button>
                      <button className="push-action-btn dismiss">Dismiss</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="notif-modal-footer">
          <button className="btn btn-light" onClick={onClose}>
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
}
