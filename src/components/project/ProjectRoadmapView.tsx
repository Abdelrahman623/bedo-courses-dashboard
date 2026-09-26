import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Flag, Plus, Trash2, CheckSquare, Square, Pencil, UserPlus,
  ArrowLeft, ChevronRight, CheckCheck, AlertCircle, LogOut
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressRing } from '../ui/ProgressRing';
import { useMilestonesStore } from '../../store/milestonesStore';
import { useProjectsStore } from '../../store/projectsStore';
import { usePresenceStore } from '../../store/presenceStore';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_CONFIGS, getProjectRole, canInviteMembers, canManageMilestones, type ProjectRole } from '../../lib/projectRoles';
import type { Project, ProjectMilestone } from '../../types';



interface ProjectRoadmapViewProps {
  project: Project;
  allProjects: Project[];
  onSelectProject: (p: Project) => void;
  onBackToBoard: () => void;
  onOpenInvite: (p: Project) => void;
}

export const ProjectRoadmapView: React.FC<ProjectRoadmapViewProps> = ({
  project,
  allProjects,
  onSelectProject,
  onBackToBoard,
  onOpenInvite,
}) => {
  const { user, profile } = useAuth();
  const {
    milestones,
    loading,
    fetchMilestones,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    addItem,
    toggleItem,
    deleteItem,
  } = useMilestonesStore();

  const {
    cursors,
    onlineUsers,
    joinChannel,
    leaveChannel,
    broadcastCursor,
    broadcastAction,
    onAction,
  } = usePresenceStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDef, setNewDef] = useState('');
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

  const { leaveProject } = useProjectsStore();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editDef, setEditDef] = useState('');
  const [addingItemToMilestoneId, setAddingItemToMilestoneId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');

  const role: ProjectRole = getProjectRole(project, user?.id);
  const canInvite = canInviteMembers(role);
  const canEditMilestones = canManageMilestones(role);
  const isOwner = role === 'owner';
  const roleCfg = ROLE_CONFIGS[role];

  const projectMilestones: ProjectMilestone[] = milestones[project.id] ?? [];


  const handleLeaveProject = async () => {
    setLeaving(true);
    await leaveProject(project.id);
    setLeaving(false);
    setShowLeaveModal(false);
    onBackToBoard();
  };


  // Join realtime presence channel for this specific project
  useEffect(() => {
    if (!project.id || !user?.id) return;
    const name = profile?.name || profile?.username || user.email?.split('@')[0] || 'User';
    joinChannel(project.id, user.id, name);
    return () => {
      leaveChannel();
    };
  }, [project.id, user?.id, profile?.name, profile?.username, user?.email, joinChannel, leaveChannel]);

  // Fetch milestones on project change
  useEffect(() => {
    fetchMilestones(project.id);
  }, [project.id, fetchMilestones]);

  // Listen for real-time actions from other collaborators (e.g. checkbox toggles)
  useEffect(() => {
    const unsub = onAction((action, _data) => {
      if (action === 'milestone_updated' || action === 'item_toggled') {
        fetchMilestones(project.id);
      }
    });
    return unsub;
  }, [project.id, onAction, fetchMilestones]);

  // Broadcast mouse movements across the roadmap canvas
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    broadcastCursor(x, y);
  }, [broadcastCursor]);

  const handleToggleItem = async (itemId: string, milestoneId: string, done: boolean) => {
    await toggleItem(itemId, milestoneId, project.id, done);
    broadcastAction('item_toggled', { milestoneId, itemId, done });
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    setCreateError(null);
    const res = await addMilestone(project.id, {
      title: newTitle.trim(),
      definition: newDef.trim() || undefined,
    });
    setSaving(false);
    if (res?.error) {
      setCreateError(res.error);
      return;
    }
    broadcastAction('milestone_updated', { projectId: project.id });
    setNewTitle('');
    setNewDef('');
    setShowAddModal(false);
  };


  const handleSaveEditMilestone = async (mId: string) => {
    if (!editTitle.trim()) return;
    await updateMilestone(mId, project.id, {
      title: editTitle.trim(),
      definition: editDef.trim() || undefined,
    });
    broadcastAction('milestone_updated', { projectId: project.id });
    setEditingMilestoneId(null);
  };

  const handleAddItem = async (milestoneId: string) => {
    if (!newItemText.trim()) return;
    await addItem(milestoneId, project.id, newItemText.trim());
    broadcastAction('milestone_updated', { projectId: project.id });
    setNewItemText('');
    setAddingItemToMilestoneId(null);
  };

  // Metrics
  const totalItems = projectMilestones.reduce((acc, m) => acc + m.items.length, 0);
  const doneItems = projectMilestones.reduce((acc, m) => acc + m.items.filter(i => i.done).length, 0);
  const completedMilestones = projectMilestones.filter(m => m.items.length > 0 && m.items.every(i => i.done)).length;
  const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <div
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      className="relative flex flex-col h-full min-h-[calc(100vh-8rem)] w-full overflow-hidden select-none"
    >
      {/* ─── LIVE MULTI-USER CURSOR OVERLAY (Google Docs-Style) ──────────── */}
      {Array.from(cursors.values()).map(cursor => (
        <div
          key={cursor.userId}
          style={{
            position: 'absolute',
            left: cursor.x,
            top: cursor.y,
            pointerEvents: 'none',
            zIndex: 50,
            transform: 'translate(-2px, -2px)',
            transition: 'left 0.08s linear, top 0.08s linear',
          }}
        >
          {/* Cursor Arrow */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
              fill={cursor.color}
              stroke="rgba(0,0,0,0.6)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          {/* User Name Pill */}
          <div
            style={{ backgroundColor: cursor.color }}
            className="px-2 py-0.5 rounded-full text-[10px] font-bold text-black shadow-lg whitespace-nowrap -mt-1 ml-3"
          >
            {cursor.name}
          </div>
        </div>
      ))}

      {/* ─── TOP CONTROL BAR ────────────────────────────────────────────── */}
      <div className="bg-[#131722]/90 backdrop-blur-md border border-white/[0.08] rounded-2xl p-4 mb-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Back button + Project Selector & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToBoard}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.08] transition-colors cursor-pointer flex-shrink-0"
            title="Back to Projects Board"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent-amber flex items-center gap-1">
                <Flag size={11} /> Project Milestone Roadmap
              </span>
              <Badge status={project.status} size="sm" />
              {project.isShared && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  Shared
                </span>
              )}
            </div>

            {/* Project dropdown switcher + Role Badge */}
            <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
              <select
                value={project.id}
                onChange={e => {
                  const target = allProjects.find(p => p.id === e.target.value);
                  if (target) onSelectProject(target);
                }}
                className="bg-transparent text-lg font-bold text-white outline-none cursor-pointer hover:text-accent-amber transition-colors border-b border-white/[0.1] hover:border-accent-amber/50 pr-4"
              >
                {allProjects.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#131722] text-white">
                    {p.title} {p.isShared ? '(Shared)' : ''}
                  </option>
                ))}
              </select>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${roleCfg.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${roleCfg.dotClass}`} />
                {roleCfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Active Collaborators Presence + Invite Button + Add Milestone */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Collaborator Presence Indicator */}
          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D1017] border border-white/[0.08]" title="Collaborators actively on this roadmap">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-zinc-400 font-medium mr-1">
                {onlineUsers.length} in room:
              </span>
              <div className="flex -space-x-1.5">
                {onlineUsers.map(u => (
                  <div
                    key={u.userId}
                    style={{ borderColor: u.color }}
                    className="w-6 h-6 rounded-full bg-zinc-800 border-2 flex items-center justify-center text-[9px] font-bold text-white shadow"
                    title={`${u.name} (live cursor)`}
                  >
                    {u.name.slice(0, 1).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROMINENT INVITE BUTTON (Owner & Super Admin) */}
          {canInvite && (
            <Button
              variant="outline"
              size="sm"
              icon={<UserPlus size={14} className="text-accent-amber" />}
              onClick={() => onOpenInvite(project)}
              className="border-accent-amber/30 hover:bg-accent-amber/10 text-white"
            >
              Invite to Project
            </Button>
          )}

          {/* Add Milestone Button (Owner, Super Admin, Admin) */}
          {canEditMilestones && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setShowAddModal(true)}
            >
              Add Milestone
            </Button>
          )}

          {/* Leave Project Button (invited member only) */}
          {!isOwner && project.isShared && (
            <Button
              variant="outline"
              size="sm"
              icon={<LogOut size={14} className="text-rose-400" />}
              onClick={() => setShowLeaveModal(true)}
              className="border-rose-500/30 hover:bg-rose-500/10 text-rose-400"
            >
              Leave Project
            </Button>
          )}
        </div>


      </div>

      {/* ─── ROADMAP STATS SUMMARY BAR ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-[#131722] border border-white/[0.06] rounded-xl flex items-center gap-3">
          <ProgressRing value={overallPct} size={38} stroke={3.5} />
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500">Overall Progress</span>
            <p className="text-base font-bold text-white font-mono">{overallPct}%</p>
          </div>
        </div>

        <div className="p-3 bg-[#131722] border border-white/[0.06] rounded-xl">
          <span className="text-[10px] uppercase font-bold text-zinc-500">Total Milestones</span>
          <p className="text-base font-bold text-white font-mono mt-0.5">
            {projectMilestones.length} <span className="text-xs text-zinc-500 font-normal">({completedMilestones} completed)</span>
          </p>
        </div>

        <div className="p-3 bg-[#131722] border border-white/[0.06] rounded-xl">
          <span className="text-[10px] uppercase font-bold text-zinc-500">Action Points</span>
          <p className="text-base font-bold text-white font-mono mt-0.5">
            {doneItems} / {totalItems} <span className="text-xs text-zinc-500 font-normal">ticked</span>
          </p>
        </div>

        <div className="p-3 bg-[#131722] border border-white/[0.06] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500">Realtime Collaboration</span>
            <p className="text-xs font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live Cursors Active
            </p>
          </div>
        </div>
      </div>

      {/* ─── EMPTY STATE: NO MILESTONES ─────────────────────────────────── */}
      {!loading && projectMilestones.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#131722]/50 border border-white/[0.06] rounded-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent-amber/10 border border-accent-amber/25 flex items-center justify-center text-accent-amber mb-4">
            <Flag size={26} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No Milestones in this Project Roadmap</h3>
          <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
            Create milestone stages with clear definitions and action checklists. Collaborators will see your updates and cursors live!
          </p>
          {isOwner ? (
            <Button
              variant="primary"
              size="md"
              icon={<Plus size={15} />}
              onClick={() => setShowAddModal(true)}
            >
              Create First Milestone
            </Button>
          ) : (
            <p className="text-xs text-zinc-500 italic">
              The project owner has not added any milestones to this roadmap yet.
            </p>
          )}
        </div>
      )}

      {/* ─── ROADMAP PIPELINE / FLOW ────────────────────────────────────── */}
      {projectMilestones.length > 0 && (
        <div className="flex-1 overflow-x-auto pb-8">
          <div className="flex items-start gap-6 min-w-max pt-2 px-1">
            {projectMilestones.map((m, idx) => {
              const mDone = m.items.filter(i => i.done).length;
              const mTotal = m.items.length;
              const mPct = mTotal > 0 ? Math.round((mDone / mTotal) * 100) : 0;
              const isComplete = mTotal > 0 && mDone === mTotal;
              const isCurrent = !isComplete && (idx === 0 || projectMilestones[idx - 1].items.every(i => i.done));

              return (
                <div key={m.id} className="flex items-start group/stage">
                  {/* Milestone Card */}
                  <div
                    className={`w-80 rounded-2xl border transition-all duration-200 flex flex-col bg-[#131722] shadow-xl overflow-hidden ${
                      isComplete
                        ? 'border-emerald-500/40 shadow-emerald-500/5'
                        : isCurrent
                        ? 'border-accent-amber/50 shadow-accent-amber/5 ring-1 ring-accent-amber/20'
                        : 'border-white/[0.08]'
                    }`}
                  >
                    {/* Stage Header */}
                    <div className="p-4 border-b border-white/[0.06] bg-white/[0.01]">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                              isComplete
                                ? 'bg-emerald-500 text-black'
                                : isCurrent
                                ? 'bg-accent-amber text-black'
                                : 'bg-white/[0.08] text-zinc-300'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          Stage {idx + 1}
                        </span>

                        <div className="flex items-center gap-1">
                          {isComplete && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCheck size={11} /> Done
                            </span>
                          )}
                          {isCurrent && !isComplete && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-amber/15 text-accent-amber border border-accent-amber/30">
                              Active
                            </span>
                          )}
                          {canEditMilestones && (
                            <button
                              onClick={() => deleteMilestone(m.id, project.id)}
                              className="p-1 rounded text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete milestone"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Milestone Title */}
                      {editingMilestoneId === m.id ? (
                        <div className="space-y-2 mt-1">
                          <input
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="w-full bg-[#0D1017] border border-accent-amber/50 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                            placeholder="Milestone title"
                            autoFocus
                          />
                          <textarea
                            value={editDef}
                            onChange={e => setEditDef(e.target.value)}
                            className="w-full bg-[#0D1017] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none resize-none"
                            rows={2}
                            placeholder="Definition of done"
                          />
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => setEditingMilestoneId(null)}
                              className="px-2 py-1 text-[11px] text-zinc-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEditMilestone(m.id)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-accent-amber text-black rounded-md"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="group/title flex items-start justify-between">
                          <h4 className="font-bold text-white text-sm tracking-tight leading-snug">
                            {m.title}
                          </h4>
                          {canEditMilestones && (

                            <button
                              onClick={() => {
                                setEditingMilestoneId(m.id);
                                setEditTitle(m.title);
                                setEditDef(m.definition || '');
                              }}
                              className="opacity-0 group-hover/title:opacity-100 p-1 text-zinc-500 hover:text-white transition-opacity"
                              title="Edit milestone definition"
                            >
                              <Pencil size={11} />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Milestone Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-[11px] mb-1 font-mono">
                          <span className="text-zinc-500 font-sans">Action checklist</span>
                          <span className={isComplete ? 'text-emerald-400 font-bold' : 'text-zinc-300'}>
                            {mDone}/{mTotal} ({mPct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            style={{ width: `${mPct}%` }}
                            className={`h-full transition-all duration-300 rounded-full ${
                              isComplete ? 'bg-emerald-400' : 'bg-accent-amber'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Milestone Definition of Done */}
                    {m.definition && (
                      <div className="p-3 bg-white/[0.02] border-b border-white/[0.04]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                          Definition of Done:
                        </span>
                        <p className="text-xs text-zinc-300 leading-relaxed italic border-l-2 border-accent-amber/40 pl-2.5">
                          {m.definition}
                        </p>
                      </div>
                    )}

                    {/* Milestone Action Points Checklist */}
                    <div className="p-4 flex-1 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                        What to do (Action Points):
                      </span>

                      {m.items.length === 0 ? (
                        <p className="text-xs text-zinc-600 italic py-2">
                          No action points defined yet.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {m.items.map(item => (
                            <div
                              key={item.id}
                              className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-white/[0.03] transition-colors group/item"
                            >
                              <button
                                onClick={() => handleToggleItem(item.id, m.id, !item.done)}
                                className="mt-0.5 text-zinc-500 hover:text-accent-amber transition-colors cursor-pointer flex-shrink-0"
                                title={item.done ? 'Mark pending' : 'Mark completed'}
                              >
                                {item.done ? (
                                  <CheckSquare size={14} className="text-emerald-400" />
                                ) : (
                                  <Square size={14} />
                                )}
                              </button>
                              <span
                                className={`text-xs flex-1 leading-relaxed transition-all ${
                                  item.done
                                    ? 'line-through text-zinc-600'
                                    : 'text-zinc-200'
                                }`}
                              >
                                {item.text}
                              </span>
                              {canEditMilestones && (
                                <button
                                  onClick={() => deleteItem(item.id, m.id, project.id)}
                                  className="opacity-0 group-hover/item:opacity-100 p-0.5 text-zinc-600 hover:text-rose-400 transition-opacity cursor-pointer"
                                  title="Delete point"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Action Item Input */}
                      {canEditMilestones && (

                        <div className="pt-2">
                          {addingItemToMilestoneId === m.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                value={newItemText}
                                onChange={e => setNewItemText(e.target.value)}
                                placeholder="Add action point…"
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleAddItem(m.id);
                                  if (e.key === 'Escape') setAddingItemToMilestoneId(null);
                                }}
                                className="flex-1 bg-[#0D1017] border border-accent-amber/50 rounded-lg px-2.5 py-1 text-xs text-white outline-none"
                              />
                              <button
                                onClick={() => handleAddItem(m.id)}
                                className="px-2 py-1 bg-accent-amber text-black rounded-lg text-xs font-bold"
                              >
                                Add
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setAddingItemToMilestoneId(m.id);
                                setNewItemText('');
                              }}
                              className="text-xs text-zinc-500 hover:text-accent-amber flex items-center gap-1 transition-colors cursor-pointer py-1"
                            >
                              <Plus size={12} /> Add action point
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Flow Arrow Connector between Stages */}
                  {idx < projectMilestones.length - 1 && (
                    <div className="flex items-center self-center px-3 text-zinc-600">
                      <div className="w-6 h-[2px] bg-white/[0.12] -mr-1" />
                      <ChevronRight size={18} className="text-zinc-500 flex-shrink-0" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── ADD MILESTONE MODAL ─────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#131722] border border-white/[0.12] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flag size={16} className="text-accent-amber" />
                Add Milestone to Roadmap
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-3">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">

                  Milestone Stage Title *
                </label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Core Database Schema & Authentication"
                  required
                  autoFocus
                  className="w-full bg-[#0D1017] border border-white/[0.1] focus:border-accent-amber/70 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Definition of Done (Concept & Goals)
                </label>
                <textarea
                  value={newDef}
                  onChange={e => setNewDef(e.target.value)}
                  placeholder="Explain what completed looks like for this milestone..."
                  rows={3}
                  className="w-full bg-[#0D1017] border border-white/[0.1] focus:border-accent-amber/70 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={saving}
                >
                  Create Milestone
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── LEAVE PROJECT CONFIRMATION MODAL ─────────────────────────────── */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#131722] border border-white/[0.1] rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center gap-2 mb-3 text-rose-400">
              <LogOut size={18} />
              <h3 className="font-bold text-sm text-white">Leave Project</h3>
            </div>
            <p className="text-xs text-zinc-300 mb-2">
              Are you sure you want to withdraw from <span className="font-semibold text-white">{project.title}</span>?
            </p>
            <p className="text-[11px] text-zinc-500 mb-5">
              You will lose access to this shared project and its roadmap. The owner can invite you back if needed.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setShowLeaveModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={leaving}
                icon={<LogOut size={13} />}
                onClick={handleLeaveProject}
              >
                Leave Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

