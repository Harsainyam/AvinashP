import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getToken, setToken, removeToken, getUser, setUser, removeUser } from '../services/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = getToken();
    const savedUser = getUser();

    if (token && savedUser) {
      setUserState(savedUser);
      setIsAuthenticated(true);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success && response.data.data.requiresOTP) {
        return {
          success: true,
          requiresOTP: true,
          userId: response.data.data.userId,
          email: response.data.data.email
        };
      }
      
      return { success: false, message: 'Login failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const verifyOTP = async (userId, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { userId, otp });
      
      if (response.data.success) {
        const { user, accessToken } = response.data.data;
        
        // Store token and user data
        setToken(accessToken);
        setUser(user);
        
        // Set auth header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        // Update state
        setUserState(user);
        setIsAuthenticated(true);
        
        return { success: true };
      }
      
      return { success: false, message: 'OTP verification failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'OTP verification failed'
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);
      
      if (response.data.success) {
        return {
          success: true,
          userId: response.data.data.userId,
          email: response.data.data.email
        };
      }
      
      return { success: false, message: 'Signup failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed'
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      removeToken();
      removeUser();
      
      // Clear state
      setUserState(null);
      setIsAuthenticated(false);
      
      // Remove auth header
      delete api.defaults.headers.common['Authorization'];
      
      // Navigate to login
      navigate('/login');
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    verifyOTP,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};