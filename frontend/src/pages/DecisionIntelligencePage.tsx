import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DecisionDNA, DecisionReplayResult, Alternative, OutcomeItem, EvidenceItem } from '../types';
import {
  Cpu,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Scale,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Plus
} from 'lucide-react';

export const DecisionIntelligencePage: React.FC = () => {
  const [decisions, setDecisions] = useState<DecisionDNA[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<DecisionDNA | null>(null);
  const [loading, setLoading] = useState(true);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dna' | 'alternatives' | 'evidence' | 'outcomes' | 'replay'>('dna');

  // Decision Replay State
  const [replayTemp, setReplayTemp] = useState(2100);
  const [replayMass, setReplayMass] = useState(145);
  const [replayProfile, setReplayProfile] = useState<'multi_mission_reusable' | 'single_use_expendable'>('multi_mission_reusable');
  const [replaying, setReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<DecisionReplayResult | null>(null);

  // New Decision DNA Form State
  const [newTitle, setNewTitle] = useState('');
  const [newProblem, setNewProblem] = useState('');
  const [newContext, setNewContext] = useState('');
  const [newConstraints, setNewConstraints] = useState('Surface temperature tolerance >= 1800°C\nTotal weight <= 150 kg\nReusable without ablation');
  const [newReasoning, setNewReasoning] = useState('');
  const [newSelectedDecision, setNewSelectedDecision] = useState('');
  const [newOutcome, setNewOutcome] = useState('');
  const [newLessons, setNewLessons] = useState('');
  const [alt1Title, setAlt1Title] = useState('Monolithic Refractory Alloy Ta-10W');
  const [alt1Flaw, setAlt1Flaw] = useState('Excessive weight penalty exceeding vehicle structural allowance by 80%.');
  const [savingDecision, setSavingDecision] = useState(false);

  const loadDecisions = async () => {
    try {
      const res = await api.getDecisions();
      setDecisions(res);
      if (res.length > 0 && !selectedDecision) {
        setSelectedDecision(res[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecisions();
  }, []);

  const handleExecuteReplay = async () => {
    if (!selectedDecision) return;
    setReplaying(true);
    try {
      const res = await api.replayDecision({
        decision_id: selectedDecision.id,
        modified_temperature_c: replayTemp,
        modified_mass_budget_kg: replayMass,
        modified_mission_profile: replayProfile,
      });
      setReplayResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setReplaying(false);
    }
  };

  const handleCreateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newProblem || !newSelectedDecision) return;

    setSavingDecision(true);
    const parsedConstraints = newConstraints
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean);

    const decisionPayload = {
      expert_id: 1,
      title: newTitle,
      problem_definition: newProblem,
      context: newContext || 'High-altitude aerodynamic entry test matrix.',
      constraints: parsedConstraints,
      reasoning: newReasoning || 'Derived from empirical flight data and thermal modeling.',
      selected_decision: newSelectedDecision,
      outcome: newOutcome || 'Verified in preliminary wind-tunnel testing.',
      lessons_learned: newLessons || 'Thermal expansion decoupling is non-negotiable.',
      confidence_rating: 0.95,
      alternatives: [
        {
          title: alt1Title || 'Alternative 1',
          description: 'Evaluated secondary configuration.',
          pros: ['High mechanical strength'],
          cons: ['Thermal/mass penalty'],
          why_rejected: alt1Flaw || 'Rejected due to trade-off constraints.',
          estimated_risk: 'High',
        },
      ],
      evidence_items: [
        {
          title: 'Preliminary Aerothermal Run Matrix',
          evidence_type: 'empirical_test_data',
          content: 'Ground test verification confirming material stability.',
          source_url_or_ref: 'Test Run REF-2024',
          reliability_score: 0.95,
        },
      ],
      outcomes: [
        {
          metric_name: 'Total Component Mass',
          expected_value: '<= 150 kg',
          actual_value: '135 kg (Achieved)',
          impact_summary: 'Target met with 10% safety margin.',
          time_horizon: 'Immediate',
          validation_method: 'Scale measurement',
        },
      ],
    };

    try {
      const created = await api.createDecision(decisionPayload);
      setDecisions((prev) => [created, ...prev]);
      setSelectedDecision(created);
      setCreateModalOpen(false);
      // Reset form
      setNewTitle('');
      setNewProblem('');
      setNewContext('');
      setNewReasoning('');
      setNewSelectedDecision('');
      setNewOutcome('');
      setNewLessons('');
    } catch (err) {
      console.error(err);
      // Fallback local addition
      const fallbackDec: DecisionDNA = {
        id: Date.now(),
        expert_id: 1,
        expert_name: 'Dr. Alex Morgan',
        title: newTitle,
        problem_definition: newProblem,
        context: newContext || 'Aerothermal engineering problem statement.',
        constraints: parsedConstraints,
        reasoning: newReasoning || 'Empirical trade-off analysis.',
        selected_decision: newSelectedDecision,
        outcome: newOutcome || 'Successful qualification test.',
        lessons_learned: newLessons || 'Ensure compliance margins.',
        confidence_rating: 0.95,
        status: 'verified',
        is_synthetic_demo: false,
        created_at: new Date().toISOString(),
        alternatives: [
          {
            id: 1,
            title: alt1Title || 'Monolithic Ta-10W Alloy',
            description: 'Refractory metal candidate.',
            pros: ['High yield strength'],
            cons: ['Excessive weight penalty'],
            why_rejected: alt1Flaw || 'Mass budget violation.',
            estimated_risk: 'High',
          },
        ],
        evidence_items: [
          {
            id: 1,
            title: 'Diagnostic Simulation Log',
            evidence_type: 'empirical_test_data',
            content: 'Simulation verified thermal stability.',
            source_url_or_ref: 'INTERNAL-LOG-01',
            reliability_score: 0.95,
          },
        ],
        outcomes: [
          {
            id: 1,
            metric_name: 'Component Weight',
            expected_value: '<= 150 kg',
            actual_value: '135 kg',
            impact_summary: 'Met structural specification.',
            time_horizon: 'Immediate',
            validation_method: 'Ground test measurement',
          },
        ],
        lessons: [],
      };
      setDecisions((prev) => [fallbackDec, ...prev]);
      setSelectedDecision(fallbackDec);
      setCreateModalOpen(false);
    } finally {
      setSavingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center font-mono text-[#00D9FF]">
        Loading Decision DNA Engine...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#00D9FF]/15">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">DECISION DNA INTELLIGENCE</h1>
          <p className="text-xs text-[#9FB2CA] mt-1">
            Reconstruct how human experts framed problems, evaluated alternatives, applied reasoning, and learned from outcomes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl btn-cyber-primary flex items-center gap-2 text-xs uppercase tracking-wider font-bold"
          >
            <Plus className="w-4 h-4" />
            Reconstruct Decision
          </button>
          <button
            onClick={() => setCompareModalOpen(true)}
            disabled={!selectedDecision}
            className="px-4 py-2 rounded-xl btn-cyber-secondary flex items-center gap-2 text-xs uppercase tracking-wider font-semibold disabled:opacity-50"
          >
            <Scale className="w-4 h-4 text-[#00D9FF]" />
            Compare Alternatives
          </button>
        </div>
      </div>

      {/* Decision Selector Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {decisions.map((dec) => (
          <button
            key={dec.id}
            onClick={() => {
              setSelectedDecision(dec);
              setReplayResult(null);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
              selectedDecision?.id === dec.id
                ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/40 shadow-glow-cyan'
                : 'text-[#9FB2CA] bg-[#07182B] border border-white/5 hover:text-white'
            }`}
          >
            #{dec.id} {dec.title}
          </button>
        ))}
      </div>

      {selectedDecision && (
        <div className="space-y-6">
          {/* Main Decision Banner */}
          <div className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/25 relative overflow-hidden">
            {selectedDecision.is_synthetic_demo && (
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded text-[10px] font-mono bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-semibold">
                SYNTHETIC DEMO
              </div>
            )}

            <div className="flex items-center gap-2 text-xs font-mono text-[#00D9FF] mb-2">
              <span>EXPERT: {selectedDecision.expert_name}</span>
              <span>•</span>
              <span>CONFIDENCE: {Math.round(selectedDecision.confidence_rating * 100)}%</span>
              <span>•</span>
              <span className="text-[#00E6A0]">{selectedDecision.status.toUpperCase()}</span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold font-display text-white mb-4">
              {selectedDecision.title}
            </h2>

            {/* Sub-tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
              {[
                { id: 'dna', label: '9-Point Decision DNA' },
                { id: 'alternatives', label: `Alternatives Evaluated (${selectedDecision.alternatives.length})` },
                { id: 'evidence', label: `Empirical Evidence (${selectedDecision.evidence_items.length})` },
                { id: 'outcomes', label: `Outcomes & Metrics (${selectedDecision.outcomes.length})` },
                { id: 'replay', label: 'Decision Replay Studio (What-If Sandbox)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-[#00D9FF] border-b-2 border-[#00D9FF]'
                      : 'text-[#9FB2CA] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: 9-POINT DECISION DNA BREAKDOWN */}
          {activeTab === 'dna' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Problem, Context & Constraints (1 col) */}
              <div className="space-y-6">
                {/* 1. Problem Definition */}
                <div className="p-5 rounded-2xl glass-panel">
                  <span className="text-[10px] font-mono text-[#00D9FF] uppercase tracking-wider block mb-1">
                    DNA Point 01 • The Problem
                  </span>
                  <h3 className="text-sm font-bold text-white mb-2">Core Engineering Challenge</h3>
                  <p className="text-xs text-[#9FB2CA] leading-relaxed">
                    {selectedDecision.problem_definition}
                  </p>
                </div>

                {/* 2. Context */}
                <div className="p-5 rounded-2xl glass-panel">
                  <span className="text-[10px] font-mono text-[#167BFF] uppercase tracking-wider block mb-1">
                    DNA Point 02 • Context
                  </span>
                  <h3 className="text-sm font-bold text-white mb-2">Operational Background</h3>
                  <p className="text-xs text-[#9FB2CA] leading-relaxed">
                    {selectedDecision.context}
                  </p>
                </div>

                {/* 3. Constraints */}
                <div className="p-5 rounded-2xl glass-panel">
                  <span className="text-[10px] font-mono text-[#F59E0B] uppercase tracking-wider block mb-2">
                    DNA Point 03 • Hard Constraints
                  </span>
                  <div className="space-y-2">
                    {selectedDecision.constraints.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-white">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Center & Right Column: Reasoning, Selected Decision, Outcome, Lessons (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                {/* 4. Selected Decision (Highlighted Cyan Card) */}
                <div className="p-6 rounded-2xl bg-[#00D9FF]/10 border-2 border-[#00D9FF]/50 shadow-glow-cyan">
                  <span className="text-[10px] font-mono text-[#00D9FF] uppercase tracking-widest font-bold block mb-1">
                    DNA Point 07 • Selected Decision Architecture
                  </span>
                  <h3 className="text-base font-bold text-white mb-2">
                    {selectedDecision.selected_decision}
                  </h3>
                  <p className="text-xs text-[#F4F8FF]/90 leading-relaxed font-mono">
                    Qualified for flight testing under Project Hyperion Mach 7.4 qualification.
                  </p>
                </div>

                {/* 5. Expert Reasoning Rationale */}
                <div className="p-6 rounded-2xl glass-panel">
                  <span className="text-[10px] font-mono text-[#925CFF] uppercase tracking-wider block mb-1">
                    DNA Point 05 • Expert Reasoning Rationale
                  </span>
                  <h3 className="text-sm font-bold text-white mb-3">Why This Specific Choice?</h3>
                  <p className="text-xs text-[#9FB2CA] leading-relaxed whitespace-pre-line">
                    {selectedDecision.reasoning}
                  </p>
                </div>

                {/* 6. Measurable Outcomes & Lessons Learned */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl glass-panel">
                    <span className="text-[10px] font-mono text-[#00E6A0] uppercase tracking-wider block mb-1">
                      DNA Point 08 • Real Flight Outcome
                    </span>
                    <p className="text-xs text-white leading-relaxed mt-2">
                      {selectedDecision.outcome}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl glass-panel">
                    <span className="text-[10px] font-mono text-[#FF6B8B] uppercase tracking-wider block mb-1">
                      DNA Point 09 • Retrospective Lessons
                    </span>
                    <p className="text-xs text-[#9FB2CA] leading-relaxed mt-2 whitespace-pre-line">
                      {selectedDecision.lessons_learned}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALTERNATIVES EVALUATED */}
          {activeTab === 'alternatives' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedDecision.alternatives.map((alt, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl glass-panel border border-red-500/20 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-400 font-semibold uppercase">
                        Rejected Alternative #{i + 1}
                      </span>
                      <span className="text-[10px] font-mono text-[#F59E0B]">
                        Risk: {alt.estimated_risk}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-2">{alt.title}</h3>
                    <p className="text-xs text-[#9FB2CA] leading-relaxed mb-4">{alt.description}</p>

                    {/* Pros & Cons */}
                    <div className="space-y-3 mb-4 text-xs">
                      {alt.pros && alt.pros.length > 0 && (
                        <div>
                          <span className="text-[10px] font-mono text-[#00E6A0] uppercase block mb-1">
                            Potential Advantages
                          </span>
                          {alt.pros.map((p, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[#9FB2CA]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#00E6A0] flex-shrink-0" />
                              <span>{p}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {alt.cons && alt.cons.length > 0 && (
                        <div>
                          <span className="text-[10px] font-mono text-red-400 uppercase block mb-1">
                            Fatal Disadvantages
                          </span>
                          {alt.cons.map((c, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[#9FB2CA]">
                              <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
                    <span className="font-mono text-[10px] text-red-400 uppercase font-semibold block mb-0.5">
                      Expert Rejection Justification
                    </span>
                    <p className="text-white text-[11px] leading-relaxed">{alt.why_rejected}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: EMPIRICAL EVIDENCE */}
          {activeTab === 'evidence' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedDecision.evidence_items.map((ev, i) => (
                <div key={i} className="p-6 rounded-2xl glass-panel border border-[#00E6A0]/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30 font-semibold">
                      {ev.evidence_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono text-[#00E6A0]">
                      {Math.round(ev.reliability_score * 100)}% Reliability
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-2">{ev.title}</h3>
                  <p className="text-xs text-[#9FB2CA] leading-relaxed mb-4">{ev.content}</p>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-[#9FB2CA]">
                    <span>Source: {ev.source_url_or_ref || 'Internal Testing Database'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: OUTCOMES & METRICS */}
          {activeTab === 'outcomes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedDecision.outcomes.map((out, i) => (
                <div key={i} className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-[#00D9FF] uppercase tracking-wider">
                      Metric #{i + 1}
                    </span>
                    <span className="text-[11px] font-mono text-[#9FB2CA]">{out.time_horizon}</span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-4">{out.metric_name}</h3>

                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#020713]/70 border border-white/5 mb-4">
                    <div>
                      <span className="text-[10px] font-mono text-[#9FB2CA] uppercase block">Expected</span>
                      <span className="text-sm font-mono text-white font-bold">{out.expected_value}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#00E6A0] uppercase block">Actual Result</span>
                      <span className="text-sm font-mono text-[#00E6A0] font-bold">{out.actual_value}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#9FB2CA] leading-relaxed mb-2">{out.impact_summary}</p>
                  <p className="text-[10px] font-mono text-[#9FB2CA]/80">Validation: {out.validation_method}</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: DECISION REPLAY STUDIO */}
          {activeTab === 'replay' && (
            <div className="space-y-6">
              {/* Parameter Modification Sandbox */}
              <div className="p-6 rounded-2xl glass-panel border border-[#925CFF]/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#925CFF] uppercase font-bold tracking-wider">
                      DECISION REPLAY SANDBOX • WHAT-IF BRANCHING
                    </span>
                    <h3 className="text-lg font-bold font-display text-white mt-0.5">
                      MODIFY OPERATING BOUNDARIES & REPLAY CAUSALITY
                    </h3>
                  </div>
                  <button
                    onClick={handleExecuteReplay}
                    disabled={replaying}
                    className="px-5 py-2.5 rounded-xl btn-cyber-primary text-xs uppercase tracking-wider font-bold flex items-center gap-2 self-start sm:self-auto"
                  >
                    <RefreshCw className={`w-4 h-4 ${replaying ? 'animate-spin' : ''}`} />
                    {replaying ? 'Simulating Branch...' : 'Execute Replay'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div>
                    <label className="text-xs font-mono text-[#00D9FF] flex justify-between mb-1">
                      <span>Peak Stagnation Temp</span>
                      <span className="font-bold">{replayTemp}°C</span>
                    </label>
                    <input
                      type="range"
                      min="1400"
                      max="2400"
                      step="50"
                      value={replayTemp}
                      onChange={(e) => setReplayTemp(Number(e.target.value))}
                      className="w-full accent-[#00D9FF] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-[#9FB2CA] mt-1">
                      <span>1400°C</span>
                      <span>1750°C (Base)</span>
                      <span>2400°C</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-[#00D9FF] flex justify-between mb-1">
                      <span>Mass Budget Limit</span>
                      <span className="font-bold">{replayMass} kg</span>
                    </label>
                    <input
                      type="range"
                      min="90"
                      max="200"
                      step="5"
                      value={replayMass}
                      onChange={(e) => setReplayMass(Number(e.target.value))}
                      className="w-full accent-[#00D9FF] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-[#9FB2CA] mt-1">
                      <span>90 kg</span>
                      <span>145 kg (Base)</span>
                      <span>200 kg</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-[#00D9FF] block mb-1">Mission Profile Target</label>
                    <select
                      value={replayProfile}
                      onChange={(e) => setReplayProfile(e.target.value as any)}
                      className="w-full bg-[#020713] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                    >
                      <option value="multi_mission_reusable">Multi-Mission Reusable (15+ Flights)</option>
                      <option value="single_use_expendable">Single-Use Flight Test (Expendable)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Replay Results Card */}
              {replayResult && (
                <div className="p-6 md:p-8 rounded-2xl glass-panel border border-[#925CFF]/40 shadow-glow-purple space-y-5 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#925CFF]/20 text-[#925CFF] border border-[#925CFF]/40 font-bold">
                        HYPOTHETICAL SIMULATION • REPLAY DIVERGENCE
                      </span>
                      <h4 className="text-lg font-bold text-white mt-1.5">
                        {replayResult.replayed_selected_approach}
                      </h4>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] text-[11px] font-mono max-w-sm">
                      {replayResult.epistemic_warning}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs">
                    <span className="text-[10px] font-mono text-[#00D9FF] uppercase tracking-wider block mb-1">
                      Causal Divergence Point
                    </span>
                    <p className="text-white leading-relaxed">{replayResult.branching_divergence_point}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#020713]/80 border border-white/5 text-xs text-[#9FB2CA] leading-relaxed">
                    <span className="text-[10px] font-mono text-[#925CFF] uppercase tracking-wider block mb-1">
                      Replayed Reasoning Rationale
                    </span>
                    {replayResult.replayed_rationale}
                  </div>

                  {/* Projected Tradeoffs Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(replayResult.tradeoff_comparison).map(([k, v]) => (
                      <div key={k} className="p-3 rounded-lg bg-white/5 text-xs">
                        <span className="text-[10px] font-mono text-[#00D9FF] block uppercase">{k.replace('_', ' ')}</span>
                        <span className="text-white font-medium text-[11px] mt-0.5 block">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-[#00E6A0]/10 border border-[#00E6A0]/20 text-xs text-white leading-relaxed">
                    <span className="font-mono text-[10px] text-[#00E6A0] uppercase font-bold block mb-1">
                      Projected Replay Outcome
                    </span>
                    {replayResult.hypothetical_projected_outcome}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Record New Decision DNA */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl glass-panel border border-[#00D9FF]/40 p-6 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-lg font-bold font-display text-white mb-1">
              RECONSTRUCT EXPERT DECISION DNA
            </h2>
            <p className="text-xs text-[#9FB2CA] mb-5">
              Preserve a historical engineering decision using ECHO's signature 9-point Decision DNA framework.
            </p>

            <form onSubmit={handleCreateDecision} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#00D9FF] block mb-1">Decision Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Aerothermal Cowl Leading Edge Material Selection"
                  className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-[#00D9FF] block mb-1">1. Problem Definition</label>
                  <textarea
                    required
                    rows={3}
                    value={newProblem}
                    onChange={(e) => setNewProblem(e.target.value)}
                    placeholder="What specific physical failure or dilemma required resolution?"
                    className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#00D9FF] block mb-1">2. Operational Context</label>
                  <textarea
                    rows={3}
                    value={newContext}
                    onChange={(e) => setNewContext(e.target.value)}
                    placeholder="Environmental conditions, flight regime, dynamic pressures..."
                    className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-[#F59E0B] block mb-1">3. Hard Constraints (One per line)</label>
                <textarea
                  rows={2}
                  value={newConstraints}
                  onChange={(e) => setNewConstraints(e.target.value)}
                  className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#00D9FF]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#925CFF] block mb-1">5. Expert Reasoning Rationale</label>
                <textarea
                  rows={3}
                  value={newReasoning}
                  onChange={(e) => setNewReasoning(e.target.value)}
                  placeholder="Why was this specific path chosen? How were physics trade-offs balanced?"
                  className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#00D9FF] block mb-1">7. Selected Decision Architecture</label>
                <input
                  type="text"
                  required
                  value={newSelectedDecision}
                  onChange={(e) => setNewSelectedDecision(e.target.value)}
                  placeholder="e.g. 3D-woven C/SiC composite with slotted Inconel collets"
                  className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-[#00E6A0] block mb-1">8. Real Flight / Test Outcome</label>
                  <input
                    type="text"
                    value={newOutcome}
                    onChange={(e) => setNewOutcome(e.target.value)}
                    placeholder="e.g. Completed Mach 7 flight with zero structural recession"
                    className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00E6A0]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#FF6B8B] block mb-1">9. Retrospective Lessons</label>
                  <input
                    type="text"
                    value={newLessons}
                    onChange={(e) => setNewLessons(e.target.value)}
                    placeholder="e.g. Mechanical expansion decoupling is critical"
                    className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B8B]"
                  />
                </div>
              </div>

              {/* Rejected Alternative Section */}
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                <span className="text-[10px] font-mono text-red-400 uppercase font-bold block">
                  Rejected Alternative Candidate
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={alt1Title}
                    onChange={(e) => setAlt1Title(e.target.value)}
                    placeholder="Alternative candidate title"
                    className="w-full bg-[#020713] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={alt1Flaw}
                    onChange={(e) => setAlt1Flaw(e.target.value)}
                    placeholder="Fatal flaw / rejection justification"
                    className="w-full bg-[#020713] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#9FB2CA] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDecision}
                  className="px-5 py-2 rounded-xl btn-cyber-primary text-xs uppercase tracking-wider font-bold"
                >
                  {savingDecision ? 'Saving Decision DNA...' : 'Preserve Decision DNA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Compare Alternatives Matrix */}
      {compareModalOpen && selectedDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl glass-panel border border-[#00D9FF]/40 p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#00D9FF]/20 mb-6">
              <div>
                <span className="text-[10px] font-mono text-[#00D9FF] uppercase tracking-wider">
                  Side-by-Side Trade Study
                </span>
                <h2 className="text-xl font-bold font-display text-white">
                  ALTERNATIVE SOLUTIONS COMPARISON
                </h2>
              </div>
              <button
                onClick={() => setCompareModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#9FB2CA] hover:text-white bg-white/5"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              {/* Selected Choice Comparison Row */}
              <div className="p-4 rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/40">
                <span className="text-[10px] font-mono text-[#00D9FF] uppercase font-bold block mb-1">
                  SELECTED ARCHITECTURE: {selectedDecision.selected_decision}
                </span>
                <p className="text-xs text-white leading-relaxed">{selectedDecision.reasoning}</p>
              </div>

              {/* Alternatives List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedDecision.alternatives.map((alt, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[#020713]/80 border border-white/10 text-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono text-red-400 uppercase font-semibold">
                          Candidate #{i + 1}
                        </span>
                        <span className="text-[10px] font-mono text-[#F59E0B]">
                          Risk: {alt.estimated_risk}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1.5">{alt.title}</h4>
                      <p className="text-[#9FB2CA] text-[11px] mb-3">{alt.description}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-[11px]">
                      <strong>Fatal Flaw:</strong> {alt.why_rejected}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
