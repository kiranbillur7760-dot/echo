import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  Users,
  BookOpen,
  Cpu,
  Compass,
  MessageSquare,
  Network,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Overview', to: '/', icon: Activity },
    { name: 'Experts', to: '/experts', icon: Users },
    { name: 'Knowledge', to: '/knowledge', icon: BookOpen },
    { name: 'Decision Intelligence', to: '/decisions', icon: Cpu },
    { name: 'Knowledge Graph', to: '/graph', icon: Network },
    { name: 'Research Simulation', to: '/simulation', icon: Compass },
    { name: 'Learning Platform', to: '/learning', icon: ShieldCheck },
    { name: 'Ask ECHO', to: '/ask-echo', icon: MessageSquare },
    { name: 'Knowledge Evolution', to: '/evolution', icon: Activity },
    { name: 'ECHO Network', to: '/network', icon: Network },
  ];

  const secondaryNav = [
    { name: 'Profile', to: '/profile', icon: User },
    { name: 'Settings', to: '/settings', icon: Settings },
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
                HUMAN INTEL OS
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
        <div className="px-2 pb-2 text-[10px] font-mono tracking-wider text-[#9FB2CA]/70 uppercase">
          {!collapsed ? 'Intelligence Modules' : '•••'}
        </div>

        {navigation.map((item) => {
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
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#00D9FF]' : 'text-[#9FB2CA]'}`} />
              {!collapsed && <span className="truncate">{item.name}</span>}
              {!collapsed && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00D9FF] shadow-glow-cyan" />
              )}
            </NavLink>
          );
        })}

        <div className="pt-6 px-2 pb-2 text-[10px] font-mono tracking-wider text-[#9FB2CA]/70 uppercase">
          {!collapsed ? 'System' : '•••'}
        </div>

        {secondaryNav.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

          return (
            <NavLink
              key={item.name}
              to={item.to}
              title={collapsed ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#00D9FF]/15 text-[#00D9FF] border border-[#00D9FF]/30'
                  : 'text-[#9FB2CA] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Footer System Status Banner */}
      {!collapsed ? (
        <div className="p-3 m-3 rounded-xl bg-[#020713]/80 border border-[#00D9FF]/20 text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00E6A0] animate-ping" />
            <span className="font-mono text-[11px] text-[#00E6A0] font-semibold">SYNTHETIC DEMO ACTIVE</span>
          </div>
          <p className="text-[11px] text-[#9FB2CA] leading-tight">
            Dr. Alex Morgan • Aerospace Systems Architecture v1.0
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
