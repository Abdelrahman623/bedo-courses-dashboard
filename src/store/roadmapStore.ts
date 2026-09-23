import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getActiveUserId } from '../lib/storage';
import { loadUserState, queueUserState } from '../lib/userState';
import type {
  Course, Topic, Roadmap, TopicStatus, RoadmapNode, RoadmapEdge,
  CourseMode, Schedule, Assessment, Grade, CourseGrade,
} from '../types';
import { ROADMAP_TEMPLATES, type RoadmapTemplate } from '../data/roadmapTemplates';
import { slugify, safeUrl } from '../lib/utils';

/** Shape of the `roadmap_canvas` row in public.user_state. */
/** A path's own saved progress — nodes carry their status/completedAt. */
interface PathProgress {
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}

interface RoadmapCanvas {
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  activeTemplateId: string | null;
  customTemplates: Record<string, RoadmapTemplate>;
  /** Snapshot of each path's progress, keyed by template id, so switching
   *  the active path doesn't discard progress on the one left behind. */
  progressByTemplate: Record<string, PathProgress>;
}

const EMPTY_CANVAS: RoadmapCanvas = {
  nodes: [],
  edges: [],
  activeTemplateId: null,
  customTemplates: {},
  progressByTemplate: {},
};

interface RoadmapState {
  roadmaps: Roadmap[];
  courses: Course[];
  topics: Topic[];
  // ── Academic mode ──────────────────────────────────────────────────────
  schedules: Schedule[];
  assessments: Assessment[];
  grades: Grade[];
  loading: boolean;
  localNodes: RoadmapNode[];
  localEdges: RoadmapEdge[];
  activeTemplateId: string | null;
  customTemplates: Record<string, RoadmapTemplate>;
  progressByTemplate: Record<string, PathProgress>;

  fetchAll: () => Promise<void>;
  persistCanvas: () => void;
  updateTopicStatus: (id: string, status: TopicStatus) => Promise<void>;
  addTopic: (topic: {
    label: string;
    phase: string;
    status?: TopicStatus;
    parentId?: string;
    description?: string;
    courseId?: string;
  }) => Promise<{ nodeId: string; courseId: string | null }>;
  deleteTopic: (id: string) => void;
  updateTopic: (id: string, changes: Partial<RoadmapNode>) => void;
  loadTemplate: (templateKey: string) => void;
  clearRoadmap: () => void;
  importRoadmap: (data: {
    title: string;
    description?: string;
    category?: RoadmapTemplate['category'];
    nodes: RoadmapNode[];
    edges: RoadmapEdge[];
    enrollAsCourse?: boolean;
  }) => Promise<{ templateId: string; courseId?: string }>;
  deleteCustomTemplate: (templateId: string) => void;
  resetLocalRoadmap: () => void;
  setLocalTopicStatus: (id: string, status: TopicStatus) => void;
  getActiveCourseId: () => string | null;

  addCourse: (
    course: Omit<Course, 'id' | 'created_at' | 'user_id' | 'mode' | 'source'> &
      Partial<Pick<Course, 'mode' | 'source'>>
  ) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  addTemplateAsCourse: (templateKey: string) => Promise<Course>;

  // ── Mode-aware course queries ────────────────────────────────────────────
  /** All courses tagged with this mode, both seeded and user-entered. */
  getCoursesByMode: (mode: CourseMode) => Course[];
  /** Every course that's currently "in play" — not_started or in_progress —
   *  across BOTH modes at once, or filtered to one mode. There is no single
   *  "active roadmap" any more: any number of courses can be active
   *  concurrently (this is mandatory for Academic mode, and also true for
   *  Courses mode once someone is working through more than one path). */
  getActiveCourses: (mode?: CourseMode) => Course[];

