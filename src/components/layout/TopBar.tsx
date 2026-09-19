import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, LogOut, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

const PAGE_TITLES: Record<string, string> = {
  '/':          'Overview',
  '/courses':   'Courses & Roadmap',
  '/notes':     'Notes Workspace',
  '/projects':  'Projects & Portfolio',
  '/tracker':   'Focus Timer',
  '/analytics': 'Performance & Analytics',
  '/settings':  'Settings',
};

export const TopBar: React.FC = () => {
  const location = useLocation();
  const { user, profile, isDemo, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const title = PAGE_TITLES[location.pathname] || 'Dashboard';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Get initials from profile name, username, email, or fallback
  const email = profile?.email || user?.email || '';
  const displayName = profile?.name || user?.user_metadata?.full_name || '';
  const username = profile?.username || user?.user_metadata?.username || '';
  const initial = (displayName[0] || username[0] || email[0] || 'B').toUpperCase();

  return (
    <header className="h-[56px] flex-shrink-0 border-b border-white/[0.08] bg-[#0A0D14]/90 backdrop-blur-md flex items-center px-6 gap-4 sticky top-0 z-20">
      {/* Title + Breadcrumb */}
      <div className="flex-1 flex items-center gap-2">
        <h1 className="font-semibold text-white text-sm tracking-tight">{title}</h1>
        <span className="text-zinc-600 text-xs">/</span>
        <span className="text-xs font-mono text-zinc-400">{dateStr}</span>
        {isDemo && (
          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
            <Sparkles size={10} /> Demo Session
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        {/* Command Search Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-[#131722] hover:bg-[#161B28] border border-white/[0.08] hover:border-white/[0.15] rounded-lg px-2.5 py-1 text-xs text-zinc-400 transition-colors cursor-pointer select-none">
          <Search size={13} className="text-zinc-500" />
          <span className="text-[11px]">Quick Jump...</span>
          <kbd className="text-[9px] font-mono text-zinc-400 bg-white/[0.06] border border-white/[0.08] rounded px-1 py-0.5">
            ⌘K
          </kbd>
        </div>

        <button
          type="button"
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell size={15} />
        </button>

        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(v => !v)}
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
