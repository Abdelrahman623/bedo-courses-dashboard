import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '../../hooks/useAuth';
import { useRoadmapStore } from '../../store/roadmapStore';
import { useNotesStore } from '../../store/notesStore';
import { useProjectsStore } from '../../store/projectsStore';
import { useSessionStore } from '../../store/sessionStore';
import { useUIStore } from '../../store/uiStore';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in:      { opacity: 1, y: 0 },
  out:     { opacity: 0, y: -8 },
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'easeInOut' as const,
  duration: 0.22,
};

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const fetchAll           = useRoadmapStore(s => s.fetchAll);
  const fetchDbTemplates   = useRoadmapStore(s => s.fetchDbTemplates);
  const subscribeTemplates = useRoadmapStore(s => s.subscribeTemplates);
  const fetchNotes         = useNotesStore(s => s.fetchNotes);
  const fetchProjects = useProjectsStore(s => s.fetchProjects);
  const fetchSessions = useSessionStore(s => s.fetchSessions);
  const timerRunning  = useSessionStore(s => s.timerRunning);
  const tickTimer     = useSessionStore(s => s.tickTimer);
  const navigate = useNavigate();

  const academicModeEnabled   = useUIStore(s => s.academicModeEnabled);
  const fetchAcademicMode     = useUIStore(s => s.fetchAcademicMode);
  const subscribeAcademicMode = useUIStore(s => s.subscribeAcademicMode);
  const toast                 = useUIStore(s => s.toast);
  const hideToast             = useUIStore(s => s.hideToast);

  // Sync global system settings (academic mode enabled/stopped) for all users
  useEffect(() => {
    void fetchAcademicMode();
    const unsub = subscribeAcademicMode();

    // Re-check whenever window regains focus (e.g. user switches tabs)
    const onFocus = () => void fetchAcademicMode();
    window.addEventListener('focus', onFocus);

    // Periodic safety poll every 15s in case websocket is disconnected or suspended
    const interval = setInterval(() => void fetchAcademicMode(), 15000);

    return () => {
      unsub();
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [fetchAcademicMode, subscribeAcademicMode]);

  // Sync global roadmap templates & tombstones across tabs & sessions
  useEffect(() => {
    void fetchDbTemplates();
    const unsubTemplates = subscribeTemplates();

    const onFocus = () => void fetchDbTemplates();
    window.addEventListener('focus', onFocus);

    return () => {
      unsubTemplates();
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchDbTemplates, subscribeTemplates]);

  // Also check whenever location changes to guarantee real-time page transitions
  useEffect(() => {
    void fetchAcademicMode();
  }, [location.pathname, fetchAcademicMode]);

  // If Academic mode was stopped globally while user is on an academic-only route, redirect to /courses
  useEffect(() => {
    if (!academicModeEnabled) {
      if (['/timetable', '/deadlines', '/grades'].some(p => location.pathname.startsWith(p))) {
        navigate('/courses', { replace: true });
      }
    }
  }, [academicModeEnabled, location.pathname, navigate]);

  // The Pomodoro/stopwatch instrument is usable from more than one screen
  // now (Home's Focus card, the full Tracker page), so the ticking interval
  // lives here — mounted for the whole authenticated session — instead of
  // inside Tracker.tsx.
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(interval);
  }, [timerRunning, tickTimer]);

  useEffect(() => {
    if (!user?.id) return;
    void fetchAll();
    void fetchNotes();
    void fetchProjects();
    void fetchSessions();
  }, [user?.id, fetchAll, fetchNotes, fetchProjects, fetchSessions]);

  return (
    <div className="flex h-dvh overflow-hidden bg-bg-base relative">
      {/* ── Global UI Notification Toast ──────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="fixed top-4 right-4 z-50 max-w-md w-full shadow-2xl rounded-xl border p-4 pointer-events-auto backdrop-blur-md"
            style={{
              backgroundColor: toast.type === 'error'
                ? 'rgba(38, 12, 16, 0.95)'
                : toast.type === 'success'
                ? 'rgba(10, 32, 22, 0.95)'
                : 'rgba(15, 23, 42, 0.95)',
              borderColor: toast.type === 'error'
                ? 'rgba(244, 63, 94, 0.35)'
                : toast.type === 'success'
                ? 'rgba(16, 185, 129, 0.35)'
                : 'rgba(59, 130, 246, 0.35)',
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {toast.type === 'error' && <AlertTriangle size={18} className="text-rose-400" />}
                {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400" />}
                {toast.type === 'info' && <Info size={18} className="text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <h4 className={`text-xs font-bold leading-none mb-1 ${
                    toast.type === 'error' ? 'text-rose-300' : toast.type === 'success' ? 'text-emerald-300' : 'text-blue-300'
                  }`}>
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs text-zinc-200 leading-relaxed break-words font-medium">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={hideToast}
                className="flex-shrink-0 p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
              transition={pageTransition}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
