import { create } from 'zustand';

// Shared UI chrome state. Currently just the off-canvas sidebar used on
// phone/tablet widths (below the `lg` breakpoint) — TopBar's hamburger
// button opens it, Sidebar renders it and closes itself on navigation
// or backdrop click.
interface UIState {
  mobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  mobileSidebarOpen: false,
  openMobileSidebar: () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
  toggleMobileSidebar: () => set(s => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
}));
