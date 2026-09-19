import React, { useEffect, useState } from 'react';
import {
  Play, Pause, RotateCcw, Plus, Target,
  CheckCircle2, Trash2, BookOpen, Pencil, Save, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useSessionStore, type TimerMode } from '../store/sessionStore';
import { useRoadmapStore } from '../store/roadmapStore';
import { hhmm, minsToHHMM, getAccentColor } from '../lib/utils';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getLast7Days(activity: { date: string; total_mins: number }[]) {
  const actMap = Object.fromEntries(activity.map(a => [a.date, a.total_mins]));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().split('T')[0];
    return {
      day: DAY_LABELS[d.getDay()],
      date: iso,
      hours: +((actMap[iso] || 0) / 60).toFixed(2),
    };
  });
}

export const Tracker: React.FC = () => {
  const {
    sessions, activity, timerRunning, timerMode, timerSeconds, weeklyMins,
    currentStreak, longestStreak, startTimer, pauseTimer, stopTimer, resetTimer,
    tickTimer, setTimerMode, logManualSession, deleteSession, updateSession, fetchSessions,
  } = useSessionStore();

  const { localNodes } = useRoadmapStore();

  const [selectedTopic, setSelectedTopic] = useState<string>(() => {
    const inProg = localNodes.find(n => n.status === 'in_progress');
    return inProg ? inProg.label : 'General Focus';
  });

  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    date: new Date().toISOString().split('T')[0],
    duration_mins: 25,
    notes: '',
  });

  // Edit existing session state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ notes: '', duration_mins: 25 });

  const weekGoal = 10; // hours
  const weeklyHours = +(weeklyMins / 60).toFixed(1);
  const goalPct = Math.min(Math.round((weeklyHours / weekGoal) * 100), 100);
  const chartData = getLast7Days(activity);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Real-time ticking interval
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, tickTimer]);

  // Mode total durations
  const totalModeSecs: Record<TimerMode, number> = {
    pomodoro: 25 * 60,
    short_break: 5 * 60,
    long_break: 15 * 60,
    stopwatch: 60 * 60,
  };

  const currentTotal = totalModeSecs[timerMode];
  const progressPct =
    timerMode === 'stopwatch'
      ? Math.min((timerSeconds / 3600) * 100, 100)
      : Math.max(0, Math.min(((currentTotal - timerSeconds) / currentTotal) * 100, 100));

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await logManualSession({
      user_id: 'local',
      start_time: `${manualForm.date}T09:00:00Z`,
      end_time: `${manualForm.date}T09:30:00Z`,
      duration_mins: Number(manualForm.duration_mins),
      notes: manualForm.notes || `Focus: ${selectedTopic}`,
    });
    setShowManual(false);
    setManualForm({
      date: new Date().toISOString().split('T')[0],
      duration_mins: 25,
      notes: '',
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Focus Instrument & Time Tracker</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Pomodoro workflow · Track daily study cadence and build relentless consistency
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setShowManual(true)}
          >
            Log Past Session
          </Button>
        </div>
      </div>

      {/* ── Main Two-Column Layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN (5 cols): The Focus Instrument ───────────── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#131722] border border-white/[0.08] rounded-xl p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            {/* Mode Switcher Segmented Control */}
            <div className="grid grid-cols-4 bg-[#0A0D14] border border-white/[0.08] rounded-lg p-1 gap-1 mb-6">
              {(
                [
                  { id: 'pomodoro', label: 'Pomodoro' },
                  { id: 'short_break', label: 'Short' },
                  { id: 'long_break', label: 'Long' },
                  { id: 'stopwatch', label: 'Stopwatch' },
                ] as const
              ).map(m => (
                <button
                  key={m.id}
                  onClick={() => setTimerMode(m.id)}
                  className={`py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer select-none text-center ${
                    timerMode === m.id
                      ? 'bg-white/[0.08] text-white shadow-sm border border-white/[0.06]'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Circular Timer Instrument */}
            <div className="flex flex-col items-center justify-center my-4">
              <div className="relative flex items-center justify-center w-56 h-56">
                {/* SVG Progress Arc */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 220 220">
                  {/* Outer subtle guide ring */}
                  <circle
                    cx="110"
                    cy="110"
                    r="96"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.04)"
                    strokeWidth="6"
                  />
                  {/* Dynamic Progress Stroke */}
                  <circle
                    cx="110"
                    cy="110"
                    r="96"
                    fill="none"
                    stroke={timerMode === 'pomodoro' ? getAccentColor() : '#00C896'}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 96}
                    strokeDashoffset={2 * Math.PI * 96 * (1 - progressPct / 100)}
                    className="transition-all duration-300 ease-out"
                  />
                </svg>

                {/* Inner Face Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="font-mono text-4xl font-bold tracking-tight text-white tabular-nums">
                    {hhmm(timerSeconds)}
                  </span>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        timerRunning
                          ? 'bg-[#00C896] animate-pulse'
                          : 'bg-zinc-600'
                      }`}
                    />
                    <span className="text-[11px] font-medium text-zinc-400">
                      {timerRunning ? 'Session Active' : 'Ready to Focus'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {!timerRunning ? (
                <Button
                  variant="primary"
                  size="md"
                  className="px-6 font-semibold"
                  icon={<Play size={15} className="fill-current" />}
                  onClick={() => startTimer()}
                >
                  Start Focus
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="md"
                  className="px-6 font-semibold border-amber-500/30 text-accent-amber"
                  icon={<Pause size={15} />}
                  onClick={() => pauseTimer()}
                >
                  Pause
                </Button>
              )}

              <Button
                variant="outline"
                size="md"
                className="text-zinc-400 hover:text-white"
                icon={<RotateCcw size={14} />}
                onClick={() => resetTimer()}
                title="Reset timer"
              />

              <Button
                variant="outline"
                size="md"
                className="text-zinc-400 hover:text-emerald-400"
                icon={<CheckCircle2 size={14} />}
                onClick={() => stopTimer()}
                title="Complete & Save Session"
              >
                Done
              </Button>
            </div>

            {/* Subject Selector */}
            <div className="mt-6 pt-4 border-t border-white/[0.06]">
              <label className="block text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1.5">
                Current Topic / Subject
              </label>
              <div className="flex items-center gap-2 bg-[#0A0D14] border border-white/[0.08] rounded-lg px-3 py-2 text-xs">
                <BookOpen size={14} className="text-accent-amber flex-shrink-0" />
                <input
                  type="text"
                  value={selectedTopic}
                  onChange={e => setSelectedTopic(e.target.value)}
                  className="bg-transparent text-white w-full outline-none placeholder:text-zinc-600"
                  placeholder="What are you studying right now?"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (7 cols): Goal, Analytics & Ledger ──────── */}
        <div className="lg:col-span-7 space-y-4">
          {/* KPI Strip (Unified Container, No Nested Cards) */}
          <div className="bg-[#131722] border border-white/[0.08] rounded-xl overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <div className="grid grid-cols-3 divide-x divide-white/[0.08]">
              {/* Metric 1 */}
              <div className="p-4">
                <span className="text-[11px] font-medium text-zinc-400 block">Weekly Total</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                    {weeklyHours}
                  </span>
                  <span className="text-xs text-zinc-500">hours</span>
                </div>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">{minsToHHMM(weeklyMins)} study time</span>
              </div>

              {/* Metric 2 */}
              <div className="p-4">
                <span className="text-[11px] font-medium text-zinc-400 block">Current Streak</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono tracking-tight text-accent-amber tabular-nums">
                    {currentStreak}
                  </span>
                  <span className="text-xs text-zinc-500">days</span>
                </div>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">Record: {longestStreak} days</span>
              </div>

              {/* Metric 3 */}
              <div className="p-4">
                <span className="text-[11px] font-medium text-zinc-400 block">Total Sessions</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                    {sessions.length}
                  </span>
                  <span className="text-xs text-zinc-500">logged</span>
                </div>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">Recorded in database</span>
              </div>
            </div>
          </div>

          {/* Weekly Goal Progress Strip */}
          <Card padding="p-4" hover={false}>
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-1.5 font-medium text-white">
                <Target size={14} className="text-[#00C896]" />
                <span>Weekly Mastery Goal</span>
              </div>
              <span className="font-mono text-zinc-300 font-semibold">
                {weeklyHours}h <span className="text-zinc-500 font-normal">/ {weekGoal}h ({goalPct}%)</span>
              </span>
            </div>
            <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00C896] rounded-full transition-all duration-500"
                style={{ width: `${goalPct}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-zinc-500 mt-2">
              <span>{Math.max(0, +(weekGoal - weeklyHours).toFixed(1))}h remaining this week</span>
              <span className="text-zinc-400 font-mono">Pace: {weeklyHours > 2 ? 'On Track' : 'Needs Focus'}</span>
            </div>
          </Card>

          {/* 7-Day Study Hours Bar Chart */}
          <Card padding="p-4" hover={false}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Daily Study Distribution
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Hours studied per day over the last 7 days</p>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {chartData.reduce((acc, c) => acc + c.hours, 0).toFixed(1)}h 7-day total
              </span>
            </div>

            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 0, left: -25, bottom: 0 }}>
                  <XAxis
                    dataKey="day"
                    stroke="#52525B"
                    tick={{ fill: '#A1A1AA', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#52525B"
                    tick={{ fill: '#71717A', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const val = payload[0].value as number;
                      return (
                        <div className="bg-[#161B26] border border-white/[0.12] rounded-lg px-2.5 py-1.5 text-xs shadow-xl">
                          <p className="font-semibold text-white">{payload[0].payload.day} ({payload[0].payload.date})</p>
                          <p className="text-accent-amber font-mono mt-0.5">{val} hours</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={36}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.hours > 0 ? getAccentColor() : 'rgba(255,255,255,0.06)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recent Sessions Ledger */}
          <Card padding="p-4" hover={false}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Recent Sessions Ledger
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">
                {sessions.length} total logged
              </span>
            </div>

            {sessions.length === 0 ? (
              <p className="text-xs text-zinc-600 py-4 text-center">
                No sessions logged yet. Start the focus timer above or click Log Past Session!
              </p>
            ) : (
              <div className="divide-y divide-white/[0.06] max-h-64 overflow-y-auto pr-1">
                {sessions.slice(0, 10).map(s => {
                  const isEditing = editingSessionId === s.id;
                  return (
                    <div key={s.id} className="py-2.5 text-xs group">
                      {isEditing ? (
                        /* ── Inline edit form ── */
                        <div className="space-y-2 py-1">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editForm.notes}
                              onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                              placeholder="Session notes / topic"
                              className="flex-1 bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                            />
                            <input
                              type="number"
                              min={1}
                              max={600}
                              value={editForm.duration_mins}
                              onChange={e => setEditForm(f => ({ ...f, duration_mins: Number(e.target.value) }))}
                              className="w-20 bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-2 py-1.5 text-xs text-white font-mono outline-none"
                            />
                            <span className="text-zinc-500 flex items-center text-[10px]">min</span>
                          </div>
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => setEditingSessionId(null)}
                              className="flex items-center gap-1 px-2 py-1 rounded-md text-zinc-400 hover:text-white text-[10px] border border-white/[0.08] hover:border-white/[0.15] transition-all cursor-pointer"
                            >
                              <X size={11} /> Cancel
                            </button>
                            <button
                              onClick={async () => {
                                await updateSession(s.id, { notes: editForm.notes, duration_mins: editForm.duration_mins });
                                setEditingSessionId(null);
                              }}
                              className="flex items-center gap-1 px-2 py-1 rounded-md text-accent-amber bg-accent-amber/10 hover:bg-accent-amber/20 text-[10px] border border-accent-amber/20 transition-all cursor-pointer"
                            >
                              <Save size={11} /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Normal row ── */
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-amber flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-white truncate">
                                {s.notes || 'Focus Study Session'}
                              </p>
                              <p className="text-[10px] text-zinc-500 font-mono">
                                {new Date(s.start_time).toLocaleDateString()} · {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-mono text-zinc-300 font-semibold">
                              {s.duration_mins}m
                            </span>
                            <button
                              onClick={() => { setEditingSessionId(s.id); setEditForm({ notes: s.notes || '', duration_mins: s.duration_mins }); }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-accent-amber transition-all cursor-pointer"
                              title="Edit session"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => deleteSession(s.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-rose-400 transition-all cursor-pointer"
                              title="Delete session"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Manual Entry Modal */}
      <Modal open={showManual} onClose={() => setShowManual(false)} title="Log Study Session" width="max-w-md">
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Date</label>
            <input
              type="date"
              className="w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 text-sm text-white outline-none font-mono"
              value={manualForm.date}
              onChange={e => setManualForm(f => ({ ...f, date: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Duration (Minutes)</label>
            <input
              type="number"
              min={5}
              max={600}
              className="w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 text-sm text-white outline-none font-mono"
              value={manualForm.duration_mins}
              onChange={e => setManualForm(f => ({ ...f, duration_mins: Number(e.target.value) }))}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Study Notes / Topic</label>
            <input
              type="text"
              className="w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none"
              value={manualForm.notes}
              onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Pandas Data Cleaning exercises"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowManual(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Log Session
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
