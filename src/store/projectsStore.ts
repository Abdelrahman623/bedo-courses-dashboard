import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getActiveUserId } from '../lib/storage';
import type { Project } from '../types';

interface ProjectsState {
  projects: Project[];
  loading: boolean;
  view: 'grid' | 'kanban';

  fetchProjects: () => Promise<void>;
  addProject: (p: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateProject: (id: string, changes: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setView: (v: 'grid' | 'kanban') => void;
}

// Starts empty and is filled from Supabase on sign-in. Nothing is read from
// the browser, so a new account never inherits the previous one's projects.
export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  loading: false,
  view: 'grid',

  fetchProjects: async () => {
    if (!isSupabaseConfigured) return;
    set({ loading: true });
    try {
      const userId = await getActiveUserId();
      if (!userId) {
        set({ projects: [], loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // An empty result is a real answer ("this account has no projects"),
      // not a reason to keep showing whatever was on screen before.
      set({ projects: error ? get().projects : ((data as Project[]) ?? []), loading: false });
    } catch (err) {
      console.warn('[ProjectsStore] Fetch failed:', err);
      set({ loading: false });
    }
  },

  addProject: async (p) => {
    const userId = await getActiveUserId();
    if (!userId) return;

    const now = new Date().toISOString();
    const newProject: Project = {
      ...p,
      id: crypto.randomUUID ? crypto.randomUUID() : `proj_${Date.now()}`,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    // Optimistic on screen, then written to the account.
    set({ projects: [newProject, ...get().projects] });

    const { error } = await supabase.from('projects').insert(newProject);
    if (error) {
      console.warn('[ProjectsStore] Insert failed, rolling back:', error.message);
      set({ projects: get().projects.filter(x => x.id !== newProject.id) });
    }
  },

  updateProject: async (id, changes) => {
    const previous = get().projects;
    const now = new Date().toISOString();
    set({
      projects: previous.map(p => (p.id === id ? { ...p, ...changes, updated_at: now } : p)),
    });

    const { error } = await supabase
      .from('projects')
      .update({ ...changes, updated_at: now })
      .eq('id', id);

    if (error) {
      console.warn('[ProjectsStore] Update failed, rolling back:', error.message);
      set({ projects: previous });
    }
  },

  deleteProject: async (id) => {
    const previous = get().projects;
    set({ projects: previous.filter(p => p.id !== id) });

    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      console.warn('[ProjectsStore] Delete failed, rolling back:', error.message);
      set({ projects: previous });
    }
  },

  setView: (v) => set({ view: v }),
}));
