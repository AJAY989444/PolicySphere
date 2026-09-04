import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api/axios';
import { useAuth } from '../context/AuthContext';
import './ProposalWizardPage.css';

const STEPS = [
  { id: 1, label: 'Proposer Details' },
  { id: 2, label: 'Insured Members & Medical' },
  { id: 3, label: 'Nominee Declaration' },
  { id: 4, label: 'Underwriting & Price Lock' },
];

export default function ProposalWizardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { proposalId } = useParams(); // If editing an existing proposal
  const { user } = useAuth();

  const queryPolicyId = searchParams.get('policyId');

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [policy, setPolicy] = useState(null);
  const [proposalData, setProposalData] = useState({
    id: proposalId || null,
    policyId: queryPolicyId || '',
    proposerInfo: {
      fullName: user ? `${user.firstName} ${user.lastName}` : '',
      email: user ? user.email : '',
      phone: user ? user.phone || '' : '',
      occupation: 'Salaried Professional',
      annualIncome: '$80,000 - $120,000',
    },
    membersInfo: [
      { name: user ? `${user.firstName} ${user.lastName}` : 'Self', relation: 'Self', age: '32', gender: 'Male' }
    ],
    medicalHistory: {
      hasPreExisting: false,
      preExistingDetails: '',
      tobaccoOrAlcohol: false,
      recentSurgeries: false,
    },
    nomineeInfo: {
      fullName: '',
      relation: 'Spouse',
      age: '',
      allocationPercent: '100',
    },
    lockedPremium: null,
    premiumExpiresAt: null,
    underwritingFlags: null,
    status: 'DRAFT',
  });

  // Load existing proposal draft or selected policy details
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (proposalId) {
          const res = await api.get(`/proposals/${proposalId}`);
          if (res.data.success) {
            const prop = res.data.proposal;
            setProposalData({
              id: prop.id,
              policyId: prop.policyId,
              proposerInfo: prop.proposerInfo || {},
              membersInfo: Array.isArray(prop.membersInfo) && prop.membersInfo.length ? prop.membersInfo : [{ name: '', relation: 'Self', age: '', gender: 'Male' }],
              medicalHistory: prop.medicalHistory || {},
              nomineeInfo: prop.nomineeInfo || {},
              lockedPremium: prop.lockedPremium,
              premiumExpiresAt: prop.premiumExpiresAt,
              underwritingFlags: prop.underwritingFlags,
              status: prop.status,
            });
            setPolicy(prop.policy);
            setCurrentStep(prop.step || 1);
          }
        } else if (queryPolicyId) {
          const res = await api.get(`/policies/${queryPolicyId}`);
          setPolicy(res.data.policy);
          setProposalData((prev) => ({ ...prev, policyId: queryPolicyId }));
        }
      } catch (err) {
        console.error('Failed to load application details', err);
        setError(err.response?.data?.message || 'Failed to initialize proposal wizard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [proposalId, queryPolicyId]);

  const handleProposerChange = (e) => {
    const { name, value } = e.target;
    setProposalData((prev) => ({
      ...prev,
      proposerInfo: { ...prev.proposerInfo, [name]: value },
    }));
  };

  const handleMemberChange = (index, field, value) => {
    let sanitizedValue = value;
    if (field === 'age') {
      if (value !== '' && Number(value) <= 0) {
        sanitizedValue = '';
      }
    }
    const updatedMembers = [...proposalData.membersInfo];
    updatedMembers[index][field] = sanitizedValue;
    setProposalData((prev) => ({ ...prev, membersInfo: updatedMembers }));
  };

  const addMemberRow = () => {
    setProposalData((prev) => ({
      ...prev,
      membersInfo: [...prev.membersInfo, { name: '', relation: 'Spouse', age: '', gender: 'Female' }],
    }));
  };

  const removeMemberRow = (index) => {
    if (proposalData.membersInfo.length <= 1) return;
    const updatedMembers = proposalData.membersInfo.filter((_, i) => i !== index);
    setProposalData((prev) => ({ ...prev, membersInfo: updatedMembers }));
  };

  const handleMedicalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProposalData((prev) => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleNomineeChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;
    if (name === 'age' || name === 'allocationPercent') {
      if (value !== '' && Number(value) <= 0) {
        sanitizedValue = '';
      }
    }
    setProposalData((prev) => ({
      ...prev,
      nomineeInfo: { ...prev.nomineeInfo, [name]: sanitizedValue },
    }));
  };

  // Save progress as Draft
  const saveDraft = async (targetStep = currentStep) => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        id: proposalData.id || undefined,
        policyId: proposalData.policyId,
        step: targetStep,
        proposerInfo: proposalData.proposerInfo,
        membersInfo: proposalData.membersInfo,
        medicalHistory: proposalData.medicalHistory,
        nomineeInfo: proposalData.nomineeInfo,
      };

      const res = await api.post('/proposals/draft', payload);
      if (res.data.success) {
        setProposalData((prev) => ({
          ...prev,
          id: res.data.proposal.id,
          lockedPremium: res.data.proposal.lockedPremium,
        }));
        return res.data.proposal;
      }
    } catch (err) {
      console.error('Save draft failed:', err);
      setError(err.response?.data?.message || 'Failed to save application draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextStep = async () => {
    const nextStep = currentStep + 1;
    const savedProp = await saveDraft(nextStep);
    if (savedProp) {
      if (currentStep === 3) {
        // Run underwriting pre-check when submitting step 3 -> 4
        submitForUnderwriting(savedProp.id);
      } else {
        setCurrentStep((prev) => Math.min(prev + 1, 4));
      }
    }
  };

  const submitForUnderwriting = async (pId) => {
    const targetId = pId || proposalData.id;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post(`/proposals/${targetId}/submit`);
      if (res.data.success) {
        setProposalData((prev) => ({
          ...prev,
          status: res.data.proposal.status,
          lockedPremium: res.data.proposal.lockedPremium,
          premiumExpiresAt: res.data.proposal.premiumExpiresAt,
          underwritingFlags: res.data.proposal.underwritingFlags,
        }));
        setCurrentStep(4);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Underwriting pre-check failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceedToCheckout = () => {
    // Navigate to payment checkout with policy context
    navigate(`/catalog?purchasePolicyId=${proposalData.policyId}&proposalId=${proposalData.id}`);
  };

  if (loading) {
    return (
      <div className="proposal-wizard-page text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3 text-light">Initializing Digital Application Wizard...</p>
      </div>
    );
  }

  return (
    <div className="proposal-wizard-page">
      <div className="wizard-header">
        <h1>Digital Insurance Application</h1>
        <p>Complete your application to lock in your premium guaranteed for 30 days.</p>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* Stepper Navigation Bar */}
      <div className="wizard-stepper">
        {STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          return (
            <button
              key={step.id}
              className={`stepper-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => isCompleted && setCurrentStep(step.id)}
            >
              <div className="step-circle">{isCompleted ? '✓' : step.id}</div>
              <span className="step-label">{step.label}</span>
            </button>
          );
        })}
      </div>

      <div className="wizard-card">
        <div className="wizard-card-header">
          <h2>{STEPS.find((s) => s.id === currentStep)?.label}</h2>
          {policy && <span className="policy-badge">{policy.name} ({policy.provider})</span>}
        </div>

        {/* STEP 1: PROPOSER DETAILS */}
        {currentStep === 1 && (
          <div className="form-grid">
            <div className="form-group">
              <label>Full Legal Name</label>
              <input
                type="text"
                name="fullName"
                className="form-input"
                value={proposalData.proposerInfo.fullName || ''}
                onChange={handleProposerChange}
                placeholder="John Doe"
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={proposalData.proposerInfo.email || ''}
                onChange={handleProposerChange}
                placeholder="john@example.com"
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                className="form-input"
                value={proposalData.proposerInfo.phone || ''}
                onChange={handleProposerChange}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="form-group">
              <label>Occupation</label>
              <select
                name="occupation"
                className="form-select"
                value={proposalData.proposerInfo.occupation || ''}
                onChange={handleProposerChange}
              >
                <option value="Salaried Professional">Salaried Professional</option>
                <option value="Self Employed / Business Owner">Self Employed / Business Owner</option>
                <option value="Healthcare / Doctor">Healthcare / Doctor</option>
                <option value="Software Engineer">Software Engineer</option>
                <option value="Student / Homemaker">Student / Homemaker</option>
              </select>
            </div>
            <div className="form-group">
              <label>Annual Income Range</label>
              <select
                name="annualIncome"
                className="form-select"
                value={proposalData.proposerInfo.annualIncome || ''}
                onChange={handleProposerChange}
              >
                <option value="Under $50,000">Under $50,000</option>
                <option value="$50,000 - $80,000">$50,000 - $80,000</option>
                <option value="$80,000 - $120,000">$80,000 - $120,000</option>
                <option value="$120,000+">$120,000+</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 2: INSURED MEMBERS & MEDICAL HISTORY */}
        {currentStep === 2 && (
          <div>
            <h4 className="mb-3 text-light">Insured Members Declaration</h4>
            <div className="members-list">
              {proposalData.membersInfo.map((member, index) => (
                <div key={index} className="member-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Member Name"
                    value={member.name}
                    onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                  />
                  <select
                    className="form-select"
                    value={member.relation}
                    onChange={(e) => handleMemberChange(index, 'relation', e.target.value)}
                  >
                    <option value="Self">Self</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="Age"
                    value={member.age}
                    onChange={(e) => handleMemberChange(index, 'age', e.target.value)}
                  />
                  <select
                    className="form-select"
                    value={member.gender}
                    onChange={(e) => handleMemberChange(index, 'gender', e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {proposalData.membersInfo.length > 1 && (
                    <button type="button" className="btn-remove" onClick={() => removeMemberRow(index)}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className="btn-add-member mb-4" onClick={addMemberRow}>
              + Add Another Insured Member
            </button>

            <h4 className="mb-3 text-light mt-4">Medical & Lifestyle History</h4>
            <div className="form-group mb-3">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  name="hasPreExisting"
                  checked={proposalData.medicalHistory.hasPreExisting || false}
                  onChange={handleMedicalChange}
                />
                Any insured member has pre-existing medical conditions (e.g. Hypertension, Diabetes, Asthma)?
              </label>
            </div>
            {proposalData.medicalHistory.hasPreExisting && (
              <div className="form-group mb-3">
                <label>Pre-existing Condition Details</label>
                <textarea
                  name="preExistingDetails"
                  className="form-textarea"
                  rows="2"
                  value={proposalData.medicalHistory.preExistingDetails || ''}
                  onChange={handleMedicalChange}
                  placeholder="Specify condition details, diagnosis year, and ongoing medications..."
                />
              </div>
            )}

            <div className="form-group mb-3">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  name="tobaccoOrAlcohol"
                  checked={proposalData.medicalHistory.tobaccoOrAlcohol || false}
                  onChange={handleMedicalChange}
                />
                Regular consumption of tobacco, cigarettes, or alcohol?
              </label>
            </div>

            <div className="form-group">
              <label className="form-checkbox-label">
                <input
                  type="checkbox"
                  name="recentSurgeries"
                  checked={proposalData.medicalHistory.recentSurgeries || false}
                  onChange={handleMedicalChange}
                />
                Any surgeries, hospitalizations, or organ treatments in the last 3 years?
              </label>
            </div>
          </div>
        )}

        {/* STEP 3: NOMINEE DECLARATION */}
        {currentStep === 3 && (
          <div className="form-grid">
            <div className="form-group">
              <label>Nominee Full Name</label>
              <input
                type="text"
                name="fullName"
                className="form-input"
                value={proposalData.nomineeInfo.fullName || ''}
                onChange={handleNomineeChange}
                placeholder="Primary Nominee Name"
              />
            </div>
            <div className="form-group">
              <label>Relationship with Proposer</label>
              <select
                name="relation"
                className="form-select"
                value={proposalData.nomineeInfo.relation || 'Spouse'}
                onChange={handleNomineeChange}
              >
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nominee Age</label>
              <input
                type="number"
                min="1"
                name="age"
                className="form-input"
                value={proposalData.nomineeInfo.age || ''}
                onChange={handleNomineeChange}
                placeholder="30"
              />
            </div>
            <div className="form-group">
              <label>Benefit Allocation Share (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                name="allocationPercent"
                className="form-input"
                value={proposalData.nomineeInfo.allocationPercent || '100'}
                onChange={handleNomineeChange}
              >
              </input>
            </div>
          </div>
        )}

        {/* STEP 4: UNDERWRITING & PRICE LOCK SUMMARY */}
        {currentStep === 4 && (
          <div>
            <div className="premium-lock-banner">
              <div className="lock-info">
                <h3>🔒 30-Day Premium Rate Lock Active!</h3>
                <p>Your calculated policy premium is locked and protected against rate fluctuations until {new Date(proposalData.premiumExpiresAt || Date.now() + 30*24*60*60*1000).toLocaleDateString()}.</p>
              </div>
              <div className="locked-price-tag">
                <div className="price-amount">${proposalData.lockedPremium || policy?.premium}</div>
                <div className="price-term">per year (Guaranteed)</div>
              </div>
            </div>

            {proposalData.underwritingFlags && (
              <div className="risk-flags-box">
                <h4>Automated Underwriting Assessment</h4>
                <p className="text-light mb-2">{proposalData.underwritingFlags.underwritingNote}</p>
                {proposalData.underwritingFlags.riskFlags?.map((flag, idx) => (
                  <span key={idx} className="risk-tag">
                    ⚠️ {flag.label}
                  </span>
                ))}
              </div>
            )}

            <div className="p-3 mb-4 rounded bg-dark border border-secondary text-light">
              <h5 className="text-primary mb-2">Regulatory Consent & Declaration</h5>
              <p className="small text-muted mb-0">
                By clicking proceed, you confirm all details supplied regarding medical history and personal profile are accurate to the best of your knowledge under Penalty of Law.
              </p>
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="wizard-actions mt-4">
          {currentStep > 1 ? (
            <button
              type="button"
              className="btn-back"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              disabled={submitting}
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          <div className="actions-right">
            <button
              type="button"
              className="btn-save-draft"
              onClick={() => saveDraft(currentStep)}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : '💾 Save Draft'}
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                className="btn-next"
                onClick={handleNextStep}
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'Continue →'}
              </button>
            ) : (
              <button
                type="button"
                className="btn-checkout"
                onClick={handleProceedToCheckout}
              >
                💳 Proceed to Instant Checkout
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
