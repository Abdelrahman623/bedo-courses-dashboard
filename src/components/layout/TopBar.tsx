import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Sparkles, Flame, Target, Compass, FileText, CheckCheck, X, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useSessionStore } from '../../store/sessionStore';
import { useRoadmapStore } from '../../store/roadmapStore';
import { useNotesStore } from '../../store/notesStore';
import { useUIStore } from '../../store/uiStore';
import { loadUserState, queueUserState } from '../../lib/userState';

const PAGE_TITLES: Record<string, string> = {
  '/':          'Overview',
  '/courses':   'Courses & Roadmap',
  '/notes':     'Notes Workspace',
  '/projects':  'Projects & Portfolio',
  '/tracker':   'Focus Timer',
  '/analytics': 'Performance & Analytics',
  '/settings':  'Settings',
};

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  category: string;
  icon: React.ReactNode;
  iconBg: string;
  path: string;
}

export const TopBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { currentStreak, weeklyMins } = useSessionStore();
  const { localNodes } = useRoadmapStore();
  const { notes } = useNotesStore();
  const toggleMobileSidebar = useUIStore(s => s.toggleMobileSidebar);

  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Read / dismissed state belongs to the account, not the browser, so it
  // follows you to another device instead of resetting. Stored under the
  // `notifications` key in public.user_state.
  const [readIds, setReadIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    loadUserState<{ read: string[]; dismissed: string[] }>('notifications', { read: [], dismissed: [] })
      .then(state => {
        if (!alive) return;
        setReadIds(state.read ?? []);
        setDismissedIds(state.dismissed ?? []);
      });
    return () => { alive = false; };
  }, [user?.id]);

  const persistNotifications = (read: string[], dismissed: string[]) => {
    queueUserState('notifications', { read, dismissed });
  };

  const title = PAGE_TITLES[location.pathname] || 'Dashboard';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Get initials from profile name, username, email, or fallback
  const email = profile?.email || user?.email || '';
  const displayName = profile?.name || user?.user_metadata?.full_name || '';
  const username = profile?.username || user?.user_metadata?.username || '';
  const initial = (displayName[0] || username[0] || email[0] || 'B').toUpperCase();

  // Dynamic system & study notifications
  const allNotifications: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // 1. Streak / Daily Study Habit
    if (currentStreak > 0) {
      list.push({
        id: 'streak-active',
        title: `${currentStreak}-Day Study Streak Active!`,
        description: 'Keep your learning momentum going by completing a focus block today.',
        time: todayStr,
        category: 'Study Streak',
        icon: <Flame size={14} className="text-accent-highlight" />,
        iconBg: 'bg-accent-highlight/15 border-accent-highlight/20',
        path: '/tracker',
      });
    } else {
      list.push({
        id: 'streak-start',
        title: "Start Today's Focus Session",
        description: 'Launch the timer to begin your daily focus streak.',
        time: todayStr,
        category: 'Habit',
        icon: <Flame size={14} className="text-zinc-400" />,
        iconBg: 'bg-white/[0.06] border-white/[0.08]',
        path: '/tracker',
      });
    }

    // 2. Weekly Study Target
    const weeklyHours = +(weeklyMins / 60).toFixed(1);
    const weeklyTarget = profile?.weekly_goal_hours ?? 10;
    const weeklyPct = Math.min(Math.round((weeklyHours / weeklyTarget) * 100), 100);
    list.push({
      id: 'weekly-goal',
      title: `Weekly Goal: ${weeklyHours}h / ${weeklyTarget}h (${weeklyPct}%)`,
      description: weeklyPct >= 100
        ? 'Weekly goal completed! Outstanding consistency.'
        : `${(Math.max(0, weeklyTarget - weeklyHours)).toFixed(1)}h remaining to hit your target.`,
      time: 'This Week',
      category: 'Target',
      icon: <Target size={14} className="text-accent-secondary" />,
      iconBg: 'bg-accent-secondary/15 border-accent-secondary/20',
      path: '/analytics',
    });

    // 3. Curriculum / Roadmap
    if (localNodes.length === 0) {
      list.push({
        id: 'roadmap-select',
        title: 'Select a Learning Path',
        description: 'Choose Web Dev, AI, Data, Cyber, or create your custom curriculum.',
        time: 'Get Started',
        category: 'Roadmap',
        icon: <Compass size={14} className="text-accent-tertiary" />,
        iconBg: 'bg-accent-tertiary/15 border-accent-tertiary/20',
        path: '/courses',
      });
    } else {
      const completed = localNodes.filter(n => n.status === 'completed').length;
      list.push({
        id: 'roadmap-progress',
        title: `Curriculum: ${completed} of ${localNodes.length} Topics Completed`,
        description: 'View your visual roadmap milestones and curriculum progression.',
        time: 'Active Path',
        category: 'Roadmap',
        icon: <Compass size={14} className="text-accent-tertiary" />,
        iconBg: 'bg-accent-tertiary/15 border-accent-tertiary/20',
        path: '/courses',
      });
    }

    // 4. Linked Notes
    if (notes.length > 0) {
      list.push({
        id: 'notes-active',
        title: `${notes.length} Study Notes Recorded`,
        description: 'All your course notes and code snippets are organized and linked.',
        time: 'Notes',
        category: 'Knowledge',
        icon: <FileText size={14} className="text-accent-amber" />,
        iconBg: 'bg-accent-amber/15 border-accent-amber/20',
        path: '/notes',
      });
    } else {
      list.push({
        id: 'notes-empty',
        title: 'Link Notes to Your Courses',
        description: 'Take markdown notes in the editor and link them directly to milestones.',
        time: 'Quick Tip',
        category: 'Notes',
        icon: <FileText size={14} className="text-accent-amber" />,
        iconBg: 'bg-accent-amber/15 border-accent-amber/20',
        path: '/notes',
      });
    }

    return list;
  }, [currentStreak, weeklyMins, profile?.weekly_goal_hours, localNodes, notes]);

  const visibleNotifications = useMemo(() => {
    return allNotifications.filter(n => !dismissedIds.includes(n.id));
  }, [allNotifications, dismissedIds]);

  const unreadCount = useMemo(() => {
    return visibleNotifications.filter(n => !readIds.includes(n.id)).length;
  }, [visibleNotifications, readIds]);

  const handleMarkAllRead = () => {
    const allIds = visibleNotifications.map(n => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    persistNotifications(updated, dismissedIds);
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = Array.from(new Set([...dismissedIds, id]));
    setDismissedIds(updated);
    persistNotifications(readIds, updated);
  };

  const handleClearAll = () => {
    const allIds = allNotifications.map(n => n.id);
    setDismissedIds(allIds);
    persistNotifications(readIds, allIds);
  };

  const handleResetNotifications = () => {
    setDismissedIds([]);
    setReadIds([]);
    persistNotifications([], []);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!readIds.includes(item.id)) {
      const updated = [...readIds, item.id];
      setReadIds(updated);
      persistNotifications(updated, dismissedIds);
    }
    setShowNotifications(false);
    navigate(item.path);
  };

  return (
    <header className="h-[56px] flex-shrink-0 bg-[#0A0D14]/90 backdrop-blur-md flex items-center px-3 sm:px-4 lg:px-6 gap-2 sm:gap-4 sticky top-0 z-20">
      {/* Hamburger — opens the sidebar drawer below `lg` */}
      <button
        type="button"
        onClick={toggleMobileSidebar}
        className="flex-shrink-0 p-2 -ml-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* Title + Breadcrumb */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <h1 className="font-semibold text-white text-sm tracking-tight truncate">{title}</h1>
        <span className="hidden sm:inline text-zinc-600 text-xs">/</span>
        <span className="hidden sm:inline text-xs font-mono text-zinc-400 whitespace-nowrap">{dateStr}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        {/* Notifications Center */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(v => !v);
              setShowMenu(false);
            }}
            className={`p-2 rounded-lg transition-colors cursor-pointer relative ${
              showNotifications
                ? 'text-white bg-white/[0.10]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]'
            }`}
            title="Notifications & Updates"
            aria-label="Notifications"
          >
            <Bell size={16} className={unreadCount > 0 ? 'text-accent-highlight' : ''} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-highlight animate-pulse shadow-[0_0_8px_rgb(var(--c-highlight)/0.6)]" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="absolute right-0 top-10 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-[#131722] border border-white/[0.10] rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col divide-y divide-white/[0.06]"
                >
                  {/* Notifications Header */}
                  <div className="p-3.5 flex items-center justify-between bg-[#161B28]">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                        <Bell size={13} className="text-accent-highlight" />
                        <span>Notifications</span>
                      </h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-accent-highlight/15 text-accent-highlight border border-accent-highlight/25 font-mono font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-zinc-400 hover:text-accent-amber transition-colors flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <CheckCheck size={12} />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-[380px] overflow-y-auto divide-y divide-white/[0.04]">
                    {visibleNotifications.length > 0 ? (
                      visibleNotifications.map(item => {
                        const isRead = readIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleNotificationClick(item)}
                            className={`p-3.5 flex items-start gap-3 hover:bg-white/[0.04] transition-colors cursor-pointer group relative ${
                              !isRead ? 'bg-white/[0.02]' : 'opacity-80 hover:opacity-100'
                            }`}
                          >
                            <div className={`p-2 rounded-xl border flex-shrink-0 mt-0.5 ${item.iconBg}`}>
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-mono text-zinc-400 tracking-wider">
                                  {item.category}
                                </span>
                                <span className="text-zinc-600 text-[10px]">·</span>
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  {item.time}
                                </span>
                              </div>
                              <h4 className={`text-xs font-semibold mt-0.5 leading-snug ${
                                !isRead ? 'text-white' : 'text-zinc-300'
                              }`}>
                                {item.title}
                              </h4>
                              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                                {item.description}
                              </p>
                            </div>

                            {/* Status indicator / Dismiss */}
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              {!isRead && (
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-highlight mt-1" />
                              )}
                              <button
                                onClick={(e) => handleDismiss(item.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/[0.08] text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer mt-1"
                                title="Dismiss notification"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-10 px-4 space-y-2">
                        <Sparkles size={24} className="text-zinc-500 mx-auto opacity-60" />
                        <p className="text-xs font-semibold text-white">All caught up!</p>
                        <p className="text-[11px] text-zinc-400 max-w-xs mx-auto">
                          No new notifications. We&apos;ll notify you about milestones and focus streaks as you learn.
                        </p>
                        <button
                          onClick={handleResetNotifications}
                          className="text-[11px] text-accent-amber hover:underline pt-2 cursor-pointer inline-block"
                        >
                          Restore notifications
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Notifications Footer */}
                  {visibleNotifications.length > 0 && (
                    <div className="p-2.5 bg-[#10141E] flex items-center justify-between text-[11px] text-zinc-500 px-3.5">
                      <span>Click any item to view</span>
                      <button
                        onClick={handleClearAll}
                        className="text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer font-medium"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowMenu(v => !v);
              setShowNotifications(false);
            }}
            className="w-7 h-7 rounded-lg bg-accent-amber/15 border border-accent-amber/30 flex items-center justify-center text-accent-amber font-mono font-semibold text-xs select-none cursor-pointer hover:bg-accent-amber/25 transition-colors shadow-sm"
          >
            {initial}
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.12, ease: 'easeOut' as const }}
                  className="absolute right-0 top-9 w-52 bg-[#131722] border border-white/[0.10] rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-white/[0.06]"
                >
                  {/* User info */}
                  <div className="px-4 py-3">
                    <p className="text-xs font-semibold text-white truncate">
                      {username ? `@${username}` : 'Bedo'}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400 truncate mt-0.5">{email || 'Local Session'}</p>
                  </div>
                  {/* Sign out */}
                  <button
                    onClick={async () => { setShowMenu(false); await signOut(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
