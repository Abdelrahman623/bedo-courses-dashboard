import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Grid3X3, Columns, Plus, FolderOpen, Trash2, Rocket, ArrowUpRight,
  Pencil, Search, X, StickyNote, GraduationCap, GripVertical, Layers,
  Users, Flag, Share2, UserPlus, AlertCircle, LogOut,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { SlideOver } from '../components/ui/SlideOver';
import { useProjectsStore } from '../store/projectsStore';
import { useRoadmapStore } from '../store/roadmapStore';
import { useNotesStore } from '../store/notesStore';
import { safeUrl, getStatusColor, formatDate } from '../lib/utils';
import { InvitePanel } from '../components/project/InvitePanel';
import { MilestonesPanel } from '../components/project/MilestonesPanel';
import { InviteModal } from '../components/project/InviteModal';
import { ProjectRoadmapView } from '../components/project/ProjectRoadmapView';
import { useAuth } from '../hooks/useAuth';
import type { Project, ProjectStatus, ProjectType } from '../types';

// Column dot colors come from getStatusColor() at render time so they follow the theme
// (in_progress → primary, deployed → tertiary; completed / idea stay semantic).
const KANBAN_COLS: { status: ProjectStatus; label: string }[] = [
  { status: 'idea',        label: 'Backlog / Ideas' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'completed',   label: 'Completed' },
  { status: 'deployed',    label: 'Shipped / Live' },
];

const STATUS_LABEL: Record<ProjectStatus, string> = {
  idea: 'Idea', in_progress: 'In Progress', completed: 'Completed', deployed: 'Shipped',
};

type SortKey = 'recent' | 'progress' | 'title';
type StatusFilter = 'all' | ProjectStatus;
type TypeFilter = 'all' | ProjectType;

const EMPTY_FORM = {
  title: '', description: '', type: 'independent' as ProjectType,
  status: 'idea' as ProjectStatus, tech_stack_raw: '',
  github_url: '', demo_url: '', local_path: '', completion_pct: 0,
  course_id: '' as string,
};
type FormState = typeof EMPTY_FORM;

const formFromProject = (p: Project): FormState => ({
  title: p.title,
  description: p.description ?? '',
  type: p.type,
  status: p.status,
  tech_stack_raw: p.tech_stack.join(', '),
  github_url: p.github_url ?? '',
  demo_url: p.demo_url ?? '',
  local_path: p.local_path ?? '',
  completion_pct: p.completion_pct,
  course_id: p.course_id ?? '',
});

// ─── Status ⇄ completion consistency ────────────────────────────────────────
// The two fields used to drift apart freely: a project could sit in the
// "Shipped / Live" column at 0%, or read 100% while still "In Progress".
// These two helpers keep them honest, and they are the *only* place either
// value is derived — nothing else guesses.

/** Status was changed by the user → reconcile the percentage. */
function changesForStatus(p: Project, status: ProjectStatus): Partial<Project> {
  if (status === p.status) return {};
  // Completed and shipped both mean "the work is done" — there is no such
  // thing as a shipped project at 40%.
  if (status === 'completed' || status === 'deployed') {
    return { status, completion_pct: 100 };
  }
  // Reopening deliberately leaves the number alone rather than inventing a
  // new one; the slider is right there if it needs correcting.
  return { status };
}

/** Percentage was changed by the user → reconcile the status. */
function changesForCompletion(p: Project, rawPct: number): Partial<Project> {
  const pct = Math.max(0, Math.min(100, Math.round(rawPct)));
  if (pct === p.completion_pct) return {};
  const changes: Partial<Project> = { completion_pct: pct };
  if (pct === 100 && (p.status === 'idea' || p.status === 'in_progress')) {
    changes.status = 'completed';
  } else if (pct > 0 && pct < 100 && p.status === 'idea') {
    changes.status = 'in_progress';
  } else if (pct < 100 && (p.status === 'completed' || p.status === 'deployed')) {
    // Backing off a finished project reopens it instead of leaving a
    // "Completed · 62%" card on the board.
    changes.status = 'in_progress';
  }
  return changes;
}

// ─── Reusable field wrappers ────────────────────────────────────────────────
const inputCls =
  'w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 ' +
  'text-sm text-white placeholder:text-zinc-600 outline-none transition-colors';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
    {children}
  </div>
);

