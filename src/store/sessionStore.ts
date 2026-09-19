import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { storage, getActiveUserId } from '../lib/storage';
import type { Session, DailyActivity } from '../types';

export type TimerMode = 'pomodoro' | 'short_break' | 'long_break' | 'stopwatch';

const MODE_DURATIONS: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
  stopwatch: 0,
};

interface SessionState {
  sessions: Session[];
  activity: DailyActivity[];
  timerRunning: boolean;
  timerMode: TimerMode;
  timerStart: number | null;
  timerSeconds: number;
  timerCourseId: string | null;
  timerTopicId: string | null;
  currentStreak: number;
  longestStreak: number;
  weeklyMins: number;

  fetchSessions: () => Promise<void>;
  setTimerMode: (mode: TimerMode) => void;
  startTimer: (courseId?: string, topicId?: string) => void;
  pauseTimer: () => void;
  stopTimer: () => Promise<void>;
  resetTimer: () => void;
  tickTimer: () => void;
  logManualSession: (session: Omit<Session, 'id' | 'created_at'>) => Promise<void>;
  updateSession: (id: string, changes: Partial<Pick<Session, 'notes' | 'duration_mins' | 'start_time' | 'end_time'>>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  computeStreaks: () => void;
}

export const recalculateActivity = (sessions: Session[]): DailyActivity[] => {
  const map: Record<string, number> = {};
  for (const s of sessions) {
    if (!s.start_time) continue;
    const date = s.start_time.split('T')[0];
    map[date] = (map[date] || 0) + (s.duration_mins || 0);
  }
  return Object.entries(map).map(([date, total_mins]) => ({
    id: `act_${date}`,
    user_id: 'active',
    date,
    total_mins,
    topics_completed: 0,
    created_at: new Date().toISOString(),
  }));
};

const initialSessions = storage.get<Session[]>('sessions', []);
const initialActivity = recalculateActivity(initialSessions);

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: initialSessions,
  activity: initialActivity,
  timerRunning: false,
  timerMode: 'pomodoro',
  timerStart: null,
  timerSeconds: MODE_DURATIONS.pomodoro,
  timerCourseId: null,
  timerTopicId: null,
  currentStreak: 0,
  longestStreak: 0,
  weeklyMins: 0,

