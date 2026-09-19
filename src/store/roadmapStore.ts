import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { storage, getActiveUserId } from '../lib/storage';
import type { Course, Topic, Roadmap, TopicStatus, RoadmapNode, RoadmapEdge } from '../types';
import { ROADMAP_TEMPLATES, type RoadmapTemplate } from '../data/roadmapTemplates';
import { slugify, safeUrl } from '../lib/utils';

interface RoadmapState {
  roadmaps: Roadmap[];
  courses: Course[];
  topics: Topic[];
  loading: boolean;
  localNodes: RoadmapNode[];
  localEdges: RoadmapEdge[];
  activeTemplateId: string | null;
  customTemplates: Record<string, RoadmapTemplate>;

  fetchAll: () => Promise<void>;
  updateTopicStatus: (id: string, status: TopicStatus) => Promise<void>;
  /** Async — adds to canvas AND to the linked course's topic list (Supabase + localStorage) */
  addTopic: (topic: {
    label: string;
    phase: string;
    status?: TopicStatus;
    parentId?: string;
    description?: string;
    courseId?: string; // explicit course override; auto-resolved if omitted
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
  /** Returns the course_id that best matches the active roadmap template or first in_progress course */
  getActiveCourseId: () => string | null;

  addCourse: (course: Omit<Course, 'id' | 'created_at'>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  addTemplateAsCourse: (templateKey: string) => Promise<Course>;
}

const getInitialNodes = (): RoadmapNode[] => {
  const cached = storage.get<RoadmapNode[] | null>('local_nodes', null);
  return cached || [];
};

const getInitialEdges = (): RoadmapEdge[] => {
  const cachedNodes = storage.get<RoadmapNode[] | null>('local_nodes', null);
  if (!cachedNodes || cachedNodes.length === 0) {
    return [];
  }
  return storage.get<RoadmapEdge[]>('local_edges', []);
};

export const useRoadmapStore = create<RoadmapState>((set, get) => ({
  roadmaps: storage.get<Roadmap[]>('roadmaps', []),
  courses: storage.get<Course[]>('courses', []),
  topics: storage.get<Topic[]>('topics', []),
  loading: false,
  localNodes: getInitialNodes(),
  localEdges: getInitialEdges(),
  activeTemplateId: storage.get<string | null>('active_template_id', null),
  customTemplates: storage.get<Record<string, RoadmapTemplate>>('custom_templates', {}),

  fetchAll: async () => {
    if (!isSupabaseConfigured) return;
    set({ loading: true });
    try {
      const userId = await getActiveUserId();
      if (userId === 'local') return;

      const [{ data: roadmaps }, { data: courses }, { data: topics }] = await Promise.all([
        supabase.from('roadmaps').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('courses').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('topics').select('*').order('created_at'),
      ]);

      if (roadmaps) {
        set({ roadmaps });
        storage.set('roadmaps', roadmaps);
      }
      if (courses) {
        set({ courses });
        storage.set('courses', courses);
      }
      if (topics) {
        set({ topics });
        storage.set('topics', topics);
      }
    } catch (err) {
      console.warn('[RoadmapStore] Cloud sync note: using cached roadmap data', err);
    } finally {
      set({ loading: false });
    }
  },

  updateTopicStatus: async (id, status) => {
    get().setLocalTopicStatus(id, status);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('topics').update({ status }).eq('id', id);
      } catch (err) {
        console.warn('[RoadmapStore] Topic update sync failed:', err);
      }
    }
  },

  setLocalTopicStatus: (id, status) => {
    const updated = get().localNodes.map((n) => (n.id === id ? { ...n, status } : n));
    set({ localNodes: updated });
    storage.set('local_nodes', updated);
  },

  getActiveCourseId: () => {
    const { courses, activeTemplateId, customTemplates } = get();
    if (!courses.length) return null;
    // Prefer the course whose title / roadmap_id matches the active template
    if (activeTemplateId) {
      const allTemplates = { ...ROADMAP_TEMPLATES, ...customTemplates };
      const tplMatch = courses.find(
        c => c.roadmap_id === activeTemplateId ||
             c.title.toLowerCase() === (allTemplates[activeTemplateId]?.name ?? '').toLowerCase()
      );
      if (tplMatch) return tplMatch.id;
    }
    // Fall back to first in_progress course, then first course
    return (courses.find(c => c.status === 'in_progress') ?? courses[0]).id;
  },

  addTopic: async ({ label, phase, status = 'not_started', parentId, description, courseId }) => {
    const cleanLabel = label.trim();
    if (!cleanLabel) return { nodeId: '', courseId: null };

    const nodeId =
      cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
      '_' + Date.now().toString(36).slice(-4);

    // ── 1. Update the D3 canvas (localNodes / localEdges) ──────────────────
    const newNode: RoadmapNode = {
      id: nodeId,
      label: cleanLabel,
      phase: phase.trim() || 'General',
      status,
      description,
    };
    const newNodes = [...get().localNodes, newNode];
    const newEdges = parentId
      ? [...get().localEdges, { source: parentId, target: nodeId }]
      : [...get().localEdges];

    set({ localNodes: newNodes, localEdges: newEdges });
    storage.set('local_nodes', newNodes);
    storage.set('local_edges', newEdges);

    // ── 2. Resolve the linked course ────────────────────────────────────────
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

      // Persist to localStorage topics
      const updatedTopics = [...get().topics, topicRecord];
      set({ topics: updatedTopics });
      storage.set('topics', updatedTopics);

      // Persist to Supabase if configured
      if (isSupabaseConfigured && userId !== 'local') {
        try {
          await supabase.from('topics').insert({
            id: topicRecord.id,
            course_id: topicRecord.course_id,
            title: topicRecord.title,
            phase: topicRecord.phase,
            status: topicRecord.status,
            parent_topic_id: topicRecord.parent_topic_id ?? null,
            created_at: topicRecord.created_at,
          });
        } catch (err) {
          console.warn('[RoadmapStore] Topic DB insert failed (canvas still updated):', err);
        }
      }
    }

    return { nodeId, courseId: resolvedCourseId };
  },

  deleteTopic: (id) => {
    const newNodes = get().localNodes.filter(n => n.id !== id);
    const newEdges = get().localEdges.filter(e => e.source !== id && e.target !== id);

    set({ localNodes: newNodes, localEdges: newEdges });
    storage.set('local_nodes', newNodes);
    storage.set('local_edges', newEdges);
  },

  updateTopic: (id, changes) => {
    const newNodes = get().localNodes.map(n => n.id === id ? { ...n, ...changes } : n);
    set({ localNodes: newNodes });
    storage.set('local_nodes', newNodes);
  },

  loadTemplate: (templateKey) => {
    const tpl = get().customTemplates[templateKey] || ROADMAP_TEMPLATES[templateKey];
    if (!tpl) return;

    const copiedNodes = tpl.nodes.map(n => ({ ...n }));
    const copiedEdges = tpl.edges.map(e => ({ ...e }));

    set({ localNodes: copiedNodes, localEdges: copiedEdges, activeTemplateId: templateKey });
    storage.set('local_nodes', copiedNodes);
    storage.set('local_edges', copiedEdges);
    storage.set('active_template_id', templateKey);
  },

  clearRoadmap: () => {
    set({ localNodes: [], localEdges: [], activeTemplateId: null });
    storage.set('local_nodes', []);
    storage.set('local_edges', []);
    storage.set('active_template_id', null);
  },

  deleteCustomTemplate: (templateId) => {
    const updated = { ...get().customTemplates };
    delete updated[templateId];
    set({ customTemplates: updated });
    storage.set('custom_templates', updated);

    if (get().activeTemplateId === templateId) {
      set({ activeTemplateId: null });
      storage.set('active_template_id', null);
    }
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
      resources: n.resources?.map(r => ({
        ...r,
        url: safeUrl(r.url),
      })),
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

    const updatedCustom = { ...get().customTemplates, [templateId]: customTpl };
    set({
      customTemplates: updatedCustom,
      localNodes: sanitizedNodes,
      localEdges: edges,
      activeTemplateId: templateId,
    });
    storage.set('custom_templates', updatedCustom);
    storage.set('local_nodes', sanitizedNodes);
    storage.set('local_edges', edges);
    storage.set('active_template_id', templateId);

    let createdCourse: Course | undefined;
    if (enrollAsCourse) {
      createdCourse = await get().addTemplateAsCourse(templateId);
    }

    return { templateId, courseId: createdCourse?.id };
  },

  resetLocalRoadmap: () => {
    const reset = get().localNodes.map((n) => ({ ...n, status: 'not_started' as TopicStatus }));
    set({ localNodes: reset });
    storage.set('local_nodes', reset);
  },

  addCourse: async (course) => {
    const userId = await getActiveUserId();
    const now = new Date().toISOString();
    const newCourse: Course = {
      ...course,
      id: crypto.randomUUID ? crypto.randomUUID() : `course_${Date.now()}`,
      user_id: userId,
      created_at: now,
    };

    const updated = [newCourse, ...get().courses];
    set({ courses: updated });
    storage.set('courses', updated);

    if (isSupabaseConfigured && userId !== 'local') {
      try {
        await supabase.from('courses').insert(newCourse);
      } catch (err) {
        console.warn('[RoadmapStore] Course insert sync failed:', err);
      }
    }
  },

  deleteCourse: async (id) => {
    const updated = get().courses.filter(c => c.id !== id);
    set({ courses: updated });
    storage.set('courses', updated);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('courses').delete().eq('id', id);
      } catch (err) {
        console.warn('[RoadmapStore] Course delete sync failed:', err);
      }
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
    if (existing) {
      return existing;
    }

    const userId = await getActiveUserId();
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

    const updatedCourses = [newCourse, ...get().courses];
    set({ courses: updatedCourses });
    storage.set('courses', updatedCourses);

    // Also populate topics table for this course so topics are tracked in database & analytics!
    const newTopics: Topic[] = tpl.nodes.map(n => ({
      id: n.id,
      course_id: newCourse.id,
      title: n.label,
      phase: n.phase,
      status: n.status,
      created_at: now,
    }));
    const updatedTopics = [...get().topics, ...newTopics];
    set({ topics: updatedTopics });
    storage.set('topics', updatedTopics);

    if (isSupabaseConfigured && userId !== 'local') {
      try {
        await supabase.from('courses').insert(newCourse);
        if (newTopics.length > 0) {
          await supabase.from('topics').insert(newTopics);
        }
      } catch (err) {
        console.warn('[RoadmapStore] Course/topics insert sync failed:', err);
      }
    }

    return newCourse;
  },
}));