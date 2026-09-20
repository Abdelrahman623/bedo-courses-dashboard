import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getActiveUserId } from '../lib/storage';
import type { Note } from '../types';

interface NotesState {
  notes: Note[];
  activeNote: Note | null;
  loading: boolean;
  searchQuery: string;

  fetchNotes: () => Promise<void>;
  setActiveNote: (note: Note | null) => void;
  createNote: (partial: Partial<Note>) => Promise<Note | null>;
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

const normalizeNote = (n: Note): Note => ({
  ...n,
  note_type:
    n.note_type === 'linked' || Boolean(n.course_id || n.topic_id || n.project_id)
      ? 'linked'
      : 'general',
});

// Starts empty and is filled from Supabase on sign-in — notes belong to the
// account, not to the browser they were typed in.
export const useNotesStore = create<NotesState>((set, get) => {
  const flushToDb = debounceLocal(async (id: string, changes: Partial<Note>) => {
    if (!isSupabaseConfigured) return;
    try {
      const { error } = await supabase
        .from('notes')
        .update({ ...changes, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) console.warn('[NotesStore] Autosave failed:', error.message);
    } catch (err) {
      console.warn('[NotesStore] Autosave threw:', err);
    }
  }, 1200);

  return {
    notes: [],
    activeNote: null,
    loading: false,
    searchQuery: '',

    fetchNotes: async () => {
      if (!isSupabaseConfigured) return;
      set({ loading: true });
      try {
        const userId = await getActiveUserId();
        if (!userId) {
          set({ notes: [], activeNote: null, loading: false });
          return;
        }

        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false });

        if (error) {
          set({ loading: false });
          return;
        }

        const normalized = ((data as Note[]) ?? []).map(normalizeNote);
        const stillExists = normalized.find(n => n.id === get().activeNote?.id) ?? null;
        set({
          notes: normalized,
          activeNote: stillExists ?? normalized[0] ?? null,
          loading: false,
        });
      } catch (err) {
        console.warn('[NotesStore] Fetch failed:', err);
        set({ loading: false });
      }
    },

    setActiveNote: (note) => set({ activeNote: note }),

    createNote: async (partial) => {
      const userId = await getActiveUserId();
      if (!userId) return null;

      const now = new Date().toISOString();
      const isLinked =
        partial.note_type === 'linked' ||
        Boolean(partial.course_id || partial.project_id || partial.topic_id);

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

      set({ notes: [newNote, ...get().notes], activeNote: newNote });

      const { error } = await supabase.from('notes').insert(newNote);
      if (error) {
        console.warn('[NotesStore] Insert failed, rolling back:', error.message);
        const remaining = get().notes.filter(n => n.id !== newNote.id);
        set({ notes: remaining, activeNote: remaining[0] ?? null });
        return null;
      }

      return newNote;
    },

    saveNote: (id, changes) => {
      const now = new Date().toISOString();
      const current = get().notes.find(n => n.id === id);
      const merged = { ...current, ...changes };
      const isLinked =
        merged.note_type === 'linked' ||
        Boolean(merged.course_id || merged.project_id || merged.topic_id);

      const finalChanges = {
        ...changes,
        note_type: changes.note_type ?? ((isLinked ? 'linked' : 'general') as Note['note_type']),
        updated_at: now,
      };

      const updatedNotes = get().notes.map(n => (n.id === id ? { ...n, ...finalChanges } : n));
      const updatedActive =
        get().activeNote?.id === id
          ? { ...get().activeNote!, ...finalChanges }
          : get().activeNote;

      set({ notes: updatedNotes, activeNote: updatedActive });
      flushToDb(id, finalChanges);
    },

    deleteNote: async (id) => {
      const previous = get().notes;
      const previousActive = get().activeNote;
      const remaining = previous.filter(n => n.id !== id);
      set({
        notes: remaining,
        activeNote: previousActive?.id === id ? remaining[0] ?? null : previousActive,
      });

      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) {
        console.warn('[NotesStore] Delete failed, rolling back:', error.message);
        set({ notes: previous, activeNote: previousActive });
      }
    },

    setSearchQuery: (q) => set({ searchQuery: q }),
  };
});
