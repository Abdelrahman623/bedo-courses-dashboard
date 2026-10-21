import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getActiveUserId } from '../lib/storage';
import type { Note, NoteFolder } from '../types';

interface NotesState {
  notes: Note[];
  folders: NoteFolder[];
  expandedFolderIds: string[];
  activeNote: Note | null;
  loading: boolean;
  searchQuery: string;

  fetchNotes: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  setActiveNote: (note: Note | null) => void;
  createNote: (partial: Partial<Note>) => Promise<Note | null>;
  saveNote: (id: string, changes: Partial<Note>) => void;
  deleteNote: (id: string) => Promise<void>;
  setSearchQuery: (q: string) => void;

  createFolder: (name: string, parentId?: string | null, color?: string) => Promise<NoteFolder | null>;
  updateFolder: (id: string, changes: Partial<NoteFolder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  toggleFolderExpand: (folderId: string) => void;
  setFolderExpanded: (folderId: string, expanded: boolean) => void;
  moveNoteToFolder: (noteId: string, folderId: string | null) => Promise<void>;
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
    n.note_type === 'linked' || Boolean(n.course_id || n.topic_id || n.project_id || n.milestone_id)
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
    folders: [],
    expandedFolderIds: [],
    activeNote: null,
    loading: false,
    searchQuery: '',

    fetchNotes: async () => {
      if (!isSupabaseConfigured) return;
      set({ loading: true });
      try {
        const userId = await getActiveUserId();
        if (!userId) {
          set({ notes: [], folders: [], activeNote: null, loading: false });
          return;
        }

        const [notesRes, foldersRes] = await Promise.all([
          supabase
            .from('notes')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false }),
          supabase
            .from('note_folders')
            .select('*')
            .eq('user_id', userId)
            .order('position', { ascending: true })
            .order('name', { ascending: true }),
        ]);

        const rawNotes = notesRes.data ?? [];
        const rawFolders = (foldersRes.data as NoteFolder[]) ?? [];

        const normalized = ((rawNotes as Note[]) ?? []).map(normalizeNote);
        const stillExists = normalized.find(n => n.id === get().activeNote?.id) ?? null;
        set({
          notes: normalized,
          folders: rawFolders,
          activeNote: stillExists ?? normalized[0] ?? null,
          loading: false,
        });
      } catch (err) {
        console.warn('[NotesStore] Fetch failed:', err);
        set({ loading: false });
      }
    },

    fetchFolders: async () => {
      if (!isSupabaseConfigured) return;
      try {
        const userId = await getActiveUserId();
        if (!userId) return;
        const { data, error } = await supabase
          .from('note_folders')
          .select('*')
          .eq('user_id', userId)
          .order('position', { ascending: true })
          .order('name', { ascending: true });
        if (!error && data) {
          set({ folders: data as NoteFolder[] });
        }
      } catch (err) {
        console.warn('[NotesStore] Fetch folders failed:', err);
      }
    },

    setActiveNote: (note) => set({ activeNote: note }),

    createNote: async (partial) => {
      const userId = await getActiveUserId();
      if (!userId) return null;

      const now = new Date().toISOString();
      const isLinked =
        partial.note_type === 'linked' ||
        Boolean(partial.course_id || partial.project_id || partial.milestone_id || partial.topic_id);

      const newNote: Note = {
        id: crypto.randomUUID ? crypto.randomUUID() : `note_${Date.now()}`,
        user_id: userId,
        folder_id: partial.folder_id ?? null,
        note_type: isLinked ? 'linked' : 'general',
        course_id: partial.course_id,
        project_id: partial.project_id,
        milestone_id: partial.milestone_id,
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
        Boolean(merged.course_id || merged.project_id || merged.milestone_id || merged.topic_id);

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

    createFolder: async (name, parentId = null, color) => {
      const userId = await getActiveUserId();
      if (!userId) return null;
      const now = new Date().toISOString();
      const existing = get().folders;
      const newFolder: NoteFolder = {
        id: crypto.randomUUID ? crypto.randomUUID() : `folder_${Date.now()}`,
        user_id: userId,
        name: name.trim() || 'Untitled Folder',
        parent_id: parentId || null,
        color: color || '#F0A500',
        position: existing.length,
        created_at: now,
        updated_at: now,
      };

      set({
        folders: [...existing, newFolder],
        expandedFolderIds: parentId
          ? Array.from(new Set([...get().expandedFolderIds, parentId, newFolder.id]))
          : Array.from(new Set([...get().expandedFolderIds, newFolder.id])),
      });

      if (isSupabaseConfigured) {
        const { error } = await supabase.from('note_folders').insert(newFolder);
        if (error) {
          console.warn('[NotesStore] Folder insert failed, rolling back:', error.message);
          set({ folders: existing });
          return null;
        }
      }
      return newFolder;
    },

    updateFolder: async (id, changes) => {
      const now = new Date().toISOString();
      const prev = get().folders;
      const updated = prev.map(f => (f.id === id ? { ...f, ...changes, updated_at: now } : f));
      set({ folders: updated });

      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('note_folders')
          .update({ ...changes, updated_at: now })
          .eq('id', id);
        if (error) {
          console.warn('[NotesStore] Folder update failed:', error.message);
          set({ folders: prev });
        }
      }
    },

    deleteFolder: async (id) => {
      const prevFolders = get().folders;
      const prevNotes = get().notes;

      // Find all descendant folder IDs (recursive cascade)
      const findDescendants = (parentId: string): string[] => {
        const children = prevFolders.filter(f => f.parent_id === parentId);
        return [parentId, ...children.flatMap(c => findDescendants(c.id))];
      };
      const toDeleteIds = new Set(findDescendants(id));

      const remainingFolders = prevFolders.filter(f => !toDeleteIds.has(f.id));
      const updatedNotes = prevNotes.map(n =>
        n.folder_id && toDeleteIds.has(n.folder_id) ? { ...n, folder_id: null } : n
      );

      set({
        folders: remainingFolders,
        notes: updatedNotes,
        activeNote: (get().activeNote && updatedNotes.find(n => n.id === get().activeNote?.id)) || get().activeNote,
        expandedFolderIds: get().expandedFolderIds.filter(fid => !toDeleteIds.has(fid)),
      });

      if (isSupabaseConfigured) {
        const { error } = await supabase.from('note_folders').delete().eq('id', id);
        if (error) {
          console.warn('[NotesStore] Folder delete failed:', error.message);
          set({ folders: prevFolders, notes: prevNotes });
        }
      }
    },

    toggleFolderExpand: (folderId) => {
      const current = get().expandedFolderIds;
      if (current.includes(folderId)) {
        set({ expandedFolderIds: current.filter(id => id !== folderId) });
      } else {
        set({ expandedFolderIds: [...current, folderId] });
      }
    },

    setFolderExpanded: (folderId, expanded) => {
      const current = get().expandedFolderIds;
      if (expanded && !current.includes(folderId)) {
        set({ expandedFolderIds: [...current, folderId] });
      } else if (!expanded && current.includes(folderId)) {
        set({ expandedFolderIds: current.filter(id => id !== folderId) });
      }
    },

    moveNoteToFolder: async (noteId, folderId) => {
      get().saveNote(noteId, { folder_id: folderId });
    },

    setSearchQuery: (q) => set({ searchQuery: q }),
  };
});
