import { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Check authentication status on app load
   * Note: Using sessionStorage - token cleared on tab close/refresh
   */
  const checkAuth = async () => {
    try {
      const token = sessionStorage.getItem('adminToken');
      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }

      const response = await apiRequest('/admin/auth/me');
      if (response && response.success) {
        setUser(response.data.user);
      } else {
        // Invalid token or backend unavailable
        sessionStorage.removeItem('adminToken');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      sessionStorage.removeItem('adminToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiRequest('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response && response.success) {
        const token = response.data.token;
        // Store in sessionStorage - cleared on tab close/refresh
        sessionStorage.setItem('adminToken', token);
        setUser(response.data.user);
        return true;
      } else {
        throw new Error(response?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Failed to login. Please check your credentials.');
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint if token exists
      const token = sessionStorage.getItem('adminToken');
      if (token) {
        await apiRequest('/admin/auth/logout', {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      sessionStorage.removeItem('adminToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};