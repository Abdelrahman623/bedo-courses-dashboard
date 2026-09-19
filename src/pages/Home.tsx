import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame, Clock, Target, Plus, Zap, ArrowRight,
  CheckCircle2, Compass, PenLine, Sparkles
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Heatmap } from '../components/analytics/Heatmap';
import { useRoadmapStore } from '../store/roadmapStore';
import { useSessionStore } from '../store/sessionStore';
import { useAuth } from '../hooks/useAuth';
import { minsToHHMM, pct } from '../lib/utils';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { localNodes } = useRoadmapStore();
  const { weeklyMins, currentStreak, longestStreak, activity, fetchSessions } = useSessionStore();
  const { profile, user } = useAuth();

  const userName = profile?.name || profile?.username || user?.user_metadata?.full_name || user?.user_metadata?.name || 'there';

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const totalNodes = localNodes.length;
  const completedNodes = localNodes.filter(n => n.status === 'completed').length;
  const inProgressNodes = localNodes.filter(n => n.status === 'in_progress').length;
  const overallPct = pct(completedNodes, totalNodes);
  const weeklyHours = +(weeklyMins / 60).toFixed(1);
  const weeklyTarget = profile?.weekly_goal_hours ?? 10;
  const weeklyPct = Math.min(Math.round((weeklyHours / weeklyTarget) * 100), 100);

  // Active topic to focus on
  const activeTopic = localNodes.find(n => n.status === 'in_progress') || localNodes[0];

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Header Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">{greeting}, {userName}</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
              Personal Command Center
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            {' · '}Curriculum & Goal Tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<Target size={14} />}
            onClick={() => navigate('/tracker')}
          >
            Start Focus Session
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Compass size={14} />}
            onClick={() => navigate('/courses')}
          >
            Explore Roadmap
          </Button>
        </div>
      </div>

      {/* ── Primary KPI Metrics Strip (Unified Container, No Nested Cards) ── */}
      <div className="bg-[#131722] border border-white/[0.08] rounded-xl overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
          {/* Metric 1: Overall Mastery */}
          <div className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span>Roadmap Progress</span>
              <span className="font-mono text-accent-amber font-semibold">{overallPct}%</span>
            </div>
            <div className="my-3">
              <span className="text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
                {completedNodes}
                <span className="text-zinc-500 text-lg font-normal"> / {totalNodes}</span>
              </span>
            </div>
            <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-amber rounded-full transition-all duration-500"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>

          {/* Metric 2: Weekly Study Volume */}
          <div className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span>This Week Volume</span>
              <span className="font-mono text-[#00C896] font-semibold">{weeklyPct}% of goal</span>
            </div>
            <div className="my-3">
              <span className="text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
                {weeklyHours}
                <span className="text-zinc-500 text-lg font-normal"> / {weeklyTarget}h</span>
              </span>
            </div>
            <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00C896] rounded-full transition-all duration-500"
                style={{ width: `${weeklyPct}%` }}
              />
            </div>
          </div>

          {/* Metric 3: Active Streak */}
          <div className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span>Current Streak</span>
              <span className="flex items-center gap-1 text-accent-amber">
                <Flame size={13} /> Active
              </span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
                {currentStreak}
              </span>
              <span className="text-xs text-zinc-400 font-medium">days in a row</span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Personal record: <span className="text-zinc-300 font-mono font-medium">{longestStreak} days</span>
            </p>
          </div>

          {/* Metric 4: Active Topics In Progress */}
          <div className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
              <span>Active Curriculum</span>
              <span className="inline-block w-2 h-2 rounded-full bg-[#4FC3F7] animate-pulse" />
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
                {inProgressNodes || 1}
              </span>
              <span className="text-xs text-zinc-400 font-medium">topics in progress</span>
            </div>
            <p className="text-[11px] text-zinc-500 truncate">
              Focus: <span className="text-zinc-300">{activeTopic?.label || 'General Focus'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Split: Focus & Actions ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Today's Active Focus */}
        <div className="lg:col-span-2 space-y-4">
          <Card padding="p-6" hover={false}>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <Zap size={14} className="text-accent-amber" />
                <span>Today's Learning Focus</span>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                Phase: {activeTopic?.phase || 'Core Curriculum'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {activeTopic?.label || 'Active Learning Session'}
                </h3>
                <p className="text-xs text-zinc-400 max-w-lg leading-relaxed">
                  Master key concepts, log study sessions, and advance your structured learning path.
                </p>
                <div className="flex items-center gap-3 pt-2 text-xs text-zinc-500 font-medium">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 size={13} /> Prerequisites Met
                  </span>
                  <span>·</span>
                  <span>Est. Session: 25-45 mins</span>
                </div>
              </div>

              <div className="flex sm:flex-col gap-2 flex-shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Target size={14} />}
                  onClick={() => navigate('/tracker')}
                >
                  Start Timer
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<PenLine size={14} />}
                  onClick={() => navigate('/notes')}
                >
                  Open Notes
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Study Navigation */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/courses')}
              className="p-3 bg-[#131722] hover:bg-[#161B28] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-left transition-all duration-150 group cursor-pointer"
            >
              <span className="block text-[11px] font-medium text-zinc-400">Interactive Map</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-semibold text-white group-hover:text-accent-amber transition-colors">
                  D3 Roadmap
                </span>
                <ArrowRight size={14} className="text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => navigate('/projects')}
              className="p-3 bg-[#131722] hover:bg-[#161B28] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-left transition-all duration-150 group cursor-pointer"
            >
              <span className="block text-[11px] font-medium text-zinc-400">Portfolio</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-semibold text-white group-hover:text-accent-amber transition-colors">
                  Projects Kanban
                </span>
                <ArrowRight size={14} className="text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => navigate('/analytics')}
              className="p-3 bg-[#131722] hover:bg-[#161B28] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-left transition-all duration-150 group cursor-pointer"
            >
              <span className="block text-[11px] font-medium text-zinc-400">Performance</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-semibold text-white group-hover:text-accent-amber transition-colors">
                  Skill Radar
                </span>
                <ArrowRight size={14} className="text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* Right Column (1/3): Quick Actions & Quote */}
        <div className="space-y-4">
          <Card padding="p-5" hover={false}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Quick Entry
            </h3>
            <div className="space-y-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start text-xs font-medium text-zinc-300"
                icon={<Clock size={14} className="text-accent-amber" />}
                onClick={() => navigate('/tracker')}
              >
                Log Completed Session
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start text-xs font-medium text-zinc-300"
                icon={<PenLine size={14} className="text-[#00C896]" />}
                onClick={() => navigate('/notes')}
              >
                Capture Quick Study Note
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start text-xs font-medium text-zinc-300"
                icon={<Plus size={14} className="text-[#4FC3F7]" />}
                onClick={() => navigate('/projects')}
              >
                Register New Project
              </Button>
            </div>
          </Card>

          <Card padding="p-4" hover={false} className="bg-gradient-to-b from-[#131722] to-[#10131B]">
            <div className="flex items-center gap-1.5 text-xs text-accent-amber font-medium mb-1.5">
              <Sparkles size={13} />
              <span>Scholar's Codex</span>
            </div>
            <p className="text-xs text-zinc-300 italic leading-relaxed">
              "The expert in anything was once a beginner. Consistency refines effort into mastery."
            </p>
            <p className="text-[11px] text-zinc-500 mt-2">— Helen Hayes</p>
          </Card>
        </div>
      </div>

      {/* ── Activity Heatmap Section (Dense, High-signal) ─────────── */}
      <Card hover={false} padding="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-white">Study Consistency Heatmap</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Recording daily study duration across the last 26 weeks</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="font-mono text-zinc-300 font-medium">
              {minsToHHMM(weeklyMins)} logged this week
            </span>
          </div>
        </div>
        <Heatmap activity={activity} weeks={26} />
      </Card>
    </div>
  );
};
