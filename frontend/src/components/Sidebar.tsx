import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  Users,
  Cpu,
  Sparkles,
  Clock,
  Compass,
  MessageSquare,
  Network,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();

  // The 5 Primary Core Modules for Hackathon Transformation
  const primaryNavigation = [
    { step: 1, name: 'Overview', to: '/', icon: Activity, badge: null },
    { step: 2, name: 'Experts & Knowledge', to: '/experts', icon: Users, badge: null },
    { step: 3, name: 'Decision DNA', to: '/decisions', icon: Cpu, badge: null },
    { step: 4, name: 'Council of Experts', to: '/council', icon: Sparkles, badge: 'Sig 1' },
    { step: 5, name: 'Decision Time Machine', to: '/time-machine', icon: Clock, badge: 'Sig 2' },
  ];

  // Secondary connected analysis tools
  const secondaryNavigation = [
    { name: 'Knowledge Graph', to: '/graph', icon: Network },
    { name: 'Experience Simulation', to: '/simulation', icon: Compass },
    { name: 'Ask ECHO', to: '/ask-echo', icon: MessageSquare },
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
          {/* Animated Holographic Core Ring Icon */}
          <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[#00D9FF]/40 animate-spin-slow" />
            <div className="absolute inset-1 rounded-full border border-[#167BFF]/60 animate-pulse-slow" />
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#00D9FF] to-[#925CFF] shadow-glow-cyan" />
          </div>

          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display font-extrabold tracking-wider text-base text-white flex items-center gap-1.5">
                PROJECT ECHO
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#00D9FF] uppercase">
                HUMAN INTEL PLATFORM
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

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        <div className="px-2 pb-2 text-[10px] font-mono tracking-wider text-[#00D9FF]/70 uppercase">
          {!collapsed ? 'Primary Modules' : '•••'}
        </div>

        {primaryNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

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
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono w-3.5 text-center ${isActive ? 'text-[#00D9FF] font-bold' : 'text-[#9FB2CA]/50'}`}>
                  {item.step}
                </span>
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#00D9FF]' : 'text-[#9FB2CA]'}`} />
              </div>
              {!collapsed && <span className="truncate">{item.name}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                  {item.badge}
                </span>
              )}
              {!collapsed && isActive && !item.badge && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00D9FF] shadow-glow-cyan" />
              )}
            </NavLink>
          );
        })}

        {/* Secondary Connected Tools */}
        <div className="pt-4 px-2 pb-2 text-[10px] font-mono tracking-wider text-slate-500 uppercase">
          {!collapsed ? 'Connected Systems' : '•••'}
        </div>

        {secondaryNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

          return (
            <NavLink
              key={item.name}
              to={item.to}
              title={collapsed ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-800/80 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Footer System Status Banner */}
      {!collapsed ? (
        <div className="p-3 m-3 rounded-xl bg-[#020713]/80 border border-[#00D9FF]/20 text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00E6A0] animate-ping" />
            <span className="font-mono text-[11px] text-[#00E6A0] font-semibold">4 DOMAIN AUTHORITIES</span>
          </div>
          <p className="text-[11px] text-[#9FB2CA] leading-tight">
            Aerospace • Life Support • Radiation • Logistics
          </p>
        </div>
      ) : (
        <div className="p-3 flex justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00E6A0] shadow-glow-green" title="Demo Mode Active" />
        </div>
      )}
    </aside>
  );
};
