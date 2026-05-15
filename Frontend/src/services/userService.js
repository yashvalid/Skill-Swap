import api from './api';

export const userService = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  getProfile: () => api.get('/users/profile'),
  getAllUsers: () => api.get('/users/all-users'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/update-profile', data),
  rateUser: (id, ratingData) => api.post(`/users/rate/${id}`, ratingData),
};
