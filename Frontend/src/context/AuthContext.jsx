import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/users/profile');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/users/login', { email, password });
      setUser(response.data.user);
      if (response.data.token) localStorage.setItem('token', response.data.token);
      toast.success('Logged in successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await api.post('/users/register', userData);
      if (data.token) localStorage.setItem('token', data.token);
      setUser(data.user);
      toast.success('Registered successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Registration failed');
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post('/users/logout');
    } catch {
      // Ignore network errors when clearing session locally
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      toast.success('Logged out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