  // ── Academic mode: schedule CRUD ─────────────────────────────────────────
  addSchedule: (schedule: Omit<Schedule, 'id' | 'created_at'>) => Promise<void>;
  updateSchedule: (id: string, changes: Partial<Omit<Schedule, 'id' | 'course_id' | 'created_at'>>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  getScheduleForCourse: (courseId: string) => Schedule[];

  // ── Academic mode: assessment CRUD ───────────────────────────────────────
  addAssessment: (assessment: Omit<Assessment, 'id' | 'created_at'>) => Promise<void>;
  updateAssessment: (id: string, changes: Partial<Omit<Assessment, 'id' | 'course_id' | 'created_at'>>) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
  getAssessmentsForCourse: (courseId: string) => Assessment[];

  // ── Academic mode: grade CRUD ─────────────────────────────────────────────
  /** Upsert — one grade per assessment. Adding a grade for an assessment that
   *  already has one replaces it rather than creating a duplicate. */
  setGrade: (assessmentId: string, score: number, maxScore: number) => Promise<void>;
  deleteGrade: (id: string) => Promise<void>;

  // ── Academic mode: derived grade / GPA ────────────────────────────────────
  /** Weighted percentage + 4.0-scale grade point for one course, computed
   *  from its assessments' weights and recorded grades. */
  getCourseGrade: (courseId: string) => CourseGrade;
  /** Standard 4.0-scale GPA across every currently-active ('in_progress' or
   *  'not_started', not archived/completed/paused) academic-mode course that
   *  has at least one graded assessment. Null if none do yet. */
  getGPA: () => number | null;
}

// The canvas (`localNodes` / `localEdges`) used to live only in this browser's
// localStorage, with no owner at all — which is why a brand-new account could
// open the roadmap and find a 72-topic curriculum already sitting there, left
// behind by whoever used the browser last. It now loads from, and saves to,
// public.user_state under the signed-in account. The `local*` names are kept
// so the rest of the app doesn't have to change.
export const useRoadmapStore = create<RoadmapState>((set, get) => ({
  roadmaps: [],
  courses: [],
  topics: [],
  schedules: [],
  assessments: [],
  grades: [],
  loading: false,
  localNodes: [],
  localEdges: [],
  activeTemplateId: null,
  customTemplates: {},
  progressByTemplate: {},

  /** Debounced save of the whole canvas to the account. */
  persistCanvas: () => {
    const { localNodes, localEdges, activeTemplateId, customTemplates, progressByTemplate } = get();

    // Keep the currently active path's snapshot in progressByTemplate up to
    // date on every save. This is the only place that writes to it, so
    // whatever's on the canvas when a path is left is exactly what comes
    // back when that path is reselected later.
    const updatedProgress = activeTemplateId
      ? { ...progressByTemplate, [activeTemplateId]: { nodes: localNodes, edges: localEdges } }
      : progressByTemplate;
    if (updatedProgress !== progressByTemplate) {
      set({ progressByTemplate: updatedProgress });
    }

    queueUserState<RoadmapCanvas>('roadmap_canvas', {
      nodes: localNodes,
      edges: localEdges,
      activeTemplateId,
      customTemplates,
      progressByTemplate: updatedProgress,
    });
  },

  fetchAll: async () => {
    if (!isSupabaseConfigured) return;
    set({ loading: true });
    try {
      const userId = await getActiveUserId();
      if (!userId) {
        set({
          ...EMPTY_CANVAS, roadmaps: [], courses: [], topics: [],
          schedules: [], assessments: [], grades: [],
          localNodes: [], localEdges: [], loading: false,
        });
        return;
      }

      const [
        { data: roadmaps }, { data: courses }, { data: topics },
        { data: schedules }, { data: assessments }, { data: grades },
        canvas,
      ] = await Promise.all([
        supabase.from('roadmaps').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('courses').select('*').eq('user_id', userId).order('created_at'),
        // Row Level Security scopes topics to this user's courses automatically.
        supabase.from('topics').select('*').order('created_at'),
        // Same for schedule/assessments/grades — all resolve ownership through
        // their course, same as topics.
        supabase.from('schedule').select('*').order('created_at'),
        supabase.from('assessments').select('*').order('due_date'),
        supabase.from('grades').select('*').order('created_at'),
        loadUserState<RoadmapCanvas>('roadmap_canvas', EMPTY_CANVAS),
      ]);

      // Normalize courses created before `mode`/`source` existed (or coming
      // back with the column temporarily missing, e.g. mid-migration): a
      // course with a roadmap_id came from a template (seeded, courses-mode
      // by default); anything else was entered by the user directly.
      const normalizedCourses: Course[] = ((courses as Course[]) ?? []).map(c => ({
        ...c,
        mode: c.mode ?? 'courses',
        source: c.source ?? (c.roadmap_id ? 'seeded' : 'user'),
      }));

      // Back-fill accounts saved before per-path progress existed: without
      // this, the very first template switch after this fix ships would
      // still look like it wiped the path someone was already mid-way
      // through, since there'd be no snapshot yet to resume from.
      const migratedProgress = { ...(canvas.progressByTemplate ?? {}) };
      if (canvas.activeTemplateId && !migratedProgress[canvas.activeTemplateId] && canvas.nodes?.length) {
        migratedProgress[canvas.activeTemplateId] = { nodes: canvas.nodes, edges: canvas.edges };
      }

      set({
        roadmaps: (roadmaps as Roadmap[]) ?? [],
        courses: normalizedCourses,
        topics: (topics as Topic[]) ?? [],
        schedules: (schedules as Schedule[]) ?? [],
        assessments: (assessments as Assessment[]) ?? [],
        grades: (grades as Grade[]) ?? [],
        localNodes: canvas.nodes ?? [],
        localEdges: canvas.edges ?? [],
        activeTemplateId: canvas.activeTemplateId ?? null,
        customTemplates: canvas.customTemplates ?? {},
        progressByTemplate: migratedProgress,
      });

      // Repair accounts where a template was loaded as the Primary Path
      // before it had a matching `courses` row (the bug that made the
      // course dropdown empty everywhere it should have shown this path).
      // Uses the current canvas progress, not the template's defaults, so
      // completed/in-progress topics aren't reset.
      const activeTplId = canvas.activeTemplateId;
      if (activeTplId) {
        const allTpls = { ...ROADMAP_TEMPLATES, ...(canvas.customTemplates ?? {}) };
        const tpl = allTpls[activeTplId];
        const alreadyEnrolled = (courses as Course[] | null)?.some(
          c => c.roadmap_id === tpl?.id ||
               c.title.toLowerCase() === (tpl?.name ?? '').toLowerCase() ||
               (tpl?.roadmapUrl && c.source_url === tpl.roadmapUrl)
        );
        if (tpl && !alreadyEnrolled) {
          void get().addTemplateAsCourse(activeTplId).catch(err =>
            console.warn('[RoadmapStore] Backfill enrollment failed:', err)
          );
        }
      }
    } catch (err) {
      console.warn('[RoadmapStore] Fetch failed:', err);
    } finally {
      set({ loading: false });
    }
  },

  updateTopicStatus: async (id, status) => {
    get().setLocalTopicStatus(id, status);

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('topics').update({ status }).eq('id', id);
      if (error) console.warn('[RoadmapStore] Topic status sync failed:', error.message);
    }
  },

  setLocalTopicStatus: (id, status) => {
    set({
      localNodes: get().localNodes.map(n => {
        if (n.id !== id) return n;
        // Stamp (or clear) completedAt on the transition itself, not just
        // whenever status happens to be 'completed' — that's what lets
        // Analytics count *when* a topic was finished, for the velocity
        // chart, instead of only how many are finished right now.
        if (status === 'completed' && n.status !== 'completed') {
          return { ...n, status, completedAt: new Date().toISOString() };
        }
        if (status !== 'completed' && n.status === 'completed') {
          return { ...n, status, completedAt: undefined };
        }
        return { ...n, status };
      }),
    });

    // Keep the `topics` list (used for notes-linking and course lookups) in
    // step with the canvas rather than letting the two drift apart.
    const { topics } = get();
    if (topics.some(t => t.id === id)) {
      set({ topics: topics.map(t => (t.id === id ? { ...t, status } : t)) });
    }

    get().persistCanvas();
  },

  getActiveCourseId: () => {
    const { courses, activeTemplateId, customTemplates } = get();
    if (!courses.length) return null;
    if (activeTemplateId) {
      const allTemplates = { ...ROADMAP_TEMPLATES, ...customTemplates };
      const tplMatch = courses.find(
        c => c.roadmap_id === activeTemplateId ||
             c.title.toLowerCase() === (allTemplates[activeTemplateId]?.name ?? '').toLowerCase()
      );
      if (tplMatch) return tplMatch.id;
    }
    return (courses.find(c => c.status === 'in_progress') ?? courses[0]).id;
  },

  addTopic: async ({ label, phase, status = 'not_started', parentId, description, courseId }) => {
    const cleanLabel = label.trim();
    if (!cleanLabel) return { nodeId: '', courseId: null };

    const nodeId =
      cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
      '_' + Date.now().toString(36).slice(-4);

    const newNode: RoadmapNode = {
      id: nodeId,
      label: cleanLabel,
      phase: phase.trim() || 'General',
      status,
      description,
    };

    set({
      localNodes: [...get().localNodes, newNode],
      localEdges: parentId
        ? [...get().localEdges, { source: parentId, target: nodeId }]
        : get().localEdges,
    });
    get().persistCanvas();

    const resolvedCourseId = courseId ?? get().getActiveCourseId();

    if (resolvedCourseId) {
      const userId = await getActiveUserId();
      const now = new Date().toISOString();

      const topicRecord: Topic = {
        id: nodeId,
        course_id: resolvedCourseId,
        title: cleanLabel,
        phase: phase.trim() || 'General',
        status,
        parent_topic_id: parentId || undefined,
        created_at: now,
      };

      set({ topics: [...get().topics, topicRecord] });

      if (isSupabaseConfigured && userId) {
        const { error } = await supabase.from('topics').insert({
          id: topicRecord.id,
          course_id: topicRecord.course_id,
          title: topicRecord.title,
          phase: topicRecord.phase,
          status: topicRecord.status,
          parent_topic_id: topicRecord.parent_topic_id ?? null,
          created_at: topicRecord.created_at,
        });
        if (error) console.warn('[RoadmapStore] Topic insert failed:', error.message);
      }
    }

    return { nodeId, courseId: resolvedCourseId };
  },

  deleteTopic: (id) => {
    set({
      localNodes: get().localNodes.filter(n => n.id !== id),
      localEdges: get().localEdges.filter(e => e.source !== id && e.target !== id),
    });
    get().persistCanvas();

    if (isSupabaseConfigured) {
      void supabase.from('topics').delete().eq('id', id);
    }
    set({ topics: get().topics.filter(t => t.id !== id) });
  },

  updateTopic: (id, changes) => {
    set({ localNodes: get().localNodes.map(n => (n.id === id ? { ...n, ...changes } : n)) });
    get().persistCanvas();
  },

  loadTemplate: (templateKey) => {
    const tpl = get().customTemplates[templateKey] || ROADMAP_TEMPLATES[templateKey];
    if (!tpl) return;

    // Resume this path exactly where it was left (persistCanvas keeps
    // progressByTemplate current for whatever path is active, including the
    // one we're switching away from right now) rather than reloading the
    // template's pristine, all-not-started defaults every time.
    const saved = get().progressByTemplate[templateKey];

    set({
      localNodes: saved ? saved.nodes.map(n => ({ ...n })) : tpl.nodes.map(n => ({ ...n })),
      localEdges: saved ? saved.edges.map(e => ({ ...e })) : tpl.edges.map(e => ({ ...e })),
      activeTemplateId: templateKey,
    });
    get().persistCanvas();

    // Picking a template makes it the Primary Path everywhere in the app —
    // it needs a real `courses` row and `topics` rows from the moment it's
    // chosen, or nothing about it (topic status, linked notes) can actually
    // save. Safe to call every time: addTemplateAsCourse no-ops if a
    // matching course already exists.
    void get().addTemplateAsCourse(templateKey).catch(err =>
      console.warn('[RoadmapStore] Auto-enroll on template load failed:', err)
    );
  },

  clearRoadmap: () => {
    const { activeTemplateId, progressByTemplate } = get();
    const updatedProgress = { ...progressByTemplate };
    if (activeTemplateId) delete updatedProgress[activeTemplateId];
    set({ localNodes: [], localEdges: [], activeTemplateId: null, progressByTemplate: updatedProgress });
    get().persistCanvas();
  },

  deleteCustomTemplate: (templateId) => {
    const updated = { ...get().customTemplates };
    delete updated[templateId];
    const updatedProgress = { ...get().progressByTemplate };
    delete updatedProgress[templateId];
    set({ customTemplates: updated, progressByTemplate: updatedProgress });
    if (get().activeTemplateId === templateId) set({ activeTemplateId: null });
    get().persistCanvas();
  },

  importRoadmap: async ({
    title,
    description,
    category = 'custom',
    nodes,
    edges,
    enrollAsCourse = true,
  }) => {
    const cleanTitle = title.trim() || 'Custom Roadmap';
    const templateId = `custom_${slugify(cleanTitle)}_${Date.now().toString(36).slice(-4)}`;

    const sanitizedNodes: RoadmapNode[] = nodes.map(n => ({
      ...n,
      resources: n.resources?.map(r => ({ ...r, url: safeUrl(r.url) })),
    }));

    const customTpl: RoadmapTemplate = {
      id: templateId,
      name: cleanTitle,
      icon: '🗺️',
      badge: 'CUSTOM',
      category: category || 'custom',
      description: description?.trim() || `${sanitizedNodes.length} curriculum topics custom roadmap`,
      roadmapUrl: '',
      nodes: sanitizedNodes,
      edges,
    };

    set({
      customTemplates: { ...get().customTemplates, [templateId]: customTpl },
      localNodes: sanitizedNodes,
      localEdges: edges,
      activeTemplateId: templateId,
    });
    get().persistCanvas();

    let createdCourse: Course | undefined;
    if (enrollAsCourse) {
      createdCourse = await get().addTemplateAsCourse(templateId);
    }

    return { templateId, courseId: createdCourse?.id };
  },

  resetLocalRoadmap: () => {
    set({ localNodes: get().localNodes.map(n => ({ ...n, status: 'not_started' as TopicStatus, completedAt: undefined })) });
    get().persistCanvas();
  },

  addCourse: async (course) => {
    const userId = await getActiveUserId();
    if (!userId) return;

    const newCourse: Course = {
      ...course,
      mode: course.mode ?? 'courses',
      source: course.source ?? 'user',
      id: crypto.randomUUID ? crypto.randomUUID() : `course_${Date.now()}`,
      user_id: userId,
      created_at: new Date().toISOString(),
    };

    const previous = get().courses;
    set({ courses: [newCourse, ...previous] });

    const { error } = await supabase.from('courses').insert(newCourse);
    if (error) {
      console.warn('[RoadmapStore] Course insert failed, rolling back:', error.message);
      set({ courses: previous });
    }
  },

  deleteCourse: async (id) => {
    const previous = get().courses;
    set({ courses: previous.filter(c => c.id !== id) });

    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) {
      console.warn('[RoadmapStore] Course delete failed, rolling back:', error.message);
      set({ courses: previous });
    } else {
      // DB-side ON DELETE CASCADE handles schedule/assessments/grades server
      // side; mirror that in local state too (grades cascade from assessments).
      const remainingAssessmentIds = new Set(
        get().assessments.filter(a => a.course_id !== id).map(a => a.id)
      );
      set({
        topics: get().topics.filter(t => t.course_id !== id),
        schedules: get().schedules.filter(s => s.course_id !== id),
        assessments: get().assessments.filter(a => a.course_id !== id),
        grades: get().grades.filter(g => remainingAssessmentIds.has(g.assessment_id)),
      });
    }
  },

  addTemplateAsCourse: async (templateKey: string) => {
    const isCustomTemplate = Boolean(get().customTemplates[templateKey]);
    const tpl = get().customTemplates[templateKey] || ROADMAP_TEMPLATES[templateKey];
    if (!tpl) throw new Error(`Template ${templateKey} not found`);

    const existing = get().courses.find(c =>
      c.roadmap_id === tpl.id ||
      c.title.toLowerCase() === tpl.name.toLowerCase() ||
      (tpl.roadmapUrl && c.source_url === tpl.roadmapUrl)
    );
    if (existing) return existing;

    const userId = await getActiveUserId();
    if (!userId) throw new Error('You need to be signed in to start a roadmap.');

    const now = new Date().toISOString();
    const newCourse: Course = {
      id: crypto.randomUUID ? crypto.randomUUID() : `course_${Date.now()}`,
      user_id: userId,
      roadmap_id: tpl.id,
      title: tpl.name,
      source_url: tpl.roadmapUrl || undefined,
      start_date: new Date().toISOString().split('T')[0],
      status: 'in_progress',
      // Sequential/prioritized learning is what a template roadmap is —
      // Courses mode. A built-in template is 'seeded'; a custom template the
      // user imported themselves (importRoadmap) is 'user' even though it
      // goes through this same enrollment path.
      mode: 'courses',
      source: isCustomTemplate ? 'user' : 'seeded',
      created_at: now,
    };

    // If this template is the one currently on the canvas, enroll it with
    // whatever progress is already there (status per node) rather than the
    // template's pristine defaults — otherwise enrolling after the fact
    // would silently reset completed/in-progress topics back to 'not_started'.
    const sourceNodes = get().activeTemplateId === templateKey ? get().localNodes : tpl.nodes;
    const newTopics: Topic[] = sourceNodes.map(n => ({
      id: n.id,
      course_id: newCourse.id,
      title: n.label,
      phase: n.phase,
      status: n.status,
      created_at: now,
    }));

    const previousCourses = get().courses;
    const previousTopics = get().topics;
    set({ courses: [newCourse, ...previousCourses], topics: [...previousTopics, ...newTopics] });

    const { error: courseErr } = await supabase.from('courses').insert(newCourse);
    if (courseErr) {
      // Roll back — an unsynced course left in local state is exactly what
      // caused confusing downstream errors (e.g. linking a note to a course
      // that doesn't actually exist yet, failing with a foreign-key error
      // instead of this one).
      console.warn('[RoadmapStore] Course insert failed, rolling back:', courseErr.message);
      set({ courses: previousCourses, topics: previousTopics });
      throw new Error(`Could not enroll "${tpl.name}": ${courseErr.message}`);
    }

    if (newTopics.length > 0) {
      const { error: topicErr } = await supabase.from('topics').insert(newTopics);
      if (topicErr) console.warn('[RoadmapStore] Topics insert failed:', topicErr.message);
    }

    return newCourse;
  },

  // ── Mode-aware course queries ──────────────────────────────────────────────
  getCoursesByMode: (mode) => get().courses.filter(c => c.mode === mode),

  getActiveCourses: (mode) => {
    const active = get().courses.filter(c => c.status === 'not_started' || c.status === 'in_progress');
    return mode ? active.filter(c => c.mode === mode) : active;
  },

  // ── Academic mode: schedule CRUD ─────────────────────────────────────────
  addSchedule: async (schedule) => {
    const newSchedule: Schedule = {
      ...schedule,
      id: crypto.randomUUID ? crypto.randomUUID() : `sched_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const previous = get().schedules;
    set({ schedules: [...previous, newSchedule] });

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('schedule').insert(newSchedule);
      if (error) {
        console.warn('[RoadmapStore] Schedule insert failed, rolling back:', error.message);
        set({ schedules: previous });
      }
    }
  },

  updateSchedule: async (id, changes) => {
    const previous = get().schedules;
    set({ schedules: previous.map(s => (s.id === id ? { ...s, ...changes } : s)) });

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('schedule').update(changes).eq('id', id);
      if (error) {
        console.warn('[RoadmapStore] Schedule update failed, rolling back:', error.message);
        set({ schedules: previous });
      }
    }
  },

  deleteSchedule: async (id) => {
    const previous = get().schedules;
    set({ schedules: previous.filter(s => s.id !== id) });

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('schedule').delete().eq('id', id);
      if (error) {
        console.warn('[RoadmapStore] Schedule delete failed, rolling back:', error.message);
        set({ schedules: previous });
      }
    }
  },

  getScheduleForCourse: (courseId) => get().schedules.filter(s => s.course_id === courseId),

  // ── Academic mode: assessment CRUD ───────────────────────────────────────
  addAssessment: async (assessment) => {
    const newAssessment: Assessment = {
      ...assessment,
      id: crypto.randomUUID ? crypto.randomUUID() : `assess_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const previous = get().assessments;
    set({ assessments: [...previous, newAssessment] });

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('assessments').insert(newAssessment);
      if (error) {
        console.warn('[RoadmapStore] Assessment insert failed, rolling back:', error.message);
        set({ assessments: previous });
      }
    }
  },

  updateAssessment: async (id, changes) => {
    const previous = get().assessments;
    set({ assessments: previous.map(a => (a.id === id ? { ...a, ...changes } : a)) });

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('assessments').update(changes).eq('id', id);
      if (error) {
        console.warn('[RoadmapStore] Assessment update failed, rolling back:', error.message);
        set({ assessments: previous });
      }
    }
  },

