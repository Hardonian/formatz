import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authService } from '@/services';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getCurrentUser().then((response) => {
      if (response.success && response.data) {
        setUser(response.data);
      }
      setLoading(false);
    });

    const subscription = authService.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.data?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await authService.signIn({ email, password });
    if (!response.success) {
      throw new Error(response.error?.message || 'Sign in failed');
    }
    if (response.data) {
      setUser(response.data.user);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const response = await authService.signUp({ email, password, fullName });
    if (!response.success) {
      throw new Error(response.error?.message || 'Sign up failed');
    }
    if (response.data) {
      setUser(response.data.user);
    }
  };

  const signOut = async () => {
    const response = await authService.signOut();
    if (!response.success) {
      throw new Error(response.error?.message || 'Sign out failed');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
