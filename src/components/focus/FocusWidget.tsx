import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, CheckCircle2, Zap, ArrowUpRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { useSessionStore } from '../../store/sessionStore';
import { hhmm, getAccentColor } from '../../lib/utils';

const POMODORO_SECS = 25 * 60;

export interface FocusWidgetProps {
  /** What the timer is being run against — a roadmap topic, a class, a deadline. */
  subjectLabel: string;
  /** Secondary line under the subject — phase, course name, time, etc. */
  subjectSubtitle?: string;
  /** Small badge in the header, e.g. a phase or "Academic". */
  metaLabel?: string;
  /** Carried into sessionStore.startTimer so the logged session is attributed correctly. */
  courseId?: string;
  topicId?: string;
  /** Card header title — defaults to "Focus Mode". */
  title?: string;
}

/**
 * Embeds the live Pomodoro/stopwatch instrument (shared global timer state
 * in sessionStore) directly into a Home card, instead of a "Start Timer"
 * button that only ever deep-links to /tracker. Starting, pausing or
 * finishing here is the same timer as the one on the Tracker page — the
 * ticking interval lives in AppLayout so it keeps running across
 * navigation, and this widget and /tracker just render whatever state is
 * current.
 */
export const FocusWidget: React.FC<FocusWidgetProps> = ({
  subjectLabel,
  subjectSubtitle,
  metaLabel,
  courseId,
  topicId,
  title = "Focus Mode",
}) => {
  const navigate = useNavigate();
  const {
    timerRunning, timerMode, timerSeconds, timerCourseId, timerTopicId,
    startTimer, pauseTimer, stopTimer, resetTimer,
  } = useSessionStore();

  // This widget only ever drives the pomodoro/stopwatch flow; break timers
  // are switched to from the full Tracker page, not from a Home card.
  const total = timerMode === 'stopwatch' ? 3600 : (timerMode === 'pomodoro' ? POMODORO_SECS : timerSeconds || POMODORO_SECS);
  const progressPct = timerMode === 'stopwatch'
    ? Math.min((timerSeconds / 3600) * 100, 100)
    : Math.max(0, Math.min(((total - timerSeconds) / total) * 100, 100));

  // Whether the currently running/paused timer belongs to *this* subject —
  // if the person started a different topic's timer elsewhere and navigated
  // here, we show that state honestly rather than implying this card owns it.
  const ownsTimer = (timerCourseId ?? null) === (courseId ?? timerCourseId ?? null) &&
    (timerTopicId ?? null) === (topicId ?? timerTopicId ?? null);

  const handleStart = () => startTimer(courseId, topicId);

  return (
    <Card padding="p-6" hover={false}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          <Zap size={14} className="text-accent-amber" />
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {metaLabel && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-accent-tertiary/10 text-accent-tertiary border border-accent-tertiary/20 truncate max-w-[160px]">
              {metaLabel}
            </span>
          )}
          <button
            onClick={() => navigate('/tracker')}
            className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-white transition-colors cursor-pointer flex-shrink-0"
            title="Open full Tracker (history, manual entry, break timers)"
          >
            <span className="hidden sm:inline">Full Tracker</span> <ArrowUpRight size={12} />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="text-lg font-bold text-white tracking-tight truncate">{subjectLabel}</h3>
          {subjectSubtitle && (
            <p className="text-xs text-zinc-400 leading-relaxed">{subjectSubtitle}</p>
          )}
          <div className="flex items-center gap-1.5 pt-1">
            <span
              className={`w-2 h-2 rounded-full ${
                timerRunning && ownsTimer ? 'bg-accent-secondary animate-pulse' : 'bg-zinc-600'
              }`}
            />
            <span className="text-[11px] font-medium text-zinc-500">
              {timerRunning && ownsTimer
                ? 'Session active'
                : timerRunning
                  ? 'A different session is running'
                  : 'Ready to focus'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="relative flex items-center justify-center w-20 h-20 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="44" fill="none"
                stroke={getAccentColor()}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - (ownsTimer ? progressPct : 0) / 100)}
                className="transition-all duration-300 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="font-mono text-sm font-bold text-white tabular-nums">
                {hhmm(ownsTimer ? timerSeconds : POMODORO_SECS)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {!timerRunning || !ownsTimer ? (
              <button
                onClick={handleStart}
                disabled={timerRunning && !ownsTimer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-amber text-bg-base text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Play size={13} className="fill-current" /> Start
              </button>
            ) : (
              <button
                onClick={() => pauseTimer()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] border border-accent-amber/30 text-accent-amber text-xs font-semibold hover:bg-white/[0.12] transition-colors cursor-pointer"
              >
                <Pause size={13} /> Pause
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => resetTimer()}
                disabled={!ownsTimer}
                title="Reset"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white border border-white/[0.08] hover:border-white/[0.15] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <RotateCcw size={13} />
              </button>
              <button
                onClick={() => stopTimer()}
                disabled={!ownsTimer}
                title="Complete & save session"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 border border-white/[0.08] hover:border-emerald-400/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <CheckCircle2 size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
