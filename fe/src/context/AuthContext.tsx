// fe/src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, SUPABASE_URL } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { getProfile, Profile, createProfile } from '@/db/profile';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null, user: User | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false); // Start with false to avoid loading screen

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing user authentication...');
        const { data: { session } } = await supabase.auth.getSession();
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('Found user session:', session.user.id);
          try {
            // Get or create profile
            let profile = await getProfile(session.user.id);
            
            if (!profile) {
              console.log('No profile found, creating one...');
              profile = await createProfile(session.user.id, {});
            }
            
            setProfile(profile);
          } catch (profileError) {
            console.error('Error handling profile:', profileError);
          }
        } else {
          console.log('No active session found');
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
      }
    };
    
    // Initialize authentication without setting loading
    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUser(null);
          setSession(null);
          setProfile(null);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User session in auth change:', session.user.id);
          try {
            let profile = await getProfile(session.user.id);
            
            if (!profile) {
              console.log('No profile found in auth change, creating one');
              profile = await createProfile(session.user.id, {});
            }
            
            setProfile(profile);
          } catch (error) {
            console.error('Error handling profile in auth change:', error);
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      return { error, user: data?.user ?? null };
    } catch (error) {
      return { error: error as Error, user: null };
    }
  };

  const signOut = async () => {
    // Clear React state immediately
    setUser(null);
    setSession(null);
    setProfile(null);
    
    try {
      // Find all Supabase keys in localStorage and remove them
      const supabaseKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          supabaseKeys.push(key);
        }
      }
      
      // Remove each key
      supabaseKeys.forEach(key => {
        console.log('Removing storage key:', key);
        localStorage.removeItem(key);
      });
      
      // Clear specific known keys (including those with tenant prefix)
      const tenantId = SUPABASE_URL.match(/([a-z0-9-]+)\.supabase\.co/)?.[1];
      if (tenantId) {
        localStorage.removeItem(`sb-${tenantId}-auth-token`);
      }
      
      // Remove common Supabase auth items
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('supabase.auth.refreshToken');
      
      // Only after clearing storage, sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Force a reload to ensure clean slate
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    profile,
    signIn,
    signUp,
    signOut,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}