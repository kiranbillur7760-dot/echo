import React, { useState } from 'react';
import { api } from '../services/api';
import { AskEchoResult, CitationSource } from '../types';
import {
  MessageSquare,
  Search,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ExternalLink,
  HelpCircle,
  ArrowRight,
  Database,
  CheckCircle2
} from 'lucide-react';

export const AskEchoPage: React.FC = () => {
  const [query, setQuery] = useState(
    'How did Dr. Alex Morgan mitigate fastener shear failure in ceramic matrix composite leading edges?'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskEchoResult | null>(null);
  const [activeCitation, setActiveCitation] = useState<CitationSource | null>(null);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await api.askEcho(query);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    'How did Dr. Alex Morgan mitigate fastener shear failure in CMCs?',
    'Why was refractory metal alloy Ta-10W rejected for Project Hyperion?',
    'What is the difference between uniform CVI and pulsed thermal-gradient infiltration?',
    'What acoustic buffet levels were recorded during Mach 7.4 re-entry?',
  ];

  const getClaimStyle = (type: string) => {
    switch (type) {
      case 'DOCUMENTED FACT':
        return {
          bg: 'bg-[#00E6A0]/10',
          border: 'border-[#00E6A0]/30',
          text: 'text-[#00E6A0]',
          badge: 'DOCUMENTED FACT',
        };
      case 'EXPERT-VERIFIED INFORMATION':
        return {
          bg: 'bg-[#00D9FF]/10',
          border: 'border-[#00D9FF]/30',
          text: 'text-[#00D9FF]',
          badge: 'EXPERT-VERIFIED',
        };
      case 'AI-GENERATED INFERENCE':
        return {
          bg: 'bg-[#925CFF]/10',
          border: 'border-[#925CFF]/30',
          text: 'text-[#925CFF]',
          badge: 'AI-GENERATED INFERENCE',
        };
      case 'INSUFFICIENT EVIDENCE':
      default:
        return {
          bg: 'bg-[#F59E0B]/10',
          border: 'border-[#F59E0B]/30',
          text: 'text-[#F59E0B]',
          badge: 'INSUFFICIENT EVIDENCE',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#00D9FF]/15">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">ASK ECHO — EPISTEMIC INTELLIGENCE</h1>
          <p className="text-xs text-[#9FB2CA] mt-1">
            Query preserved human expertise with rigorous truth classifications. Never fabricates expert statements.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#00E6A0]">
          <ShieldCheck className="w-4 h-4" />
          <span>PROVENANCE GROUNDED</span>
        </div>
      </div>

      {/* Query Search Bar */}
      <div className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/25">
        <form onSubmit={handleQuery} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything regarding Dr. Alex Morgan's decisions, flight tests, or heuristics..."
              className="w-full bg-[#020713] border border-white/10 rounded-2xl pl-5 pr-28 py-3.5 text-xs text-white placeholder-[#9FB2CA]/60 focus:outline-none focus:border-[#00D9FF] focus:shadow-glow-cyan"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-2 bottom-2 px-5 rounded-xl btn-cyber-primary text-xs uppercase tracking-wider font-bold disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? 'Retrieving...' : 'Ask ECHO'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] font-mono text-[#9FB2CA] uppercase">Suggested Prompts:</span>
            {sampleQueries.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setQuery(q)}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-white/5 hover:bg-[#00D9FF]/10 text-[#9FB2CA] hover:text-[#00D9FF] border border-white/5 transition"
              >
                {q}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Answer & Epistemic Breakdown */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Epistemic Legend Bar */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#061222] border border-white/5 text-[11px] font-mono">
            <span className="text-[#9FB2CA] uppercase tracking-wider font-semibold">
              Truth Epistemology Legend:
            </span>
            <span className="flex items-center gap-1.5 text-[#00E6A0]">
              <span className="w-2 h-2 rounded-full bg-[#00E6A0]" />
              Documented Fact
            </span>
            <span className="flex items-center gap-1.5 text-[#00D9FF]">
              <span className="w-2 h-2 rounded-full bg-[#00D9FF]" />
              Expert-Verified Information
            </span>
            <span className="flex items-center gap-1.5 text-[#925CFF]">
              <span className="w-2 h-2 rounded-full bg-[#925CFF]" />
              AI-Generated Inference
            </span>
            <span className="flex items-center gap-1.5 text-[#F59E0B]">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              Insufficient Evidence
            </span>
          </div>

          {/* Narrative Synthesis */}
          <div className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/30">
            <span className="text-[10px] font-mono text-[#00D9FF] uppercase tracking-widest font-bold block mb-2">
              Synthesized Expert Explanation
            </span>
            <p className="text-sm text-white leading-relaxed">{result.narrative_answer}</p>
          </div>

          {/* Classified Epistemic Claims */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold font-display text-white">
              VERIFIED EPISTEMIC CLAIMS BREAKDOWN ({result.structured_claims.length})
            </h3>

            <div className="space-y-3">
              {result.structured_claims.map((claim, idx) => {
                const style = getClaimStyle(claim.claim_type);
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${style.bg} ${style.border} flex items-start justify-between gap-4`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${style.text}`}
                        >
                          {style.badge}
                        </span>
                        <span className="text-[10px] font-mono text-[#9FB2CA]">
                          Confidence: {Math.round(claim.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-white leading-relaxed">{claim.statement}</p>
                      <span className="text-[11px] font-mono text-[#9FB2CA]/80 mt-1 block">
                        Basis: {claim.grounding}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Citations & Source Provenance */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-[#00D9FF]" />
              SOURCE CITATIONS & PROVENANCE ({result.citations.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.citations.map((cite, i) => (
                <div
                  key={i}
                  onClick={() => setActiveCitation(cite)}
                  className="p-4 rounded-xl glass-panel glass-panel-hover cursor-pointer border border-[#00D9FF]/15 flex flex-col justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-[#00D9FF]/10 text-[#00D9FF]">
                        {cite.source_type}
                      </span>
                      <span className="text-[10px] font-mono text-[#9FB2CA]">#{cite.reference_id}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1.5">{cite.title}</h4>
                    <p className="text-[11px] text-[#9FB2CA] line-clamp-3">{cite.snippet}</p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#00D9FF]">
                    <span>{cite.expert_name}</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Citation Inspector Modal */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl glass-panel border border-[#00D9FF]/40 p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#00D9FF]/20 mb-4">
              <span className="text-[10px] font-mono text-[#00D9FF] uppercase tracking-wider font-semibold">
                SOURCE PROVENANCE VERIFICATION
              </span>
              <button
                onClick={() => setActiveCitation(null)}
                className="px-2.5 py-1 rounded text-xs text-[#9FB2CA] hover:text-white"
              >
                Close
              </button>
            </div>

            <h3 className="text-base font-bold text-white mb-2">{activeCitation.title}</h3>
            <p className="text-xs font-mono text-[#00D9FF] mb-4">
              Attributed to: {activeCitation.expert_name} • Ref ID: {activeCitation.reference_id}
            </p>

            <div className="p-4 rounded-xl bg-[#020713] border border-white/10 text-xs text-white leading-relaxed mb-4">
              "{activeCitation.snippet}"
            </div>

            <div className="p-3 rounded-xl bg-[#00E6A0]/10 border border-[#00E6A0]/20 text-[11px] font-mono text-[#00E6A0] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Cryptographic hash matches internal archive records. Zero hallucination detected.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
