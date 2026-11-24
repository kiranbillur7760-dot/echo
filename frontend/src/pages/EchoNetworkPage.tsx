import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { NetworkOverview, MultiExpertComparison } from '../types';
import {
  Globe,
  Building2,
  ShieldCheck,
  Scale,
  Users,
  Lock,
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';

export const EchoNetworkPage: React.FC = () => {
  const [network, setNetwork] = useState<NetworkOverview | null>(null);
  const [comparison, setComparison] = useState<MultiExpertComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [netRes, compRes] = await Promise.all([
          api.getNetworkOverview(),
          api.compareExperts(1, 2),
        ]);
        setNetwork(netRes);
        setComparison(compRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center font-mono text-[#00D9FF]">
        Connecting to Federated ECHO Network...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#00D9FF]/15">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">
            ECHO NETWORK & FEDERATED HUBS
          </h1>
          <p className="text-xs text-[#9FB2CA] mt-1">
            Permission-based organizational partitions, multi-expert comparisons, and collective human intelligence discovery.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#00D9FF]">
          <Globe className="w-4 h-4" />
          <span>FEDERATION MESH ONLINE</span>
        </div>
      </div>

      {/* SECTION 1: MULTI-EXPERT DISAGREEMENT & COMPARISON (PART 2 - SYSTEM 6) */}
      {comparison && (
        <div className="p-6 md:p-8 rounded-2xl glass-panel border border-[#00D9FF]/30 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
            <div>
              <span className="text-[10px] font-mono text-[#00D9FF] uppercase tracking-wider font-bold">
                COLLECTIVE INTELLIGENCE ENGINE • EXPERT COMPARISON
              </span>
              <h2 className="text-xl font-bold font-display text-white mt-0.5">
                CROSS-EXPERT METHODOLOGY & TRADE-OFF COMPARISON
              </h2>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-mono bg-[#925CFF]/15 text-[#925CFF] border border-[#925CFF]/30 font-semibold self-start sm:self-auto">
              SYNTHETIC MULTI-EXPERT STUDY
            </span>
          </div>

          {/* Expert Side-by-Side Profile Headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expert A */}
            <div className="p-5 rounded-2xl bg-[#00D9FF]/10 border border-[#00D9FF]/30 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00D9FF]/20 flex items-center justify-center font-bold text-[#00D9FF]">
                  AM
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{comparison.expert_a.name}</h3>
                  <p className="text-xs text-[#00D9FF]">{comparison.expert_a.title}</p>
                </div>
              </div>

              <div className="text-xs space-y-2 text-[#9FB2CA]">
                <p><strong>Core Philosophy:</strong> {comparison.expert_a.philosophy}</p>
                <p><strong>Risk Profile:</strong> {comparison.expert_a.risk_profile}</p>
                <div className="p-2.5 rounded-lg bg-[#020713]/80 border border-white/5 font-mono text-[11px] text-[#00D9FF]">
                  "{comparison.expert_a.key_heuristic}"
                </div>
              </div>
            </div>

            {/* Expert B */}
            <div className="p-5 rounded-2xl bg-[#925CFF]/10 border border-[#925CFF]/30 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#925CFF]/20 flex items-center justify-center font-bold text-[#925CFF]">
                  SL
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{comparison.expert_b.name}</h3>
                  <p className="text-xs text-[#925CFF]">{comparison.expert_b.title}</p>
                </div>
              </div>

              <div className="text-xs space-y-2 text-[#9FB2CA]">
                <p><strong>Core Philosophy:</strong> {comparison.expert_b.philosophy}</p>
                <p><strong>Risk Profile:</strong> {comparison.expert_b.risk_profile}</p>
                <div className="p-2.5 rounded-lg bg-[#020713]/80 border border-white/5 font-mono text-[11px] text-[#925CFF]">
                  "{comparison.expert_b.key_heuristic}"
                </div>
              </div>
            </div>
          </div>

          {/* Comparative Dimensions Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono text-[#00D9FF] uppercase tracking-wider">
              Divergence & Synthesis Matrix
            </h4>

            <div className="space-y-3">
              {comparison.comparative_dimensions.map((dim, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl glass-panel border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs items-center"
                >
                  <div className="font-mono text-[#00D9FF] font-semibold">{dim.dimension}</div>
                  <div className="text-white">
                    <span className="text-[10px] text-[#9FB2CA] block font-mono">Dr. Alex Morgan</span>
                    {dim.expert_a}
                  </div>
                  <div className="text-white">
                    <span className="text-[10px] text-[#9FB2CA] block font-mono">Dr. Sarah Lin</span>
                    {dim.expert_b}
                  </div>
                  <div className="text-[#9FB2CA] text-[11px] bg-white/5 p-2 rounded-lg">
                    {dim.synthesis}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collective Consensus Statement */}
          <div className="p-4 rounded-xl bg-[#00E6A0]/10 border border-[#00E6A0]/30 text-xs text-white leading-relaxed">
            <span className="font-mono text-[10px] text-[#00E6A0] uppercase font-bold block mb-1">
              Cross-Expert Collective Consensus
            </span>
            {comparison.collective_consensus}
          </div>
        </div>
      )}

      {/* SECTION 2: FEDERATED ORGANIZATIONS & ACCESS PARTITIONS */}
      <div className="space-y-4">
        <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#167BFF]" />
          FEDERATED ORGANIZATIONS & ENTERPRISE PARTITIONS ({network?.federated_organizations.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {network?.federated_organizations.map((org) => (
            <div key={org.id} className="p-6 rounded-2xl glass-panel border border-[#167BFF]/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#167BFF]/15 text-[#167BFF] font-semibold">
                  {org.code}
                </span>
                <span className="text-[11px] font-mono text-[#00E6A0] uppercase">
                  {org.security_tier.replace(/_/g, ' ')}
                </span>
              </div>

              <h4 className="text-base font-bold text-white">{org.name}</h4>
              <p className="text-xs text-[#9FB2CA] leading-relaxed">{org.description}</p>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-[#9FB2CA]">
                <span>Domain: {org.domain}</span>
                <span className="text-[#00D9FF]">{org.expert_count} Active Specialists</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: PERMISSION MODELS */}
      <div className="p-6 rounded-2xl glass-panel border border-white/5 space-y-3">
        <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#00E6A0]" />
          PERMISSION & CONSENT-BASED SHARING PROTOCOL
        </h3>
        <p className="text-xs text-[#9FB2CA] leading-relaxed">
          PROJECT ECHO enforces zero automatic publication of private or proprietary records. Cross-organization discovery requires cryptographic sign-off by the contributing expert.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {network?.permission_models.map((tier, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-[#020713]/80 border border-white/5 text-xs">
              <span className="text-[10px] font-mono text-[#00D9FF] uppercase block">{tier.label}</span>
              <span className="text-white font-semibold mt-1 block">{tier.access}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
