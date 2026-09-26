import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserPlus, Check, X, Users, Clock, Loader2, Search, Crown, UserMinus, LogOut, ChevronDown } from 'lucide-react';
import { useInvitesStore } from '../../store/invitesStore';
import { useProjectsStore } from '../../store/projectsStore';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_CONFIGS, canInviteMembers, canManageMembers, type ProjectRole } from '../../lib/projectRoles';

import type { Profile, ProjectInvite, ProjectMember } from '../../types';

interface InvitePanelProps {
  projectId: string;
  /** The current user's role on this project */
  currentUserRole?: ProjectRole;
  /** @deprecated use currentUserRole; kept for back-compat */
  isOwner?: boolean;
}

const Avatar: React.FC<{ profile?: Pick<Profile, 'name' | 'avatar_url'>; size?: number }> = ({
  profile,
  size = 28,
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
      <span className="text-[9px] font-bold text-accent-amber">{initials}</span>
    </div>
  );
};

const statusBadge: Record<ProjectInvite['status'], { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'text-amber-400 bg-amber-400/10 border-amber-400/25' },
  accepted: { label: 'Accepted', cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25' },
  declined: { label: 'Declined', cls: 'text-rose-400 bg-rose-400/10 border-rose-400/25' },
};

/** Compact role badge */
const RoleBadge: React.FC<{ role: ProjectRole }> = ({ role }) => {
  const cfg = ROLE_CONFIGS[role];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${cfg.badgeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
      {cfg.shortLabel}
    </span>
  );
};

const ASSIGNABLE_ROLES: ProjectRole[] = ['super_admin', 'admin', 'partner'];

