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
 * Reformed glowing NL monogram logo from Noname Learn
 */
const NLLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      {/* Platinum-silver gradient for main letter strokes */}
      <linearGradient id="nl-monogram-white" x1="15" y1="12" x2="85" y2="88" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="60%" stopColor="#F8FAFC" />
        <stop offset="100%" stopColor="#CBD5E1" />
      </linearGradient>

      {/* Radiant electric cyan to cobalt gradient for accent pillar */}
      <linearGradient id="nl-monogram-blue" x1="32" y1="40" x2="42" y2="86" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="55%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>

      {/* Subtle cyan backlight aura */}
      <radialGradient id="nl-aura" cx="42%" cy="56%" r="48%">
        <stop offset="0%" stopColor="rgba(56,189,248,0.3)" />
        <stop offset="60%" stopColor="rgba(37,99,235,0.12)" />
        <stop offset="100%" stopColor="rgba(14,165,233,0)" />
      </radialGradient>

      {/* Glow filter for neon blue accent */}
      <filter id="nl-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="2.2" result="blur" />
        <feComponentTransfer in="blur" result="glow">
          <feFuncA type="linear" slope="0.75" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Soft shadow for letter depth */}
      <filter id="nl-depth" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6" />
      </filter>
    </defs>

    {/* Ambient backlight glow */}
    <circle cx="48" cy="52" r="38" fill="url(#nl-aura)" />

    {/* === N & L MONOGRAM === */}

    {/* 1. Top stem of 'L' (layered behind N diagonal) */}
    <g filter="url(#nl-depth)">
      {/* Top horizontal serif of L */}
      <path
        d="M47 28 H63 V31.5 C60.5 31.5 58.5 33 58.5 36 V56 L52.5 48.5 V36 C52.5 33 50.5 31.5 47 31.5 V28 Z"
        fill="url(#nl-monogram-white)"
      />
    </g>

    {/* 2. Distinctive Blue Accent Pillar inside N's crook */}
    <path
      d="M32 40.5 L41.5 52 V76.5 L32 86.5 Z"
      fill="url(#nl-monogram-blue)"
      filter="url(#nl-glow)"
    />

    {/* 3. Lower stem & horizontal foot of 'L' */}
    <g filter="url(#nl-depth)">
      <path
        d="M52.5 63.5 V80.5 C52.5 83.5 50 85.5 46 86 V88.5 H77 C77 88.5 79.5 88.5 80.5 85 C81.5 81.5 81.5 74 81.5 72 C80.5 76 77 79 72.5 80 H58.5 V71 L52.5 63.5 Z"
        fill="url(#nl-monogram-white)"
      />
    </g>

    {/* 4. The 'N': Left serif stem + Heavy diagonal stroke */}
    <g filter="url(#nl-depth)">
      {/* Left stem of N with serifs */}
      <path
        d="M16 13 C22 13 25.5 17 26 23 V80.5 C26 83.5 23 85 19 85.5 V88 H33 V85.5 C29 85 26 83.5 26 80.5 V23 C26 19 28.5 15.5 32 13 H16 Z"
        fill="url(#nl-monogram-white)"
      />

      {/* Bold diagonal stroke of N crossing over */}
      <path
        d="M26 13 L63 88 H52 L22 24 V13 H26 Z"
        fill="url(#nl-monogram-white)"
      />
    </g>
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
