import api from './api';

export const messageService = {
  getMessages: (userToChatId, params = {}) =>
    api.get('/messages/get-messages', { params: { userToChatId, ...params } }),
  sendMessage: (dataOrReceiverId, text) => {
    const payload =
      typeof dataOrReceiverId === 'object' && dataOrReceiverId !== null
        ? dataOrReceiverId
        : { receiverId: dataOrReceiverId, text };
    return api.post('/messages/send-message', payload);
  },
  markSeen: (partnerId) => api.patch('/messages/mark-seen', { partnerId }),
};
