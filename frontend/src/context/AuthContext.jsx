import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('venderra_token');
    const savedUser = localStorage.getItem('venderra_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      api.get('/auth/me').then(res => {
        setUser(res.data);
        localStorage.setItem('venderra_user', JSON.stringify(res.data));
      }).catch(() => {
        localStorage.removeItem('venderra_token');
        localStorage.removeItem('venderra_user');
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('venderra_token', res.data.token);
    localStorage.setItem('venderra_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('venderra_token');
    localStorage.removeItem('venderra_user');
    setUser(null);
  };

  const switchBranch = async (branchId) => {
    const res = await api.post('/auth/switch-branch', { branchId });
    localStorage.setItem('venderra_token', res.data.token);
    setUser(prev => ({
      ...prev,
      branchId: res.data.branchId,
      branchName: res.data.branchName,
    }));
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchBranch, loading, isOnline }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
