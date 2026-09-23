import { create } from 'zustand';
import type { CourseMode } from '../types';

// Shared UI chrome state. Currently: the off-canvas sidebar used on
// phone/tablet widths (below the `lg` breakpoint) — TopBar's hamburger
// button opens it, Sidebar renders it and closes itself on navigation or
// backdrop click — and the global Academic/Courses mode switcher.

const MODE_STORAGE_KEY = 'bedo_ui_mode';

// A display preference, not account data — it doesn't need to survive on
// another device, so it's kept the same way the theme paint-hint is (see
// storage.ts's `themeCache`): read synchronously on load, cleared on
// sign-out along with everything else prefixed `bedo_` (clearAllUserData
// already sweeps this key, no change needed there).
function readStoredMode(): CourseMode {
  try {
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

  /** Which of the two coexisting modes is currently displayed. Switching
   *  only changes what's shown — courses in the other mode are never
   *  deleted, hidden permanently, or otherwise affected by this toggle. */
  mode: CourseMode;
  setMode: (mode: CourseMode) => void;
  toggleMode: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  mobileSidebarOpen: false,
  openMobileSidebar: () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
  toggleMobileSidebar: () => set(s => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),

  mode: readStoredMode(),
  setMode: (mode) => {
    writeStoredMode(mode);
    set({ mode });
  },
  toggleMode: () => {
    const next: CourseMode = get().mode === 'academic' ? 'courses' : 'academic';
    writeStoredMode(next);
    set({ mode: next });
  },
}));
