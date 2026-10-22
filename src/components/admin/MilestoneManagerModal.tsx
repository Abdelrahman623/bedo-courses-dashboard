import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Layers, Plus, Trash2, Edit3, Check, X, ChevronDown, ChevronRight,
  CheckCircle2, Clock, Circle, Loader2
} from 'lucide-react';
import type { RoadmapNode, TopicStatus } from '../../types';
import { useUIStore } from '../../store/uiStore';

interface MilestoneManagerModalProps {
  open: boolean;
  onClose: () => void;
  courseTitle: string;
  initialNodes: RoadmapNode[];
  onSave: (updatedNodes: RoadmapNode[]) => Promise<{ success: boolean; error?: string }>;
}

export const MilestoneManagerModal: React.FC<MilestoneManagerModalProps> = ({
  open,
  onClose,
  courseTitle,
  initialNodes,
  onSave,
}) => {
  const showToast = useUIStore(s => s.showToast);
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  const [editingPhase, setEditingPhase] = useState<{ oldName: string; newName: string } | null>(null);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [nodeEditForm, setNodeEditForm] = useState<Partial<RoadmapNode>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNodes(initialNodes.map(n => ({ ...n })));
      setCollapsedPhases({});
      setEditingPhase(null);
      setEditingNodeId(null);
      setShowAddPhase(false);
    }
  }, [open, initialNodes]);

  // Group nodes by phase
  const phases = useMemo(() => {
    const map = new Map<string, RoadmapNode[]>();
    nodes.forEach(n => {
      const p = n.phase || 'General Curriculum';
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(n);
    });
    return Array.from(map.entries());
  }, [nodes]);

  const toggleCollapse = (phase: string) => {
    setCollapsedPhases(prev => ({ ...prev, [phase]: !prev[phase] }));
  };

  const handleAddPhase = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPhaseName.trim();
    if (!trimmed) return;
    if (phases.some(([p]) => p.toLowerCase() === trimmed.toLowerCase())) {
      showToast('error', 'A milestone with this name already exists.');
      return;
    }
    // Add a placeholder node in this phase
    const newNode: RoadmapNode = {
      id: `topic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label: 'Getting Started with ' + trimmed,
      phase: trimmed,
      status: 'not_started',
      description: 'Initial topic for ' + trimmed,
    };
    setNodes(prev => [...prev, newNode]);
    setNewPhaseName('');
    setShowAddPhase(false);
    showToast('success', `Milestone "${trimmed}" created.`);
  };

  const handleRenamePhase = () => {
    if (!editingPhase || !editingPhase.newName.trim()) return;
    const { oldName, newName } = editingPhase;
    setNodes(prev =>
      prev.map(n => (n.phase === oldName ? { ...n, phase: newName.trim() } : n))
    );
    setEditingPhase(null);
    showToast('info', `Milestone renamed to "${newName.trim()}".`);
  };

  const handleDeletePhase = (phaseName: string) => {
    if (!window.confirm(`Delete milestone "${phaseName}" and all of its ${nodes.filter(n => n.phase === phaseName).length} topics?`)) {
      return;
    }
    setNodes(prev => prev.filter(n => n.phase !== phaseName));
    showToast('info', `Milestone "${phaseName}" removed.`);
  };

  const handleAddTopicToPhase = (phase: string) => {
    const id = `topic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newNode: RoadmapNode = {
      id,
      label: 'New Topic',
      phase,
      status: 'not_started',
      description: '',
    };
    setNodes(prev => [...prev, newNode]);
    setEditingNodeId(id);
    setNodeEditForm(newNode);
  };

  const handleDeleteTopic = (id: string, label: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    if (editingNodeId === id) setEditingNodeId(null);
    showToast('info', `Topic "${label}" deleted.`);
  };

  const handleStartEditNode = (node: RoadmapNode) => {
    setEditingNodeId(node.id);
    setNodeEditForm({ ...node });
  };

  const handleSaveNodeEdit = () => {
    if (!editingNodeId) return;
    setNodes(prev =>
      prev.map(n => (n.id === editingNodeId ? { ...n, ...nodeEditForm } as RoadmapNode : n))
    );
    setEditingNodeId(null);
    setNodeEditForm({});
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await onSave(nodes);
      if (res.success) {
        showToast('success', 'Milestones and topics successfully saved to database.');
        onClose();
      } else {
        showToast('error', res.error || 'Failed to save milestones.');
      }
    } catch (err: any) {
      showToast('error', 'Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Milestones & Topics: ${courseTitle}`} width="max-w-4xl">
      <div className="space-y-4">
        {/* Top summary & actions */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-300 font-medium">
              <strong className="text-white">{phases.length}</strong> Milestones · <strong className="text-white">{nodes.length}</strong> Topics
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={13} className="text-accent-amber" />}
            onClick={() => setShowAddPhase(true)}
          >
            Add New Milestone / Phase
          </Button>
        </div>

        {/* Add Phase Form */}
        {showAddPhase && (
          <form onSubmit={handleAddPhase} className="p-3 bg-accent-amber/5 border border-accent-amber/30 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-accent-amber">New Milestone / Phase Title</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="e.g. Phase 4: Advanced Systems"
                value={newPhaseName}
                onChange={e => setNewPhaseName(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-[#0A0D14] border border-white/[0.1] text-white outline-none focus:border-accent-amber/50"
              />
              <Button variant="primary" size="sm" type="submit">Create</Button>
              <Button variant="secondary" size="sm" type="button" onClick={() => setShowAddPhase(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {/* Milestone Groups */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {phases.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              No milestones found. Click "Add New Milestone / Phase" to begin building.
            </div>
          ) : (
            phases.map(([phaseName, phaseNodes]) => {
              const isCollapsed = collapsedPhases[phaseName];
              const isEditing = editingPhase?.oldName === phaseName;

              return (
                <div key={phaseName} className="rounded-xl border border-white/[0.08] bg-[#0A0D14] overflow-hidden">
                  {/* Phase Header */}
                  <div className="flex items-center justify-between p-3 bg-white/[0.02] border-b border-white/[0.06] gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleCollapse(phaseName)}
                        className="text-zinc-400 hover:text-white p-0.5 rounded cursor-pointer"
                      >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1 max-w-md">
                          <input
                            type="text"
                            value={editingPhase.newName}
                            onChange={e => setEditingPhase(prev => ({ ...prev!, newName: e.target.value }))}
                            className="flex-1 px-2 py-0.5 rounded text-xs bg-black/50 border border-accent-amber/50 text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleRenamePhase}
                            className="p-1 rounded bg-accent-amber/20 text-accent-amber hover:bg-accent-amber/30"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPhase(null)}
                            className="p-1 rounded bg-white/[0.08] text-zinc-400 hover:text-white"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <Layers size={14} className="text-accent-amber flex-shrink-0" />
                          <span className="text-xs font-bold text-white truncate">{phaseName}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-400">
                            {phaseNodes.length} topic{phaseNodes.length === 1 ? '' : 's'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => setEditingPhase({ oldName: phaseName, newName: phaseName })}
                          title="Rename Milestone"
                          className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/[0.06] transition-colors"
                        >
                          <Edit3 size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAddTopicToPhase(phaseName)}
                        title="Add Topic to this Milestone"
                        className="p-1 text-accent-amber hover:text-accent-amber/80 rounded hover:bg-accent-amber/10 transition-colors"
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePhase(phaseName)}
                        title="Delete Milestone"
                        className="p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Phase Topics List */}
                  {!isCollapsed && (
                    <div className="p-2 space-y-1.5">
                      {phaseNodes.map(node => {
                        const isNodeEditing = editingNodeId === node.id;

                        if (isNodeEditing) {
                          return (
                            <div key={node.id} className="p-3 bg-white/[0.04] border border-accent-amber/40 rounded-lg space-y-2.5">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] text-zinc-400 mb-1">Topic Title</label>
                                  <input
                                    type="text"
                                    value={nodeEditForm.label || ''}
                                    onChange={e => setNodeEditForm(f => ({ ...f, label: e.target.value }))}
                                    className="w-full px-2.5 py-1 rounded text-xs bg-[#0D1017] border border-white/[0.1] text-white outline-none focus:border-accent-amber"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-zinc-400 mb-1">Status</label>
                                  <select
                                    value={nodeEditForm.status || 'not_started'}
                                    onChange={e => setNodeEditForm(f => ({ ...f, status: e.target.value as TopicStatus }))}
                                    className="w-full px-2.5 py-1 rounded text-xs bg-[#0D1017] border border-white/[0.1] text-white outline-none"
                                  >
                                    <option value="not_started">Not Started</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] text-zinc-400 mb-1">Description / Notes</label>
                                <textarea
                                  rows={2}
                                  value={nodeEditForm.description || ''}
                                  onChange={e => setNodeEditForm(f => ({ ...f, description: e.target.value }))}
                                  className="w-full px-2.5 py-1 rounded text-xs bg-[#0D1017] border border-white/[0.1] text-white outline-none resize-none"
                                  placeholder="Topic summary..."
                                />
                              </div>

                              <div className="flex items-center justify-end gap-1.5">
                                <Button variant="secondary" size="sm" onClick={() => setEditingNodeId(null)}>Cancel</Button>
                                <Button variant="primary" size="sm" onClick={handleSaveNodeEdit}>Done</Button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={node.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] transition-colors gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {node.status === 'completed' && <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />}
                              {node.status === 'in_progress' && <Clock size={13} className="text-accent-amber flex-shrink-0" />}
                              {node.status === 'not_started' && <Circle size={13} className="text-zinc-500 flex-shrink-0" />}
                              <div className="min-w-0">
                                <span className="text-xs font-medium text-zinc-200 truncate block">{node.label}</span>
                                {node.description && (
                                  <span className="text-[10px] text-zinc-500 truncate block">{node.description}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditNode(node)}
                                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/[0.06]"
                              >
                                <Edit3 size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTopic(node.id, node.label)}
                                className="p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-rose-500/10"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
          <Button variant="secondary" size="md" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={saving}
            icon={saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            onClick={handleSaveAll}
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
