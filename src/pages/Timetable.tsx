import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, Plus, MapPin, Pencil, Trash2, Compass, GraduationCap,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useRoadmapStore } from '../store/roadmapStore';
import type { Course, DayOfWeek, Schedule } from '../types';

// Displayed Mon → Sun (the academic week), independent of DayOfWeek's
// 0 = Sunday storage order.
const DISPLAY_DAYS: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];
const DAY_SHORT: Record<DayOfWeek, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};
const DAY_FULL: Record<DayOfWeek, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday',
};

// Four theme tones, cycled per course so no two adjacent courses in the
// list are likely to collide — same accent roles used everywhere else
// (Sidebar's mode tabs, nav section dots), just repurposed as a course key
// instead of a feature key.
const TONES = ['amber', 'secondary', 'tertiary', 'highlight'] as const;
type Tone = typeof TONES[number];
const TONE_CLASSES: Record<Tone, { bg: string; border: string; text: string; solidBg: string }> = {
  amber:     { bg: 'bg-accent-amber/15',     border: 'border-accent-amber/40',     text: 'text-accent-amber',     solidBg: 'bg-accent-amber' },
  secondary: { bg: 'bg-accent-secondary/15', border: 'border-accent-secondary/40', text: 'text-accent-secondary', solidBg: 'bg-accent-secondary' },
  tertiary:  { bg: 'bg-accent-tertiary/15',  border: 'border-accent-tertiary/40',  text: 'text-accent-tertiary',  solidBg: 'bg-accent-tertiary' },
  highlight: { bg: 'bg-accent-highlight/15', border: 'border-accent-highlight/40', text: 'text-accent-highlight', solidBg: 'bg-accent-highlight' },
};

const HOUR_HEIGHT = 56; // px per 60 minutes
const MIN_RANGE_START = 8 * 60;  // 8:00, used as a floor when no classes exist yet
const MIN_RANGE_END = 18 * 60;   // 18:00

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function formatTime(hhmm: string): string {
  const mins = toMinutes(hhmm);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

interface LayoutEvent {
  schedule: Schedule;
  course: Course;
  tone: Tone;
  startMin: number;
  endMin: number;
  lane: number;
  laneCount: number;
}

/** Groups a day's events into overlap clusters and assigns each a lane
 *  within its cluster, so events that don't actually conflict keep full
 *  width instead of being squeezed by an unrelated overlap elsewhere in
 *  the day. */
function layoutDay(events: Omit<LayoutEvent, 'lane' | 'laneCount'>[]): LayoutEvent[] {
  const sorted = [...events].sort((a, b) => a.startMin - b.startMin);
  const result: LayoutEvent[] = [];
  let cluster: typeof sorted = [];
  let clusterEnd = -1;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const laneEnds: number[] = [];
    const withLanes = cluster.map(e => {
      let lane = laneEnds.findIndex(end => end <= e.startMin);
      if (lane === -1) { lane = laneEnds.length; laneEnds.push(e.endMin); }
      else { laneEnds[lane] = e.endMin; }
      return { ...e, lane };
    });
    const laneCount = laneEnds.length;
    withLanes.forEach(e => result.push({ ...e, laneCount }));
    cluster = [];
  };

  for (const e of sorted) {
    if (cluster.length > 0 && e.startMin >= clusterEnd) flushCluster();
    cluster.push(e);
    clusterEnd = cluster.length === 1 ? e.endMin : Math.max(clusterEnd, e.endMin);
  }
  flushCluster();

  return result;
}

const EMPTY_FORM = {
  courseId: '',
  day: 1 as DayOfWeek,
  startTime: '09:00',
  endTime: '10:00',
  location: '',
};
type FormState = typeof EMPTY_FORM;

