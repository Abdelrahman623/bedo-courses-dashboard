import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { storage, getActiveUserId } from '../lib/storage';
import type { Project } from '../types';

interface ProjectsState {
  projects: Project[];
  loading: boolean;
  view: 'grid' | 'kanban';

  fetchProjects: () => Promise<void>;
  addProject: (p: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProject: (id: string, changes: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setView: (v: 'grid' | 'kanban') => void;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: storage.get<Project[]>('projects', []),
  loading: false,
  view: 'grid',

  fetchProjects: async () => {
    if (!isSupabaseConfigured) return;
    set({ loading: true });
    try {
      const userId = await getActiveUserId();
      const { data } = await supabase
        .from('projects')
        .select('*')
        .or(`user_id.eq.${userId},user_id.eq.local`)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        set({ projects: data as Project[], loading: false });
        storage.set('projects', data);
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  addProject: async (p) => {
    const userId = await getActiveUserId();
    const now = new Date().toISOString();
    const newProject: Project = {
      ...p,
      id: crypto.randomUUID ? crypto.randomUUID() : `proj_${Date.now()}`,
      user_id: userId,
      created_at: now,
      updated_at: now,
    };

    // 1. Optimistic update
    const updated = [newProject, ...get().projects];
    set({ projects: updated });
    storage.set('projects', updated);

    // 2. Cloud sync
    if (isSupabaseConfigured) {
      try {
        await supabase.from('projects').insert(newProject);
      } catch (err) {
        console.warn('[ProjectsStore] Saved locally, cloud sync pending:', err);
      }
    }
  },

  updateProject: async (id, changes) => {
    const now = new Date().toISOString();
    const updated = get().projects.map(p =>
      p.id === id ? { ...p, ...changes, updated_at: now } : p
    );
    set({ projects: updated });
    storage.set('projects', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('projects').update({ ...changes, updated_at: now }).eq('id', id);
      } catch (err) {
        console.warn('[ProjectsStore] Update failed to sync:', err);
      }
    }
  },

  deleteProject: async (id) => {
    const updated = get().projects.filter(p => p.id !== id);
    set({ projects: updated });
    storage.set('projects', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('projects').delete().eq('id', id);
      } catch (err) {
        console.warn('[ProjectsStore] Delete failed to sync:', err);
      }
    }
  },

  setView: (v) => set({ view: v }),
}));
