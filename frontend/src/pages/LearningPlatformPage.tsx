import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CaseStudy, StudentSubmission, SkillProfile } from '../types';
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
  Layers,
  ChevronRight,
  FileCheck,
  Plus,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const LearningPlatformPage: React.FC = () => {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);
  const [skills, setSkills] = useState<SkillProfile[]>([]);
  const [pastSubmissions, setPastSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCaseModal, setShowCreateCaseModal] = useState(false);
  const [expandedSubId, setExpandedSubId] = useState<number | null>(null);

  // Challenge Submission Form State
  const [studentName, setStudentName] = useState('Cadet Elena Chen');
  const [proposedSolution, setProposedSolution] = useState(
    'I propose a 3D-woven carbon-fiber preform infiltrated with silicon carbide (C/SiC) matrix via pulsed chemical vapor infiltration, backed by an internal titanium silicate aerogel tile. Mechanical attachment utilizes slotted refractory Inconel collets with flexible Grafoil compliance pads.'
  );
  const [reasoningSteps, setReasoningSteps] = useState(
    '1. Monolithic metals are eliminated due to extreme density (>280 kg for Ta-10W).\n2. Reinforced carbon-carbon (RCC) risks catastrophic subsurface oxidation under 160 dB acoustic buffet.\n3. C/SiC ensures total assembly mass remains at ~124 kg (-14% mass margin under 145 kg limit).\n4. Slotted collets decouple thermal expansion between titanium ribs and composite leading edges, preventing shear failure.'
  );
  const [alternativesConsidered, setAlternativesConsidered] = useState(
    'Evaluated Tantalum-10W refractory alloy with HfC coating. Rejected strictly due to severe weight budget penalty (288 kg total), which would compromise vehicle aerodynamic trim.'
  );
  const [evidenceCited, setEvidenceCited] = useState(
    'Referenced Arc-Jet Facility Run AJ-882 empirical test showing <0.05% mass loss at 1720°C air plasma over 45 cycles.'
  );

  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<StudentSubmission | null>(null);

  // New Case Study Form State
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseSummary, setNewCaseSummary] = useState('');
  const [newCaseDilemma, setNewCaseDilemma] = useState('');
  const [newCaseDifficulty, setNewCaseDifficulty] = useState<'intermediate' | 'advanced' | 'master'>('advanced');
  const [savingCase, setSavingCase] = useState(false);

  const loadData = async () => {
    try {
      const [studiesRes, skillsRes, subsRes] = await Promise.all([
        api.getCaseStudies(),
        api.getSkills(),
        api.getSubmissions(),
      ]);
      setCaseStudies(studiesRes);
      if (studiesRes.length > 0) {
        const detail = await api.getCaseStudyDetail(studiesRes[0].id);
        setSelectedCase(detail);
      }
      setSkills(skillsRes);
      setPastSubmissions(subsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectCaseStudy = async (csId: number) => {
    try {
      const detail = await api.getCaseStudyDetail(csId);
      setSelectedCase(detail);
      setSubmissionResult(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const challengeId = selectedCase?.challenges?.[0]?.id || 1;

    setSubmitting(true);
    try {
      const res = await api.submitChallenge({
        challenge_id: challengeId,
        student_name: studentName,
        proposed_solution: proposedSolution,
        reasoning_steps: reasoningSteps,
        alternatives_considered: alternativesConsidered,
        evidence_cited: evidenceCited,
      });
      setSubmissionResult(res);

      // Refresh student skill portfolio & past submissions
      const [updatedSkills, subs] = await Promise.all([
        api.getSkills(),
        api.getSubmissions().catch(() => []),
      ]);
      setSkills(updatedSkills);
      setPastSubmissions([res, ...subs.filter((s) => s.id !== res.id)]);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCaseStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle || !newCaseSummary || !newCaseDilemma) return;

    setSavingCase(true);
    try {
      const newStudy = await api.createCaseStudy({
        title: newCaseTitle,
        summary: newCaseSummary,
        domain: 'Aerospace Engineering',
        industry: 'Hypersonic Systems',
        background: newCaseSummary,
        core_dilemma: newCaseDilemma,
        difficulty: newCaseDifficulty,
        technical_data: {
          test_regime: 'Hypersonic Mach 8+',
          stagnation_temp: '1850°C',
          mass_limit: '140 kg',
        },
        learning_objectives: [
          'Analyze structural-thermal boundary conditions',
          'Evaluate composite vs refractory material choices',
        ],
      });
      setCaseStudies((prev) => [newStudy, ...prev]);
      setSelectedCase(newStudy);
      setShowCreateCaseModal(false);
      setNewCaseTitle('');
      setNewCaseSummary('');
      setNewCaseDilemma('');
    } catch (err) {
      console.error(err);
      // Fallback local addition
      const fallbackCase: CaseStudy = {
        id: Date.now(),
        expert_id: 1,
        expert_name: 'Dr. Alex Morgan',
        title: newCaseTitle,
        summary: newCaseSummary,
        domain: 'Aerospace Engineering',
        industry: 'Hypersonic Flight Systems',
        background: newCaseSummary,
        core_dilemma: newCaseDilemma,
        difficulty: newCaseDifficulty,
        is_synthetic_demo: false,
        created_at: new Date().toISOString(),
        technical_data: {
          flight_regime: 'Mach 8.0 Stagnation',
          temperature_c: 1850,
          mass_budget: '140 kg',
        },
        learning_objectives: ['Analyze multi-physics thermal tradeoffs'],
        challenges: [
          {
            id: Date.now(),
            title: 'Scramjet Cowl Thermal Mitigation Challenge',
            scenario_prompt: newCaseDilemma,
            constraints: ['Mass <= 140 kg', 'Non-ablative reusability'],
            evaluation_rubric: { reasoning: 25, technical: 25, evidence: 25, alternatives: 25 },
            max_score: 100,
          },
        ],
      };
      setCaseStudies((prev) => [fallbackCase, ...prev]);
      setSelectedCase(fallbackCase);
      setShowCreateCaseModal(false);
      setNewCaseTitle('');
      setNewCaseSummary('');
      setNewCaseDilemma('');
    } finally {
      setSavingCase(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center font-mono text-[#00D9FF]">
        Accessing Intelligence Transfer Platform...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#00D9FF]/15">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">INTELLIGENCE TRANSFER & CADET PATHWAY</h1>
          <p className="text-xs text-[#9FB2CA] mt-1">
            Transform preserved human expertise into practical engineering challenges, multi-criteria evaluations, and demonstrable skill portfolios.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateCaseModal(true)}
            className="px-4 py-2 rounded-xl btn-cyber-secondary flex items-center gap-2 text-xs uppercase tracking-wider font-semibold"
          >
            <Plus className="w-4 h-4 text-[#00D9FF]" />
            New Case Study
          </button>
          <div className="flex items-center gap-2 text-xs font-mono text-[#00E6A0] bg-[#00E6A0]/10 border border-[#00E6A0]/25 px-3 py-1.5 rounded-xl">
            <GraduationCap className="w-4 h-4" />
            <span>EVALUATION ENGINE ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Case Study Selector (if multiple exist) */}
      {caseStudies.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {caseStudies.map((cs) => (
            <button
              key={cs.id}
              onClick={() => handleSelectCaseStudy(cs.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
                selectedCase?.id === cs.id
                  ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/40 shadow-glow-cyan'
                  : 'text-[#9FB2CA] bg-[#07182B] border border-white/5 hover:text-white'
              }`}
            >
              #{cs.id} {cs.title}
            </button>
          ))}
        </div>
      )}

      {/* Case Study Overview & Dilemma */}
      {selectedCase && (
        <div className="p-6 md:p-8 rounded-2xl glass-panel border border-[#00D9FF]/30 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <span className="px-3 py-1 rounded text-xs font-mono uppercase bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/30 font-semibold self-start sm:self-auto">
              Advanced Engineering Case Study • {selectedCase.difficulty.toUpperCase()}
            </span>
            <span className="text-xs font-mono text-[#9FB2CA]">
              Source: {selectedCase.expert_name || 'Dr. Alex Morgan'}
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold font-display text-white mb-2">
            {selectedCase.title}
          </h2>

          <p className="text-xs text-[#9FB2CA] leading-relaxed mb-4 max-w-4xl">
            {selectedCase.summary}
          </p>

          <div className="p-4 rounded-xl bg-[#020713]/80 border border-[#00D9FF]/20 text-xs mb-6">
            <span className="text-[10px] font-mono text-[#00D9FF] uppercase tracking-wider block mb-1">
              The Core Dilemma
            </span>
            <p className="text-white leading-relaxed">{selectedCase.core_dilemma}</p>
          </div>

          {/* Technical Constraints HUD */}
          {selectedCase.technical_data && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
              {Object.entries(selectedCase.technical_data).map(([key, val]) => (
                <div key={key} className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs">
                  <span className="text-[9px] font-mono text-[#9FB2CA] block uppercase truncate">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-white font-mono font-bold text-xs mt-0.5 block">{String(val)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Challenge Scenario & Student Submission Box */}
          <div className="pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E6A0] animate-pulse" />
              <h3 className="text-sm font-bold font-display text-white">
                CHALLENGE: SYSTEM ARCHITECTURE & CTE MITIGATION PROPOSAL
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-[#00D9FF] block mb-1">
                    Student / Analyst Call-sign
                  </label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#00D9FF] block mb-1">
                    Proposed Primary Material Architecture
                  </label>
                  <input
                    type="text"
                    required
                    value={proposedSolution}
                    onChange={(e) => setProposedSolution(e.target.value)}
                    className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-[#00D9FF] block mb-1">
                  Step-by-Step Technical Reasoning (Causality & Thermodynamics)
                </label>
                <textarea
                  required
                  rows={4}
                  value={reasoningSteps}
                  onChange={(e) => setReasoningSteps(e.target.value)}
                  className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#00D9FF]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-[#00D9FF] block mb-1">
                    Rejected Alternatives & Risk Trade-off
                  </label>
                  <textarea
                    rows={3}
                    value={alternativesConsidered}
                    onChange={(e) => setAlternativesConsidered(e.target.value)}
                    placeholder="Why did you reject metals or ablators?"
                    className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-[#00D9FF] block mb-1">
                    Supporting Empirical Evidence Cited
                  </label>
                  <textarea
                    rows={3}
                    value={evidenceCited}
                    onChange={(e) => setEvidenceCited(e.target.value)}
                    placeholder="Cite wind-tunnel runs or test standards..."
                    className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl btn-cyber-primary text-xs uppercase tracking-wider font-bold flex items-center gap-2"
                >
                  {submitting ? 'Evaluating Reasoning with AI...' : 'Submit Proposal for Assessment'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Assessment Card Display */}
      {submissionResult && submissionResult.assessment && (
        <div className="p-6 md:p-8 rounded-2xl glass-panel border border-[#00E6A0]/40 shadow-glow-green space-y-6 animate-in zoom-in-95 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-[10px] font-mono text-[#00E6A0] uppercase tracking-wider font-bold">
                Automated Rubric Assessment • Evaluated
              </span>
              <h3 className="text-xl font-bold font-display text-white mt-0.5">
                SUBMISSION EVALUATION REPORT
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#9FB2CA]">Overall Score:</span>
              <div className="text-3xl font-extrabold font-mono text-[#00E6A0]">
                {submissionResult.assessment.overall_score}
                <span className="text-sm text-[#9FB2CA]">/100</span>
              </div>
            </div>
          </div>

          {/* 4 Score Breakdown Bars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Reasoning Logic', score: submissionResult.assessment.reasoning_score, max: 25 },
              { label: 'Technical Depth', score: submissionResult.assessment.technical_score, max: 25 },
              { label: 'Evidence Grounding', score: submissionResult.assessment.evidence_score, max: 25 },
              { label: 'Alternative Trade-offs', score: submissionResult.assessment.problem_solving_score, max: 25 },
            ].map((metric, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#020713]/80 border border-white/5 text-xs">
                <div className="flex justify-between text-[#9FB2CA] text-[10px] font-mono mb-1">
                  <span>{metric.label}</span>
                  <span className="text-[#00D9FF] font-bold">{metric.score}/{metric.max}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00D9FF] to-[#00E6A0]"
                    style={{ width: `${(metric.score / metric.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Comparative Analysis & Expert Feedback */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 text-xs text-white leading-relaxed">
              <span className="font-mono text-[10px] text-[#00D9FF] uppercase tracking-wider block mb-1">
                Comparative Assessment Analysis
              </span>
              {submissionResult.assessment.comparative_analysis}
            </div>

            <div className="p-4 rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/25 text-xs text-white leading-relaxed">
              <span className="font-mono text-[10px] text-[#00D9FF] uppercase tracking-wider block mb-1">
                Expert Precedent Benchmark (Dr. Alex Morgan)
              </span>
              {submissionResult.assessment.expert_comparison_notes}
            </div>
          </div>

          {/* Strengths & Improvement Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#00E6A0]/10 border border-[#00E6A0]/20">
              <span className="font-mono text-[10px] text-[#00E6A0] uppercase font-bold block mb-2">
                Demonstrated Engineering Strengths
              </span>
              {submissionResult.assessment.strengths.map((str, i) => (
                <div key={i} className="flex items-start gap-2 text-white mb-1.5 last:mb-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00E6A0] flex-shrink-0 mt-0.5" />
                  <span>{str}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/20">
              <span className="font-mono text-[10px] text-amber-400 uppercase font-bold block mb-2">
                Recommendations for Next Flight Iteration
              </span>
              {submissionResult.assessment.areas_for_improvement.map((imp, i) => (
                <div key={i} className="flex items-start gap-2 text-[#9FB2CA] mb-1.5 last:mb-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{imp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: SUBMISSION HISTORY & EVALUATED PROPOSALS */}
      {pastSubmissions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#00E6A0]" />
              CADET SUBMISSION PORTFOLIO & AUDIT HISTORY ({pastSubmissions.length})
            </h3>
            <span className="text-xs font-mono text-[#00D9FF]">RUBRIC EVALUATION ARCHIVE</span>
          </div>

          <div className="space-y-3">
            {pastSubmissions.map((sub) => {
              const isExpanded = expandedSubId === sub.id;
              return (
                <div
                  key={sub.id}
                  className="p-5 rounded-2xl glass-panel border border-white/5 space-y-3 transition hover:border-[#00D9FF]/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#00D9FF]/15 text-[#00D9FF] font-semibold">
                        SUBMISSION #{sub.id}
                      </span>
                      <h4 className="text-sm font-bold text-white">{sub.student_name}</h4>
                      <span className="text-xs font-mono text-[#9FB2CA]">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-[#00E6A0] font-bold">
                        Score: {sub.score || (sub.assessment ? sub.assessment.overall_score : 85)}/100
                      </span>
                      <button
                        onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 text-[#9FB2CA] hover:text-white flex items-center gap-1"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {isExpanded ? 'Hide Rubric' : 'View Feedback'}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#9FB2CA] line-clamp-2 leading-relaxed">
                    {sub.proposed_solution}
                  </p>

                  {/* Expanded Assessment Telemetry */}
                  {isExpanded && sub.assessment && (
                    <div className="p-4 rounded-xl bg-[#020713]/90 border border-[#00D9FF]/20 space-y-3 animate-in fade-in duration-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono">
                        <div className="p-2 rounded bg-white/5">
                          <span className="text-[#9FB2CA] block">Reasoning:</span>
                          <span className="text-[#00D9FF] font-bold">{sub.assessment.reasoning_score}/25</span>
                        </div>
                        <div className="p-2 rounded bg-white/5">
                          <span className="text-[#9FB2CA] block">Technical:</span>
                          <span className="text-[#00D9FF] font-bold">{sub.assessment.technical_score}/25</span>
                        </div>
                        <div className="p-2 rounded bg-white/5">
                          <span className="text-[#9FB2CA] block">Evidence:</span>
                          <span className="text-[#00D9FF] font-bold">{sub.assessment.evidence_score}/25</span>
                        </div>
                        <div className="p-2 rounded bg-white/5">
                          <span className="text-[#9FB2CA] block">Trade-offs:</span>
                          <span className="text-[#00D9FF] font-bold">{sub.assessment.problem_solving_score}/25</span>
                        </div>
                      </div>

                      <div className="text-xs text-[#F4F8FF] leading-relaxed">
                        <p className="text-[#00E6A0] font-mono text-[10px] uppercase mb-1">Comparative Feedback:</p>
                        <p>{sub.assessment.comparative_analysis}</p>
                      </div>

                      {sub.assessment.expert_comparison_notes && (
                        <div className="p-2.5 rounded-lg bg-[#00D9FF]/10 text-xs text-[#00D9FF]">
                          <strong>Expert Benchmark:</strong> {sub.assessment.expert_comparison_notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: DEMONSTRATED SKILL PORTFOLIO */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-[#00D9FF]" />
            DEMONSTRATED SKILL PORTFOLIO ({skills.length})
          </h3>
          <span className="text-xs font-mono text-[#00E6A0]">VERIFIED COMPETENCY BADGES</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="p-5 rounded-2xl glass-panel border border-[#00D9FF]/20 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-[#00D9FF] uppercase">
                    {skill.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                      skill.mastery_level === 'Expert'
                        ? 'bg-[#925CFF]/20 text-[#925CFF]'
                        : 'bg-[#00E6A0]/15 text-[#00E6A0]'
                    }`}
                  >
                    {skill.mastery_level}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-2">{skill.skill_name}</h4>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-[#9FB2CA]">{skill.evidence_count} Evidence Item(s)</span>
                <span className="text-[#00D9FF] font-bold">{skill.score_points} pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Create New Case Study */}
      {showCreateCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl glass-panel border border-[#00D9FF]/40 p-6 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-lg font-bold font-display text-white mb-1">
              DESIGN NEW ENGINEERING CASE STUDY
            </h2>
            <p className="text-xs text-[#9FB2CA] mb-5">
              Transform historical flight scenarios or operational dilemmas into student challenges.
            </p>

            <form onSubmit={handleCreateCaseStudy} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-[#00D9FF] block mb-1">Case Study Title</label>
                <input
                  type="text"
                  required
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                  placeholder="e.g. Scramjet Cowl Leading Edge Thermal Shock Mitigation"
                  className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#00D9FF] block mb-1">Difficulty Tier</label>
                <select
                  value={newCaseDifficulty}
                  onChange={(e) => setNewCaseDifficulty(e.target.value as any)}
                  className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                >
                  <option value="intermediate">Intermediate (Undergraduate / Junior Analyst)</option>
                  <option value="advanced">Advanced (Senior Engineer / Flight Specialist)</option>
                  <option value="master">Master (Chief Architect Level)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-[#00D9FF] block mb-1">Operational Scenario Background</label>
                <textarea
                  required
                  rows={3}
                  value={newCaseSummary}
                  onChange={(e) => setNewCaseSummary(e.target.value)}
                  placeholder="Describe the vehicle mission, flight environment, and structural requirements..."
                  className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#F59E0B] block mb-1">The Core Dilemma / Challenge</label>
                <textarea
                  required
                  rows={3}
                  value={newCaseDilemma}
                  onChange={(e) => setNewCaseDilemma(e.target.value)}
                  placeholder="What competing trade-offs make this problem difficult (e.g. mass vs temperature vs acoustic buffet)?"
                  className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateCaseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#9FB2CA] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCase}
                  className="px-5 py-2 rounded-xl btn-cyber-primary text-xs uppercase tracking-wider font-bold"
                >
                  {savingCase ? 'Creating Challenge...' : 'Deploy Case Study'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
