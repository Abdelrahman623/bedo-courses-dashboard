import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { buildHeatmapWeeks } from '../../lib/utils';
import type { DailyActivity } from '../../types';

// Study intensity ramp: five steps of the theme's PRIMARY role (0 = empty neutral).
// Uses the RGB-channel variable so it re-colors instantly when the theme changes.
const LEVEL_COLORS = [
  '#1E2433',                        // 0 = empty
  'rgb(var(--c-primary) / 0.22)',   // 1
  'rgb(var(--c-primary) / 0.45)',   // 2
  'rgb(var(--c-primary) / 0.72)',   // 3
  'rgb(var(--c-primary))',          // 4
];

interface HeatmapProps {
  activity: DailyActivity[];
  weeks?: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({ activity, weeks = 26 }) => {
  const [tooltip, setTooltip] = useState<{ date: string; mins: number; x: number; y: number } | null>(null);

  const data = buildHeatmapWeeks(
    activity.map(a => ({ date: a.date, total_mins: a.total_mins })),
    weeks,
  );

  const actMap = Object.fromEntries(activity.map(a => [a.date, a.total_mins]));
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="relative">
      <div className="flex gap-1 overflow-x-auto pb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1 pt-6">
          {days.map((d, i) => (
            <div key={d} className="h-[12px] text-[9px] text-txt-muted flex items-center"
              style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {data.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {/* Month label on first day of new month */}
            <div className="h-5 text-[9px] text-txt-muted">
              {week[0] && new Date(week[0].date).getDate() <= 7
                ? new Date(week[0].date).toLocaleDateString('en-US', { month: 'short' })
                : ''}
            </div>
            {week.map((day, di) => (
              <motion.div
                key={day.date}
                className="heatmap-cell w-3 h-3 rounded-[2px] cursor-pointer"
                style={{ background: LEVEL_COLORS[day.level] }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (wi * 7 + di) * 0.002, duration: 0.15 }}
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

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-[10px] text-txt-muted">Less</span>
        {LEVEL_COLORS.map((c, i) => (
          <div key={i} className="w-3 h-3 rounded-[2px]" style={{ background: c }} />
        ))}
        <span className="text-[10px] text-txt-muted">More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 bg-bg-surface2 border border-white/10 rounded-lg text-xs text-txt-primary shadow-card pointer-events-none"
          style={{ left: tooltip.x + 16, top: tooltip.y - 8 }}
        >
          <span className="font-medium">{tooltip.date}</span>
          <br />
          <span className="text-txt-muted">{tooltip.mins} min studied</span>
        </div>
      )}
    </div>
  );
};
