import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getActiveUserId } from '../lib/storage';
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
  logManualSession: (session: Omit<Session, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
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

// Starts empty. Sessions, streaks and the activity heatmap are all derived
// from what Supabase returns for the signed-in account — which is why a fresh
// account now shows a genuinely empty tracker instead of the last person's
// streak.
export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activity: [],
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
    if (!isSupabaseConfigured) return;

    try {
      const userId = await getActiveUserId();
      if (!userId) {
        set({ sessions: [], activity: [] });
        get().computeStreaks();
        return;
      }

      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false })
        .limit(500);

      if (!error) {
        const userSessions = (data as Session[]) ?? [];
        set({ sessions: userSessions, activity: recalculateActivity(userSessions) });
      }
      get().computeStreaks();
    } catch (err) {
      console.warn('[SessionStore] Fetch failed:', err);
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

  pauseTimer: () => set({ timerRunning: false }),

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
    } else if (timerSeconds <= 1) {
      set({ timerSeconds: 0, timerRunning: false });
      get().stopTimer();
    } else {
      set({ timerSeconds: timerSeconds - 1 });
    }
  },

  stopTimer: async () => {
    const { timerStart, timerCourseId, timerTopicId, timerMode, timerSeconds } = get();
    set({ timerRunning: false });

    const elapsedSeconds =
      timerMode === 'stopwatch' ? timerSeconds : MODE_DURATIONS[timerMode] - timerSeconds;

    const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));
    get().resetTimer();

    // Breaks are deliberately not logged; stopwatch time is real focus time
    // and is logged the same as a pomodoro.
    const isFocusMode = timerMode === 'pomodoro' || timerMode === 'stopwatch';
    if (durationMins >= 1 && isFocusMode) {
      const label = timerMode === 'pomodoro' ? 'Focus Pomodoro' : 'Focus Stopwatch';
      await get().logManualSession({
        course_id: timerCourseId || undefined,
        topic_id: timerTopicId || undefined,
        start_time: new Date(timerStart || Date.now() - durationMins * 60000).toISOString(),
        end_time: new Date().toISOString(),
        duration_mins: durationMins,
        notes: `${label} (${durationMins}m)`,
      });
    }
  },

  logManualSession: async (sessionData) => {
    const userId = await getActiveUserId();
    if (!userId) return;

    const newSession: Session = {
      ...sessionData,
      id: crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}`,
      user_id: userId,
      created_at: new Date().toISOString(),
    };

    const previous = get().sessions;
    const updatedSessions = [newSession, ...previous];
    set({ sessions: updatedSessions, activity: recalculateActivity(updatedSessions) });
    get().computeStreaks();

    const { error } = await supabase.from('sessions').insert(newSession);
    if (error) {
      console.warn('[SessionStore] Insert failed, rolling back:', error.message);
      set({ sessions: previous, activity: recalculateActivity(previous) });
      get().computeStreaks();
    }
  },

  deleteSession: async (id: string) => {
    const previous = get().sessions;
    const updated = previous.filter(s => s.id !== id);
    set({ sessions: updated, activity: recalculateActivity(updated) });
    get().computeStreaks();

    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) {
      console.warn('[SessionStore] Delete failed, rolling back:', error.message);
      set({ sessions: previous, activity: recalculateActivity(previous) });
      get().computeStreaks();
    }
  },

  updateSession: async (id: string, changes) => {
    const previous = get().sessions;
    const updated = previous.map(s => (s.id === id ? { ...s, ...changes } : s));
    set({ sessions: updated, activity: recalculateActivity(updated) });
    get().computeStreaks();

    const { error } = await supabase.from('sessions').update(changes).eq('id', id);
    if (error) {
      console.warn('[SessionStore] Update failed, rolling back:', error.message);
      set({ sessions: previous, activity: recalculateActivity(previous) });
      get().computeStreaks();
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
