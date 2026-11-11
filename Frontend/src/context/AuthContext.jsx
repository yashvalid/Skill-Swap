import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  getOrInitUserKeyPair,
  encryptKeyBackupWithPassword,
  decryptKeyBackupWithPassword
} from '../utils/e2ee';

const AuthContext = createContext();

const syncE2EEVaultOnAuth = async (authUser, password) => {
  if (!authUser?._id || !password || !window.crypto?.subtle) return authUser;
  try {
    if (authUser.encryptedKeyBackup) {
      try {
        const restored = await decryptKeyBackupWithPassword(password, authUser._id, authUser.encryptedKeyBackup);
        if (restored?.publicKeyJwkString && restored.publicKeyJwkString !== authUser.publicKey) {
          const { data } = await api.put('/users/update-profile', { publicKey: restored.publicKeyJwkString });
          return data?.user || authUser;
        }
        return authUser;
      } catch {
        // Vault failed to unwrap (e.g., corrupted payload) - keep existing local keys intact
        return authUser;
      }
    }

    const keyInfo = await getOrInitUserKeyPair(authUser._id);
    if (!keyInfo) return authUser;

    const encryptedKeyBackup = await encryptKeyBackupWithPassword(password, authUser._id);
    if (!encryptedKeyBackup) return authUser;

    const { data } = await api.put('/users/update-profile', {
      publicKey: keyInfo.publicKeyJwkString,
      encryptedKeyBackup
    });
    return data?.user || authUser;
  } catch {
    return authUser;
  }
};

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
      if (response.data.token) localStorage.setItem('token', response.data.token);
      const syncedUser = await syncE2EEVaultOnAuth(response.data.user, password);
      setUser(syncedUser);
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
      const syncedUser = await syncE2EEVaultOnAuth(data.user, userData.password);
      setUser(syncedUser);
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
