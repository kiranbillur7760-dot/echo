import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Sparkles,
  MessageSquare,
  Network,
  MessagesSquare,
  Settings,
  Cpu,
  Clock,
  Compass,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const [showResearchTools, setShowResearchTools] = useState(false);

  const primaryNavigation = [
    { name: 'Home', to: '/', icon: Home },
    { name: 'Discover Experts', to: '/experts', icon: Users },
    { name: 'Create Expert Intelligence', to: '/create-expert', icon: Sparkles },
    { name: 'Ask ECHO', to: '/ask-echo', icon: MessageSquare },
    { name: 'Knowledge Network', to: '/network', icon: Network },
    { name: 'Conversations', to: '/conversations', icon: MessagesSquare },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  const researchNavigation = [
    { name: 'Decision DNA', to: '/decisions', icon: Cpu },
    { name: 'Knowledge Graph', to: '/graph', icon: GitBranch },
    { name: 'Council of Experts', to: '/council', icon: Users },
    { name: 'Decision Time Machine', to: '/time-machine', icon: Clock },
    { name: 'Experience Simulation', to: '/simulation', icon: Compass },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col transition-all duration-300 ease-in-out bg-[#061222]/95 backdrop-blur-xl border-r border-[#00D9FF]/15 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header & Animated Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#00D9FF]/15">
        <NavLink to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[#00D9FF]/40 animate-spin-slow" />
            <div className="absolute inset-1 rounded-full border border-[#167BFF]/60 animate-pulse-slow" />
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#00D9FF] to-[#925CFF] shadow-glow-cyan" />
          </div>

          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display font-extrabold tracking-wider text-base text-white">
                PROJECT ECHO
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#00D9FF] uppercase">
                LIVING HUMAN INTEL
              </span>
            </div>
          )}
        </NavLink>

        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-[#9FB2CA] hover:text-[#00D9FF] hover:bg-white/5 transition"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main 7-Item Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        <div className="px-2 pb-2 text-[10px] font-mono tracking-wider text-[#00D9FF]/70 uppercase">
          {!collapsed ? 'Navigation' : '•••'}
        </div>

        {primaryNavigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.name}
              to={item.to}
              title={collapsed ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#00D9FF]/20 to-[#167BFF]/10 text-[#00D9FF] border border-[#00D9FF]/40 shadow-glow-cyan'
                  : 'text-[#9FB2CA] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#00D9FF]' : 'text-[#9FB2CA]'}`} />
              {!collapsed && <span className="truncate">{item.name}</span>}
              {!collapsed && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00D9FF] shadow-glow-cyan" />
              )}
            </NavLink>
          );
        })}

        {/* Collapsible Research Engines */}
        {!collapsed && (
          <div className="pt-4">
            <button
              type="button"
              onClick={() => setShowResearchTools((v) => !v)}
              className="w-full flex items-center justify-between px-2 pb-2 text-[10px] font-mono tracking-wider text-slate-400 hover:text-cyan-300 uppercase cursor-pointer"
            >
              <span>Research Modules</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showResearchTools ? 'rotate-180' : ''}`} />
            </button>

            {showResearchTools && (
              <div className="space-y-1">
                {researchNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.to}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-slate-800/80 text-white border border-slate-700'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Ethics Notice */}
      {!collapsed ? (
        <div className="p-3 m-3 rounded-xl bg-[#020713]/80 border border-[#00D9FF]/20 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00E6A0] animate-pulse" />
            <span className="font-mono text-[10px] text-[#00E6A0] font-semibold uppercase">Consent &amp; Provenance</span>
          </div>
          <p className="text-[11px] text-[#9FB2CA] leading-tight">
            Preserve Experience. Connect Knowledge. Empower Humanity.
          </p>
        </div>
      ) : (
        <div className="p-3 flex justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00E6A0]" title="ECHO Online" />
        </div>
      )}
    </aside>
  );
};
