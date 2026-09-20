import React, { useState } from 'react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import {
  LayoutGrid, GitFork, BookOpen, FileEdit,
  FolderKanban, Activity, BarChart2,
  Settings, ChevronLeft,
} from 'lucide-react';

interface NavItem {
  id: string;
  to: string;
  icon: React.ElementType;
  label: string;
  hasDot?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { id: 'overview', to: '/', icon: LayoutGrid, label: 'Overview' },
    ],
  },
  {
    title: 'Learning',
    items: [
      { id: 'paths', to: '/courses?view=roadmap', icon: GitFork, label: 'Paths' },
      { id: 'courses', to: '/courses?view=courses', icon: BookOpen, label: 'Courses' },
      { id: 'notes', to: '/notes', icon: FileEdit, label: 'Notes', hasDot: true },
    ],
  },
  {
    title: 'Practice',
    items: [
      { id: 'projects', to: '/projects', icon: FolderKanban, label: 'Projects' },
    ],
  },
  {
    title: 'Growth',
    items: [
      { id: 'tracker', to: '/tracker', icon: Activity, label: 'Tracker' },
      { id: 'analytics', to: '/analytics', icon: BarChart2, label: 'Analytics' },
    ],
  },
];

/**
 * Stroke-based NL monogram — clean and sharp at any size
 */
const NLLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-6' }) => (
  <svg
    viewBox="0 0 56 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <filter id="nl-glow-s" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* ── N letter ── */}
    {/* Left vertical stroke */}
    <line x1="5" y1="6" x2="5" y2="42" stroke="white" strokeWidth="5" strokeLinecap="round" />
    {/* Diagonal stroke top-left to bottom-right */}
    <line x1="5" y1="6" x2="27" y2="42" stroke="white" strokeWidth="5" strokeLinecap="round" />
    {/* Right vertical stroke */}
    <line x1="27" y1="6" x2="27" y2="42" stroke="white" strokeWidth="5" strokeLinecap="round" />

    {/* ── Blue accent fill in N's inner crook ── */}
    <path
      d="M5 22 L18 42 L27 42 L27 28 Z"
      fill="#38BDF8"
      opacity="0.85"
      filter="url(#nl-glow-s)"
    />

    {/* ── L letter ── */}
    {/* Vertical stroke of L */}
    <line x1="37" y1="6" x2="37" y2="42" stroke="white" strokeWidth="5" strokeLinecap="round" />
    {/* Horizontal base of L */}
    <line x1="37" y1="42" x2="51" y2="42" stroke="white" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Check active state accurately accounting for query parameters
  const isItemActive = (item: NavItem) => {
    if (item.id === 'overview') {
      return location.pathname === '/';
    }
    if (item.id === 'paths') {
      const view = searchParams.get('view');
      return location.pathname === '/courses' && (!view || view === 'roadmap');
    }
    if (item.id === 'courses') {
      return location.pathname === '/courses' && searchParams.get('view') === 'courses';
    }
    if (item.id === 'notes') {
      return location.pathname.startsWith('/notes');
    }
    if (item.id === 'projects') {
      return location.pathname.startsWith('/projects');
    }
    if (item.id === 'tracker') {
      return location.pathname.startsWith('/tracker');
    }
    if (item.id === 'analytics') {
      return location.pathname.startsWith('/analytics');
    }
    return location.pathname.startsWith(item.to);
  };

  const isSettingsActive = location.pathname.startsWith('/settings');

  return (
    <aside
      style={{ width: collapsed ? 64 : 220 }}
      className="h-full flex-shrink-0 bg-gradient-to-b from-[#111A24] via-[#0D141C] to-[#080B10] border-r border-white/[0.08] flex flex-col overflow-hidden relative z-10 transition-all duration-200 ease-out select-none"
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3.5 h-[56px] border-b border-white/[0.08] flex-shrink-0">
        <div className="relative flex items-center justify-center w-11 h-8 rounded-xl bg-sky-500/[0.08] border border-sky-400/25 shadow-[0_0_14px_rgba(56,189,248,0.22)] flex-shrink-0 group">
          <NLLogo className="w-7 h-6 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)] transition-transform duration-200 group-hover:scale-105" />
        </div>
        {!collapsed && (
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-sm tracking-tight text-white truncate">
              Noname
            </span>
            <span className="text-sky-400 text-sm font-semibold tracking-tight">
              learn
            </span>
          </div>
        )}
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto px-3 space-y-4 scrollbar-none">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <h3 className="text-[11px] font-medium text-zinc-400/90 px-3 pt-1 pb-1">
                {section.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item);

                return (
                  <NavLink key={item.id} to={item.to} className="outline-none block">
                    <div
                      className={[
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all duration-150 relative group',
                        active
                          ? 'border border-amber-400/40 bg-white/[0.06] text-white font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
                          : 'border border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04] font-medium',
                      ].join(' ')}
                    >
                      <Icon
                        size={17}
                        className={active ? 'text-white' : 'text-zinc-400 group-hover:text-white transition-colors'}
                      />

                      {!collapsed && (
                        <span className="truncate flex-1 tracking-normal">{item.label}</span>
                      )}

                      {/* Red notification dot */}
                      {item.hasDot && !collapsed && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0 shadow-[0_0_6px_rgba(244,63,94,0.7)]" />
                      )}

                      {/* Tooltip when collapsed */}
                      {collapsed && (
                        <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#161B26] text-white text-[11px] rounded-lg border border-white/[0.12] shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                          {item.label}
                        </div>
                      )}
                    </div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}

        {/* Divider before Settings */}
        <div className="pt-1">
          <div className="border-t border-white/[0.06] my-1" />
          <NavLink to="/settings" className="outline-none block">
            <div
              className={[
                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all duration-150 relative group',
                isSettingsActive
                  ? 'border border-amber-400/40 bg-white/[0.06] text-white font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
                  : 'border border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04] font-medium',
              ].join(' ')}
            >
              <Settings
                size={17}
                className={isSettingsActive ? 'text-white' : 'text-zinc-400 group-hover:text-white transition-colors'}
              />
              {!collapsed && (
                <span className="truncate flex-1 tracking-normal">Settings</span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#161B26] text-white text-[11px] rounded-lg border border-white/[0.12] shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  Settings
                </div>
              )}
            </div>
          </NavLink>
        </div>
      </nav>

      {/* Footer Collapse Toggle */}
      <div className="border-t border-white/[0.08] p-2 flex items-center justify-center">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft
            size={13}
            className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
    </aside>
  );
};
