import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserPlus, Check, X, Users, Clock, Loader2, Search, Copy, CheckCheck, ShieldCheck, Mail, UserMinus, LogOut
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useInvitesStore } from '../../store/invitesStore';
import { useProjectsStore } from '../../store/projectsStore';
import { useAuth } from '../../hooks/useAuth';
import type { Profile, Project, ProjectInvite } from '../../types';


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
    searchProfiles,
  } = useInvitesStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
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
  const projectCollaborators = useMemo<Profile[]>(() => collaborators[projectId] ?? [], [collaborators, projectId]);

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

    const { error } = await sendInvite(projectId, targetUserId);
    setSendingId(null);

    if (error) {
      setStatusMessage({ type: 'error', text: error });
    } else {
      setStatusMessage({
        type: 'success',
        text: `Invitation sent to ${targetName || 'user'}! They can accept it in their topbar bell.`,
      });
      setQuery('');
      setResults([]);
      fetchOutgoing(projectId);
    }
  }, [projectId, sendInvite, fetchOutgoing]);

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
      title={isOwner ? `Share Project: ${project.title}` : `Project: ${project.title}`}
      width="max-w-lg"
    >
      <div className="space-y-5">

        {/* Status feedback (shown for both owner + non-owner) */}
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

        {/* ── OWNER ONLY: invite form ── */}
        {isOwner && (
          <>
            {/* Helper Banner */}
            <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-start gap-2.5">
              <Mail size={16} className="text-accent-amber mt-0.5 flex-shrink-0" />
              <div className="text-xs text-zinc-300 leading-relaxed">
                <p>
                  Invite someone to collaborate by searching their <span className="text-white font-semibold">User ID</span> or <span className="text-white font-semibold">Username</span>.
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  They will receive a notification in their bell icon with <span className="text-emerald-400 font-medium">Accept</span> and <span className="text-rose-400 font-medium">Decline</span> options.
                </p>
              </div>
            </div>

            {/* User's Own ID Card for Reference */}
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

              {/* Direct UUID invite action if user pasted a UUID */}
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
                    Send Direct Invite
                  </Button>
                </div>
              )}

              {/* Search Results Dropdown */}
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

        {/* ── Collaborators & Invites section (always visible) ── */}
        <div className={`${isOwner ? 'pt-2 border-t border-white/[0.08]' : ''} space-y-4`}>

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
                {projectCollaborators.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar profile={c} size={26} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{c.name}</p>
                        {c.username && (
                          <p className="text-[10px] text-zinc-500 truncate">@{c.username}</p>
                        )}
                      </div>
                    </div>
                    {isOwner ? (
                      <button
                        onClick={() => handleRemove(c.id)}
                        disabled={removingId === c.id}
                        title="Remove this collaborator's access"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {removingId === c.id
                          ? <Loader2 size={11} className="animate-spin" />
                          : <UserMinus size={11} />}
                        Remove Access
                      </button>
                    ) : c.id === user?.id ? (
                      <button
                        onClick={handleLeaveProject}
                        disabled={leaving}
                        title="Withdraw / Leave this project"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {leaving ? <Loader2 size={11} className="animate-spin" /> : <LogOut size={11} />}
                        Leave Project
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/25">
                        <ShieldCheck size={11} />
                        Active Member
                      </span>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending / Sent Invites — OWNER ONLY */}
          {isOwner && (
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
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar profile={invite.invitee_profile} size={24} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-zinc-300 truncate">
                            {invite.invitee_profile?.name || `User (${invite.invitee_id.slice(0, 8)}...)`}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono">
                            Status: <span className={invite.status === 'accepted' ? 'text-emerald-400 font-semibold' : invite.status === 'declined' ? 'text-rose-400' : 'text-amber-400'}>{invite.status}</span>
                          </p>
                        </div>
                      </div>
                      {invite.status === 'pending' && (
                        <button
                          onClick={() => handleRevoke(invite.id)}
                          className="px-2 py-1 rounded text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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

