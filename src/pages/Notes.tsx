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
  Check, X,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useNotesStore } from '../store/notesStore';
import { useRoadmapStore } from '../store/roadmapStore';
import { useProjectsStore } from '../store/projectsStore';
import { formatDate } from '../lib/utils';
import type { Note, NoteType } from '../types';

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

// ─── Notes Page ─────────────────────────────────────────────────────────────
const Notes: React.FC = () => {
  const {
    notes,
    activeNote,
    loading,
    searchQuery,
    fetchNotes,
    setActiveNote,
    createNote,
    saveNote,
    deleteNote,
    setSearchQuery,
  } = useNotesStore();

  const { courses, topics, localNodes } = useRoadmapStore();
  const { projects } = useProjectsStore();

  // Deep link from the Projects page: /notes?project=<id> scopes the list to
  // one project, and &new=1 opens the composer already linked to it.
  const [searchParams, setSearchParams] = useSearchParams();
  const projectFilterId = searchParams.get('project');
  const filterProject = projectFilterId
    ? projects.find(p => p.id === projectFilterId) ?? null
    : null;
  const clearProjectFilter = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('project');
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
  const [newNoteLinkType, setNewNoteLinkType] = useState<'course' | 'topic' | 'project'>('course');
  const [newNoteLinkedId, setNewNoteLinkedId] = useState<string>('');
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [createNoteError, setCreateNoteError] = useState<string | null>(null);

  // Edit / Link Active Note Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editLinkType, setEditLinkType] = useState<'course' | 'topic' | 'project'>('course');
  const [editLinkedId, setEditLinkedId] = useState<string>('');

  // Fetch notes on mount
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

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
  }, [courses, allMilestones, projects]);

  // Active note's link info
  const activeLinkInfo = useMemo(() => {
    if (!activeNote) return null;
    return getNoteLinkInfo(activeNote);
  }, [activeNote, getNoteLinkInfo]);

  // ── Editor ──────────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit,
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
    // Avoid re-setting if content is the same (prevents cursor jump)
    const current = JSON.stringify(editor.getJSON());
    if (current !== activeNote.content) {
      editor.commands.setContent(parsed as Parameters<typeof editor.commands.setContent>[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNote?.id, editor]);

  // ── Filtered notes list ─────────────────────────────────────────────────
  const isNoteLinked = (n: Note) => n.note_type === 'linked' || Boolean(n.course_id || n.topic_id || n.project_id);

  const linkedCount = notes.filter(isNoteLinked).length;
  const generalCount = notes.length - linkedCount;

  const filtered = notes.filter((n) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      n.title.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q))
    );
    const linked = isNoteLinked(n);
    const matchesType = noteTypeFilter === 'all'
      || (noteTypeFilter === 'general' && !linked)
      || (noteTypeFilter === 'linked' && linked);
    const matchesProject = !projectFilterId || n.project_id === projectFilterId;
    return matchesSearch && matchesType && matchesProject;
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleNewNote = useCallback(() => {
    setNewNoteTitle('');
    // Arriving from a project card, the obvious note to write is one attached
    // to that project — so the composer opens pre-linked instead of blank.
    setNewNoteType(projectFilterId ? 'linked' : 'general');
    setNewNoteLinkType(projectFilterId ? 'project' : 'course');
    setNewNoteLinkedId(projectFilterId ?? '');
    setCreateNoteError(null);
    setShowNewModal(true);
  }, [projectFilterId]);

  // ?new=1 (sent by a project with no notes yet) opens the composer once, then
  // drops the flag so a refresh doesn't reopen it.
  useEffect(() => {
    if (searchParams.get('new') !== '1') return;
    handleNewNote();
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, handleNewNote]);

  // While the list is scoped to a project, the note open in the editor has to
  // belong to that project — otherwise the sidebar and the editor disagree.
  useEffect(() => {
    if (!projectFilterId) return;
    if (activeNote?.project_id === projectFilterId) return;
    const target = notes.find(n => n.project_id === projectFilterId) ?? null;
    if (target?.id !== activeNote?.id) setActiveNote(target);
  }, [projectFilterId, notes, activeNote, setActiveNote]);

  const handleCreateNote = useCallback(async () => {
    // Guards against a fast double-click firing two inserts before the first
    // one resolves, which used to create two identical notes.
    if (isCreatingNote) return;

    const isLinked = newNoteType === 'linked' && Boolean(newNoteLinkedId);
    setIsCreatingNote(true);
    setCreateNoteError(null);

    const created = await createNote({
      title: newNoteTitle.trim() || 'Untitled Note',
      content: '',
      tags: [],
      note_type: isLinked ? 'linked' : 'general',
      course_id: newNoteLinkType === 'course' && isLinked ? newNoteLinkedId : undefined,
      topic_id: newNoteLinkType === 'topic' && isLinked ? newNoteLinkedId : undefined,
      project_id: newNoteLinkType === 'project' && isLinked ? newNoteLinkedId : undefined,
    });

    setIsCreatingNote(false);

    // createNote returns null when the save to the account failed — the
    // store already rolled its own state back, so the only thing left is to
    // tell the person rather than silently closing as if it worked.
    if (!created) {
      setCreateNoteError('Could not save the note. Check your connection and try again.');
      return;
    }

    setShowNewModal(false);
    setNewNoteTitle('');
    setNewNoteLinkedId('');

    // If created a linked note while on General filter, switch to 'linked' so it's visible immediately!
    if (isLinked && noteTypeFilter === 'general') {
      setNoteTypeFilter('linked');
    }
  }, [createNote, isCreatingNote, newNoteType, newNoteLinkedId, newNoteLinkType, newNoteTitle, noteTypeFilter]);

  const handleApplyEditLink = (action: 'link' | 'unlink') => {
    if (!activeNote) return;
    if (action === 'unlink' || !editLinkedId) {
      saveNote(activeNote.id, {
        note_type: 'general',
        course_id: undefined,
        topic_id: undefined,
        project_id: undefined,
      });
    } else {
      saveNote(activeNote.id, {
        note_type: 'linked',
        course_id: editLinkType === 'course' ? editLinkedId : undefined,
        topic_id: editLinkType === 'topic' ? editLinkedId : undefined,
        project_id: editLinkType === 'project' ? editLinkedId : undefined,
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

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex overflow-hidden">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
      <div className="w-64 flex-shrink-0 border-r border-white/[0.035] flex flex-col bg-[#11151D]">

        {/* Scoped-to-a-project banner */}
        {projectFilterId && (
          <div className="px-3 pt-3">
            <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-accent-amber/10 border border-accent-amber/25">
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-accent-amber/80">Project</p>
                <p className="text-[11px] font-medium text-accent-amber truncate">
                  {filterProject?.title ?? 'Unknown project'}
                </p>
              </div>
              <button
                onClick={clearProjectFilter}
                title="Show all notes"
                className="p-1 rounded text-accent-amber/70 hover:text-accent-amber hover:bg-accent-amber/10 transition-colors cursor-pointer flex-shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="p-3 bg-[#11151D]">
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
        <div className="px-3 py-2 bg-[#11151D]">
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

        {/* New Note */}
        <div className="p-3 bg-[#11151D]">
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={13} />}
            onClick={handleNewNote}
            className="w-full justify-center"
          >
            New Note
          </Button>
        </div>
        {/* Notes list */}
        <div className="flex-1 overflow-y-auto py-1">
          {loading && filtered.length === 0 && (
            <p className="text-xs text-txt-muted text-center mt-6">Loading...</p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="text-xs text-txt-muted text-center mt-6 px-4">
              {searchQuery
                ? 'No notes match your search.'
                : projectFilterId
                  ? 'No notes for this project yet.'
                  : 'No notes yet.'}
            </p>
          )}
          <AnimatePresence initial={false}>
            {filtered.map((note, i) => {
              const isActive = activeNote?.id === note.id;
              const link = getNoteLinkInfo(note);
              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ delay: i * 0.03, duration: 0.18 }}
                  onClick={() => setActiveNote(note)}
                  className={[
                    'group relative px-3 py-2.5 cursor-pointer transition-colors',
                    isActive
                    ? 'bg-white/[0.045] border-l-2 border-accent-amber shadow-[inset_0_0_20px_rgb(var(--c-primary)/0.03)]'
                    : 'border-l-2 border-transparent hover:bg-white/[0.025]'
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <p className={[
                        'text-xs font-medium truncate',
                        isActive ? 'text-accent-amber' : 'text-txt-primary',
                      ].join(' ')}>
                        {note.title || 'Untitled'}
                      </p>

                      {/* Linked Badge */}
                      {link && (
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-accent-amber/90 font-medium truncate">
                          <span>{link.icon}</span>
                          <span className="truncate">{link.label}</span>
                        </div>
                      )}

                      <p className="text-[10px] text-txt-muted mt-0.5">
                        {formatDate(note.updated_at)}
                      </p>
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {note.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-amber/10 text-accent-amber"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteModal(note.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-txt-muted hover:text-rose-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer count */}
        <div className="p-3 bg-[#0F131A]">
          <p className="text-[10px] text-txt-muted text-center">
            {filtered.length} {filtered.length === 1 ? 'note' : 'notes'}
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!activeNote ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-bg-surface2 flex items-center justify-center">
              <FileText size={24} className="text-txt-muted" />
            </div>
            <div>
              <p className="text-txt-secondary font-medium">Select or create a note</p>
              <p className="text-txt-muted text-xs mt-1">
                Your notes will appear here with rich text editing
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={13} />}
              onClick={handleNewNote}
            >
              New Note
            </Button>
          </div>
        ) : (
          /* Active note editor */
          <div className="flex-1 flex flex-col min-h-0">

            {/* ── Header: Link Bar + Title + Toolbar ─────────────────────── */}
            <div className="flex-shrink-0 px-6 pt-5 pb-3 bg-[#0D0F14] space-y-2.5">

              {/* Linked entity bar */}
              <div className="flex items-center gap-2 flex-wrap">
                {activeLinkInfo ? (
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-accent-amber/10 border border-accent-amber/25 text-xs text-accent-amber">
                    <span className="text-sm">{activeLinkInfo.icon}</span>
                    <span className="font-semibold truncate max-w-[320px]">{activeLinkInfo.label}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">({activeLinkInfo.type})</span>
                    <div className="flex items-center gap-1.5 ml-1 pl-1.5 border-l border-accent-amber/30">
                      <button
                        onClick={() => {
                          setEditLinkType(activeLinkInfo.type);
                          setEditLinkedId(activeNote.course_id || activeNote.topic_id || activeNote.project_id || '');
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
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <EditorContent
                editor={editor}
                className="tiptap-editor flex-1 overflow-y-auto min-h-[300px]"
              />
            </div>

            {/* ── Status bar ──────────────────────────────────────────── */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-2 border-t border-white/[0.035] bg-[#0C0F14]">
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

      {/* ── Delete confirmation modal ─────────────────────────────────────── */}
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
                  <span>Milestone</span>
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
              </div>

              <div>
                <label className="block text-[11px] text-txt-muted mb-1 font-medium">
                  Select {newNoteLinkType === 'course' ? 'Course' : newNoteLinkType === 'topic' ? 'Roadmap Milestone' : 'Project'} *
                </label>
                <select
                  value={newNoteLinkedId}
                  onChange={e => setNewNoteLinkedId(e.target.value)}
                  className="w-full bg-[#0D1017] border border-white/10 focus:border-accent-amber/40 rounded-xl px-3 py-2 text-xs text-txt-primary outline-none"
                >
                  <option value="">— Select {newNoteLinkType} —</option>
                  {newNoteLinkType === 'course' && courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                  {newNoteLinkType === 'topic' && allMilestones.map(t => (
                    <option key={t.id} value={t.id}>{t.label} {t.phase ? `(${t.phase})` : ''}</option>
                  ))}
                  {newNoteLinkType === 'project' && projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
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
              <span>Milestone</span>
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
          </div>

          <div>
            <label className="block text-[11px] text-txt-muted mb-1 font-medium">
              Select {editLinkType === 'course' ? 'Course' : editLinkType === 'topic' ? 'Roadmap Milestone' : 'Project'} *
            </label>
            <select
              value={editLinkedId}
              onChange={e => setEditLinkedId(e.target.value)}
              className="w-full bg-[#0D1017] border border-white/10 focus:border-accent-amber/40 rounded-xl px-3 py-2 text-xs text-txt-primary outline-none"
            >
              <option value="">— Select {editLinkType} —</option>
              {editLinkType === 'course' && courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
              {editLinkType === 'topic' && allMilestones.map(t => (
                <option key={t.id} value={t.id}>{t.label} {t.phase ? `(${t.phase})` : ''}</option>
              ))}
              {editLinkType === 'project' && projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
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
