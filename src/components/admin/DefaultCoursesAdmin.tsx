import React, { useState, useMemo } from 'react';
import {
  BookOpen, Plus, Code, Layers, Trash2, Edit3, Search, Route
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useRoadmapStore } from '../../store/roadmapStore';
import { useUIStore } from '../../store/uiStore';
import type { RoadmapTemplate } from '../../data/roadmapTemplates';
import { CourseJsonEditorModal } from './CourseJsonEditorModal';
import { MilestoneManagerModal } from './MilestoneManagerModal';

const CATEGORIES = [
  { id: 'all', label: 'All Curriculums' },
  { id: 'development', label: 'Development' },
  { id: 'ai_data', label: 'AI & Data' },
  { id: 'devops_security', label: 'DevOps & Security' },
  { id: 'architecture_design', label: 'Architecture & Design' },
  { id: 'product_management', label: 'Product & Mgmt' },
  { id: 'custom', label: 'Custom Roadmaps' },
] as const;

export const DefaultCoursesAdmin: React.FC = () => {
  const dbTemplates = useRoadmapStore(s => s.dbTemplates);
  const customTemplates = useRoadmapStore(s => s.customTemplates);
  const deletedTemplateIds = useRoadmapStore(s => s.deletedTemplateIds);
  const getAllTemplates = useRoadmapStore(s => s.getAllTemplates);
  const adminSaveTemplate = useRoadmapStore(s => s.adminSaveTemplate);
  const adminDeleteTemplate = useRoadmapStore(s => s.adminDeleteTemplate);
  const showToast = useUIStore(s => s.showToast);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [jsonEditingTemplate, setJsonEditingTemplate] = useState<RoadmapTemplate | null>(null);
  const [milestoneEditingTemplate, setMilestoneEditingTemplate] = useState<RoadmapTemplate | null>(null);
  const [infoEditingTemplate, setInfoEditingTemplate] = useState<RoadmapTemplate | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [templateForm, setTemplateForm] = useState<Partial<RoadmapTemplate>>({});

  const templatesList = useMemo(() => {
    return Object.values(getAllTemplates());
  }, [dbTemplates, customTemplates, deletedTemplateIds, getAllTemplates]);

  const filteredTemplates = useMemo(() => {
    return templatesList.filter(t => {
      const matchCat = selectedCategory === 'all' || t.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [templatesList, selectedCategory, searchQuery]);

  const handleOpenCreate = () => {
    setTemplateForm({
      id: '',
      name: '',
      category: 'development',
      icon: 'Route',
      badge: 'Comprehensive',
      description: '',
      roadmapUrl: '',
      nodes: [
        {
          id: 'step_1',
          label: 'Module 1: Getting Started',
          phase: 'Phase 1: Foundations',
          status: 'not_started',
          description: 'Core concepts and introduction',
        },
      ],
      edges: [],
    });
    setIsCreatingNew(true);
  };

  const handleOpenImportJson = () => {
    setJsonEditingTemplate({
      id: '',
      name: 'New Default Course',
      category: 'development',
      icon: 'Route',
      badge: 'Comprehensive',
      description: '',
      roadmapUrl: '',
      nodes: [],
      edges: [],
    });
  };

  const handleSaveInfoForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.id?.trim() || !templateForm.name?.trim()) {
      showToast('error', 'Course ID (slug) and Title are required.');
      return;
    }

    const tpl: RoadmapTemplate = {
      id: templateForm.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_'),
      name: templateForm.name.trim(),
      category: templateForm.category || 'development',
      icon: templateForm.icon || 'Route',
      badge: templateForm.badge || 'Curriculum',
      description: templateForm.description || '',
      roadmapUrl: templateForm.roadmapUrl || '',
      nodes: templateForm.nodes || [],
      edges: templateForm.edges || [],
    };

    const res = await adminSaveTemplate(tpl);
    if (res.success) {
      showToast('success', `Default course "${tpl.name}" saved successfully.`);
      setIsCreatingNew(false);
      setInfoEditingTemplate(null);
    } else {
      showToast('error', res.error || 'Failed to save course.');
    }
  };

  const handleDelete = async (tpl: RoadmapTemplate) => {
    if (!window.confirm(`Are you sure you want to delete default course "${tpl.name}" (${tpl.id})?`)) {
      return;
    }
    const res = await adminDeleteTemplate(tpl.id);
    if (res.success) {
      showToast('success', `Default course "${tpl.name}" removed.`);
    } else {
      showToast('error', res.error || 'Failed to delete template.');
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Header & Primary Action ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0D1017] border border-white/[0.08]">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Route size={18} className="text-accent-amber" />
            Default Courses & Roadmap Templates
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Manage system-wide curriculum templates. You can edit the full Course JSON structure, configure milestones and phases, or create new default roadmaps for all users.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            icon={<Code size={14} className="text-accent-amber" />}
            onClick={handleOpenImportJson}
          >
            Import from JSON
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={handleOpenCreate}
          >
            Add Default Course
          </Button>
        </div>
      </div>

      {/* ── Category Filter Pills & Search ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/40 font-semibold'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search default courses..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[#0D1017] border border-white/[0.1] text-white placeholder-zinc-500 outline-none focus:border-accent-amber/50"
          />
        </div>
      </div>

      {/* ── Course Cards Grid with Refined Scaling & Typography ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3.5">
        {filteredTemplates.map(tpl => {
          const phasesCount = new Set(tpl.nodes?.map(n => n.phase || 'General')).size;
          const topicsCount = tpl.nodes?.length || 0;

          return (
            <div
              key={tpl.id}
              className="p-4 rounded-xl bg-[#0D1017] border border-white/[0.08] hover:border-white/[0.16] transition-all flex flex-col justify-between gap-3.5 group shadow-sm"
            >
              <div className="space-y-2.5">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-2 rounded-lg bg-accent-amber/10 border border-accent-amber/20 text-accent-amber flex-shrink-0">
                      <BookOpen size={16} />
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white group-hover:text-accent-amber transition-colors truncate">
                        {tpl.name}
                      </h4>
                      <span className="text-[10px] text-zinc-500 font-mono block truncate">slug: {tpl.id}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/[0.06] text-zinc-300 border border-white/[0.08] flex-shrink-0 max-w-[130px] truncate">
                    {tpl.badge || tpl.category}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed min-h-[2rem]">
                  {tpl.description || 'Comprehensive roadmap curriculum with sequenced milestones and learning topics.'}
                </p>

                {/* Metrics */}
                <div className="flex items-center gap-2.5 pt-2 text-[11px] text-zinc-400 border-t border-white/[0.04]">
                  <span><strong className="text-zinc-200">{phasesCount}</strong> milestones</span>
                  <span>·</span>
                  <span><strong className="text-zinc-200">{topicsCount}</strong> topics</span>
                  <span>·</span>
                  <span className="capitalize">{tpl.category.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Edit JSON */}
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Code size={12} className="text-accent-amber" />}
                    onClick={() => setJsonEditingTemplate(tpl)}
                    title="Edit Full Course JSON"
                  >
                    Edit JSON
                  </Button>

                  {/* Manage Milestones */}
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Layers size={12} className="text-blue-400" />}
                    onClick={() => setMilestoneEditingTemplate(tpl)}
                    title="Manage Milestones & Phases"
                  >
                    Milestones
                  </Button>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateForm({ ...tpl });
                      setInfoEditingTemplate(tpl);
                    }}
                    title="Edit Metadata (Name, Category, Description)"
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(tpl)}
                    title="Delete Default Course"
                    className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-16 bg-[#0D1017] rounded-xl border border-white/[0.08]">
          <BookOpen size={28} className="mx-auto text-zinc-600 mb-2" />
          <p className="text-sm font-semibold text-zinc-300">No default courses found</p>
          <p className="text-xs text-zinc-500 mt-1">Try selecting another domain or clearing your search query.</p>
        </div>
      )}

      {/* ── JSON Editor Modal for Default Courses ─────────────────────────── */}
      {jsonEditingTemplate && (
        <CourseJsonEditorModal
          open={Boolean(jsonEditingTemplate)}
          onClose={() => setJsonEditingTemplate(null)}
          title={jsonEditingTemplate.id ? `Edit JSON: ${jsonEditingTemplate.name}` : 'Create / Import Default Course from JSON'}
          subtitle={
            jsonEditingTemplate.id
              ? `Direct JSON editing for default course "${jsonEditingTemplate.id}". Updating here syncs immediately to Supabase and is available to all users.`
              : 'Paste any Course JSON or Roadmap Template JSON below. Topics and metadata will be automatically detected and normalized.'
          }
          initialJson={jsonEditingTemplate}
          schemaType="default_template"
          onSave={async (parsedJson) => {
            const res = await adminSaveTemplate(parsedJson);
            if (res.success) {
              setJsonEditingTemplate(null);
            }
            return res;
          }}
        />
      )}

      {/* ── Milestone Manager Modal ────────────────────────────────────────── */}
      {milestoneEditingTemplate && (
        <MilestoneManagerModal
          open={Boolean(milestoneEditingTemplate)}
          onClose={() => setMilestoneEditingTemplate(null)}
          courseTitle={milestoneEditingTemplate.name}
          initialNodes={milestoneEditingTemplate.nodes || []}
          onSave={async (updatedNodes) => {
            const updatedTpl: RoadmapTemplate = {
              ...milestoneEditingTemplate,
              nodes: updatedNodes,
            };
            return await adminSaveTemplate(updatedTpl);
          }}
        />
      )}

      {/* ── Edit Metadata / Create Modal ───────────────────────────────────── */}
      {(isCreatingNew || infoEditingTemplate) && (
        <Modal
          open={isCreatingNew || Boolean(infoEditingTemplate)}
          onClose={() => {
            setIsCreatingNew(false);
            setInfoEditingTemplate(null);
          }}
          title={isCreatingNew ? 'Add Default Course' : `Edit: ${infoEditingTemplate?.name}`}
          width="max-w-lg"
        >
          <form onSubmit={handleSaveInfoForm} className="space-y-3.5">
            {isCreatingNew && (
              <div className="p-2.5 rounded-lg bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-between gap-2">
                <span className="text-xs text-amber-200">Have a complete course JSON ready?</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    handleOpenImportJson();
                  }}
                  className="text-xs font-semibold text-accent-amber hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Code size={13} /> Switch to JSON Editor
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Course Slug ID</label>
              <input
                type="text"
                disabled={Boolean(infoEditingTemplate)}
                placeholder="e.g. machine_learning_engineer"
                value={templateForm.id || ''}
                onChange={e => setTemplateForm(f => ({ ...f, id: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-[#0D1017] border border-white/[0.1] text-white outline-none focus:border-accent-amber/50 disabled:opacity-50"
                required
              />
              <span className="text-[10px] text-zinc-500 mt-0.5 block">Unique identifier for URLs and enrollment.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Course Title</label>
              <input
                type="text"
                placeholder="e.g. Machine Learning Engineer"
                value={templateForm.name || ''}
                onChange={e => setTemplateForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-[#0D1017] border border-white/[0.1] text-white outline-none focus:border-accent-amber/50"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Domain Category</label>
                <select
                  value={templateForm.category || 'development'}
                  onChange={e => setTemplateForm(f => ({ ...f, category: e.target.value as any }))}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-[#0D1017] border border-white/[0.1] text-white outline-none"
                >
                  <option value="development">Development</option>
                  <option value="ai_data">AI & Data</option>
                  <option value="devops_security">DevOps & Security</option>
                  <option value="architecture_design">Architecture & Design</option>
                  <option value="product_management">Product & Management</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Badge</label>
                <input
                  type="text"
                  placeholder="e.g. Beginner to Pro"
                  value={templateForm.badge || ''}
                  onChange={e => setTemplateForm(f => ({ ...f, badge: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-[#0D1017] border border-white/[0.1] text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Course curriculum summary..."
                value={templateForm.description || ''}
                onChange={e => setTemplateForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-[#0D1017] border border-white/[0.1] text-white outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  setInfoEditingTemplate(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit">
                {isCreatingNew ? 'Create Course' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