export const Timetable: React.FC = () => {
  const navigate = useNavigate();
  const {
    getActiveCourses, getScheduleForCourse, addSchedule, updateSchedule, deleteSchedule,
  } = useRoadmapStore();

  const activeCourses = getActiveCourses('academic');
  const toneByCourse = useMemo(() => {
    const map = new Map<string, Tone>();
    activeCourses.forEach((c, i) => map.set(c.id, TONES[i % TONES.length]));
    return map;
  }, [activeCourses]);

  const [editing, setEditing] = useState<Schedule | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const allSchedules = useMemo(
    () => activeCourses.flatMap(c => getScheduleForCourse(c.id).map(s => ({ schedule: s, course: c }))),
    [activeCourses, getScheduleForCourse],
  );

  const { rangeStart, rangeEnd } = useMemo(() => {
    if (allSchedules.length === 0) return { rangeStart: MIN_RANGE_START, rangeEnd: MIN_RANGE_END };
    let min = MIN_RANGE_START;
    let max = MIN_RANGE_END;
    for (const { schedule } of allSchedules) {
      min = Math.min(min, Math.floor(toMinutes(schedule.start_time) / 60) * 60);
      max = Math.max(max, Math.ceil(toMinutes(schedule.end_time) / 60) * 60);
    }
    return { rangeStart: min, rangeEnd: max };
  }, [allSchedules]);

  const hourMarks = useMemo(() => {
    const marks: number[] = [];
    for (let m = rangeStart; m <= rangeEnd; m += 60) marks.push(m);
    return marks;
  }, [rangeStart, rangeEnd]);

  const gridHeight = ((rangeEnd - rangeStart) / 60) * HOUR_HEIGHT;

  const eventsByDay = useMemo(() => {
    const map = new Map<DayOfWeek, LayoutEvent[]>();
    for (const day of DISPLAY_DAYS) {
      const dayEvents = allSchedules
        .filter(({ schedule }) => schedule.day_of_week === day)
        .map(({ schedule, course }) => ({
          schedule,
          course,
          tone: toneByCourse.get(course.id) ?? 'amber',
          startMin: toMinutes(schedule.start_time),
          endMin: toMinutes(schedule.end_time),
        }));
      map.set(day, layoutDay(dayEvents));
    }
    return map;
  }, [allSchedules, toneByCourse]);

  const todayDow = new Date().getDay() as DayOfWeek;

  const openCreate = (day?: DayOfWeek) => {
    setEditing(null);
    setFormError(null);
    setForm({ ...EMPTY_FORM, day: day ?? 1, courseId: activeCourses[0]?.id ?? '' });
    setShowModal(true);
  };

  const openEdit = (schedule: Schedule) => {
    setEditing(schedule);
    setFormError(null);
    setForm({
      courseId: schedule.course_id,
      day: schedule.day_of_week,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      location: schedule.location ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseId) { setFormError('Choose a course.'); return; }
    if (toMinutes(form.endTime) <= toMinutes(form.startTime)) {
      setFormError('End time must be after start time.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await updateSchedule(editing.id, {
          day_of_week: form.day,
          start_time: form.startTime,
          end_time: form.endTime,
          location: form.location || undefined,
        });
      } else {
        await addSchedule({
          course_id: form.courseId,
          day_of_week: form.day,
          start_time: form.startTime,
          end_time: form.endTime,
          location: form.location || undefined,
        });
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await deleteSchedule(editing.id);
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 ' +
    'text-sm text-white placeholder:text-zinc-600 outline-none transition-colors';

  if (activeCourses.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Timetable</h1>
          <p className="text-xs text-zinc-400 mt-1">Weekly schedule across your active academic courses.</p>
        </div>
        <Card padding="p-8" hover={false} className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center mb-4">
            <GraduationCap size={22} className="text-accent-amber" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">No academic courses yet</h3>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            Add a course in Academic mode from Courses first — the timetable fills in once there's
            a course to attach class times to.
          </p>
          <div className="mt-5">
            <Button variant="primary" size="sm" icon={<Compass size={14} />} onClick={() => navigate('/courses')}>
              Go to Courses
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays size={20} className="text-accent-secondary" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Timetable</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Weekly schedule across {activeCourses.length} active academic course{activeCourses.length === 1 ? '' : 's'}.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => openCreate()}>
          Add Class
        </Button>
      </div>

      {/* Course legend */}
      <div className="flex flex-wrap gap-2">
        {activeCourses.map(c => {
          const tone = TONE_CLASSES[toneByCourse.get(c.id) ?? 'amber'];
          return (
            <span
              key={c.id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${tone.bg} ${tone.border} ${tone.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tone.solidBg}`} />
              {c.title}
            </span>
          );
        })}
      </div>

      {/* Grid */}
      <Card padding="p-0" hover={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            {/* Day header row */}
            <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-white/[0.08]">
              <div />
              {DISPLAY_DAYS.map(day => (
                <div
                  key={day}
                  className={`py-2.5 text-center text-xs font-semibold tracking-tight ${
                    day === todayDow ? 'text-accent-amber' : 'text-zinc-300'
                  }`}
                >
                  {DAY_SHORT[day]}
                </div>
              ))}
            </div>

            {/* Body: hour gutter + 7 day columns */}
            <div className="grid grid-cols-[56px_repeat(7,1fr)]" style={{ height: gridHeight }}>
              {/* Hour labels */}
              <div className="relative">
                {hourMarks.map(m => (
                  <div
                    key={m}
                    className="absolute right-2 -translate-y-1/2 text-[10px] font-mono text-zinc-500"
                    style={{ top: ((m - rangeStart) / 60) * HOUR_HEIGHT }}
                  >
                    {formatTime(`${Math.floor(m / 60)}:00`)}
                  </div>
                ))}
              </div>

              {DISPLAY_DAYS.map(day => (
                <div
                  key={day}
                  className={`relative border-l border-white/[0.06] cursor-pointer group ${
                    day === todayDow ? 'bg-accent-amber/[0.03]' : ''
                  }`}
                  onClick={() => openCreate(day)}
                >
                  {/* Hour gridlines */}
                  {hourMarks.map(m => (
                    <div
                      key={m}
                      className="absolute left-0 right-0 border-t border-white/[0.05]"
                      style={{ top: ((m - rangeStart) / 60) * HOUR_HEIGHT }}
                    />
                  ))}
                  {/* Hover affordance on empty space */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-center pt-1 pointer-events-none">
                    <Plus size={13} className="text-zinc-600" />
                  </div>

                  {(eventsByDay.get(day) ?? []).map(ev => {
                    const tone = TONE_CLASSES[ev.tone];
                    const top = ((ev.startMin - rangeStart) / 60) * HOUR_HEIGHT;
                    const height = Math.max(((ev.endMin - ev.startMin) / 60) * HOUR_HEIGHT, 30);
                    const widthPct = 100 / ev.laneCount;
                    return (
                      <div
                        key={ev.schedule.id}
                        onClick={(e) => { e.stopPropagation(); openEdit(ev.schedule); }}
                        className={`absolute rounded-lg border px-2 py-1 overflow-hidden cursor-pointer hover:brightness-110 transition-all ${tone.bg} ${tone.border}`}
                        style={{
                          top,
                          height,
                          left: `calc(${ev.lane * widthPct}% + 2px)`,
                          width: `calc(${widthPct}% - 4px)`,
                        }}
                      >
                        <p className={`text-[11px] font-semibold truncate ${tone.text}`}>{ev.course.title}</p>
                        {height > 40 && (
                          <p className="text-[10px] text-zinc-400 truncate">
                            {formatTime(ev.schedule.start_time)}–{formatTime(ev.schedule.end_time)}
                          </p>
                        )}
                        {height > 56 && ev.schedule.location && (
                          <p className="text-[10px] text-zinc-500 truncate flex items-center gap-0.5">
                            <MapPin size={9} /> {ev.schedule.location}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <p className="text-[11px] text-zinc-500">
        Click any day column to add a class, or click an existing block to edit or remove it.
      </p>

      {/* Add / edit modal */}
      <Modal open={showModal} onClose={closeModal} title={editing ? 'Edit Class' : 'Add Class'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Course</label>
            <select
              className={inputCls}
              value={form.courseId}
              onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
            >
              <option value="" disabled>Select a course…</option>
              {activeCourses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Day</label>
            <div className="grid grid-cols-7 gap-1">
              {DISPLAY_DAYS.map(day => (
                <button
                  key={day}
                  type="button"
                  title={DAY_FULL[day]}
                  onClick={() => setForm(f => ({ ...f, day }))}
                  className={`py-2 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                    form.day === day
                      ? 'bg-accent-amber/15 text-accent-amber border-accent-amber/40'
                      : 'bg-white/[0.03] text-zinc-400 border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {DAY_SHORT[day]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Start time</label>
              <input
                type="time"
                className={inputCls}
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">End time</label>
              <input
                type="time"
                className={inputCls}
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Location (optional)</label>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Building 4, Room 201"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            />
          </div>

          {formError && <p className="text-xs text-rose-400">{formError}</p>}

          <div className="flex items-center justify-between gap-3 pt-2">
            {editing ? (
              <Button type="button" variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={handleDelete} disabled={saving}>
                Remove
              </Button>
            ) : <span />}
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={saving} icon={editing ? <Pencil size={13} /> : <Plus size={13} />}>
                {editing ? 'Save Changes' : 'Add Class'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
