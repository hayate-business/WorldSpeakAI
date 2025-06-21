import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/services/auth.service';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: any) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  userProfile: any | null;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  useEffect(() => {
    // Check initial session
    checkSession();

    // Listen for auth changes
    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { session: currentSession } = await authService.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await loadUserProfile(currentSession.user.id);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    const { data, error } = await authService.getUserProfile(userId);
    if (!error && data) {
      setUserProfile(data);
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await authService.signIn({ email, password });
    if (!error && data) {
      setUser(data.user);
      setSession(data.session);
      if (data.user) {
        await loadUserProfile(data.user.id);
      }
    }
    return { error };
  };

  const signUp = async (data: any) => {
    const { error } = await authService.signUp(data);
    return { error };
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    userProfile,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};