  fetchSessions: async () => {
    get().computeStreaks();

    if (!isSupabaseConfigured) {
      const localSessions = storage.get<Session[]>('sessions', []);
      const localActivity = recalculateActivity(localSessions);
      set({ sessions: localSessions, activity: localActivity });
      storage.set('activity', localActivity);
      get().computeStreaks();
      return;
    }

    try {
      const userId = await getActiveUserId();
      if (userId === 'local') {
        const localSessions = storage.get<Session[]>('sessions', []);
        const localActivity = recalculateActivity(localSessions);
        set({ sessions: localSessions, activity: localActivity });
        storage.set('activity', localActivity);
        get().computeStreaks();
        return;
      }

      // Authenticated user: fetch ONLY this user's sessions
      const { data: sessionsData, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false })
        .limit(200);

      if (!error) {
        const userSessions = (sessionsData as Session[]) || [];
        const userActivity = recalculateActivity(userSessions);
        set({ sessions: userSessions, activity: userActivity });
        storage.set('sessions', userSessions);
        storage.set('activity', userActivity);
      }
      get().computeStreaks();
    } catch (err) {
      console.warn('[SessionStore] Cloud sync note: running with local cache', err);
      get().computeStreaks();
    }
  },

  setTimerMode: (mode) => {
    set({
      timerMode: mode,
      timerRunning: false,
      timerSeconds: MODE_DURATIONS[mode],
      timerStart: null,
    });
  },

  startTimer: (courseId, topicId) => {
    set({
      timerRunning: true,
      timerStart: Date.now(),
      timerCourseId: courseId || get().timerCourseId,
      timerTopicId: topicId || get().timerTopicId,
    });
  },

  pauseTimer: () => {
    set({ timerRunning: false });
  },

  resetTimer: () => {
    const { timerMode } = get();
    set({
      timerRunning: false,
      timerStart: null,
      timerSeconds: MODE_DURATIONS[timerMode],
    });
  },

  tickTimer: () => {
    const { timerRunning, timerMode, timerSeconds } = get();
    if (!timerRunning) return;

    if (timerMode === 'stopwatch') {
      set({ timerSeconds: timerSeconds + 1 });
    } else {
      if (timerSeconds <= 1) {
        // Timer completed!
        set({ timerSeconds: 0, timerRunning: false });
        get().stopTimer();
      } else {
        set({ timerSeconds: timerSeconds - 1 });
      }
    }
  },

  stopTimer: async () => {
    const { timerStart, timerCourseId, timerTopicId, timerMode, timerSeconds } = get();
    set({ timerRunning: false });

    let elapsedSeconds = 0;
    if (timerMode === 'stopwatch') {
      elapsedSeconds = timerSeconds;
    } else {
      elapsedSeconds = MODE_DURATIONS[timerMode] - timerSeconds;
    }

    const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));
    get().resetTimer();

    if (durationMins >= 1 && timerMode === 'pomodoro') {
      await get().logManualSession({
        user_id: 'local',
        course_id: timerCourseId || undefined,
        topic_id: timerTopicId || undefined,
        start_time: new Date(timerStart || Date.now() - durationMins * 60000).toISOString(),
        end_time: new Date().toISOString(),
        duration_mins: durationMins,
        notes: `Focus Pomodoro (${durationMins}m)`,
      });
    }
  },

  logManualSession: async (sessionData) => {
    const userId = await getActiveUserId();
    const newSession: Session = {
      ...sessionData,
      id: crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}`,
      user_id: userId,
      created_at: new Date().toISOString(),
    };

    const updatedSessions = [newSession, ...get().sessions];
    const updatedActivity = recalculateActivity(updatedSessions);
    set({ sessions: updatedSessions, activity: updatedActivity });
    storage.set('sessions', updatedSessions);
    storage.set('activity', updatedActivity);
    get().computeStreaks();

    if (isSupabaseConfigured && userId !== 'local') {
      try {
        await supabase.from('sessions').insert({
          ...newSession,
          user_id: userId,
        });
      } catch (err) {
        console.warn('[SessionStore] Background sync failed, stored locally:', err);
      }
    }
  },

  deleteSession: async (id: string) => {
    const updated = get().sessions.filter(s => s.id !== id);
    const updatedActivity = recalculateActivity(updated);
    set({ sessions: updated, activity: updatedActivity });
    storage.set('sessions', updated);
    storage.set('activity', updatedActivity);
    get().computeStreaks();

    if (isSupabaseConfigured) {
      try {
        await supabase.from('sessions').delete().eq('id', id);
      } catch (err) {
        console.warn('[SessionStore] Delete sync failed:', err);
      }
    }
  },

  updateSession: async (id: string, changes) => {
    const updated = get().sessions.map(s => s.id === id ? { ...s, ...changes } : s);
    const updatedActivity = recalculateActivity(updated);
    set({ sessions: updated, activity: updatedActivity });
    storage.set('sessions', updated);
    storage.set('activity', updatedActivity);
    get().computeStreaks();

    if (isSupabaseConfigured) {
      try {
        await supabase.from('sessions').update(changes).eq('id', id);
      } catch (err) {
        console.warn('[SessionStore] Update sync failed:', err);
      }
    }
  },

  computeStreaks: () => {
    const { activity } = get();
    const daySet = new Set(activity.filter(a => a.total_mins > 0).map(a => a.date));
    let current = 0, longest = 0, streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      if (daySet.has(iso)) {
        streak++;
        if (i <= 1) current = streak;
        if (streak > longest) longest = streak;
      } else {
        if (i <= 1) current = 0;
        streak = 0;
      }
    }

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    const weekIso = weekStart.toISOString().split('T')[0];
    const weekMins = activity
      .filter(a => a.date >= weekIso)
      .reduce((s, a) => s + (a.total_mins || 0), 0);

    set({ currentStreak: current, longestStreak: longest, weeklyMins: weekMins });
  },
}));
