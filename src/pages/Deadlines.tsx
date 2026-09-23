import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock, Plus, Pencil, Trash2, Compass, GraduationCap,
  AlertTriangle, CheckCircle2, FileText, HelpCircle, BookOpenCheck,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useRoadmapStore } from '../store/roadmapStore';
import type { Assessment, AssessmentType, Course } from '../types';

const TONES = ['amber', 'secondary', 'tertiary', 'highlight'] as const;
type Tone = typeof TONES[number];
const TONE_CLASSES: Record<Tone, { bg: string; border: string; text: string; solidBg: string }> = {
  amber:     { bg: 'bg-accent-amber/15',     border: 'border-accent-amber/40',     text: 'text-accent-amber',     solidBg: 'bg-accent-amber' },
  secondary: { bg: 'bg-accent-secondary/15', border: 'border-accent-secondary/40', text: 'text-accent-secondary', solidBg: 'bg-accent-secondary' },
  tertiary:  { bg: 'bg-accent-tertiary/15',  border: 'border-accent-tertiary/40',  text: 'text-accent-tertiary',  solidBg: 'bg-accent-tertiary' },
  highlight: { bg: 'bg-accent-highlight/15', border: 'border-accent-highlight/40', text: 'text-accent-highlight', solidBg: 'bg-accent-highlight' },
};

const TYPE_META: Record<AssessmentType, { label: string; icon: React.ElementType }> = {
  exam:       { label: 'Exam',       icon: BookOpenCheck },
  quiz:       { label: 'Quiz',       icon: HelpCircle },
  assignment: { label: 'Assignment', icon: FileText },
};
const TYPE_FILTERS: Array<AssessmentType | 'all'> = ['all', 'exam', 'quiz', 'assignment'];

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(isoDate + 'T00:00:00');
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function deadlineLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `In ${days} days`;
}

function formatDueDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const EMPTY_FORM = {
  courseId: '',
  title: '',
  type: 'assignment' as AssessmentType,
  dueDate: '',
  weightPct: 10,
};
type FormState = typeof EMPTY_FORM;

