import React, { useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, Cell,
} from 'recharts';
import { Card } from '../components/ui/Card';
import { useSessionStore } from '../store/sessionStore';
import { useRoadmapStore } from '../store/roadmapStore';
import { minsToHHMM, pct, getAccentColor } from '../lib/utils';
import { getThemeColors } from '../lib/themes';

const chartStyle = {
  contentStyle: {
    background: '#161B26',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#FFFFFF',
    borderRadius: 8,
    fontSize: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  },
  gridStroke: 'rgba(255,255,255,0.05)',
  tickFill: '#A1A1AA',
};

function buildVelocityData(nodes: { completedAt?: string }[]) {
  const dayCounts: Record<string, number> = {};
  for (const n of nodes) {
    if (!n.completedAt) continue;
    const iso = n.completedAt.split('T')[0];
    dayCounts[iso] = (dayCounts[iso] || 0) + 1;
  }
  return Array.from({ length: 12 }, (_, wi) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (11 - wi) * 7);
    let total = 0;
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + d);
      const iso = day.toISOString().split('T')[0];
      total += dayCounts[iso] || 0;
    }
    return { week: `W${wi + 1}`, topics: total };
  });
}

export const Analytics: React.FC = () => {
  const { sessions, currentStreak, longestStreak, fetchSessions } = useSessionStore();
  const { localNodes } = useRoadmapStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Live accent color — reads CSS variable so theme changes apply to charts
  const accent = getAccentColor();
  const { secondary, tertiary } = getThemeColors();

  const totalTopics = localNodes.length;
  const completedTopics = localNodes.filter(n => n.status === 'completed').length;
  const overallPct = pct(completedTopics, totalTopics);
  const totalMins = sessions.reduce((s, sess) => s + (sess.duration_mins || 0), 0);

  // Driven by each topic's `completedAt` timestamp, not session time —
  // finishing a topic and logging study time are different events, and
  // conflating them (as this used to, via the session-derived `activity`
  // list) is why this chart, the pace figure and the projected-completion
  // date below were always stuck at zero regardless of actual progress.
  const velocityData = useMemo(() => buildVelocityData(localNodes), [localNodes]);

  // Radar: % complete per phase
  const radarData = useMemo(() => {
    const phases = ['Foundation', 'Excel', 'SQL & Programming', 'Data Handling', 'Analytics', 'Advanced'];
    return phases.map(phase => {
      const phaseNodes = localNodes.filter(n => n.phase === phase);
      const done = phaseNodes.filter(n => n.status === 'completed').length;
      return { subject: phase.replace(' & ', ' &\n'), value: pct(done, phaseNodes.length || 1) };
    });
  }, [localNodes]);

  // Estimated completion
  const recentTopics = velocityData.slice(-4).reduce((s, w) => s + w.topics, 0);
  const weeklyPace = recentTopics / 4;
  const remaining = totalTopics - completedTopics;
  const weeksLeft = weeklyPace > 0 ? Math.ceil(remaining / weeklyPace) : null;
  const completionDate = weeksLeft
    ? new Date(Date.now() + weeksLeft * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  // Sessions by day of week
  const dayOfWeekData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = days.map(d => ({ day: d, sessions: 0 }));
    sessions.forEach(s => {
      const dow = new Date(s.start_time).getDay();
      counts[dow].sessions++;
    });
    return counts;
  }, [sessions]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Learning Velocity & Performance Analytics</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Data-driven insights into your mastery pace, curriculum coverage, and study distribution
          </p>
        </div>
      </div>

      {/* ── KPI Strip (Unified Container, No Nested Cards) ─────────── */}
      <div className="bg-[#131722] border border-white/[0.08] rounded-xl overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
          <div className="p-4">
            <span className="text-xs text-zinc-400 font-medium">Curriculum Covered</span>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-accent-amber tabular-nums">
                {overallPct}%
              </span>
              <span className="text-xs text-zinc-500 font-mono">({completedTopics}/{totalTopics})</span>
            </div>
            <span className="text-[11px] text-zinc-500 block">Total roadmap topics</span>
          </div>

          <div className="p-4">
            <span className="text-xs text-zinc-400 font-medium">Total Study Logged</span>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-accent-secondary tabular-nums">
                {minsToHHMM(totalMins)}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 block">{sessions.length} recorded sessions</span>
          </div>

          <div className="p-4">
            <span className="text-xs text-zinc-400 font-medium">Active Cadence</span>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-accent-highlight tabular-nums">
                {currentStreak}
              </span>
              <span className="text-xs text-zinc-500">days streak</span>
            </div>
            <span className="text-[11px] text-zinc-500 block">Longest: {longestStreak} days</span>
          </div>

          <div className="p-4">
            <span className="text-xs text-zinc-400 font-medium">Projected Completion</span>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-lg font-bold font-mono text-accent-tertiary truncate">
                {completionDate || 'Calculating...'}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 block">
              {weeksLeft ? `~${weeksLeft} weeks at current pace` : 'Log sessions to calculate'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Chart 1: Learning Velocity Over Time ───────────────────── */}
      <Card hover={false} padding="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-white">Curriculum Velocity (Last 12 Weeks)</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Number of roadmap topics mastered per week</p>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            Current pace: <span className="text-accent-amber font-semibold">{weeklyPace.toFixed(1)}</span> topics/wk
          </span>
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={velocityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid stroke={chartStyle.gridStroke} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" stroke="#52525B" tick={{ fill: chartStyle.tickFill, fontSize: 11 }} tickLine={false} />
              <YAxis stroke="#52525B" tick={{ fill: chartStyle.tickFill, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={chartStyle.contentStyle}
                formatter={(val) => [`${val} topics`, 'Completed']}
              />
              <Line
                type="monotone"
                dataKey="topics"
                stroke={accent}
                strokeWidth={2}
                dot={{ fill: accent, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: accent }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Two-Column Row: Radar & Weekday Distribution ───────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Skill Radar */}
        <Card hover={false} padding="p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold tracking-tight text-white">Phase Coverage Radar</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Mastery percentage across all 6 roadmap phases</p>
          </div>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke={chartStyle.gridStroke} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: chartStyle.tickFill, fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#52525B" tick={false} axisLine={false} />
                <Radar name="Coverage" dataKey="value" stroke={secondary} fill={secondary} fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right: Study Sessions by Day of Week */}
        <Card hover={false} padding="p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold tracking-tight text-white">Study Cadence by Weekday</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Distribution of completed study sessions across days</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid stroke={chartStyle.gridStroke} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="#52525B" tick={{ fill: chartStyle.tickFill, fontSize: 11 }} tickLine={false} />
                <YAxis stroke="#52525B" tick={{ fill: chartStyle.tickFill, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={chartStyle.contentStyle}
                  formatter={(val) => [`${val} sessions`, 'Count']}
                />
                <Bar dataKey="sessions" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {dayOfWeekData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.sessions > 0 ? tertiary : 'rgba(255,255,255,0.06)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
