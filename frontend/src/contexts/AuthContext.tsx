import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkAuth, login as apiLogin, logout as apiLogout } from '../api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  const checkAuthStatus = async () => {
    try {
      const response = await checkAuth();
      setIsAuthenticated(response.authenticated);
      setEmail(response.email || null);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setEmail(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiLogin(email, password);
      setIsAuthenticated(true);
      setEmail(response.email);
    } catch (error) {
      setIsAuthenticated(false);
      setEmail(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      setIsAuthenticated(false);
      setEmail(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        email,
        login,
        logout,
        checkAuthStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
