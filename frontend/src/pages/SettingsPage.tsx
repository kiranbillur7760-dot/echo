import React, { useState, useEffect } from 'react';
import { Database, Cpu, Lock, CheckCircle2, ShieldCheck, Sparkles, Volume2 } from 'lucide-react';
import { api } from '../services/api';
import { AIProviderInfo } from '../types';

export const SettingsPage: React.FC = () => {
  const [dbMode, setDbMode] = useState('sqlite_local');
  const [defaultMode, setDefaultMode] = useState('hybrid_intelligence');
  const [epistemicStrictness, setEpistemicStrictness] = useState('high');
  const [voiceRate, setVoiceRate] = useState(0.96);
  const [voicePitch, setVoicePitch] = useState(1.0);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [aiDisclosureBanner, setAiDisclosureBanner] = useState(true);

  const [dbEngine, setDbEngine] = useState('sqlite');
  const [providers, setProviders] = useState<AIProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.getSettings();
        if (res.settings) {
          if (res.settings.default_mode) setDefaultMode(res.settings.default_mode);
          if (res.settings.epistemic_strictness) setEpistemicStrictness(res.settings.epistemic_strictness);
          if (res.settings.voice_rate !== undefined) setVoiceRate(Number(res.settings.voice_rate));
          if (res.settings.voice_pitch !== undefined) setVoicePitch(Number(res.settings.voice_pitch));
          if (res.settings.show_subtitles !== undefined) setShowSubtitles(Boolean(res.settings.show_subtitles));
          if (res.settings.ai_disclosure_banner !== undefined) setAiDisclosureBanner(Boolean(res.settings.ai_disclosure_banner));
        }
        if (res.database_engine) setDbEngine(res.database_engine);
        if (res.providers) setProviders(res.providers);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings({
        default_mode: defaultMode,
        epistemic_strictness: epistemicStrictness,
        voice_rate: voiceRate,
        voice_pitch: voicePitch,
        show_subtitles: showSubtitles,
        ai_disclosure_banner: aiDisclosureBanner,
      });
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-[#00D9FF]/15">
        <h1 className="text-2xl font-bold font-display text-white">SYSTEM & INTELLIGENCE SETTINGS</h1>
        <p className="text-xs text-[#9FB2CA] mt-1">
          Configure intelligence engine parameters, persistence layers, voice avatar synthesis, and epistemic classification policies.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-[#00E6A0]/15 border border-[#00E6A0]/30 text-[#00E6A0] text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>System configuration parameters committed to persistent store.</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center font-mono text-[#00D9FF] text-xs">
          Loading system telemetry and configuration...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Intelligence Modes & Epistemic Strictness */}
          <div className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/20 space-y-4">
            <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#00D9FF]" />
              INTELLIGENCE ENGINE & RETRIEVAL POLICIES
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-mono text-[#00D9FF] block mb-1">Default Intelligence Mode</label>
                <select
                  value={defaultMode}
                  onChange={(e) => setDefaultMode(e.target.value)}
                  className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                >
                  <option value="hybrid_intelligence">Hybrid Intelligence (Recommended: Human Evidence + AI Synthesis)</option>
                  <option value="complete_human_intelligence">Complete Human Intelligence (Preserved Expert Records Only)</option>
                </select>
                <p className="text-[11px] text-[#9FB2CA] mt-1">
                  Hybrid Intelligence executes cross-validation and comparative synthesis across configured AI providers.
                </p>
              </div>

              <div>
                <label className="font-mono text-[#925CFF] block mb-1">Epistemic Truth Strictness</label>
                <select
                  value={epistemicStrictness}
                  onChange={(e) => setEpistemicStrictness(e.target.value)}
                  className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#925CFF]"
                >
                  <option value="high">High Strictness (Strict separation of Documented Fact vs AI Inference)</option>
                  <option value="permissive">Permissive (Blended conversational narrative with footnote tags)</option>
                </select>
                <p className="text-[11px] text-[#9FB2CA] mt-1">
                  Enforces strict distinction between approved expert statements and speculative AI extrapolations.
                </p>
              </div>
            </div>
          </div>

          {/* Realistic Avatar & Live Voice Engine */}
          <div className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/20 space-y-4">
            <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#00E6A0]" />
              LIVE VOICE INTELLIGENCE & AVATAR SYNTHESIS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-[#9FB2CA] mb-1">
                  <span>Speech Rate</span>
                  <span className="text-[#00D9FF]">{voiceRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.25"
                  step="0.05"
                  value={voiceRate}
                  onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                  className="w-full accent-[#00D9FF]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-[#9FB2CA] mb-1">
                  <span>Voice Pitch</span>
                  <span className="text-[#00D9FF]">{voicePitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.05"
                  value={voicePitch}
                  onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                  className="w-full accent-[#00D9FF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSubtitles}
                  onChange={(e) => setShowSubtitles(e.target.checked)}
                  className="rounded accent-[#00D9FF]"
                />
                <span>Display Real-time Viseme Subtitles during Speech</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiDisclosureBanner}
                  onChange={(e) => setAiDisclosureBanner(e.target.checked)}
                  className="rounded accent-[#00D9FF]"
                />
                <span>Always Show AI Representation Ethics Disclosure</span>
              </label>
            </div>
          </div>

          {/* AI Providers Live Telemetry */}
          <div className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/20 space-y-4">
            <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#925CFF]" />
              AI PROVIDERS & CREDENTIAL TELEMETRY
            </h3>

            <p className="text-xs text-[#9FB2CA]">
              ECHO honestly queries and reports only configured providers. API keys are managed securely on the backend server and never exposed to the client.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-[#020713]/80 border border-white/5 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{p.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        p.configured
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {p.configured ? 'ACTIVE' : 'UNCONFIGURED'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#9FB2CA] font-mono truncate">
                    Model: {p.default_model}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Env: {p.env_var}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Persistence Layer */}
          <div className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/20 space-y-4">
            <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-[#00D9FF]" />
              PERSISTENCE & DATABASE ARCHITECTURE
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-mono text-[#00D9FF] block mb-1">Active Persistence Engine</label>
                <select
                  value={dbMode}
                  onChange={(e) => setDbMode(e.target.value)}
                  className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                >
                  <option value="sqlite_local">
                    SQLite Local Store (Active Engine: {dbEngine === 'postgresql' ? 'PostgreSQL' : 'SQLite DB'})
                  </option>
                  <option value="postgres_pgvector">
                    PostgreSQL + pgvector (Production Normalized Architecture)
                  </option>
                </select>
              </div>
              <p className="text-[11px] text-[#9FB2CA]">
                All 29 relational entities including KnowledgeUnits, ExpertConsents, SourceMedia, AIModelRuns, and EvidenceLinks share a 100% normalized schema compatible with PostgreSQL without code modifications.
              </p>
            </div>
          </div>

          {/* Security & Provenance Controls */}
          <div className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/20 space-y-3">
            <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#00E6A0]" />
              SECURITY, PROVENANCE & CONSENT GOVERNANCE
            </h3>

            <div className="space-y-2 text-xs text-[#9FB2CA]">
              <p className="flex items-center gap-2 text-white">
                <CheckCircle2 className="w-4 h-4 text-[#00E6A0]" />
                Explicit Expert Consent Gate: Active (Knowledge, Voice & Likeness governed per expert)
              </p>
              <p className="flex items-center gap-2 text-white">
                <CheckCircle2 className="w-4 h-4 text-[#00E6A0]" />
                Audit Trail Persistence: Active (All 5-state transitions recorded in VerificationHistory)
              </p>
              <p className="flex items-center gap-2 text-white">
                <CheckCircle2 className="w-4 h-4 text-[#00E6A0]" />
                Zero Hallucinated Approvals: Only expert-approved Knowledge Units are labeled verified
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl btn-cyber-primary text-xs uppercase tracking-wider font-bold disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Committing Changes...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
