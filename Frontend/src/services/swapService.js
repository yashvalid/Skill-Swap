import api from './api';

export const swapService = {
  requestSwap: (data) => api.post('/skillSwap/request-swap', {
    fromUser: data.fromUser || data.fromUserId,
    toUser: data.toUser || data.toUserId,
    offersSkill: data.offersSkill || data.skillOffered,
    requestsSkill: data.requestsSkill || data.skillRequested,
    scheduledTime: data.scheduledTime || null,
    durationMinutes: data.durationMinutes || 30,
    proposalNotes: data.proposalNotes || ''
  }),
  acceptSwap: (requestId) => api.get(`/skillSwap/accept-request-swap?requestId=${requestId}`),
  completeSwap: (requestId) => api.post('/skillSwap/complete-swap', { requestId }),
  rejectSwap: (requestId) => api.get(`/skillSwap/reject-request-swap?requestId=${requestId}`),
  rescheduleSwap: ({ swapId, scheduledTime, durationMinutes }) =>
    api.post('/skillSwap/reschedule', { swapId, scheduledTime, durationMinutes }),
  getAcceptedSwaps: () => api.get('/skillSwap/accepted-swaps'),
  getPendingSwaps: () => api.get('/skillSwap/get-pending-swaps'),
};
