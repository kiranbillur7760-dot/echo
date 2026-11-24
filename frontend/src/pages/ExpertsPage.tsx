import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Expert } from '../types';
import { Users, Plus, ShieldCheck, ChevronRight, Award, Briefcase, Search, Sparkles } from 'lucide-react';

export const ExpertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Expert Form State
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [domain, setDomain] = useState('Aerospace Engineering');
  const [bio, setBio] = useState('');

  const loadExperts = async () => {
    try {
      const res = await api.getExperts();
      setExperts(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperts();
  }, []);

  const handleCreateExpert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !title || !organization || !bio) return;

    try {
      await api.createExpert({
        name,
        title,
        organization,
        domain,
        bio,
        years_experience: 15,
        verification_status: 'verified',
        is_synthetic_demo: false,
      });
      setShowCreateModal(false);
      setName('');
      setTitle('');
      setOrganization('');
      setBio('');
      loadExperts();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredExperts = experts.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.domain.toLowerCase().includes(search.toLowerCase()) ||
      e.organization.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#00D9FF]/15">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">EXPERT INTELLIGENCE ROSTER</h1>
          <p className="text-xs text-[#9FB2CA] mt-1">
            Preserved human expertise repositories with verified decision histories and domain heuristics.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl btn-cyber-primary flex items-center gap-2 text-xs uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          Onboard Expert
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#9FB2CA]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by expert name, domain, or organization..."
            className="w-full bg-[#07182B] border border-[#00D9FF]/20 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#9FB2CA]/60 focus:outline-none focus:border-[#00D9FF]"
          />
        </div>
        <span className="text-xs font-mono text-[#00D9FF]">
          {filteredExperts.length} Profile(s) Active
        </span>
      </div>

      {/* Experts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExperts.map((exp) => (
          <div
            key={exp.id}
            onClick={() => navigate(`/experts/${exp.id}`)}
            className="p-6 rounded-2xl glass-panel glass-panel-hover cursor-pointer flex flex-col justify-between relative overflow-hidden"
          >
            {exp.is_synthetic_demo && (
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-mono bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                SYNTHETIC DEMO
              </div>
            )}

            <div>
              <div className="flex items-center gap-3.5 mb-4">
                <img
                  src={
                    exp.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                  }
                  alt={exp.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#00D9FF]/40 shadow-glow-cyan"
                />
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#00D9FF] transition">
                    {exp.name}
                  </h3>
                  <p className="text-xs text-[#00D9FF] font-medium leading-tight mt-0.5">
                    {exp.title}
                  </p>
                  <p className="text-[11px] text-[#9FB2CA]">{exp.organization}</p>
                </div>
              </div>

              <p className="text-xs text-[#9FB2CA] line-clamp-3 leading-relaxed mb-4">
                {exp.bio}
              </p>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#00E6A0]">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-mono text-[11px] uppercase">{exp.verification_status}</span>
              </div>

              <div className="flex items-center gap-1 text-[#00D9FF] font-medium">
                <span>View DNA</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Onboard Expert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl glass-panel border border-[#00D9FF]/30 p-6 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-lg font-bold font-display text-white mb-1">
              ONBOARD EXPERT INTELLIGENCE PROFILE
            </h2>
            <p className="text-xs text-[#9FB2CA] mb-5">
              Establish a new verified repository of tacit human knowledge.
            </p>

            <form onSubmit={handleCreateExpert} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#00D9FF] block mb-1">Expert Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Alex Morgan"
                  className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-[#00D9FF] block mb-1">Professional Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Distinguished Fellow"
                    className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-[#00D9FF] block mb-1">Domain</label>
                  <input
                    type="text"
                    required
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. Aerospace Engineering"
                    className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-[#00D9FF] block mb-1">Organization / Directorate</label>
                <input
                  type="text"
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Aerothermal Spaceflight Directorate"
                  className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#00D9FF] block mb-1">Executive Biography & Provenance</label>
                <textarea
                  required
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Summarize core technical experience, career trajectory, and major achievements..."
                  className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#9FB2CA] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl btn-cyber-primary text-xs uppercase tracking-wider font-bold"
                >
                  Preserve Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
