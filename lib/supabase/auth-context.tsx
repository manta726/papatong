// lib/supabase/auth-context.tsx - PRODUCTION READY
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase, UserProfile } from '@/lib/supabase/client';

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'admin' && profile?.is_active === true;

  // ========================================
  // FETCH USER PROFILE
  // ========================================
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found
          console.warn('⚠️ No profile found for user:', userId);
          setProfile(null);
          return;
        }
        throw error;
      }

      // Check if user is active
      if (!data.is_active) {
        console.warn('⚠️ User account is inactive:', userId);
        await handleInactiveUser();
        return;
      }

      setProfile(data);
      console.log('✅ Profile loaded:', data.name, `(${data.role})`);
    } catch (error) {
      console.error('❌ Profile fetch error:', error);
      setProfile(null);
    }
  };

  // ========================================
  // HANDLE INACTIVE USER
  // ========================================
  const handleInactiveUser = async () => {
    console.log('🔒 Signing out inactive user...');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    
    if (typeof window !== 'undefined') {
      router.push('/login?error=account_inactive');
    }
  };

  // ========================================
  // HANDLE SESSION ERROR
  // ========================================
  const handleSessionError = async (error: AuthError) => {
    console.error('❌ Session error:', error.message);

    // Clear all auth state
    setUser(null);
    setProfile(null);
    setSession(null);

    // Clear Supabase session
    await supabase.auth.signOut();

    // Clear localStorage (fallback)
    if (typeof window !== 'undefined') {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }

      // Redirect to login with error message
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        router.push('/login?session_expired=true');
      }
    }
  };

  // ========================================
  // INITIALIZE AUTH
  // ========================================
  useEffect(() => {
    let isMounted = true;
    let refreshTimer: NodeJS.Timeout | null = null;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Get session error:', error);
          await handleSessionError(error);
          return;
        }

        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchProfile(session.user.id);
            
            // Setup auto-refresh (55 minutes)
            // Supabase tokens expire after 1 hour
            refreshTimer = setInterval(async () => {
              try {
                console.log('🔄 Auto-refreshing session...');
                const { data, error } = await supabase.auth.refreshSession();
                
                if (error) {
                  console.error('❌ Auto-refresh failed:', error);
                  await handleSessionError(error);
                } else if (data.session) {
                  console.log('✅ Session auto-refreshed');
                  setSession(data.session);
                }
              } catch (err) {
                console.error('❌ Auto-refresh error:', err);
              }
            }, 55 * 60 * 1000); // 55 minutes
          }
        }
      } catch (error) {
        console.error('❌ Auth init error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    // ========================================
    // AUTH STATE LISTENER
    // ========================================
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event:', event);

        if (!isMounted) return;

        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ User signed in');
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
              await fetchProfile(session.user.id);
            }
            break;

          case 'SIGNED_OUT':
            console.log('👋 User signed out');
            setSession(null);
            setUser(null);
            setProfile(null);
            if (refreshTimer) {
              clearInterval(refreshTimer);
              refreshTimer = null;
            }
            break;

          case 'TOKEN_REFRESHED':
            console.log('✅ Token refreshed');
            setSession(session);
            break;

          case 'USER_UPDATED':
            console.log('🔄 User updated');
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
              await fetchProfile(session.user.id);
            }
            break;

          case 'PASSWORD_RECOVERY':
            console.log('🔑 Password recovery');
            break;

          default:
            setSession(session);
            setUser(session?.user ?? null);
        }

        if (!session) {
          setLoading(false);
        }
      }
    );

    // ========================================
    // CLEANUP
    // ========================================
    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [router]);

  // ========================================
  // SIGN IN
  // ========================================
  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        console.error('❌ Sign in error:', error.message);
        return { error: error.message };
      }

      if (data.user) {
        console.log('✅ Sign in successful:', data.user.email);
      }

      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Sign in exception:', message);
      return { error: message };
    }
  };

  // ========================================
  // SIGN UP (for future use)
  // ========================================
  const signUp = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      // Note: Public signup is disabled, this will fail
      const { error } = await supabase.auth.signUp({ 
        email, 
        password 
      });

      if (error) {
        console.error('❌ Sign up error:', error.message);
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Sign up exception:', message);
      return { error: message };
    }
  };

  // ========================================
  // SIGN OUT
  // ========================================
  const signOut = async () => {
    try {
      console.log('🔄 Signing out...');
      await supabase.auth.signOut();
      setProfile(null);
      setUser(null);
      setSession(null);
      
      if (typeof window !== 'undefined') {
        router.push('/login');
      }
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  };

  // ========================================
  // HAS ROLE
  // ========================================
  const hasRole = (roles: string[]): boolean => {
    if (!profile || !profile.is_active) return false;
    return roles.includes(profile.role);
  };

  // ========================================
  // REFRESH PROFILE
  // ========================================
  const refreshProfile = async () => {
    if (user) {
      console.log('🔄 Refreshing profile...');
      await fetchProfile(user.id);
    }
  };

  // ========================================
  // CONTEXT VALUE
  // ========================================
  const value: AuthContextType = { 
    user, 
    profile, 
    session, 
    loading, 
    isAdmin,
    signIn, 
    signUp, 
    signOut, 
    hasRole,
    refreshProfile 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ========================================
// CUSTOM HOOK
// ========================================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
