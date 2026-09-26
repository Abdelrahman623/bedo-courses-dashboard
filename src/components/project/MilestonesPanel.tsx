import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, CheckSquare, Square, Flag, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';

import { useMilestonesStore } from '../../store/milestonesStore';
import type { ProjectMilestone } from '../../types';

interface MilestonesPanelProps {
  projectId: string;
  isOwner?: boolean;
  canEdit?: boolean;
}


// ── Progress ring ────────────────────────────────────────────────────────────
const ProgressRing: React.FC<{ done: number; total: number; size?: number }> = ({
  done,
  total,
  size = 32,
}) => {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? done / total : 0;
  const offset = circ * (1 - pct);
  const isComplete = total > 0 && done === total;

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={2.5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={isComplete ? '#10B981' : '#F59E0B'}
        strokeWidth={2.5}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.35s ease' }}
      />
      <text
        x={size / 2}
        y={size / 2 + 3.5}
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill={isComplete ? '#10B981' : '#F59E0B'}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {total > 0 ? `${Math.round(pct * 100)}%` : '—'}
      </text>
    </svg>
  );
};

// ── Single milestone card ────────────────────────────────────────────────────
const MilestoneCard: React.FC<{
  milestone: ProjectMilestone;
  canModify: boolean;
  projectId: string;
}> = ({ milestone, canModify, projectId }) => {

  const { updateMilestone, deleteMilestone, addItem, toggleItem, deleteItem } = useMilestonesStore();
  const [expanded, setExpanded] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(milestone.title);
  const [editDef, setEditDef] = useState(milestone.definition ?? '');
  const itemInputRef = useRef<HTMLInputElement>(null);

  const done = milestone.items.filter(i => i.done).length;
  const total = milestone.items.length;

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;
    setAddingItem(true);
    await addItem(milestone.id, projectId, newItemText.trim());
    setNewItemText('');
    setAddingItem(false);
    itemInputRef.current?.focus();
  };

  const handleSaveEdit = async () => {
    await updateMilestone(milestone.id, projectId, {
      title: editTitle.trim() || milestone.title,
      definition: editDef.trim() || undefined,
    });
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#131722] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <ProgressRing done={done} total={total} />
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full bg-transparent border-b border-accent-amber/40 text-sm font-semibold text-white outline-none pb-0.5"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') void handleSaveEdit(); if (e.key === 'Escape') setEditing(false); }}
            />
          ) : (
            <button
              onClick={() => canModify && setEditing(true)}
              className={`text-sm font-semibold text-white text-left w-full truncate ${canModify ? 'hover:text-accent-amber cursor-pointer' : 'cursor-default'}`}
            >
              {milestone.title}
            </button>
          )}
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
            {done}/{total} items done
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {editing && (
            <button
              onClick={() => void handleSaveEdit()}
              className="px-2 py-1 rounded-lg text-[11px] bg-accent-amber/10 text-accent-amber border border-accent-amber/25 hover:bg-accent-amber/20 cursor-pointer font-medium"
            >
              Save
            </button>
          )}
          {canModify && !editing && (
            <button
              onClick={() => deleteMilestone(milestone.id, projectId)}
              className="p-1 rounded text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Delete milestone"
            >
              <Trash2 size={13} />
            </button>
          )}

          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06]">
          {/* Definition */}
          {(milestone.definition || editing) && (
            <div className="pt-3">
              {editing ? (
                <textarea
                  value={editDef}
                  onChange={e => setEditDef(e.target.value)}
                  placeholder="What does 'done' mean for this milestone?"
                  rows={2}
                  className="w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none resize-none transition-colors"
                />
              ) : (
                milestone.definition && (
                  <p className="text-xs text-zinc-400 leading-relaxed italic border-l-2 border-accent-amber/30 pl-3">
                    {milestone.definition}
                  </p>
                )
              )}
            </div>
          )}

          {/* Items checklist */}
          {milestone.items.length > 0 && (
            <div className="space-y-1 pt-2">
              {milestone.items.map(item => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 group"
                >
                  <button
                    onClick={() => toggleItem(item.id, milestone.id, projectId, !item.done)}
                    className="mt-0.5 text-zinc-500 hover:text-accent-amber transition-colors cursor-pointer flex-shrink-0"
                    title={item.done ? 'Mark as not done' : 'Mark as done'}
                  >
                    {item.done
                      ? <CheckSquare size={14} className="text-emerald-400" />
                      : <Square size={14} />
                    }
                  </button>
                  <span className={`text-xs flex-1 leading-relaxed transition-colors ${item.done ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                    {item.text}
                  </span>
                  {canModify && (
                    <button
                      onClick={() => deleteItem(item.id, milestone.id, projectId)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-600 hover:text-rose-400 transition-all cursor-pointer"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add item — editors only */}
          {canModify && (

            <div className="flex items-center gap-2 pt-1">
              <input
                ref={itemInputRef}
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                placeholder="Add action item…"
                className="flex-1 bg-transparent border-b border-white/[0.06] focus:border-accent-amber/40 text-xs text-white placeholder:text-zinc-600 outline-none py-1 transition-colors"
                onKeyDown={e => { if (e.key === 'Enter') void handleAddItem(); }}
              />
              <button
                onClick={() => void handleAddItem()}
                disabled={!newItemText.trim() || addingItem}
                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-accent-amber/10 text-zinc-400 hover:text-accent-amber border border-white/[0.06] transition-colors cursor-pointer disabled:opacity-40"
              >
                {addingItem ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Panel ────────────────────────────────────────────────────────────────────
export const MilestonesPanel: React.FC<MilestonesPanelProps> = ({ projectId, isOwner = false, canEdit }) => {
  const canModify = canEdit !== undefined ? canEdit : isOwner;
  const { milestones, loading, fetchMilestones, addMilestone } = useMilestonesStore();
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDef, setNewDef] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectMilestones = milestones[projectId] ?? [];

  useEffect(() => { fetchMilestones(projectId); }, [projectId, fetchMilestones]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    setError(null);
    const res = await addMilestone(projectId, { title: newTitle.trim(), definition: newDef.trim() || undefined });
    setSaving(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setNewTitle('');
    setNewDef('');
    setShowForm(false);
  };

  // Summary stats
  const totalItems = projectMilestones.reduce((s, m) => s + m.items.length, 0);
  const doneItems = projectMilestones.reduce((s, m) => s + m.items.filter(i => i.done).length, 0);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag size={13} className="text-accent-amber" />
          <span className="text-xs font-semibold text-zinc-300">
            {projectMilestones.length} milestone{projectMilestones.length !== 1 ? 's' : ''}
            {totalItems > 0 && (
              <span className="text-zinc-500 font-normal ml-1.5">· {doneItems}/{totalItems} items done</span>
            )}
          </span>
        </div>
        {canModify && (
          <button
            onClick={() => { setError(null); setShowForm(v => !v); }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-white/[0.04] hover:bg-accent-amber/10 text-zinc-400 hover:text-accent-amber border border-white/[0.06] transition-colors cursor-pointer"
          >
            <Plus size={11} />
            Add Milestone
          </button>
        )}
      </div>

      {/* Add milestone form */}
      {canModify && showForm && (

        <form onSubmit={handleAdd} className="space-y-2 p-3 rounded-xl border border-accent-amber/20 bg-accent-amber/[0.03]">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Milestone title…"
            autoFocus
            className="w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 text-sm font-medium text-white placeholder:text-zinc-600 outline-none transition-colors"

          />
          <textarea
            value={newDef}
            onChange={e => setNewDef(e.target.value)}
            placeholder="Definition of done (optional) — what does completing this milestone mean?"
            rows={2}
            className="w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none resize-none transition-colors"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!newTitle.trim() || saving}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent-amber text-black hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              {saving && <Loader2 size={11} className="animate-spin" />}
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white border border-white/[0.08] hover:border-white/20 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Loading */}
      {loading && projectMilestones.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={18} className="animate-spin text-zinc-600" />
        </div>
      )}

      {/* Empty state */}
      {!loading && projectMilestones.length === 0 && (
        <div className="text-center py-8">
          <Flag size={24} className="text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">
            {canModify ? 'No milestones yet — add one above to track progress.' : 'No milestones defined yet.'}
          </p>
        </div>
      )}

      {/* Milestone cards */}
      <div className="space-y-3">
        {projectMilestones.map(m => (
          <MilestoneCard key={m.id} milestone={m} canModify={canModify} projectId={projectId} />
        ))}
      </div>
    </div>
  );
};

