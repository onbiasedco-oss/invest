import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
  isCheckingVerification: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
  checkVerification: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'naccitheceo@gmail.com';
const VERIFIED_CACHE_KEY = 'verified_user_cache';

// --- localStorage cache ---
const getCachedVerification = (email: string): boolean | null => {
  try {
    const cached = localStorage.getItem(VERIFIED_CACHE_KEY);
    if (!cached) return null;
    const data = JSON.parse(cached);
    if (data.email === email.toLowerCase().trim() && data.verified === true) {
      if (Date.now() - (data.timestamp || 0) < 24 * 60 * 60 * 1000) return true;
    }
    return null;
  } catch { return null; }
};

const setCachedVerification = (email: string, verified: boolean) => {
  try {
    localStorage.setItem(VERIFIED_CACHE_KEY, JSON.stringify({
      email: email.toLowerCase().trim(), verified, timestamp: Date.now()
    }));
  } catch {}
};

const clearCachedVerification = () => {
  try { localStorage.removeItem(VERIFIED_CACHE_KEY); } catch {}
};

const createUserFromSession = (sessionUser: any): User => ({
  id: sessionUser.id,
  email: sessionUser.email || '',
  full_name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User',
  avatar_url: sessionUser.user_metadata?.avatar_url || null,
  is_admin: sessionUser.email === ADMIN_EMAIL,
  created_at: sessionUser.created_at || new Date().toISOString()
});

// Single upsert-style profile sync — fire and forget
const syncUserProfile = (sessionUser: any, setUser: React.Dispatch<React.SetStateAction<User | null>>) => {
  const email = sessionUser.email;
  if (!email) return;

  // Single query — just try to get existing user
  supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle()
    .then(({ data }) => {
      if (data) {
        setUser(prev => prev ? { ...data, is_admin: data.email === ADMIN_EMAIL } : prev);
      }
      // If no user found, try insert (fire and forget)
      if (!data) {
        supabase.from('users').insert({
          id: sessionUser.id,
          email: sessionUser.email,
          full_name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0],
          avatar_url: sessionUser.user_metadata?.avatar_url,
          is_admin: sessionUser.email === ADMIN_EMAIL
        }).select().single().then(({ data: created }) => {
          if (created) setUser(prev => prev ? { ...created, is_admin: created.email === ADMIN_EMAIL } : prev);
        }).catch(() => {});
      }
    })
    .catch(() => {});
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const loginInProgress = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // Hard cap loading at 1.5s
    const maxTimeout = setTimeout(() => {
      if (isMounted && isLoading) setIsLoading(false);
    }, 1500);

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          setUser(createUserFromSession(session.user));
          // Instant verified — cache or optimistic
          setIsVerified(true);
          const email = session.user.email || '';
          if (getCachedVerification(email) === null) {
            setCachedVerification(email, true);
          }
          syncUserProfile(session.user, (u) => { if (isMounted) setUser(u); });
        }
      } catch (e) {
        console.warn('Session check error:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkSession();

    // Auth state listener
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          // If login() is handling this, skip to avoid duplicate work
          if (loginInProgress.current) return;

          setUser(createUserFromSession(session.user));
          setIsVerified(true);
          setIsLoading(false);
          syncUserProfile(session.user, (u) => { if (isMounted) setUser(u); });

        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsVerified(false);
          clearCachedVerification();
        }
      });
      subscription = data.subscription;
    } catch {}

    return () => {
      isMounted = false;
      clearTimeout(maxTimeout);
      try { subscription?.unsubscribe(); } catch {}
    };
  }, []);

  const login = async (email: string, password: string) => {
    loginInProgress.current = true;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // INSTANT: set user + verified immediately
      if (data.user) {
        setUser(createUserFromSession(data.user));
        setIsVerified(true);
        setCachedVerification(email, true);
        // Fire-and-forget profile sync
        syncUserProfile(data.user, setUser);
      }
    } finally {
      setIsLoading(false);
      // Small delay before clearing flag so onAuthStateChange doesn't race
      setTimeout(() => { loginInProgress.current = false; }, 500);
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    loginInProgress.current = true;
    setIsLoading(true);
    try {
      // Register in verified_users first (fire-and-forget is fine)
      try {
        await supabase.functions.invoke('register-user', {
          body: { email: email.toLowerCase().trim(), fullName }
        });
      } catch (e) {
        console.warn('Register user warning:', e);
      }

      setCachedVerification(email, true);

      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } }
      });
      if (error) throw error;

      if (data.user) {
        setUser(createUserFromSession(data.user));
      }
      setIsVerified(true);
    } finally {
      setIsLoading(false);
      setTimeout(() => { loginInProgress.current = false; }, 500);
    }
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' }
    });
    if (error) throw error;
  };

  const logout = async () => {
    try { await supabase.auth.signOut(); } catch {}
    setUser(null);
    setIsVerified(false);
    clearCachedVerification();
  };

  const checkVerification = async (email: string): Promise<boolean> => {
    setIsVerified(true);
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      isVerified,
      isCheckingVerification: false,
      login,
      signup,
      logout,
      loginWithGoogle,
      checkVerification
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
