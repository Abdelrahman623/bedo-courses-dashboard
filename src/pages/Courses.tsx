import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, BookOpen, ExternalLink, Calendar, Trash2, Sparkles, Search, Layers, Upload, CheckCircle2, ChevronRight, FileText, ArrowRight, StickyNote } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { SlideOver } from '../components/ui/SlideOver';
import { ProgressRing } from '../components/ui/ProgressRing';
import { RoadmapGraph } from '../components/roadmap/RoadmapGraph';
import { useRoadmapStore } from '../store/roadmapStore';
import { useSessionStore } from '../store/sessionStore';
import { useNotesStore } from '../store/notesStore';
import { pct, formatDate, minsToHHMM, safeUrl } from '../lib/utils';
import type { Course, CourseStatus, TopicStatus, RoadmapNode, RoadmapEdge, Note } from '../types';
import { ROADMAP_TEMPLATES, type RoadmapTemplate } from '../data/roadmapTemplates';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const EMPTY_COURSE_FORM = {
  title: '',
  source_url: '',
  start_date: new Date().toISOString().split('T')[0],
  status: 'in_progress' as CourseStatus,
};

const EMPTY_TOPIC_FORM = {
  label: '',
  phase: '',
  status: 'not_started' as TopicStatus,
  parentId: '',
  courseId: '', // '' = auto-resolve from active course
  description: '',
};

const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All Paths' },
  { id: 'custom', label: '⭐ My Custom' },
  { id: 'development', label: 'Development' },
  { id: 'ai_data', label: 'AI & Data' },
  { id: 'devops_security', label: 'DevOps & Security' },
  { id: 'architecture_design', label: 'Architecture & Design' },
  { id: 'product_management', label: 'Product & Mgmt' },
] as const;