export const InvitePanel: React.FC<InvitePanelProps> = ({ projectId, currentUserRole, isOwner }) => {
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

  // Resolve effective role: prefer currentUserRole, fall back to isOwner prop
  const myRole: ProjectRole = currentUserRole ?? (isOwner ? 'owner' : 'partner');
  const canInvite = canInviteMembers(myRole);
  const canManage = canManageMembers(myRole);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ProjectRole>('partner');
  const [sending, setSending] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const projectInvites = useMemo<ProjectInvite[]>(() => outgoing[projectId] ?? [], [outgoing, projectId]);
  const projectCollaborators = useMemo<ProjectMember[]>(() => (collaborators[projectId] ?? []) as ProjectMember[], [collaborators, projectId]);

  useEffect(() => {
    fetchOutgoing(projectId);
    fetchCollaborators(projectId);
  }, [projectId, fetchOutgoing, fetchCollaborators]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const found = await searchProfiles(query);
      const alreadyInvited = new Set(projectInvites.map(i => i.invitee_id));
      setResults(found.filter(p => p.id !== user?.id && !alreadyInvited.has(p.id)));
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [query, projectInvites, user?.id, searchProfiles]);

  const handleSend = useCallback(async (profile: Profile) => {
    setSending(profile.id);
    setSendError(null);
    setSendSuccess(null);
    const { error } = await sendInvite(projectId, profile.id, selectedRole);
    setSending(null);
    if (error) {
      setSendError(error);
    } else {
      setSendSuccess(`Invite sent to ${profile.name} as ${ROLE_CONFIGS[selectedRole].label}`);
      setQuery('');
      setResults([]);
      setTimeout(() => setSendSuccess(null), 3000);
    }
  }, [projectId, sendInvite, selectedRole]);

  const handleRevoke = useCallback(async (inviteId: string) => {
    await revokeInvite(inviteId);
    fetchOutgoing(projectId);
  }, [revokeInvite, projectId, fetchOutgoing]);

  const handleRemove = useCallback(async (collaboratorId: string) => {
    setRemoving(collaboratorId);
    await removeCollaborator(projectId, collaboratorId);
    setRemoving(null);
  }, [projectId, removeCollaborator]);

  const handleUpdateRole = useCallback(async (collaboratorId: string, newRole: ProjectRole) => {
    setUpdatingRoleId(collaboratorId);
    await updateMemberRole(projectId, collaboratorId, newRole);
    setUpdatingRoleId(null);
  }, [projectId, updateMemberRole]);

  const handleLeaveProject = useCallback(async () => {
    setLeaving(true);
    await useProjectsStore.getState().leaveProject(projectId);
    setLeaving(false);
  }, [projectId]);

  return (
    <div className="space-y-5">
      {/* Collaborators list */}
      {projectCollaborators.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
            <Users size={11} />
            Collaborators
          </p>
          <div className="space-y-2">
            {projectCollaborators.map(member => {
              const isMe = member.id === user?.id;
              const isThisOwner = member.role === 'owner';
              const canChangeThisRole = canManage && !isThisOwner && !isMe;
              const canRemoveThis = canManage && !isThisOwner && !isMe;

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                >
                  <Avatar profile={member} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-medium text-white truncate">{member.name}</p>
                      <RoleBadge role={member.role} />
                      {isMe && <span className="text-[10px] text-zinc-600">(you)</span>}
                    </div>
                    {member.username && (
                      <p className="text-[10px] text-zinc-500 truncate">@{member.username}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Role change dropdown */}
                    {canChangeThisRole && (
                      updatingRoleId === member.id ? (
                        <Loader2 size={12} className="animate-spin text-zinc-400" />
                      ) : (
                        <div className="relative">
                          <select
                            value={member.role}
                            onChange={e => handleUpdateRole(member.id, e.target.value as ProjectRole)}
                            className="appearance-none bg-white/[0.04] border border-white/[0.10] hover:border-white/[0.20] rounded-lg pl-2 pr-5 py-1 text-[11px] text-zinc-300 outline-none cursor-pointer transition-colors"
                            title="Change role"
                          >
                            {ASSIGNABLE_ROLES.map(r => (
                              <option key={r} value={r}>{ROLE_CONFIGS[r].label}</option>
                            ))}
                          </select>
                          <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                        </div>
                      )
                    )}

                    {canRemoveThis && (
                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={removing === member.id}
                        title="Remove collaborator access"
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {removing === member.id
                          ? <Loader2 size={11} className="animate-spin" />
                          : <UserMinus size={11} />}
                        Remove
                      </button>
                    )}

                    {isMe && !isThisOwner && (
                      <button
                        onClick={handleLeaveProject}
                        disabled={leaving}
                        title="Withdraw / Leave this project"
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {leaving
                          ? <Loader2 size={11} className="animate-spin" />
                          : <LogOut size={11} />}
                        Leave
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* invite-capable roles: invite UI */}
      {canInvite && (
        <>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
              <Crown size={11} />
              Invite Collaborators
            </p>

            {/* Role selector */}
            <div className="flex gap-1.5 mb-2">
              {ASSIGNABLE_ROLES.map(r => {
                const cfg = ROLE_CONFIGS[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`flex-1 py-1.5 px-1 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
                      selectedRole === r
                        ? `${cfg.badgeClass} shadow-sm`
                        : 'border-white/[0.08] text-zinc-600 hover:text-zinc-400'
                    }`}
                  >
                    {cfg.shortLabel}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name or username…"
                className="w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none transition-colors"
              />
              {searching && (
                <Loader2 size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 animate-spin" />
              )}
            </div>

            {/* Search results */}
            {results.length > 0 && (
              <div className="mt-1.5 rounded-lg border border-white/[0.08] bg-[#0D1017] overflow-hidden">
                {results.map(profile => (
                  <div
                    key={profile.id}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0"
                  >
                    <Avatar profile={profile} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{profile.name}</p>
                      {profile.username && (
                        <p className="text-[10px] text-zinc-500">@{profile.username}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleSend(profile)}
                      disabled={sending === profile.id}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent-amber/10 hover:bg-accent-amber/20 text-accent-amber border border-accent-amber/25 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {sending === profile.id ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <UserPlus size={11} />
                      )}
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            )}

            {sendError && (
              <p className="mt-1.5 text-[11px] text-rose-400 flex items-center gap-1">
                <X size={11} /> {sendError}
              </p>
            )}
            {sendSuccess && (
              <p className="mt-1.5 text-[11px] text-emerald-400 flex items-center gap-1">
                <Check size={11} /> {sendSuccess}
              </p>
            )}
          </div>

          {/* Pending / sent invites */}
          {projectInvites.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                <Clock size={11} />
                Sent Invites
              </p>
              <div className="space-y-1.5">
                {projectInvites.map(invite => {
                  const badge = statusBadge[invite.status];
                  return (
                    <div
                      key={invite.id}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                    >
                      <Avatar profile={invite.invitee_profile} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {invite.invitee_profile?.name ?? invite.invitee_id.slice(0, 8)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badge.cls}`}>
                            {badge.label}
                          </span>
                          {invite.role && <RoleBadge role={invite.role} />}
                        </div>
                      </div>
                      {invite.status === 'pending' && (
                        <button
                          onClick={() => handleRevoke(invite.id)}
                          title="Revoke invite"
                          className="p-1 rounded text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Non-inviting, no collaborators */}
      {!canInvite && projectCollaborators.length === 0 && (
        <p className="text-xs text-zinc-500 text-center py-4">
          No other collaborators yet.
        </p>
      )}
    </div>
  );
};
