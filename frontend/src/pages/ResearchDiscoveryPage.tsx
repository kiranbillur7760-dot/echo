import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Sparkles, 
  GitBranch, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  FlaskConical, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  RefreshCw,
  Search,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import { ResearchHypothesis } from '../types';

export const ResearchDiscoveryPage: React.FC = () => {
  const [researchQuestion, setResearchQuestion] = useState('');
  const [targetDomains, setTargetDomains] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [activeHypothesis, setActiveHypothesis] = useState<ResearchHypothesis | null>(null);
  const [hypothesesList, setHypothesesList] = useState<ResearchHypothesis[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [validationEvidence, setValidationEvidence] = useState('');
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadHypotheses();
  }, [filterStatus]);

  const loadHypotheses = async () => {
    try {
      const res = await api.getResearchHypotheses(filterStatus || undefined);
      if (res && res.hypotheses) {
        setHypothesesList(res.hypotheses);
        if (!activeHypothesis && res.hypotheses.length > 0) {
          setActiveHypothesis(res.hypotheses[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load hypotheses', err);
    }
  };

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!researchQuestion.trim()) return;

    setIsDiscovering(true);
    setNotification(null);
    try {
      const domains = targetDomains.split(',').map(d => d.trim()).filter(Boolean);
      const res = await api.discoverResearch(researchQuestion, domains.length > 0 ? domains : undefined);
      if (res.success && res.hypothesis) {
        setActiveHypothesis(res.hypothesis);
        setNotification({ type: 'success', message: 'Autonomous research discovery successfully synthesized cross-domain hypotheses!' });
        loadHypotheses();
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Discovery engine encountered an error' });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleValidate = async (hypothesisId: string, status: 'validated' | 'refuted' | 'testing') => {
    if (!validationEvidence.trim()) {
      alert('Please provide empirical validation evidence or experiment results.');
      return;
    }
    try {
      const delta = status === 'validated' ? 0.2 : status === 'refuted' ? -0.4 : 0.05;
      const res = await api.validateHypothesis(hypothesisId, status, validationEvidence, delta);
      if (res.success) {
        setActiveHypothesis(res.hypothesis);
        setValidatingId(null);
        setValidationEvidence('');
        setNotification({
          type: 'success',
          message: status === 'validated' 
            ? 'Hypothesis empirically validated and automatically promoted to Global Knowledge repository!' 
            : `Hypothesis status updated to ${status}.`
        });
        loadHypotheses();
      }
    } catch (err: any) {
      alert(err.message || 'Validation failed');
    }
  };

  const presetQueries = [
    {
      title: "Biofilm Eradication & Acoustic Cavitation",
      q: "Can high-frequency acoustic cavitation synergize with pulsed magnetic fields to disrupt medical device biofilms without damaging host tissue?",
      domains: "biomedical_engineering, acoustics, clinical_microbiology"
    },
    {
      title: "Neuromorphic AI & Quantum Sensing",
      q: "How can spike-timing-dependent plasticity (STDP) in neuromorphic chips filter ambient decoherence noise in diamond nitrogen-vacancy quantum sensors?",
      domains: "quantum_physics, neuromorphic_computing, signal_processing"
    },
    {
      title: "Solid-State Battery Dendrite Suppression",
      q: "Can biologically inspired self-healing polymers at the solid electrolyte interface prevent lithium dendrite penetration at ultra-fast charging rates?",
      domains: "materials_science, electrochemistry, biomimetic_polymers"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              <Compass className="w-3.5 h-3.5" />
              Engine 5: Autonomous Research & Discovery
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Research & Discovery Lab</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Uncover uncharted knowledge gaps, form cross-disciplinary analogies, detect conflicting evidence, and synthesize testable hypotheses with strict empirical provenance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadHypotheses()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Hypotheses
            </button>
          </div>
        </div>

        {notification && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            notification.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}>
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Discovery Input Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <form onSubmit={handleDiscover} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Open Research Inquiry / Phenomenon to Investigate
              </label>
              <textarea
                value={researchQuestion}
                onChange={(e) => setResearchQuestion(e.target.value)}
                placeholder="e.g., Can acoustic cavitation disrupt bacterial biofilms at non-destructive energy thresholds?"
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Target Cross-Domains (Optional, comma-separated)
                </label>
                <input
                  type="text"
                  value={targetDomains}
                  onChange={(e) => setTargetDomains(e.target.value)}
                  placeholder="e.g., acoustics, biomedical, nanomaterials"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="w-full sm:w-auto flex items-center justify-end gap-3 pt-4 sm:pt-0">
                <button
                  type="submit"
                  disabled={isDiscovering || !researchQuestion.trim()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-950/40 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isDiscovering ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Synthesizing Engines...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Discover & Formulate Hypotheses
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="pt-2">
              <div className="text-xs text-slate-500 mb-2">Try benchmark discovery inquiries:</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {presetQueries.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setResearchQuestion(preset.q);
                      setTargetDomains(preset.domains);
                    }}
                    className="text-left p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    <div className="font-semibold text-emerald-400 mb-0.5">{preset.title}</div>
                    <div className="line-clamp-2 text-slate-400">{preset.q}</div>
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Two-Column Explorer & Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Hypotheses Repository List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Tracked Hypotheses ({hypothesesList.length})
              </h2>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="proposed">Proposed</option>
                <option value="testing">Testing</option>
                <option value="validated">Validated</option>
                <option value="refuted">Refuted</option>
              </select>
            </div>

            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {hypothesesList.length === 0 ? (
                <div className="p-6 rounded-xl border border-slate-800/80 bg-slate-900/40 text-center text-slate-500 text-xs">
                  No hypotheses tracked yet. Submit an inquiry above to generate your first research hypothesis.
                </div>
              ) : (
                hypothesesList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveHypothesis(item)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      activeHypothesis?.id === item.id
                        ? 'bg-slate-900 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                        : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'validated'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : item.status === 'testing'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : item.status === 'refuted'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Conf: {(item.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-200 line-clamp-2 mb-2">
                      {item.hypothesis_statement || item.research_question}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {item.primary_domains?.slice(0, 3).map((dom, dIdx) => (
                        <span key={dIdx} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">
                          {dom}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Detailed Hypothesis Inspector & Validation Workflow */}
          <div className="lg:col-span-8">
            {activeHypothesis ? (
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
                {/* Header & Status */}
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                  <div>
                    <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Hypothesis ID: {activeHypothesis.id.slice(0, 16)}...
                    </div>
                    <div className="text-xs text-slate-400">
                      Formulated: {new Date(activeHypothesis.created_at).toLocaleString()} • Engine: {activeHypothesis.generated_by_engine}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      activeHypothesis.status === 'validated'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : activeHypothesis.status === 'testing'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : activeHypothesis.status === 'refuted'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}>
                      Status: {activeHypothesis.status}
                    </span>
                    {activeHypothesis.promoted_to_knowledge_id && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        Promoted to Global Knowledge
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Hypothesis Statement */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                    Formal Hypothesis Statement
                  </div>
                  <div className="text-base font-semibold text-white leading-relaxed">
                    "{activeHypothesis.hypothesis_statement}"
                  </div>
                  {activeHypothesis.mechanism_of_action && (
                    <div className="mt-3 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                      <span className="font-semibold text-slate-400">Proposed Mechanism: </span>
                      {activeHypothesis.mechanism_of_action}
                    </div>
                  )}
                </div>

                {/* Cross-Domain Analogies & Links */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-teal-400" />
                    Cross-Disciplinary Analogical Bridges
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeHypothesis.cross_domain_links?.map((link, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
                        <div className="flex items-center gap-2 text-xs font-semibold text-teal-300 mb-1">
                          <span>{link.source_domain}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span>{link.target_domain}</span>
                        </div>
                        <div className="text-xs font-medium text-slate-200 mb-1">{link.concept}</div>
                        <div className="text-xs text-slate-400">{link.analogical_link}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Knowledge Gaps & Conflicting Findings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Identified Knowledge Gaps
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {activeHypothesis.knowledge_gaps?.map((gap, gIdx) => (
                        <li key={gIdx} className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Contradictions & Tension Points
                    </h3>
                    {activeHypothesis.conflicting_findings?.length ? (
                      activeHypothesis.conflicting_findings.map((cf, cIdx) => (
                        <div key={cIdx} className="text-xs text-slate-300 space-y-1">
                          <div className="font-semibold text-slate-200">{cf.topic}</div>
                          <div className="text-slate-400">vs: {cf.perspective_b}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500">No fundamental paradoxes detected. Evidence aligns.</div>
                    )}
                  </div>
                </div>

                {/* Experimental Protocols */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-emerald-400" />
                    Proposed Validation Experiments & Protocols
                  </h3>
                  <div className="space-y-3">
                    {activeHypothesis.proposed_experiments?.map((exp, eIdx) => (
                      <div key={eIdx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="text-xs font-bold text-slate-200">{exp.title}</div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            {exp.experiment_id}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mb-3 leading-relaxed">{exp.methodology}</div>
                        <div className="flex flex-wrap gap-2 text-[10px]">
                          {exp.key_metrics?.map((m, mIdx) => (
                            <span key={mIdx} className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/20">
                              Metric: {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validation Actions */}
                <div className="border-t border-slate-800 pt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Empirical Verification & Validation Gate
                  </h3>

                  {validatingId === activeHypothesis.id ? (
                    <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3">
                      <label className="block text-xs font-semibold text-slate-200">
                        Empirical Proof / Laboratory Evidence Citation
                      </label>
                      <textarea
                        value={validationEvidence}
                        onChange={(e) => setValidationEvidence(e.target.value)}
                        placeholder="Detail the experimental results, p-values, peer citations or physical benchmark data supporting your conclusion..."
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setValidatingId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleValidate(activeHypothesis.id, 'refuted')}
                          className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-medium"
                        >
                          Mark Refuted
                        </button>
                        <button
                          type="button"
                          onClick={() => handleValidate(activeHypothesis.id, 'testing')}
                          className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-xs font-medium"
                        >
                          Mark In-Testing
                        </button>
                        <button
                          type="button"
                          onClick={() => handleValidate(activeHypothesis.id, 'validated')}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                        >
                          Validate & Promote to Knowledge
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">
                        Ready to attach laboratory evidence or experimental results to transition this hypothesis?
                      </p>
                      <button
                        onClick={() => {
                          setValidatingId(activeHypothesis.id);
                          setValidationEvidence('');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Record Validation Result
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-slate-800 text-center bg-slate-900/20">
                <Compass className="w-12 h-12 text-slate-700 mb-3" />
                <h3 className="text-base font-semibold text-slate-300">No Hypothesis Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Submit a research inquiry to autonomously synthesize new hypotheses, or select one from the left sidebar to inspect and validate.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
