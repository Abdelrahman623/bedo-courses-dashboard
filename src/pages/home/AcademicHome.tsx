import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Clock, CalendarClock, Compass, MapPin,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useRoadmapStore } from '../../store/roadmapStore';
import { useAuth } from '../../hooks/useAuth';
import type { Assessment, Course, Schedule } from '../../types';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ASSESSMENT_TYPE_LABEL: Record<Assessment['type'], string> = {
  exam: 'Exam',
  quiz: 'Quiz',
  assignment: 'Assignment',
};

function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr ?? 0);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(isoDate + 'T00:00:00');
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function deadlineLabel(days: number): string {
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export const AcademicHome: React.FC = () => {
  const navigate = useNavigate();
  const {
    getActiveCourses, getScheduleForCourse, getAssessmentsForCourse, getCourseGrade, getGPA,
  } = useRoadmapStore();
  const { profile, user } = useAuth();

  const userName = profile?.name || profile?.username || user?.user_metadata?.full_name || user?.user_metadata?.name || 'there';
  const activeCourses = getActiveCourses('academic');

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayDow = now.getDay() as Schedule['day_of_week'];

  const coursesById = new Map<string, Course>(activeCourses.map(c => [c.id, c]));

  const todaysClasses = activeCourses
    .flatMap(c => getScheduleForCourse(c.id))
    .filter(s => s.day_of_week === todayDow)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const upcomingDeadlines = activeCourses
    .flatMap(c => getAssessmentsForCourse(c.id))
    .map(a => ({ assessment: a, days: daysUntil(a.due_date) }))
    .filter(({ days }) => days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);

  const gpa = getGPA();

  if (activeCourses.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{greeting}, {userName}</h1>
          <p className="text-xs text-zinc-400 mt-1">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            {' · '}Academic Term Overview
          </p>
        </div>

        <Card padding="p-8" hover={false} className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center mb-4">
            <GraduationCap size={22} className="text-accent-amber" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">No academic courses yet</h3>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            Academic mode is for concurrent, timetabled courses — Linear Algebra, Probability, and
            the rest of a term, running side by side with no dependency chain between them. Add one
            from Courses to see your weekly schedule, deadlines and GPA here.
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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">{greeting}, {userName}</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
              Academic Term Overview
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            {' · '}{activeCourses.length} active course{activeCourses.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button variant="tonal" size="sm" icon={<Compass size={14} />} onClick={() => navigate('/courses')}>
          View All Courses
        </Button>
      </div>

      {/* ── KPI strip ─────────────────────────────────────────────── */}
      <div className="bg-[#131722] border border-white/[0.08] rounded-xl overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
        <div className="grid grid-cols-2 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
          <div className="p-5 flex flex-col justify-between">
            <span className="text-xs text-zinc-400 font-medium">GPA (4.0 scale)</span>
            <div className="my-3">
              <span className="text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
                {gpa === null ? '—' : gpa.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              {gpa === null ? 'No grades recorded yet' : 'Across graded active courses'}
            </p>
          </div>
          <div className="p-5 flex flex-col justify-between">
            <span className="text-xs text-zinc-400 font-medium">Classes Today</span>
            <div className="my-3">
              <span className="text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
                {todaysClasses.length}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">{DAY_LABELS[todayDow]}</p>
          </div>
          <div className="p-5 flex flex-col justify-between">
            <span className="text-xs text-zinc-400 font-medium">Upcoming Deadlines</span>
            <div className="my-3">
              <span className="text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
                {upcomingDeadlines.length}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">Next: {upcomingDeadlines[0] ? deadlineLabel(upcomingDeadlines[0].days) : '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Today's classes ─────────────────────────────────────── */}
        <Card padding="p-5" hover={false} className="lg:col-span-2">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-accent-secondary" />
              <h2 className="text-sm font-semibold tracking-tight text-white">Today's Classes</h2>
            </div>
            <button
              onClick={() => navigate('/timetable')}
              className="text-[11px] font-medium text-accent-secondary hover:text-accent-secondary/80 transition-colors cursor-pointer"
            >
              View Timetable
            </button>
          </div>
          {todaysClasses.length === 0 ? (
            <p className="text-xs text-zinc-500">No classes scheduled for {DAY_LABELS[todayDow]}.</p>
          ) : (
            <div className="space-y-2">
              {todaysClasses.map(s => {
                const course = coursesById.get(s.course_id);
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{course?.title ?? 'Untitled course'}</p>
                      {s.location && (
                        <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {s.location}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-xs text-accent-secondary whitespace-nowrap">
                      {formatTime(s.start_time)} – {formatTime(s.end_time)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ── Upcoming deadlines ──────────────────────────────────── */}
        <Card padding="p-5" hover={false}>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <CalendarClock size={15} className="text-accent-highlight" />
              <h2 className="text-sm font-semibold tracking-tight text-white">Upcoming Deadlines</h2>
            </div>
            <button
              onClick={() => navigate('/deadlines')}
              className="text-[11px] font-medium text-accent-highlight hover:text-accent-highlight/80 transition-colors cursor-pointer"
            >
              View All
            </button>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-xs text-zinc-500">Nothing due — you're clear.</p>
          ) : (
            <div className="space-y-2">
              {upcomingDeadlines.map(({ assessment, days }) => {
                const course = coursesById.get(assessment.course_id);
                return (
                  <div key={assessment.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{assessment.title}</p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {course?.title ?? 'Untitled course'} · {ASSESSMENT_TYPE_LABEL[assessment.type]}
                      </p>
                    </div>
                    <span className={`text-[11px] font-mono whitespace-nowrap ${days <= 2 ? 'text-accent-highlight' : 'text-zinc-400'}`}>
                      {deadlineLabel(days)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Per-course grade snapshot ───────────────────────────────── */}
      <Card padding="p-5" hover={false}>
        <h2 className="text-sm font-semibold tracking-tight text-white mb-4">Course Grades</h2>
        <div className="space-y-2">
          {activeCourses.map(c => {
            const grade = getCourseGrade(c.id);
            return (
              <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-sm font-medium text-white truncate">{c.title}</span>
                <span className="font-mono text-xs text-accent-amber whitespace-nowrap">
                  {grade.percentage === null ? 'Not graded yet' : `${grade.percentage.toFixed(1)}% · ${grade.gradePoint?.toFixed(1)}`}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
