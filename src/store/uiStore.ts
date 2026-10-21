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

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
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
  isUpdatingAcademicMode: boolean;
  setAcademicModeEnabled: (enabled: boolean) => void;
  fetchAcademicMode: () => Promise<void>;
  subscribeAcademicMode: () => () => void;
  stopAcademicMode: () => Promise<{ success: boolean; error?: string }>;
  startAcademicMode: () => Promise<{ success: boolean; error?: string }>;

  /** Global UI toast notifications */
  toast: ToastNotification | null;
  showToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
  hideToast: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUIStore = create<UIState>((set, get) => ({
  mobileSidebarOpen: false,
  openMobileSidebar: () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
  toggleMobileSidebar: () => set(s => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),

  academicModeEnabled: readStoredAcademicEnabled(),
  isUpdatingAcademicMode: false,
  mode: readStoredAcademicEnabled() ? readStoredMode() : 'courses',

  toast: null,
  showToast: (type, message, title) => {
    if (toastTimer) clearTimeout(toastTimer);
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    set({ toast: { id, type, message, title } });
    toastTimer = setTimeout(() => {
      set(s => (s.toast?.id === id ? { toast: null } : {}));
    }, 6000);
  },
  hideToast: () => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: null });
  },

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

      if (!error && data && typeof data.value !== 'undefined') {
        const isEnabled = parseBooleanSetting(data.value, true);
        get().setAcademicModeEnabled(isEnabled);
        return;
      }

      // Fallback: try RPC get_academic_mode
      const { data: rpcVal, error: rpcErr } = await supabase.rpc('get_academic_mode');
      if (!rpcErr && typeof rpcVal === 'boolean') {
        get().setAcademicModeEnabled(rpcVal);
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
    set({ isUpdatingAcademicMode: true });

    if (!isSupabaseConfigured) {
      get().setAcademicModeEnabled(false);
      set({ isUpdatingAcademicMode: false });
      get().showToast('success', 'Academic Mode stopped (offline mode).');
      return { success: true };
    }

    try {
      let updateError: string | null = null;
      let rpcSucceeded = false;

      // 1. Try RPC set_academic_mode
      try {
        const { data, error: rpcErr } = await supabase.rpc('set_academic_mode', { enabled: false });
        if (rpcErr) {
          updateError = rpcErr.message;
        } else if (data && typeof data === 'object') {
          const resObj = data as { success?: boolean; error?: string };
          if (resObj.success === false) {
            updateError = resObj.error || 'Admin authorisation failed.';
          } else {
            rpcSucceeded = true;
          }
        } else {
          rpcSucceeded = true;
        }
      } catch (e: unknown) {
        updateError = e instanceof Error ? e.message : 'RPC call failed';
      }

      // 2. Direct upsert fallback
      if (!rpcSucceeded) {
        const { error: upsertErr } = await supabase
          .from('system_settings')
          .upsert({
            key: 'academic_mode_enabled',
            value: false,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'key' });

        if (!upsertErr) {
          rpcSucceeded = true;
          updateError = null;
        } else {
          updateError = upsertErr.message;
        }
      }

      if (!rpcSucceeded) {
        set({ isUpdatingAcademicMode: false });
        const errMsg = updateError || 'Failed to write to database.';
        get().showToast(
          'error',
          `Could not stop Academic Mode for all users: ${errMsg}. Please run the migration script in Supabase SQL Editor.`,
          'Database Sync Failed'
        );
        return { success: false, error: errMsg };
      }

      // DB write succeeded - update store and notify
      get().setAcademicModeEnabled(false);
      queueUserState('preferences', { academic_mode_enabled: false });
      set({ isUpdatingAcademicMode: false });
      get().showToast(
        'success',
        'Academic Mode has been stopped globally for all users.',
        'Academic Mode Stopped'
      );
      return { success: true };
    } catch (err: unknown) {
      set({ isUpdatingAcademicMode: false });
      const msg = err instanceof Error ? err.message : 'Unknown database error';
      get().showToast(
        'error',
        `Failed to stop Academic Mode: ${msg}`,
        'Database Sync Failed'
      );
      return { success: false, error: msg };
    }
  },

  startAcademicMode: async () => {
    set({ isUpdatingAcademicMode: true });

    if (!isSupabaseConfigured) {
      get().setAcademicModeEnabled(true);
      set({ isUpdatingAcademicMode: false });
      get().showToast('success', 'Academic Mode started (offline mode).');
      return { success: true };
    }

    try {
      let updateError: string | null = null;
      let rpcSucceeded = false;

      try {
        const { data, error: rpcErr } = await supabase.rpc('set_academic_mode', { enabled: true });
        if (rpcErr) {
          updateError = rpcErr.message;
        } else if (data && typeof data === 'object') {
          const resObj = data as { success?: boolean; error?: string };
          if (resObj.success === false) {
            updateError = resObj.error || 'Admin authorisation failed.';
          } else {
            rpcSucceeded = true;
          }
        } else {
          rpcSucceeded = true;
        }
      } catch (e: unknown) {
        updateError = e instanceof Error ? e.message : 'RPC call failed';
      }

      if (!rpcSucceeded) {
        const { error: upsertErr } = await supabase
          .from('system_settings')
          .upsert({
            key: 'academic_mode_enabled',
            value: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'key' });

        if (!upsertErr) {
          rpcSucceeded = true;
          updateError = null;
        } else {
          updateError = upsertErr.message;
        }
      }

      if (!rpcSucceeded) {
        set({ isUpdatingAcademicMode: false });
        const errMsg = updateError || 'Failed to write to database.';
        get().showToast(
          'error',
          `Could not start Academic Mode for all users: ${errMsg}. Please run the migration script in Supabase SQL Editor.`,
          'Database Sync Failed'
        );
        return { success: false, error: errMsg };
      }

      get().setAcademicModeEnabled(true);
      queueUserState('preferences', { academic_mode_enabled: true });
      set({ isUpdatingAcademicMode: false });
      get().showToast(
        'success',
        'Academic Mode has been started globally for all users.',
        'Academic Mode Started'
      );
      return { success: true };
    } catch (err: unknown) {
      set({ isUpdatingAcademicMode: false });
      const msg = err instanceof Error ? err.message : 'Unknown database error';
      get().showToast(
        'error',
        `Failed to start Academic Mode: ${msg}`,
        'Database Sync Failed'
      );
      return { success: false, error: msg };
    }
  },
}));
