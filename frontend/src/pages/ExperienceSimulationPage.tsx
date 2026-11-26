import React, { useState } from 'react';
import { api } from '../services/api';
import { SimulationResult } from '../types';
import { FeatureHeader } from '../components/FeatureInfoModal';
import {
  Compass,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Layers,
  FileCheck,
  CheckCircle2,
  HelpCircle,
  TrendingUp
} from 'lucide-react';

export const ExperienceSimulationPage: React.FC = () => {
  const [problemTitle, setProblemTitle] = useState(
    'Scramjet Cowl Leading Edge Thermal Shock Mitigation at Mach 8'
  );
  const [problemDescription, setProblemDescription] = useState(
    'We are engineering an uncooled cowl leading edge subjected to 1800°C transient shock-shock aerothermal impingement. Total structural weight allowance is restricted to 140 kg, and reusability over 15 flight cycles is mandatory without ablative profile recession.'
  );
  const [constraintsText, setConstraintsText] = useState(
    'Total assembly mass <= 140 kg\nNon-ablative reusability (zero shape change)\nOperating temperature ceiling 1850°C\nInterface temperature with titanium airframe <= 200°C'
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const constraints = constraintsText
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      const res = await api.runSimulation({
        problem_title: problemTitle,
        problem_description: problemDescription,
        operating_constraints: constraints,
        domain: 'Aerospace Engineering',
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = (sampleType: 'scramjet' | 'cryo') => {
    if (sampleType === 'scramjet') {
      setProblemTitle('Scramjet Cowl Leading Edge Thermal Shock Mitigation at Mach 8');
      setProblemDescription(
        'We are engineering an uncooled cowl leading edge subjected to 1800°C transient shock-shock aerothermal impingement. Total structural weight allowance is restricted to 140 kg, and reusability over 15 flight cycles is mandatory without ablative profile recession.'
      );
      setConstraintsText(
        'Total assembly mass <= 140 kg\nNon-ablative reusability (zero shape change)\nOperating temperature ceiling 1850°C\nInterface temperature with titanium airframe <= 200°C'
      );
    } else {
      setProblemTitle('Cryogenic Hydrogen Tank Shielding Under Peak Dynamic Pressure');
      setProblemDescription(
        'We require an ultra-lightweight exterior aerothermal shield for an integrated composite cryogenic liquid hydrogen tank during transonic launch ascent.'
      );
      setConstraintsText(
        'Tank structural temperature must remain below -250°C internally\nAcoustic buffet load tolerance > 158 dB\nWeight penalty <= 95 kg'
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Feature Explanation & Demo Stage Header */}
      <FeatureHeader featureKey="simulation" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#00D9FF]/15">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">EXPERIENCE SIMULATION ENGINE</h1>
          <p className="text-xs text-[#9FB2CA] mt-1">
            Explore prospective architectural approaches to new engineering dilemmas grounded strictly in historical expert decision patterns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLoadSample('scramjet')}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-[#07182B] border border-[#00D9FF]/20 text-[#00D9FF] hover:bg-[#00D9FF]/10 transition"
          >
            Sample: Mach 8 Scramjet
          </button>
          <button
            onClick={() => handleLoadSample('cryo')}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-[#07182B] border border-[#167BFF]/20 text-[#167BFF] hover:bg-[#167BFF]/10 transition"
          >
            Sample: Cryo Tank
          </button>
        </div>
      </div>

      {/* Input Formulation Form */}
      <div className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/25">
        <form onSubmit={handleSimulate} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-[#00D9FF] block mb-1">
              Problem Statement Title
            </label>
            <input
              type="text"
              required
              value={problemTitle}
              onChange={(e) => setProblemTitle(e.target.value)}
              className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-[#00D9FF] block mb-1">
                Context & Operational Description
              </label>
              <textarea
                required
                rows={4}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-[#00D9FF] block mb-1">
                Operating Constraints (One per line)
              </label>
              <textarea
                required
                rows={4}
                value={constraintsText}
                onChange={(e) => setConstraintsText(e.target.value)}
                className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#00D9FF]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] font-mono text-[#9FB2CA]">
              Grounding: Dr. Alex Morgan • Historical Flight Records
            </span>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl btn-cyber-primary text-xs uppercase tracking-wider font-bold flex items-center gap-2"
            >
              {loading ? 'Synthesizing Decision Precedents...' : 'Execute Simulation'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Simulation Results Display */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Epistemic Disclaimer Banner */}
          <div className="p-4 rounded-xl bg-[#925CFF]/15 border border-[#925CFF]/30 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#925CFF] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-mono text-[#925CFF] font-bold uppercase tracking-wider">
                EPISTEMIC BOUNDARY NOTICE
              </h4>
              <p className="text-xs text-white/90 leading-relaxed mt-0.5">
                {result.epistemic_disclaimer}
              </p>
            </div>
          </div>

          {/* Matched Historical Precedents */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold font-display text-white">
              RETRIEVED HISTORICAL PRECEDENTS ({result.relevant_historical_decisions.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.relevant_historical_decisions.map((hist, i) => (
                <div key={i} className="p-5 rounded-2xl glass-panel border border-[#00D9FF]/20 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[#00D9FF] font-semibold text-[11px]">
                      Match Score: {Math.round(hist.similarity_score * 100)}%
                    </span>
                    <span className="text-[#9FB2CA] font-mono text-[10px]">{hist.expert_name}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-2">{hist.title}</h4>

                  <div className="space-y-2 mt-3 text-[11px]">
                    <div>
                      <span className="font-mono text-[#00E6A0] uppercase block">
                        Similar Operating Factors:
                      </span>
                      {hist.key_similarities.map((s, idx) => (
                        <p key={idx} className="text-[#9FB2CA] pl-2 border-l border-[#00E6A0]/40">
                          {s}
                        </p>
                      ))}
                    </div>

                    <div>
                      <span className="font-mono text-[#F59E0B] uppercase block">
                        Points of Divergence:
                      </span>
                      {hist.key_differences.map((d, idx) => (
                        <p key={idx} className="text-[#9FB2CA] pl-2 border-l border-[#F59E0B]/40">
                          {d}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Synthesized Approaches */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold font-display text-white">
              SYNTHESIZED ARCHITECTURAL APPROACHES
            </h3>

            <div className="space-y-6">
              {result.recommended_approaches.map((appr, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/25 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-[#00D9FF] uppercase tracking-wider">
                        Strategy Approach #{idx + 1}
                      </span>
                      <h4 className="text-base font-bold text-white mt-0.5">{appr.approach_name}</h4>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-semibold self-start sm:self-auto ${
                        appr.confidence_level === 'High'
                          ? 'bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30'
                          : 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                      }`}
                    >
                      {appr.confidence_level} Confidence
                    </span>
                  </div>

                  <p className="text-xs text-[#9FB2CA] leading-relaxed">{appr.strategy_summary}</p>

                  <div className="p-3.5 rounded-xl bg-[#020713]/70 border border-white/5 text-xs">
                    <span className="font-mono text-[10px] text-[#167BFF] uppercase block mb-1">
                      Historical Grounding Precedent
                    </span>
                    <p className="text-white text-[11px] leading-relaxed">{appr.historical_grounding}</p>
                  </div>

                  {/* Projected Tradeoffs Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(appr.projected_tradeoffs).map(([k, v]) => (
                      <div key={k} className="p-3 rounded-lg bg-white/5 text-xs">
                        <span className="text-[10px] font-mono text-[#00D9FF] block uppercase">{k}</span>
                        <span className="text-white font-medium text-[11px] mt-0.5 block">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Explicit AI Inferences */}
                  <div className="p-4 rounded-xl bg-[#925CFF]/10 border border-[#925CFF]/20 space-y-2">
                    <span className="text-[10px] font-mono text-[#925CFF] uppercase font-bold tracking-wider block">
                      AI-GENERATED INFERENCES (MODEL EXTRAPOLATION)
                    </span>
                    {appr.ai_inferences.map((inf, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-white">
                        <Sparkles className="w-3.5 h-3.5 text-[#925CFF] flex-shrink-0 mt-0.5" />
                        <span className="text-[11px]">{inf}</span>
                      </div>
                    ))}
                  </div>

                  {/* Missing Information / Parameters to Verify */}
                  <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 space-y-2">
                    <span className="text-[10px] font-mono text-[#F59E0B] uppercase font-bold tracking-wider block">
                      MISSING INFORMATION TO VERIFY BEFORE COMMITTING
                    </span>
                    {appr.missing_parameters.map((param, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#9FB2CA]">
                        <HelpCircle className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                        <span className="text-[11px]">{param}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
