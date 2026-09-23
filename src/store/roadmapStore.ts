import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getActiveUserId } from '../lib/storage';
import { loadUserState, queueUserState } from '../lib/userState';
import type { Course, Topic, Roadmap, TopicStatus, RoadmapNode, RoadmapEdge } from '../types';
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

  addCourse: (course: Omit<Course, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  addTemplateAsCourse: (templateKey: string) => Promise<Course>;
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
        set({ ...EMPTY_CANVAS, roadmaps: [], courses: [], topics: [], localNodes: [], localEdges: [], loading: false });
        return;
      }

      const [{ data: roadmaps }, { data: courses }, { data: topics }, canvas] = await Promise.all([
        supabase.from('roadmaps').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('courses').select('*').eq('user_id', userId).order('created_at'),
        // Row Level Security scopes topics to this user's courses automatically.
        supabase.from('topics').select('*').order('created_at'),
        loadUserState<RoadmapCanvas>('roadmap_canvas', EMPTY_CANVAS),
      ]);

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
        courses: (courses as Course[]) ?? [],
        topics: (topics as Topic[]) ?? [],
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
      set({ topics: get().topics.filter(t => t.course_id !== id) });
    }
  },

  addTemplateAsCourse: async (templateKey: string) => {
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
}));
