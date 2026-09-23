import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '../../hooks/useAuth';
import { useRoadmapStore } from '../../store/roadmapStore';
import { useNotesStore } from '../../store/notesStore';
import { useProjectsStore } from '../../store/projectsStore';
import { useSessionStore } from '../../store/sessionStore';

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

  const fetchAll      = useRoadmapStore(s => s.fetchAll);
  const fetchNotes    = useNotesStore(s => s.fetchNotes);
  const fetchProjects = useProjectsStore(s => s.fetchProjects);
  const fetchSessions = useSessionStore(s => s.fetchSessions);

  // Nothing is cached in the browser any more, so this is where the signed-in
  // account's data is loaded — once, on entry, and again whenever the account
  // changes. Individual pages used to rely on whatever localStorage happened
  // to hold, which is exactly how one user's data ended up on another's screen.
  useEffect(() => {
    if (!user?.id) return;
    void fetchAll();
    void fetchNotes();
    void fetchProjects();
    void fetchSessions();
  }, [user?.id, fetchAll, fetchNotes, fetchProjects, fetchSessions]);

  return (
    <div className="flex h-dvh overflow-hidden bg-bg-base">
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
