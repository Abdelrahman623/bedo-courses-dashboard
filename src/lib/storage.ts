import { supabase } from './supabase';

/**
 * Gets the current authenticated user's ID, or falls back to 'local'
 */
export async function getActiveUserId(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || 'local';
  } catch {
    return 'local';
  }
}

/**
 * LocalStorage sync helper with fallback
 */
export const storage = {
  get: <T>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(`bedo_${key}`);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(`bedo_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('[Storage] Failed to save key:', key, e);
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(`bedo_${key}`);
    } catch {}
  },
};
