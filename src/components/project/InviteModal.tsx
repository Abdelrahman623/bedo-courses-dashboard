import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserPlus, Check, X, Users, Clock, Loader2, Search, Copy, CheckCheck, Mail, UserMinus, LogOut, ChevronDown,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useInvitesStore } from '../../store/invitesStore';
import { useProjectsStore } from '../../store/projectsStore';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_CONFIGS, getProjectRole, canInviteMembers, canManageMembers, type ProjectRole } from '../../lib/projectRoles';
import type { Profile, Project, ProjectInvite, ProjectMember } from '../../types';

interface InviteModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  isOwner?: boolean;
}

const Avatar: React.FC<{ profile?: Pick<Profile, 'name' | 'avatar_url'>; size?: number }> = ({
  profile,
  size = 32,
}) => {
  const initials = profile?.name?.slice(0, 2).toUpperCase() ?? '?';
  return profile?.avatar_url ? (
    <img
      src={profile.avatar_url}
      alt={profile.name}
      style={{ width: size, height: size }}
      className="rounded-full object-cover flex-shrink-0"
    />
  ) : (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-accent-amber/20 border border-accent-amber/30 flex items-center justify-center flex-shrink-0"
    >
      <span className="text-[10px] font-bold text-accent-amber">{initials}</span>
    </div>
  );
};

/** Compact role badge */
const RoleBadge: React.FC<{ role: ProjectRole }> = ({ role }) => {
  const cfg = ROLE_CONFIGS[role];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${cfg.badgeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
      {cfg.shortLabel}
    </span>
  );
};

/** Assignable roles (owner is never assigned via invite) */
const ASSIGNABLE_ROLES: ProjectRole[] = ['super_admin', 'admin', 'partner'];

