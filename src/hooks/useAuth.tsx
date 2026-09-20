import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { clearAllUserData, themeCache } from '../lib/storage';
import { resetAllStores } from '../lib/resetStores';
import { loadUserState, flushUserState } from '../lib/userState';
import { applyTheme } from '../lib/themes';
import type { Profile } from '../types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  /** Mirrors public.profiles.is_admin — set in Supabase, never by the client. */
  isAdmin: boolean;
  isSupabaseConfigured: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  isSupabaseConfigured: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const purgedRef = useRef(false);

  const purgeSession = useCallback(async () => {
    purgedRef.current = true;
    setSession(null);
    setProfile(null);
    // Write out anything still waiting on a debounce before the session goes.
    await flushUserState();
    clearAllUserData();
    resetAllStores();
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('sb-') || k.includes('auth-token')) {
        localStorage.removeItem(k);
      }
    });
    try { await supabase.auth.signOut(); } catch { /* best-effort */ }
  }, []);

  /**
   * The theme is a per-account preference stored in public.user_state, so it
   * follows you to any device. The localStorage copy is only a paint hint used
   * before this runs, to avoid a flash of the default colours.
   */
  const applyAccountTheme = useCallback(async () => {
    const prefs = await loadUserState<{ theme?: string }>('preferences', {});
    if (prefs.theme) {
      applyTheme(prefs.theme);
      themeCache.set(prefs.theme);
    }
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
          await applyAccountTheme();
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
        await applyAccountTheme();
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
  }, [checkProfile, purgeSession, applyAccountTheme]);

  const signOut = async () => { await purgeSession(); };

  const activeUser = session?.user ?? null;
  const activeProfile = profile;
  const isAuthenticated = Boolean(session);
  // Admin is decided entirely by the database. Signed-out visitors are never
  // admin, and even if this were forged client-side, every admin RPC and RLS policy
  // re-checks it server-side (see supabase_admin_security.sql).
  const isAdmin = Boolean(session && profile?.is_admin);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: activeUser,
        profile: activeProfile,
        loading,
        isAuthenticated,
        isAdmin,
        isSupabaseConfigured,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);