// ─── Project card ───────────────────────────────────────────────────────────
// Defined at module scope on purpose: it used to live inside the page
// component, so every keystroke on the page remounted every card (losing
// focus and restarting animations).
interface CardProps {
  project: Project;
  noteCount: number;
  courseTitle?: string;
  draggable?: boolean;
  onOpen: (p: Project) => void;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
  onStatus: (p: Project, s: ProjectStatus) => void;
  onCompletion: (p: Project, pct: number) => void;
  onNotes: (p: Project) => void;
  onTech: (tech: string) => void;
  onRoadmap?: (p: Project) => void;
  onInvite?: (p: Project) => void;
  onLeave?: (p: Project) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}

const ProjectCard: React.FC<CardProps> = ({
  project, noteCount, courseTitle, draggable,
  onOpen, onEdit, onDelete, onLeave, onStatus, onCompletion, onNotes, onTech, onRoadmap, onInvite,
  onDragStart, onDragEnd,
}) => {

  const accent = getStatusColor(project.status);

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart?.(project.id); }}
      onDragEnd={() => onDragEnd?.()}
      className="bg-[#131722] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-4 flex flex-col gap-3 transition-all duration-150 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={() => onOpen(project)}
          className="flex-1 min-w-0 text-left cursor-pointer"
        >
          <h3 className="font-semibold text-white text-sm tracking-tight truncate group-hover:text-accent-amber transition-colors">
            {project.title}
          </h3>
          {project.description && (
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}
        </button>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {draggable && (
            <span className="hidden lg:block p-1 text-zinc-600 cursor-grab active:cursor-grabbing" title="Drag to another column">
              <GripVertical size={13} />
            </span>
          )}
          {!project.isShared && onInvite && (
            <button
              onClick={() => onInvite(project)}
              className="p-1.5 rounded-lg text-accent-amber hover:bg-accent-amber/15 transition-all cursor-pointer"
              title="Invite collaborators to this project"
            >
              <UserPlus size={13} />
            </button>
          )}
          {!project.isShared && (
            <button
              onClick={() => onEdit(project)}
              className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer sm:opacity-0 sm:group-hover:opacity-100"
              title="Edit project"
            >
              <Pencil size={13} />
            </button>
          )}
          {!project.isShared && (
            <button
              onClick={() => onDelete(project)}
              className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer sm:opacity-0 sm:group-hover:opacity-100"
              title="Delete project"
            >
              <Trash2 size={13} />
            </button>
          )}
          {project.isShared && onLeave && (
            <button
              onClick={() => onLeave(project)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
              title="Leave / Withdraw from this project"
            >
              <LogOut size={13} />
            </button>
          )}
        </div>

      </div>

      {/* Status (editable) + type */}
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="relative inline-flex">
          <Badge status={project.status} size="sm" />
          <select
            value={project.status}
            onChange={(e) => onStatus(project, e.target.value as ProjectStatus)}
            title="Change status"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          >
            {KANBAN_COLS.map(c => (
              <option key={c.status} value={c.status}>{STATUS_LABEL[c.status]}</option>
            ))}
          </select>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
          {project.type === 'course' ? 'Course Track' : 'Independent'}
        </span>
        {project.isShared && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <Share2 size={10} />
            Shared
          </span>
        )}
        {courseTitle && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/25 max-w-[160px]"
            title={courseTitle}
          >
            <GraduationCap size={10} className="flex-shrink-0" />
            <span className="truncate">{courseTitle}</span>
          </span>
        )}
      </div>

      {/* Tech stack — each chip filters the board */}
      {project.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.tech_stack.map(t => (
            <button
              key={t}
              onClick={() => onTech(t)}
              title={`Filter by ${t}`}
              className="px-2 py-0.5 bg-white/[0.03] hover:bg-white/[0.08] rounded text-[10px] font-mono text-zinc-400 hover:text-white border border-white/[0.06] transition-colors cursor-pointer"
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Progress — draggable, not just decorative */}
      <div className="pt-1">
        <div className="flex justify-between text-[11px] mb-1">
          <span className="text-zinc-500 font-medium">Completion</span>
          <span className="font-mono text-zinc-300 font-medium">{project.completion_pct}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={project.completion_pct}
          onChange={(e) => onCompletion(project, Number(e.target.value))}
          title="Drag to update completion"
          className="project-range w-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${accent} 0%, ${accent} ${project.completion_pct}%, rgba(255,255,255,0.08) ${project.completion_pct}%, rgba(255,255,255,0.08) 100%)`,
          }}
        />
      </div>

      {/* Links footer */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-2 mt-auto">
        {project.github_url && (
          <a
            href={safeUrl(project.github_url)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Repository <ArrowUpRight size={11} />
          </a>
        )}
        {project.demo_url && (
          <a
            href={safeUrl(project.demo_url)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Live Demo <ArrowUpRight size={11} />
          </a>
        )}
        <button
          onClick={() => onNotes(project)}
          title={noteCount ? `Open ${noteCount} linked note${noteCount === 1 ? '' : 's'}` : 'Write the first note for this project'}
          className={`flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
            noteCount ? 'text-accent-amber hover:brightness-125' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <StickyNote size={11} />
          {noteCount ? `${noteCount} note${noteCount === 1 ? '' : 's'}` : 'Add note'}
        </button>
        {onRoadmap && (
          <button
            onClick={() => onRoadmap(project)}
            title="Open project milestone roadmap"
            className="flex items-center gap-1 text-[11px] font-medium text-accent-amber hover:brightness-125 transition-colors cursor-pointer"
          >
            <Flag size={11} />
            Roadmap
          </button>
        )}
        {!project.isShared && onInvite && (
          <button
            onClick={() => onInvite(project)}
            title="Invite someone to this project"
            className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:brightness-125 transition-colors cursor-pointer"
          >
            <UserPlus size={11} />
            Invite
          </button>
        )}
        {project.isShared && onLeave && (
          <button
            onClick={() => onLeave(project)}
            title="Leave / Withdraw from this project"
            className="flex items-center gap-1 text-[11px] font-medium text-rose-400 hover:brightness-125 transition-colors cursor-pointer"
          >
            <LogOut size={11} />
            Leave
          </button>
        )}

        {project.local_path && (
          <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 truncate max-w-full" title={project.local_path}>
            <FolderOpen size={11} className="flex-shrink-0" /> {project.local_path.split(/[/\\]/).pop()}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Page ───────────────────────────────────────────────────────────────────
export const Projects: React.FC = () => {
  const {
    projects, view, setView, selectedRoadmapProjectId, setSelectedRoadmapProjectId,
    fetchProjects, addProject, updateProject, deleteProject, leaveProject
  } = useProjectsStore();
  const { courses, fetchAll } = useRoadmapStore();
  const { notes, fetchNotes, saveNote } = useNotesStore();
  const { user } = useAuth();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showModal, setShowModal] = useState(false);
  const [inviteModalProject, setInviteModalProject] = useState<Project | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);
  const [confirmLeave, setConfirmLeave] = useState<Project | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'milestones' | 'collaborators'>('overview');



  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [techFilter, setTechFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('recent');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ProjectStatus | null>(null);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  // Courses and notes are what this page links *to*; without them the course
  // badge and the note counts would silently render as "nothing linked".
  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const openCreate = useCallback((preset?: Partial<FormState>) => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, ...preset });
    setModalError(null);
    setShowModal(true);
  }, []);


  // Deep link: Home's "Register New Project" opens the form directly.
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreate();
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, openCreate]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const notesByProject = useMemo(() => {
    const map = new Map<string, number>();
    notes.forEach(n => {
      if (n.project_id) map.set(n.project_id, (map.get(n.project_id) ?? 0) + 1);
    });
    return map;
  }, [notes]);

  const courseTitleById = useMemo(() => {
    const map = new Map<string, string>();
    courses.forEach(c => map.set(c.id, c.title));
    return map;
  }, [courses]);

  const stats = useMemo(() => {
    const shipped = projects.filter(p => p.status === 'deployed').length;
    const done = projects.filter(p => p.status === 'completed').length;
    const active = projects.filter(p => p.status === 'in_progress').length;
    const avg = projects.length
      ? Math.round(projects.reduce((s, p) => s + p.completion_pct, 0) / projects.length)
      : 0;
    return { total: projects.length, shipped, done, active, avg };
  }, [projects]);

  const statusCounts = useMemo(() => {
    const c: Record<ProjectStatus, number> = { idea: 0, in_progress: 0, completed: 0, deployed: 0 };
    projects.forEach(p => { c[p.status] += 1; });
    return c;
  }, [projects]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = projects.filter(p => {
      const matchesQuery = !q
        || p.title.toLowerCase().includes(q)
        || (p.description ?? '').toLowerCase().includes(q)
        || p.tech_stack.some(t => t.toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesType = typeFilter === 'all' || p.type === typeFilter;
      const matchesTech = !techFilter || p.tech_stack.some(t => t.toLowerCase() === techFilter.toLowerCase());
      return matchesQuery && matchesStatus && matchesType && matchesTech;
    });

    const sorted = [...list];
    if (sort === 'progress') sorted.sort((a, b) => b.completion_pct - a.completion_pct);
    else if (sort === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title));
    else sorted.sort((a, b) => (b.updated_at ?? b.created_at).localeCompare(a.updated_at ?? a.created_at));
    return sorted;
  }, [projects, query, statusFilter, typeFilter, techFilter, sort]);

  const filtersActive = Boolean(query || statusFilter !== 'all' || typeFilter !== 'all' || techFilter);
  const clearFilters = () => {
    setQuery(''); setStatusFilter('all'); setTypeFilter('all'); setTechFilter(null);
  };

  const detail = detailId ? projects.find(p => p.id === detailId) ?? null : null;

  // ── Mutations ────────────────────────────────────────────────────────────
  const handleStatus = useCallback((p: Project, status: ProjectStatus) => {
    const changes = changesForStatus(p, status);
    if (Object.keys(changes).length) updateProject(p.id, changes);
  }, [updateProject]);

  const handleCompletion = useCallback((p: Project, pct: number) => {
    const changes = changesForCompletion(p, pct);
    if (Object.keys(changes).length) updateProject(p.id, changes);
  }, [updateProject]);

  const goToNotes = useCallback((p: Project) => {
    const count = notesByProject.get(p.id) ?? 0;
    navigate(count ? `/notes?project=${p.id}` : `/notes?project=${p.id}&new=1`);
  }, [navigate, notesByProject]);

  const openEdit = (p: Project) => {
    setEditingId(p.id);
    setForm(formFromProject(p));
    setModalError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setModalError(null);

    // A project linked to a course *is* a course project — the two fields
    // can no longer contradict each other.
    const linkedCourse = form.course_id || undefined;
    const type: ProjectType = linkedCourse ? 'course' : form.type === 'course' ? 'course' : 'independent';
    const completion =
      form.status === 'completed' || form.status === 'deployed'
        ? 100
        : Math.max(0, Math.min(100, form.completion_pct));

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type,
      status: form.status,
      tech_stack: form.tech_stack_raw.split(',').map(t => t.trim()).filter(Boolean),
      github_url: form.github_url.trim() || undefined,
      demo_url: form.demo_url.trim() || undefined,
      local_path: form.local_path.trim() || undefined,
      completion_pct: completion,
      course_id: linkedCourse,
    };

    const res = editingId ? await updateProject(editingId, payload) : await addProject(payload);

    setSaving(false);
    if (res?.error) {
      setModalError(res.error);
      return;
    }

    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalError(null);
  };


  const handleDelete = async (p: Project) => {
    // The database sets notes.project_id to NULL on delete; the notes store
    // in memory doesn't know that, so it's unlinked here too. Otherwise a
    // note would keep claiming to belong to a project that no longer exists.
    notes.filter(n => n.project_id === p.id)
      .forEach(n => saveNote(n.id, { project_id: undefined, note_type: n.course_id || n.topic_id ? 'linked' : 'general' }));
    await deleteProject(p.id);
    setConfirmDelete(null);
    if (detailId === p.id) setDetailId(null);
  };

  const handleLeave = async (p: Project) => {
    setLeaving(true);
    await leaveProject(p.id);
    setLeaving(false);
    setConfirmLeave(null);
    if (detailId === p.id) setDetailId(null);
  };

  const cardProps = (p: Project) => ({
    project: p,
    noteCount: notesByProject.get(p.id) ?? 0,
    courseTitle: p.course_id ? courseTitleById.get(p.course_id) : undefined,
    onOpen: (x: Project) => { setDetailId(x.id); setDetailTab('overview'); },
    onEdit: openEdit,
    onDelete: (x: Project) => setConfirmDelete(x),
    onLeave: (x: Project) => setConfirmLeave(x),
    onStatus: handleStatus,
    onCompletion: handleCompletion,
    onNotes: goToNotes,
    onRoadmap: (x: Project) => {
      setSelectedRoadmapProjectId(x.id);
      setView('roadmap');
    },
    onInvite: (x: Project) => setInviteModalProject(x),
    onTech: (t: string) => setTechFilter(prev => (prev?.toLowerCase() === t.toLowerCase() ? null : t)),
  });


  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Projects &amp; Portfolio</h1>
          <p className="text-xs text-zinc-400 mt-1">
            {stats.total} total · {stats.active} in flight · {stats.done + stats.shipped} finished
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#131722] rounded-lg border border-white/[0.08] p-0.5 gap-0.5">
            <button
              onClick={() => setView('grid')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                view === 'grid' ? 'bg-white/[0.08] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Grid View"
            >
              <Grid3X3 size={14} />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                view === 'kanban' ? 'bg-white/[0.08] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Kanban Board"
            >
              <Columns size={14} />
            </button>
            <button
              onClick={() => {
                if (projects.length > 0 && !selectedRoadmapProjectId) {
                  setSelectedRoadmapProjectId(projects[0].id);
                }
                setView('roadmap');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                view === 'roadmap' ? 'bg-accent-amber text-[#0D0F14] shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Project Milestone Roadmap (Dedicated Panel)"
            >
              <Flag size={13} />
              <span>Roadmap</span>
            </button>
          </div>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => openCreate()}>
            New Project
          </Button>
        </div>
      </div>

      {/* Portfolio stats */}
      {view !== 'roadmap' && projects.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Projects', value: String(stats.total), hint: `${stats.total - stats.active - stats.done - stats.shipped} in backlog` },
            { label: 'In flight', value: String(stats.active), hint: 'currently being built' },
            { label: 'Shipped / done', value: String(stats.done + stats.shipped), hint: `${stats.shipped} live` },
            { label: 'Portfolio progress', value: `${stats.avg}%`, hint: 'average completion' },
          ].map(s => (
            <Card key={s.label} hover={false} padding="p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{s.label}</p>
              <p className="text-xl font-bold text-white mt-1 font-mono">{s.value}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{s.hint}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Search + filters */}
      {view !== 'roadmap' && projects.length > 0 && (
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search title, description or tech…"
              className={`${inputCls} pl-8 py-1.5 text-xs`}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            <div className="flex bg-[#131722] rounded-lg border border-white/[0.08] p-0.5 gap-0.5 flex-shrink-0">
              {([['all', `All ${projects.length}`]] as [StatusFilter, string][])
                .concat(KANBAN_COLS.map(c => [c.status, `${STATUS_LABEL[c.status]} ${statusCounts[c.status]}`] as [StatusFilter, string]))
                .map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setStatusFilter(val)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      statusFilter === val ? 'bg-white/[0.08] text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
            </div>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as TypeFilter)}
              className="bg-[#131722] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-300 outline-none cursor-pointer flex-shrink-0"
            >
              <option value="all">All types</option>
              <option value="course">Course projects</option>
              <option value="independent">Independent</option>
            </select>

            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="bg-[#131722] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-300 outline-none cursor-pointer flex-shrink-0"
            >
              <option value="recent">Recently updated</option>
              <option value="progress">Most complete</option>
              <option value="title">A – Z</option>
            </select>
          </div>
        </div>
      )}

      {(techFilter || filtersActive) && (
        <div className="flex items-center gap-2 flex-wrap text-[11px] text-zinc-500">
          <span>Showing {visible.length} of {projects.length}</span>
          {techFilter && (
            <button
              onClick={() => setTechFilter(null)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-amber/10 text-accent-amber border border-accent-amber/25 font-mono cursor-pointer"
            >
              {techFilter} <X size={10} />
            </button>
          )}
          <button onClick={clearFilters} className="underline hover:text-zinc-300 cursor-pointer">
            Clear filters
          </button>
        </div>
      )}

      {/* Empty states */}
      {projects.length === 0 && (
        <Card hover={false} className="text-center py-16">
          <Rocket size={36} className="text-zinc-600 mx-auto mb-3" />
          <h3 className="font-semibold text-white text-base mb-1">No projects registered yet</h3>
          <p className="text-xs text-zinc-400 mb-5 max-w-sm mx-auto">
            Connect your course capstones and independent projects to track status and progress.
          </p>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => openCreate()}>
            Add First Project
          </Button>
        </Card>
      )}

      {projects.length > 0 && visible.length === 0 && (
        <Card hover={false} className="text-center py-12">
          <Layers size={28} className="text-zinc-600 mx-auto mb-3" />
          <h3 className="font-semibold text-white text-sm mb-1">Nothing matches those filters</h3>
          <p className="text-xs text-zinc-400 mb-4">Try a different search, or clear the filters.</p>
          <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>
        </Card>
      )}

      {/* Grid view */}
      {view === 'grid' && visible.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map(p => <ProjectCard key={p.id} {...cardProps(p)} />)}
        </div>
      )}

      {/* Kanban view — drag between columns on desktop, status dropdown everywhere */}
      {view === 'kanban' && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {KANBAN_COLS.map(col => {
            const colProjects = visible.filter(p => p.status === col.status);
            const isOver = dragOverCol === col.status;
            return (
              <div key={col.status} className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(col.status) }} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{col.label}</span>
                  </div>
                  <span className="text-xs font-mono text-zinc-500 font-medium">{colProjects.length}</span>
                </div>

                <div
                  onDragOver={(e) => { if (dragId) { e.preventDefault(); setDragOverCol(col.status); } }}
                  onDragLeave={() => setDragOverCol(prev => (prev === col.status ? null : prev))}
                  onDrop={(e) => {
                    e.preventDefault();
                    const p = projects.find(x => x.id === dragId);
                    if (p) handleStatus(p, col.status);
                    setDragId(null);
                    setDragOverCol(null);
                  }}
                  className={`flex flex-col gap-3 min-h-[220px] rounded-xl border p-2.5 transition-colors ${
                    isOver ? 'border-accent-amber/50 bg-accent-amber/[0.04]' : 'border-white/[0.06] bg-[#0A0D14]/80'
                  }`}
                >
                  {colProjects.map(p => (
                    <ProjectCard
                      key={p.id}
                      {...cardProps(p)}
                      draggable
                      onDragStart={setDragId}
                      onDragEnd={() => { setDragId(null); setDragOverCol(null); }}
                    />
                  ))}
                  {colProjects.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-xs text-zinc-600 text-center px-2">
                      {dragId ? 'Drop here' : 'Empty'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Roadmap view — dedicated exclusively for project milestones */}
      {view === 'roadmap' && projects.length > 0 && (
        <ProjectRoadmapView
          project={projects.find(p => p.id === selectedRoadmapProjectId) || projects[0]}
          allProjects={projects}
          onSelectProject={(p) => setSelectedRoadmapProjectId(p.id)}
          onBackToBoard={() => setView('grid')}
          onOpenInvite={(p) => setInviteModalProject(p)}
        />
      )}

      {/* Detail panel */}
      <SlideOver
        open={Boolean(detail)}
        onClose={() => setDetailId(null)}
        title={detail?.title}
        subtitle={detail ? `${STATUS_LABEL[detail.status]} · ${detail.completion_pct}% complete` : undefined}
        width="w-full sm:w-[28rem]"
      >
        {detail && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex bg-[#0D1017] p-1 rounded-xl border border-white/[0.08] gap-1">
              <button
                type="button"
                onClick={() => setDetailTab('overview')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                  detailTab === 'overview'
                    ? 'bg-accent-amber text-[#0D0F14] shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('milestones')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  detailTab === 'milestones'
                    ? 'bg-accent-amber text-[#0D0F14] shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Flag size={12} />
                Milestones
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('collaborators')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  detailTab === 'collaborators'
                    ? 'bg-accent-amber text-[#0D0F14] shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users size={12} />
                Collaborators
              </button>
            </div>

            {/* Tab: Overview */}
            {detailTab === 'overview' && (
              <div className="space-y-5 pt-1">
                {detail.description && (
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">{detail.description}</p>
                )}

                {/* Open project milestone roadmap button */}
                <button
                  onClick={() => {
                    setSelectedRoadmapProjectId(detail.id);
                    setView('roadmap');
                    setDetailId(null);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-accent-amber/15 hover:bg-accent-amber/25 border border-accent-amber/35 text-xs font-bold text-accent-amber transition-colors cursor-pointer shadow-sm"
                >
                  <span className="flex items-center gap-2"><Flag size={14} /> Open Project Milestone Roadmap</span>
                  <ArrowUpRight size={13} />
                </button>

                {/* Direct Invite button in SlideOver */}
                {!detail.isShared && (
                  <button
                    onClick={() => setInviteModalProject(detail)}
                    className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-xs font-semibold text-emerald-400 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2"><UserPlus size={14} /> Invite Collaborators (User ID / Username)</span>
                    <Plus size={13} />
                  </button>
                )}

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Status</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {KANBAN_COLS.map(c => (
                      <button
                        key={c.status}
                        onClick={() => handleStatus(detail, c.status)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                          detail.status === c.status
                            ? 'text-white'
                            : 'border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/[0.2]'
                        }`}
                        style={detail.status === c.status
                          ? { background: `${getStatusColor(c.status)}20`, borderColor: `${getStatusColor(c.status)}55` }
                          : undefined}
                      >
                        {STATUS_LABEL[c.status]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-zinc-500 font-medium">Completion</span>
                    <span className="font-mono text-zinc-300">{detail.completion_pct}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={detail.completion_pct}
                    onChange={e => handleCompletion(detail, Number(e.target.value))}
                    className="project-range w-full cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${getStatusColor(detail.status)} 0%, ${getStatusColor(detail.status)} ${detail.completion_pct}%, rgba(255,255,255,0.08) ${detail.completion_pct}%, rgba(255,255,255,0.08) 100%)`,
                    }}
                  />
                </div>

                {detail.tech_stack.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Stack</p>
                    <div className="flex flex-wrap gap-1">
                      {detail.tech_stack.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-white/[0.03] rounded text-[10px] font-mono text-zinc-400 border border-white/[0.06]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Linked</p>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => goToNotes(detail)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-xs text-zinc-300 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2"><StickyNote size={12} /> Notes</span>
                      <span className="font-mono text-zinc-500">{notesByProject.get(detail.id) ?? 0}</span>
                    </button>
                    <button
                      onClick={() => navigate('/courses?view=courses')}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-xs text-zinc-300 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2"><GraduationCap size={12} /> Course</span>
                      <span className="text-zinc-500 truncate max-w-[10rem]">
                        {detail.course_id ? courseTitleById.get(detail.course_id) ?? 'Unknown course' : 'Not linked'}
                      </span>
                    </button>
                  </div>
                </div>

                {(detail.github_url || detail.demo_url || detail.local_path) && (
                  <div className="space-y-1.5">
                    {detail.github_url && (
                      <a href={safeUrl(detail.github_url)} target="_blank" rel="noreferrer"
                         className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
                        Repository <ArrowUpRight size={12} />
                      </a>
                    )}
                    {detail.demo_url && (
                      <a href={safeUrl(detail.demo_url)} target="_blank" rel="noreferrer"
                         className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
                        Live demo <ArrowUpRight size={12} />
                      </a>
                    )}
                    {detail.local_path && (
                      <p className="text-[11px] font-mono text-zinc-500 break-all">{detail.local_path}</p>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-zinc-600">
                  Created {formatDate(detail.created_at)} · Updated {formatDate(detail.updated_at)}
                </p>

                {(!detail.isShared && detail.user_id === user?.id) && (
                  <div className="flex gap-2 pt-1">
                    <Button variant="secondary" size="sm" icon={<Pencil size={13} />} onClick={() => { setDetailId(null); openEdit(detail); }}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => setConfirmDelete(detail)}>
                      Delete
                    </Button>
                  </div>
                )}
                {detail.isShared && (
                  <div className="flex gap-2 pt-1">
                    <Button variant="danger" size="sm" icon={<LogOut size={13} />} onClick={() => setConfirmLeave(detail)}>
                      Leave Project
                    </Button>
                  </div>
                )}
              </div>
            )}


            {/* Tab: Milestones */}
            {detailTab === 'milestones' && (
              <div className="pt-1">
                <MilestonesPanel
                  projectId={detail.id}
                  isOwner={!detail.isShared && detail.user_id === user?.id}
                />
              </div>
            )}

            {/* Tab: Collaborators */}
            {detailTab === 'collaborators' && (
              <div className="pt-1">
                <InvitePanel
                  projectId={detail.id}
                  isOwner={!detail.isShared && detail.user_id === user?.id}
                />
              </div>
            )}
          </div>
        )}
      </SlideOver>

      {/* Create / edit modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingId(null); }}
        title={editingId ? 'Edit Project' : 'Register Project'}
        width="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{modalError}</span>
            </div>
          )}
          <Field label="Project Title *">

            <input
              className={inputCls}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Sales Funnel Analytics Dashboard"
              required
            />
          </Field>

          <Field label="Description">
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Key objectives, dataset used, and outcomes..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select
                className={inputCls}
                value={form.type}
                onChange={e => {
                  const type = e.target.value as ProjectType;
                  setForm(f => ({ ...f, type, course_id: type === 'independent' ? '' : f.course_id }));
                }}
              >
                <option value="independent">Independent Project</option>
                <option value="course">Course Project</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                className={inputCls}
                value={form.status}
                onChange={e => {
                  const status = e.target.value as ProjectStatus;
                  setForm(f => ({
                    ...f,
                    status,
                    completion_pct: status === 'completed' || status === 'deployed' ? 100 : f.completion_pct,
                  }));
                }}
              >
                <option value="idea">Idea / Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="deployed">Shipped / Live</option>
              </select>
            </Field>
          </div>

          <Field label="Linked Course (optional)">
            <select
              className={inputCls}
              value={form.course_id}
              onChange={e => {
                const course_id = e.target.value;
                setForm(f => ({ ...f, course_id, type: course_id ? 'course' : f.type }));
              }}
            >
              <option value="">No course — standalone</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            {courses.length === 0 && (
              <p className="text-[10px] text-zinc-500 mt-1">
                No courses enrolled yet — add one from the Courses page to link a capstone here.
              </p>
            )}
          </Field>

          <Field label={`Completion — ${form.completion_pct}%`}>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={form.completion_pct}
              disabled={form.status === 'completed' || form.status === 'deployed'}
              onChange={e => {
                const pct = Number(e.target.value);
                setForm(f => ({
                  ...f,
                  completion_pct: pct,
                  status: pct === 100 ? 'completed' : pct > 0 && f.status === 'idea' ? 'in_progress' : f.status,
                }));
              }}
              className="project-range w-full cursor-pointer disabled:opacity-50"
            />
            {(form.status === 'completed' || form.status === 'deployed') && (
              <p className="text-[10px] text-zinc-500 mt-1">Completed and shipped projects are always 100%.</p>
            )}
          </Field>

          <Field label="Tech Stack (comma-separated)">
            <input
              className={inputCls}
              value={form.tech_stack_raw}
              onChange={e => setForm(f => ({ ...f, tech_stack_raw: e.target.value }))}
              placeholder="Python, Pandas, SQL, Streamlit"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Repository URL">
              <input
                className={inputCls}
                value={form.github_url}
                onChange={e => setForm(f => ({ ...f, github_url: e.target.value }))}
                placeholder="https://github.com/..."
              />
            </Field>
            <Field label="Live Demo URL">
              <input
                className={inputCls}
                value={form.demo_url}
                onChange={e => setForm(f => ({ ...f, demo_url: e.target.value }))}
                placeholder="https://..."
              />
            </Field>
          </div>

          <Field label="Local Directory Path">
            <input
              className={`${inputCls} font-mono text-xs`}
              value={form.local_path}
              onChange={e => setForm(f => ({ ...f, local_path: e.target.value }))}
              placeholder="D:\Projects\sales-funnel"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => { setShowModal(false); setEditingId(null); }}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={saving}>
              {editingId ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)} title="Delete project" width="max-w-sm">
        {confirmDelete && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-300">
              Delete <span className="font-semibold text-white">{confirmDelete.title}</span>? This can&apos;t be undone.
            </p>
            {(notesByProject.get(confirmDelete.id) ?? 0) > 0 && (
              <p className="text-xs text-zinc-400">
                {notesByProject.get(confirmDelete.id)} linked note(s) will be kept and unlinked, not deleted.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={() => handleDelete(confirmDelete)}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Leave project confirmation */}
      <Modal open={Boolean(confirmLeave)} onClose={() => setConfirmLeave(null)} title="Leave Project" width="max-w-sm">
        {confirmLeave && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-300">
              Are you sure you want to withdraw from <span className="font-semibold text-white">{confirmLeave.title}</span>?
            </p>
            <p className="text-xs text-zinc-400">
              You will lose access to this shared project and its roadmap. The owner can invite you again if needed.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmLeave(null)}>Cancel</Button>
              <Button variant="danger" size="sm" icon={<LogOut size={13} />} loading={leaving} onClick={() => handleLeave(confirmLeave)}>
                Leave Project
              </Button>
            </div>
          </div>
        )}
      </Modal>


      {/* Invite Collaborator Modal */}
      <InviteModal
        project={inviteModalProject}
        isOpen={Boolean(inviteModalProject)}
        onClose={() => setInviteModalProject(null)}
        isOwner={Boolean(inviteModalProject && !inviteModalProject.isShared && (inviteModalProject.user_id === user?.id || !inviteModalProject.user_id))}
      />

    </div>
  );
};
