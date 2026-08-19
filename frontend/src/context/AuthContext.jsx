import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Attempt to fetch current user profile
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          // If token expired, try to refresh
          try {
            const refreshRes = await api.post('/auth/refresh');
            setUser(refreshRes.data.user);
            localStorage.setItem('token', refreshRes.data.accessToken);
          } catch (refreshErr) {
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.accessToken);
      toast.success('Logged in successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      setUser(res.data.user);
      localStorage.setItem('token', res.data.accessToken);
      toast.success('Account created successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    }
    setUser(null);
    localStorage.removeItem('token');
    toast.success('Logged out');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
