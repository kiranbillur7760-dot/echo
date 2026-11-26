import React, { useState, useEffect } from 'react';
import { FlaskConical, CheckCircle, AlertTriangle, TrendingUp, Plus, Loader2, ChevronDown, ChevronRight, Activity } from 'lucide-react';
import { api } from '../services/api';

const ScoreBadge: React.FC<{ score: number; label: string }> = ({ score, label }) => {
  const pct = Math.round(score * 100);
  const color = pct >= 90 ? '#00E6A0' : pct >= 70 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16 mb-1">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ffffff08" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${pct} 100`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold font-mono" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="text-[10px] font-mono text-[#9FB2CA] uppercase tracking-wider text-center">{label}</div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    pass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    fail: 'bg-red-500/20 text-red-400 border-red-500/40',
    partial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase ${map[status] ?? map.partial}`}>{status}</span>;
};

export const SelfReflectionPage: React.FC = () => {
  const [reflections, setReflections] = useState<any[]>([]);
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ user_request: '', echo_response: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await (api as any).getReflections();
        setReflections(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const runAudit = async () => {
    setAuditLoading(true);
    try {
      const res = await (api as any).getSelfAudit();
      setAudit(res);
    } finally {
      setAuditLoading(false);
    }
  };

  const submitEval = async () => {
    if (!formData.user_request.trim() || !formData.echo_response.trim()) return;
    setSubmitting(true);
    try {
      const rec = await (api as any).evaluateInteraction(formData);
      setReflections((prev) => [rec, ...prev]);
      setShowForm(false);
      setFormData({ user_request: '', echo_response: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#925CFF]/20 to-[#167BFF]/20 flex items-center justify-center border border-[#925CFF]/30">
              <FlaskConical className="w-5 h-5 text-[#925CFF]" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white tracking-wide">Self-Reflection Lab</h1>
              <p className="text-xs font-mono text-[#925CFF] tracking-widest uppercase">Performance Evaluation Engine</p>
            </div>
          </div>
          <p className="text-sm text-[#9FB2CA] max-w-2xl">
            ECHO evaluates the quality of its own responses — measuring accuracy, grounding and epistemic honesty.
            Results are used to identify weaknesses and propose improvements.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runAudit}
            disabled={auditLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#925CFF]/20 hover:bg-[#925CFF]/30 text-[#925CFF] border border-[#925CFF]/30 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition disabled:opacity-40"
          >
            {auditLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
            Run Self-Audit
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00D9FF] to-[#167BFF] text-[#020713] font-bold text-xs rounded-xl hover:opacity-90 transition font-mono uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" /> Evaluate Interaction
          </button>
        </div>
      </div>

      {/* Audit Panel */}
      {audit && (
        <div className="bg-[#061222]/80 border border-[#925CFF]/20 rounded-2xl p-6">
          <div className="text-sm font-mono text-[#925CFF] uppercase tracking-widest font-bold mb-5 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Self-Audit Report — {new Date(audit.audit_timestamp).toLocaleTimeString()}
          </div>
          <div className="flex flex-wrap gap-8 justify-center mb-6">
            <ScoreBadge score={audit.avg_accuracy} label="Accuracy" />
            <ScoreBadge score={audit.avg_grounding} label="Grounding" />
            <ScoreBadge score={audit.avg_honesty} label="Honesty" />
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold font-mono text-[#00E6A0] mb-1">{audit.overall_health_score.toFixed(1)}</div>
              <div className="text-[10px] font-mono text-[#9FB2CA] uppercase tracking-wider">Health Score</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold font-mono text-[#00D9FF] mb-1">{Math.round(audit.pass_rate * 100)}%</div>
              <div className="text-[10px] font-mono text-[#9FB2CA] uppercase tracking-wider">Pass Rate</div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-2">Top Strengths</div>
              <ul className="space-y-1.5">
                {audit.top_strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#9FB2CA]">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" /> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] font-mono text-red-400 uppercase tracking-wider mb-2">Top Weaknesses</div>
              <ul className="space-y-1.5">
                {audit.top_weaknesses.map((w: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#9FB2CA]">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" /> {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Submit Form */}
      {showForm && (
        <div className="bg-[#061222]/80 border border-[#00D9FF]/20 rounded-2xl p-6 space-y-4">
          <div className="text-sm font-mono text-[#00D9FF] uppercase tracking-widest font-bold">Submit Interaction for Evaluation</div>
          <div>
            <label className="text-[10px] font-mono text-[#9FB2CA] uppercase tracking-wider block mb-2">User Request</label>
            <textarea
              className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-[#9FB2CA]/50 focus:outline-none focus:border-[#00D9FF]/50 font-mono resize-none"
              rows={2}
              placeholder="What question was asked?"
              value={formData.user_request}
              onChange={(e) => setFormData((d) => ({ ...d, user_request: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-[#9FB2CA] uppercase tracking-wider block mb-2">ECHO's Response</label>
            <textarea
              className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-[#9FB2CA]/50 focus:outline-none focus:border-[#00D9FF]/50 font-mono resize-none"
              rows={3}
              placeholder="What did ECHO respond?"
              value={formData.echo_response}
              onChange={(e) => setFormData((d) => ({ ...d, echo_response: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-mono text-[#9FB2CA] hover:text-white border border-white/10 rounded-xl transition">Cancel</button>
            <button onClick={submitEval} disabled={submitting} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#00D9FF] to-[#167BFF] text-[#020713] font-bold text-xs rounded-xl hover:opacity-90 transition disabled:opacity-40 font-mono uppercase tracking-wider">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
              Evaluate
            </button>
          </div>
        </div>
      )}

      {/* Records */}
      <div className="space-y-3">
        <div className="text-xs font-mono text-[#9FB2CA] uppercase tracking-widest font-bold px-1">
          Evaluated Interactions ({reflections.length})
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-[#00D9FF] animate-spin" />
          </div>
        ) : reflections.length === 0 ? (
          <div className="text-center py-16 text-[#9FB2CA]">
            <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No evaluations yet. Submit an interaction above.</p>
          </div>
        ) : (
          reflections.map((rec) => (
            <div key={rec.id} className="bg-[#061222]/80 border border-white/5 hover:border-[#925CFF]/20 rounded-2xl transition-all">
              <button className="w-full flex items-center justify-between p-5 text-left" onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}>
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    {rec.is_synthetic_demo && <span className="text-[10px] font-mono text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-1.5 py-0.5 rounded">SYNTHETIC</span>}
                    <StatusBadge status={rec.test_status} />
                  </div>
                  <p className="text-sm text-white font-medium truncate">{rec.user_request}</p>
                  <p className="text-xs text-[#9FB2CA] mt-0.5">{new Date(rec.evaluated_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-sm font-bold font-mono text-[#00D9FF]">{Math.round(rec.accuracy_score * 100)}%</div>
                    <div className="text-[10px] font-mono text-[#9FB2CA]">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold font-mono text-[#925CFF]">{Math.round(rec.grounding_score * 100)}%</div>
                    <div className="text-[10px] font-mono text-[#9FB2CA]">Grounding</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold font-mono text-[#00E6A0]">{Math.round(rec.honesty_score * 100)}%</div>
                    <div className="text-[10px] font-mono text-[#9FB2CA]">Honesty</div>
                  </div>
                  {expanded === rec.id ? <ChevronDown className="w-4 h-4 text-[#9FB2CA]" /> : <ChevronRight className="w-4 h-4 text-[#9FB2CA]" />}
                </div>
              </button>
              {expanded === rec.id && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-4">
                  <div>
                    <div className="text-[10px] font-mono text-[#9FB2CA] uppercase tracking-wider mb-1">ECHO Response</div>
                    <p className="text-xs text-[#E8F4FD] leading-relaxed">{rec.echo_response}</p>
                  </div>
                  {rec.identified_limitations?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono text-red-400 uppercase tracking-wider mb-1.5">Identified Limitations</div>
                      <ul className="space-y-1">
                        {rec.identified_limitations.map((l: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-[#9FB2CA]"><AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" /> {l}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {rec.improvement_suggestions?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-1.5">Improvement Suggestions</div>
                      <ul className="space-y-1">
                        {rec.improvement_suggestions.map((s: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-[#9FB2CA]"><TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" /> {s}</li>
                        ))}
                      </ul>
                    </div>
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
