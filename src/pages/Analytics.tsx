import React, { useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useSessionStore } from '../store/sessionStore';
import { useRoadmapStore } from '../store/roadmapStore';
import { useProjectsStore } from '../store/projectsStore';
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
  const { projects, fetchProjects } = useProjectsStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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

  // ── Estimated completion ────────────────────────────────────────────────
  // Strictly a *curriculum* projection: it answers "when will the roadmap
  // topics be finished", so it moves when a topic is marked complete on the
  // roadmap — not when a study session is logged, and not when a portfolio
  // project progresses. Those are tracked separately below and in Tracker.
  const projection = useMemo(() => {
    const stamps = localNodes
      .map(n => n.completedAt)
      .filter((t): t is string => Boolean(t))
      .map(t => Date.parse(t))
      .filter(t => !Number.isNaN(t))
      .sort((a, b) => a - b);

    const now = Date.now();
    const WEEK = 7 * 24 * 60 * 60 * 1000;
    const recent = stamps.filter(t => now - t <= 4 * WEEK).length;
    const remaining = Math.max(0, totalTopics - completedTopics);

    // Dividing by a flat 4 weeks understates the pace of someone who only
    // started tracking days ago, so the window is however much history
    // actually exists, capped at 4 weeks and floored at 1.
    const weeksTracked = stamps.length
      ? Math.min(4, Math.max(1, (now - stamps[0]) / WEEK))
      : 0;
    const weeklyPace = recent > 0 ? recent / weeksTracked : 0;

    if (totalTopics === 0) {
      return { weeklyPace: 0, weeksLeft: null, headline: 'No roadmap yet', hint: 'Load a roadmap to project a finish date' };
    }
    if (remaining === 0) {
      return { weeklyPace, weeksLeft: null, headline: 'Complete', hint: 'Every roadmap topic is done' };
    }
    if (stamps.length === 0) {
      return { weeklyPace: 0, weeksLeft: null, headline: 'Calculating...', hint: 'Mark a roadmap topic complete to calculate' };
    }
    if (recent === 0) {
      return { weeklyPace: 0, weeksLeft: null, headline: 'Paused', hint: 'No topics completed in the last 4 weeks' };
    }

    const weeksLeft = Math.ceil(remaining / weeklyPace);
    const headline = new Date(now + weeksLeft * WEEK)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return {
      weeklyPace,
      weeksLeft,
      headline,
      hint: `~${weeksLeft} weeks at ${weeklyPace.toFixed(1)} topics/wk`,
    };
  }, [localNodes, totalTopics, completedTopics]);

  const weeklyPace = projection.weeklyPace;

  // Portfolio roll-up — projects are their own track, summarised here so the
  // work shows up on the analytics page instead of living only on /projects.
  const portfolio = useMemo(() => {
    const shipped = projects.filter(p => p.status === 'deployed' || p.status === 'completed').length;
    const active = projects.filter(p => p.status === 'in_progress').length;
    const avg = projects.length
      ? Math.round(projects.reduce((s, p) => s + p.completion_pct, 0) / projects.length)
      : 0;
    return { total: projects.length, shipped, active, avg };
  }, [projects]);

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
              <span className="text-lg font-bold font-mono text-accent-tertiary truncate" title={projection.headline}>
                {projection.headline}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 block">
              {projection.hint}
            </span>
          </div>
        </div>
      </div>

      {/* ── Portfolio roll-up ──────────────────────────────────────── */}
      {/* Projects are a separate track from the curriculum: finishing a
          project doesn't move "Curriculum Covered" or the projected finish
          date (those count roadmap topics), so portfolio progress is
          surfaced on its own line rather than silently folded in. */}
      <button
        onClick={() => navigate('/projects')}
        className="w-full text-left bg-[#131722] border border-white/[0.08] hover:border-white/[0.16] rounded-xl p-4 transition-colors cursor-pointer group shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="text-xs text-zinc-400 font-medium">Portfolio Progress</span>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Tracked separately from curriculum topics
            </p>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-lg font-bold font-mono text-white tabular-nums">{portfolio.avg}%</p>
              <p className="text-[10px] text-zinc-500">avg completion</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold font-mono text-accent-secondary tabular-nums">{portfolio.active}</p>
              <p className="text-[10px] text-zinc-500">in flight</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold font-mono text-accent-tertiary tabular-nums">{portfolio.shipped}</p>
              <p className="text-[10px] text-zinc-500">finished</p>
            </div>
            <ArrowUpRight size={15} className="text-zinc-500 group-hover:text-white transition-colors" />
          </div>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mt-3">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${portfolio.avg}%`, background: accent }}
          />
        </div>
      </button>

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
