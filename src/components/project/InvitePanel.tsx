import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserPlus, Check, X, Users, Clock, Loader2, Search, Crown, UserMinus, LogOut } from 'lucide-react';
import { useInvitesStore } from '../../store/invitesStore';
import { useProjectsStore } from '../../store/projectsStore';
import { useAuth } from '../../hooks/useAuth';

import type { Profile, ProjectInvite } from '../../types';

interface InvitePanelProps {
  projectId: string;
  isOwner: boolean;
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

export const InvitePanel: React.FC<InvitePanelProps> = ({ projectId, isOwner }) => {
  const { user } = useAuth();
  const {
    outgoing,
    collaborators,
    fetchOutgoing,
    fetchCollaborators,
    sendInvite,
    revokeInvite,
    removeCollaborator,
    searchProfiles,
  } = useInvitesStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);


  const projectInvites = useMemo<ProjectInvite[]>(() => outgoing[projectId] ?? [], [outgoing, projectId]);
  const projectCollaborators = useMemo<Profile[]>(() => collaborators[projectId] ?? [], [collaborators, projectId]);

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
      // Filter out self and already-invited users
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
    const { error } = await sendInvite(projectId, profile.id);
    setSending(null);
    if (error) {
      setSendError(error);
    } else {
      setSendSuccess(`Invite sent to ${profile.name}`);
      setQuery('');
      setResults([]);
      setTimeout(() => setSendSuccess(null), 3000);
    }
  }, [projectId, sendInvite]);

  const handleRevoke = useCallback(async (inviteId: string) => {
    await revokeInvite(inviteId);
    fetchOutgoing(projectId);
  }, [revokeInvite, projectId, fetchOutgoing]);

  const handleRemove = useCallback(async (collaboratorId: string) => {
    setRemoving(collaboratorId);
    await removeCollaborator(projectId, collaboratorId);
    setRemoving(null);
  }, [projectId, removeCollaborator]);

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
            {projectCollaborators.map(profile => (
              <div
                key={profile.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
              >
                <Avatar profile={profile} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{profile.name}</p>
                  {profile.username && (
                    <p className="text-[10px] text-zinc-500 truncate">@{profile.username}</p>
                  )}
                </div>
                {isOwner ? (
                  <button
                    onClick={() => handleRemove(profile.id)}
                    disabled={removing === profile.id}
                    title="Remove collaborator access"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {removing === profile.id
                      ? <Loader2 size={11} className="animate-spin" />
                      : <UserMinus size={11} />}
                    Remove
                  </button>
                ) : profile.id === user?.id ? (
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
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border bg-emerald-400/10 border-emerald-400/25 text-emerald-400">
                    Access
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Owner-only: invite UI */}
      {isOwner && (
        <>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
              <Crown size={11} />
              Invite Collaborators
            </p>
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
                        {invite.invitee_profile?.username && (
                          <p className="text-[10px] text-zinc-500">@{invite.invitee_profile.username}</p>
                        )}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badge.cls}`}>
                        {badge.label}
                      </span>
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

      {/* Non-owner view: just see collaborators */}
      {!isOwner && projectCollaborators.length === 0 && (
        <p className="text-xs text-zinc-500 text-center py-4">
          No other collaborators yet.
        </p>
      )}
    </div>
  );
};
