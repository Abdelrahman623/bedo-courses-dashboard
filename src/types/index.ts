// ─── Profile ────────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  name: string;
  username?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  weekly_goal_hours: number;
  /** DB-controlled admin flag (public.profiles.is_admin). Never set from the client. */
  is_admin?: boolean;
  created_at: string;
}

// ─── Roadmap ─────────────────────────────────────────────────────────────────
export interface Roadmap {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  image_url?: string;
  created_at: string;
}

// ─── Course ──────────────────────────────────────────────────────────────────
export type CourseStatus = 'not_started' | 'in_progress' | 'completed' | 'paused';

/**
 * 'courses'  — sequential/prioritized self-directed learning (the original
 *              model): topics build on each other, one roadmap graph per course.
 * 'academic' — concurrent college-style courses (Linear Algebra, Probability,
 *              etc. running in the same term): no dependency chain between
 *              courses; each has its own timetable, assessments and grades.
 * Both modes coexist on the same account — this is a display/behavior split,
 * not a separate data store.
 */
export type CourseMode = 'academic' | 'courses';

/** Orthogonal to `mode`: whether this course came from a built-in template
 *  (seeded) or was entered by the user themselves. */
export type CourseSource = 'seeded' | 'user';

export interface Course {
  id: string;
  user_id: string;
  roadmap_id?: string;
  title: string;
  source_url?: string;
  start_date?: string;
  status: CourseStatus;
  /** Defaults to 'courses' for any row created before this field existed —
   *  see roadmapStore's normalization on fetch. */
  mode: CourseMode;
  /** Defaults to 'user' for pre-existing rows without a roadmap_id, 'seeded'
   *  for those enrolled from a built-in template — see roadmapStore. */
  source: CourseSource;
  created_at: string;
}

// ─── Academic mode: schedule / assessments / grades ──────────────────────────
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday ... 6 = Saturday

/** One recurring weekly class slot for an academic-mode course. A course can
 *  have several (e.g. a lecture + a lab on different days). */
export interface Schedule {
  id: string;
  course_id: string;
  day_of_week: DayOfWeek;
  /** 24h "HH:MM" */
  start_time: string;
  /** 24h "HH:MM" */
  end_time: string;
  location?: string;
  created_at: string;
}

export type AssessmentType = 'exam' | 'assignment' | 'quiz';

/** An exam/assignment/quiz belonging to an academic-mode course. */
export interface Assessment {
  id: string;
  course_id: string;
  title: string;
  type: AssessmentType;
  due_date: string; // ISO date "YYYY-MM-DD"
  /** Fraction of the course grade this is worth, 0–1 (e.g. 0.25 = 25%). */
  weight: number;
  created_at: string;
}

/** The recorded score for one assessment. At most one per assessment. */
export interface Grade {
  id: string;
  assessment_id: string;
  score: number;
  max_score: number;
  created_at: string;
}

/** Derived (not persisted): a course's weighted percentage + 4.0-scale grade
 *  point, computed from its assessments/grades. See roadmapStore.getCourseGrade. */
export interface CourseGrade {
  course_id: string;
  /** Weighted percentage across graded assessments only, 0–100. Null if
   *  nothing has been graded yet. */
  percentage: number | null;
  /** Standard 4.0-scale grade point corresponding to `percentage`. Null if
   *  `percentage` is null. */
  gradePoint: number | null;
  /** Sum of `weight` across assessments that have a recorded grade — lets
   *  callers show "graded 60% of the course so far" type context. */
  weightGraded: number;
}

// ─── Topic ───────────────────────────────────────────────────────────────────
export type TopicStatus = 'not_started' | 'in_progress' | 'completed';

export interface Topic {
  id: string;
  course_id: string;
  title: string;
  parent_topic_id?: string;
  position_x?: number;
  position_y?: number;
  phase?: string;
  status: TopicStatus;
  created_at: string;
}

// ─── Note ────────────────────────────────────────────────────────────────────
export type NoteType = 'general' | 'linked';

export interface Note {
  id: string;
  user_id: string;
  course_id?: string;
  topic_id?: string;
  project_id?: string;
  note_type?: NoteType;
  title: string;
  content: string; // TipTap JSON string
  tags: string[];
  updated_at: string;
  created_at: string;
}

// ─── Project ─────────────────────────────────────────────────────────────────
export type ProjectStatus = 'idea' | 'in_progress' | 'completed' | 'deployed';
export type ProjectType = 'course' | 'independent';

export interface Project {
  id: string;
  user_id: string;
  course_id?: string;
  type: ProjectType;
  title: string;
  description?: string;
  status: ProjectStatus;
  tech_stack: string[];
  github_url?: string;
  demo_url?: string;
  local_path?: string;
  completion_pct: number;
  created_at: string;
  updated_at: string;
  /** Client-only flag — set when the project was shared with this user (not owned). */
  isShared?: boolean;
}

// ─── Project Sharing ─────────────────────────────────────────────────────────
export type InviteStatus = 'pending' | 'accepted' | 'declined';

export interface ProjectInvite {
  id: string;
  project_id: string;
  inviter_id: string;
  invitee_id: string;
  status: InviteStatus;
  created_at: string;
  updated_at: string;
  /** Populated by store join queries */
  inviter_profile?: Pick<Profile, 'id' | 'name' | 'username' | 'avatar_url'>;
  invitee_profile?: Pick<Profile, 'id' | 'name' | 'username' | 'avatar_url'>;
  project?: Pick<Project, 'id' | 'title'>;
}

// ─── Milestones ──────────────────────────────────────────────────────────────
export interface MilestoneItem {
  id: string;
  milestone_id: string;
  text: string;
  done: boolean;
  position: number;
  created_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  definition?: string;
  position: number;
  /** Always fully populated on the client after fetch */
  items: MilestoneItem[];
  created_at: string;
  updated_at: string;
}

// ─── Live Presence ────────────────────────────────────────────────────────────
export interface PresenceCursor {
  userId: string;
  name: string;
  color: string; // hex, deterministic from userId
  /** SVG-space (D3 canvas) coordinates */
  x: number;
  y: number;
  updatedAt: number; // Date.now()
}

// ─── Session ──────────────────────────────────────────────────────────────────
export interface Session {
  id: string;
  user_id: string;
  course_id?: string;
  topic_id?: string;
  start_time: string;
  end_time?: string;
  duration_mins: number;
  notes?: string;
  created_at: string;
}

// ─── Daily Activity ───────────────────────────────────────────────────────────
export interface DailyActivity {
  id: string;
  user_id: string;
  date: string; // ISO date "YYYY-MM-DD"
  total_mins: number;
  topics_completed: number;
  created_at: string;
}

// ─── Roadmap Node (for D3 graph) ─────────────────────────────────────────────
export interface RoadmapResource {
  title: string;
  url: string;
}

export interface RoadmapNode {
  id: string;
  label: string;
  phase: string;
  status: TopicStatus;
  description?: string;
  subtopics?: string[];
  resources?: RoadmapResource[];
  x?: number;
  y?: number;
  children?: string[]; // ids
  /** ISO timestamp of the moment `status` last became 'completed'. Set by
   *  roadmapStore.setLocalTopicStatus; drives Analytics' curriculum
   *  velocity chart. Undefined for nodes that have never been completed. */
  completedAt?: string;
}

export interface RoadmapEdge {
  source: string;
  target: string;
}