  deleteAssessment: async (id) => {
    const previousAssessments = get().assessments;
    const previousGrades = get().grades;
    set({
      assessments: previousAssessments.filter(a => a.id !== id),
      grades: previousGrades.filter(g => g.assessment_id !== id),
    });

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('assessments').delete().eq('id', id);
      if (error) {
        console.warn('[RoadmapStore] Assessment delete failed, rolling back:', error.message);
        set({ assessments: previousAssessments, grades: previousGrades });
      }
      // Grades cascade-delete with their assessment at the DB level (see
      // migration), so no separate grades delete call is needed here.
    }
  },

  getAssessmentsForCourse: (courseId) => get().assessments.filter(a => a.course_id === courseId),

  // ── Academic mode: grade CRUD ─────────────────────────────────────────────
  setGrade: async (assessmentId, score, maxScore) => {
    const previous = get().grades;
    const existing = previous.find(g => g.assessment_id === assessmentId);

    if (existing) {
      const updated = { ...existing, score, max_score: maxScore };
      set({ grades: previous.map(g => (g.id === existing.id ? updated : g)) });

      if (isSupabaseConfigured) {
        const { error } = await supabase.from('grades').update({ score, max_score: maxScore }).eq('id', existing.id);
        if (error) {
          console.warn('[RoadmapStore] Grade update failed, rolling back:', error.message);
          set({ grades: previous });
        }
      }
      return;
    }

    const newGrade: Grade = {
      id: crypto.randomUUID ? crypto.randomUUID() : `grade_${Date.now()}`,
      assessment_id: assessmentId,
      score,
      max_score: maxScore,
      created_at: new Date().toISOString(),
    };
    set({ grades: [...previous, newGrade] });

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('grades').insert(newGrade);
      if (error) {
        console.warn('[RoadmapStore] Grade insert failed, rolling back:', error.message);
        set({ grades: previous });
      }
    }
  },

  deleteGrade: async (id) => {
    const previous = get().grades;
    set({ grades: previous.filter(g => g.id !== id) });

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('grades').delete().eq('id', id);
      if (error) {
        console.warn('[RoadmapStore] Grade delete failed, rolling back:', error.message);
        set({ grades: previous });
      }
    }
  },

  // ── Academic mode: derived grade / GPA ────────────────────────────────────
  getCourseGrade: (courseId) => {
    const { assessments, grades } = get();
    const courseAssessments = assessments.filter(a => a.course_id === courseId);

    let weightedScoreSum = 0;
    let weightGraded = 0;

    for (const assessment of courseAssessments) {
      const grade = grades.find(g => g.assessment_id === assessment.id);
      if (!grade || grade.max_score <= 0) continue;
      const pct = grade.score / grade.max_score;
      weightedScoreSum += pct * assessment.weight;
      weightGraded += assessment.weight;
    }

    if (weightGraded <= 0) {
      return { course_id: courseId, percentage: null, gradePoint: null, weightGraded: 0 };
    }

    // Normalize by the weight actually graded so an ungraded final exam
    // doesn't drag today's percentage toward zero before it's been taken.
    const percentage = (weightedScoreSum / weightGraded) * 100;

    return {
      course_id: courseId,
      percentage,
      gradePoint: percentageToGradePoint(percentage),
      weightGraded,
    };
  },

  getGPA: () => {
    const activeAcademicCourses = get().getActiveCourses('academic');
    const gradePoints = activeAcademicCourses
      .map(c => get().getCourseGrade(c.id).gradePoint)
      .filter((gp): gp is number => gp !== null);

    if (gradePoints.length === 0) return null;
    return gradePoints.reduce((sum, gp) => sum + gp, 0) / gradePoints.length;
  },
}));

/** Standard 4.0-scale conversion from a weighted percentage. */
function percentageToGradePoint(percentage: number): number {
  if (percentage >= 93) return 4.0;
  if (percentage >= 90) return 3.7;
  if (percentage >= 87) return 3.3;
  if (percentage >= 83) return 3.0;
  if (percentage >= 80) return 2.7;
  if (percentage >= 77) return 2.3;
  if (percentage >= 73) return 2.0;
  if (percentage >= 70) return 1.7;
  if (percentage >= 67) return 1.3;
  if (percentage >= 63) return 1.0;
  if (percentage >= 60) return 0.7;
  return 0.0;
}
