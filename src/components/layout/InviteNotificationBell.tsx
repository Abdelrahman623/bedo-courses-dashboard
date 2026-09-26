import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useInvitesStore } from '../../store/invitesStore';
import { useProjectsStore } from '../../store/projectsStore';
import { useAuth } from '../../hooks/useAuth';

export const InviteNotificationBell: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { incoming, unreadCount, fetchIncoming, respondToInvite, markRead, subscribeIncoming } = useInvitesStore();
  const { fetchProjects } = useProjectsStore();
  const [open, setOpen] = useState(false);
  const [responding, setResponding] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initial fetch + realtime subscription
  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchIncoming();
    const unsub = subscribeIncoming();
    return unsub;
  }, [isAuthenticated, fetchIncoming, subscribeIncoming]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open && unreadCount > 0) markRead();
  };

  const handleRespond = async (inviteId: string, status: 'accepted' | 'declined') => {
    setResponding(inviteId);
    await respondToInvite(inviteId, status);
    setResponding(null);
    // Refresh projects so the shared project appears immediately
    if (status === 'accepted') {
      void fetchProjects();
    }
    if (incoming.filter(i => i.id !== inviteId).length === 0) {
      setOpen(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={handleOpen}
        title="Project invites"
        className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
          open
            ? 'bg-white/[0.08] text-white'
            : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
        }`}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-accent-amber text-black text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/[0.08] bg-[#131722] shadow-2xl shadow-black/60 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06]">
            <p className="text-xs font-semibold text-white">Project Invitations</p>
          </div>

          {incoming.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Bell size={20} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">No pending invitations</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {incoming.map(invite => (
                <div
                  key={invite.id}
                  className="px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {invite.project?.title ?? 'A project'}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        From <span className="text-zinc-400">{invite.inviter_profile?.name ?? 'Unknown'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => void handleRespond(invite.id, 'accepted')}
                      disabled={responding === invite.id}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Check size={11} />
                      Accept
                    </button>
                    <button
                      onClick={() => void handleRespond(invite.id, 'declined')}
                      disabled={responding === invite.id}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.04] hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-white/[0.08] hover:border-rose-500/25 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <X size={11} />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
