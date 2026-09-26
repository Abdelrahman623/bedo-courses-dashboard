import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getActiveUserId } from '../lib/storage';
import type { ProjectInvite, Profile, ProjectMember, ProjectRole } from '../types';

interface InvitesState {
  /** Pending invites addressed to the current user */
  incoming: ProjectInvite[];
  /** Invites sent by the owner/super_admin, keyed by project_id */
  outgoing: Record<string, ProjectInvite[]>;
  /** Accepted collaborator members with roles, keyed by project_id */
  collaborators: Record<string, ProjectMember[]>;
  /** Count of unread pending incoming invites */
  unreadCount: number;

  fetchIncoming: () => Promise<void>;
  fetchOutgoing: (projectId: string) => Promise<void>;
  fetchCollaborators: (projectId: string) => Promise<void>;
  sendInvite: (projectId: string, inviteeId: string, role?: ProjectRole) => Promise<{ error?: string }>;
  respondToInvite: (inviteId: string, status: 'accepted' | 'declined') => Promise<void>;
  revokeInvite: (inviteId: string) => Promise<void>;
  /** Remove an accepted collaborator from a project (owner or super_admin) */
  removeCollaborator: (projectId: string, collaboratorId: string) => Promise<{ error?: string }>;
  /** Update a collaborator's role (owner or super_admin) */
  updateMemberRole: (projectId: string, collaboratorId: string, newRole: ProjectRole) => Promise<{ error?: string }>;
  /** Withdraw / leave a shared project (invitee only) */
  leaveProject: (projectId: string) => Promise<{ error?: string }>;
  markRead: () => void;

  /** Search profiles by username or name prefix (for the invite search box) */
  searchProfiles: (query: string) => Promise<Profile[]>;
  /** Start listening for real-time invite changes for the current user */
  subscribeIncoming: () => (() => void);
}


