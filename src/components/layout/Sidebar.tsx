import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, FileText, Rocket,
  Timer, BarChart3, Settings, ChevronLeft, GraduationCap,
} from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',          icon: LayoutDashboard, label: 'Overview'  },
  { to: '/courses',   icon: BookOpen,        label: 'Courses'   },
  { to: '/notes',     icon: FileText,        label: 'Notes'     },
  { to: '/projects',  icon: Rocket,          label: 'Projects'  },
  { to: '/tracker',   icon: Timer,           label: 'Tracker'   },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics' },
  { to: '/settings',  icon: Settings,        label: 'Settings'  },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { profile, user } = useAuth();

  const brandName = profile?.name || profile?.username || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Bedo';

  return (
    <aside
      style={{ width: collapsed ? 64 : 210 }}
      className="h-full flex-shrink-0 bg-[#0A0D14] border-r border-white/[0.08] flex flex-col overflow-hidden relative z-10 transition-all duration-150 ease-out"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3.5 h-[56px] border-b border-white/[0.08] flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-accent-amber flex items-center justify-center flex-shrink-0 shadow-sm">
          <GraduationCap size={15} className="text-[#0D0F14]" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden whitespace-nowrap flex items-center">
            <span className="font-bold text-xs tracking-tight text-white max-w-[95px] truncate inline-block">
              {brandName}
            </span>
            <span className="font-bold text-xs tracking-tight text-accent-amber ml-1">
              Learn
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to);

          return (
            <NavLink key={to} to={to} className="outline-none">
              <div
                className={[
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors duration-100 relative group select-none',
                  isActive
                    ? 'bg-white/[0.08] text-white font-semibold shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] font-medium',
                ].join(' ')}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-accent-amber rounded-r" />
                )}
                <Icon size={16} className={isActive ? 'text-accent-amber' : 'text-zinc-400 group-hover:text-zinc-300'} />
                {!collapsed && (
                  <span className="truncate">{label}</span>
                )}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-[#161B26] text-white text-[11px] rounded-md border border-white/[0.12] shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {label}
                  </div>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-white/[0.08] p-2">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={15} className={`transition-transform duration-150 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </aside>
  );
};
