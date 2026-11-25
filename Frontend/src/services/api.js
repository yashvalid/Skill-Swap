import axios from "axios";
import { Capacitor } from "@capacitor/core";

export const resolveBackendUrl = (overrideUrl) => {
  const configured = overrideUrl || import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL;
  if (Capacitor.isNativePlatform()) {
    if (configured && !/^https?:\/\/localhost(:\d+)?(\/|$)/i.test(configured)) {
      return configured;
    }
    return Capacitor.getPlatform() === 'android' ? 'http://10.0.2.2:9000' : 'http://localhost:9000';
  }
  if (configured) return configured;
  return import.meta.env.PROD && typeof window !== 'undefined'
    ? window.location.origin
    : 'http://localhost:9000';
};

const api = axios.create({
  baseURL: resolveBackendUrl(),
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
