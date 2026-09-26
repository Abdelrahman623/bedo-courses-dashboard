import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ProjectMilestone, MilestoneItem } from '../types';

interface MilestonesState {
  /** Milestones keyed by project_id */
  milestones: Record<string, ProjectMilestone[]>;
  loading: boolean;

  fetchMilestones: (projectId: string) => Promise<void>;
  addMilestone: (projectId: string, data: { title: string; definition?: string }) => Promise<{ error?: string }>;
  updateMilestone: (id: string, projectId: string, changes: Partial<Pick<ProjectMilestone, 'title' | 'definition'>>) => Promise<void>;
  deleteMilestone: (id: string, projectId: string) => Promise<void>;

  addItem: (milestoneId: string, projectId: string, text: string) => Promise<{ error?: string }>;
  toggleItem: (itemId: string, milestoneId: string, projectId: string, done: boolean) => Promise<void>;
  deleteItem: (itemId: string, milestoneId: string, projectId: string) => Promise<void>;
}

const projectMilestonesOf = (state: MilestonesState, projectId: string): ProjectMilestone[] =>
  state.milestones[projectId] ?? [];

export const useMilestonesStore = create<MilestonesState>((set, get) => ({
  milestones: {},
  loading: false,

  fetchMilestones: async (projectId) => {
    if (!isSupabaseConfigured) return;
    set({ loading: true });
    try {
      // Step 1: fetch milestones
      const { data: mData, error: mErr } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (mErr) {
        console.error('[MilestonesStore] fetchMilestones error:', mErr.code, mErr.message);
        return;
      }

      const rawMilestones = (mData ?? []) as any[];
      const milestoneIds = rawMilestones.map(m => m.id);

      // Step 2: fetch items using .in() — no fragile PostgREST joins
      let items: MilestoneItem[] = [];
      if (milestoneIds.length > 0) {
        const { data: iData, error: iErr } = await supabase
          .from('milestone_items')
          .select('*')
          .in('milestone_id', milestoneIds)
          .order('position', { ascending: true })
          .order('created_at', { ascending: true });

        if (iErr) {
          console.error('[MilestonesStore] fetchItems error:', iErr.code, iErr.message);
        } else {
          items = (iData ?? []) as MilestoneItem[];
        }
      }

      // Group items by milestone
      const itemsByMilestone: Record<string, MilestoneItem[]> = {};
      for (const item of items) {
        if (!itemsByMilestone[item.milestone_id]) itemsByMilestone[item.milestone_id] = [];
        itemsByMilestone[item.milestone_id].push(item);
      }

      const milestones: ProjectMilestone[] = rawMilestones.map(m => ({
        ...m,
        items: itemsByMilestone[m.id] ?? [],
      }));

      set(s => ({ milestones: { ...s.milestones, [projectId]: milestones } }));
    } finally {
      set({ loading: false });
    }
  },

  addMilestone: async (projectId, { title, definition }) => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' };

    const existing = projectMilestonesOf(get(), projectId);
    const position = existing.length;
    const now = new Date().toISOString();

    const newMilestone: ProjectMilestone = {
      id: crypto.randomUUID(),
      project_id: projectId,
      title: title.trim(),
      definition: definition?.trim() || undefined,
      position,
      items: [],
      created_at: now,
      updated_at: now,
    };

    // Optimistic update
    set(s => ({
      milestones: {
        ...s.milestones,
        [projectId]: [...projectMilestonesOf(s, projectId), newMilestone],
      },
    }));

    const { error } = await supabase.from('project_milestones').insert({
      id: newMilestone.id,
      project_id: projectId,
      title: newMilestone.title,
      definition: newMilestone.definition ?? null,
      position,
    });

    if (error) {
      console.error('[MilestonesStore] addMilestone error:', error.code, error.message, error.details, error.hint);
      // Roll back optimistic update
      set(s => ({
        milestones: {
          ...s.milestones,
          [projectId]: projectMilestonesOf(s, projectId).filter(m => m.id !== newMilestone.id),
        },
      }));
      return { error: error.message };
    }

    return {};
  },

  updateMilestone: async (id, projectId, changes) => {
    const previous = projectMilestonesOf(get(), projectId);
    const now = new Date().toISOString();

    set(s => ({
      milestones: {
        ...s.milestones,
        [projectId]: projectMilestonesOf(s, projectId).map(m =>
          m.id === id ? { ...m, ...changes, updated_at: now } : m,
        ),
      },
    }));

    const { error } = await supabase
      .from('project_milestones')
      .update({ ...changes, updated_at: now })
      .eq('id', id);

    if (error) {
      console.error('[MilestonesStore] updateMilestone error:', error.code, error.message);
      set(s => ({ milestones: { ...s.milestones, [projectId]: previous } }));
    }
  },

  deleteMilestone: async (id, projectId) => {
    const previous = projectMilestonesOf(get(), projectId);

    set(s => ({
      milestones: {
        ...s.milestones,
        [projectId]: projectMilestonesOf(s, projectId).filter(m => m.id !== id),
      },
    }));

    const { error } = await supabase.from('project_milestones').delete().eq('id', id);
    if (error) {
      console.error('[MilestonesStore] deleteMilestone error:', error.code, error.message);
      set(s => ({ milestones: { ...s.milestones, [projectId]: previous } }));
    }
  },

  addItem: async (milestoneId, projectId, text) => {
    if (!isSupabaseConfigured || !text.trim()) return { error: 'Invalid input' };

    const milestone = projectMilestonesOf(get(), projectId).find(m => m.id === milestoneId);
    if (!milestone) return { error: 'Milestone not found' };

    const position = milestone.items.length;
    const now = new Date().toISOString();
    const newItem: MilestoneItem = {
      id: crypto.randomUUID(),
      milestone_id: milestoneId,
      text: text.trim(),
      done: false,
      position,
      created_at: now,
    };

    // Optimistic update
    set(s => ({
      milestones: {
        ...s.milestones,
        [projectId]: projectMilestonesOf(s, projectId).map(m =>
          m.id === milestoneId ? { ...m, items: [...m.items, newItem] } : m,
        ),
      },
    }));

    const { error } = await supabase.from('milestone_items').insert({
      id: newItem.id,
      milestone_id: milestoneId,
      text: newItem.text,
      done: false,
      position,
    });

    if (error) {
      console.error('[MilestonesStore] addItem error:', error.code, error.message, error.details, error.hint);
      // Roll back
      set(s => ({
        milestones: {
          ...s.milestones,
          [projectId]: projectMilestonesOf(s, projectId).map(m =>
            m.id === milestoneId
              ? { ...m, items: m.items.filter(i => i.id !== newItem.id) }
              : m,
          ),
        },
      }));
      return { error: error.message };
    }

    return {};
  },

  toggleItem: async (itemId, milestoneId, projectId, done) => {
    // Optimistic
    set(s => ({
      milestones: {
        ...s.milestones,
        [projectId]: projectMilestonesOf(s, projectId).map(m =>
          m.id === milestoneId
            ? { ...m, items: m.items.map(i => (i.id === itemId ? { ...i, done } : i)) }
            : m,
        ),
      },
    }));

    const { error } = await supabase
      .from('milestone_items')
      .update({ done })
      .eq('id', itemId);

    if (error) {
      console.error('[MilestonesStore] toggleItem error:', error.code, error.message);
      // Revert
      set(s => ({
        milestones: {
          ...s.milestones,
          [projectId]: projectMilestonesOf(s, projectId).map(m =>
            m.id === milestoneId
              ? { ...m, items: m.items.map(i => (i.id === itemId ? { ...i, done: !done } : i)) }
              : m,
          ),
        },
      }));
    }
  },

  deleteItem: async (itemId, milestoneId, projectId) => {
    const previous = projectMilestonesOf(get(), projectId);

    set(s => ({
      milestones: {
        ...s.milestones,
        [projectId]: projectMilestonesOf(s, projectId).map(m =>
          m.id === milestoneId ? { ...m, items: m.items.filter(i => i.id !== itemId) } : m,
        ),
      },
    }));

    const { error } = await supabase.from('milestone_items').delete().eq('id', itemId);
    if (error) {
      console.error('[MilestonesStore] deleteItem error:', error.code, error.message);
      set(s => ({ milestones: { ...s.milestones, [projectId]: previous } }));
    }
  },
}));
