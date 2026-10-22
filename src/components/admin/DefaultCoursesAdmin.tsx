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
  { id: 'all', label: 'All Domains' },
  { id: 'development', label: 'Development' },
  { id: 'ai_data', label: 'AI & Data' },
  { id: 'devops_security', label: 'DevOps & Security' },
  { id: 'architecture_design', label: 'Architecture & Design' },
  { id: 'product_management', label: 'Product & Mgmt' },
  { id: 'custom', label: 'Custom' },
] as const;

export const DefaultCoursesAdmin: React.FC = () => {
  const { getAllTemplates, adminSaveTemplate, adminDeleteTemplate } = useRoadmapStore();
  const showToast = useUIStore(s => s.showToast);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [jsonEditingTemplate, setJsonEditingTemplate] = useState<RoadmapTemplate | null>(null);
  const [milestoneEditingTemplate, setMilestoneEditingTemplate] = useState<RoadmapTemplate | null>(null);
  const [infoEditingTemplate, setInfoEditingTemplate] = useState<RoadmapTemplate | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [templateForm, setTemplateForm] = useState<Partial<RoadmapTemplate>>({});

  const allTemplatesMap = getAllTemplates();
  const templatesList = useMemo(() => Object.values(allTemplatesMap), [allTemplatesMap]);

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
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0D1017] border border-white/[0.08]">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Route size={18} className="text-accent-amber" />
            Default Courses & Roadmap Templates
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Admin full control over system curriculums. You can edit the full Course JSON, manage milestones & topics, or add new default courses available to all users.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
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

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/40'
                  : 'bg-white/[0.03] text-zinc-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search default courses..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[#0D1017] border border-white/[0.1] text-white placeholder-zinc-500 outline-none focus:border-accent-amber/50"
          />
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredTemplates.map(tpl => {
          const phasesCount = new Set(tpl.nodes?.map(n => n.phase || 'General')).size;
          const topicsCount = tpl.nodes?.length || 0;

          return (
            <div
              key={tpl.id}
              className="p-4 rounded-xl bg-[#0D1017] border border-white/[0.08] hover:border-white/[0.15] transition-all flex flex-col justify-between gap-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-accent-amber/10 border border-accent-amber/20 text-accent-amber">
                      <BookOpen size={16} />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-accent-amber transition-colors">
                        {tpl.name}
                      </h4>
                      <span className="text-[10px] text-zinc-500 font-mono">id: {tpl.id}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                    {tpl.badge || tpl.category}
                  </span>
                </div>

                {tpl.description && (
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-2 text-[11px] text-zinc-400 border-t border-white/[0.04]">
                  <span><strong>{phasesCount}</strong> milestones</span>
                  <span>·</span>
                  <span><strong>{topicsCount}</strong> topics</span>
                  <span>·</span>
                  <span className="capitalize">{tpl.category.replace('_', ' ')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-1">
                  {/* Edit JSON */}
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Code size={12} className="text-accent-amber" />}
                    onClick={() => setJsonEditingTemplate(tpl)}
                    title="Edit Raw Course JSON"
                  >
                    Edit JSON
                  </Button>

                  {/* Manage Milestones */}
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Layers size={12} className="text-blue-400" />}
                    onClick={() => setMilestoneEditingTemplate(tpl)}
                    title="Manage Milestones & Topics"
                  >
                    Milestones
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateForm({ ...tpl });
                      setInfoEditingTemplate(tpl);
                    }}
                    title="Edit Metadata"
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
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
          <p className="text-xs text-zinc-500 mt-1">Try adjusting your category filter or search query.</p>
        </div>
      )}

      {/* ── JSON Editor Modal for Default Courses ─────────────────────────── */}
      {jsonEditingTemplate && (
        <CourseJsonEditorModal
          open={Boolean(jsonEditingTemplate)}
          onClose={() => setJsonEditingTemplate(null)}
          title={`Edit JSON: ${jsonEditingTemplate.name}`}
          subtitle={`Editing default course template "${jsonEditingTemplate.id}". Any edits saved will sync to Supabase and immediately reflect for all users.`}
          initialJson={jsonEditingTemplate}
          schemaType="default_template"
          onSave={async (parsedJson) => {
            return await adminSaveTemplate(parsedJson);
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
