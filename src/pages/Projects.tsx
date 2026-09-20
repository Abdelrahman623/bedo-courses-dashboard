import React, { useState, useEffect } from 'react';
import {
  Grid3X3, Columns, Plus,
  FolderOpen, Trash2, Rocket, ArrowUpRight
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useProjectsStore } from '../store/projectsStore';
import { safeUrl } from '../lib/utils';
import type { ProjectStatus, ProjectType } from '../types';

const KANBAN_COLS: { status: ProjectStatus; label: string; dotColor: string }[] = [
  { status: 'idea',        label: 'Backlog / Ideas', dotColor: '#71717A' },
  { status: 'in_progress', label: 'In Progress',     dotColor: '#F0A500' },
  { status: 'completed',   label: 'Completed',       dotColor: '#00C896' },
  { status: 'deployed',    label: 'Shipped / Live',  dotColor: '#4FC3F7' },
];

const EMPTY_FORM = {
  title: '', description: '', type: 'independent' as ProjectType,
  status: 'idea' as ProjectStatus, tech_stack_raw: '',
  github_url: '', demo_url: '', local_path: '', completion_pct: 0,
};

export const Projects: React.FC = () => {
  const { projects, view, setView, fetchProjects, addProject, deleteProject } = useProjectsStore();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await addProject({
      user_id: 'local',
      title: form.title,
      description: form.description,
      type: form.type,
      status: form.status,
      tech_stack: form.tech_stack_raw.split(',').map(t => t.trim()).filter(Boolean),
      github_url: form.github_url || undefined,
      demo_url: form.demo_url || undefined,
      local_path: form.local_path || undefined,
      completion_pct: form.completion_pct,
      course_id: undefined,
    });
    setSaving(false);
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  const ProjectCard: React.FC<{ project: typeof projects[0] }> = ({ project }) => (
    <div className="bg-[#131722] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-4 flex flex-col gap-3 transition-all duration-150 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm tracking-tight truncate group-hover:text-accent-amber transition-colors">
            {project.title}
          </h3>
          {project.description && (
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>
        <button
          onClick={() => deleteProject(project.id)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer"
          title="Delete project"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge status={project.status} size="sm" />
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
          {project.type === 'course' ? 'Course Track' : 'Independent'}
        </span>
      </div>

      {/* Tech stack */}
      {project.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.tech_stack.map(t => (
            <span
              key={t}
              className="px-2 py-0.5 bg-white/[0.03] rounded text-[10px] font-mono text-zinc-400 border border-white/[0.06]"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="pt-1">
        <div className="flex justify-between text-[11px] mb-1">
          <span className="text-zinc-500 font-medium">Completion</span>
          <span className="font-mono text-zinc-300 font-medium">{project.completion_pct}%</span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-amber rounded-full transition-all duration-500"
            style={{ width: `${project.completion_pct}%` }}
          />
        </div>
      </div>

      {/* Links Footer */}
      <div className="flex items-center gap-3 pt-2 mt-auto">
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
        {project.local_path && (
          <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 truncate" title={project.local_path}>
            <FolderOpen size={11} /> {project.local_path.split(/[/\\]/).pop()}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Projects & Portfolio</h1>
          <p className="text-xs text-zinc-400 mt-1">
            {projects.length} total projects · {projects.filter(p => p.status === 'in_progress').length} currently in flight
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-[#131722] rounded-lg border border-white/[0.08] p-0.5 gap-0.5">
            <button
              onClick={() => setView('grid')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                view === 'grid'
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Grid View"
            >
              <Grid3X3 size={14} />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                view === 'kanban'
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Kanban Board"
            >
              <Columns size={14} />
            </button>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setShowModal(true)}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <Card hover={false} className="text-center py-16">
          <Rocket size={36} className="text-zinc-600 mx-auto mb-3" />
          <h3 className="font-semibold text-white text-base mb-1">No projects registered yet</h3>
          <p className="text-xs text-zinc-400 mb-5 max-w-sm mx-auto">
            Connect your course capstones and independent projects to track status and progress.
          </p>
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowModal(true)}>
            Add First Project
          </Button>
        </Card>
      )}

      {/* Grid View */}
      {view === 'grid' && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {KANBAN_COLS.map(col => {
            const colProjects = projects.filter(p => p.status === col.status);
            return (
              <div key={col.status} className="flex flex-col gap-2.5">
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.dotColor }} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      {col.label}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-zinc-500 font-medium">
                    {colProjects.length}
                  </span>
                </div>

                {/* Column Content */}
                <div className="flex flex-col gap-3 min-h-[220px] bg-[#0A0D14]/80 rounded-xl border border-white/[0.06] p-2.5">
                  {colProjects.map(p => (
                    <ProjectCard key={p.id} project={p} />
                  ))}
                  {colProjects.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-xs text-zinc-600">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Project Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Register Project" width="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Project Title *</label>
            <input
              className="w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Sales Funnel Analytics Dashboard"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea
              className="w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors resize-none"
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Key objectives, dataset used, and outcomes..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Type</label>
              <select
                className="w-full bg-[#0D1017] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as ProjectType }))}
              >
                <option value="independent">Independent Project</option>
                <option value="course">Course Project</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Status</label>
              <select
                className="w-full bg-[#0D1017] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))}
              >
                <option value="idea">Idea / Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="deployed">Shipped / Live</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Tech Stack (comma-separated)</label>
            <input
              className="w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors"
              value={form.tech_stack_raw}
              onChange={e => setForm(f => ({ ...f, tech_stack_raw: e.target.value }))}
              placeholder="Python, Pandas, SQL, Streamlit"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Repository URL</label>
              <input
                className="w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors"
                value={form.github_url}
                onChange={e => setForm(f => ({ ...f, github_url: e.target.value }))}
                placeholder="https://github.com/..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Live Demo URL</label>
              <input
                className="w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors"
                value={form.demo_url}
                onChange={e => setForm(f => ({ ...f, demo_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Local Directory Path</label>
            <input
              className="w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors font-mono text-xs"
              value={form.local_path}
              onChange={e => setForm(f => ({ ...f, local_path: e.target.value }))}
              placeholder="D:\Projects\sales-funnel"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" loading={saving}>Create Project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
