import { useRoadmapStore } from '../store/roadmapStore';
import { useSessionStore } from '../store/sessionStore';
import { useNotesStore } from '../store/notesStore';
import { useProjectsStore } from '../store/projectsStore';

/**
 * Resets every store's IN-MEMORY state back to empty, on top of clearing
 * localStorage (see storage.clearAllUserData). Without this, a sign-out or
 * account deletion only clears the cache on disk — the zustand stores are
 * SPA-lifetime singletons, so their current in-memory arrays (courses,
 * topics, sessions, notes, projects, roadmap canvas) would otherwise keep
 * rendering for the next person who logs into the same browser tab, right
 * up until each store's own fetch happens to overwrite them.
 */
export function resetAllStores(): void {
  useRoadmapStore.setState({
    roadmaps: [],
    courses: [],
    topics: [],
    localNodes: [],
    localEdges: [],
    activeTemplateId: null,
    customTemplates: {},
  });

  useSessionStore.setState({
    sessions: [],
    activity: [],
    timerRunning: false,
    timerStart: null,
    timerCourseId: null,
    timerTopicId: null,
    currentStreak: 0,
    longestStreak: 0,
    weeklyMins: 0,
  });

  useNotesStore.setState({
    notes: [],
    activeNote: null,
    searchQuery: '',
  });

  useProjectsStore.setState({
    projects: [],
  });
}
