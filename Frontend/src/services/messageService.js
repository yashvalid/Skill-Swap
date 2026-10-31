import api from './api';

export const messageService = {
  getMessages: (userToChatId) => api.get(`/messages/get-messages?userToChatId=${userToChatId}`),
  sendMessage: (dataOrReceiverId, text) => {
    const payload =
      typeof dataOrReceiverId === 'object' && dataOrReceiverId !== null
        ? dataOrReceiverId
        : { receiverId: dataOrReceiverId, text };
    return api.post('/messages/send-message', payload);
  },
};
