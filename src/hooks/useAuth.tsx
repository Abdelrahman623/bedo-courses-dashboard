import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  isAuthenticated: boolean;
  isSupabaseConfigured: boolean;
  signInDemo: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const DEMO_USER: User = {
  id: 'local-bedo',
  app_metadata: { provider: 'demo' },
  user_metadata: { full_name: 'Bedo', name: 'Bedo' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'bedo@courses.local',
  phone: '',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

const DEMO_PROFILE: Profile = {
  id: 'local-bedo',
  name: 'Bedo',
  username: 'bedo',
  email: 'bedo@courses.local',
  bio: 'Continuous learner',
  weekly_goal_hours: 10,
  created_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  isDemo: false,
  isAuthenticated: false,
  isSupabaseConfigured: false,
  signInDemo: () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const purgedRef = useRef(false);

  const purgeSession = useCallback(async () => {
    purgedRef.current = true;
    setSession(null);
    setProfile(null);
    setIsDemo(false);
    localStorage.removeItem('bedo_demo_session');
    localStorage.removeItem('bedo_sessions');
    localStorage.removeItem('bedo_activity');
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('sb-') || k.includes('auth-token') || k.includes('demo_session')) {
        localStorage.removeItem(k);
      }
    });
    try { await supabase.auth.signOut(); } catch { /* best-effort */ }
  }, []);

  const checkProfile = useCallback(async (u: User): Promise<boolean> => {
    if (!isSupabaseConfigured) return true;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .maybeSingle();

      if (error) {
        console.error('[Auth] Profile check error:', error);
        return true;
      }

      if (data) {
        setProfile(data as Profile);
        return true;
      }

      console.warn('[Auth] No profile row — purging, require re-registration.');
      await purgeSession();
      return false;
    } catch (err) {
      console.error('[Auth] checkProfile threw:', err);
      return true;
    }
  }, [purgeSession]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await checkProfile(session.user);
  }, [session, checkProfile]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    purgedRef.current = false;

    const verifyOnLoad = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();

        if (!sessionData.session) {
          if (isMounted) { setSession(null); setProfile(null); setLoading(false); }
          return;
        }

        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userData?.user) {
          console.warn('[Auth] getUser() rejected — purging.');
          await purgeSession();
          if (isMounted) setLoading(false);
          return;
        }

        const ok = await checkProfile(userData.user);

        if (!isMounted) return;

        if (ok && !purgedRef.current) {
          setSession(sessionData.session);
          setIsDemo(false);
          localStorage.removeItem('bedo_demo_session');
        }
        setLoading(false);
      } catch (err) {
        console.warn('[Auth] verifyOnLoad failed:', err);
        await purgeSession();
        if (isMounted) setLoading(false);
      }
    };

    verifyOnLoad();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      // Skip INITIAL_SESSION: verifyOnLoad is the sole authority at startup.
      // Allowing INITIAL_SESSION here races with verifyOnLoad and can re-set
      // the session AFTER purgeSession has already cleared it.
      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT' || !currentSession) {
        if (isMounted) { setSession(null); setProfile(null); setLoading(false); }
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        if (isMounted && !purgedRef.current) setSession(currentSession);
        return;
      }

      if (purgedRef.current) return;

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) {
        await purgeSession();
        if (isMounted) setLoading(false);
        return;
      }

      const ok = await checkProfile(userData.user);
      if (!isMounted) return;

      if (ok && !purgedRef.current) {
        setSession(currentSession);
        setIsDemo(false);
        localStorage.removeItem('bedo_demo_session');
      }
      setLoading(false);
    });

    const handleFocus = async () => {
      if (purgedRef.current) return;
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData?.user) {
        console.warn('[Auth] Focus: auth user gone — purging.');
        await purgeSession();
        return;
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (!prof) {
        console.warn('[Auth] Focus: profile deleted — purging.');
        await purgeSession();
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkProfile, purgeSession]);

  const signInDemo = () => {
    purgedRef.current = false;
    localStorage.setItem('bedo_demo_session', 'true');
    setIsDemo(true);
    setProfile(DEMO_PROFILE);
  };

  const signOut = async () => { await purgeSession(); };

  const activeUser = session?.user ?? (isDemo ? DEMO_USER : null);
  const activeProfile = profile ?? (isDemo ? DEMO_PROFILE : null);
  const isAuthenticated = Boolean(session || isDemo);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: activeUser,
        profile: activeProfile,
        loading,
        isDemo,
        isAuthenticated,
        isSupabaseConfigured,
        signInDemo,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);