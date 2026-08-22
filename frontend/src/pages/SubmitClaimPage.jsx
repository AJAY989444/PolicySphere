import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api/axios';

import FileUpload from '../components/common/FileUpload';

const SubmitClaimPage = () => {
  const [policies, setPolicies] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await api.get('/policies/my-policies');
        setPolicies(res.data.policies.filter(p => p.status === 'ACTIVE'));
      } catch (err) {
        console.error('Failed to fetch policies', err);
        toast.error('Could not load your active policies.');
      } finally {
        setLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/claims', {
        ...data,
        amount: parseFloat(data.amount),
        documents: uploadedFiles,
      });
      toast.success('Claim submitted successfully!');
      navigate('/claims');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit claim');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading policies...</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Submit a New Claim</h1>
      
      {policies.length === 0 ? (
        <div className="bg-surface p-6 rounded-lg border border-border text-center">
          <p>You don't have any active policies to file a claim against.</p>
          <button onClick={() => navigate('/catalog')} className="btn btn-primary mt-4">
            Browse Catalog
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="card flex flex-col gap-4">
          
          <div className="form-group">
            <label className="form-label">Select Policy *</label>
            <select className="form-input" {...register('userPolicyId', { required: 'Please select a policy' })}>
              <option value="">-- Choose a Policy --</option>
              {policies.map(p => (
                <option key={p.id} value={p.id}>{p.policy.name} ({p.policy.provider})</option>
              ))}
            </select>
            {errors.userPolicyId && <span className="text-red-500 text-sm">{errors.userPolicyId.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Claim Amount ($) *</label>
            <input 
              type="number" 
              step="0.01" 
              className="form-input" 
              {...register('amount', { 
                required: 'Amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' }
              })} 
            />
            {errors.amount && <span className="text-red-500 text-sm">{errors.amount.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Date of Incident *</label>
            <input 
              type="date" 
              className="form-input" 
              {...register('incidentDate', { required: 'Incident date is required' })} 
            />
            {errors.incidentDate && <span className="text-red-500 text-sm">{errors.incidentDate.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Description of Incident *</label>
            <textarea 
              rows="4" 
              className="form-input resize-none" 
              placeholder="Please describe what happened in detail..."
              {...register('description', { 
                required: 'Description is required',
                minLength: { value: 10, message: 'Description must be at least 10 characters' }
              })} 
            ></textarea>
            {errors.description && <span className="text-red-500 text-sm">{errors.description.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Attach Proof / Evidence (Optional)</label>
            <FileUpload
              uploadedFiles={uploadedFiles}
              onFilesUploaded={(files) => setUploadedFiles(files)}
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary mt-4">
            {isSubmitting ? 'Submitting...' : 'Submit Claim'}
          </button>

        </form>
      )}
    </div>
  );
};

export default SubmitClaimPage;
