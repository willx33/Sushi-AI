// fe/src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For development, create a mock user for easy testing
    const isDevelopment = true; // Enable for easier development testing

    if (isDevelopment) {
      // Mock user for development with a proper UUID format
      const mockUser = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Valid UUID format for PostgreSQL
        email: 'dev@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as User;
      
      const mockSession = {
        user: mockUser,
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_at: Date.now() + 3600
      } as Session;

      // Create profile ID that matches the user ID to match Supabase schema
      const mockProfile: Profile = {
        id: mockUser.id, // Same as user ID
        user_id: mockUser.id, // Same as user ID
        openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
        anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
        googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
        mistralApiKey: import.meta.env.VITE_MISTRAL_API_KEY || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        preferredLanguage: 'en',
        theme: 'system'
      };

      setUser(mockUser);
      setSession(mockSession);
      setProfile(mockProfile);
      setLoading(false);
      return;
    }

    // Normal authentication flow for production
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id).then(profile => {
          setProfile(profile);
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const fetchedProfile = await getProfile(session.user.id);
          if (!fetchedProfile) {
            // Create profile if it doesn't exist
            const newProfile = await createProfile(session.user.id, {});
            setProfile(newProfile);
          } else {
            setProfile(fetchedProfile);
          }
        }

        setLoading(false);
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
    await supabase.auth.signOut();
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