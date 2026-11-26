import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ExpertDetail } from '../types';
import {
  ShieldCheck,
  Award,
  Briefcase,
  ChevronRight,
  ArrowLeft,
  Cpu,
  Compass,
  FileText,
  Calendar,
  CheckCircle2,
  BookOpen,
  Network
} from 'lucide-react';
import { FeatureHeader } from '../components/FeatureInfoModal';

export const ExpertDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expert, setExpert] = useState<ExpertDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await api.getExpertDetail(Number(id));
        setExpert(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center font-mono text-[#00D9FF]">
        Retrieving Expert Intelligence Profile #{id}...
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="p-8 text-center text-red-400">
        Expert profile #{id} not found in the intelligence repository.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <FeatureHeader featureKey="experts" />

      {/* Top Back Nav */}
      <button
        onClick={() => navigate('/experts')}
        className="flex items-center gap-2 text-xs font-mono text-[#9FB2CA] hover:text-[#00D9FF] transition"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO ROSTER
      </button>

      {/* Header Profile Card */}
      <div className="p-8 rounded-2xl glass-panel border border-[#00D9FF]/20 relative overflow-hidden">
        {expert.is_synthetic_demo && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded text-xs font-mono bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-semibold">
            SYNTHETIC DEMONSTRATION RECORD
          </div>
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <img
            src={
              expert.avatar_url ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
            }
            alt={expert.name}
            className="w-24 h-24 rounded-2xl object-cover border-2 border-[#00D9FF] shadow-glow-cyan"
          />

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold font-display text-white">{expert.name}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                VERIFIED
              </span>
            </div>

            <p className="text-sm font-semibold text-[#00D9FF] mb-1">{expert.title}</p>
            <p className="text-xs text-[#9FB2CA]">{expert.organization} • {expert.domain} • {expert.years_experience} Years Experience</p>

            <p className="text-xs text-[#F4F8FF]/80 leading-relaxed mt-4 max-w-4xl">
              {expert.bio}
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-white/5">
          <button
            onClick={() => navigate('/knowledge')}
            className="px-5 py-2.5 rounded-xl btn-cyber-primary text-xs flex items-center gap-2 uppercase tracking-wider font-bold"
          >
            <BookOpen className="w-4 h-4" />
            Inspect Extracted Knowledge (Step 3)
          </button>
          <button
            onClick={() => navigate('/decisions')}
            className="px-5 py-2.5 rounded-xl btn-cyber-secondary text-xs flex items-center gap-2 uppercase tracking-wider font-semibold"
          >
            <Cpu className="w-4 h-4 text-[#00D9FF]" />
            Reconstruct Decision DNA (Step 4)
          </button>
          <button
            onClick={() => navigate('/graph')}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#9FB2CA] hover:text-white border border-white/10 text-xs flex items-center gap-2 uppercase tracking-wider font-semibold"
          >
            <Network className="w-4 h-4 text-[#00D9FF]" />
            View in Graph (Step 5)
          </button>
        </div>
      </div>

      {/* Grid: Core Competencies & Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Competencies */}
        <div className="p-6 rounded-2xl glass-panel">
          <h3 className="text-sm font-bold font-display text-white mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#00D9FF]" />
            CORE TECHNICAL COMPETENCIES
          </h3>

          <div className="flex flex-wrap gap-2">
            {(expert.profile?.core_competencies || [
              'Ceramic Matrix Composites (CMC)',
              'Hypersonic Aerothermodynamics',
              'Atmospheric Re-entry TPS Design',
              'Aero-acoustic Structural Damping',
              'Thermal Barrier Coatings',
            ]).map((comp, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-lg bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/30 text-xs font-mono"
              >
                {comp}
              </span>
            ))}
          </div>

          <h4 className="text-xs font-mono text-[#9FB2CA] uppercase tracking-wider mt-6 mb-3">
            Awards & Commendations
          </h4>
          <div className="space-y-2">
            {(expert.profile?.awards_recognitions || [
              'AIAA Aerospace Materials Excellence Medal (Synthetic, 2021)',
              'Orbital Flight Systems Engineering Laureate (Synthetic, 2018)',
            ]).map((award, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs text-white">
                <Award className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                <span>{award}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Career Trajectory Milestones */}
        <div className="p-6 rounded-2xl glass-panel">
          <h3 className="text-sm font-bold font-display text-white mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#167BFF]" />
            CAREER TRAJECTORY & PROVENANCE
          </h3>

          <div className="space-y-4">
            {(expert.profile?.career_milestones || [
              { year: '2004-2009', role: 'Senior Aerothermal Analyst', org: 'Orbital Flight Dynamics Group' },
              { year: '2010-2017', role: 'Chief Materials Architect', org: 'Hypersonic Re-entry Program Alpha' },
              { year: '2018-Present', role: 'Distinguished Fellow', org: 'Advanced Aerothermal Propulsion Directorate' },
            ]).map((m, idx) => (
              <div key={idx} className="relative pl-5 border-l border-[#167BFF]/30 text-xs">
                <span className="absolute -left-1 top-1 w-2 h-2 rounded-full bg-[#167BFF]" />
                <span className="font-mono text-[10px] text-[#00D9FF] uppercase">{m.year}</span>
                <p className="text-white font-semibold mt-0.5">{m.role}</p>
                <p className="text-[11px] text-[#9FB2CA]">{m.org}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Linked Projects */}
      <div className="space-y-4">
        <h3 className="text-base font-bold font-display text-white">
          PRESERVED FLIGHT & ENGINEERING PROGRAMS ({expert.projects.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expert.projects.map((proj) => (
            <div key={proj.id} className="p-5 rounded-2xl glass-panel border border-[#00D9FF]/15">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-[#167BFF]/15 text-[#167BFF] border border-[#167BFF]/30">
                  {proj.domain}
                </span>
                <span className="text-[11px] font-mono text-[#00E6A0] uppercase">{proj.status}</span>
              </div>

              <h4 className="text-sm font-bold text-white mb-1.5">{proj.title}</h4>
              <p className="text-xs text-[#9FB2CA] leading-relaxed mb-3">{proj.description}</p>
              <div className="text-[11px] font-mono text-[#00D9FF]">Role: {proj.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Linked Decisions */}
      <div className="space-y-4">
        <h3 className="text-base font-bold font-display text-white">
          RECONSTRUCTED DECISION DNA ({expert.decisions.length})
        </h3>

        <div className="space-y-3">
          {expert.decisions.map((dec) => (
            <div
              key={dec.id}
              onClick={() => navigate('/decisions')}
              className="p-5 rounded-2xl glass-panel glass-panel-hover cursor-pointer flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono text-[#925CFF] uppercase font-semibold">
                  Decision DNA #{dec.id} • {Math.round(dec.confidence * 100)}% Confidence
                </span>
                <h4 className="text-sm font-bold text-white mt-1">{dec.title}</h4>
                <p className="text-xs text-[#9FB2CA] mt-1">{dec.problem}</p>
              </div>

              <div className="flex items-center gap-1 text-xs text-[#00D9FF] font-medium ml-4">
                <span>Inspect DNA</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
