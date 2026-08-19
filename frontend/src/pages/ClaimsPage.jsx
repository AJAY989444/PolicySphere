import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api/axios';

const ClaimsPage = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const res = await api.get('/claims');
        setClaims(res.data.claims);
      } catch (err) {
        console.error('Failed to fetch claims', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading claims...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Claims</h1>
        <Link to="/claims/new" className="btn btn-primary">
          Submit New Claim
        </Link>
      </div>

      {claims.length === 0 ? (
        <div className="bg-surface rounded-lg p-8 text-center text-secondary border border-border">
          You haven't submitted any claims yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {claims.map((claim) => (
            <div key={claim.id} className="bg-surface p-6 rounded-lg border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-semibold text-lg">{claim.userPolicy.policy.name}</h3>
                <p className="text-sm text-secondary mb-2">
                  Incident Date: {new Date(claim.incidentDate).toLocaleDateString()}
                </p>
                <p className="text-sm">Amount Claimed: ${claim.amount}</p>
                <p className="text-sm text-secondary mt-2">
                  {claim.description.length > 50 ? `${claim.description.substring(0, 50)}...` : claim.description}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`badge ${
                  claim.status === 'APPROVED' ? 'bg-green-500/10 text-green-500' :
                  claim.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                  claim.status === 'IN_REVIEW' ? 'bg-blue-500/10 text-blue-500' :
                  'bg-yellow-500/10 text-yellow-500'
                }`}>
                  {claim.status}
                </span>
                <span className="text-xs text-secondary">
                  Filed: {new Date(claim.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClaimsPage;
