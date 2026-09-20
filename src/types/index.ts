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

export interface Course {
  id: string;
  user_id: string;
  roadmap_id?: string;
  title: string;
  source_url?: string;
  start_date?: string;
  status: CourseStatus;
  created_at: string;
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
