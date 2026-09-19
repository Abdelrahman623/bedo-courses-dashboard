import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { storage, getActiveUserId } from '../lib/storage';
import type { Note } from '../types';

interface NotesState {
  notes: Note[];
  activeNote: Note | null;
  loading: boolean;
  searchQuery: string;

  fetchNotes: () => Promise<void>;
  setActiveNote: (note: Note | null) => void;
  createNote: (partial: Partial<Note>) => Promise<Note>;
  saveNote: (id: string, changes: Partial<Note>) => void;
  deleteNote: (id: string) => Promise<void>;
  setSearchQuery: (q: string) => void;
}

function debounceLocal(fn: (id: string, changes: Partial<Note>) => Promise<void>, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (id: string, changes: Partial<Note>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(id, changes), delay);
  };
}

export const useNotesStore = create<NotesState>((set, get) => {
  const flushToDb = debounceLocal(async (id: string, changes: Partial<Note>) => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('notes').update({ ...changes, updated_at: new Date().toISOString() }).eq('id', id);
    } catch (err) {
      console.warn('[NotesStore] Background sync error:', err);
    }
  }, 1200);

  const normalizeNote = (n: Note): Note => ({
    ...n,
    note_type: (n.note_type === 'linked' || Boolean(n.course_id || n.topic_id || n.project_id)) ? 'linked' : 'general',
  });

  const initialNotes = storage.get<Note[]>('notes', []).map(normalizeNote);

  return {
    notes: initialNotes,
    activeNote: initialNotes[0] || null,
    loading: false,
    searchQuery: '',

    fetchNotes: async () => {
      const cached = storage.get<Note[]>('notes', []).map(normalizeNote);
      if (cached.length > 0 && get().notes.length === 0) {
        set({ notes: cached, activeNote: cached[0] || null });
      }

      if (!isSupabaseConfigured) return;

      set({ loading: true });
      try {
        const userId = await getActiveUserId();
        const { data } = await supabase
          .from('notes')
          .select('*')
          .or(`user_id.eq.${userId},user_id.eq.local`)
          .order('updated_at', { ascending: false });

        if (data && data.length > 0) {
          const normalized = (data as Note[]).map(normalizeNote);
          set({
            notes: normalized,
            activeNote: get().activeNote || normalized[0] || null,
            loading: false,
          });
          storage.set('notes', normalized);
        } else {
          set({ loading: false });
        }
      } catch {
        set({ loading: false });
      }
    },

    setActiveNote: (note) => set({ activeNote: note }),

    createNote: async (partial) => {
      const userId = await getActiveUserId();
      const now = new Date().toISOString();
      const isLinked = partial.note_type === 'linked' || Boolean(partial.course_id || partial.project_id || partial.topic_id);
      const newNote: Note = {
        id: crypto.randomUUID ? crypto.randomUUID() : `note_${Date.now()}`,
        user_id: userId,
        note_type: isLinked ? 'linked' : 'general',
        course_id: partial.course_id,
        project_id: partial.project_id,
        topic_id: partial.topic_id,
        title: partial.title || 'Untitled Note',
        content: partial.content || '',
        tags: partial.tags || [],
        updated_at: now,
        created_at: now,
      };

      // 1. Optimistic Local Update
      const updatedNotes = [newNote, ...get().notes];
      set({ notes: updatedNotes, activeNote: newNote });
      storage.set('notes', updatedNotes);

      // 2. Cloud Sync
      if (isSupabaseConfigured) {
        try {
          await supabase.from('notes').insert(newNote);
        } catch (err) {
          console.warn('[NotesStore] Saved locally, cloud sync pending:', err);
        }
      }

      return newNote;
    },

    saveNote: (id, changes) => {
      const now = new Date().toISOString();
      const current = get().notes.find(n => n.id === id);
      const merged = { ...current, ...changes };
      const isLinked = merged.note_type === 'linked' || Boolean(merged.course_id || merged.project_id || merged.topic_id);
      const computedType: Note['note_type'] = isLinked ? 'linked' : 'general';

      const finalChanges = {
        ...changes,
        note_type: changes.note_type ?? computedType,
        updated_at: now,
      };

      const updatedNotes = get().notes.map((n) =>
        n.id === id ? { ...n, ...finalChanges } : n
      );
      const updatedActive =
        get().activeNote?.id === id
          ? { ...get().activeNote!, ...finalChanges }
          : get().activeNote;

      set({ notes: updatedNotes, activeNote: updatedActive });
      storage.set('notes', updatedNotes);
      flushToDb(id, finalChanges);
    },

    deleteNote: async (id) => {
      const updated = get().notes.filter((n) => n.id !== id);
      const nextActive = get().activeNote?.id === id ? updated[0] || null : get().activeNote;
      set({ notes: updated, activeNote: nextActive });
      storage.set('notes', updated);

      if (isSupabaseConfigured) {
        try {
          await supabase.from('notes').delete().eq('id', id);
        } catch (err) {
          console.warn('[NotesStore] Delete failed to sync:', err);
        }
      }
    },

    setSearchQuery: (q) => set({ searchQuery: q }),
  };
});
