import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HolographicCore } from '../components/HolographicCore';
import { FeatureHeader } from '../components/FeatureInfoModal';
import { api } from '../services/api';
import { OverviewDashboard } from '../types';
import {
  Users,
  BookOpen,
  Cpu,
  GraduationCap,
  ArrowRight,
  Shield,
  FileCheck,
  Sparkles,
  TrendingUp,
  Clock,
  Layers
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<OverviewDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getOverview();
        setData(res);
      } catch (err) {
        console.error('Failed to load overview data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Feature Explanation & Demo Stage Header */}
      <FeatureHeader featureKey="overview" />

      {/* A. Hero Section */}
      <section className="relative text-center pt-2 pb-6 overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/30 text-[#00D9FF] text-xs font-mono tracking-widest uppercase mb-4 shadow-glow-cyan">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] animate-ping" />
          HUMAN INTELLIGENCE PLATFORM
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-display tracking-tight text-white mb-3">
          PROJECT <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] via-[#167BFF] to-[#925CFF]">ECHO</span>
        </h1>

        <p className="text-sm md:text-base font-mono tracking-widest text-[#00D9FF] uppercase mb-4">
          THE FUTURE OF HUMAN KNOWLEDGE
        </p>

        <p className="max-w-2xl mx-auto text-sm md:text-base text-[#9FB2CA] font-light leading-relaxed mb-8">
          "Preserve human expertise. Reconstruct decisions. Transform knowledge into the intelligence of tomorrow."
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => navigate('/council')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/30 flex items-center gap-2 text-xs uppercase tracking-wider font-bold transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            SIGNATURE 1: COUNCIL OF EXPERTS
          </button>
          <button
            onClick={() => navigate('/time-machine')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/30 flex items-center gap-2 text-xs uppercase tracking-wider font-bold transition-all cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            SIGNATURE 2: DECISION TIME MACHINE
          </button>
          <button
            onClick={() => navigate('/experts')}
            className="px-5 py-3 rounded-xl btn-cyber-secondary flex items-center gap-2 text-xs uppercase tracking-wider font-semibold"
          >
            EXPERTS & KNOWLEDGE
            <ArrowRight className="w-4 h-4 text-[#00D9FF]" />
          </button>
        </div>
      </section>

      {/* B. Holographic Intelligence Core (Real interactive rendered canvas with 3 floating panels) */}
      <section className="relative">
        <HolographicCore />
      </section>

      {/* C. Intelligence Principles */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Secure & Private',
            desc: 'Expertise preserved under cryptographic provenance and strict authorization boundaries.',
            icon: Shield,
            color: '#00D9FF',
          },
          {
            title: 'Evidence Grounded',
            desc: 'Every heuristic links directly to empirical flight records, physical test runs, and telemetry.',
            icon: FileCheck,
            color: '#167BFF',
          },
          {
            title: 'AI Augmented',
            desc: 'Inferences explicitly separated from documented ground-truth facts to eliminate hallucination.',
            icon: Sparkles,
            color: '#925CFF',
          },
          {
            title: 'Continuously Evolving',
            desc: 'Transforms historical decision patterns into real-time student challenges and skill portfolios.',
            icon: TrendingUp,
            color: '#00E6A0',
          },
        ].map((principle, idx) => {
          const Icon = principle.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl glass-panel glass-panel-hover flex flex-col items-start"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5"
                style={{
                  backgroundColor: `${principle.color}15`,
                  border: `1px solid ${principle.color}35`,
                  color: principle.color,
                }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5">{principle.title}</h3>
              <p className="text-xs text-[#9FB2CA] leading-relaxed">{principle.desc}</p>
            </div>
          );
        })}
      </section>

      {/* D. Analytics Metric Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-display text-white tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00D9FF]" />
            PLATFORM ANALYTICS
          </h2>
          <span className="text-xs font-mono text-[#00D9FF]">SYNTHETIC SCENARIO VERIFIED</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Expert Profiles',
              val: data?.metrics.expert_profiles_count ?? 1,
              sub: 'Dr. Alex Morgan Active',
              icon: Users,
              color: '#00D9FF',
              link: '/experts',
            },
            {
              label: 'Knowledge Records',
              val: data?.metrics.knowledge_records_count ?? 2,
              sub: '100% Provenance Grounded',
              icon: BookOpen,
              color: '#167BFF',
              link: '/knowledge',
            },
            {
              label: 'Decisions Documented',
              val: data?.metrics.decisions_documented_count ?? 1,
              sub: '9-Point Decision DNA',
              icon: Cpu,
              color: '#925CFF',
              link: '/decisions',
            },
            {
              label: 'Case Studies',
              val: data?.metrics.case_studies_count ?? 1,
              sub: 'Hypersonic Re-entry Series',
              icon: GraduationCap,
              color: '#00E6A0',
              link: '/learning',
            },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(card.link)}
                className="p-5 rounded-2xl glass-panel glass-panel-hover cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-[#9FB2CA] uppercase tracking-wider">
                    {card.label}
                  </span>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: `${card.color}15`,
                      border: `1px solid ${card.color}35`,
                      color: card.color,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="text-3xl font-extrabold text-white font-mono tracking-tight mb-1">
                  {loading ? '...' : card.val}
                </div>

                <div className="text-[11px] text-[#9FB2CA] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: card.color }} />
                  {card.sub}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* E. Recent Activity & F. Intelligence Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Insight (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/20 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-[#00D9FF]/10 text-[#00D9FF] text-[10px] font-mono uppercase font-semibold">
                  Today's Featured Insight
                </span>
                <span className="text-xs text-[#9FB2CA]">• {data?.todays_insight.domain}</span>
              </div>
              <span className="text-xs font-mono text-[#00E6A0]">VERIFIED HEURISTIC</span>
            </div>

            <h3 className="text-lg font-bold text-white mb-2 leading-snug">
              {data?.todays_insight.title || 'Mitigating Interfacial Shear in High-Heat Fastener Assemblies'}
            </h3>

            <p className="text-xs text-[#9FB2CA] leading-relaxed mb-4">
              {data?.todays_insight.summary}
            </p>

            <blockquote className="p-4 rounded-xl bg-[#020713]/70 border-l-2 border-[#00D9FF] text-xs font-mono text-[#F4F8FF]/90 italic">
              "{data?.todays_insight.quote}"
              <span className="block not-italic text-[10px] text-[#00D9FF] mt-2 font-sans font-semibold">
                — {data?.todays_insight.expert}, Hypersonic Structures Directorate
              </span>
            </blockquote>
          </div>

          {/* Active Research & Top Expertise Areas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl glass-panel">
              <h4 className="text-xs font-mono text-[#00D9FF] uppercase tracking-wider mb-3">
                Active Research Programs
              </h4>
              <div className="space-y-3">
                {data?.active_research.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs pb-2 border-b border-white/5 last:border-0 last:pb-0">
                    <span className="text-white truncate pr-2">{item.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#167BFF]/15 text-[#167BFF] border border-[#167BFF]/30">
                      {item.trl}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl glass-panel">
              <h4 className="text-xs font-mono text-[#00D9FF] uppercase tracking-wider mb-3">
                Top Expertise Clusters
              </h4>
              <div className="space-y-2.5">
                {data?.top_expertise_areas.map((area, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-white truncate">{area.name}</span>
                    <span className="text-[11px] font-mono text-[#00E6A0]">{area.growth}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline (1 col) */}
        <div className="p-6 rounded-2xl glass-panel flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
            <h3 className="text-sm font-bold font-display text-white">RECENT PLATFORM EVENTS</h3>
            <Clock className="w-4 h-4 text-[#9FB2CA]" />
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto">
            {data?.recent_activities.map((act) => (
              <div key={act.id} className="relative pl-5 border-l border-[#00D9FF]/20 text-xs">
                <span className="absolute -left-1 top-1 w-2 h-2 rounded-full bg-[#00D9FF]" />
                <p className="text-white font-medium">{act.description}</p>
                <span className="text-[10px] font-mono text-[#9FB2CA] mt-1 block">
                  {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {act.action_type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connected 7-Stage Hackathon Demonstration Workflow */}
      <section className="mt-8 p-7 rounded-2xl glass-panel border border-[#00D9FF]/25 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#00E6A0] animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#00E6A0] uppercase">
                HACKATHON PRESENTATION ROADMAP
              </span>
            </div>
            <h3 className="text-lg font-bold font-display text-white">
              5-STAGE PRIMARY INTELLIGENCE DEMONSTRATION WORKFLOW
            </h3>
            <p className="text-xs text-[#9FB2CA] mt-0.5">
              Follow this deliberate sequence to demonstrate the entire lifecycle of preserved human knowledge.
            </p>
          </div>

          <button
            onClick={() => navigate('/council')}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 text-xs uppercase tracking-wider font-bold whitespace-nowrap self-start sm:self-auto shadow-md"
          >
            <span>Launch Council Deliberation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { step: 1, title: 'Overview', to: '/', desc: 'Mission telemetry & multi-expert radar', status: 'ACTIVE VIEW', color: '#00D9FF' },
            { step: 2, title: 'Experts & Knowledge', to: '/experts', desc: '4 verified senior practitioners', status: 'READY', color: '#167BFF' },
            { step: 3, title: 'Decision DNA', to: '/decisions', desc: '9-point causal reconstruction', status: 'READY', color: '#925CFF' },
            { step: 4, title: 'Council of Experts', to: '/council', desc: 'Multi-expert grand challenge deliberation', status: 'SIGNATURE 1', color: '#D946EF' },
            { step: 5, title: 'Decision Time Machine', to: '/time-machine', desc: 'Constraint stress test & branching', status: 'SIGNATURE 2', color: '#06B6D4' },
          ].map((item) => (
            <div
              key={item.step}
              onClick={() => navigate(item.to)}
              className="p-4 rounded-xl bg-[#020713]/80 border border-white/10 hover:border-[#00D9FF]/40 cursor-pointer transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px]" style={{ color: item.color, background: `${item.color}20`, border: `1px solid ${item.color}40` }}>
                    {item.step}
                  </span>
                  <span className="text-[9px] font-mono text-[#9FB2CA] uppercase">
                    {item.status}
                  </span>
                </div>
                <div className="text-xs font-bold text-white group-hover:text-[#00D9FF] transition-colors leading-tight mb-1">
                  {item.title}
                </div>
                <p className="text-[10px] text-[#9FB2CA] leading-snug">
                  {item.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#00D9FF]">
                <span>View Stage</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
