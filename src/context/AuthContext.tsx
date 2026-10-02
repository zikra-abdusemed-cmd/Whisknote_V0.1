import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { UserProfile } from '../types';
import { StorageService, DEFAULT_USER } from '../services/storageService';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isCloudEnabled: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (
    name: string,
    email: string,
    pass: string,
    experience?: UserProfile['bakingExperience']
  ) => Promise<boolean>;
  loginDemo: () => void;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'whisknote_auth_session';
const DEMO_MODE_KEY = 'whisknote_demo_mode';

function formatJoinedDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(d);
}

function profileFromAuthUser(
  authUser: User,
  extras?: Partial<UserProfile>
): UserProfile {
  const meta = authUser.user_metadata || {};
  return {
    id: authUser.id,
    name:
      extras?.name ||
      meta.display_name ||
      meta.name ||
      authUser.email?.split('@')[0] ||
      'Baker',
    email: authUser.email || extras?.email || '',
    avatarUrl: extras?.avatarUrl || meta.avatar_url || undefined,
    bakingExperience: extras?.bakingExperience || meta.baking_experience || 'Home Baker',
    favoriteCategory: extras?.favoriteCategory || meta.favorite_category || 'Cookies',
    joinedDate: extras?.joinedDate || formatJoinedDate(authUser.created_at),
  };
}

async function loadProfileRow(userId: string): Promise<Partial<UserProfile> | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as {
    display_name: string | null;
    avatar_url: string | null;
    baking_experience: string | null;
    favorite_category: string | null;
  };
  return {
    name: row.display_name || undefined,
    avatarUrl: row.avatar_url || undefined,
    bakingExperience: (row.baking_experience as UserProfile['bakingExperience']) || undefined,
    favoriteCategory: (row.favorite_category as UserProfile['favoriteCategory']) || undefined,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const applyAuthenticatedUser = useCallback(async (authUser: User, nextSession: Session | null) => {
    const extras = await loadProfileRow(authUser.id);
    const profile = profileFromAuthUser(authUser, extras || undefined);
    StorageService.setAuthUserId(authUser.id);
    StorageService.saveUser(profile);
    localStorage.setItem(AUTH_TOKEN_KEY, 'active_session');
    localStorage.removeItem(DEMO_MODE_KEY);
    setSession(nextSession);
    setUser(profile);
    // Kick off offline-first cloud sync
    void StorageService.syncWithCloud(authUser.id);
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Restore demo / local session if Supabase is not configured
      if (!isSupabaseConfigured) {
        const hasSession = localStorage.getItem(AUTH_TOKEN_KEY);
        if (hasSession) {
          const savedUser = StorageService.getUser();
          StorageService.setAuthUserId(savedUser.id.startsWith('user-') ? null : savedUser.id);
          if (mounted) setUser(savedUser);
        }
        if (mounted) setIsLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data.session?.user) {
        await applyAuthenticatedUser(data.session.user, data.session);
      } else if (localStorage.getItem(DEMO_MODE_KEY)) {
        StorageService.setAuthUserId(null);
        setUser(DEFAULT_USER);
      }
      setIsLoading(false);
    };

    void init();

    if (!isSupabaseConfigured) return;

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mounted) return;
      if (nextSession?.user) {
        await applyAuthenticatedUser(nextSession.user, nextSession);
      } else if (event === 'SIGNED_OUT') {
        StorageService.setAuthUserId(null);
        setSession(null);
        if (!localStorage.getItem(DEMO_MODE_KEY)) {
          setUser(null);
          localStorage.removeItem(AUTH_TOKEN_KEY);
        }
      }
    });

    // Syncs whichever account is currently signed in (no-op for guests)
    const onOnline = () => {
      void StorageService.syncWithCloud();
    };
    window.addEventListener('online', onOnline);

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      window.removeEventListener('online', onOnline);
    };
  }, [applyAuthenticatedUser]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      if (!email.includes('@')) {
        setError('Please enter a valid email address.');
        setIsLoading(false);
        return false;
      }
      if (pass.length < 6) {
        setError('Password should be at least 6 characters.');
        setIsLoading(false);
        return false;
      }

      if (!isSupabaseConfigured) {
        // Local fallback when cloud credentials are not set
        await new Promise(r => setTimeout(r, 350));
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
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return false;
      }

      if (data.user && data.session) {
        await applyAuthenticatedUser(data.user, data.session);
      }
      setIsLoading(false);
      return true;
    } catch {
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
      if (pass.length < 6) {
        setError('Password should be at least 6 characters.');
        setIsLoading(false);
        return false;
      }

      if (!isSupabaseConfigured) {
        await new Promise(r => setTimeout(r, 350));
        const newUser: UserProfile = {
          id: `user-${Date.now()}`,
          name: name.trim(),
          email: email.trim(),
          bakingExperience: experience,
          favoriteCategory: 'Cookies',
          joinedDate: formatJoinedDate(),
        };
        localStorage.setItem(AUTH_TOKEN_KEY, 'active_session');
        StorageService.saveUser(newUser);
        setUser(newUser);
        setIsLoading(false);
        return true;
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            display_name: name.trim(),
            baking_experience: experience,
            favorite_category: 'Cookies',
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        // Ensure profile row exists / is updated
        await supabase.from('profiles').upsert({
          id: data.user.id,
          display_name: name.trim(),
          baking_experience: experience,
          favorite_category: 'Cookies',
        });

        if (data.session) {
          await applyAuthenticatedUser(data.user, data.session);
        } else {
          setError('Check your email to confirm your account, then sign in.');
          setIsLoading(false);
          return false;
        }
      }

      setIsLoading(false);
      return true;
    } catch {
      setError('Unable to create account. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  const loginDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      localStorage.setItem(AUTH_TOKEN_KEY, 'active_session');
      localStorage.setItem(DEMO_MODE_KEY, '1');
      StorageService.setAuthUserId(null);
      StorageService.saveUser(DEFAULT_USER);
      setSession(null);
      setUser(DEFAULT_USER);
      setIsLoading(false);
    }, 200);
  };

  const logout = async () => {
    const wasCloudUser = isSupabaseConfigured && !!session?.user;
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(DEMO_MODE_KEY);
    // Switches back to the guest notebook. This account's recipes (and any unsynced
    // edits) stay in its own on-device notebook for next sign-in, invisible to others.
    StorageService.setAuthUserId(null);
    if (wasCloudUser) StorageService.forgetUser();
    setUser(null);
    setSession(null);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    StorageService.saveUser(updated);

    if (isSupabaseConfigured && session?.user && !localStorage.getItem(DEMO_MODE_KEY)) {
      await supabase.from('profiles').upsert({
        id: user.id,
        display_name: updated.name,
        avatar_url: updated.avatarUrl || null,
        baking_experience: updated.bakingExperience,
        favorite_category: updated.favoriteCategory,
      });
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        error,
        isCloudEnabled: isSupabaseConfigured,
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