export const Deadlines: React.FC = () => {
  const navigate = useNavigate();
  const {
    getActiveCourses, getAssessmentsForCourse, addAssessment, updateAssessment, deleteAssessment, grades,
  } = useRoadmapStore();

  const activeCourses = getActiveCourses('academic');
  const toneByCourse = useMemo(() => {
    const map = new Map<string, Tone>();
    activeCourses.forEach((c, i) => map.set(c.id, TONES[i % TONES.length]));
    return map;
  }, [activeCourses]);
  const coursesById = useMemo(() => new Map<string, Course>(activeCourses.map(c => [c.id, c])), [activeCourses]);

  const [typeFilter, setTypeFilter] = useState<AssessmentType | 'all'>('all');
  const [editing, setEditing] = useState<Assessment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const allAssessments = useMemo(
    () => activeCourses.flatMap(c => getAssessmentsForCourse(c.id)),
    [activeCourses, getAssessmentsForCourse],
  );

  const gradedAssessmentIds = useMemo(() => new Set(grades.map(g => g.assessment_id)), [grades]);

  const filtered = useMemo(
    () => allAssessments
      .filter(a => typeFilter === 'all' || a.type === typeFilter)
      .map(a => ({ assessment: a, days: daysUntil(a.due_date) }))
      .sort((a, b) => a.days - b.days),
    [allAssessments, typeFilter],
  );

  const overdue = filtered.filter(f => f.days < 0);
  const dueSoon = filtered.filter(f => f.days >= 0 && f.days <= 7);
  const later = filtered.filter(f => f.days > 7);

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setForm({ ...EMPTY_FORM, courseId: activeCourses[0]?.id ?? '', dueDate: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  };

  const openEdit = (a: Assessment) => {
    setEditing(a);
    setFormError(null);
    setForm({
      courseId: a.course_id,
      title: a.title,
      type: a.type,
      dueDate: a.due_date,
      weightPct: Math.round(a.weight * 100),
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
    if (!form.title.trim()) { setFormError('Give it a title.'); return; }
    if (!form.dueDate) { setFormError('Pick a due date.'); return; }
    setSaving(true);
    setFormError(null);
    const weight = Math.max(0, Math.min(100, form.weightPct)) / 100;
    try {
      if (editing) {
        await updateAssessment(editing.id, {
          title: form.title.trim(),
          type: form.type,
          due_date: form.dueDate,
          weight,
        });
      } else {
        await addAssessment({
          course_id: form.courseId,
          title: form.title.trim(),
          type: form.type,
          due_date: form.dueDate,
          weight,
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
      await deleteAssessment(editing.id);
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-[#0D1017] border border-white/[0.08] focus:border-accent-amber/50 rounded-lg px-3 py-2 ' +
    'text-sm text-white placeholder:text-zinc-600 outline-none transition-colors';

  if (activeCourses.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Deadlines</h1>
          <p className="text-xs text-zinc-400 mt-1">Exams, quizzes and assignments across your active academic courses.</p>
        </div>
        <Card padding="p-8" hover={false} className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center mb-4">
            <GraduationCap size={22} className="text-accent-amber" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">No academic courses yet</h3>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            Add a course in Academic mode from Courses first, then track its exams and assignments here.
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

  const renderGroup = (
    label: string,
    items: { assessment: Assessment; days: number }[],
    tone: 'rose' | 'amber' | 'default',
  ) => {
    if (items.length === 0) return null;
    const labelColor = tone === 'rose' ? 'text-rose-400' : tone === 'amber' ? 'text-accent-amber' : 'text-zinc-400';
    return (
      <div key={label} className="space-y-2">
        <h3 className={`text-xs font-semibold tracking-wide uppercase ${labelColor} flex items-center gap-1.5`}>
          {tone === 'rose' && <AlertTriangle size={12} />}
          {label} <span className="text-zinc-600 font-normal normal-case">({items.length})</span>
        </h3>
        <div className="space-y-2">
          {items.map(({ assessment, days }) => {
            const course = coursesById.get(assessment.course_id);
            const courseTone = TONE_CLASSES[toneByCourse.get(assessment.course_id) ?? 'amber'];
            const TypeIcon = TYPE_META[assessment.type].icon;
            const graded = gradedAssessmentIds.has(assessment.id);
            return (
              <Card
                key={assessment.id}
                padding="p-3.5"
                onClick={() => openEdit(assessment)}
                className="flex items-center gap-3"
              >
                <span className={`w-1.5 h-10 rounded-full flex-shrink-0 ${courseTone.solidBg}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">{assessment.title}</p>
                    {graded && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-status-completed">
                        <CheckCircle2 size={10} /> Graded
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className={courseTone.text}>{course?.title ?? 'Untitled course'}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="inline-flex items-center gap-1"><TypeIcon size={11} /> {TYPE_META[assessment.type].label}</span>
                    <span className="text-zinc-700">·</span>
                    <span>{Math.round(assessment.weight * 100)}% of grade</span>
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-mono whitespace-nowrap ${days < 0 ? 'text-rose-400' : days <= 2 ? 'text-accent-amber' : 'text-zinc-400'}`}>
                    {deadlineLabel(days)}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{formatDueDate(assessment.due_date)}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock size={20} className="text-accent-highlight" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Deadlines</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {allAssessments.length} exam{allAssessments.length === 1 ? '' : 's'}, quiz{allAssessments.length === 1 ? '' : 'zes'} and assignments tracked.
          </p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={openCreate}>
          Add Assessment
        </Button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        {TYPE_FILTERS.map(t => {
          const active = typeFilter === t;
          const label = t === 'all' ? 'All' : TYPE_META[t].label + 's';
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                active
                  ? 'bg-accent-highlight/15 text-accent-highlight border-accent-highlight/40'
                  : 'bg-white/[0.03] text-zinc-400 border-white/[0.08] hover:border-white/20'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card padding="p-8" hover={false} className="text-center">
          <p className="text-sm text-zinc-400">Nothing here yet — add an exam, quiz or assignment to start tracking it.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {renderGroup('Overdue', overdue, 'rose')}
          {renderGroup('Due This Week', dueSoon, 'amber')}
          {renderGroup('Later', later, 'default')}
        </div>
      )}

      {/* Add / edit modal */}
      <Modal open={showModal} onClose={closeModal} title={editing ? 'Edit Assessment' : 'Add Assessment'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Course</label>
            <select
              className={inputCls}
              value={form.courseId}
              onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
              disabled={!!editing}
            >
              <option value="" disabled>Select a course…</option>
              {activeCourses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title</label>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Midterm Exam, Problem Set 4"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TYPE_META) as AssessmentType[]).map(t => {
                const Icon = TYPE_META[t].icon;
                const active = form.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      active
                        ? 'bg-accent-amber/15 text-accent-amber border-accent-amber/40'
                        : 'bg-white/[0.03] text-zinc-400 border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <Icon size={15} />
                    {TYPE_META[t].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Due date</label>
              <input
                type="date"
                className={inputCls}
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Weight (% of grade)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                className={inputCls}
                value={form.weightPct}
                onChange={e => setForm(f => ({ ...f, weightPct: Number(e.target.value) }))}
              />
            </div>
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
                {editing ? 'Save Changes' : 'Add Assessment'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
