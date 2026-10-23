import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Search, Trash2, Edit3, Code, Layers,
  Compass, RefreshCw, UserCheck, X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useRoadmapStore } from '../../store/roadmapStore';
import { useUIStore } from '../../store/uiStore';
import { supabase } from '../../lib/supabase';
import type { AdminCourseItem, RoadmapNode, CourseStatus, CourseMode } from '../../types';
import { CourseJsonEditorModal } from './CourseJsonEditorModal';
import { MilestoneManagerModal } from './MilestoneManagerModal';

export const UserCoursesAdmin: React.FC = () => {
  const { adminListAllCourses, adminSaveUserCourseJson, adminDeleteUserCourse } = useRoadmapStore();
  const showToast = useUIStore(s => s.showToast);

  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search-First State: by default, user must search or pick a user to prevent page lag
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showAllUsersExplicitly, setShowAllUsersExplicitly] = useState(false);

  // Additional Filters
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [courseTitleSearch, setCourseTitleSearch] = useState('');

  // Modals state
  const [jsonEditingCourse, setJsonEditingCourse] = useState<AdminCourseItem | null>(null);
  const [jsonEditingCoursePayload, setJsonEditingCoursePayload] = useState<any>(null);

  const [milestoneEditingCourse, setMilestoneEditingCourse] = useState<AdminCourseItem | null>(null);
  const [milestoneNodes, setMilestoneNodes] = useState<RoadmapNode[]>([]);

  const [editDetailsCourse, setEditDetailsCourse] = useState<AdminCourseItem | null>(null);
  const [detailsForm, setDetailsForm] = useState<{ title: string; status: CourseStatus; mode: CourseMode }>({
    title: '',
    status: 'in_progress',
    mode: 'courses',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const items = await adminListAllCourses();
      setCourses(items);
    } catch (err: any) {
      showToast('error', 'Failed to load user courses: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Distinct list of users with course counts
  const userDirectory = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; username?: string; isAdmin: boolean; courseCount: number }>();
    courses.forEach(c => {
      const existing = map.get(c.user_id);
      if (existing) {
        existing.courseCount += 1;
      } else {
        map.set(c.user_id, {
          id: c.user_id,
          name: c.user_name || 'User',
          email: c.user_email,
          username: c.user_username,
          isAdmin: c.user_is_admin,
          courseCount: 1,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.courseCount - a.courseCount);
  }, [courses]);

  // Matching users based on search
  const matchingUsers = useMemo(() => {
    if (!userSearchTerm.trim()) return userDirectory;
    const term = userSearchTerm.toLowerCase();
    return userDirectory.filter(u =>
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.username && u.username.toLowerCase().includes(term))
    );
  }, [userDirectory, userSearchTerm]);

  // Selected user info
  const activeSelectedUserInfo = useMemo(() => {
    if (!selectedUser) return null;
    return userDirectory.find(u => u.id === selectedUser) || null;
  }, [userDirectory, selectedUser]);

  // Filtered courses based on Search-First criteria
  const displayedCourses = useMemo(() => {
    // If no user is selected and not in "show all" mode and search term is empty, return empty list (prevents lag!)
    const hasSearchTerm = userSearchTerm.trim().length > 0;
    if (!selectedUser && !showAllUsersExplicitly && !hasSearchTerm) {
      return [];
    }

    return courses.filter(c => {
      // User filter: either exact selected user, or matching user search term
      let matchUser = true;
      if (selectedUser) {
        matchUser = c.user_id === selectedUser;
      } else if (hasSearchTerm) {
        const term = userSearchTerm.toLowerCase();
        matchUser =
          c.user_name.toLowerCase().includes(term) ||
          c.user_email.toLowerCase().includes(term) ||
          Boolean(c.user_username && c.user_username.toLowerCase().includes(term));
      }

      // Course title filter
      const matchCourseTitle =
        !courseTitleSearch.trim() ||
        c.title.toLowerCase().includes(courseTitleSearch.toLowerCase());

      // Mode filter
      const matchMode = selectedModeFilter === 'all' || c.mode === selectedModeFilter;

      // Status filter
      const matchStatus = selectedStatusFilter === 'all' || c.status === selectedStatusFilter;

      return matchUser && matchCourseTitle && matchMode && matchStatus;
    });
  }, [courses, selectedUser, showAllUsersExplicitly, userSearchTerm, courseTitleSearch, selectedModeFilter, selectedStatusFilter]);

  // Handle open JSON editor for user course
  const handleOpenJsonEditor = async (course: AdminCourseItem) => {
    try {
      const { data: topicsData } = await supabase
        .from('topics')
        .select('*')
        .eq('course_id', course.course_id);

      const payload = {
        course_id: course.course_id,
        user_id: course.user_id,
        title: course.title,
        mode: course.mode,
        status: course.status,
        source: course.source,
        source_url: course.source_url,
        start_date: course.start_date,
        topics: topicsData || [],
      };

      setJsonEditingCoursePayload(payload);
      setJsonEditingCourse(course);
    } catch (err: any) {
      showToast('error', 'Failed to load course details: ' + err.message);
    }
  };

  // Handle open Milestone Manager for user course
  const handleOpenMilestoneManager = async (course: AdminCourseItem) => {
    try {
      const { data: topicsData } = await supabase
        .from('topics')
        .select('*')
        .eq('course_id', course.course_id);

      const nodes: RoadmapNode[] = (topicsData || []).map((t: any) => ({
        id: t.id,
        label: t.title,
        phase: t.phase || 'General Curriculum',
        status: t.status || 'not_started',
        description: t.description || '',
      }));

      setMilestoneNodes(nodes);
      setMilestoneEditingCourse(course);
    } catch (err: any) {
      showToast('error', 'Failed to load topics: ' + err.message);
    }
  };

  const handleDeleteCourse = async (course: AdminCourseItem) => {
    if (!window.confirm(`Permanently delete "${course.title}" for user "${course.user_name}" (${course.user_email})?`)) {
      return;
    }
    const res = await adminDeleteUserCourse(course.course_id);
    if (res.success) {
      showToast('success', `Course "${course.title}" deleted.`);
      loadData();
    } else {
      showToast('error', res.error || 'Failed to delete course.');
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDetailsCourse) return;
    const res = await adminSaveUserCourseJson(editDetailsCourse.course_id, {
      title: detailsForm.title.trim(),
      status: detailsForm.status,
      mode: detailsForm.mode,
    });
    if (res.success) {
      showToast('success', 'Course details updated.');
      setEditDetailsCourse(null);
      loadData();
    } else {
      showToast('error', res.error || 'Failed to update course.');
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0D1017] border border-white/[0.08]">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users size={18} className="text-accent-amber" />
            User Courses Directory
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl">
            Search for any registered user first to inspect and manage their courses with zero page lag. Edit milestones, modify course JSON, or manage settings on any account.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
            onClick={loadData}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* ── User Search Box (Search First to Prevent Lag) ───────────────────── */}
      <div className="p-4 rounded-xl bg-[#0D1017] border border-white/[0.08] space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <Search size={14} className="text-accent-amber" />
            <span>Search User First</span>
          </label>
          <span className="text-[11px] text-zinc-500 font-mono">
            {userDirectory.length} total users across {courses.length} courses
          </span>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Type user's name, email, or username (e.g. 'elomda', 'hamo', '@gmail.com')..."
            value={userSearchTerm}
            onChange={e => {
              setUserSearchTerm(e.target.value);
              setSelectedUser(null);
              setShowAllUsersExplicitly(false);
            }}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-black/40 border border-white/[0.12] text-white placeholder-zinc-500 outline-none focus:border-accent-amber/60 shadow-inner"
          />
          {userSearchTerm && (
            <button
              type="button"
              onClick={() => {
                setUserSearchTerm('');
                setSelectedUser(null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white rounded-md"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* User Suggestion Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Quick Select User:</span>
            {!showAllUsersExplicitly && !selectedUser && (
              <button
                type="button"
                onClick={() => setShowAllUsersExplicitly(true)}
                className="text-accent-amber hover:underline text-[11px] cursor-pointer"
              >
                Or display all {courses.length} courses at once
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {matchingUsers.slice(0, 16).map(u => {
              const isSelected = selectedUser === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedUser(null);
                    } else {
                      setSelectedUser(u.id);
                      setShowAllUsersExplicitly(false);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-accent-amber text-bg-base font-bold shadow-md'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06]'
                  }`}
                >
                  <UserCheck size={12} className={isSelected ? 'text-bg-base' : 'text-accent-amber'} />
                  <span>{u.name}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isSelected ? 'bg-black/20 text-black' : 'bg-white/[0.06] text-zinc-400'}`}>
                    {u.courseCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Active Selected User Card Banner ────────────────────────────────── */}
      {activeSelectedUserInfo && (
        <div className="p-3.5 rounded-xl bg-accent-amber/10 border border-accent-amber/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-accent-amber/20 border border-accent-amber/40 flex items-center justify-center font-bold text-accent-amber flex-shrink-0">
              {activeSelectedUserInfo.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white truncate">{activeSelectedUserInfo.name}</h4>
                {activeSelectedUserInfo.isAdmin && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-mono truncate">{activeSelectedUserInfo.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-accent-amber font-semibold">
              {displayedCourses.length} course{displayedCourses.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              title="Clear user filter"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Secondary Course Filters (Active once user is chosen or searching) ─ */}
      {(selectedUser || userSearchTerm || showAllUsersExplicitly) && (
        <div className="p-3 rounded-xl bg-[#0D1017] border border-white/[0.08] flex flex-wrap items-center gap-2.5">
          {/* Course Title Filter */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter course titles..."
              value={courseTitleSearch}
              onChange={e => setCourseTitleSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-black/40 border border-white/[0.1] text-white placeholder-zinc-500 outline-none focus:border-accent-amber/50"
            />
          </div>

          {/* Mode Filter - wide enough so text is never truncated */}
          <select
            value={selectedModeFilter}
            onChange={e => setSelectedModeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs bg-black/40 border border-white/[0.1] text-white outline-none min-w-[170px]"
          >
            <option value="all">All Modes</option>
            <option value="courses">Courses Mode (Roadmaps)</option>
            <option value="academic">Academic Mode (Terms)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={e => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs bg-black/40 border border-white/[0.1] text-white outline-none min-w-[140px]"
          >
            <option value="all">All Statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="not_started">Not Started</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      )}

      {/* ── Empty Search Prompt (Initial State to Prevent Page Lag) ─────────── */}
      {!selectedUser && !userSearchTerm && !showAllUsersExplicitly ? (
        <div className="text-center py-16 px-4 bg-[#0D1017] rounded-xl border border-white/[0.08] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center mx-auto text-accent-amber">
            <Search size={22} />
          </div>
          <h4 className="text-sm font-bold text-white">Search for a User to Inspect Courses</h4>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            To guarantee instant page load speeds and prevent lag from rendering large databases, type a user's name or email above, or click any user chip to load their courses.
          </p>
          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Users size={13} />}
              onClick={() => setShowAllUsersExplicitly(true)}
            >
              Load All {courses.length} Courses Across All Users
            </Button>
          </div>
        </div>
      ) : loading ? (
        <div className="text-center py-16 text-zinc-500 text-xs">Loading user courses...</div>
      ) : displayedCourses.length === 0 ? (
        <div className="text-center py-16 bg-[#0D1017] rounded-xl border border-white/[0.08]">
          <Compass size={28} className="mx-auto text-zinc-600 mb-2" />
          <p className="text-sm font-semibold text-zinc-300">No courses match your search</p>
          <p className="text-xs text-zinc-500 mt-1">Try searching for a different user or clearing your filters.</p>
        </div>
      ) : (
        /* ── Course Cards List ──────────────────────────────────────────────── */
        <div className="space-y-3">
          {displayedCourses.map(course => {
            const pct = course.topic_count > 0 ? Math.round((course.completed_topic_count / course.topic_count) * 100) : 0;

            return (
              <div
                key={course.course_id}
                className="p-4 rounded-xl bg-[#0D1017] border border-white/[0.08] hover:border-white/[0.15] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Course & User Tag Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  {/* User Tag Banner */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-accent-amber/10 border border-accent-amber/25 text-accent-amber">
                      <UserCheck size={12} />
                      <span>{course.user_name}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">({course.user_email})</span>
                      {course.user_is_admin && (
                        <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Admin
                        </span>
                      )}
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      course.mode === 'academic'
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {course.mode}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/[0.04] text-zinc-400">
                      {course.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Course Title */}
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">{course.title}</h4>
                    {course.source === 'seeded' && (
                      <span className="text-[10px] text-zinc-500">From Template: {course.roadmap_id || 'Seeded'}</span>
                    )}
                  </div>

                  {/* Progress Bar & Details */}
                  <div className="flex items-center gap-3 text-xs text-zinc-400 max-w-md">
                    <div className="flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-amber rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-zinc-300 flex-shrink-0">
                      {course.completed_topic_count}/{course.topic_count} topics ({pct}%)
                    </span>
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  {/* Edit JSON */}
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Code size={12} className="text-accent-amber" />}
                    onClick={() => handleOpenJsonEditor(course)}
                    title="Edit User Course JSON"
                  >
                    Edit JSON
                  </Button>

                  {/* Manage Milestones */}
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Layers size={12} className="text-blue-400" />}
                    onClick={() => handleOpenMilestoneManager(course)}
                    title="Edit Milestones & Topics"
                  >
                    Milestones
                  </Button>

                  {/* Edit Details */}
                  <button
                    type="button"
                    onClick={() => {
                      setDetailsForm({
                        title: course.title,
                        status: course.status,
                        mode: course.mode,
                      });
                      setEditDetailsCourse(course);
                    }}
                    title="Edit Course Details"
                    className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <Edit3 size={13} />
                  </button>

                  {/* Delete Course */}
                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(course)}
                    title="Delete Course for this User"
                    className="p-2 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── JSON Editor Modal for User Course ──────────────────────────────── */}
      {jsonEditingCourse && jsonEditingCoursePayload && (
        <CourseJsonEditorModal
          open={Boolean(jsonEditingCourse)}
          onClose={() => {
            setJsonEditingCourse(null);
            setJsonEditingCoursePayload(null);
          }}
          title={`Edit JSON: ${jsonEditingCourse.title}`}
          subtitle={`Editing user course belonging to "${jsonEditingCourse.user_name}" (${jsonEditingCourse.user_email}). Direct atomic sync to Supabase.`}
          initialJson={jsonEditingCoursePayload}
          schemaType="user_course"
          onSave={async (parsedJson) => {
            const courseData = {
              title: parsedJson.title,
              mode: parsedJson.mode,
              status: parsedJson.status,
              source_url: parsedJson.source_url,
              start_date: parsedJson.start_date,
            };
            const topicsData = parsedJson.topics || [];
            const res = await adminSaveUserCourseJson(jsonEditingCourse.course_id, courseData, topicsData);
            if (res.success) loadData();
            return res;
          }}
        />
      )}

      {/* ── Milestone Manager Modal for User Course ────────────────────────── */}
      {milestoneEditingCourse && (
        <MilestoneManagerModal
          open={Boolean(milestoneEditingCourse)}
          onClose={() => setMilestoneEditingCourse(null)}
          courseTitle={`${milestoneEditingCourse.title} (${milestoneEditingCourse.user_name})`}
          initialNodes={milestoneNodes}
          onSave={async (updatedNodes) => {
            const topicsData = updatedNodes.map(n => ({
              id: n.id,
              title: n.label,
              phase: n.phase,
              status: n.status,
            }));
            const res = await adminSaveUserCourseJson(milestoneEditingCourse.course_id, {}, topicsData);
            if (res.success) loadData();
            return res;
          }}
        />
      )}

      {/* ── Edit Details Modal ────────────────────────────────────────────── */}
      {editDetailsCourse && (
        <Modal
          open={Boolean(editDetailsCourse)}
          onClose={() => setEditDetailsCourse(null)}
          title={`Edit Course: ${editDetailsCourse.title}`}
          width="max-w-md"
        >
          <form onSubmit={handleSaveDetails} className="space-y-4">
            <div className="p-2.5 rounded-lg bg-accent-amber/5 border border-accent-amber/20 text-xs text-zinc-300">
              Owner: <strong>{editDetailsCourse.user_name}</strong> ({editDetailsCourse.user_email})
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Course Title</label>
              <input
                type="text"
                value={detailsForm.title}
                onChange={e => setDetailsForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-[#0D1017] border border-white/[0.1] text-white outline-none focus:border-accent-amber/50"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Status</label>
                <select
                  value={detailsForm.status}
                  onChange={e => setDetailsForm(f => ({ ...f, status: e.target.value as CourseStatus }))}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-[#0D1017] border border-white/[0.1] text-white outline-none"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Mode</label>
                <select
                  value={detailsForm.mode}
                  onChange={e => setDetailsForm(f => ({ ...f, mode: e.target.value as CourseMode }))}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-[#0D1017] border border-white/[0.1] text-white outline-none"
                >
                  <option value="courses">Courses (Roadmap)</option>
                  <option value="academic">Academic (Term)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
              <Button variant="secondary" size="md" type="button" onClick={() => setEditDetailsCourse(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
