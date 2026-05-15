import api from './api';

export const feedService = {
  createPost: (formData) => {
    return api.post('/posts/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getAllPosts: () => api.get('/posts/all'),
  likePost: (postId) => api.post(`/posts/like/${postId}`),
  commentPost: (postId, comment) => api.post(`/posts/comment/${postId}`, { comment }),
  getComments: (postId) => api.get(`/posts/comments/${postId}`),
  getUserPosts: (userId) => api.get(`/posts/user/${userId}`),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  updatePost: (postId, data) => api.put(`/posts/${postId}`, data),
};