export const Courses: React.FC = () => {
  const navigate = useNavigate();
  const {
    courses, topics, localNodes, fetchAll, addCourse, deleteCourse,
    addTopic, loadTemplate, clearRoadmap, importRoadmap,
    addTemplateAsCourse, activeTemplateId, getActiveCourseId,
    customTemplates, deleteCustomTemplate,
  } = useRoadmapStore();
  const { sessions } = useSessionStore();
  const { notes, setActiveNote, createNote, deleteNote, fetchNotes } = useNotesStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const [activeView, setActiveViewState] = useState<'roadmap' | 'courses'>(
    viewParam === 'courses' ? 'courses' : 'roadmap'
  );

  useEffect(() => {
    if (viewParam === 'courses' || viewParam === 'roadmap') {
      setActiveViewState(viewParam);
    }
  }, [viewParam]);

  const setActiveView = useCallback((view: 'roadmap' | 'courses') => {
    setActiveViewState(view);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('view', view);
      return next;
    });
  }, [setSearchParams]);
  const [enrolledNotice, setEnrolledNotice] = useState<string | null>(null);
  const [addedTopicNotice, setAddedTopicNotice] = useState<string | null>(null);

  // Course Notes Panel State
  const [selectedCourseForNotes, setSelectedCourseForNotes] = useState<Course | null>(null);
  const [notesSearchQuery, setNotesSearchQuery] = useState('');
  const [newNoteTitleInput, setNewNoteTitleInput] = useState('');
  const [isCreatingQuickNote, setIsCreatingQuickNote] = useState(false);

  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Template Browser State
  const [templateTab, setTemplateTab] = useState<'explore' | 'import'>('explore');
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState<string>('all');
  const [importText, setImportText] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importDescription, setImportDescription] = useState('');
  const [importCategory, setImportCategory] = useState<RoadmapTemplate['category']>('custom');
  const [importEnrollCourse, setImportEnrollCourse] = useState(true);
  const [importError, setImportError] = useState<string | null>(null);

  // Forms
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE_FORM);
  const [topicForm, setTopicForm] = useState(EMPTY_TOPIC_FORM);
  const [saving, setSaving] = useState(false);

  // Delete Course Confirmation
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  // Safe snippet extractor for TipTap content or plain text
  const extractSnippet = useCallback((content: string, maxLen = 110): string => {
    if (!content) return '';
    try {
      const json = JSON.parse(content);
      let text = '';
      const walk = (node: any) => {
        if (node.text) text += node.text + ' ';
        if (node.content && Array.isArray(node.content)) {
          for (const child of node.content) walk(child);
        }
      };
      walk(json);
      text = text.trim();
      return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
    } catch {
      const clean = content.replace(/<[^>]+>/g, '').trim();
      return clean.length > maxLen ? clean.slice(0, maxLen) + '...' : clean;
    }
  }, []);

  // Stats from local roadmap nodes
  const totalTopics = localNodes.length;
  const completedTopics = localNodes.filter(n => n.status === 'completed').length;
  const inProgressTopics = localNodes.filter(n => n.status === 'in_progress').length;

  // Time logged per course (from sessions)
  const timePerCourse = sessions.reduce<Record<string, number>>((acc, s) => {
    if (s.course_id) acc[s.course_id] = (acc[s.course_id] || 0) + s.duration_mins;
    return acc;
  }, {});

  // Distinct phases for topic dropdown
  const existingPhases = Array.from(new Set(localNodes.map(n => n.phase))).filter(Boolean);

  const allTemplates = useMemo(() => {
    return { ...ROADMAP_TEMPLATES, ...customTemplates };
  }, [customTemplates]);

  // Active roadmap template resolution
  const activeTemplate = useMemo(() => {
    if (activeTemplateId && allTemplates[activeTemplateId]) {
      return allTemplates[activeTemplateId];
    }
    if (localNodes.length > 0) {
      return Object.values(allTemplates).find(
        tpl => tpl.nodes.length === localNodes.length && tpl.nodes[0]?.id === localNodes[0]?.id
      ) || null;
    }
    return null;
  }, [activeTemplateId, localNodes, allTemplates]);

  const isCurrentTemplateEnrolled = useMemo(() => {
    if (!activeTemplate) return false;
    return courses.some(
      c => c.roadmap_id === activeTemplate.id ||
           c.title.toLowerCase() === activeTemplate.name.toLowerCase() ||
           (activeTemplate.roadmapUrl && c.source_url === activeTemplate.roadmapUrl)
    );
  }, [activeTemplate, courses]);

  const isTemplateEnrolled = useCallback((tpl: RoadmapTemplate) => {
    return courses.some(
      c => c.roadmap_id === tpl.id ||
           c.title.toLowerCase() === tpl.name.toLowerCase() ||
           (tpl.roadmapUrl && c.source_url === tpl.roadmapUrl)
    );
  }, [courses]);

  const handleEnrollTemplate = async (templateKey: string) => {
    try {
      const tpl = allTemplates[templateKey];
      if (!tpl) return;
      await addTemplateAsCourse(templateKey);
      setEnrolledNotice(`🎉 Enrolled in "${tpl.name}"! Added to My Courses.`);
      setTimeout(() => setEnrolledNotice(null), 3500);
    } catch (err: any) {
      console.error(err);
    }
  };

  const findTemplateForCourse = useCallback((course: { title: string; source_url?: string; roadmap_id?: string }) => {
    return Object.values(allTemplates).find(
      t => t.id === course.roadmap_id ||
           t.name.toLowerCase() === course.title.toLowerCase() ||
           (course.source_url && course.source_url === t.roadmapUrl)
    );
  }, [allTemplates]);

  // Resolve topic label for badges
  const getTopicName = useCallback((topicId: string) => {
    const fromLocal = localNodes.find(n => n.id === topicId)?.label;
    if (fromLocal) return fromLocal;
    const fromTopics = topics.find(t => t.id === topicId)?.title;
    if (fromTopics) return fromTopics;
    return 'Milestone';
  }, [localNodes, topics]);

  // Retrieve notes linked to a course directly or via course topics / active roadmap milestones
  const getNotesForCourse = useCallback((courseId: string) => {
    const courseTopicIds = new Set(topics.filter(t => t.course_id === courseId).map(t => t.id));
    const isPrimary = (activeTemplate && (
      courses.find(c => c.id === courseId)?.roadmap_id === activeTemplate.id ||
      courses.find(c => c.id === courseId)?.title.toLowerCase() === activeTemplate.name.toLowerCase()
    ));

    return notes.filter(n => {
      if (n.course_id === courseId) return true;
      if (n.topic_id && courseTopicIds.has(n.topic_id)) return true;
      if (isPrimary && n.topic_id && localNodes.some(node => node.id === n.topic_id)) return true;
      return false;
    });
  }, [notes, topics, activeTemplate, courses, localNodes]);

  // Primary active course resolution
  const primaryCourse = useMemo(() => {
    if (activeTemplate) {
      const match = courses.find(
        c => c.roadmap_id === activeTemplate.id ||
             c.title.toLowerCase() === activeTemplate.name.toLowerCase() ||
             (activeTemplate.roadmapUrl && c.source_url === activeTemplate.roadmapUrl)
      );
      if (match) return match;
    }
    const resolvedId = getActiveCourseId();
    if (resolvedId) {
      return courses.find(c => c.id === resolvedId) || null;
    }
    return courses[0] || null;
  }, [activeTemplate, courses, getActiveCourseId]);

  // Notes tied to the Primary Path Hero Card
  const primaryNotes = useMemo(() => {
    if (primaryCourse) {
      return getNotesForCourse(primaryCourse.id);
    }
    return notes.filter(n => n.topic_id && localNodes.some(node => node.id === n.topic_id));
  }, [primaryCourse, getNotesForCourse, notes, localNodes]);

  // Handler to open primary path notes
  const handleOpenPrimaryNotes = async () => {
    let target = primaryCourse;
    if (!target && activeTemplate) {
      try {
        target = await addTemplateAsCourse(activeTemplate.id);
      } catch (e) {
        console.error(e);
      }
    }
    if (target) {
      setSelectedCourseForNotes(target);
    } else if (courses.length > 0) {
      setSelectedCourseForNotes(courses[0]);
    } else {
      setShowCourseModal(true);
    }
  };

  // Open note in TipTap editor
  const handleOpenNoteInEditor = (note: Note) => {
    setActiveNote(note);
    navigate('/notes');
  };

  // Quick create note from the Course Notes drawer
  const handleCreateQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForNotes) return;
    const title = newNoteTitleInput.trim() || `${selectedCourseForNotes.title} - Notes`;
    setIsCreatingQuickNote(true);
    try {
      const newNote = await createNote({
        title,
        course_id: selectedCourseForNotes.id,
        note_type: 'linked',
        tags: ['course-notes'],
      });
      if (!newNote) return; // save failed — stay put rather than opening an empty editor
      setNewNoteTitleInput('');
      setActiveNote(newNote);
      navigate('/notes');
    } catch (err) {
      console.error('Failed to create note:', err);
    } finally {
      setIsCreatingQuickNote(false);
    }
  };

  const handleDeleteNoteFromDrawer = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      await deleteNote(noteId);
    }
  };

  // Notes currently listed in the SlideOver drawer, with search query filter applied
  const currentDrawerNotes = useMemo(() => {
    if (!selectedCourseForNotes) return [];
    const list = getNotesForCourse(selectedCourseForNotes.id);
    if (!notesSearchQuery.trim()) return list;
    const q = notesSearchQuery.toLowerCase().trim();
    return list.filter(n =>
      n.title?.toLowerCase().includes(q) ||
      n.tags?.some(t => t.toLowerCase().includes(q)) ||
      (n.content && n.content.toLowerCase().includes(q)) ||
      (n.topic_id && getTopicName(n.topic_id).toLowerCase().includes(q))
    );
  }, [selectedCourseForNotes, getNotesForCourse, notesSearchQuery, getTopicName]);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.title.trim()) return;
    setSaving(true);
    await addCourse({
      title: courseForm.title.trim(),
      source_url: courseForm.source_url.trim() || undefined,
      start_date: courseForm.start_date,
      status: courseForm.status,
    });
    setSaving(false);
    setShowCourseModal(false);
    setCourseForm(EMPTY_COURSE_FORM);
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicForm.label.trim()) return;

    const { nodeId, courseId: linkedCourseId } = await addTopic({
      label: topicForm.label.trim(),
      phase: topicForm.phase.trim() || 'Core Curriculum',
      status: topicForm.status,
      parentId: topicForm.parentId || undefined,
      description: topicForm.description.trim() || undefined,
      courseId: topicForm.courseId || undefined, // '' → auto-resolve
    });

    setShowTopicModal(false);
    setTopicForm(EMPTY_TOPIC_FORM);

    if (nodeId) {
      if (linkedCourseId) {
        const linkedCourseName = courses.find(c => c.id === linkedCourseId)?.title ?? 'your course';
        setAddedTopicNotice(`✅ "${topicForm.label.trim()}" added to roadmap and linked to "${linkedCourseName}"`);
      } else {
        // No course yet — prompt the user to enroll a course
        setAddedTopicNotice(`📌 Topic added to canvas. Enroll a course or template to track it in My Courses.`);
      }
      setTimeout(() => setAddedTopicNotice(null), 4500);
    }
  };

  const handleSelectTemplate = (templateKey: string) => {
    if (templateKey === 'clear') {
      clearRoadmap();
    } else {
      loadTemplate(templateKey);
    }
    setShowTemplateModal(false);
  };

  const filteredTemplates = useMemo(() => {
    return Object.values(allTemplates).filter(tpl => {
      const matchesCategory = templateCategory === 'all' || tpl.category === templateCategory;
      const query = templateSearch.toLowerCase().trim();
      const matchesSearch = !query ||
        tpl.name.toLowerCase().includes(query) ||
        tpl.description.toLowerCase().includes(query) ||
        tpl.nodes.some(n => n.label.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [allTemplates, templateCategory, templateSearch]);

  const handleImportTextChange = (text: string) => {
    setImportText(text);
    if (importError) setImportError(null);

    // Auto-detect title and description from pasted JSON/text if user hasn't set one yet
    if (!importTitle.trim()) {
      try {
        const trimmed = text.trim();
        if (trimmed.startsWith('{')) {
          const parsed = JSON.parse(trimmed);
          const detectedTitle = parsed.title || parsed.name || parsed.roadmap || parsed.label;
          if (detectedTitle && typeof detectedTitle === 'string') {
            setImportTitle(detectedTitle.trim());
          }
          if (parsed.description && typeof parsed.description === 'string' && !importDescription.trim()) {
            setImportDescription(parsed.description.trim());
          }
        } else if (trimmed.startsWith('#')) {
          const firstLine = trimmed.split('\n')[0];
          const detected = firstLine.replace(/^#+\s*/, '').trim();
          if (detected) setImportTitle(detected);
        }
      } catch {}
    }
  };

  const handleImportRoadmap = async () => {
    setImportError(null);
    const raw = importText.trim();
    if (!raw) {
      setImportError('Please enter valid JSON or a list of topics.');
      return;
    }

    const finalTitle = importTitle.trim() || 'Custom Learning Path';

    try {
      let parsedNodes: RoadmapNode[] = [];
      let parsedEdges: RoadmapEdge[] = [];

      if (raw.startsWith('{') || raw.startsWith('[')) {
        const parsed = JSON.parse(raw);
        const nodes: RoadmapNode[] = Array.isArray(parsed) ? parsed : (parsed.nodes || []);
        const edges: RoadmapEdge[] = Array.isArray(parsed.edges) ? parsed.edges : [];
        if (!Array.isArray(nodes) || nodes.length === 0) {
          throw new Error('JSON must contain a non-empty array of nodes/topics.');
        }
        parsedNodes = nodes;
        parsedEdges = edges;
      } else {
        const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) {
          throw new Error('No valid topics found in text.');
        }

        let currentPhase = '1. Fundamentals';
        lines.forEach((line, idx) => {
          let label = line;
          if (line.includes(':')) {
            const parts = line.split(':');
            currentPhase = parts[0].trim();
            label = parts.slice(1).join(':').trim();
          } else if (line.startsWith('#')) {
            currentPhase = line.replace(/^#+\s*/, '').trim();
            return;
          }

          const id = `custom_${idx}_` + Date.now().toString(36).slice(-4);
          parsedNodes.push({
            id,
            label,
            phase: currentPhase,
            status: 'not_started',
          });

          if (parsedNodes.length > 1) {
            parsedEdges.push({
              source: parsedNodes[parsedNodes.length - 2].id,
              target: id,
            });
          }
        });

        if (parsedNodes.length === 0) {
          throw new Error('Could not parse any topics from text.');
        }
      }

      // Save custom template into templates catalog, load to canvas, and optionally enroll in My Courses!
      const { courseId } = await importRoadmap({
        title: finalTitle,
        description: importDescription.trim() || undefined,
        category: importCategory,
        nodes: parsedNodes,
        edges: parsedEdges,
        enrollAsCourse: importEnrollCourse,
      });

      setShowTemplateModal(false);
      setImportText('');
      setImportTitle('');
      setImportDescription('');

      if (courseId) {
        setEnrolledNotice(`🎉 "${finalTitle}" saved to Roadmap Templates & enrolled in My Courses!`);
      } else {
        setEnrolledNotice(`🎉 "${finalTitle}" saved to Roadmap Templates and loaded onto your canvas!`);
      }
      setTimeout(() => setEnrolledNotice(null), 4500);

      // Open roadmap canvas to display the new roadmap
      setActiveView('roadmap');
    } catch (err: any) {
      setImportError(err.message || 'Invalid format. Please verify your input.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 flex-shrink-0 bg-bg-surface/40">
        {/* Switch View Tabs */}
        <div className="flex bg-[#0D1017] rounded-xl border border-white/[0.08] p-1 gap-1">
          <button
            onClick={() => setActiveView('roadmap')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'roadmap'
                ? 'bg-accent-amber text-[#0D0F14] shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span>🗺️</span>
            <span>Roadmap</span>
          </button>
          <button
            onClick={() => setActiveView('courses')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'courses'
                ? 'bg-accent-amber text-[#0D0F14] shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span>📚</span>
            <span>Courses</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeView === 'roadmap' ? (
            <>
              {activeTemplate && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={isCurrentTemplateEnrolled ? <CheckCircle2 size={13} className="text-emerald-400" /> : <BookOpen size={13} className="text-accent-amber" />}
                  onClick={async () => {
                    if (isCurrentTemplateEnrolled) {
                      setActiveView('courses');
                    } else {
                      await handleEnrollTemplate(activeTemplate.id);
                    }
                  }}
                  title={isCurrentTemplateEnrolled ? 'Already enrolled! Click to view in My Courses' : `Add ${activeTemplate.name} to My Courses`}
                >
                  {isCurrentTemplateEnrolled ? 'In My Courses ✓' : '+ Add to Courses'}
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                icon={<Sparkles size={13} className="text-accent-amber" />}
                onClick={() => setShowTemplateModal(true)}
              >
                Templates
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setShowTopicModal(true)}
              >
                Add Topic
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={<Sparkles size={13} className="text-accent-amber" />}
                onClick={() => setShowTemplateModal(true)}
              >
                Add from Template
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setShowCourseModal(true)}
              >
                Custom Course
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Enrollment Notification Banner ─────────────────────────────────── */}
      {enrolledNotice && (
        <div className="bg-emerald-500/10 px-6 py-2 flex items-center justify-between text-xs text-emerald-300 animate-fadeIn flex-shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span className="font-medium">{enrolledNotice}</span>
          </div>
          <button
            onClick={() => setActiveView('courses')}
            className="text-emerald-300 hover:text-white hover:underline text-xs font-semibold cursor-pointer flex items-center gap-1"
          >
            <span>Open in My Courses</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* ── Add Topic Notification Banner ──────────────────────────────────── */}
      {addedTopicNotice && (
        <div className="bg-accent-tertiary/10 px-6 py-2 flex items-center justify-between text-xs text-accent-tertiary animate-fadeIn flex-shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-accent-tertiary" />
            <span className="font-medium">{addedTopicNotice}</span>
          </div>
          <button
            onClick={() => setAddedTopicNotice(null)}
            className="text-accent-tertiary hover:text-white text-xs font-bold cursor-pointer px-1"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}


      {/* ── Roadmap View ──────────────────────────────────────────────────── */}
      {activeView === 'roadmap' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Stats strip (only if nodes exist) */}
          {totalTopics > 0 && (
            <div className="flex items-center gap-6 px-6 py-2.5 bg-bg-surface/30 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-completed" />
                <span className="text-xs text-txt-muted">{completedTopics} completed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-in-progress animate-pulse" />
                <span className="text-xs text-txt-muted">{inProgressTopics} in progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-not-started" />
                <span className="text-xs text-txt-muted">{totalTopics - completedTopics - inProgressTopics} not started</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="w-24 h-1.5 bg-bg-surface2 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accent-amber rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct(completedTopics, totalTopics)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs font-medium text-accent-amber font-mono">
                  {pct(completedTopics, totalTopics)}%
                </span>
              </div>
            </div>
          )}

          {/* Interactive D3 Graph */}
          <div className="flex-1 overflow-hidden">
            <RoadmapGraph
              onOpenAddModal={() => setShowTopicModal(true)}
              onOpenTemplateModal={() => setShowTemplateModal(true)}
            />
          </div>
        </div>
      )}

      {/* ── Courses List View ─────────────────────────────────────────────── */}
      {activeView === 'courses' && (
        <div className="flex-1 overflow-y-auto p-6">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl mx-auto">
            {/* 1. PRIMARY ROADMAP HERO CARD */}
            <motion.div variants={item}>
              {totalTopics === 0 && !activeTemplate ? (
                <div className="p-6 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0E121B] to-[#141A28] relative overflow-hidden shadow-xl">
                  <div className="absolute -top-24 -right-24 w-72 h-72 bg-accent-amber/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
                        <Sparkles size={12} />
                        Get Started
                      </span>
                      <span className="text-xs text-zinc-400">Step 1 of your journey</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        Choose Your Primary Learning Path
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                        Select an industry-standard roadmap to begin tracking your curriculum milestones, focus sessions, and course notes. You can also build your own custom curriculum.
                      </p>
                    </div>

                    {/* Quick Starter Templates */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      {[
                        { id: 'full-stack', label: '🚀 Full-Stack Web', desc: 'Frontend, Backend, APIs' },
                        { id: 'data-analyst', label: '📊 Data Analyst', desc: 'SQL, Python, BI' },
                        { id: 'ai-engineer', label: '🤖 AI Engineer', desc: 'PyTorch, LLMs, Agents' },
                        { id: 'cyber-security', label: '🛡️ Cybersecurity', desc: 'Security, Networks' },
                      ].map(tpl => (
                        <button
                          key={tpl.id}
                          onClick={() => {
                            loadTemplate(tpl.id);
                            setActiveView('roadmap');
                          }}
                          className="p-3 rounded-xl bg-white/[0.04] hover:bg-accent-amber/10 border border-white/[0.08] hover:border-accent-amber/30 text-left transition-all cursor-pointer group"
                        >
                          <div className="text-xs font-semibold text-white group-hover:text-accent-amber transition-colors">
                            {tpl.label}
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">{tpl.desc}</div>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center gap-3 flex-wrap">
                      <button
                        onClick={() => setShowTemplateModal(true)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent-amber hover:brightness-110 text-[#090D14] transition-all flex items-center gap-1.5 cursor-pointer shadow-md font-mono"
                      >
                        <Sparkles size={14} />
                        <span>Browse All Roadmaps</span>
                      </button>
                      <button
                        onClick={() => setShowCourseModal(true)}
                        className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add Custom Course</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#0E121B] relative overflow-hidden shadow-xl">
                  {/* Subtle ambient accent glow */}
                  <div className="absolute -top-24 -right-24 w-72 h-72 bg-accent-amber/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                    <div className="flex-1 min-w-0 space-y-3.5">
                      {/* Status & Path Type */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-amber animate-pulse" />
                          In Progress
                        </span>
                        <span className="text-xs text-zinc-400 font-medium">
                          Primary Path
                        </span>
                        {activeTemplate && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                            {activeTemplate.badge}
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                          {activeTemplate?.name ? `${activeTemplate.name} Roadmap` : 'Active Roadmap'}
                        </h2>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-2xl">
                          {activeTemplate?.description || 'Your custom roadmap curriculum and milestones'}
                        </p>
                      </div>

                      {/* Progress Section */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400 font-medium">Overall Progress</span>
                          <span className="text-accent-amber font-mono font-bold">
                            {pct(completedTopics, totalTopics)}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-[#171C28] rounded-full overflow-hidden border border-white/[0.04]">
                          <motion.div
                            className="h-full bg-gradient-to-r from-accent-amber to-accent-amber-light rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct(completedTopics, totalTopics)}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </div>

                        {/* Topic Metrics */}
                        <div className="flex items-center gap-4 text-xs text-zinc-400 pt-0.5 flex-wrap">
                          <span>
                            <strong className="text-white font-semibold font-mono">{completedTopics}</strong> / {totalTopics} topics
                          </span>
                          <span>•</span>
                          <span>
                            <strong className="text-accent-amber font-semibold font-mono">{inProgressTopics}</strong> in progress
                          </span>
                          <span>•</span>
                          <span>
                            <strong className="text-zinc-400 font-semibold font-mono">{totalTopics - completedTopics - inProgressTopics}</strong> remaining
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <strong className="text-accent-amber font-semibold font-mono">{primaryNotes.length}</strong> linked note{primaryNotes.length === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>

                      {/* Action Row */}
                      <div className="pt-2 flex items-center gap-3 flex-wrap">
                        <button
                          onClick={() => setActiveView('roadmap')}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent-secondary hover:brightness-110 text-[#090D14] transition-all flex items-center gap-1.5 cursor-pointer shadow-md font-mono"
                        >
                          <ChevronRight size={15} />
                          <span>Open Roadmap</span>
                        </button>

                        <button
                          onClick={handleOpenPrimaryNotes}
                          className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] hover:border-accent-amber/40 text-zinc-300 border border-white/[0.08] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                          title="Open notes panel for this roadmap & course"
                        >
                          <FileText size={13} className={primaryNotes.length > 0 ? "text-accent-amber" : "text-zinc-400"} />
                          <span>Course Notes</span>
                          {primaryNotes.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-accent-amber/15 text-accent-amber font-mono font-bold">
                              {primaryNotes.length}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => setShowTemplateModal(true)}
                          className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles size={13} className="text-accent-amber" />
                          <span>Change Path</span>
                        </button>
                      </div>
                    </div>

                    {/* Circular Progress Ring */}
                    <div className="flex-shrink-0 self-center md:self-auto p-2">
                      <ProgressRing
                        value={pct(completedTopics, totalTopics)}
                        size={94}
                        stroke={7}
                        label={`${pct(completedTopics, totalTopics)}%`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* 2. ENROLLED COURSES CONTAINER */}
            <motion.div variants={item}>
              <div className="rounded-2xl border border-white/[0.08] bg-[#0A0D14]/60 p-6 space-y-4 shadow-lg">
                <div className="flex items-center justify-between gap-4 flex-wrap pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <BookOpen size={16} className="text-accent-amber" />
                      <span>Additional Enrolled Courses</span>
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Individual courses, certifications, and subjects linked to your learning track
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Sparkles size={13} className="text-accent-amber" />}
                      onClick={() => setShowTemplateModal(true)}
                    >
                      Add from Template
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus size={13} />}
                      onClick={() => setShowCourseModal(true)}
                    >
                      + Add Course
                    </Button>
                  </div>
                </div>

                {/* Courses List */}
                {courses.length > 0 ? (
                  <div className="space-y-3 pt-1">
                    {courses.map(course => {
                      const matchingTpl = findTemplateForCourse(course);
                      const courseNotes = getNotesForCourse(course.id);
                      return (
                        <Card key={course.id} padding="p-4" className="bg-[#0E121B]/80 hover:bg-[#121722] border-white/[0.06] transition-all">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge status={course.status} />
                                {matchingTpl && (
                                  <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-accent-amber/10 text-accent-amber border border-accent-amber/20 font-medium">
                                    <span>{matchingTpl.icon}</span>
                                    <span>{matchingTpl.badge}</span>
                                  </span>
                                )}
                                {course.start_date && (
                                  <span className="flex items-center gap-1 text-[10px] text-txt-muted">
                                    <Calendar size={10} /> Started {formatDate(course.start_date)}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-semibold text-white text-sm tracking-tight truncate">{course.title}</h4>
                              <div className="flex items-center gap-4 mt-1.5 text-xs text-txt-muted flex-wrap">
                                <span>{minsToHHMM(timePerCourse[course.id] || 0)} focused study</span>
                                {matchingTpl && (
                                  <span className="text-zinc-400">{matchingTpl.nodes.length} curriculum topics</span>
                                )}
                                <span className="flex items-center gap-1 text-zinc-400">
                                  <FileText size={11} className={courseNotes.length > 0 ? "text-accent-amber" : "text-zinc-500"} />
                                  <strong className={courseNotes.length > 0 ? "text-accent-amber font-mono" : "text-zinc-400 font-mono"}>
                                    {courseNotes.length}
                                  </strong> linked note{courseNotes.length === 1 ? '' : 's'}
                                </span>
                                {course.source_url && (
                                  <a
                                    href={safeUrl(course.source_url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 hover:text-accent-amber transition-colors text-zinc-400"
                                  >
                                    <ExternalLink size={11} /> Open Link
                                  </a>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => setSelectedCourseForNotes(course)}
                                className={`px-3 py-1.5 rounded-lg text-xs border transition-all font-medium flex items-center gap-1.5 cursor-pointer shadow-sm ${
                                  courseNotes.length > 0
                                    ? 'bg-accent-amber/10 hover:bg-accent-amber/20 text-accent-amber border-accent-amber/30'
                                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border-white/[0.08] hover:border-white/20'
                                }`}
                                title={`View notes for ${course.title}`}
                              >
                                <FileText size={13} className={courseNotes.length > 0 ? "text-accent-amber" : "text-zinc-400"} />
                                <span>Notes</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                                  courseNotes.length > 0 ? 'bg-accent-amber/20 text-accent-amber' : 'bg-white/5 text-zinc-400'
                                }`}>
                                  {courseNotes.length}
                                </span>
                              </button>

                              {matchingTpl && (
                                <button
                                  onClick={() => {
                                    loadTemplate(matchingTpl.id);
                                    setActiveView('roadmap');
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-xs bg-accent-secondary/10 hover:bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30 transition-all font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
                                  title="Open this course in the Interactive Roadmap"
                                >
                                  <Layers size={13} />
                                  <span>Open Roadmap</span>
                                </button>
                              )}
                              <button
                                onClick={() => setDeletingCourseId(course.id)}
                                className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Delete course"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 px-6">
                    <BookOpen size={32} className="text-zinc-600 mx-auto mb-3 opacity-60" />
                    <p className="text-sm font-semibold text-zinc-300 mb-1">
                      No additional courses added yet.
                    </p>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-5">
                      {activeTemplate ? `The ${activeTemplate.name} Roadmap is your main path above.` : 'Select a roadmap above or add custom courses below.'}
                    </p>
                    <button
                      onClick={() => setShowCourseModal(true)}
                      className="px-4 py-2 text-xs rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] transition-colors cursor-pointer font-medium"
                    >
                      + Add a course
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* ── Modal: Add Course ─────────────────────────────────────────────── */}
      <Modal open={showCourseModal} onClose={() => setShowCourseModal(false)} title="Add Course">
        <form onSubmit={handleAddCourse} className="space-y-4">
          <div>
            <label className="block text-xs text-txt-muted mb-1 font-medium">Course Title *</label>
            <input
              className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-txt-primary outline-none focus:border-accent-amber/50 transition-colors"
              value={courseForm.title}
              onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Modern React & TypeScript Bootcamp"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-txt-muted mb-1 font-medium">Source URL (optional)</label>
            <input
              className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-txt-primary outline-none focus:border-accent-amber/50 transition-colors"
              value={courseForm.source_url}
              onChange={e => setCourseForm(f => ({ ...f, source_url: e.target.value }))}
              placeholder="https://coursera.org/... or https://youtube.com/..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-txt-muted mb-1 font-medium">Start Date</label>
              <input
                type="date"
                className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-txt-primary outline-none"
                value={courseForm.start_date}
                onChange={e => setCourseForm(f => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-txt-muted mb-1 font-medium">Status</label>
              <select
                className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-txt-primary outline-none"
                value={courseForm.status}
                onChange={e => setCourseForm(f => ({ ...f, status: e.target.value as CourseStatus }))}
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowCourseModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" loading={saving}>Add Course</Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Add Topic to Roadmap ───────────────────────────────────── */}
      <Modal open={showTopicModal} onClose={() => setShowTopicModal(false)} title="Add Custom Topic">
        <form onSubmit={handleAddTopic} className="space-y-4">

          {/* Topic Title */}
          <div>
            <label className="block text-xs text-txt-muted mb-1 font-medium">Topic Title *</label>
            <input
              className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-txt-primary outline-none focus:border-accent-amber/50 transition-colors"
              value={topicForm.label}
              onChange={e => setTopicForm(f => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Asynchronous JavaScript & Promises"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-txt-muted mb-1 font-medium">Short Description</label>
            <textarea
              className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-txt-primary outline-none focus:border-accent-amber/50 transition-colors resize-none"
              rows={2}
              value={topicForm.description}
              onChange={e => setTopicForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What does this topic cover? (optional)"
            />
          </div>

          {/* Phase */}
          <div>
            <label className="block text-xs text-txt-muted mb-1 font-medium">Phase / Stage</label>
            <input
              className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-txt-primary outline-none focus:border-accent-amber/50 transition-colors"
              value={topicForm.phase}
              onChange={e => setTopicForm(f => ({ ...f, phase: e.target.value }))}
              placeholder="e.g. Frontend Core, Backend, DevOps"
              list="phase-suggestions"
            />
            {existingPhases.length > 0 && (
              <datalist id="phase-suggestions">
                {existingPhases.map(p => <option key={p} value={p} />)}
              </datalist>
            )}
            <p className="text-[10px] text-zinc-500 mt-1">Topics with the same phase are grouped and color-coded in the graph.</p>
          </div>

          {/* Link to Course */}
          <div>
            <label className="block text-xs text-txt-muted mb-1 font-medium">
              Link to Course
              <span className="ml-1.5 text-[10px] font-normal text-zinc-500">(tracks progress in My Courses)</span>
            </label>
            <select
              className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-txt-primary outline-none focus:border-accent-amber/50"
              value={topicForm.courseId}
              onChange={e => setTopicForm(f => ({ ...f, courseId: e.target.value }))}
            >
              <option value="">
                {getActiveCourseId()
                  ? `Auto — ${courses.find(c => c.id === getActiveCourseId())?.title ?? 'Active Course'}`
                  : 'Roadmap Canvas Only (no course linked)'}
              </option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.status.replace('_', ' ')})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-zinc-500 mt-1">
              Linking tracks this topic's completion inside the course. Leave "Auto" to use your current active course.
            </p>
          </div>

          {/* Prerequisite */}
          <div>
            <label className="block text-xs text-txt-muted mb-1 font-medium">Prerequisite (Unlocks After)</label>
            <select
              className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-txt-primary outline-none"
              value={topicForm.parentId}
              onChange={e => setTopicForm(f => ({ ...f, parentId: e.target.value }))}
            >
              <option value="">No Prerequisite (Root Topic)</option>
              {localNodes.map(n => (
                <option key={n.id} value={n.id}>
                  {n.label} ({n.phase})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-zinc-500 mt-1">Draws a connection arrow showing learning order in the graph.</p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs text-txt-muted mb-1 font-medium">Initial Status</label>
            <select
              className="w-full bg-[#0D1017] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-txt-primary outline-none"
              value={topicForm.status}
              onChange={e => setTopicForm(f => ({ ...f, status: e.target.value as TopicStatus }))}
            >
              <option value="not_started">⬜ Not Started</option>
              <option value="in_progress">🔄 In Progress</option>
              <option value="completed">✅ Completed</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowTopicModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Add to Roadmap</Button>
          </div>
        </form>
      </Modal>


      {/* ── Modal: Choose Template / Roadmap Catalog ─────────────────────── */}
      <Modal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Roadmap Catalog & Importer"
        width="max-w-4xl"
      >
        <div className="flex flex-col max-h-[78vh] -mx-6 -my-4">
          {/* Top Sub-navigation Tabs */}
          <div className="flex items-center justify-between px-6 py-3 bg-[#121622] flex-shrink-0">
            <div className="flex bg-[#0D1017] rounded-xl border border-white/[0.08] p-1 gap-1">
              <button
                onClick={() => setTemplateTab('explore')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  templateTab === 'explore'
                    ? 'bg-accent-amber text-[#0D0F14] shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Sparkles size={13} />
                <span>All Templates ({Object.keys(allTemplates).length})</span>
              </button>
              <button
                onClick={() => setTemplateTab('import')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  templateTab === 'import'
                    ? 'bg-accent-amber text-[#0D0F14] shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Upload size={13} />
                <span>Import Custom Roadmap</span>
              </button>
            </div>

            <span className="text-[11px] text-zinc-400 hidden sm:inline-block">
              Official Curricula & Custom Roadmaps
            </span>
          </div>

          {/* Tab Content: Explore Roadmaps */}
          {templateTab === 'explore' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Search and Category Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={e => setTemplateSearch(e.target.value)}
                    placeholder="Search by role, framework, or skill (e.g. React, Python, DevOps, Docker)..."
                    className="w-full bg-[#0D1017] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-txt-primary outline-none focus:border-accent-amber/50 transition-colors"
                  />
                  {templateSearch && (
                    <button
                      onClick={() => setTemplateSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATE_CATEGORIES.map(cat => {
                    const count = cat.id === 'all'
                      ? Object.keys(allTemplates).length
                      : Object.values(allTemplates).filter(t => t.category === cat.id).length;
                    const isActive = templateCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setTemplateCategory(cat.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                          isActive
                            ? 'bg-white/10 text-accent-amber border-accent-amber/40 shadow-sm'
                            : 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.06] text-zinc-400">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Template Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {filteredTemplates.map(tpl => {
                  const phaseSet = Array.from(new Set(tpl.nodes.map(n => n.phase))).slice(0, 4);
                  const isCustom = Boolean(customTemplates[tpl.id] || tpl.id.startsWith('custom_'));
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl.id)}
                      className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-accent-amber/40 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-2xl p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] flex-shrink-0">
                              {tpl.icon}
                            </span>
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-white group-hover:text-accent-amber transition-colors truncate">
                                {tpl.name}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent-amber/10 text-accent-amber border border-accent-amber/20 font-medium">
                                  {tpl.badge}
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                  {tpl.nodes.length} topics
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Link or Delete Action */}
                          {isCustom ? (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                deleteCustomTemplate(tpl.id);
                              }}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex-shrink-0"
                              title="Delete this custom template"
                            >
                              <Trash2 size={13} />
                            </button>
                          ) : tpl.roadmapUrl ? (
                            <a
                              href={safeUrl(tpl.roadmapUrl)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="p-1.5 text-zinc-400 hover:text-accent-amber hover:bg-accent-amber/10 rounded-lg transition-colors flex-shrink-0"
                              title={`Open official ${tpl.name} guide on roadmap.sh`}
                            >
                              <ExternalLink size={13} />
                            </a>
                          ) : null}
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                          {tpl.description}
                        </p>

                        {/* Phases tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {phaseSet.map((ph, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06] truncate max-w-[130px]"
                            >
                              {ph}
                            </span>
                          ))}
                          {tpl.nodes.length > phaseSet.length && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.02] text-zinc-500">
                              +{Array.from(new Set(tpl.nodes.map(n => n.phase))).length - phaseSet.length} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2 text-xs" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleSelectTemplate(tpl.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Load topics onto the interactive roadmap canvas"
                        >
                          <Layers size={12} className="text-accent-amber" />
                          <span>Load Roadmap</span>
                        </button>

                        {isTemplateEnrolled(tpl) ? (
                          <button
                            onClick={() => {
                              setActiveView('courses');
                              setShowTemplateModal(false);
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                            title="Already enrolled! Click to view in My Courses"
                          >
                            <CheckCircle2 size={12} />
                            <span>In Courses ✓</span>
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              await handleEnrollTemplate(tpl.id);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs bg-accent-amber text-[#0D0F14] font-semibold hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                            title="Enroll and add this roadmap to My Courses"
                          >
                            <Plus size={12} />
                            <span>+ Add to Courses</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredTemplates.length === 0 && (
                  <div className="col-span-full py-12 text-center text-zinc-500">
                    <p className="text-sm">No roadmap paths match &quot;{templateSearch}&quot;</p>
                    <button
                      onClick={() => { setTemplateSearch(''); setTemplateCategory('all'); }}
                      className="mt-2 text-xs text-accent-amber hover:underline"
                    >
                      Reset filters
                    </button>
                  </div>
                )}
              </div>

              {/* Clear / Blank Option */}
              <div
                onClick={() => handleSelectTemplate('clear')}
                className="p-3.5 rounded-xl border border-dashed border-white/10 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all cursor-pointer group flex items-center justify-between mt-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🧹</span>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-300 group-hover:text-rose-400 transition-colors">
                      Start Blank (Empty Roadmap)
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Wipe the current graph to build your custom milestone sequence from scratch.
                    </p>
                  </div>
                </div>
                <span className="text-xs text-zinc-500 group-hover:text-rose-400">Clear Canvas</span>
              </div>
            </div>
          )}

          {/* Tab Content: Import Custom Roadmap */}
          {templateTab === 'import' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-3.5 space-y-2">
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Layers size={13} className="text-accent-amber" />
                  Paste JSON or Plain Text Curriculum
                </h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  You can paste custom JSON containing an array of <code className="text-accent-amber font-mono text-[10px]">nodes</code> and <code className="text-accent-amber font-mono text-[10px]">edges</code>, OR simply paste plain text with one topic per line (e.g. <code className="text-accent-amber font-mono text-[10px]">Phase Name: Topic Title</code>).
                </p>

                {/* Preset format buttons */}
                <div className="flex gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setImportTitle('Full Stack Developer Starter');
                      setImportCategory('development');
                      handleImportTextChange(JSON.stringify({
                        title: "Full Stack Developer Starter",
                        description: "Core roadmap covering basics, projects, and production deployment",
                        nodes: [
                          { id: "step_1", label: "Foundations & Syntax", phase: "1. Basics", status: "completed" },
                          { id: "step_2", label: "Data Structures & Algorithmic Thinking", phase: "1. Basics", status: "in_progress" },
                          { id: "step_3", label: "Building Real Projects", phase: "2. Projects", status: "not_started" },
                          { id: "step_4", label: "Deployment & Production", phase: "3. Deployment", status: "not_started" }
                        ],
                        edges: [
                          { source: "step_1", target: "step_2" },
                          { source: "step_2", target: "step_3" },
                          { source: "step_3", target: "step_4" }
                        ]
                      }, null, 2));
                      setImportError(null);
                    }}
                    className="text-[10px] px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] transition-colors cursor-pointer"
                  >
                    Load JSON Format Example
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportTitle('Software Foundations & DevOps');
                      setImportCategory('devops_security');
                      handleImportTextChange(
`1. Foundations: Programming Syntax & Types
1. Foundations: Git & Version Control
2. Advanced Concepts: Asynchronous Architecture
2. Advanced Concepts: Database Queries & Indexing
3. Deployment: Docker Containers
3. Deployment: CI/CD Pipelines & Cloud Hosting`
                      );
                      setImportError(null);
                    }}
                    className="text-[10px] px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] transition-colors cursor-pointer"
                  >
                    Load Text Format Example
                  </button>
                </div>
              </div>

              {/* Title and Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-txt-muted mb-1 font-medium">
                    Roadmap Title *
                    <span className="text-[10px] font-normal text-zinc-500 ml-1.5">(saved in Templates and Courses)</span>
                  </label>
                  <input
                    type="text"
                    value={importTitle}
                    onChange={e => setImportTitle(e.target.value)}
                    placeholder="e.g. Data Analyst Custom Roadmap, Python Mastery"
                    className="w-full bg-[#0D1017] border border-white/10 rounded-xl px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-amber/50 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-txt-muted mb-1 font-medium">Category</label>
                  <select
                    value={importCategory}
                    onChange={e => setImportCategory(e.target.value as any)}
                    className="w-full bg-[#0D1017] border border-white/10 rounded-xl px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-amber/50"
                  >
                    <option value="custom">⭐ My Custom</option>
                    <option value="ai_data">AI & Data</option>
                    <option value="development">Development</option>
                    <option value="devops_security">DevOps & Security</option>
                    <option value="architecture_design">Architecture & Design</option>
                    <option value="product_management">Product & Mgmt</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-txt-muted mb-1 font-medium">Short Description (optional)</label>
                <input
                  type="text"
                  value={importDescription}
                  onChange={e => setImportDescription(e.target.value)}
                  placeholder="e.g. Custom curriculum created from syllabus or roadmap.sh"
                  className="w-full bg-[#0D1017] border border-white/10 rounded-xl px-3 py-2 text-xs text-txt-primary outline-none focus:border-accent-amber/50 transition-colors"
                />
              </div>

              {/* Text Area */}
              <div>
                <label className="block text-xs text-txt-muted mb-1 font-medium">
                  Curriculum Data (JSON or text list) *
                </label>
                <textarea
                  rows={8}
                  value={importText}
                  onChange={e => handleImportTextChange(e.target.value)}
                  placeholder="Paste your JSON or list of topics here..."
                  className="w-full bg-[#0D1017] border border-white/10 rounded-xl p-3 text-xs font-mono text-txt-primary outline-none focus:border-accent-amber/50 transition-colors leading-relaxed"
                />
              </div>

              {/* Auto Enroll in Courses Checkbox */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-accent-amber/[0.06] border border-accent-amber/25 cursor-pointer hover:bg-accent-amber/[0.09] transition-colors">
                <input
                  type="checkbox"
                  checked={importEnrollCourse}
                  onChange={e => setImportEnrollCourse(e.target.checked)}
                  className="rounded border-white/20 text-accent-amber focus:ring-accent-amber/40 h-4 w-4 cursor-pointer"
                />
                <div>
                  <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>📚 Automatically enroll as a course in &quot;My Courses&quot;</span>
                    <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-accent-amber/20 text-accent-amber border border-accent-amber/30">Recommended</span>
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Saves this roadmap to your templates catalog and creates a tracked course in My Courses with all topics.
                  </p>
                </div>
              </label>

              {importError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {importError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowTemplateModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  icon={<CheckCircle2 size={14} />}
                  onClick={handleImportRoadmap}
                >
                  Import into Templates & Roadmap
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── SlideOver: Course Notes Panel ─────────────────────────────────── */}
      <SlideOver
        open={Boolean(selectedCourseForNotes)}
        onClose={() => {
          setSelectedCourseForNotes(null);
          setNotesSearchQuery('');
          setNewNoteTitleInput('');
        }}
        title={selectedCourseForNotes ? 'Course Notes' : ''}
        subtitle={selectedCourseForNotes ? selectedCourseForNotes.title : ''}
        width="w-full sm:w-[480px]"
      >
        {selectedCourseForNotes && (
          <div className="space-y-4 flex flex-col h-full">
            {/* Course Summary Pill & Full Workspace Link */}
            <div className="p-3.5 rounded-xl bg-[#0E121B] border border-white/[0.06] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge status={selectedCourseForNotes.status} />
                <span className="text-xs text-zinc-300 font-medium">
                  {getNotesForCourse(selectedCourseForNotes.id).length} linked note{getNotesForCourse(selectedCourseForNotes.id).length === 1 ? '' : 's'}
                </span>
              </div>
              <button
                onClick={() => {
                  navigate('/notes');
                }}
                className="text-[11px] text-zinc-400 hover:text-accent-amber transition-colors flex items-center gap-1 cursor-pointer font-mono"
              >
                <span>Full Notes Workspace</span>
                <ArrowRight size={11} />
              </button>
            </div>

            {/* Quick Add Note box */}
            <form
              onSubmit={handleCreateQuickNote}
              className="p-3.5 rounded-xl bg-gradient-to-b from-[#0E121B] to-[#121622] border border-white/[0.08] space-y-2.5 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <StickyNote size={13} className="text-accent-amber" />
                  <span>Create Linked Note</span>
                </span>
                <span className="text-[10px] text-accent-amber font-mono bg-accent-amber/10 px-1.5 py-0.5 rounded border border-accent-amber/20">
                  Auto-linked to this course
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newNoteTitleInput}
                  onChange={e => setNewNoteTitleInput(e.target.value)}
                  placeholder="Note title (e.g. Key Takeaways)..."
                  className="flex-1 bg-[#090D14] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-accent-amber/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isCreatingQuickNote}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-accent-amber hover:brightness-110 disabled:opacity-50 text-[#090D14] transition-all flex items-center gap-1.5 cursor-pointer font-mono flex-shrink-0 shadow-sm"
                >
                  <Plus size={13} />
                  <span>{isCreatingQuickNote ? 'Adding...' : 'Add & Write'}</span>
                </button>
              </div>
            </form>

            {/* Search Filter */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={notesSearchQuery}
                onChange={e => setNotesSearchQuery(e.target.value)}
                placeholder="Search notes in this course..."
                className="w-full bg-[#0E121B] border border-white/[0.06] rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-accent-amber/40 transition-colors"
              />
              {notesSearchQuery && (
                <button
                  onClick={() => setNotesSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs cursor-pointer px-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Notes List */}
            <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
              {currentDrawerNotes.length > 0 ? (
                currentDrawerNotes.map(note => {
                  const snippet = extractSnippet(note.content);
                  return (
                    <div
                      key={note.id}
                      onClick={() => handleOpenNoteInEditor(note)}
                      className="group p-3.5 rounded-xl border border-white/[0.06] hover:border-accent-amber/30 bg-[#0E121B]/90 hover:bg-[#131722] transition-all cursor-pointer space-y-2 shadow-sm relative"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-white group-hover:text-accent-amber transition-colors truncate">
                            {note.title || 'Untitled Note'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar size={10} />
                              {formatDate(note.updated_at)}
                            </span>
                            {note.topic_id && (
                              <span className="px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-300 border border-white/[0.06] truncate max-w-[170px]">
                                🗺️ {getTopicName(note.topic_id)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNoteFromDrawer(note.id);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {snippet && (
                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                          {snippet}
                        </p>
                      )}

                      {note.tags && note.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {note.tags.map(t => (
                            <span key={t} className="text-[9px] px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06] font-mono">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04] text-[10px]">
                        <span className="text-zinc-500">Click to open & edit</span>
                        <span className="text-accent-amber font-mono flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform">
                          <span>Open Editor</span>
                          <ArrowRight size={10} />
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 px-4 bg-[#0E121B]/40 rounded-xl border border-dashed border-white/[0.08] space-y-2">
                  <FileText size={28} className="text-zinc-600 mx-auto opacity-70" />
                  <p className="text-xs font-semibold text-zinc-300">
                    {notesSearchQuery ? 'No matching notes found' : 'No notes linked yet'}
                  </p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                    {notesSearchQuery
                      ? 'Try adjusting your search terms.'
                      : `Keep all key takeaways, code snippets, and study guides for "${selectedCourseForNotes.title}" organized right here.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOver>

      {/* ── Modal: Delete Course Confirmation ─────────────────────────────── */}
      {deletingCourseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70" onClick={() => setDeletingCourseId(null)} />
          <div className="relative bg-[#161A23] border border-white/[0.1] rounded-2xl p-5 w-full max-w-sm mx-4 shadow-2xl space-y-3">
            <h3 className="text-sm font-semibold text-white">Delete Course?</h3>
            <p className="text-xs text-zinc-400">
              This course will be removed from your courses list.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setDeletingCourseId(null)}>Cancel</Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  deleteCourse(deletingCourseId);
                  setDeletingCourseId(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};