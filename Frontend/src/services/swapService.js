import api from './api';

export const swapService = {
  requestSwap: (data) => api.post('/skillswap/request-swap', {
    toUser: data.toUser || data.toUserId,
    offersSkill: data.offersSkill || data.skillOffered,
    requestsSkill: data.requestsSkill || data.skillRequested,
    scheduledTime: data.scheduledTime || null,
    durationMinutes: data.durationMinutes || 30,
    proposalNotes: data.proposalNotes || ''
  }),
  acceptSwap: (requestId) => api.get(`/skillswap/accept-request-swap?requestId=${requestId}`),
  completeSwap: (requestId) => api.post('/skillswap/complete-swap', { requestId }),
  rejectSwap: (requestId) => api.get(`/skillswap/reject-request-swap?requestId=${requestId}`),
  rescheduleSwap: ({ swapId, scheduledTime, durationMinutes }) =>
    api.post('/skillswap/reschedule', { swapId, scheduledTime, durationMinutes }),
  updateWorkspace: ({ swapId, milestones, sessionNotes }) =>
    api.put('/skillswap/workspace', { swapId, milestones, sessionNotes }),
  getAcceptedSwaps: () => api.get('/skillswap/accepted-swaps'),
  getPendingSwaps: () => api.get('/skillswap/get-pending-swaps'),
};
