import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Per-account state that has no table of its own — the roadmap canvas, which
 * notifications you've read, and your display preferences.
 *
 * All of this used to live in localStorage, which meant it belonged to the
 * BROWSER rather than to the person: a new signup inherited whatever the last
 * person on that device had left behind, and your own data didn't follow you
 * to another device. It now lives in public.user_state, one row per account
 * per key, protected by Row Level Security.
 *
 * See supabase_cloud_state.sql.
 */
export type UserStateKey = 'roadmap_canvas' | 'notifications' | 'preferences';

async function currentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Reads one key for the signed-in account. Returns `fallback` when signed out. */
export async function loadUserState<T>(key: UserStateKey, fallback: T): Promise<T> {
  const userId = await currentUserId();
  if (!userId) return fallback;

  try {
    const { data, error } = await supabase
      .from('user_state')
      .select('value')
      .eq('user_id', userId)
      .eq('key', key)
      .maybeSingle();

    if (error || !data) return fallback;
    return (data.value as T) ?? fallback;
  } catch (err) {
    console.warn('[UserState] Load failed for', key, err);
    return fallback;
  }
}

/** Writes one key for the signed-in account. No-op when signed out. */
export async function saveUserState<T>(key: UserStateKey, value: T): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;

  try {
    const { error } = await supabase
      .from('user_state')
      .upsert(
        { user_id: userId, key, value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,key' },
      );
    if (error) console.warn('[UserState] Save failed for', key, error.message);
  } catch (err) {
    console.warn('[UserState] Save threw for', key, err);
  }
}

// Canvas edits fire in bursts (dragging a node, bulk status changes), so writes
// are coalesced rather than sent on every keystroke.
interface Pending { timer: ReturnType<typeof setTimeout>; value: unknown }
const pending: Partial<Record<UserStateKey, Pending>> = {};

/** Debounced write — the last value queued within `delay` ms is the one saved. */
export function queueUserState<T>(key: UserStateKey, value: T, delay = 700): void {
  const existing = pending[key];
  if (existing) clearTimeout(existing.timer);
  pending[key] = {
    value,
    timer: setTimeout(() => {
      delete pending[key];
      void saveUserState(key, value);
    }, delay),
  };
}

/**
 * Writes any queued values right now instead of waiting out the debounce.
 * Called before sign-out so an edit made in the last second isn't lost.
 */
export async function flushUserState(): Promise<void> {
  const keys = Object.keys(pending) as UserStateKey[];
  await Promise.all(keys.map(async key => {
    const entry = pending[key];
    if (!entry) return;
    clearTimeout(entry.timer);
    delete pending[key];
    await saveUserState(key, entry.value);
  }));
}
