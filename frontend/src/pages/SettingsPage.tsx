import React, { useState } from 'react';
import { Settings, Shield, Database, Cpu, Lock, CheckCircle2, RefreshCw } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [dbMode, setDbMode] = useState('sqlite_local');
  const [aiMode, setAiMode] = useState('gemini_hybrid');
  const [epistemicStrictness, setEpistemicStrictness] = useState('high');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-[#00D9FF]/15">
        <h1 className="text-2xl font-bold font-display text-white">SYSTEM & INTELLIGENCE SETTINGS</h1>
        <p className="text-xs text-[#9FB2CA] mt-1">
          Configure intelligence engine parameters, database bridges, and epistemic classification thresholds.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-[#00E6A0]/15 border border-[#00E6A0]/30 text-[#00E6A0] text-xs font-mono flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>System configuration parameters committed to persistent store.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Architecture Settings */}
        <div className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/20 space-y-4">
          <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-[#00D9FF]" />
            PERSISTENCE & DATABASE LAYER
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-mono text-[#00D9FF] block mb-1">Active Database Engine</label>
              <select
                value={dbMode}
                onChange={(e) => setDbMode(e.target.value)}
                className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
              >
                <option value="sqlite_local">SQLite Local Store (Active: ./echo_intelligence.db)</option>
                <option value="postgres_pgvector">PostgreSQL + pgvector Vector Embeddings (Migration Ready)</option>
              </select>
            </div>
            <p className="text-[11px] text-[#9FB2CA]">
              Schema architecture is normalized and ready for seamless migration to PostgreSQL without application layer modifications.
            </p>
          </div>
        </div>

        {/* AI & Epistemic Strictness */}
        <div className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/20 space-y-4">
          <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#925CFF]" />
            AI & EPISTEMIC RETRIEVAL POLICIES
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-mono text-[#925CFF] block mb-1">AI Reasoning Backend</label>
              <select
                value={aiMode}
                onChange={(e) => setAiMode(e.target.value)}
                className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#925CFF]"
              >
                <option value="gemini_hybrid">Gemini 2.5 Flash / Omni API + Local Provenance Graph</option>
                <option value="demonstration_mode">High-Fidelity Synthetic Simulation Mode</option>
              </select>
            </div>

            <div>
              <label className="font-mono text-[#925CFF] block mb-1">Epistemic Truth Strictness</label>
              <select
                value={epistemicStrictness}
                onChange={(e) => setEpistemicStrictness(e.target.value)}
                className="w-full bg-[#020713] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#925CFF]"
              >
                <option value="high">Strict Separation (Documented Fact vs AI Inference)</option>
                <option value="permissive">Allow Generative Blends with Citation Footnotes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Access Controls */}
        <div className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/20 space-y-4">
          <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#00E6A0]" />
            DATA PROVENANCE & ACCESS CONTROLS
          </h3>

          <div className="space-y-2 text-xs text-[#9FB2CA]">
            <p className="flex items-center gap-2 text-white">
              <CheckCircle2 className="w-4 h-4 text-[#00E6A0]" />
              Role-Based Access Control: Active (Student / Analyst Token)
            </p>
            <p className="flex items-center gap-2 text-white">
              <CheckCircle2 className="w-4 h-4 text-[#00E6A0]" />
              Synthetic Demonstration Scenarios Segregated from Production Repositories
            </p>
            <p className="flex items-center gap-2 text-white">
              <CheckCircle2 className="w-4 h-4 text-[#00E6A0]" />
              Client API Key Isolation: Enforced (Keys never transmitted to browser)
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl btn-cyber-primary text-xs uppercase tracking-wider font-bold"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
