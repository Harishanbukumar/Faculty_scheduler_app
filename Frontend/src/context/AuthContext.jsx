import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get stored user data from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr && token) {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setCurrentUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  // Login function
  const login = async (registrationNumber, password, rememberMe = false) => {
    try {
      setLoading(true);
      const response = await authService.login(registrationNumber, password, rememberMe);
      
      // Store token and user data in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setToken(response.token);
      setCurrentUser(response.user);
      
      return response.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (registrationData) => {
    try {
      setLoading(true);
      return await authService.register(registrationData);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reset password request function
  const resetPasswordRequest = async (registrationNumber) => {
    try {
      setLoading(true);
      return await authService.resetPasswordRequest(registrationNumber);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (registrationNumber, resetToken, newPassword) => {
    try {
      setLoading(true);
      return await authService.resetPassword(registrationNumber, resetToken, newPassword);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
    navigate('/login');
  };

  // Return the context provider
  const value = {
    currentUser,
    loading,
    token,
    login,
    register,
    resetPasswordRequest,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};