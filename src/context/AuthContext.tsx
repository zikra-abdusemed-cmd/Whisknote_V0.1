import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { StorageService, DEFAULT_USER } from '../services/storageService';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string, experience?: UserProfile['bakingExperience']) => Promise<boolean>;
  loginDemo: () => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'whisknote_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check existing session
    const hasSession = localStorage.getItem(AUTH_TOKEN_KEY);
    if (hasSession) {
      const savedUser = StorageService.getUser();
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate network authentication
      await new Promise(r => setTimeout(r, 450));
      if (!email.includes('@')) {
        setError('Please enter a valid email address.');
        setIsLoading(false);
        return false;
      }
      if (pass.length < 4) {
        setError('Password should be at least 4 characters.');
        setIsLoading(false);
        return false;
      }

      const existingUser = StorageService.getUser();
      const authenticatedUser: UserProfile = {
        ...existingUser,
        email,
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      };
      localStorage.setItem(AUTH_TOKEN_KEY, 'active_session');
      StorageService.saveUser(authenticatedUser);
      setUser(authenticatedUser);
      setIsLoading(false);
      return true;
    } catch (e) {
      setError('An error occurred while logging in. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (
    name: string,
    email: string,
    pass: string,
    experience: UserProfile['bakingExperience'] = 'Home Baker'
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 450));
      if (!name.trim()) {
        setError('Please enter your name.');
        setIsLoading(false);
        return false;
      }
      if (!email.includes('@')) {
        setError('Please enter a valid email address.');
        setIsLoading(false);
        return false;
      }
      if (pass.length < 4) {
        setError('Password should be at least 4 characters.');
        setIsLoading(false);
        return false;
      }

      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        bakingExperience: experience,
        favoriteCategory: 'Cookies',
        joinedDate: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date()),
      };
      localStorage.setItem(AUTH_TOKEN_KEY, 'active_session');
      StorageService.saveUser(newUser);
      setUser(newUser);
      setIsLoading(false);
      return true;
    } catch (e) {
      setError('Unable to create account. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  const loginDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      localStorage.setItem(AUTH_TOKEN_KEY, 'active_session');
      StorageService.saveUser(DEFAULT_USER);
      setUser(DEFAULT_USER);
      setIsLoading(false);
    }, 200);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    StorageService.saveUser(updated);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        signup,
        loginDemo,
        logout,
        updateProfile,
        clearError,
      }}
    >
      {children}
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
