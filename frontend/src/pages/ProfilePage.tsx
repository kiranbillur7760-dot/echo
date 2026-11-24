import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { SkillProfile } from '../types';
import { User, Shield, Award, CheckCircle2, Clock } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const [skills, setSkills] = useState<SkillProfile[]>([]);

  useEffect(() => {
    api.getSkills().then(setSkills).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#00D9FF]/15">
        <h1 className="text-2xl font-bold font-display text-white">ANALYST & CADET PROFILE</h1>
        <p className="text-xs text-[#9FB2CA] mt-1">
          Identity, verified engineering badges, and historical submission portfolio.
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-8 rounded-2xl glass-panel border border-[#00D9FF]/20 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#00D9FF] to-[#167BFF] p-1 shadow-glow-cyan">
          <div className="w-full h-full rounded-2xl bg-[#061222] flex items-center justify-center text-[#00D9FF]">
            <User className="w-10 h-10" />
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h2 className="text-2xl font-bold font-display text-white">Cadet Elena Chen</h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30 font-semibold">
              ACTIVE CADET
            </span>
          </div>

          <p className="text-xs text-[#00D9FF] font-mono mb-2">
            Specialization: Aerospace Thermal Protection & Structural Mechanics
          </p>
          <p className="text-xs text-[#9FB2CA] max-w-2xl leading-relaxed">
            Preserving tacit flight heuristics and applying structural thermodynamics to hypersonic entry problems under Dr. Alex Morgan's curriculum.
          </p>
        </div>
      </div>

      {/* Verified Skills */}
      <div className="space-y-4">
        <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-[#00D9FF]" />
          VERIFIED SYSTEM COMPETENCIES ({skills.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <div key={skill.id} className="p-5 rounded-2xl glass-panel border border-[#00D9FF]/20">
              <span className="text-[10px] font-mono text-[#00D9FF] uppercase">{skill.category}</span>
              <h4 className="text-sm font-bold text-white mt-1 mb-2">{skill.skill_name}</h4>
              <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5">
                <span className="text-[#00E6A0] font-mono uppercase">{skill.mastery_level}</span>
                <span className="text-white font-mono font-bold">{skill.score_points} pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
