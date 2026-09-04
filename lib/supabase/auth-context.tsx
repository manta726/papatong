'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      return { error: error?.message ?? null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = { user, session, loading, signIn, signUp, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
