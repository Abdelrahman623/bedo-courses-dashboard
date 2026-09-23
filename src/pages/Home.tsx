import React from 'react';
import { useUIStore } from '../store/uiStore';
import { CoursesHome } from './home/CoursesHome';
import { AcademicHome } from './home/AcademicHome';

// Thin mode dispatcher — Courses mode keeps the original single-focus,
// sequential-roadmap Home unchanged; Academic mode gets its own overview
// (today's classes + upcoming deadlines + GPA across concurrent courses)
// rather than a single "Today's Focus" item, since there's no one path to
// focus on when courses run side by side. Switching modes (Sidebar) only
// changes which of these renders — neither mode's data is touched.
export const Home: React.FC = () => {
  const mode = useUIStore(s => s.mode);
  return mode === 'academic' ? <AcademicHome /> : <CoursesHome />;
};
