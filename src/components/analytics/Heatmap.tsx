import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { buildHeatmapWeeks } from '../../lib/utils';
import type { DailyActivity } from '../../types';

const LEVEL_COLORS = [
  '#1E2433',
  'rgb(var(--c-primary) / 0.22)',
  'rgb(var(--c-primary) / 0.45)',
  'rgb(var(--c-primary) / 0.72)',
  'rgb(var(--c-primary))',
];

const VIEW_OPTIONS = [
  { label: '3M',  weeks: 13  },
  { label: '6M',  weeks: 26  },
  { label: '1Y',  weeks: 52  },
  { label: 'All', weeks: 999 },
] as const;

interface HeatmapProps {
  activity: DailyActivity[];
}

export const Heatmap: React.FC<HeatmapProps> = ({ activity }) => {
  const [tooltip, setTooltip] = useState<{ date: string; mins: number; x: number; y: number } | null>(null);
  const [selectedView, setSelectedView] = useState<typeof VIEW_OPTIONS[number]['label']>('6M');
  const [cellSize, setCellSize] = useState(15);
  const containerRef = useRef<HTMLDivElement>(null);

  const weeksToShow = useMemo(() => {
    const option = VIEW_OPTIONS.find(v => v.label === selectedView)!;
    if (option.weeks === 999) {
      if (activity.length === 0) return 26;
      const sorted = [...activity].sort((a, b) => a.date.localeCompare(b.date));
      const earliest = new Date(sorted[0].date);
      const now = new Date();
      const diffWeeks = Math.ceil((now.getTime() - earliest.getTime()) / (7 * 86400 * 1000));
      return Math.max(diffWeeks, 4);
    }
    return option.weeks;
  }, [selectedView, activity]);

  const data = buildHeatmapWeeks(
    activity.map(a => ({ date: a.date, total_mins: a.total_mins })),
    weeksToShow,
  );

  // Dynamically size each cell so the grid always fills the full container width.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const numWeeks = data.length || weeksToShow;

    const compute = () => {
      const totalWidth = el.clientWidth;
      const DAY_COL = 34; // day-label column width + its right margin
      const GAP = 3;      // gap between week columns (matches gap-[3px])
      const available = totalWidth - DAY_COL - (numWeeks - 1) * GAP;
      const computed = Math.floor(available / numWeeks);
      // Clamp: never smaller than 10px (legible) or larger than 22px (looks huge)
      setCellSize(Math.max(10, Math.min(computed, 22)));
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data.length, weeksToShow]);

  const actMap = Object.fromEntries(activity.map(a => [a.date, a.total_mins]));

  const totalMins = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeksToShow * 7);
    return activity
      .filter(a => new Date(a.date) >= cutoff)
      .reduce((sum, a) => sum + a.total_mins, 0);
  }, [activity, weeksToShow]);

  const totalHours = (totalMins / 60).toFixed(1);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const GAP = 3;

  return (
    <div className="space-y-3">
      {/* View switcher + period total */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5">
          {VIEW_OPTIONS.map(opt => (
            <button
              key={opt.label}
              onClick={() => setSelectedView(opt.label)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                selectedView === opt.label
                  ? 'bg-accent-amber/15 text-accent-amber border border-accent-amber/30'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-zinc-500 font-mono">
          <span className="text-zinc-300 font-semibold">{totalHours}h</span> in this period
        </span>
      </div>

      {/* Full-width grid — ref lets us measure and compute cell size */}
      <div ref={containerRef} className="w-full">
        <div className="flex" style={{ gap: GAP }}>
          {/* Day label column */}
          <div
            className="flex flex-col flex-shrink-0"
            style={{ gap: GAP, paddingTop: 20, width: 28, marginRight: 6 }}
          >
            {days.map((d, i) => (
              <div
                key={d}
                style={{
                  height: cellSize,
                  fontSize: 9,
                  lineHeight: `${cellSize}px`,
                  visibility: i % 2 === 1 ? 'visible' : 'hidden',
                  color: '#52525b',
                  whiteSpace: 'nowrap',
                  textAlign: 'right',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {data.map((week, wi) => (
            <div key={wi} className="flex flex-col flex-1" style={{ gap: GAP, minWidth: 0 }}>
              {/* Month label */}
              <div style={{ height: 18, fontSize: 9, lineHeight: '18px', color: '#52525b', whiteSpace: 'nowrap' }}>
                {week[0] && new Date(week[0].date).getDate() <= 7
                  ? new Date(week[0].date).toLocaleDateString('en-US', { month: 'short' })
                  : ''}
              </div>
              {week.map((day, di) => (
                <motion.div
                  key={day.date}
                  style={{
                    width: '100%',
                    height: cellSize,
                    background: LEVEL_COLORS[day.level],
                    borderRadius: Math.max(2, cellSize * 0.18),
                    cursor: 'pointer',
                  }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min((wi * 7 + di) * 0.001, 0.25), duration: 0.12 }}
                  onMouseEnter={e => {
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    setTooltip({ date: day.date, mins: actMap[day.date] || 0, x: rect.left, y: rect.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-zinc-600">Less</span>
        {LEVEL_COLORS.map((c, i) => (
          <div key={i} style={{ width: cellSize, height: cellSize, background: c, borderRadius: Math.max(2, cellSize * 0.18), flexShrink: 0 }} />
        ))}
        <span className="text-[10px] text-zinc-600">More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 bg-[#1E2433] border border-white/[0.10] rounded-lg text-xs text-white shadow-xl pointer-events-none"
          style={{ left: tooltip.x + 8, top: tooltip.y - 40 }}
        >
          <span className="font-medium">{tooltip.date}</span>
          <br />
          <span className="text-zinc-400">
            {tooltip.mins >= 60
              ? `${(tooltip.mins / 60).toFixed(1)}h studied`
              : `${tooltip.mins} min studied`}
          </span>
        </div>
      )}
    </div>
  );
};
