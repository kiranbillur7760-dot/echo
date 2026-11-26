import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight,
  Sparkles,
  BookOpen,
  Scale,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { FeatureHeader } from '../components/FeatureInfoModal';
import {
  CouncilChallenge,
  Expert,
  CouncilDeliberationResult,
  ExpertPerspective,
  CouncilAgreement,
  CouncilContention
} from '../types';

export const CouncilOfExpertsPage: React.FC = () => {
  const [challenges, setChallenges] = useState<CouncilChallenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<CouncilChallenge | null>(null);
  const [roster, setRoster] = useState<Expert[]>([]);
  const [selectedExpertIds, setSelectedExpertIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deliberating, setDeliberating] = useState<boolean>(false);
  const [result, setResult] = useState<CouncilDeliberationResult | null>(null);
  const [expandedExpert, setExpandedExpert] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'perspectives' | 'agreements' | 'contentions' | 'roadmap'>('perspectives');

  // Custom challenge modal/input
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [challengeList, expertList] = await Promise.all([
        api.getCouncilChallenges(),
        api.getCouncilRoster()
      ]);
      setChallenges(challengeList);
      setRoster(expertList);
      if (challengeList.length > 0) {
        setSelectedChallenge(challengeList[0]);
        setSelectedExpertIds(challengeList[0].default_expert_ids);
      } else {
        setSelectedExpertIds(expertList.map((e) => e.id));
      }
    } catch (err) {
      console.error('Failed to load council initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChallenge = (c: CouncilChallenge) => {
    setIsCustom(false);
    setSelectedChallenge(c);
    setSelectedExpertIds(c.default_expert_ids);
    setResult(null);
  };

  const toggleExpertSelection = (id: number) => {
    if (selectedExpertIds.includes(id)) {
      if (selectedExpertIds.length > 1) {
        setSelectedExpertIds(selectedExpertIds.filter((x) => x !== id));
      }
    } else {
      setSelectedExpertIds([...selectedExpertIds, id]);
    }
  };

  const runDeliberation = async () => {
    setDeliberating(true);
    try {
      const title = isCustom ? customTitle : selectedChallenge?.title || 'Complex Challenge';
      const desc = isCustom ? customDesc : selectedChallenge?.summary || 'Multi-disciplinary deliberation';
      const res = await api.runCouncilDeliberation(
        title,
        desc,
        selectedExpertIds,
        selectedChallenge?.constraints
      );
      setResult(res);
      setActiveTab('perspectives');
      if (res.expert_perspectives && res.expert_perspectives.length > 0) {
        setExpandedExpert(res.expert_perspectives[0].expert_id);
      }
    } catch (err) {
      console.error('Deliberation error:', err);
    } finally {
      setDeliberating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Feature Technical Explanation Header */}
      <FeatureHeader featureKey="council" />

      {/* Challenge Selector */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-400" />
              Select Deliberation Challenge
            </h2>
            <p className="text-sm text-slate-400">
              Choose a multidisciplinary challenge or define custom mission parameters.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsCustom(true);
                setSelectedChallenge(null);
                setResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isCustom
                  ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              + Custom Challenge
            </button>
          </div>
        </div>

        {/* Preset Cards */}
        {!isCustom ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {challenges.map((c) => {
              const isSelected = selectedChallenge?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectChallenge(c)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 text-left flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-900/20'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {c.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {c.difficulty}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-2 leading-snug">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-3 mb-3">
                      {c.summary}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{c.constraints.length} Core Constraints</span>
                    <span className="text-indigo-400 font-medium flex items-center gap-1">
                      {isSelected ? 'Selected' : 'Select'} <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4 bg-slate-950/50 p-4 rounded-xl border border-indigo-500/30">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Challenge Title
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g., Cislunar Space Tug: Cryogenic Boiling Mitigation & Autonomous Refueling"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Challenge Description & Operational Context
              </label>
              <textarea
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                rows={3}
                placeholder="Describe the multi-disciplinary problem, thermal/mass/cost bounds, and mission horizon..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Selected Challenge Constraints */}
        {selectedChallenge && !isCustom && (
          <div className="mt-4 pt-4 border-t border-slate-800/60">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Active Mission Constraints & Boundaries:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selectedChallenge.constraints.map((cst, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  <span>{cst}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Council Roster Selector */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Council Roster Selection
            </h2>
            <p className="text-sm text-slate-400">
              Select which preserved domain experts will participate in the deliberation chamber.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              {selectedExpertIds.length} of {roster.length} Experts Selected
            </span>
            <button
              onClick={runDeliberation}
              disabled={deliberating || selectedExpertIds.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-semibold text-sm shadow-lg shadow-purple-900/30 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              {deliberating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Deliberating Across Databases...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Summon Council Deliberation
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roster.map((exp) => {
            const isSelected = selectedExpertIds.includes(exp.id);
            return (
              <div
                key={exp.id}
                onClick={() => toggleExpertSelection(exp.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-purple-950/30 border-purple-500/80 shadow-md shadow-purple-900/20'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-60 hover:opacity-100 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={exp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                    alt={exp.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white truncate">{exp.name}</h4>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-slate-700 text-purple-600 focus:ring-0 cursor-pointer"
                      />
                    </div>
                    <p className="text-[11px] text-purple-300 font-medium truncate">{exp.domain}</p>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{exp.title}</p>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>{exp.years_experience} Yrs Experience</span>
                  <span className="text-emerald-400">Verified DNA</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deliberation Chamber Output */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Chamber Overview Banner */}
          <div className="bg-gradient-to-r from-indigo-950/70 via-purple-950/60 to-slate-950/70 border border-purple-500/40 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Deliberation Complete
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {result.epistemic_classification}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">{result.challenge_title}</h2>
                <p className="text-sm text-slate-300 mt-1 max-w-3xl">
                  {result.challenge_description}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Council Quorum</span>
                <span className="text-xl font-bold text-purple-300 font-mono">
                  {result.experts_count} Domain Authorities
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/60 overflow-x-auto">
              <button
                onClick={() => setActiveTab('perspectives')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'perspectives'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Domain Perspectives ({result.expert_perspectives.length})
              </button>
              <button
                onClick={() => setActiveTab('agreements')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'agreements'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Points of Agreement ({result.agreements.length})
              </button>
              <button
                onClick={() => setActiveTab('contentions')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'contentions'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Contentions & Trade-Offs ({result.contentions.length})
              </button>
              <button
                onClick={() => setActiveTab('roadmap')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'roadmap'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Synthesized Recommendation & Roadmap
              </button>
            </div>
          </div>

          {/* TAB 1: EXPERT PERSPECTIVES */}
          {activeTab === 'perspectives' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {result.expert_perspectives.map((p) => {
                const isExpanded = expandedExpert === p.expert_id;
                return (
                  <div
                    key={p.expert_id}
                    className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between"
                  >
                    <div>
                      {/* Expert Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <img
                          src={p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                          alt={p.expert_name}
                          className="w-14 h-14 rounded-2xl object-cover border border-purple-500/40"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white">{p.expert_name}</h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {p.years_experience} Yrs
                            </span>
                          </div>
                          <p className="text-xs text-purple-300 font-medium">{p.domain}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{p.title}</p>
                        </div>
                      </div>

                      {/* Stance Banner */}
                      <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3 mb-4">
                        <span className="text-[10px] font-mono uppercase text-purple-400 block tracking-wider mb-0.5">
                          Primary Domain Stance
                        </span>
                        <p className="text-xs font-semibold text-white">{p.stance}</p>
                      </div>

                      {/* Key Quote */}
                      <blockquote className="border-l-2 border-indigo-500 pl-3 italic text-xs text-slate-300 mb-4 bg-slate-950/30 py-2 rounded-r-lg">
                        "{p.key_quote}"
                      </blockquote>

                      {/* Priorities */}
                      <div className="space-y-2 mb-4">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Key Technical Mandates:
                        </h4>
                        {p.priorities.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="text-purple-400 font-mono mt-0.5 font-bold">
                              {idx + 1}.
                            </span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>

                      {/* Grounded Evidence */}
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 mb-4">
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                          Empirical Database Precedent
                        </span>
                        {p.grounded_evidence}
                      </div>

                      {/* Trade-off willingness */}
                      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
                        <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block mb-1">
                          Acceptable Engineering Compromise
                        </span>
                        {p.trade_off_willingness}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{p.records_count} Preserved Heuristics</span>
                      <span>{p.decisions_count} Reconstructed Decisions</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: POINTS OF AGREEMENT */}
          {activeTab === 'agreements' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 text-xs text-emerald-200">
                <strong>Consensus Engine:</strong> The following areas represent technical synergy
                where multiple distinct disciplines independently reached compatible conclusions.
              </div>
              {result.agreements.map((agr, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-md"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      {agr.topic}
                    </h3>
                    <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {agr.consensus_level}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mb-4">{agr.summary}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {agr.expert_alignments.map((align, aIdx) => (
                      <div
                        key={aIdx}
                        className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 text-xs"
                      >
                        <span className="font-bold text-emerald-400 block mb-1">
                          {align.name}
                        </span>
                        <p className="text-slate-300">{align.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: CONTENTIONS & TRADE-OFFS */}
          {activeTab === 'contentions' && (
            <div className="space-y-4">
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200">
                <strong>Conflict Resolution Radar:</strong> The Council identified physical and
                budgetary tensions between competing domain priorities. Here is how PROJECT ECHO
                synthesizes and reconciles each trade-off.
              </div>
              {result.contentions.map((cnt, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-md"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      {cnt.topic}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {cnt.dimension}
                      </span>
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {cnt.severity}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                      <span className="text-xs font-mono font-bold text-indigo-400 block mb-1">
                        Perspective A — {cnt.perspective_a.advocate}
                      </span>
                      <p className="text-xs text-slate-300">{cnt.perspective_a.position}</p>
                    </div>
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                      <span className="text-xs font-mono font-bold text-pink-400 block mb-1">
                        Perspective B — {cnt.perspective_b.advocate}
                      </span>
                      <p className="text-xs text-slate-300">{cnt.perspective_b.position}</p>
                    </div>
                  </div>

                  {/* Resolution */}
                  <div className="bg-gradient-to-r from-purple-950/40 to-indigo-950/40 p-4 rounded-xl border border-purple-500/30">
                    <span className="text-xs font-mono text-purple-300 font-bold uppercase tracking-wider block mb-1">
                      Synthesized Council Resolution:
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {cnt.synthesis_resolution}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: SYNTHESIZED ROADMAP & RECOMMENDATION */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900/70 to-purple-950/70 border border-indigo-500/40 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="text-lg font-bold text-white mb-2">
                  {result.synthesized_recommendation.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {result.synthesized_recommendation.executive_summary}
                </p>
              </div>

              {/* Balanced Scorecard */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-400" />
                  Synthesized Mission Performance Scorecard
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(result.synthesized_recommendation.balanced_scorecard).map(
                    ([key, val], idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80"
                      >
                        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-bold text-emerald-400">{val}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* 4-Phase Chronological Roadmap */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Chronological Multi-Disciplinary Execution Roadmap
                </h4>
                <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                  {result.synthesized_recommendation.phased_roadmap.map((phase, pIdx) => (
                    <div key={pIdx} className="relative flex items-start gap-4">
                      <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-mono text-xs font-bold border-4 border-slate-950 flex-shrink-0 z-10">
                        {pIdx + 1}
                      </div>
                      <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2">
                          <h5 className="text-sm font-bold text-white">{phase.phase}</h5>
                          <span className="text-xs font-mono text-indigo-400">
                            {phase.timeframe}
                          </span>
                        </div>
                        <p className="text-xs text-purple-300 font-medium mb-3">
                          Lead Domain: {phase.lead_domain}
                        </p>
                        <ul className="space-y-1.5">
                          {phase.actions.map((act, aIdx) => (
                            <li
                              key={aIdx}
                              className="text-xs text-slate-300 flex items-start gap-2"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical Risk Mitigations */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Critical Cross-Domain Risk Vectors & Mitigations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.synthesized_recommendation.critical_risk_mitigations.map((risk, rIdx) => (
                    <div
                      key={rIdx}
                      className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs"
                    >
                      <div className="flex items-start gap-2 text-rose-300 font-semibold mb-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        <span>{risk.risk}</span>
                      </div>
                      <p className="text-slate-300 pl-6 border-l border-slate-800">
                        <strong className="text-emerald-400">Mitigation:</strong> {risk.mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preserved Records Grounding */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Supporting Preserved Evidence Grounding ({result.cited_decisions.length + result.cited_knowledge_records.length} Records)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.cited_decisions.map((d) => (
                    <div
                      key={`d-${d.id}`}
                      className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 text-xs"
                    >
                      <span className="text-[10px] font-mono text-purple-400 block mb-0.5">
                        Decision DNA #{d.id} — {d.expert_name}
                      </span>
                      <h5 className="font-bold text-white mb-1">{d.title}</h5>
                      <p className="text-slate-400 line-clamp-2">
                        Selection: {d.selected_decision}
                      </p>
                    </div>
                  ))}
                  {result.cited_knowledge_records.map((k) => (
                    <div
                      key={`k-${k.id}`}
                      className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 text-xs"
                    >
                      <span className="text-[10px] font-mono text-emerald-400 block mb-0.5">
                        Knowledge Record #{k.id} — {k.expert_name} ({k.category})
                      </span>
                      <h5 className="font-bold text-white mb-1">{k.title}</h5>
                      <p className="text-slate-400 line-clamp-2">
                        {k.takeaways && k.takeaways.length > 0 ? k.takeaways[0] : 'Preserved expert heuristic'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
