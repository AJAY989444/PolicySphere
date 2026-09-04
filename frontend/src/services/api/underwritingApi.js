import api from './axios';

export const underwritingApi = {
  getMetrics: async () => {
    const res = await api.get('/underwriting/metrics');
    return res.data;
  },

  getAssessments: async (params = {}) => {
    const res = await api.get('/underwriting/assessments', { params });
    return res.data;
  },

  getAssessmentById: async (id) => {
    const res = await api.get(`/underwriting/assessments/${id}`);
    return res.data;
  },

  evaluateProposal: async (proposalId) => {
    const res = await api.post(`/underwriting/evaluate/${proposalId}`);
    return res.data;
  },

  submitDecision: async (id, decisionPayload) => {
    const res = await api.post(`/underwriting/decide/${id}`, decisionPayload);
    return res.data;
  },

  getAuditLogs: async (params = {}) => {
    const res = await api.get('/underwriting/audit-logs', { params });
    return res.data;
  },
};

export default underwritingApi;
