import { create } from 'zustand';
import type { CourseMode } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { queueUserState } from '../lib/userState';

// Shared UI chrome state. Currently: the off-canvas sidebar used on
// phone/tablet widths (below the `lg` breakpoint) — TopBar's hamburger
// button opens it, Sidebar renders it and closes itself on navigation or
// backdrop click — and the global Academic/Courses mode switcher.

const MODE_STORAGE_KEY = 'bedo_ui_mode';
const ACADEMIC_ENABLED_STORAGE_KEY = 'bedo_academic_mode_enabled';

function parseBooleanSetting(val: unknown, defaultValue = true): boolean {
  if (val === false || val === 'false' || val === 0 || val === '0') return false;
  if (val === true || val === 'true' || val === 1 || val === '1') return true;
  return defaultValue;
}

function readStoredAcademicEnabled(): boolean {
  try {
    const stored = localStorage.getItem(ACADEMIC_ENABLED_STORAGE_KEY);
    return parseBooleanSetting(stored, true);
  } catch {
    return true;
  }
}

function writeStoredAcademicEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(ACADEMIC_ENABLED_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    /* private browsing, quota, etc. */
  }
}

function readStoredMode(): CourseMode {
  try {
    const isAcademicEnabled = readStoredAcademicEnabled();
    if (!isAcademicEnabled) return 'courses';
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    return stored === 'academic' ? 'academic' : 'courses';
  } catch {
    return 'courses';
  }
}

function writeStoredMode(mode: CourseMode): void {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    /* private browsing, quota, etc. — falls back to session-only */
  }
}

interface UIState {
  mobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;

  /** Which of the two coexisting modes is currently displayed. */
  mode: CourseMode;
  setMode: (mode: CourseMode) => void;
  toggleMode: () => void;

  /** Whether Academic Mode is enabled globally. When stopped/disabled by admin,
   *  the dashboard remains strictly in 'courses' mode for all users. */
  academicModeEnabled: boolean;
  setAcademicModeEnabled: (enabled: boolean) => void;
  fetchAcademicMode: () => Promise<void>;
  subscribeAcademicMode: () => () => void;
  stopAcademicMode: () => Promise<{ success: boolean; error?: string }>;
  startAcademicMode: () => Promise<{ success: boolean; error?: string }>;
}

export const useUIStore = create<UIState>((set, get) => ({
  mobileSidebarOpen: false,
  openMobileSidebar: () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
  toggleMobileSidebar: () => set(s => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),

  academicModeEnabled: readStoredAcademicEnabled(),
  mode: readStoredAcademicEnabled() ? readStoredMode() : 'courses',

  setMode: (mode) => {
    if (mode === 'academic' && !get().academicModeEnabled) {
      writeStoredMode('courses');
      set({ mode: 'courses' });
      return;
    }
    writeStoredMode(mode);
    set({ mode });
  },

  toggleMode: () => {
    if (!get().academicModeEnabled) {
      writeStoredMode('courses');
      set({ mode: 'courses' });
      return;
    }
    const next: CourseMode = get().mode === 'academic' ? 'courses' : 'academic';
    writeStoredMode(next);
    set({ mode: next });
  },

  setAcademicModeEnabled: (enabled: boolean) => {
    writeStoredAcademicEnabled(enabled);
    if (!enabled) {
      writeStoredMode('courses');
      set({ academicModeEnabled: false, mode: 'courses' });
    } else {
      set({ academicModeEnabled: true });
    }
  },

  fetchAcademicMode: async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'academic_mode_enabled')
        .maybeSingle();

      if (error) {
        console.warn('[UIStore] Failed to fetch system_settings for academic_mode:', error.message);
        return;
      }
      if (data && typeof data.value !== 'undefined') {
        const isEnabled = parseBooleanSetting(data.value, true);
        get().setAcademicModeEnabled(isEnabled);
      }
    } catch (err) {
      console.warn('[UIStore] Error fetching system_settings:', err);
    }
  },

  subscribeAcademicMode: () => {
    if (!isSupabaseConfigured) return () => {};
    const channel = supabase
      .channel('global-system-settings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings' },
        (payload) => {
          const newRow = payload.new as { key?: string; value?: unknown } | null;
          if (newRow?.key === 'academic_mode_enabled') {
            const isEnabled = parseBooleanSetting(newRow.value, true);
            get().setAcademicModeEnabled(isEnabled);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  stopAcademicMode: async () => {
    // 1. Immediately update local state
    writeStoredAcademicEnabled(false);
    writeStoredMode('courses');
    set({ academicModeEnabled: false, mode: 'courses' });
    queueUserState('preferences', { academic_mode_enabled: false });

    if (!isSupabaseConfigured) return { success: true };

    try {
      // 2. Try RPC set_academic_mode
      const { data, error: rpcErr } = await supabase.rpc('set_academic_mode', { enabled: false });
      if (!rpcErr && data && data.success !== false) {
        return { success: true };
      }

      // 3. Fallback to direct upsert
      const { error: upsertErr } = await supabase
        .from('system_settings')
        .upsert({
          key: 'academic_mode_enabled',
          value: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

      if (upsertErr) {
        console.error('[UIStore] Failed to stop academic mode globally in database:', upsertErr);
        return { success: false, error: upsertErr.message };
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown database error';
      console.error('[UIStore] stopAcademicMode threw:', err);
      return { success: false, error: msg };
    }
  },

  startAcademicMode: async () => {
    writeStoredAcademicEnabled(true);
    writeStoredMode('academic');
    set({ academicModeEnabled: true, mode: 'academic' });
    queueUserState('preferences', { academic_mode_enabled: true });

    if (!isSupabaseConfigured) return { success: true };

    try {
      const { data, error: rpcErr } = await supabase.rpc('set_academic_mode', { enabled: true });
      if (!rpcErr && data && data.success !== false) {
        return { success: true };
      }

      const { error: upsertErr } = await supabase
        .from('system_settings')
        .upsert({
          key: 'academic_mode_enabled',
          value: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

      if (upsertErr) {
        console.error('[UIStore] Failed to start academic mode globally in database:', upsertErr);
        return { success: false, error: upsertErr.message };
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown database error';
      console.error('[UIStore] startAcademicMode threw:', err);
      return { success: false, error: msg };
    }
  },
}));
