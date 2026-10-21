import { create } from 'zustand';
import type { CourseMode } from '../types';
import { queueUserState } from '../lib/userState';

// Shared UI chrome state. Currently: the off-canvas sidebar used on
// phone/tablet widths (below the `lg` breakpoint) — TopBar's hamburger
// button opens it, Sidebar renders it and closes itself on navigation or
// backdrop click — and the global Academic/Courses mode switcher.

const MODE_STORAGE_KEY = 'bedo_ui_mode';
const ACADEMIC_ENABLED_STORAGE_KEY = 'bedo_academic_mode_enabled';

function readStoredAcademicEnabled(): boolean {
  try {
    const stored = localStorage.getItem(ACADEMIC_ENABLED_STORAGE_KEY);
    return stored !== 'false';
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

  /** Whether Academic Mode is enabled by administrators. When stopped/disabled,
   *  the dashboard remains strictly in 'courses' mode and the switcher is deactivated. */
  academicModeEnabled: boolean;
  setAcademicModeEnabled: (enabled: boolean) => void;
  stopAcademicMode: () => void;
  startAcademicMode: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  mobileSidebarOpen: false,
  openMobileSidebar: () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
  toggleMobileSidebar: () => set(s => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),

  academicModeEnabled: readStoredAcademicEnabled(),
  mode: readStoredMode(),

  setMode: (mode) => {
    if (mode === 'academic' && !get().academicModeEnabled) {
      return;
    }
    writeStoredMode(mode);
    set({ mode });
  },

  toggleMode: () => {
    if (!get().academicModeEnabled) {
      set({ mode: 'courses' });
      return;
    }
    const next: CourseMode = get().mode === 'academic' ? 'courses' : 'academic';
    writeStoredMode(next);
    set({ mode: next });
  },

  setAcademicModeEnabled: (enabled: boolean) => {
    writeStoredAcademicEnabled(enabled);
    if (!enabled && get().mode === 'academic') {
      writeStoredMode('courses');
      set({ academicModeEnabled: false, mode: 'courses' });
    } else {
      set({ academicModeEnabled: enabled });
    }
  },

  stopAcademicMode: () => {
    writeStoredAcademicEnabled(false);
    writeStoredMode('courses');
    set({ academicModeEnabled: false, mode: 'courses' });
    queueUserState('preferences', { academic_mode_enabled: false });
  },

  startAcademicMode: () => {
    writeStoredAcademicEnabled(true);
    writeStoredMode('academic');
    set({ academicModeEnabled: true, mode: 'academic' });
    queueUserState('preferences', { academic_mode_enabled: true });
  },
}));
