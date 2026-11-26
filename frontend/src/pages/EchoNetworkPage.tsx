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
  Sparkles,
  Search,
  CheckCircle2,
  GitMerge,
  Send,
  Database,
  ExternalLink,
} from 'lucide-react';

interface CrossExpertResult {
  query: string;
  experts_matched: number;
  per_expert: Array<{
    expert_id: number;
    expert_name: string;
    domain: string;
    relevance_score: number;
    findings: string[];
  }>;
  agreements: string[];
  disagreements: string[];
  synthesis: string;
  citations: Array<{
    expert_name: string;
    source_type: string;
    title: string;
    status: string;
    snippet: string;
  }>;
}

export const EchoNetworkPage: React.FC = () => {
  const [network, setNetwork] = useState<NetworkOverview | null>(null);
  const [comparison, setComparison] = useState<MultiExpertComparison | null>(null);
  const [loading, setLoading] = useState(true);

  // Connected Human Intelligence State
  const [crossQuery, setCrossQuery] = useState('');
  const [crossLoading, setCrossLoading] = useState(false);
  const [crossResult, setCrossResult] = useState<CrossExpertResult | null>(null);

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

  const handleCrossExpertSubmit = async (queryToRun: string) => {
    if (!queryToRun.trim() || crossLoading) return;
    setCrossLoading(true);
    try {
      const res = await api.crossExpertQuery(queryToRun.trim());
      setCrossResult(res);
    } catch (err) {
      console.error('Failed to run cross-expert query:', err);
    } finally {
      setCrossLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center font-mono text-[#00D9FF]">
        Connecting to Federated ECHO Collective Intelligence Network...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#00D9FF]/15">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">
            CONNECTED HUMAN INTELLIGENCE NETWORK
          </h1>
          <p className="text-xs text-[#9FB2CA] mt-1">
            Synthesize collective human experience across disciplines, discover expert relationships, and analyze points of consensus and divergence.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#00D9FF]">
          <Globe className="w-4 h-4" />
          <span>FEDERATION MESH ONLINE</span>
        </div>
      </div>

      {/* SECTION 1: CONNECTED HUMAN INTELLIGENCE MULTI-EXPERT RETRIEVAL */}
      <div className="p-6 md:p-8 rounded-2xl glass-panel border border-[#00D9FF]/30 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <span className="text-[10px] font-mono text-[#00D9FF] uppercase tracking-wider font-bold flex items-center gap-1.5">
              <GitMerge className="w-4 h-4" />
              SECTION 8: CONNECTED HUMAN INTELLIGENCE ENGINE
            </span>
            <h2 className="text-xl font-bold font-display text-white mt-0.5">
              CROSS-EXPERT KNOWLEDGE DISCOVERY & SYNTHESIS
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30 font-semibold self-start sm:self-auto">
            MULTI-EXPERT REASONING
          </span>
        </div>

        <p className="text-xs text-[#9FB2CA] leading-relaxed">
          Ask a complex engineering or mission problem. PROJECT ECHO retrieves relevant knowledge across multiple domain specialists, identifies how their approaches align or conflict, and builds an evidence-backed unified analysis.
        </p>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCrossExpertSubmit(crossQuery);
          }}
          className="space-y-3"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={crossQuery}
              onChange={(e) => setCrossQuery(e.target.value)}
              placeholder="E.g., How do we balance thermal protection mass with structural damping during hypersonic atmospheric re-entry?"
              className="flex-1 bg-[#020713] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00D9FF]"
            />
            <button
              type="submit"
              disabled={crossLoading || !crossQuery.trim()}
              className="px-6 py-3 rounded-xl btn-cyber-primary text-xs uppercase tracking-wider font-bold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{crossLoading ? 'Synthesizing...' : 'Query Across Experts'}</span>
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            <span className="font-mono text-[#9FB2CA]">Sample Prompts:</span>
            <button
              type="button"
              onClick={() => {
                const q = "How do we balance thermal protection mass with structural damping during hypersonic atmospheric re-entry?";
                setCrossQuery(q);
                handleCrossExpertSubmit(q);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-[#00D9FF] cursor-pointer"
            >
              TPS Mass vs Aero-acoustic Damping
            </button>
            <button
              type="button"
              onClick={() => {
                const q = "What tradeoffs exist between closed-loop life support biomass and transit vehicle propellant mass?";
                setCrossQuery(q);
                handleCrossExpertSubmit(q);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-[#00D9FF] cursor-pointer"
            >
              Life Support Biomass vs Delta-V
            </button>
          </div>
        </form>

        {/* Cross Expert Synthesis Result Card */}
        {crossResult && (
          <div className="space-y-4 pt-2 border-t border-white/10 animate-fade-in">
            {/* Synthesis Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#00D9FF]/15 via-[#925CFF]/15 to-[#061222] border border-[#00D9FF]/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#00D9FF] uppercase font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  COMBINED MULTI-EXPERT PERSPECTIVE ({crossResult.experts_matched} EXPERTS CONSULTED)
                </span>
                <span className="text-[10px] font-mono text-cyan-300">
                  {crossResult.citations.length} Verified Evidence Links
                </span>
              </div>
              <p className="text-xs text-white leading-relaxed font-medium whitespace-pre-line">
                {crossResult.synthesis}
              </p>
            </div>

            {/* Individual Expert Perspectives */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {crossResult.per_expert.map((pe) => (
                <div
                  key={pe.expert_id}
                  className="p-4 rounded-xl bg-[#020713]/80 border border-white/10 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white">{pe.expert_name}</h4>
                      <p className="text-[11px] text-cyan-400 font-mono">{pe.domain}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      Score: {pe.relevance_score.toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {pe.findings.map((f, fidx) => (
                      <p key={fidx} className="text-slate-300 text-[11px] leading-relaxed pl-2 border-l-2 border-[#00D9FF]/40">
                        {f}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Agreements & Disagreements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Cross-Expert Agreements
                </span>
                <ul className="text-xs text-slate-200 space-y-1 list-disc pl-4">
                  {crossResult.agreements.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-rose-300 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" />
                  Priority Divergences & Trade-Offs
                </span>
                <ul className="text-xs text-slate-200 space-y-1 list-disc pl-4">
                  {crossResult.disagreements.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Citations Grounding */}
            {crossResult.citations.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#00D9FF]" />
                  Retrieved Knowledge Units & Decision DNA Citations
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {crossResult.citations.map((c, cidx) => (
                    <div key={cidx} className="p-2.5 rounded-lg bg-[#020713] border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-cyan-400 font-bold">{c.expert_name}</span>
                        <span className="text-emerald-400 uppercase">{c.status}</span>
                      </div>
                      <p className="font-semibold text-white truncate">{c.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{c.snippet}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: MULTI-EXPERT DISAGREEMENT & COMPARISON (Static Baseline Comparison) */}
      {comparison && (
        <div className="p-6 md:p-8 rounded-2xl glass-panel border border-[#00D9FF]/30 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
            <div>
              <span className="text-[10px] font-mono text-[#00D9FF] uppercase tracking-wider font-bold">
                COLLECTIVE INTELLIGENCE ENGINE • EXPERT COMPARISON MATRIX
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
                    <span className="text-[10px] text-[#9FB2CA] block font-mono">Director Sarah Lin</span>
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

      {/* SECTION 3: FEDERATED ORGANIZATIONS & ACCESS PARTITIONS */}
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

      {/* SECTION 4: PERMISSION MODELS */}
      <div className="p-6 rounded-2xl glass-panel border border-white/5 space-y-3">
        <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#00E6A0]" />
          PERMISSION & CONSENT-BASED SHARING PROTOCOL
        </h3>
        <p className="text-xs text-[#9FB2CA] leading-relaxed">
          PROJECT ECHO enforces zero automatic publication of private or proprietary records. Cross-organization discovery requires explicit cryptographic consent by the contributing expert.
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
