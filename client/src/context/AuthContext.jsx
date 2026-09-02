import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('voxa_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.auth.me();
        setUser(data.user);
      } catch (err) {
        console.error('Failed to load user with current token:', err);
        localStorage.removeItem('voxa_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (loginIdentifier, password) => {
    const data = await api.auth.login(loginIdentifier, password);
    localStorage.setItem('voxa_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const verifySignupOtp = async (email, otp) => {
    const data = await api.auth.verifySignupOtp(email, otp);
    localStorage.setItem('voxa_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('voxa_token');
    setToken(null);
    setUser(null);
  };

  const quickLoginAs = async (demoUser) => {
    return login(demoUser.email || demoUser.username, 'password123');
  };

  const updateUser = (fields) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : null));
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const data = await api.auth.me();
      setUser(data.user);
    } catch (err) {
      console.error('Failed to refresh user info:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        verifySignupOtp,
        logout,
        quickLoginAs,
        updateUser,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
