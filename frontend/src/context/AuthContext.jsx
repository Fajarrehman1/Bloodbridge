import { createContext, useContext, useState } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('bloodbridge_user')) || null
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Login
  const login = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.post('/auth/login', { email, password });
      localStorage.setItem('bloodbridge_user', JSON.stringify(data));
      setUser(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register Donor
  const registerDonor = async (formData) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.post('/auth/register-donor', formData);
      localStorage.setItem('bloodbridge_user', JSON.stringify(data));
      setUser(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register Receiver
  const registerReceiver = async (formData) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await API.post('/auth/register-receiver', formData);
      localStorage.setItem('bloodbridge_user', JSON.stringify(data));
      setUser(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('bloodbridge_user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      registerDonor,
      registerReceiver,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);