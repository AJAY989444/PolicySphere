import React from 'react';
import { HiX, HiCheck, HiOutlineCheckCircle, HiShoppingCart } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import './PolicyCompareModal.css';

function PolicyCompareModal({ isOpen, onClose, policies = [] }) {
  const navigate = useNavigate();

  if (!isOpen || policies.length === 0) return null;

  const handleSelectPolicy = (policyId) => {
    onClose();
    navigate(`/catalog/${policyId}`);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="compare-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="compare-modal-header">
          <div>
            <h3>Side-by-Side Policy Comparison</h3>
            <p>Comparing {policies.length} selected policies side-by-side</p>
          </div>
          <button className="close-btn" onClick={onClose}><HiX /></button>
        </div>

        <div className="compare-table-wrapper">
          <table className="compare-table">
            <thead>
              <tr>
                <th className="feature-label-col">Plan Details</th>
                {policies.map((p) => (
                  <th key={p.id} className="policy-col-header">
                    <span className="badge badge-primary">{p.category}</span>
                    <h4>{p.name}</h4>
                    <p className="provider-name">{p.provider}</p>
                    <div className="policy-price">
                      ${p.premium.toLocaleString()}<span>/yr</span>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm btn-full mt-3"
                      onClick={() => handleSelectPolicy(p.id)}
                    >
                      <HiShoppingCart /> Select Plan
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="feature-label">Sum Assured (Coverage)</td>
                {policies.map((p) => (
                  <td key={p.id} className="feature-val highlight">
                    ${p.coverageAmount.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="feature-label">Monthly Cost Estimate</td>
                {policies.map((p) => (
                  <td key={p.id} className="feature-val">
                    ${Math.round(p.premium / 12).toLocaleString()} / month
                  </td>
                ))}
              </tr>
              <tr>
                <td className="feature-label">Policy Duration</td>
                {policies.map((p) => (
                  <td key={p.id} className="feature-val">
                    {p.duration >= 12 ? `${p.duration / 12} Year(s)` : `${p.duration} Month(s)`}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="feature-label">Waiting Period</td>
                {policies.map((p) => (
                  <td key={p.id} className="feature-val">
                    {p.category === 'HEALTH' ? '30 Days Initial' : 'Instant Coverage'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="feature-label">Tax Benefit</td>
                {policies.map((p) => (
                  <td key={p.id} className="feature-val">
                    <span className="text-success"><HiCheck /> Eligible (Sec 80D/80C)</span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="feature-label">Key Features & Add-ons</td>
                {policies.map((p) => {
                  let featuresList = [];
                  try {
                    featuresList = typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || []);
                  } catch (e) {
                    featuresList = [p.features];
                  }
                  return (
                    <td key={p.id} className="feature-val features-list-cell">
                      <ul>
                        {featuresList.map((f, i) => (
                          <li key={i}><HiOutlineCheckCircle className="icon-check" /> {f}</li>
                        ))}
                      </ul>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PolicyCompareModal;
