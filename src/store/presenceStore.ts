import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { PresenceCursor } from '../types';

// ─── Cursor color assignment ──────────────────────────────────────────────────
const CURSOR_COLORS = [
  '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6',
  '#EF4444', '#06B6D4', '#F97316', '#EC4899',
];

export function getCursorColor(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = userId.charCodeAt(i) + ((h << 5) - h);
  }
  return CURSOR_COLORS[Math.abs(h) % CURSOR_COLORS.length];
}

// ─── Throttle helper ─────────────────────────────────────────────────────────
function throttle<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let last = 0;
  return ((...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  }) as T;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export interface PresenceUser {
  userId: string;
  name: string;
  color: string;
}

interface PresenceState {
  /** Remote cursors, keyed by userId */
  cursors: Map<string, PresenceCursor>;
  /** Online users in the project presence room */
  onlineUsers: PresenceUser[];
  /** ID of the project whose channel is currently active */
  activeProjectId: string | null;

  joinChannel: (projectId: string, userId: string, name: string) => void;
  leaveChannel: () => void;
  /** Call this with SVG-space (canvas) coordinates */
  broadcastCursor: (x: number, y: number) => void;
  /** Broadcast a live project action (e.g. milestone item toggled) */
  broadcastAction: (action: string, data: any) => void;
  /** Listen for live project actions */
  onAction: (callback: (action: string, data: any) => void) => () => void;
}

// Keep channel ref outside the store to avoid serialization issues
let _channel: ReturnType<typeof supabase.channel> | null = null;
let _broadcastFn: ((x: number, y: number) => void) | null = null;
let _currentUserId: string | null = null;
const _actionListeners = new Set<(action: string, data: any) => void>();

export const usePresenceStore = create<PresenceState>((set) => ({
  cursors: new Map(),
  onlineUsers: [],
  activeProjectId: null,

  joinChannel: (projectId, userId, name) => {
    if (!isSupabaseConfigured) return;

    // Leave any previous channel first
    if (_channel) {
      supabase.removeChannel(_channel);
      _channel = null;
    }

    _currentUserId = userId;
    const color = getCursorColor(userId);
    const channelName = `project-presence:${projectId}`;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    const updateOnlineUsers = () => {
      const state = channel.presenceState<{ name: string; color?: string }>();
      const users: PresenceUser[] = [];
      for (const [key, presences] of Object.entries(state)) {
        const p = presences[0];
        if (p) {
          users.push({
            userId: key,
            name: p.name || 'Collaborator',
            color: p.color || getCursorColor(key),
          });
        }
      }
      set({ onlineUsers: users });
    };

    // ── Presence sync: track who is online ───────────────────────────────────
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{ name: string; color?: string }>();
      updateOnlineUsers();
      set(s => {
        const next = new Map(s.cursors);
        // Remove cursors for users no longer present
        const onlineKeys = new Set(Object.keys(state));
        for (const key of next.keys()) {
          if (!onlineKeys.has(key) && key !== userId) next.delete(key);
        }
        return { cursors: next };
      });
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      updateOnlineUsers();
      set(s => {
        const next = new Map(s.cursors);
        (leftPresences as Array<{ presence_ref: string; key: string }>).forEach(p => {
          next.delete(p.key);
        });
        return { cursors: next };
      });
    });

    // ── Broadcast: receive remote cursor moves ────────────────────────────────
    channel.on('broadcast', { event: 'cursor' }, (payload: {
      payload: { userId: string; name: string; color: string; x: number; y: number };
    }) => {
      const { userId: uid, name: n, color: c, x, y } = payload.payload;
      if (uid === userId) return; // ignore own echoes
      set(s => {
        const next = new Map(s.cursors);
        next.set(uid, { userId: uid, name: n, color: c, x, y, updatedAt: Date.now() });
        return { cursors: next };
      });
    });

    // ── Broadcast: receive project action updates ─────────────────────────────
    channel.on('broadcast', { event: 'project_action' }, (payload: {
      payload: { action: string; data: any; senderId: string };
    }) => {
      const { action, data, senderId } = payload.payload;
      if (senderId === userId) return; // ignore own echoes
      _actionListeners.forEach(cb => {
        try { cb(action, data); } catch (e) { console.error('[Presence] listener error:', e); }
      });
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ name, color });
      }
    });

    _channel = channel;
    set({ activeProjectId: projectId, cursors: new Map(), onlineUsers: [{ userId, name, color }] });

    // Create a throttled broadcast function bound to this channel/user
    const rawBroadcast = (x: number, y: number) => {
      if (!_channel) return;
      void _channel.send({
        type: 'broadcast',
        event: 'cursor',
        payload: { userId, name, color, x, y },
      });
    };

    _broadcastFn = throttle(rawBroadcast, 50);
  },

  leaveChannel: () => {
    if (_channel) {
      void _channel.untrack();
      supabase.removeChannel(_channel);
      _channel = null;
    }
    _broadcastFn = null;
    _currentUserId = null;
    set({ activeProjectId: null, cursors: new Map(), onlineUsers: [] });
  },

  broadcastCursor: (x, y) => {
    _broadcastFn?.(x, y);
  },

  broadcastAction: (action, data) => {
    if (!_channel || !_currentUserId) return;
    void _channel.send({
      type: 'broadcast',
      event: 'project_action',
      payload: { action, data, senderId: _currentUserId },
    });
  },

  onAction: (callback) => {
    _actionListeners.add(callback);
    return () => { _actionListeners.delete(callback); };
  },
}));
