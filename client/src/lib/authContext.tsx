import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabase, loadConfig } from './supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; needsVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resendVerification: (email: string) => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  });

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      await loadConfig();
      const supabase = getSupabase();
      
      if (!supabase) {
        if (mounted) {
          setState(prev => ({ ...prev, loading: false, initialized: true }));
        }
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (mounted) {
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
          initialized: true,
        });
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (mounted) {
            setState(prev => ({
              ...prev,
              user: session?.user ?? null,
              session,
            }));
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signUp = async (email: string, password: string): Promise<{ error: AuthError | null; needsVerification: boolean }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: { message: 'Supabase not configured', name: 'ConfigError' } as AuthError, needsVerification: false };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    });

    if (error) {
      return { error, needsVerification: false };
    }

    const needsVerification = !!(data.user && !data.session);
    return { error: null, needsVerification };
  };

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: { message: 'Supabase not configured', name: 'ConfigError' } as AuthError };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setState(prev => ({ ...prev, user: null, session: null }));
  };

  const resendVerification = async (email: string): Promise<{ error: AuthError | null }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: { message: 'Supabase not configured', name: 'ConfigError' } as AuthError };
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    return { error };
  };

  const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: { message: 'Supabase not configured', name: 'ConfigError' } as AuthError };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });

    return { error };
  };

  return (
    <AuthContext.Provider value={{ ...state, signUp, signIn, signOut, resendVerification, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
