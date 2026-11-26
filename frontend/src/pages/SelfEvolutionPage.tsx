import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, CheckCircle, XCircle, Clock, Zap, TrendingUp, Loader2, ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { api } from '../services/api';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { cls: string; label: string }> = {
    pending:  { cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',  label: 'PENDING' },
    approved: { cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', label: 'APPROVED' },
    rejected: { cls: 'bg-red-500/20 text-red-400 border-red-500/40',          label: 'REJECTED' },
    applied:  { cls: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',        label: 'APPLIED' },
  };
  const s = map[status] ?? map.pending;
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${s.cls}`}>{s.label}</span>;
};

const BenchmarkBar: React.FC<{ baseline: number; projected: number }> = ({ baseline, projected }) => {
  const gain = ((projected - baseline) * 100).toFixed(0);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-mono text-[#9FB2CA] mb-1">
        <span>Baseline {Math.round(baseline * 100)}%</span>
        <span className="text-emerald-400">+{gain}pp projected</span>
        <span>Target {Math.round(projected * 100)}%</span>
      </div>
      <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
        <div className="absolute left-0 top-0 h-full bg-[#9FB2CA]/40 rounded-full" style={{ width: `${baseline * 100}%` }} />
        <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#00D9FF] to-[#00E6A0] rounded-full opacity-70" style={{ width: `${projected * 100}%` }} />
        <div className="absolute top-0 bottom-0 w-0.5 bg-white/60" style={{ left: `${baseline * 100}%` }} />
      </div>
    </div>
  );
};

export const SelfEvolutionPage: React.FC = () => {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [reviewData, setReviewData] = useState({ reviewer_name: '', reviewer_notes: '' });

  const [form, setForm] = useState({
    weakness_identified: '',
    evidence: '',
    proposed_change: '',
    expected_impact: '',
    baseline_benchmark: '',
    projected_benchmark: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (api as any).getEvolutionProposals().then(setProposals).finally(() => setLoading(false));
  }, []);

  const submitProposal = async () => {
    if (!form.weakness_identified.trim() || !form.proposed_change.trim()) return;
    setSubmitting(true);
    try {
      const rec = await (api as any).createEvolutionProposal({
        ...form,
        baseline_benchmark: parseFloat(form.baseline_benchmark) || 0.5,
        projected_benchmark: parseFloat(form.projected_benchmark) || 0.7,
      });
      setProposals((prev) => [rec, ...prev]);
      setShowForm(false);
      setForm({ weakness_identified: '', evidence: '', proposed_change: '', expected_impact: '', baseline_benchmark: '', projected_benchmark: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const submitReview = async (id: number, approved: boolean) => {
    setSubmitting(true);
    try {
      const updated = await (api as any).reviewProposal(id, approved, reviewData.reviewer_name || 'Human Reviewer', reviewData.reviewer_notes);
      setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated, status: approved ? 'approved' : 'rejected' } : p)));
      setReviewing(null);
      setReviewData({ reviewer_name: '', reviewer_notes: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    total: proposals.length,
    pending:  proposals.filter((p) => p.status === 'pending').length,
    approved: proposals.filter((p) => p.status === 'approved').length,
    applied:  proposals.filter((p) => p.status === 'applied').length,
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E6A0]/20 to-[#167BFF]/20 flex items-center justify-center border border-[#00E6A0]/30">
              <GitBranch className="w-5 h-5 text-[#00E6A0]" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white tracking-wide">Self-Evolution</h1>
              <p className="text-xs font-mono text-[#00E6A0] tracking-widest uppercase">Controlled Improvement Engine</p>
            </div>
          </div>
          <p className="text-sm text-[#9FB2CA] max-w-2xl">
            ECHO identifies its own weaknesses and proposes targeted improvements. Every proposal requires explicit
            human approval before it can be applied — no autonomous self-modification.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00E6A0] to-[#167BFF] text-[#020713] font-bold text-xs rounded-xl hover:opacity-90 transition font-mono uppercase tracking-wider"
        >
          <Plus className="w-3.5 h-3.5" /> Propose Improvement
        </button>
      </div>

      {/* Human Gate Notice */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
        <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-300/80 leading-relaxed">
          <span className="font-bold text-blue-300">Human Approval Gate Active.</span> ECHO cannot apply any change to itself without an explicit human review decision.
          Proposals are purely advisory — the system cannot self-modify code, database schemas, or model weights autonomously.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Proposals', value: stats.total, color: '#00D9FF' },
          { label: 'Pending Review', value: stats.pending, color: '#F59E0B' },
          { label: 'Approved', value: stats.approved, color: '#00E6A0' },
          { label: 'Applied', value: stats.applied, color: '#925CFF' },
        ].map((s) => (
          <div key={s.label} className="bg-[#061222]/80 border border-white/5 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] font-mono text-[#9FB2CA] uppercase tracking-wider mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Proposal Form */}
      {showForm && (
        <div className="bg-[#061222]/80 border border-[#00E6A0]/20 rounded-2xl p-6 space-y-4">
          <div className="text-sm font-mono text-[#00E6A0] uppercase tracking-widest font-bold">New Improvement Proposal</div>
          {[
            { label: 'Weakness Identified', key: 'weakness_identified', placeholder: 'What specific weakness or limitation was identified?', rows: 2 },
            { label: 'Evidence', key: 'evidence', placeholder: 'What data or observations support this weakness?', rows: 2 },
            { label: 'Proposed Change', key: 'proposed_change', placeholder: 'What change is proposed to address this weakness?', rows: 3 },
            { label: 'Expected Impact', key: 'expected_impact', placeholder: 'What measurable improvement is expected?', rows: 2 },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-[10px] font-mono text-[#9FB2CA] uppercase tracking-wider block mb-1.5">{f.label}</label>
              <textarea
                className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-[#9FB2CA]/50 focus:outline-none focus:border-[#00E6A0]/50 font-mono resize-none"
                rows={f.rows}
                placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={(e) => setForm((d) => ({ ...d, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Baseline Benchmark (0–1)', key: 'baseline_benchmark', placeholder: 'e.g. 0.72' },
              { label: 'Projected Benchmark (0–1)', key: 'projected_benchmark', placeholder: 'e.g. 0.88' },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-[10px] font-mono text-[#9FB2CA] uppercase tracking-wider block mb-1.5">{f.label}</label>
                <input
                  type="number" min="0" max="1" step="0.01"
                  className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-[#9FB2CA]/50 focus:outline-none focus:border-[#00E6A0]/50 font-mono"
                  placeholder={f.placeholder}
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm((d) => ({ ...d, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-mono text-[#9FB2CA] hover:text-white border border-white/10 rounded-xl transition">Cancel</button>
            <button onClick={submitProposal} disabled={submitting} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#00E6A0] to-[#167BFF] text-[#020713] font-bold text-xs rounded-xl hover:opacity-90 transition disabled:opacity-40 font-mono uppercase tracking-wider">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
              Submit Proposal
            </button>
          </div>
        </div>
      )}

      {/* Proposal List */}
      <div className="space-y-3">
        <div className="text-xs font-mono text-[#9FB2CA] uppercase tracking-widest font-bold px-1">Proposals ({proposals.length})</div>
        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 text-[#00D9FF] animate-spin" /></div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-16 text-[#9FB2CA]">
            <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No proposals yet. Click "Propose Improvement" to begin.</p>
          </div>
        ) : (
          proposals.map((p) => (
            <div key={p.id} className="bg-[#061222]/80 border border-white/5 hover:border-[#00E6A0]/20 rounded-2xl transition-all">
              <button className="w-full flex items-center justify-between p-5 text-left" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {p.is_synthetic_demo && <span className="text-[10px] font-mono text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-1.5 py-0.5 rounded">SYNTHETIC</span>}
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-sm text-white font-medium">{p.weakness_identified}</p>
                  <p className="text-xs text-[#9FB2CA] mt-0.5">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center hidden md:block">
                    <div className="text-sm font-bold font-mono text-[#9FB2CA]">{Math.round(p.baseline_benchmark * 100)}%</div>
                    <div className="text-[10px] font-mono text-[#9FB2CA]">Baseline</div>
                  </div>
                  <div className="text-center hidden md:block">
                    <div className="text-sm font-bold font-mono text-emerald-400">{Math.round(p.projected_benchmark * 100)}%</div>
                    <div className="text-[10px] font-mono text-[#9FB2CA]">Target</div>
                  </div>
                  {expanded === p.id ? <ChevronDown className="w-4 h-4 text-[#9FB2CA]" /> : <ChevronRight className="w-4 h-4 text-[#9FB2CA]" />}
                </div>
              </button>

              {expanded === p.id && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-5">
                  {/* Benchmark visual */}
                  <BenchmarkBar baseline={p.baseline_benchmark} projected={p.projected_benchmark} />

                  {/* Detail fields */}
                  {[
                    { label: 'Evidence', value: p.evidence, color: 'text-yellow-400' },
                    { label: 'Proposed Change', value: p.proposed_change, color: 'text-cyan-400' },
                    { label: 'Expected Impact', value: p.expected_impact, color: 'text-emerald-400' },
                  ].map((f) => (
                    <div key={f.label}>
                      <div className={`text-[10px] font-mono uppercase tracking-wider mb-1 ${f.color}`}>{f.label}</div>
                      <p className="text-xs text-[#9FB2CA] leading-relaxed">{f.value}</p>
                    </div>
                  ))}

                  {/* Reviewer info if reviewed */}
                  {p.reviewer_name && (
                    <div className="bg-white/5 rounded-xl p-3 space-y-1">
                      <div className="text-[10px] font-mono text-[#9FB2CA] uppercase tracking-wider">Review Decision</div>
                      <p className="text-xs text-white"><span className="text-[#9FB2CA]">Reviewer:</span> {p.reviewer_name}</p>
                      {p.reviewer_notes && <p className="text-xs text-[#9FB2CA]">{p.reviewer_notes}</p>}
                      {p.reviewed_at && <p className="text-[10px] font-mono text-[#9FB2CA]">{new Date(p.reviewed_at).toLocaleString()}</p>}
                    </div>
                  )}

                  {/* Review controls — only for pending */}
                  {p.status === 'pending' && (
                    <>
                      {reviewing === p.id ? (
                        <div className="bg-[#020713]/60 border border-white/10 rounded-xl p-4 space-y-3">
                          <div className="text-xs font-mono text-[#9FB2CA] uppercase tracking-wider font-bold">Human Review Decision</div>
                          <input
                            className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#9FB2CA]/50 focus:outline-none focus:border-[#00D9FF]/50 font-mono"
                            placeholder="Reviewer name (optional)"
                            value={reviewData.reviewer_name}
                            onChange={(e) => setReviewData((d) => ({ ...d, reviewer_name: e.target.value }))}
                          />
                          <textarea
                            className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#9FB2CA]/50 focus:outline-none focus:border-[#00D9FF]/50 font-mono resize-none"
                            rows={2}
                            placeholder="Review notes (optional)"
                            value={reviewData.reviewer_notes}
                            onChange={(e) => setReviewData((d) => ({ ...d, reviewer_notes: e.target.value }))}
                          />
                          <div className="flex gap-3">
                            <button onClick={() => submitReview(p.id, true)} disabled={submitting} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold uppercase transition disabled:opacity-40">
                              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve
                            </button>
                            <button onClick={() => submitReview(p.id, false)} disabled={submitting} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-mono font-bold uppercase transition disabled:opacity-40">
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                            <button onClick={() => setReviewing(null)} className="px-4 py-2 text-xs font-mono text-[#9FB2CA] hover:text-white border border-white/10 rounded-xl transition">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setReviewing(p.id)} className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-mono font-bold uppercase transition">
                          <Clock className="w-3.5 h-3.5" /> Review This Proposal
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
