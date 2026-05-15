import api from './api';

export const messageService = {
  getMessages: (userToChatId) => api.get(`/messages/get-messages?userToChatId=${userToChatId}`),
  sendMessage: (data) => api.post('/messages/send-message', data),
};
