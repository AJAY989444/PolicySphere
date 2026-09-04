import api from './axios';

export const processGatewayCheckout = async (payload) => {
  const response = await api.post('/payments-engine/checkout', payload);
  return response.data;
};

export const fetchPaymentTransactions = async (params = {}) => {
  const response = await api.get('/payments-engine/transactions', { params });
  return response.data;
};

export const fetchRefundLogs = async () => {
  const response = await api.get('/payments-engine/refunds');
  return response.data;
};

export const processRefundRequest = async (payload) => {
  const response = await api.post('/payments-engine/refunds', payload);
  return response.data;
};

export const fetchReconciliationLogs = async () => {
  const response = await api.get('/payments-engine/reconciliation');
  return response.data;
};

export const triggerReconciliationRun = async () => {
  const response = await api.post('/payments-engine/reconciliation/run');
  return response.data;
};

export const fetchPaymentMetrics = async () => {
  const response = await api.get('/payments-engine/metrics');
  return response.data;
};
