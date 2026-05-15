import api from './api';

export const swapService = {
  requestSwap: (data) => api.post('/skillSwap/request-swap', data),
  acceptSwap: (requestId) => api.get(`/skillSwap/accept-request-swap?requestId=${requestId}`),
  rejectSwap: (requestId) => api.get(`/skillSwap/reject-request-swap?requestId=${requestId}`),
  getAcceptedSwaps: () => api.get('/skillSwap/accepted-swaps'),
  getPendingSwaps: () => api.get('/skillSwap/get-pending-swaps'),
};
