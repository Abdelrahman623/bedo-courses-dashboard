import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getActiveUserId } from '../lib/storage';
import type { Project, ProjectRole } from '../types';

interface ProjectsState {
  projects: Project[];
  loading: boolean;
  view: 'grid' | 'kanban' | 'roadmap';
  selectedRoadmapProjectId: string | null;

  fetchProjects: () => Promise<void>;
  addProject: (p: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<{ error?: string }>;
  updateProject: (id: string, changes: Partial<Project>) => Promise<{ error?: string }>;
  deleteProject: (id: string) => Promise<void>;
  leaveProject: (id: string) => Promise<{ error?: string }>;
  setView: (v: 'grid' | 'kanban' | 'roadmap') => void;

  setSelectedRoadmapProjectId: (id: string | null) => void;
}

// Starts empty and is filled from Supabase on sign-in. Nothing is read from
// the browser, so a new account never inherits the previous one's projects.
export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  loading: false,
  view: 'grid',
  selectedRoadmapProjectId: null,

  fetchProjects: async () => {
    if (!isSupabaseConfigured) return;
    set({ loading: true });
    try {
      const userId = await getActiveUserId();
      if (!userId) {
        set({ projects: [], loading: false });
        return;
      }

      // Claim any legacy 'local' rows to this user's real UUID via security definer RPC
      try {
        await supabase.rpc('claim_local_projects');
      } catch {
        // best-effort
      }

      // Fetch owned projects and accepted-invite project IDs with their role in parallel
      const [{ data: ownedData, error: ownedErr }, { data: sharedInvites, error: inviteErr }] =
        await Promise.all([
          supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
          supabase
            .from('project_invites')
            .select('project_id, role')
            .eq('invitee_id', userId)
            .eq('status', 'accepted'),
        ]);

      if (ownedErr) {
        console.warn('[ProjectsStore] Fetch owned failed:', ownedErr.message);
        set({ loading: false });
        return;
      }

      const owned: Project[] = ((ownedData as Project[]) ?? []).map(p => ({
        ...p,
        currentUserRole: 'owner',
      }));

      // Map roles for shared projects
      const roleByProjectId = new Map<string, ProjectRole>();
      (sharedInvites ?? []).forEach((r: any) => {
        if (r.project_id) {
          roleByProjectId.set(r.project_id, (r.role as ProjectRole) || 'partner');
        }
      });

      // Fetch the actual shared project rows
      const sharedIds = (sharedInvites ?? []).map((r: { project_id: string }) => r.project_id);
      let shared: Project[] = [];
      if (inviteErr) {
        console.warn('[ProjectsStore] Fetch shared invites failed:', inviteErr.message);
      }
      if (sharedIds.length > 0) {
        const { data: sharedData, error: sharedErr } = await supabase
          .from('projects')
          .select('*')
          .in('id', sharedIds)
          .order('created_at', { ascending: false });
        if (sharedErr) {
          console.warn('[ProjectsStore] Fetch shared projects failed:', sharedErr.message);
        }
        shared = ((sharedData as Project[]) ?? []).map(p => ({
          ...p,
          isShared: true,
          currentUserRole: roleByProjectId.get(p.id) || 'partner',
        }));
      }


      // Merge: owned first, then shared (deduplicated)
      const ownedIds = new Set(owned.map(p => p.id));
      const merged = [...owned, ...shared.filter(p => !ownedIds.has(p.id))];

      set({ projects: merged, loading: false });
    } catch (err) {
      console.warn('[ProjectsStore] Fetch failed:', err);
      set({ loading: false });
    }
  },

  addProject: async (p) => {
    const userId = await getActiveUserId();
    if (!userId) {
      console.error('[ProjectsStore] Cannot add project: no active user id');
      return { error: 'You must be signed in to create a project.' };
    }

    const now = new Date().toISOString();
    const newProject: Project = {
      ...p,
      id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
          }),
      user_id: userId,
      created_at: now,
      updated_at: now,
      currentUserRole: 'owner',
    };

    // Clean payload for database insert - strip client-only properties
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isShared, currentUserRole, ...dbProject } = newProject as any;

    const { error } = await supabase.from('projects').insert(dbProject);

    if (error) {
      console.error('[ProjectsStore] Insert project failed:', error.code, error.message, error.details, error.hint);
      return { error: error.message };
    }

    set(s => ({ projects: [newProject, ...s.projects] }));
    return {};
  },

  updateProject: async (id, changes) => {
    const previous = get().projects;
    const now = new Date().toISOString();

    // Clean changes - strip client-only properties
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { isShared, ...dbChanges } = changes as any;

    const { error } = await supabase
      .from('projects')
      .update({ ...dbChanges, updated_at: now })
      .eq('id', id);

    if (error) {
      console.error('[ProjectsStore] Update failed:', error.code, error.message, error.details, error.hint);
      return { error: error.message };
    }

    set({
      projects: previous.map(p => (p.id === id ? { ...p, ...changes, updated_at: now } : p)),
    });
    return {};
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

  leaveProject: async (id) => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' };
    const userId = await getActiveUserId();
    if (!userId) return { error: 'Not signed in' };

    const { error } = await supabase
      .from('project_invites')
      .delete()
      .eq('project_id', id)
      .eq('invitee_id', userId);

    if (error) {
      console.error('[ProjectsStore] leaveProject failed:', error.message);
      return { error: error.message };
    }

    set(s => ({
      projects: s.projects.filter(p => p.id !== id),
      selectedRoadmapProjectId: s.selectedRoadmapProjectId === id ? null : s.selectedRoadmapProjectId,
    }));
    return {};
  },

  setView: (v) => set({ view: v }),
  setSelectedRoadmapProjectId: (id) => set({ selectedRoadmapProjectId: id }),
}));

