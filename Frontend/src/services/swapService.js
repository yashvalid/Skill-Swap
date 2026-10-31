import api from './api';

export const swapService = {
  requestSwap: (data) => api.post('/skillSwap/request-swap', {
    fromUser: data.fromUser || data.fromUserId,
    toUser: data.toUser || data.toUserId,
    offersSkill: data.offersSkill || data.skillOffered,
    requestsSkill: data.requestsSkill || data.skillRequested
  }),
  acceptSwap: (requestId) => api.get(`/skillSwap/accept-request-swap?requestId=${requestId}`),
  completeSwap: (requestId) => api.post('/skillSwap/complete-swap', { requestId }),
  rejectSwap: (requestId) => api.get(`/skillSwap/reject-request-swap?requestId=${requestId}`),
  getAcceptedSwaps: () => api.get('/skillSwap/accepted-swaps'),
  getPendingSwaps: () => api.get('/skillSwap/get-pending-swaps'),
};