export const InviteModal: React.FC<InviteModalProps> = ({ project, isOpen, onClose, isOwner = false }) => {
  const { user } = useAuth();
  const {
    outgoing,
    collaborators,
    fetchOutgoing,
    fetchCollaborators,
    sendInvite,
    revokeInvite,
    removeCollaborator,
    updateMemberRole,
    searchProfiles,
  } = useInvitesStore();

  const myRole: ProjectRole = project ? getProjectRole(project, user?.id) : (isOwner ? 'owner' : 'partner');
  const canInvite = canInviteMembers(myRole);
  const canManage = canManageMembers(myRole);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ProjectRole>('partner');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedMyId, setCopiedMyId] = useState(false);

  const { leaveProject } = useProjectsStore();

  const handleLeaveProject = async () => {
    if (!project) return;
    setLeaving(true);
    await leaveProject(project.id);
    setLeaving(false);
    onClose();
  };

  const projectId = project?.id ?? '';
  const projectInvites = useMemo<ProjectInvite[]>(() => outgoing[projectId] ?? [], [outgoing, projectId]);
  const projectCollaborators = useMemo<ProjectMember[]>(() => collaborators[projectId] ?? [], [collaborators, projectId]);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchOutgoing(projectId);
      fetchCollaborators(projectId);
      setQuery('');
      setResults([]);
      setStatusMessage(null);
    }
  }, [isOpen, projectId, fetchOutgoing, fetchCollaborators]);

  // Debounced search for username, name, or UUID
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      const found = await searchProfiles(query);
      const alreadyInvited = new Set(projectInvites.map(i => i.invitee_id));
      setResults(found.filter(p => p.id !== user?.id && !alreadyInvited.has(p.id)));
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, projectInvites, user?.id, searchProfiles]);

  const handleSendInvite = useCallback(async (targetUserId: string, targetName?: string) => {
    if (!projectId) return;
    setSendingId(targetUserId);
    setStatusMessage(null);

    const { error } = await sendInvite(projectId, targetUserId, selectedRole);
    setSendingId(null);

    if (error) {
      setStatusMessage({ type: 'error', text: error });
    } else {
      setStatusMessage({
        type: 'success',
        text: `Invitation sent to ${targetName || 'user'} as ${ROLE_CONFIGS[selectedRole].label}!`,
      });
      setQuery('');
      setResults([]);
      fetchOutgoing(projectId);
    }
  }, [projectId, sendInvite, fetchOutgoing, selectedRole]);

  const handleRevoke = useCallback(async (inviteId: string) => {
    if (!projectId) return;
    await revokeInvite(inviteId);
    fetchOutgoing(projectId);
    setStatusMessage({ type: 'success', text: 'Invitation cancelled.' });
  }, [projectId, revokeInvite, fetchOutgoing]);

  const handleRemove = useCallback(async (collaboratorId: string) => {
    if (!projectId) return;
    setRemovingId(collaboratorId);
    setStatusMessage(null);
    const { error } = await removeCollaborator(projectId, collaboratorId);
    setRemovingId(null);
    if (error) {
      setStatusMessage({ type: 'error', text: `Failed to remove: ${error}` });
    } else {
      setStatusMessage({ type: 'success', text: 'Collaborator removed. They no longer have access.' });
    }
  }, [projectId, removeCollaborator]);

  const handleUpdateRole = useCallback(async (collaboratorId: string, newRole: ProjectRole) => {
    if (!projectId) return;
    setUpdatingRoleId(collaboratorId);
    const { error } = await updateMemberRole(projectId, collaboratorId, newRole);
    setUpdatingRoleId(null);
    if (error) {
      setStatusMessage({ type: 'error', text: `Failed to update role: ${error}` });
    }
  }, [projectId, updateMemberRole]);

  const copyMyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedMyId(true);
    setTimeout(() => setCopiedMyId(false), 2000);
  };

  const isExactUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.trim());

  if (!project) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={canInvite ? `Share Project: ${project.title}` : `Project: ${project.title}`}
      width="max-w-lg"
    >
      <div className="space-y-5">

        {/* Status feedback */}
        {statusMessage && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
            }`}
          >
            {statusMessage.type === 'success' ? <Check size={14} /> : <X size={14} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* ── INVITE FORM (owner + super_admin) ── */}
        {canInvite && (
          <>
            {/* Helper Banner */}
            <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-start gap-2.5">
              <Mail size={16} className="text-accent-amber mt-0.5 flex-shrink-0" />
              <div className="text-xs text-zinc-300 leading-relaxed">
                <p>
                  Invite someone to collaborate by searching their <span className="text-white font-semibold">User ID</span> or <span className="text-white font-semibold">Username</span>.
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  They will receive a notification with <span className="text-emerald-400 font-medium">Accept</span> and <span className="text-rose-400 font-medium">Decline</span> options.
                </p>
              </div>
            </div>

            {/* User's Own ID Card */}
            {user?.id && (
              <div className="flex items-center justify-between p-2.5 bg-[#0D1017] border border-white/[0.06] rounded-xl">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500 block">
                    Your User ID (give this to friends so they can invite you)
                  </span>
                  <p className="text-xs font-mono text-zinc-300 truncate mt-0.5 select-all">
                    {user.id}
                  </p>
                </div>
                <button
                  onClick={copyMyId}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-zinc-300 hover:text-white border border-white/[0.08] transition-colors cursor-pointer flex-shrink-0"
                  title="Copy your User ID"
                >
                  {copiedMyId ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedMyId ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            )}

            {/* Role selector for new invite */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Assign Role
              </label>
              <div className="flex gap-2">
                {ASSIGNABLE_ROLES.map(r => {
                  const cfg = ROLE_CONFIGS[r];
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={`flex-1 py-2 px-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                        selectedRole === r
                          ? `${cfg.badgeClass} shadow-sm`
                          : 'border-white/[0.08] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.16]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1 ${selectedRole === r ? cfg.dotClass : 'bg-zinc-600'}`} />
                      {cfg.shortLabel}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-zinc-500 mt-1.5">{ROLE_CONFIGS[selectedRole].description}</p>
            </div>

            {/* Search / Invite Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Invite by User ID or Username
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Paste User ID (UUID) or search @username / name…"
                  autoFocus
                  className="w-full bg-[#0D1017] border border-white/[0.12] focus:border-accent-amber/70 rounded-xl pl-9 pr-9 py-2.5 text-xs text-white placeholder:text-zinc-600 outline-none transition-colors"
                />
                {searching && (
                  <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-amber animate-spin" />
                )}
              </div>

              {/* Direct UUID invite */}
              {isExactUuid && results.length === 0 && !searching && (
                <div className="mt-2 p-2.5 rounded-xl border border-accent-amber/30 bg-accent-amber/[0.05] flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-white">Valid User ID detected</p>
                    <p className="text-[10px] font-mono text-zinc-400 truncate">{query.trim()}</p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<UserPlus size={13} />}
                    loading={sendingId === query.trim()}
                    onClick={() => handleSendInvite(query.trim())}
                  >
                    Send Invite
                  </Button>
                </div>
              )}

              {/* Search Results */}
              {results.length > 0 && (
                <div className="mt-2 rounded-xl border border-white/[0.10] bg-[#0D1017] divide-y divide-white/[0.06] overflow-hidden max-h-56 overflow-y-auto shadow-xl">
                  {results.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 p-3 hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar profile={p} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{p.name || 'User'}</p>
                          <p className="text-[10px] text-zinc-400 truncate font-mono">
                            {p.username ? `@${p.username}` : `ID: ${p.id.slice(0, 8)}...`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<UserPlus size={12} />}
                        loading={sendingId === p.id}
                        onClick={() => handleSendInvite(p.id, p.name)}
                      >
                        Invite
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Collaborators & Invites section ── */}
        <div className={`${canInvite ? 'pt-2 border-t border-white/[0.08]' : ''} space-y-4`}>

          {/* Active Collaborators */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Users size={12} className="text-emerald-400" />
                Active Collaborators ({projectCollaborators.length})
              </span>
            </div>
            {projectCollaborators.length === 0 ? (
              <p className="text-xs text-zinc-600 italic py-1">No collaborators joined yet.</p>
            ) : (
              <div className="space-y-1.5">
                {projectCollaborators.map(c => {
                  const isMe = c.id === user?.id;
                  const isThisOwner = c.role === 'owner';
                  const canChangeThisRole = canManage && !isThisOwner && !isMe;
                  const canRemoveThis = canManage && !isThisOwner && !isMe;

                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Avatar profile={c} size={26} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-medium text-white truncate">{c.name}</p>
                            <RoleBadge role={c.role} />
                            {isMe && (
                              <span className="text-[10px] text-zinc-500">(you)</span>
                            )}
                          </div>
                          {c.username && (
                            <p className="text-[10px] text-zinc-500 truncate">@{c.username}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        {/* Role changer dropdown */}
                        {canChangeThisRole && (
                          <div className="relative">
                            {updatingRoleId === c.id ? (
                              <Loader2 size={13} className="animate-spin text-zinc-400" />
                            ) : (
                              <div className="relative">
                                <select
                                  value={c.role}
                                  onChange={e => handleUpdateRole(c.id, e.target.value as ProjectRole)}
                                  className="appearance-none bg-white/[0.04] border border-white/[0.10] hover:border-white/[0.20] rounded-lg pl-2 pr-6 py-1 text-[11px] text-zinc-300 outline-none cursor-pointer transition-colors"
                                  title="Change role"
                                >
                                  {ASSIGNABLE_ROLES.map(r => (
                                    <option key={r} value={r}>{ROLE_CONFIGS[r].label}</option>
                                  ))}
                                </select>
                                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Remove button */}
                        {canRemoveThis && (
                          <button
                            onClick={() => handleRemove(c.id)}
                            disabled={removingId === c.id}
                            title="Remove this collaborator's access"
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {removingId === c.id
                              ? <Loader2 size={11} className="animate-spin" />
                              : <UserMinus size={11} />}
                            Remove
                          </button>
                        )}

                        {/* Leave button for self (non-owner) */}
                        {isMe && !isThisOwner && (
                          <button
                            onClick={handleLeaveProject}
                            disabled={leaving}
                            title="Withdraw / Leave this project"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {leaving ? <Loader2 size={11} className="animate-spin" /> : <LogOut size={11} />}
                            Leave
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending / Sent Invites — invite-capable roles only */}
          {canInvite && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                  <Clock size={12} className="text-amber-400" />
                  Sent Invitations ({projectInvites.length})
                </span>
              </div>
              {projectInvites.length === 0 ? (
                <p className="text-xs text-zinc-600 italic py-1">No pending invitations.</p>
              ) : (
                <div className="space-y-1.5">
                  {projectInvites.map(invite => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Avatar profile={invite.invitee_profile} size={24} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-zinc-300 truncate">
                            {invite.invitee_profile?.name || `User (${invite.invitee_id.slice(0, 8)}...)`}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[10px] text-zinc-500 font-mono">
                              <span className={invite.status === 'accepted' ? 'text-emerald-400 font-semibold' : invite.status === 'declined' ? 'text-rose-400' : 'text-amber-400'}>{invite.status}</span>
                            </p>
                            {invite.role && <RoleBadge role={invite.role} />}
                          </div>
                        </div>
                      </div>
                      {invite.status === 'pending' && (
                        <button
                          onClick={() => handleRevoke(invite.id)}
                          className="px-2 py-1 rounded text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer ml-2"
                          title="Cancel this invite"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
