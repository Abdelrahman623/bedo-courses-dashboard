import { supabase, isSupabaseConfigured } from './supabase';

/**
 * This app stores NOTHING of yours in the browser any more.
 *
 * Every piece of user data — courses, topics, the roadmap canvas, notes,
 * projects, sessions, notifications, preferences — lives in Supabase under
 * your account and is loaded fresh on sign-in. localStorage previously held
 * all of it under device-wide `bedo_*` keys, which is why a new account could
 * open the app and find someone else's roadmap already on screen.
 *
 * The one exception is the theme id (see themeCache below), which is a paint
 * hint, not data — and it's cleared on sign-out like everything else.
 */

/** The signed-in user's id, or null when nobody is signed in. */
export async function getActiveUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

const THEME_CACHE_KEY = 'theme_accent';

/**
 * The theme id has to be readable synchronously, before React mounts and
 * before any network call can finish, or the app paints in default colours
 * and then visibly repaints. So the id — and only the id — is mirrored here.
 * The source of truth is still `preferences` in public.user_state; this copy
 * is overwritten by the account's real value on every sign-in and wiped on
 * sign-out.
 */
export const themeCache = {
  get: (): string | null => {
    try {
      return localStorage.getItem(THEME_CACHE_KEY);
    } catch {
      return null;
    }
  },
  set: (themeId: string): void => {
    try {
      localStorage.setItem(THEME_CACHE_KEY, themeId);
    } catch { /* private browsing, quota, etc. — the DB still has it */ }
  },
};

/**
 * Removes every trace of the previous user from this browser: the theme paint
 * cache, all legacy `bedo_*` keys from before the move to cloud storage, and
 * any Supabase auth tokens. Called on sign-out and after account deletion.
 */
export function clearAllUserData(): void {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith('bedo_') || k === THEME_CACHE_KEY)
      .forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.warn('[Storage] Failed to clear browser data:', e);
  }
}
