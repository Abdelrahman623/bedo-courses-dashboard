import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Timetable } from './pages/Timetable';
import { Deadlines } from './pages/Deadlines';
import { Grades } from './pages/Grades';
import { Courses } from './pages/Courses';
import { Notes } from './pages/Notes';
import { Projects } from './pages/Projects';
import { Tracker } from './pages/Tracker';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

// ── Loading screen ────────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="min-h-screen bg-bg-base flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-accent-amber flex items-center justify-center animate-pulse">
        <span className="text-bg-base font-bold text-lg">B</span>
      </div>
      <p className="text-txt-muted text-sm">Loading...</p>
    </div>
  </div>
);

// ── Protected route wrapper ───────────────────────────────────────────────────
const ProtectedRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/"          element={<Home />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/deadlines" element={<Deadlines />} />
        <Route path="/grades"    element={<Grades />} />
        <Route path="/courses"   element={<Courses />} />
        <Route path="/notes"     element={<Notes />} />
        <Route path="/projects"  element={<Projects />} />
        <Route path="/tracker"   element={<Tracker />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings"  element={<Settings />} />
      </Route>
    </Routes>
  );
};

// ── Auth routes (redirect to / if already authenticated) ──────────────────────
const AuthRoutes = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Login />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthRoutes />} />
          <Route path="/*"     element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
