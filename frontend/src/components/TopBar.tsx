import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Shield, CheckCircle2, AlertTriangle, User } from 'lucide-react';
import { api } from '../services/api';

interface TopBarProps {
  collapsed: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      const ok = await api.checkHealth();
      if (isMounted) setBackendOnline(ok);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const pageTitle =
    pathSegments.length === 0
      ? 'Overview'
      : pathSegments[0]
          .replace('-', ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/knowledge?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 flex items-center justify-between px-6 bg-[#061222]/85 backdrop-blur-xl border-b border-[#00D9FF]/15 transition-all duration-300 ${
        collapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Title & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <h1 className="text-base md:text-lg font-bold font-display tracking-wide text-white">
          {pageTitle}
        </h1>
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#9FB2CA]">
          <span>/</span>
          <Link to="/" className="hover:text-[#00D9FF] transition">
            ECHO
          </Link>
          {pathSegments.map((segment, idx) => (
            <React.Fragment key={idx}>
              <span>/</span>
              <span className="text-[#00D9FF] uppercase tracking-wider">{segment}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Center Global Search */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-72 lg:w-96">
        <Search className="w-4 h-4 absolute left-3.5 text-[#9FB2CA]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Global search intelligence, decisions, evidence..."
          className="w-full bg-[#07182B]/80 border border-[#00D9FF]/20 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-[#9FB2CA]/60 focus:outline-none focus:border-[#00D9FF] focus:shadow-glow-cyan transition"
        />
      </form>

      {/* Right Controls & Profile */}
      <div className="flex items-center gap-4">
        {/* Backend Connection Indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#07182B] border border-white/5 text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              backendOnline === true
                ? 'bg-[#00E6A0] shadow-glow-green animate-pulse'
                : backendOnline === false
                ? 'bg-red-500'
                : 'bg-amber-400'
            }`}
          />
          <span className="text-[11px] text-[#9FB2CA] hidden sm:inline">
            {backendOnline === true ? 'BACKEND ONLINE' : backendOnline === false ? 'OFFLINE' : 'CONNECTING...'}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-[#9FB2CA] hover:text-[#00D9FF] hover:bg-white/5 transition relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00D9FF] shadow-glow-cyan" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl glass-panel border border-[#00D9FF]/30 p-4 shadow-2xl z-50 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-[#00D9FF]/10 mb-3">
                <span className="text-xs font-mono text-[#00D9FF] uppercase tracking-wider font-semibold">
                  System Feed
                </span>
                <span className="text-[10px] text-[#9FB2CA]">Recent</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <p className="text-white font-medium">Dr. Alex Morgan Decision DNA Reconstructed</p>
                  <p className="text-[11px] text-[#9FB2CA] mt-0.5">3D C/SiC leading-edge material architecture</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <p className="text-white font-medium">Challenge Evaluation Ready</p>
                  <p className="text-[11px] text-[#9FB2CA] mt-0.5">Cadet Elena Chen scored 94.5/100 (Proficient)</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-3 pl-2 border-l border-[#00D9FF]/15">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00D9FF] to-[#167BFF] p-0.5">
            <div className="w-full h-full rounded-full bg-[#061222] flex items-center justify-center text-[#00D9FF]">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-white leading-tight">Cadet Elena Chen</span>
            <span className="text-[10px] font-mono text-[#00D9FF]">Aerospace Systems</span>
          </div>
        </div>
      </div>
    </header>
  );
};
