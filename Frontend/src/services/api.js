import axios from "axios";

const defaultApiUrl =
  import.meta.env.PROD && typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:9000';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL || defaultApiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
