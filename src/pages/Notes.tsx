import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, Search, Tag, Trash2, FileText,
  Bold, Italic, Code, List, CheckSquare, Link2,
  Check, X, ArrowLeft, Folder, FolderPlus, FolderOpen,
  FolderInput, ChevronRight, ChevronDown, Pencil,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { RunnableCodeBlock } from '../components/notes/runnableCodeBlock';
import { useNotesStore } from '../store/notesStore';
import { useRoadmapStore } from '../store/roadmapStore';
import { useProjectsStore } from '../store/projectsStore';
import { useMilestonesStore } from '../store/milestonesStore';
import { formatDate } from '../lib/utils';
import type { Note, NoteFolder, NoteType } from '../types';

// ─── Toolbar button helper ──────────────────────────────────────────────────
interface ToolbarBtnProps {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

const ToolbarBtn: React.FC<ToolbarBtnProps> = ({ active, onClick, title, children }) => (
  <button
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={title}
    className={[
      'p-1.5 rounded-lg transition-all duration-150 text-sm',
      active
        ? 'bg-accent-amber/20 text-accent-amber'
        : 'text-txt-muted hover:text-txt-primary hover:bg-bg-surface2',
    ].join(' ')}
  >
    {children}
  </button>
);

// ─── Color presets for folders ──────────────────────────────────────────────
const FOLDER_COLORS = [
  { name: 'Amber', hex: '#F0A500' },
  { name: 'Emerald', hex: '#00C896' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Rose', hex: '#FF6B6B' },
  { name: 'Cyan', hex: '#06B6D4' },
];

// ─── Notes Page ─────────────────────────────────────────────────────────────
const Notes: React.FC = () => {
  const {
    notes,
    folders,
    expandedFolderIds,
    activeNote,
    loading,
    searchQuery,
    fetchNotes,
    setActiveNote,
    createNote,
    saveNote,
    deleteNote,
    setSearchQuery,
    createFolder,
    updateFolder,
    deleteFolder,
    toggleFolderExpand,
    setFolderExpanded,
    moveNoteToFolder,
  } = useNotesStore();

  const { courses, topics, localNodes } = useRoadmapStore();
  const { projects } = useProjectsStore();
  const { milestones, fetchAllMilestones } = useMilestonesStore();

  // Flattened project milestones for lookup
  const allProjectMilestones = useMemo(() => {
    return Object.entries(milestones).flatMap(([projId, list]) => {
      const proj = projects.find(p => p.id === projId);
      return list.map(m => ({
        ...m,
        projectTitle: proj?.title || 'Unknown Project',
      }));
    });
  }, [milestones, projects]);

  // Deep links from Projects: /notes?project=<id> or /notes?project=<id>&milestone=<id>
  // &new=1 opens composer pre-linked
  const [searchParams, setSearchParams] = useSearchParams();
  const projectFilterId = searchParams.get('project');
  const milestoneFilterId = searchParams.get('milestone');
  const filterProject = projectFilterId
    ? projects.find(p => p.id === projectFilterId) ?? null
    : null;
  const filterMilestone = milestoneFilterId
    ? allProjectMilestones.find(m => m.id === milestoneFilterId) ?? null
    : null;

  const clearFilter = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('project');
    next.delete('milestone');
    next.delete('new');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const [saving, setSaving]       = useState(false);
  const [tagInput, setTagInput]   = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [deleteModal, setDeleteModal]   = useState<string | null>(null);
  const [noteTypeFilter, setNoteTypeFilter] = useState<'all' | NoteType>('all');
  
  // New Note Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteType, setNewNoteType] = useState<NoteType>('general');
  const [newNoteLinkType, setNewNoteLinkType] = useState<'course' | 'topic' | 'project' | 'milestone'>('course');
  const [newNoteLinkedId, setNewNoteLinkedId] = useState<string>('');
  const [newNoteProjectId, setNewNoteProjectId] = useState<string>('');
  const [newNoteFolderId, setNewNoteFolderId] = useState<string | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [createNoteError, setCreateNoteError] = useState<string | null>(null);

  // Edit / Link Active Note Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editLinkType, setEditLinkType] = useState<'course' | 'topic' | 'project' | 'milestone'>('course');
  const [editLinkedId, setEditLinkedId] = useState<string>('');
  const [editProjectId, setEditProjectId] = useState<string>('');

  // Folder Modals State
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState<'create' | 'edit'>('create');
  const [folderModalParentId, setFolderModalParentId] = useState<string | null>(null);
  const [folderModalTargetId, setFolderModalTargetId] = useState<string | null>(null);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [folderColorInput, setFolderColorInput] = useState('');
  const [folderError, setFolderError] = useState<string | null>(null);
  const [isSavingFolder, setIsSavingFolder] = useState(false);

  // Delete Folder Modal
  const [deleteFolderModal, setDeleteFolderModal] = useState<NoteFolder | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

  // Move Note Modal
  const [moveNoteModal, setMoveNoteModal] = useState<Note | null>(null);
  const [targetMoveFolderId, setTargetMoveFolderId] = useState<string | null>(null);
  const [isMovingNote, setIsMovingNote] = useState(false);

  // Unfiled notes collapsed state
  const [unfiledExpanded, setUnfiledExpanded] = useState(true);

  // Fetch notes and project milestones on mount
  useEffect(() => {
    fetchNotes();
    fetchAllMilestones();
  }, [fetchNotes, fetchAllMilestones]);

  // All roadmap topics for topic linking
  const allMilestones = useMemo(() => {
    const list: { id: string; label: string; phase?: string }[] = [];
    localNodes.forEach(n => {
      list.push({ id: n.id, label: n.label, phase: n.phase });
    });
    topics.forEach(t => {
      if (!list.some(item => item.id === t.id)) {
        list.push({ id: t.id, label: t.title, phase: t.phase });
      }
    });
    return list;
  }, [localNodes, topics]);

  // Resolves link info for any note
  const getNoteLinkInfo = useCallback((note: Note) => {
    if (note.milestone_id) {
      const m = allProjectMilestones.find(item => item.id === note.milestone_id);
      const p = projects.find(item => item.id === (note.project_id || m?.project_id));
      const label = m ? `${p?.title ? p.title + ' › ' : ''}${m.title}` : 'Linked Milestone';
      return { type: 'milestone' as const, label, icon: '🎯' };
    }
    if (note.course_id) {
      const c = courses.find(item => item.id === note.course_id);
      return { type: 'course' as const, label: c?.title || 'Linked Course', icon: '📚' };
    }
    if (note.topic_id) {
      const t = allMilestones.find(item => item.id === note.topic_id);
      return { type: 'topic' as const, label: t?.label || 'Linked Milestone', icon: '🗺️' };
    }
    if (note.project_id) {
      const p = projects.find(item => item.id === note.project_id);
      return { type: 'project' as const, label: p?.title || 'Linked Project', icon: '💼' };
    }
    return null;
  }, [courses, allMilestones, projects, allProjectMilestones]);

  // Active note's link info
  const activeLinkInfo = useMemo(() => {
    if (!activeNote) return null;
    return getNoteLinkInfo(activeNote);
  }, [activeNote, getNoteLinkInfo]);

  // Folder helper functions
  const getFolderPath = useCallback((folderId: string | null | undefined): string => {
    if (!folderId) return '';
    const parts: string[] = [];
    let cur: NoteFolder | undefined = folders.find(f => f.id === folderId);
    let guard = 0;
    while (cur && guard < 20) {
      guard++;
      parts.unshift(cur.name);
      const parentId: string | null | undefined = cur.parent_id;
      cur = parentId ? folders.find(f => f.id === parentId) : undefined;
    }
    return parts.join(' / ');
  }, [folders]);

  // Helper to check if folderA is descendant of folderB (prevent cycles)
  const isDescendant = useCallback((candidateId: string, possibleAncestorId: string): boolean => {
    let cur: NoteFolder | undefined = folders.find(f => f.id === candidateId);
    let guard = 0;
    while (cur && cur.parent_id && guard < 20) {
      guard++;
      if (cur.parent_id === possibleAncestorId) return true;
      const parentId: string | null | undefined = cur.parent_id;
      cur = parentId ? folders.find(f => f.id === parentId) : undefined;
    }
    return false;
  }, [folders]);

  // Flat list of folders with indent level for dropdowns
  const folderOptions = useMemo(() => {
    const list: { id: string; name: string; level: number; path: string }[] = [];
    const walk = (parentId: string | null, level: number) => {
      const children = folders.filter(f => (f.parent_id || null) === parentId);
      children.sort((a, b) => a.name.localeCompare(b.name));
      for (const child of children) {
        // Exclude target and its descendants when editing
        if (folderModalTargetId && (child.id === folderModalTargetId || isDescendant(child.id, folderModalTargetId))) {
          continue;
        }
        list.push({
          id: child.id,
          name: child.name,
          level,
          path: getFolderPath(child.id),
        });
        walk(child.id, level + 1);
      }
    };
    walk(null, 0);
    return list;
  }, [folders, folderModalTargetId, isDescendant, getFolderPath]);

  // ── Editor ──────────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      RunnableCodeBlock,
      Placeholder.configure({ placeholder: 'Start writing...' }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: '',
    editorProps: {
      attributes: { class: 'tiptap-editor outline-none' },
    },
    onUpdate: ({ editor }) => {
      if (!activeNote) return;
      setSaving(true);
      saveNote(activeNote.id, { content: JSON.stringify(editor.getJSON()) });
      setTimeout(() => setSaving(false), 1200);
    },
  });

  // Sync editor content when active note changes
  useEffect(() => {
    if (!editor || !activeNote) return;
    let parsed: object | string = '';
    try {
      parsed = activeNote.content ? JSON.parse(activeNote.content) : '';
    } catch {
      parsed = activeNote.content || '';
    }
    const current = JSON.stringify(editor.getJSON());
    if (current !== activeNote.content) {
      editor.commands.setContent(parsed as Parameters<typeof editor.commands.setContent>[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNote?.id, editor]);

  // ── Filtered notes list ─────────────────────────────────────────────────
  const isNoteLinked = (n: Note) =>
    n.note_type === 'linked' ||
    Boolean(n.course_id || n.topic_id || n.project_id || n.milestone_id);

  const linkedCount = notes.filter(isNoteLinked).length;
  const generalCount = notes.length - linkedCount;

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        n.title.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
      );
      const linked = isNoteLinked(n);
      const matchesType = noteTypeFilter === 'all'
        || (noteTypeFilter === 'general' && !linked)
        || (noteTypeFilter === 'linked' && linked);
      const matchesProject = !projectFilterId || n.project_id === projectFilterId;
      const matchesMilestone = !milestoneFilterId || n.milestone_id === milestoneFilterId;
      return matchesSearch && matchesType && matchesProject && matchesMilestone;
    });
  }, [notes, searchQuery, noteTypeFilter, projectFilterId, milestoneFilterId]);

  // Notes organized into folders & unfiled
  const notesByFolderId = useMemo(() => {
    const map = new Map<string, Note[]>();
    for (const note of filteredNotes) {
      if (note.folder_id) {
        const list = map.get(note.folder_id) || [];
        list.push(note);
        map.set(note.folder_id, list);
      }
    }
    return map;
  }, [filteredNotes]);

  const unfiledNotes = useMemo(() => {
    return filteredNotes.filter(n => !n.folder_id);
  }, [filteredNotes]);

  // Total note count for a folder (including recursive subfolder notes)
  const getFolderTotalNoteCount = useCallback((folderId: string): number => {
    let count = notesByFolderId.get(folderId)?.length || 0;
    const subfolders = folders.filter(f => f.parent_id === folderId);
    for (const sub of subfolders) {
      count += getFolderTotalNoteCount(sub.id);
    }
    return count;
  }, [notesByFolderId, folders]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleNewNote = useCallback((folderId?: string | null) => {
    setNewNoteTitle('');
    setNewNoteFolderId(folderId !== undefined ? folderId : null);
    if (milestoneFilterId) {
      setNewNoteType('linked');
      setNewNoteLinkType('milestone');
      setNewNoteLinkedId(milestoneFilterId);
      const found = allProjectMilestones.find(m => m.id === milestoneFilterId);
      setNewNoteProjectId(projectFilterId || found?.project_id || '');
    } else if (projectFilterId) {
      setNewNoteType('linked');
      setNewNoteLinkType('project');
      setNewNoteLinkedId(projectFilterId);
      setNewNoteProjectId('');
    } else {
      setNewNoteType('general');
      setNewNoteLinkType('course');
      setNewNoteLinkedId('');
      setNewNoteProjectId('');
    }
    setCreateNoteError(null);
    setShowNewModal(true);
  }, [projectFilterId, milestoneFilterId, allProjectMilestones]);

  // ?new=1 opens the composer once, then drops the flag
  useEffect(() => {
    if (searchParams.get('new') !== '1') return;
    handleNewNote();
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, handleNewNote]);

  // While the list is scoped to a milestone or project, sync the editor note
  useEffect(() => {
    if (milestoneFilterId) {
      if (activeNote?.milestone_id === milestoneFilterId) return;
      const target = notes.find(n => n.milestone_id === milestoneFilterId) ?? null;
      if (target?.id !== activeNote?.id) setActiveNote(target);
      return;
    }
    if (projectFilterId) {
      if (activeNote?.project_id === projectFilterId) return;
      const target = notes.find(n => n.project_id === projectFilterId) ?? null;
      if (target?.id !== activeNote?.id) setActiveNote(target);
    }
  }, [projectFilterId, milestoneFilterId, notes, activeNote, setActiveNote]);

  const handleCreateNote = useCallback(async () => {
    if (isCreatingNote) return;

    const isLinked = newNoteType === 'linked' && Boolean(newNoteLinkedId);
    setIsCreatingNote(true);
    setCreateNoteError(null);

    const targetProjectId =
      newNoteLinkType === 'project' && isLinked
        ? newNoteLinkedId
        : newNoteLinkType === 'milestone' && isLinked
        ? (newNoteProjectId || allProjectMilestones.find(m => m.id === newNoteLinkedId)?.project_id)
        : undefined;

    const created = await createNote({
      title: newNoteTitle.trim() || 'Untitled Note',
      content: '',
      tags: [],
      folder_id: newNoteFolderId || null,
      note_type: isLinked ? 'linked' : 'general',
      course_id: newNoteLinkType === 'course' && isLinked ? newNoteLinkedId : undefined,
      topic_id: newNoteLinkType === 'topic' && isLinked ? newNoteLinkedId : undefined,
      project_id: targetProjectId,
      milestone_id: newNoteLinkType === 'milestone' && isLinked ? newNoteLinkedId : undefined,
    });

    setIsCreatingNote(false);

    if (!created) {
      setCreateNoteError('Could not save the note. Check your connection and try again.');
      return;
    }

    if (newNoteFolderId) {
      setFolderExpanded(newNoteFolderId, true);
    }

    setShowNewModal(false);
    setNewNoteTitle('');
    setNewNoteLinkedId('');
    setNewNoteProjectId('');
    setNewNoteFolderId(null);

    if (isLinked && noteTypeFilter === 'general') {
      setNoteTypeFilter('linked');
    }
  }, [createNote, isCreatingNote, newNoteType, newNoteLinkedId, newNoteLinkType, newNoteProjectId, newNoteTitle, newNoteFolderId, noteTypeFilter, allProjectMilestones, setFolderExpanded]);

  const handleApplyEditLink = (action: 'link' | 'unlink') => {
    if (!activeNote) return;
    if (action === 'unlink' || !editLinkedId) {
      saveNote(activeNote.id, {
        note_type: 'general',
        course_id: undefined,
        topic_id: undefined,
        project_id: undefined,
        milestone_id: undefined,
      });
    } else {
      const targetProjectId =
        editLinkType === 'project'
          ? editLinkedId
          : editLinkType === 'milestone'
          ? (editProjectId || allProjectMilestones.find(m => m.id === editLinkedId)?.project_id)
          : undefined;

      saveNote(activeNote.id, {
        note_type: 'linked',
        course_id: editLinkType === 'course' ? editLinkedId : undefined,
        topic_id: editLinkType === 'topic' ? editLinkedId : undefined,
        project_id: targetProjectId,
        milestone_id: editLinkType === 'milestone' ? editLinkedId : undefined,
      });
      if (noteTypeFilter === 'general') {
        setNoteTypeFilter('all');
      }
    }
    setShowLinkModal(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeNote) return;
    saveNote(activeNote.id, { title: e.target.value });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!activeNote) return;
    if (e.key === 'Enter' && tagInput.trim()) {
      const newTags = [...activeNote.tags, tagInput.trim()];
      saveNote(activeNote.id, { tags: newTags });
      setTagInput('');
      setShowTagInput(false);
    }
    if (e.key === 'Escape') {
      setTagInput('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (!activeNote) return;
    saveNote(activeNote.id, { tags: activeNote.tags.filter((t) => t !== tag) });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    await deleteNote(deleteModal);
    setDeleteModal(null);
  };

  // Folder modal handlers
  const handleOpenCreateFolder = (parentId: string | null = null) => {
    setFolderModalMode('create');
    setFolderModalParentId(parentId);
    setFolderModalTargetId(null);
    setFolderNameInput('');
    setFolderColorInput('');
    setFolderError(null);
    setShowFolderModal(true);
  };

  const handleOpenEditFolder = (folder: NoteFolder) => {
    setFolderModalMode('edit');
    setFolderModalParentId(folder.parent_id || null);
    setFolderModalTargetId(folder.id);
    setFolderNameInput(folder.name);
    setFolderColorInput(folder.color || '');
    setFolderError(null);
    setShowFolderModal(true);
  };

  const handleSaveFolder = async () => {
    const trimmed = folderNameInput.trim();
    if (!trimmed) {
      setFolderError('Folder name cannot be empty.');
      return;
    }
    setIsSavingFolder(true);
    setFolderError(null);
    try {
      if (folderModalMode === 'create') {
        const created = await createFolder(trimmed, folderModalParentId, folderColorInput || undefined);
        if (!created) {
          setFolderError('Failed to create folder. Please try again.');
          setIsSavingFolder(false);
          return;
        }
        if (folderModalParentId) {
          setFolderExpanded(folderModalParentId, true);
        }
      } else if (folderModalTargetId) {
        await updateFolder(folderModalTargetId, {
          name: trimmed,
          parent_id: folderModalParentId,
          color: folderColorInput || null,
        });
      }
      setShowFolderModal(false);
    } catch {
      setFolderError('An unexpected error occurred.');
    } finally {
      setIsSavingFolder(false);
    }
  };

  const handleDeleteFolderConfirm = async () => {
    if (!deleteFolderModal) return;
    setIsDeletingFolder(true);
    try {
      await deleteFolder(deleteFolderModal.id);
      setDeleteFolderModal(null);
    } finally {
      setIsDeletingFolder(false);
    }
  };

  const handleMoveNoteConfirm = async () => {
    if (!moveNoteModal) return;
    setIsMovingNote(true);
    try {
      await moveNoteToFolder(moveNoteModal.id, targetMoveFolderId);
      if (targetMoveFolderId) {
        setFolderExpanded(targetMoveFolderId, true);
      }
      setMoveNoteModal(null);
    } finally {
      setIsMovingNote(false);
    }
  };

  // ── Tree rendering helper ────────────────────────────────────────────────
  const renderNoteCard = (note: Note, indentClass = '') => {
    const isActive = activeNote?.id === note.id;
    const link = getNoteLinkInfo(note);
    return (
      <div
        key={note.id}
        onClick={() => setActiveNote(note)}
        className={[
          'group relative px-2.5 py-2 cursor-pointer transition-colors rounded-lg mb-0.5',
          indentClass,
          isActive
            ? 'bg-accent-amber/15 border-l-2 border-accent-amber text-txt-primary shadow-[inset_0_0_15px_rgba(240,165,0,0.06)]'
            : 'border-l-2 border-transparent hover:bg-white/[0.035] text-zinc-300'
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <FileText size={12} className={isActive ? 'text-accent-amber flex-shrink-0' : 'text-zinc-500 group-hover:text-zinc-300 flex-shrink-0'} />
              <p className={[
                'text-xs font-medium truncate',
                isActive ? 'text-accent-amber font-semibold' : 'text-zinc-200 group-hover:text-white',
              ].join(' ')}>
                {note.title || 'Untitled'}
              </p>
            </div>

            {/* Folder path badge when searching */}
            {searchQuery.trim() && note.folder_id && (
              <div className="flex items-center gap-1 mt-0.5 text-[9px] text-zinc-400 font-mono truncate">
                <Folder size={10} className="text-accent-amber/70" />
                <span className="truncate">{getFolderPath(note.folder_id)}</span>
              </div>
            )}

            {/* Linked Badge */}
            {link && (
              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-accent-amber/90 font-medium truncate">
                <span>{link.icon}</span>
                <span className="truncate">{link.label}</span>
              </div>
            )}

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] text-txt-muted">
                {formatDate(note.updated_at)}
              </span>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="text-[8px] px-1 py-0.2 rounded bg-accent-amber/10 text-accent-amber"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMoveNoteModal(note);
                setTargetMoveFolderId(note.folder_id || null);
              }}
              title="Move note to folder"
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08]"
            >
              <FolderInput size={11} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal(note.id);
              }}
              title="Delete note"
              className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Recursive folder node renderer
  const renderFolderNode = (folder: NoteFolder, depth = 0) => {
    const isExpanded = expandedFolderIds.includes(folder.id);
    const childFolders = folders.filter(f => f.parent_id === folder.id);
    childFolders.sort((a, b) => a.name.localeCompare(b.name));
    const folderNotes = notesByFolderId.get(folder.id) || [];
    const totalCount = getFolderTotalNoteCount(folder.id);

    const folderColor = folder.color || '#F0A500';

    return (
      <div key={folder.id} className="select-none mb-0.5">
        {/* Folder header row */}
        <div
          onClick={() => toggleFolderExpand(folder.id)}
          className="group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-white/[0.04] transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolderExpand(folder.id);
              }}
              className="text-zinc-500 hover:text-zinc-200 transition-colors flex-shrink-0"
            >
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>

            {isExpanded ? (
              <FolderOpen size={14} style={{ color: folderColor }} className="flex-shrink-0" />
            ) : (
              <Folder size={14} style={{ color: folderColor }} className="flex-shrink-0" />
            )}

            <span className="font-medium text-zinc-300 group-hover:text-white truncate">
              {folder.name}
            </span>

            <span className="text-[10px] text-zinc-500 font-mono flex-shrink-0">
              ({totalCount})
            </span>
          </div>

          {/* Quick action buttons on hover */}
          <div
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleNewNote(folder.id)}
              title="Add note in this folder"
              className="p-1 rounded text-zinc-400 hover:text-accent-amber hover:bg-white/[0.06]"
            >
              <Plus size={11} />
            </button>
            <button
              onClick={() => handleOpenCreateFolder(folder.id)}
              title="Add subfolder"
              className="p-1 rounded text-zinc-400 hover:text-accent-secondary hover:bg-white/[0.06]"
            >
              <FolderPlus size={11} />
            </button>
            <button
              onClick={() => handleOpenEditFolder(folder)}
              title="Rename folder"
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={() => setDeleteFolderModal(folder)}
              title="Delete folder"
              className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {/* Children (subfolders + notes) */}
        {isExpanded && (
          <div className="relative">
            {/* Guide line */}
            <div
              className="absolute top-0 bottom-1 border-l border-white/[0.06]"
              style={{ left: `${depth * 12 + 14}px` }}
            />

            {/* Subfolders */}
            {childFolders.map(child => renderFolderNode(child, depth + 1))}

            {/* Notes inside this folder */}
            {folderNotes.map(n => renderNoteCard(n, 'ml-2'))}

            {childFolders.length === 0 && folderNotes.length === 0 && (
              <div
                className="text-[10px] text-zinc-500 italic py-1"
                style={{ paddingLeft: `${(depth + 1) * 12 + 14}px` }}
              >
                Empty folder
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Root level folders
  const rootFolders = useMemo(() => {
    const list = folders.filter(f => !f.parent_id);
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [folders]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex overflow-hidden">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
      <div
        className={`${activeNote ? 'hidden lg:flex' : 'flex'} w-full lg:w-64 flex-shrink-0 border-r border-white/[0.035] flex-col bg-[#11151D]`}
      >

        {/* Scoped-to-a-project or milestone banner */}
        {(milestoneFilterId || projectFilterId) && (
          <div className="px-3 pt-3">
            <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-accent-amber/10 border border-accent-amber/25">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-accent-amber/80">
                  {milestoneFilterId ? 'Project Milestone' : 'Project'}
                </p>
                <p className="text-[11px] font-medium text-accent-amber truncate">
                  {milestoneFilterId
                    ? `${filterMilestone?.title ?? 'Milestone'} (${filterProject?.title ?? filterMilestone?.projectTitle ?? 'Project'})`
                    : filterProject?.title ?? 'Unknown project'}
                </p>
              </div>
              <button
                onClick={clearFilter}
                title="Show all notes"
                className="p-1 rounded text-accent-amber/70 hover:text-accent-amber hover:bg-accent-amber/10 transition-colors cursor-pointer flex-shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="p-3 pb-2 bg-[#11151D]">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-muted" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full pl-8 pr-3 py-1.5 text-xs
                bg-bg-surface2 border border-white/[0.06]
                rounded-lg text-txt-primary placeholder:text-txt-muted
                focus:outline-none focus:border-accent-amber/40
                transition-colors
              "
            />
          </div>
        </div>

        {/* Type filter tabs */}
        <div className="px-3 pb-2 bg-[#11151D]">
          <div className="grid grid-cols-3 bg-bg-surface2 rounded-lg p-0.5 gap-0.5 text-center">
            {([
              ['all', `All (${notes.length})`],
              ['general', `General (${generalCount})`],
              ['linked', `Linked (${linkedCount})`]
            ] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setNoteTypeFilter(val as any)}
                className={`py-1 text-[10px] font-semibold rounded-md transition-all cursor-pointer select-none truncate ${
                  noteTypeFilter === val
                    ? 'bg-accent-amber/15 text-accent-amber shadow-sm'
                    : 'text-txt-muted hover:text-txt-primary'
                }`}
                title={label}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons: New Note & New Folder */}
        <div className="px-3 pb-2 bg-[#11151D] flex items-center gap-1.5">
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={13} />}
            onClick={() => handleNewNote(null)}
            className="flex-1 justify-center text-xs"
          >
            New Note
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<FolderPlus size={13} />}
            onClick={() => handleOpenCreateFolder(null)}
            title="Create new folder"
            className="px-2.5 text-xs text-zinc-300 hover:text-white"
          >
            Folder
          </Button>
        </div>

        {/* Notes & Folders Tree / Search View */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {loading && notes.length === 0 && (
            <p className="text-xs text-txt-muted text-center mt-6">Loading notes…</p>
          )}

          {!loading && filteredNotes.length === 0 && folders.length === 0 && (
            <p className="text-xs text-txt-muted text-center mt-6 px-4">
              {searchQuery
                ? 'No notes match your search.'
                : milestoneFilterId
                ? 'No notes for this milestone yet.'
                : projectFilterId
                ? 'No notes for this project yet.'
                : 'No notes yet. Create your first note or organize with folders!'}
            </p>
          )}

          {/* Search Mode: Flat list with folder paths */}
          {searchQuery.trim().length > 0 ? (
            <div className="space-y-0.5">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-txt-muted">
                Search Results ({filteredNotes.length})
              </div>
              {filteredNotes.map((note) => renderNoteCard(note))}
            </div>
          ) : (
            /* Tree View: Hierarchical Folders + Unfiled Notes */
            <div className="space-y-1">
              {/* Folders tree */}
              {rootFolders.map((folder) => renderFolderNode(folder, 0))}

              {/* Unfiled notes section */}
              {unfiledNotes.length > 0 && (
                <div className="pt-1.5 border-t border-white/[0.04] mt-2">
                  <div
                    onClick={() => setUnfiledExpanded(!unfiledExpanded)}
                    className="flex items-center justify-between px-2 py-1 text-xs cursor-pointer text-zinc-400 hover:text-zinc-200 transition-colors rounded-lg hover:bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-1.5 font-medium text-[11px] tracking-wide">
                      <button type="button" className="text-zinc-500">
                        {unfiledExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                      <FileText size={12} className="text-zinc-400" />
                      <span>Unfiled Notes</span>
                      <span className="text-[10px] text-zinc-500 font-mono">({unfiledNotes.length})</span>
                    </div>
                  </div>

                  {unfiledExpanded && (
                    <div className="mt-0.5 pl-2 space-y-0.5">
                      {unfiledNotes.map((note) => renderNoteCard(note))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer count */}
        <div className="p-2.5 bg-[#0F131A] border-t border-white/[0.035] flex items-center justify-between text-[10px] text-txt-muted px-3">
          <span>{folders.length} {folders.length === 1 ? 'folder' : 'folders'}</span>
          <span>{filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}</span>
        </div>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
      <div
        className={`${!activeNote ? 'hidden lg:flex' : 'flex'} flex-1 flex-col min-w-0 overflow-hidden`}
      >
        {!activeNote ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-bg-surface2 flex items-center justify-center">
              <FileText size={24} className="text-txt-muted" />
            </div>
            <div>
              <p className="text-txt-secondary font-medium">Select or create a note</p>
              <p className="text-txt-muted text-xs mt-1">
                Organize your thoughts into nested folders and link them to courses or projects
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={() => handleNewNote(null)}
              >
                New Note
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<FolderPlus size={13} />}
                onClick={() => handleOpenCreateFolder(null)}
              >
                New Folder
              </Button>
            </div>
          </div>
        ) : (
          /* Active note editor */
          <div className="flex-1 flex flex-col min-h-0">

            {/* ── Header: Folder / Link Bar + Title + Toolbar ─────────────── */}
            <div className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 bg-[#0D0F14] space-y-2.5">

              {/* Back to list (mobile only) */}
              <button
                onClick={() => setActiveNote(null)}
                className="lg:hidden flex items-center gap-1.5 text-xs font-medium text-txt-muted hover:text-txt-primary transition-colors -ml-1 mb-1"
              >
                <ArrowLeft size={14} />
                Back to notes
              </button>

              {/* Metadata Badges: Folder pill + Linked entity bar */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Folder pill */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-300">
                  <Folder size={12} className="text-accent-amber" />
                  <span className="text-[11px] font-medium text-txt-secondary">
                    {activeNote.folder_id ? getFolderPath(activeNote.folder_id) : 'Unfiled'}
                  </span>
                  <button
                    onClick={() => {
                      setMoveNoteModal(activeNote);
                      setTargetMoveFolderId(activeNote.folder_id || null);
                    }}
                    className="text-[10px] text-accent-amber hover:underline ml-1 cursor-pointer font-medium"
                    title="Move note to another folder"
                  >
                    Move
                  </button>
                </div>

                {/* Linked entity bar */}
                {activeLinkInfo ? (
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-accent-amber/10 border border-accent-amber/25 text-xs text-accent-amber">
                    <span className="text-sm">{activeLinkInfo.icon}</span>
                    <span className="font-semibold truncate max-w-[320px]">{activeLinkInfo.label}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">({activeLinkInfo.type})</span>
                    <div className="flex items-center gap-1.5 ml-1 pl-1.5 border-l border-accent-amber/30">
                      <button
                        onClick={() => {
                          if (activeNote.milestone_id) {
                            setEditLinkType('milestone');
                            setEditLinkedId(activeNote.milestone_id);
                            setEditProjectId(activeNote.project_id || '');
                          } else if (activeNote.project_id) {
                            setEditLinkType('project');
                            setEditLinkedId(activeNote.project_id);
                          } else if (activeNote.topic_id) {
                            setEditLinkType('topic');
                            setEditLinkedId(activeNote.topic_id);
                          } else if (activeNote.course_id) {
                            setEditLinkType('course');
                            setEditLinkedId(activeNote.course_id);
                          } else {
                            setEditLinkType('course');
                            setEditLinkedId('');
                          }
                          setShowLinkModal(true);
                        }}
                        className="text-[10px] text-zinc-300 hover:text-white underline cursor-pointer"
                      >
                        Change Link
                      </button>
                      <button
                        onClick={() => handleApplyEditLink('unlink')}
                        className="text-[10px] text-zinc-400 hover:text-rose-400 cursor-pointer ml-0.5"
                        title="Remove link (convert to general note)"
                      >
                        Unlink
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditLinkType('course');
                      setEditLinkedId('');
                      setShowLinkModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-xs text-zinc-400 hover:text-accent-amber transition-all cursor-pointer"
                  >
                    <Link2 size={12} className="text-accent-amber" />
                    <span>+ Link to Course, Topic, or Project</span>
                  </button>
                )}
              </div>

              {/* Title */}
              <div className="flex items-center gap-2">
                <FileText
                  size={20}
                  className="flex-shrink-0 text-accent-tertiary"
                />
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={handleTitleChange}
                  placeholder="Note title..."
                  className="
                    w-full text-2xl font-bold bg-transparent border-none outline-none
                    text-txt-primary placeholder:text-txt-muted/50
                  "
                />
              </div>

              {/* Toolbar */}
              {editor && (
                <div className="flex items-center gap-0.5 flex-wrap">
                  <ToolbarBtn
                    title="Bold"
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                  >
                    <Bold size={14} />
                  </ToolbarBtn>
                  <ToolbarBtn
                    title="Italic"
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                  >
                    <Italic size={14} />
                  </ToolbarBtn>
                  <ToolbarBtn
                    title="Inline Code"
                    active={editor.isActive('code')}
                    onClick={() => editor.chain().focus().toggleCode().run()}
                  >
                    <Code size={14} />
                  </ToolbarBtn>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <ToolbarBtn
                    title="Bullet List"
                    active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                  >
                    <List size={14} />
                  </ToolbarBtn>
                  <ToolbarBtn
                    title="Task List"
                    active={editor.isActive('taskList')}
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                  >
                    <CheckSquare size={14} />
                  </ToolbarBtn>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <ToolbarBtn
                    title="Heading 2"
                    active={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  >
                    <span className="text-[11px] font-bold">H2</span>
                  </ToolbarBtn>
                  <ToolbarBtn
                    title="Heading 3"
                    active={editor.isActive('heading', { level: 3 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  >
                    <span className="text-[11px] font-bold">H3</span>
                  </ToolbarBtn>
                  <ToolbarBtn
                    title="Highlight"
                    active={editor.isActive('highlight')}
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                  >
                    <span className="text-[11px] font-bold text-accent-amber">H</span>
                  </ToolbarBtn>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <ToolbarBtn
                    title="Code Block"
                    active={editor.isActive('codeBlock')}
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  >
                    <span className="text-[10px] font-mono">{String.fromCharCode(60)}/{String.fromCharCode(62)}</span>
                  </ToolbarBtn>
                  <ToolbarBtn
                    title="Blockquote"
                    active={editor.isActive('blockquote')}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  >
                    <span className="text-[13px] leading-none">&ldquo;</span>
                  </ToolbarBtn>
                </div>
              )}

              {/* Tags row */}
              <div className="flex items-center flex-wrap gap-1.5">
                <Tag size={12} className="text-txt-muted flex-shrink-0" />
                {activeNote.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleRemoveTag(tag)}
                    className="
                      group flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full
                      bg-accent-amber/10 text-accent-amber border border-accent-amber/20
                      hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20
                      transition-colors
                    "
                    title="Click to remove"
                  >
                    {tag}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">✕</span>
                  </button>
                ))}
                {showTagInput ? (
                  <input
                    autoFocus
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    onBlur={() => { setShowTagInput(false); setTagInput(''); }}
                    placeholder="Tag name..."
                    className="
                      text-[10px] px-2 py-0.5 w-24 rounded-full
                      bg-bg-surface2 border border-white/10
                      text-txt-primary placeholder:text-txt-muted
                      outline-none focus:border-accent-amber/40
                    "
                  />
                ) : (
                  <button
                    onClick={() => setShowTagInput(true)}
                    className="
                      text-[10px] px-2 py-0.5 rounded-full
                      border border-dashed border-white/20 text-txt-muted
                      hover:border-accent-amber/40 hover:text-accent-amber
                      transition-colors
                    "
                  >
                    + tag
                  </button>
                )}
              </div>
            </div>

            {/* ── Editor body ─────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
              <EditorContent
                editor={editor}
                className="tiptap-editor flex-1 overflow-y-auto min-h-[300px]"
              />
            </div>

            {/* ── Status bar ──────────────────────────────────────────── */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-2 border-t border-white/[0.035] bg-[#0C0F14]">
              <span className="text-[10px] text-txt-muted">
                Last edited {formatDate(activeNote.updated_at)}
              </span>
              <AnimatePresence>
                {saving && (
                  <motion.div
                    key="saving"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-secondary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-secondary" />
                    </span>
                    <span className="text-[10px] text-accent-secondary">Auto-saved</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Note Confirmation Modal ───────────────────────────────── */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Delete Note">
        <p className="text-txt-secondary text-sm mb-6">
          Are you sure you want to delete this note? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteModal(null)}>Cancel</Button>
          <Button variant="danger" icon={<Trash2 size={14} />} onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </div>
      </Modal>

      {/* ── Create / Edit Folder Modal ───────────────────────────────────── */}
      <Modal
        open={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        title={folderModalMode === 'create' ? 'Create New Folder' : 'Edit Folder'}
        width="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-txt-muted mb-1 font-medium">Folder Name *</label>
            <input
              type="text"
              value={folderNameInput}
              onChange={(e) => setFolderNameInput(e.target.value)}
              placeholder="e.g. Frontend Architecture"
              autoFocus
              className="w-full bg-[#0D1017] border border-white/10 rounded-xl px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-amber/50 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveFolder();
                }
              }}
            />
          </div>

          <div>
            <label className="block text-xs text-txt-muted mb-1 font-medium">Parent Folder (Optional)</label>
            <select
              value={folderModalParentId || ''}
              onChange={(e) => setFolderModalParentId(e.target.value ? e.target.value : null)}
              className="w-full bg-[#0D1017] border border-white/10 rounded-xl px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-amber/50"
            >
              <option value="">— Root Level (No Parent) —</option>
              {folderOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {'\u00A0\u00A0'.repeat(opt.level)}{opt.level > 0 ? '↳ ' : ''}{opt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-txt-muted mb-1.5 font-medium">Folder Accent Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setFolderColorInput(folderColorInput === c.hex ? '' : c.hex)}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer border ${
                    folderColorInput === c.hex ? 'scale-125 border-white shadow-lg' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
              {folderColorInput && (
                <button
                  type="button"
                  onClick={() => setFolderColorInput('')}
                  className="text-[10px] text-zinc-400 hover:text-white underline ml-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {folderError && (
            <p className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {folderError}
            </p>
          )}

          <div className="flex gap-2 justify-end pt-2 border-t border-white/[0.06]">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowFolderModal(false)} disabled={isSavingFolder}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              onClick={handleSaveFolder}
              disabled={isSavingFolder || !folderNameInput.trim()}
            >
              {isSavingFolder ? 'Saving…' : folderModalMode === 'create' ? 'Create Folder' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Folder Confirmation Modal ─────────────────────────────── */}
      <Modal
        open={!!deleteFolderModal}
        onClose={() => setDeleteFolderModal(null)}
        title="Delete Folder"
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-txt-secondary text-xs leading-relaxed">
            Are you sure you want to delete <strong className="text-white">&quot;{deleteFolderModal?.name}&quot;</strong>?
          </p>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-accent-amber space-y-1">
            <p className="font-semibold">Subfolders and notes:</p>
            <p>• Nested subfolders inside this folder will also be deleted.</p>
            <p>• <strong>Your notes will NOT be deleted</strong>. Any notes inside will safely move to <em>Unfiled Notes</em>.</p>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-white/[0.06]">
            <Button variant="ghost" size="sm" onClick={() => setDeleteFolderModal(null)} disabled={isDeletingFolder}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={13} />}
              onClick={handleDeleteFolderConfirm}
              disabled={isDeletingFolder}
            >
              {isDeletingFolder ? 'Deleting…' : 'Delete Folder'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Move Note Modal ──────────────────────────────────────────────── */}
      <Modal
        open={!!moveNoteModal}
        onClose={() => setMoveNoteModal(null)}
        title="Move Note to Folder"
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-txt-muted">
            Choose where to place <strong className="text-white">&quot;{moveNoteModal?.title || 'Untitled'}&quot;</strong>:
          </p>

          <div>
            <label className="block text-xs text-txt-muted mb-1 font-medium">Destination Folder</label>
            <select
              value={targetMoveFolderId || ''}
              onChange={(e) => setTargetMoveFolderId(e.target.value ? e.target.value : null)}
              className="w-full bg-[#0D1017] border border-white/10 rounded-xl px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-amber/50"
            >
              <option value="">— Unfiled (No folder) —</option>
              {folderOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {'\u00A0\u00A0'.repeat(opt.level)}{opt.level > 0 ? '↳ ' : ''}{opt.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-white/[0.06]">
            <Button variant="ghost" size="sm" onClick={() => setMoveNoteModal(null)} disabled={isMovingNote}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<FolderInput size={13} />}
              onClick={handleMoveNoteConfirm}
              disabled={isMovingNote}
            >
              {isMovingNote ? 'Moving…' : 'Move Note'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── New Note Modal ────────────────────────────────────────────────── */}
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="Create New Note" width="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-txt-muted mb-1 font-medium">Note Title</label>
            <input
              type="text"
              value={newNoteTitle}
              onChange={e => setNewNoteTitle(e.target.value)}
              placeholder="e.g. Asynchronous JS & Promises"
              autoFocus
              className="w-full bg-[#0D1017] border border-white/10 rounded-xl px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-amber/50 transition-colors"
            />
          </div>

          {/* Folder selection in New Note */}
          <div>
            <label className="block text-xs text-txt-muted mb-1 font-medium">Folder (Optional)</label>
            <select
              value={newNoteFolderId || ''}
              onChange={(e) => setNewNoteFolderId(e.target.value ? e.target.value : null)}
              className="w-full bg-[#0D1017] border border-white/10 rounded-xl px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-amber/50"
            >
              <option value="">— Unfiled (No folder) —</option>
              {folderOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {'\u00A0\u00A0'.repeat(opt.level)}{opt.level > 0 ? '↳ ' : ''}{opt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs text-txt-muted mb-2 font-medium">Note Type</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setNewNoteType('general'); setNewNoteLinkedId(''); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${
                  newNoteType === 'general'
                    ? 'bg-accent-amber/10 border-accent-amber/40 text-accent-amber'
                    : 'bg-bg-surface2 border-white/[0.08] text-txt-muted hover:border-white/20'
                }`}
              >
                <FileText size={20} />
                <span className="text-xs font-semibold">General Note</span>
                <span className="text-[10px] text-center opacity-70">Standalone personal thoughts</span>
              </button>
              <button
                type="button"
                onClick={() => setNewNoteType('linked')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${
                  newNoteType === 'linked'
                    ? 'bg-accent-amber/10 border-accent-amber/40 text-accent-amber'
                    : 'bg-bg-surface2 border-white/[0.08] text-txt-muted hover:border-white/20'
                }`}
              >
                <Link2 size={20} />
                <span className="text-xs font-semibold">Linked Note</span>
                <span className="text-[10px] text-center opacity-70">Tied to a course, milestone, or project</span>
              </button>
            </div>
          </div>

          {newNoteType === 'linked' && (
            <div className="space-y-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08]">
              <div className="flex gap-1.5 bg-[#0D1017] p-1 rounded-lg border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => { setNewNoteLinkType('course'); setNewNoteLinkedId(''); }}
                  className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    newNoteLinkType === 'course'
                      ? 'bg-accent-amber text-[#0D0F14] font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>📚</span>
                  <span>Course</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setNewNoteLinkType('topic'); setNewNoteLinkedId(''); }}
                  className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    newNoteLinkType === 'topic'
                      ? 'bg-accent-amber text-[#0D0F14] font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>🗺️</span>
                  <span>Topic</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setNewNoteLinkType('project'); setNewNoteLinkedId(''); }}
                  className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    newNoteLinkType === 'project'
                      ? 'bg-accent-amber text-[#0D0F14] font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>💼</span>
                  <span>Project</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setNewNoteLinkType('milestone'); setNewNoteLinkedId(''); }}
                  className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    newNoteLinkType === 'milestone'
                      ? 'bg-accent-amber text-[#0D0F14] font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>🎯</span>
                  <span>Milestone</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] text-txt-muted mb-1 font-medium">
                  Select {newNoteLinkType === 'course' ? 'Course' : newNoteLinkType === 'topic' ? 'Roadmap Topic' : newNoteLinkType === 'project' ? 'Project' : 'Project Milestone'} *
                </label>
                <select
                  value={newNoteLinkedId}
                  onChange={e => {
                    const mid = e.target.value;
                    setNewNoteLinkedId(mid);
                    if (newNoteLinkType === 'milestone') {
                      const m = allProjectMilestones.find(item => item.id === mid);
                      if (m) setNewNoteProjectId(m.project_id);
                    }
                  }}
                  className="w-full bg-[#0D1017] border border-white/10 focus:border-accent-amber/40 rounded-xl px-3 py-2 text-xs text-txt-primary outline-none"
                >
                  <option value="">— Select {newNoteLinkType === 'milestone' ? 'Project Milestone' : newNoteLinkType} —</option>
                  {newNoteLinkType === 'course' && courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                  {newNoteLinkType === 'topic' && allMilestones.map(t => (
                    <option key={t.id} value={t.id}>{t.label} {t.phase ? `(${t.phase})` : ''}</option>
                  ))}
                  {newNoteLinkType === 'project' && projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                  {newNoteLinkType === 'milestone' && projects.map(p => {
                    const pMilestones = milestones[p.id] || [];
                    if (pMilestones.length === 0) return null;
                    return (
                      <optgroup key={p.id} label={`💼 ${p.title}`}>
                        {pMilestones.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.title}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                {newNoteLinkType === 'milestone' && allProjectMilestones.length === 0 && (
                  <p className="text-[11px] text-zinc-500 mt-1.5 italic">
                    No milestones found in your projects yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {createNoteError && (
            <p className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {createNoteError}
            </p>
          )}

          <div className="flex gap-2 justify-end pt-2 border-t border-white/[0.06]">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowNewModal(false)} disabled={isCreatingNote}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              icon={<Plus size={13} />}
              onClick={handleCreateNote}
              disabled={isCreatingNote || (newNoteType === 'linked' && !newNoteLinkedId)}
            >
              {isCreatingNote ? 'Creating…' : 'Create Note'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Link / Re-link Active Note Modal ─────────────────────────────── */}
      <Modal open={showLinkModal} onClose={() => setShowLinkModal(false)} title="Link Note to Learning Workspace" width="max-w-md">
        <div className="space-y-4">
          <p className="text-xs text-txt-muted">
            Connect &quot;{activeNote?.title || 'this note'}&quot; to a course, roadmap milestone, or project to access it directly within that workspace.
          </p>

          <div className="flex gap-1.5 bg-[#0D1017] p-1 rounded-lg border border-white/[0.06]">
            <button
              type="button"
              onClick={() => { setEditLinkType('course'); setEditLinkedId(''); }}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                editLinkType === 'course'
                  ? 'bg-accent-amber text-[#0D0F14] font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>📚</span>
              <span>Course</span>
            </button>
            <button
              type="button"
              onClick={() => { setEditLinkType('topic'); setEditLinkedId(''); }}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                editLinkType === 'topic'
                  ? 'bg-accent-amber text-[#0D0F14] font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🗺️</span>
              <span>Topic</span>
            </button>
            <button
              type="button"
              onClick={() => { setEditLinkType('project'); setEditLinkedId(''); }}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                editLinkType === 'project'
                  ? 'bg-accent-amber text-[#0D0F14] font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>💼</span>
              <span>Project</span>
            </button>
            <button
              type="button"
              onClick={() => { setEditLinkType('milestone'); setEditLinkedId(''); }}
              className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                editLinkType === 'milestone'
                  ? 'bg-accent-amber text-[#0D0F14] font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🎯</span>
              <span>Milestone</span>
            </button>
          </div>

          <div>
            <label className="block text-[11px] text-txt-muted mb-1 font-medium">
              Select {editLinkType === 'course' ? 'Course' : editLinkType === 'topic' ? 'Roadmap Topic' : editLinkType === 'project' ? 'Project' : 'Project Milestone'} *
            </label>
            <select
              value={editLinkedId}
              onChange={e => {
                const mid = e.target.value;
                setEditLinkedId(mid);
                if (editLinkType === 'milestone') {
                  const m = allProjectMilestones.find(item => item.id === mid);
                  if (m) setEditProjectId(m.project_id);
                }
              }}
              className="w-full bg-[#0D1017] border border-white/10 focus:border-accent-amber/40 rounded-xl px-3 py-2 text-xs text-txt-primary outline-none"
            >
              <option value="">— Select {editLinkType === 'milestone' ? 'Project Milestone' : editLinkType} —</option>
              {editLinkType === 'course' && courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
              {editLinkType === 'topic' && allMilestones.map(t => (
                <option key={t.id} value={t.id}>{t.label} {t.phase ? `(${t.phase})` : ''}</option>
              ))}
              {editLinkType === 'project' && projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
              {editLinkType === 'milestone' && projects.map(p => {
                const pMilestones = milestones[p.id] || [];
                if (pMilestones.length === 0) return null;
                return (
                  <optgroup key={p.id} label={`💼 ${p.title}`}>
                    {pMilestones.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            {editLinkType === 'milestone' && allProjectMilestones.length === 0 && (
              <p className="text-[11px] text-zinc-500 mt-1.5 italic">
                No milestones found in your projects yet.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            {activeLinkInfo ? (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="text-rose-400 hover:text-rose-300"
                onClick={() => handleApplyEditLink('unlink')}
              >
                Unlink Note
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setShowLinkModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                type="button"
                icon={<Check size={13} />}
                onClick={() => handleApplyEditLink('link')}
                disabled={!editLinkedId}
              >
                Save Link
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export { Notes };
