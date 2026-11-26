import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sliders,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Scale,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Flame,
  Zap,
  Weight,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';
import { FeatureHeader } from '../components/FeatureInfoModal';
import {
  TimeMachineDecision,
  TimeMachineDecisionDetail,
  TimeMachineSimulationResult
} from '../types';

export const DecisionTimeMachinePage: React.FC = () => {
  const [decisions, setDecisions] = useState<TimeMachineDecision[]>([]);
  const [selectedDecisionId, setSelectedDecisionId] = useState<number | null>(null);
  const [detail, setDetail] = useState<TimeMachineDecisionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<TimeMachineSimulationResult | null>(null);

  // Dynamic parameters state
  const [aerothermalParams, setAerothermalParams] = useState({
    temperature_c: 1720,
    mass_budget_kg: 145,
    flight_reusability: 15,
    cost_budget_m: 45,
    allow_ablation: false
  });

  const [lifeSupportParams, setLifeSupportParams] = useState({
    crew_size: 6,
    power_budget_kw: 4.2,
    water_recovery_percent: 98.0,
    edible_biomass_percent: 25.0
  });

  const [radiationParams, setRadiationParams] = useState({
    dose_limit_msv: 150,
    areal_mass_limit: 42,
    mission_days: 1000
  });

  const [logisticsParams, setLogisticsParams] = useState({
    capex_budget_b: 14.0,
    payload_cap_tons: 180.0,
    launch_windows: 3
  });

  useEffect(() => {
    loadDecisions();
  }, []);

  const loadDecisions = async () => {
    setLoading(true);
    try {
      const list = await api.getTimeMachineDecisions();
      setDecisions(list);
      if (list.length > 0) {
        handleSelectDecision(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load time machine decisions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDecision = async (id: number) => {
    setSelectedDecisionId(id);
    setDetailLoading(true);
    setSimulationResult(null);
    try {
      const d = await api.getTimeMachineDecisionDetail(id);
      setDetail(d);

      // Reset parameters to baseline for that decision
      if (d.title.includes('Mach 7+') || d.expert_name.includes('Morgan')) {
        setAerothermalParams({
          temperature_c: 1720,
          mass_budget_kg: 145,
          flight_reusability: 15,
          cost_budget_m: 45,
          allow_ablation: false
        });
      } else if (d.title.includes('CO2') || d.expert_name.includes('Rostova')) {
        setLifeSupportParams({
          crew_size: 6,
          power_budget_kw: 4.2,
          water_recovery_percent: 98.0,
          edible_biomass_percent: 25.0
        });
      } else if (d.title.includes('Radiation') || d.expert_name.includes('Vance')) {
        setRadiationParams({
          dose_limit_msv: 150,
          areal_mass_limit: 42,
          mission_days: 1000
        });
      } else if (d.title.includes('Logistics') || d.expert_name.includes('Lin') || d.title.includes('ISRU')) {
        setLogisticsParams({
          capex_budget_b: 14.0,
          payload_cap_tons: 180.0,
          launch_windows: 3
        });
      }
    } catch (err) {
      console.error('Failed to load decision detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const runSimulation = async () => {
    if (!selectedDecisionId || !detail) return;
    setSimulating(true);
    try {
      let params: Record<string, any> = {};
      if (detail.title.includes('Mach 7+') || detail.expert_name.includes('Morgan')) {
        params = aerothermalParams;
      } else if (detail.title.includes('CO2') || detail.expert_name.includes('Rostova')) {
        params = lifeSupportParams;
      } else if (detail.title.includes('Radiation') || detail.expert_name.includes('Vance')) {
        params = radiationParams;
      } else if (detail.title.includes('Logistics') || detail.expert_name.includes('Lin') || detail.title.includes('ISRU')) {
        params = logisticsParams;
      }

      const res = await api.simulateTimeMachineBranch(selectedDecisionId, params);
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Helper for epistemic tier styling
  const getEpistemicBadgeColor = (classification: string) => {
    if (classification.includes('Tier 1')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (classification.includes('Tier 2')) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    if (classification.includes('Tier 3')) return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    if (classification.includes('Tier 4')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Feature Header */}
      <FeatureHeader featureKey="time-machine" />

      {/* Decision DNA Selector */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          Select Preserved Decision DNA to Replay
        </h2>
        <p className="text-sm text-slate-400 mb-5">
          Select an empirical expert decision from the database to inspect its original baseline and manipulate its boundary constraints.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {decisions.map((d) => {
            const isSelected = selectedDecisionId === d.id;
            return (
              <div
                key={d.id}
                onClick={() => handleSelectDecision(d.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 text-left flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/80 shadow-lg shadow-cyan-900/20'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      DNA #{d.id}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-medium">
                      {(d.confidence_rating * 100).toFixed(0)}% Conf
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1 leading-snug line-clamp-2">
                    {d.title}
                  </h3>
                  <p className="text-[11px] text-cyan-300 font-medium mb-2">{d.expert_name}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-3">
                    {d.problem_definition}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{d.expert_domain || 'Aerospace'}</span>
                  <span className="text-cyan-400 font-medium flex items-center gap-1">
                    {isSelected ? 'Loaded' : 'Replay'} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Simulation Workspace */}
      {detail && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Original Decision Baseline (4 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Original Historical Baseline
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Flight / Test Validated
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{detail.title}</h3>
              <p className="text-xs text-purple-300 font-medium mb-3">
                Lead Authority: {detail.expert_name} ({detail.expert_domain})
              </p>

              <div className="space-y-4 text-xs">
                {/* Selected Choice */}
                <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                    Historical Decision Selected:
                  </span>
                  <p className="text-xs font-bold text-white">{detail.selected_decision}</p>
                </div>

                {/* Original Constraints */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Original Baseline Constraints:
                  </h4>
                  <div className="space-y-1.5">
                    {detail.original_constraints.map((cst, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-slate-300 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                        <span>{cst}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Original Reasoning */}
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    Expert Causal Rationale:
                  </span>
                  <p className="text-slate-300 leading-relaxed line-clamp-6">
                    {detail.original_reasoning}
                  </p>
                </div>

                {/* Rejected Alternatives */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Originally Rejected Alternatives ({detail.alternatives.length}):
                  </h4>
                  <div className="space-y-2">
                    {detail.alternatives.map((alt, i) => (
                      <div
                        key={i}
                        className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-white">{alt.title}</span>
                          <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                            {alt.estimated_risk} Risk
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] mb-1">{alt.why_rejected}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Interactive Constraint Sliders & Branch Calculator (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Constraint Manipulation Console */}
            <div className="bg-slate-900/70 border border-cyan-500/30 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-cyan-400" />
                    Boundary Constraint Manipulation Console
                  </h3>
                  <p className="text-xs text-slate-400">
                    Adjust key physical parameters to stress-test whether the original decision survives or branches.
                  </p>
                </div>
                <button
                  onClick={runSimulation}
                  disabled={simulating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-900/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all flex-shrink-0"
                >
                  {simulating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Computing Branching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Simulate Counterfactual Branch
                    </>
                  )}
                </button>
              </div>

              {/* SLIDERS BASED ON DECISION TYPE */}
              {/* Type 1: Aerothermal / Alex Morgan */}
              {(detail.title.includes('Mach 7+') || detail.expert_name.includes('Morgan')) && (
                <div className="space-y-5">
                  {/* Temperature */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400" /> Peak Stagnation Temperature
                      </span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {aerothermalParams.temperature_c}°C{' '}
                        <span className="text-[10px] text-slate-400">(Baseline: 1,720°C)</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1400}
                      max={2400}
                      step={20}
                      value={aerothermalParams.temperature_c}
                      onChange={(e) =>
                        setAerothermalParams({
                          ...aerothermalParams,
                          temperature_c: Number(e.target.value)
                        })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                      <span>1,400°C (Mach 5)</span>
                      <span>1,900°C (C/SiC Thermal Limit)</span>
                      <span>2,400°C (Mach 10+ Shock)</span>
                    </div>
                  </div>

                  {/* Mass Budget */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Weight className="w-3.5 h-3.5 text-indigo-400" /> Leading-Edge Assembly Mass Budget
                      </span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {aerothermalParams.mass_budget_kg} kg{' '}
                        <span className="text-[10px] text-slate-400">(Baseline: 145 kg)</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={80}
                      max={300}
                      step={5}
                      value={aerothermalParams.mass_budget_kg}
                      onChange={(e) =>
                        setAerothermalParams({
                          ...aerothermalParams,
                          mass_budget_kg: Number(e.target.value)
                        })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                      <span>80 kg (Strict Weight Limit)</span>
                      <span>145 kg (Original Ceiling)</span>
                      <span>300 kg (Heavy Booster)</span>
                    </div>
                  </div>

                  {/* Reusability */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Target Flight Reusability
                      </span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {aerothermalParams.flight_reusability} Flights{' '}
                        <span className="text-[10px] text-slate-400">(Baseline: 15 Flights)</span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      step={1}
                      value={aerothermalParams.flight_reusability}
                      onChange={(e) =>
                        setAerothermalParams({
                          ...aerothermalParams,
                          flight_reusability: Number(e.target.value)
                        })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                      <span>1 Flight (Expendable)</span>
                      <span>15 Flights (Nominal)</span>
                      <span>50 Flights (Commercial High-Cadence)</span>
                    </div>
                  </div>

                  {/* Ablation Toggle */}
                  <div className="pt-2 flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Allow Consumable Ablative Shape Change
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Permits nose-cap material recession (sacrifices hypersonic aerodynamic L/D ratio).
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={aerothermalParams.allow_ablation}
                      onChange={(e) =>
                        setAerothermalParams({
                          ...aerothermalParams,
                          allow_ablation: e.target.checked
                        })
                      }
                      className="w-5 h-5 rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Type 2: Life Support / Elena Rostova */}
              {(detail.title.includes('CO2') || detail.expert_name.includes('Rostova')) && (
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-300">Crew Size Supported</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {lifeSupportParams.crew_size} Persons (Baseline: 6)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={12}
                      step={1}
                      value={lifeSupportParams.crew_size}
                      onChange={(e) =>
                        setLifeSupportParams({
                          ...lifeSupportParams,
                          crew_size: Number(e.target.value)
                        })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-300">Continuous Electrical Power Budget</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {lifeSupportParams.power_budget_kw} kW (Baseline: 4.2 kW)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2.0}
                      max={10.0}
                      step={0.2}
                      value={lifeSupportParams.power_budget_kw}
                      onChange={(e) =>
                        setLifeSupportParams({
                          ...lifeSupportParams,
                          power_budget_kw: Number(e.target.value)
                        })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-300">Crew Food Autotrophy Offset Target</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {lifeSupportParams.edible_biomass_percent}% (Baseline: 25%)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={5}
                      value={lifeSupportParams.edible_biomass_percent}
                      onChange={(e) =>
                        setLifeSupportParams({
                          ...lifeSupportParams,
                          edible_biomass_percent: Number(e.target.value)
                        })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Type 3: Radiation / Marcus Vance */}
              {(detail.title.includes('Radiation') || detail.expert_name.includes('Vance')) && (
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-300">Annual Biological Dose Limit</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {radiationParams.dose_limit_msv} mSv/yr (NASA Cap: 150 mSv)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={300}
                      step={10}
                      value={radiationParams.dose_limit_msv}
                      onChange={(e) =>
                        setRadiationParams({
                          ...radiationParams,
                          dose_limit_msv: Number(e.target.value)
                        })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-300">Areal Mass Limit</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {radiationParams.areal_mass_limit} g/cm² (Baseline: 42 g/cm²)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={80}
                      step={2}
                      value={radiationParams.areal_mass_limit}
                      onChange={(e) =>
                        setRadiationParams({
                          ...radiationParams,
                          areal_mass_limit: Number(e.target.value)
                        })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Type 4: Logistics / Sarah Lin */}
              {(detail.title.includes('Logistics') || detail.expert_name.includes('Lin') || detail.title.includes('ISRU')) && (
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-300">Total Program CAPEX Budget</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        ${logisticsParams.capex_budget_b} Billion (Baseline: $14B)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={6.0}
                      max={25.0}
                      step={0.5}
                      value={logisticsParams.capex_budget_b}
                      onChange={(e) =>
                        setLogisticsParams({
                          ...logisticsParams,
                          capex_budget_b: Number(e.target.value)
                        })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-300">Earth Lifted Payload Mass Cap</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {logisticsParams.payload_cap_tons} Metric Tons (Baseline: 180t)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={80}
                      max={260}
                      step={10}
                      value={logisticsParams.payload_cap_tons}
                      onChange={(e) =>
                        setLogisticsParams({
                          ...logisticsParams,
                          payload_cap_tons: Number(e.target.value)
                        })
                      }
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SIMULATION OUTPUT */}
            {simulationResult && (
              <div className="space-y-5 animate-fade-in">
                {/* Branch Outcome Banner */}
                <div className="bg-gradient-to-br from-cyan-950/70 via-slate-900/80 to-blue-950/70 border border-cyan-500/40 rounded-2xl p-6 backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                      <GitBranch className="w-4 h-4 text-cyan-400" />
                      Dynamic Branching Execution Result
                    </span>
                    <span
                      className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${getEpistemicBadgeColor(
                        simulationResult.epistemic_truth_classification
                      )}`}
                    >
                      {simulationResult.epistemic_truth_classification}
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className="text-[11px] font-mono text-slate-400 block mb-0.5">
                      Simulated Architecture Selection:
                    </span>
                    <h3 className="text-xl font-bold text-white">
                      {simulationResult.simulated_selected_decision}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800 mb-4">
                    {simulationResult.branch_rationale}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 font-mono">Branch Risk Rating: </span>
                      <strong className="text-amber-400">{simulationResult.branch_risk_rating}</strong>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 font-mono">Constraint Status: </span>
                      <strong
                        className={
                          simulationResult.feasibility_status === 'FEASIBLE'
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }
                      >
                        {simulationResult.feasibility_status}
                      </strong>
                    </div>
                  </div>

                  {/* Warnings */}
                  {simulationResult.warnings.length > 0 && (
                    <div className="mt-4 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 space-y-1">
                      {simulationResult.warnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Original vs Simulated Comparison Table */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-cyan-400" />
                    Original vs Counterfactual Branch Comparison
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-mono">
                          <th className="py-2.5 px-3 font-semibold">Parameter / Metric</th>
                          <th className="py-2.5 px-3 font-semibold">Original Baseline</th>
                          <th className="py-2.5 px-3 font-semibold">Simulated Branch</th>
                          <th className="py-2.5 px-3 font-semibold">Variance (Δ)</th>
                          <th className="py-2.5 px-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {simulationResult.comparison_table.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 px-3 font-medium text-white">{row.parameter}</td>
                            <td className="py-2.5 px-3 text-slate-300 font-mono">
                              {row.original_baseline}
                            </td>
                            <td className="py-2.5 px-3 text-cyan-300 font-mono font-semibold">
                              {row.simulated_branch}
                            </td>
                            <td className="py-2.5 px-3 text-amber-300 font-mono">{row.delta}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  row.status === 'PASS' || row.status === 'Preserved L/D' || row.status === 'Within Budget'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : row.status.includes('VIOLATION') || row.status.includes('OVERRUN')
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Causal Chain Explanation */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    Causal Logic Deduction Chain
                  </h4>
                  <div className="space-y-2">
                    {simulationResult.causal_chain.map((step, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 font-mono"
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
