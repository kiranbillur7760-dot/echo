import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { EvolutionRadar, EvolutionConflict } from '../types';
import {
  RefreshCw,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight,
  TrendingDown,
  Sparkles,
  FileCheck
} from 'lucide-react';

export const KnowledgeEvolutionPage: React.FC = () => {
  const [radar, setRadar] = useState<EvolutionRadar | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeConflict, setActiveConflict] = useState<EvolutionConflict | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const loadRadar = async () => {
    try {
      const res = await api.getEvolutionRadar();
      setRadar(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRadar();
  }, []);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConflict || !resolutionNotes.trim()) return;

    setResolving(true);
    try {
      await api.resolveConflict(activeConflict.id, resolutionNotes);
      setActiveConflict(null);
      setResolutionNotes('');
      loadRadar();
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center font-mono text-[#00D9FF]">
        Calibrating Knowledge Evolution Radar...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#00D9FF]/15">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">
            KNOWLEDGE EVOLUTION & DECAY RADAR
          </h1>
          <p className="text-xs text-[#9FB2CA] mt-1">
            Detect conflicting claims, monitor aging heuristics, track superseded methods, and maintain human verification audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#00E6A0]">
          <span className="w-2 h-2 rounded-full bg-[#00E6A0] animate-ping" />
          <span>RADAR HEALTH INDEX: {radar?.summary.radar_health_score}%</span>
        </div>
      </div>

      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Conflicts Detected', val: radar?.summary.total_conflicts_detected ?? 0, color: '#F59E0B' },
          { label: 'Unresolved Conflicts', val: radar?.summary.unresolved_conflicts ?? 0, color: '#EC4899' },
          { label: 'Superseded Heuristics', val: radar?.summary.superseded_heuristics_count ?? 0, color: '#00D9FF' },
          { label: 'Active Verifications', val: radar?.summary.active_verifications_count ?? 0, color: '#00E6A0' },
        ].map((card, i) => (
          <div key={i} className="p-5 rounded-2xl glass-panel border border-white/5">
            <span className="text-[10px] font-mono text-[#9FB2CA] uppercase block mb-1">
              {card.label}
            </span>
            <div className="text-2xl font-mono font-bold" style={{ color: card.color }}>
              {card.val}
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 1: KNOWLEDGE CONFLICT DETECTOR */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
            ACTIVE KNOWLEDGE CONFLICTS ({radar?.conflicts.length})
          </h3>
          <span className="text-xs font-mono text-[#F59E0B]">HEURISTIC DIVERGENCE MONITOR</span>
        </div>

        <div className="space-y-4">
          {radar?.conflicts.map((conf) => (
            <div
              key={conf.id}
              className="p-6 rounded-2xl glass-panel border border-[#F59E0B]/30 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#F59E0B]/15 text-[#F59E0B] font-semibold">
                    {conf.conflict_type.replace('_', ' ')} • Severity: {conf.severity.toUpperCase()}
                  </span>
                  <h4 className="text-base font-bold text-white mt-1.5">{conf.title}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-mono font-semibold ${
                      conf.resolution_status === 'resolved'
                        ? 'bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30'
                        : 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                    }`}
                  >
                    {conf.resolution_status.toUpperCase()}
                  </span>
                  {conf.resolution_status !== 'resolved' && (
                    <button
                      onClick={() => setActiveConflict(conf)}
                      className="px-3 py-1 rounded-lg text-xs font-mono bg-[#00D9FF]/20 text-[#00D9FF] hover:bg-[#00D9FF]/30 transition"
                    >
                      Resolve Conflict
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-[#9FB2CA] leading-relaxed">{conf.description}</p>

              {/* Opposing Claims Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <span className="font-mono text-[10px] text-[#00D9FF] uppercase font-semibold block">
                    Claim A: Static Baseline Protocol
                  </span>
                  <p className="text-white leading-relaxed">{conf.expert_claim_a}</p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <span className="font-mono text-[10px] text-[#00E6A0] uppercase font-semibold block">
                    Claim B: Flight Telemetry & Arc-Jet Precedent
                  </span>
                  <p className="text-white leading-relaxed">{conf.expert_claim_b}</p>
                </div>
              </div>

              {conf.resolution_notes && (
                <div className="p-3.5 rounded-xl bg-[#00E6A0]/10 border border-[#00E6A0]/25 text-xs text-[#00E6A0]">
                  <strong>Resolution Synthesis:</strong> {conf.resolution_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: KNOWLEDGE DECAY & SUPERSEDED METHODS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[#00D9FF]" />
            SUPERSEDED KNOWLEDGE & DECAY TRACKING ({radar?.superseded_updates.length})
          </h3>
          <span className="text-xs font-mono text-[#00D9FF]">HISTORICAL OBSOLESCENCE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {radar?.superseded_updates.map((update) => (
            <div key={update.id} className="p-5 rounded-2xl glass-panel border border-[#00D9FF]/20 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#00D9FF]/10 text-[#00D9FF]">
                  Status: {update.decay_indicator.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono text-[#9FB2CA]">Record #{update.record_id}</span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-red-400 uppercase block mb-0.5">
                  Obsolescent Previous Heuristic:
                </span>
                <p className="text-[#9FB2CA] leading-relaxed line-through">{update.previous_content}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#00E6A0] uppercase block mb-0.5">
                  Superseding Flight-Validated Standard:
                </span>
                <p className="text-white font-medium leading-relaxed">{update.updated_content}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-white/5 text-[11px] text-[#9FB2CA]">
                <strong>Reason for Evolution:</strong> {update.reason_for_update}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: HUMAN VERIFICATION AUDIT TRAIL */}
      <div className="space-y-4">
        <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-[#00E6A0]" />
          HUMAN EXPERT VERIFICATION AUDIT LOGS ({radar?.recent_verifications.length})
        </h3>

        <div className="space-y-2">
          {radar?.recent_verifications.map((v) => (
            <div
              key={v.id}
              className="p-4 rounded-xl glass-panel border border-[#00E6A0]/15 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#00E6A0] flex-shrink-0" />
                <div>
                  <span className="font-mono text-[#00D9FF] text-[11px]">
                    Record #{v.record_id} • Verified by Expert #{v.verified_by_expert_id} (Dr. Alex Morgan)
                  </span>
                  <p className="text-white mt-0.5">{v.verification_notes}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#00E6A0] uppercase">{v.verification_status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conflict Resolution Modal */}
      {activeConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl glass-panel border border-[#00D9FF]/40 p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold font-display text-white mb-1">
              RECONCILE KNOWLEDGE CONTRADICTION
            </h3>
            <p className="text-xs text-[#9FB2CA] mb-4">{activeConflict.title}</p>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#00D9FF] block mb-1">
                  Expert Reconciliation Notes & Operating Domain Boundary
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Explain why both claims can be reconciled, or specify boundary conditions (e.g. static soak vs dynamic aero-transient)..."
                  className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveConflict(null)}
                  className="px-4 py-2 rounded-xl text-xs text-[#9FB2CA] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 rounded-xl btn-cyber-primary text-xs uppercase tracking-wider font-bold"
                >
                  {resolving ? 'Recording...' : 'Commit Reconciliation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
