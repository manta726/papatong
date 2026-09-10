// lib/supabase/auth-context.tsx - ENHANCED VERSION WITH DEBUGGING
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

// Enhanced user profile type
type UserProfile = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'admin' | 'manager' | 'sales' | 'support';
  position: string | null;
  department: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived states
  const isAdmin = profile?.role === 'admin' && profile?.is_active === true;

  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔍 [Auth] Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ [Auth] Profile fetch error:', error.code, error.message);
        
        // If profile doesn't exist, create a default one
        if (error.code === 'PGRST116') { // Not found error
          console.log('📝 [Auth] Creating default profile for user:', userId);
          
          try {
            const { data: newProfile, error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                id: userId,
                email: user?.email || '',
                name: user?.email?.split('@')[0] || 'User',
                role: 'sales', // Default role
                is_active: true,
                phone: null,
                position: null,
                department: null,
                created_by: null,
              })
              .select()
              .single();

            if (insertError) {
              console.error('❌ [Auth] Failed to create default profile:', insertError);
              setProfile(null);
            } else {
              console.log('✅ [Auth] Default profile created:', newProfile);
              setProfile(newProfile);
            }
          } catch (insertException) {
            console.error('❌ [Auth] Exception creating profile:', insertException);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } else {
        console.log('✅ [Auth] Profile loaded successfully:', {
          name: data.name,
          role: data.role,
          is_active: data.is_active,
        });
        setProfile(data);
      }
    } catch (error) {
      console.error('❌ [Auth] Profile fetch exception:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        console.log('🚀 [Auth] Initializing authentication...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          console.log('👤 [Auth] User from session:', session?.user?.email || 'No user');
          
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            console.log('⏹️ [Auth] No session found');
          }
        }
      } catch (error) {
        console.error('❌ [Auth] Initialization error:', error);
      } finally {
        if (isMounted) {
          console.log('✅ [Auth] Initialization complete');
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔄 [Auth] Auth state changed:', _event);
      
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 [Auth] New user:', session.user.email);
          await fetchProfile(session.user.id);
        } else {
          console.log('👤 [Auth] User logged out');
          setProfile(null);
        }
        
        if (!session) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      console.log('🔐 [Auth] Signing in user:', email);
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('❌ [Auth] Sign in error:', error.message);
        return { error: error.message };
      }
      
      console.log('✅ [Auth] Sign in successful');
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ [Auth] Sign in exception:', errorMessage);
      return { error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      console.log('📝 [Auth] Signing up user:', email);
      
      const { error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        console.error('❌ [Auth] Sign up error:', error.message);
        return { error: error.message };
      }
      
      console.log('✅ [Auth] Sign up successful');
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ [Auth] Sign up exception:', errorMessage);
      return { error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 [Auth] Signing out...');
      
      await supabase.auth.signOut();
      setProfile(null);
      
      console.log('✅ [Auth] Sign out successful');
    } catch (error) {
      console.error('❌ [Auth] Sign out error:', error);
    }
  };

  const hasRole = (roles: string[]): boolean => {
    const hasRequiredRole = profile ? roles.includes(profile.role) && profile.is_active : false;
    console.log('🔍 [Auth] Role check:', { required: roles, current: profile?.role, has: hasRequiredRole });
    return hasRequiredRole;
  };

  const refreshProfile = async () => {
    console.log('🔄 [Auth] Refreshing profile...');
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // Log whenever auth state changes
  useEffect(() => {
    console.log('📊 [Auth] Current state:', {
      userEmail: user?.email,
      profileName: profile?.name,
      profileRole: profile?.role,
      isActive: profile?.is_active,
      isAdmin,
      loading,
    });
  }, [user, profile, isAdmin, loading]);

  const value = { 
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
