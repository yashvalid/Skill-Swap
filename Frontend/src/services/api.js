import axios from "axios";

const api = axios.create({
  baseURL: 'http://localhost:9000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Bearer token if it exists in localStorage (as a fallback to cookies)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