export const useInvitesStore = create<InvitesState>((set, get) => ({
  incoming: [],
  outgoing: {},
  collaborators: {},
  unreadCount: 0,

  fetchIncoming: async () => {
    if (!isSupabaseConfigured) return;
    const userId = await getActiveUserId();
    if (!userId) return;

    const { data, error } = await supabase
      .from('project_invites')
      .select(`
        id, project_id, inviter_id, invitee_id, status, role, created_at, updated_at,
        inviter_profile:profiles!project_invites_inviter_id_fkey(id, name, username, avatar_url),
        invitee_profile:profiles!project_invites_invitee_id_fkey(id, name, username, avatar_url),
        project:projects!project_invites_project_id_fkey(id, title)
      `)
      .eq('invitee_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[InvitesStore] fetchIncoming failed:', error.message, error);
      // Fallback: fetch without joins so at least the invite shows up
      const { data: plain } = await supabase
        .from('project_invites')
        .select('*')
        .eq('invitee_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      const invites = (plain ?? []) as ProjectInvite[];
      set({ incoming: invites, unreadCount: invites.length });
      return;
    }

    const invites = (data ?? []) as unknown as ProjectInvite[];
    set({ incoming: invites, unreadCount: invites.length });
  },

  fetchOutgoing: async (projectId) => {
    if (!isSupabaseConfigured) return;

    const { data, error } = await supabase
      .from('project_invites')
      .select(`
        id, project_id, inviter_id, invitee_id, status, role, created_at, updated_at,
        invitee_profile:profiles!project_invites_invitee_id_fkey(id, name, username, avatar_url)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[InvitesStore] fetchOutgoing failed:', error.message);
      return;
    }

    set(s => ({
      outgoing: { ...s.outgoing, [projectId]: (data ?? []) as unknown as ProjectInvite[] },
    }));
  },

  fetchCollaborators: async (projectId) => {
    if (!isSupabaseConfigured) return;

    const { data, error } = await supabase
      .from('project_invites')
      .select(`
        role,
        invitee_id,
        invitee_profile:profiles!project_invites_invitee_id_fkey(id, name, username, avatar_url)
      `)
      .eq('project_id', projectId)
      .eq('status', 'accepted');

    if (error) {
      console.warn('[InvitesStore] fetchCollaborators failed:', error.message);
    }

    const members: ProjectMember[] = (data ?? [])
      .filter((r: any) => Boolean(r.invitee_profile))
      .map((r: any) => ({
        id: r.invitee_profile.id,
        name: r.invitee_profile.name,
        username: r.invitee_profile.username,
        avatar_url: r.invitee_profile.avatar_url,
        role: (r.role as ProjectRole) || 'partner',
      }));

    // Fetch the project owner so they appear in the members list at the very top
    try {
      const { data: projData } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .maybeSingle();

      if (projData?.user_id && projData.user_id !== 'local') {
        const { data: ownerProf } = await supabase
          .from('profiles')
          .select('id, name, username, avatar_url')
          .eq('id', projData.user_id)
          .maybeSingle();
        if (ownerProf) {
          const ownerMember: ProjectMember = {
            id: ownerProf.id,
            name: ownerProf.name,
            username: ownerProf.username,
            avatar_url: ownerProf.avatar_url,
            role: 'owner',
          };
          const others = members.filter(m => m.id !== ownerMember.id);
          set(s => ({
            collaborators: { ...s.collaborators, [projectId]: [ownerMember, ...others] },
          }));
          return;
        }
      }
    } catch {
      // ignore
    }

    set(s => ({
      collaborators: { ...s.collaborators, [projectId]: members },
    }));
  },

  sendInvite: async (projectId, inviteeId, role: ProjectRole = 'partner') => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' };
    const userId = await getActiveUserId();
    if (!userId) return { error: 'Not signed in' };
    if (inviteeId === userId) return { error: 'You cannot invite yourself' };

    // Check for an existing invite (pending or accepted)
    const existing = get().outgoing[projectId]?.find(
      i => i.invitee_id === inviteeId && i.status !== 'declined',
    );
    if (existing) return { error: 'An invite already exists for this user' };

    const now = new Date().toISOString();
    const invite: Omit<ProjectInvite, 'inviter_profile' | 'invitee_profile' | 'project'> = {
      id: crypto.randomUUID(),
      project_id: projectId,
      inviter_id: userId,
      invitee_id: inviteeId,
      status: 'pending',
      role: role || 'partner',
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase.from('project_invites').insert(invite);
    if (error) {
      console.warn('[InvitesStore] sendInvite failed:', error.message);
      return { error: error.message };
    }

    // Refresh outgoing for this project
    await get().fetchOutgoing(projectId);
    return {};
  },


  respondToInvite: async (inviteId, status) => {
    if (!isSupabaseConfigured) return;
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('project_invites')
      .update({ status, updated_at: now })
      .eq('id', inviteId);

    if (error) {
      console.warn('[InvitesStore] respondToInvite failed:', error.message);
      return;
    }

    // Remove from incoming list
    set(s => ({
      incoming: s.incoming.filter(i => i.id !== inviteId),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
  },

  revokeInvite: async (inviteId) => {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase
      .from('project_invites')
      .delete()
      .eq('id', inviteId);

    if (error) {
      console.warn('[InvitesStore] revokeInvite failed:', error.message);
      return;
    }

    set(s => {
      const updatedOutgoing = { ...s.outgoing };
      for (const pid of Object.keys(updatedOutgoing)) {
        updatedOutgoing[pid] = updatedOutgoing[pid].filter(i => i.id !== inviteId);
      }
      return { outgoing: updatedOutgoing };
    });
  },

  removeCollaborator: async (projectId, collaboratorId) => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' };

    // Try RPC first for security definer permissions
    const { error: rpcErr } = await supabase.rpc('remove_project_member', {
      p_project_id: projectId,
      p_user_id: collaboratorId,
    });

    if (rpcErr) {
      // Fallback to direct delete
      const { error } = await supabase
        .from('project_invites')
        .delete()
        .eq('project_id', projectId)
        .eq('invitee_id', collaboratorId);

      if (error) {
        console.warn('[InvitesStore] removeCollaborator failed:', error.message);
        return { error: error.message };
      }
    }

    // Update local state — remove from collaborators and outgoing
    set(s => ({
      collaborators: {
        ...s.collaborators,
        [projectId]: (s.collaborators[projectId] ?? []).filter(p => p.id !== collaboratorId),
      },
      outgoing: {
        ...s.outgoing,
        [projectId]: (s.outgoing[projectId] ?? []).filter(i => i.invitee_id !== collaboratorId),
      },
    }));

    return {};
  },

  updateMemberRole: async (projectId, collaboratorId, newRole) => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' };

    // Try RPC first for security definer permissions
    const { error: rpcErr } = await supabase.rpc('update_project_member_role', {
      p_project_id: projectId,
      p_user_id: collaboratorId,
      p_new_role: newRole,
    });

    if (rpcErr) {
      // Fallback to direct update
      const { error } = await supabase
        .from('project_invites')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .eq('invitee_id', collaboratorId);

      if (error) {
        console.warn('[InvitesStore] updateMemberRole failed:', error.message);
        return { error: error.message };
      }
    }

    // Update local state in collaborators and outgoing
    set(s => ({
      collaborators: {
        ...s.collaborators,
        [projectId]: (s.collaborators[projectId] ?? []).map(m =>
          m.id === collaboratorId ? { ...m, role: newRole } : m
        ),
      },
      outgoing: {
        ...s.outgoing,
        [projectId]: (s.outgoing[projectId] ?? []).map(i =>
          i.invitee_id === collaboratorId ? { ...i, role: newRole } : i
        ),
      },
    }));

    return {};
  },


  leaveProject: async (projectId: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase not configured' };
    const userId = await getActiveUserId();
    if (!userId) return { error: 'Not signed in' };

    const { error } = await supabase
      .from('project_invites')
      .delete()
      .eq('project_id', projectId)
      .eq('invitee_id', userId);

    if (error) {
      console.warn('[InvitesStore] leaveProject failed:', error.message);
      return { error: error.message };
    }

    set(s => ({
      collaborators: {
        ...s.collaborators,
        [projectId]: (s.collaborators[projectId] ?? []).filter(p => p.id !== userId),
      },
    }));

    return {};
  },

  markRead: () => set({ unreadCount: 0 }),



  searchProfiles: async (query) => {
    if (!isSupabaseConfigured || !query.trim()) return [];
    const q = query.trim();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .or(`username.ilike.%${q}%,name.ilike.%${q}%`)
      .limit(8);

    if (error) {
      console.warn('[InvitesStore] searchProfiles failed:', error.message);
      return [];
    }
    return (data ?? []) as Profile[];
  },

  subscribeIncoming: () => {
    if (!isSupabaseConfigured) return () => {};

    let userId: string | null = null;

    const setupChannel = async () => {
      userId = await getActiveUserId();
      if (!userId) return;

      const channel = supabase
        .channel(`invite-incoming-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'project_invites',
            filter: `invitee_id=eq.${userId}`,
          },
          () => {
            // Re-fetch to get joined data
            void get().fetchIncoming();
          },
        )
        .subscribe();

      return channel;
    };

    let channelPromise = setupChannel();

    return () => {
      channelPromise.then(ch => {
        if (ch) supabase.removeChannel(ch);
      });
    };
  },
}));
