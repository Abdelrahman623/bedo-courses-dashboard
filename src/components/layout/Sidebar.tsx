import React, { useState } from 'react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import {
  LayoutGrid, GitFork, BookOpen, FileEdit,
  FolderKanban, Activity, BarChart2,
  Settings, ChevronLeft, X,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

interface NavItem {
  id: string;
  to: string;
  icon: React.ElementType;
  label: string;
  hasDot?: boolean;
}

type Tone = 'primary' | 'secondary' | 'tertiary' | 'highlight';

interface NavSection {
  title: string;
  /** Theme role that colors this section's active item, hover icon and heading dot */
  tone: Tone;
  items: NavItem[];
}

// Full class strings (not built dynamically) so Tailwind can see every class.
const TONES: Record<Tone, { active: string; icon: string; hoverIcon: string; dot: string }> = {
  primary:   { active: 'border-accent-amber/40 bg-accent-amber/10',         icon: 'text-accent-amber',     hoverIcon: 'group-hover:text-accent-amber',     dot: 'bg-accent-amber' },
  secondary: { active: 'border-accent-secondary/40 bg-accent-secondary/10', icon: 'text-accent-secondary', hoverIcon: 'group-hover:text-accent-secondary', dot: 'bg-accent-secondary' },
  tertiary:  { active: 'border-accent-tertiary/40 bg-accent-tertiary/10',   icon: 'text-accent-tertiary',  hoverIcon: 'group-hover:text-accent-tertiary',  dot: 'bg-accent-tertiary' },
  highlight: { active: 'border-accent-highlight/40 bg-accent-highlight/10', icon: 'text-accent-highlight', hoverIcon: 'group-hover:text-accent-highlight', dot: 'bg-accent-highlight' },
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    tone: 'primary',
    items: [
      { id: 'overview', to: '/', icon: LayoutGrid, label: 'Overview' },
    ],
  },
  {
    title: 'Learning',
    tone: 'secondary',
    items: [
      { id: 'paths', to: '/courses?view=roadmap', icon: GitFork, label: 'Paths' },
      { id: 'courses', to: '/courses?view=courses', icon: BookOpen, label: 'Courses' },
      { id: 'notes', to: '/notes', icon: FileEdit, label: 'Notes', hasDot: true },
    ],
  },
  {
    title: 'Practice',
    tone: 'tertiary',
    items: [
      { id: 'projects', to: '/projects', icon: FolderKanban, label: 'Projects' },
    ],
  },
  {
    title: 'Growth',
    tone: 'highlight',
    items: [
      { id: 'tracker', to: '/tracker', icon: Activity, label: 'Tracker' },
      { id: 'analytics', to: '/analytics', icon: BarChart2, label: 'Analytics' },
    ],
  },
];



export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const mobileOpen = useUIStore(s => s.mobileSidebarOpen);
  const closeMobile = useUIStore(s => s.closeMobileSidebar);

  // Below `lg`, the sidebar is an off-canvas drawer, so any navigation
  // (a nav item, or Settings) should close it behind you.
  const handleNavigate = () => closeMobile();

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
    <>
      {/* Backdrop — phone/tablet only, shown while the drawer is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[1px] lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          // Off-canvas drawer below `lg`; static in-flow column at `lg` and up.
          'fixed inset-y-0 left-0 z-50 h-full flex flex-col overflow-hidden',
          'bg-gradient-to-b from-[#111A24] via-[#0D141C] to-[#080B10] border-r border-white/[0.08]',
          'transition-transform duration-200 ease-out select-none',
          'w-[240px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:translate-x-0 lg:z-10 lg:flex-shrink-0 lg:transition-[width] lg:duration-200',
          collapsed ? 'lg:w-16' : 'lg:w-[220px]',
        ].join(' ')}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-4 h-[56px] flex-shrink-0">

          {/* Logo */}
          <div className="brand-logo-glow relative flex items-center justify-center w-9 h-9 rounded-[10px] bg-[#081722] border flex-shrink-0 overflow-hidden">
            <img
              src="/nl-logo.png"
              alt="Noname Learn"
              className="w-7 h-7 object-contain"
            />
          </div>
          {/* Brand Name */}
          {!collapsed && (
            <div className="flex items-center gap-1 whitespace-nowrap min-w-0 flex-1">
              <span className="font-bold text-[18px] leading-none tracking-tight text-white">
                Noname
              </span>

              <span className="text-accent-secondary text-[18px] leading-none font-semibold tracking-tight">
                learn
              </span>
            </div>
          )}

          {/* Close drawer — phone/tablet only */}
          <button
            onClick={closeMobile}
            className="ml-auto flex-shrink-0 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors cursor-pointer lg:hidden"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto px-3 space-y-4 scrollbar-none">
        {NAV_SECTIONS.map((section) => {
          const tone = TONES[section.tone];
          return (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <h3 className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400/90 px-3 pt-1 pb-1">
                <span className={`w-1 h-1 rounded-full ${tone.dot}`} />
                {section.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item);

                return (
                  <NavLink key={item.id} to={item.to} onClick={handleNavigate} className="outline-none block">
                    <div
                      className={[
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all duration-150 relative group',
                        active
                          ? `border ${tone.active} text-white font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]`
                          : 'border border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04] font-medium',
                      ].join(' ')}
                    >
                      <Icon
                        size={17}
                        className={active ? tone.icon : `text-zinc-400 ${tone.hoverIcon} transition-colors`}
                      />

                      {!collapsed && (
                        <span className="truncate flex-1 tracking-normal">{item.label}</span>
                      )}

                      {/* Notification dot (theme highlight role) */}
                      {item.hasDot && !collapsed && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-highlight flex-shrink-0 shadow-[0_0_6px_rgb(var(--c-highlight)/0.7)]" />
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
          );
        })}

        {/* Divider before Settings */}
        <div className="pt-1">
          <div className="my-1" />
          <NavLink to="/settings" onClick={handleNavigate} className="outline-none block">
            <div
              className={[
                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all duration-150 relative group',
                isSettingsActive
                  ? `border ${TONES.primary.active} text-white font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]`
                  : 'border border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04] font-medium',
              ].join(' ')}
            >
              <Settings
                size={17}
                className={isSettingsActive ? TONES.primary.icon : `text-zinc-400 ${TONES.primary.hoverIcon} transition-colors`}
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

      {/* Footer Collapse Toggle — desktop rail only; the drawer below `lg` always shows full labels */}
      <div className="hidden lg:flex p-2 items-center justify-center">
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
    </>
  );
};
