import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  AskEchoMode,
  AskEchoResult,
  AIProviderInfo,
  CitationSource,
  ConversationTurn,
} from '../types';
import { FeatureHeader } from '../components/FeatureInfoModal';
import {
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Database,
  CheckCircle2,
  Cpu,
  Send,
  Trash2,
  UserCheck,
  AlertCircle,
  GitMerge,
  Scale,
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'echo';
  queryText?: string;
  mode?: AskEchoMode;
  result?: AskEchoResult;
  timestamp: string;
}

const MODE_OPTIONS: Array<{
  id: AskEchoMode;
  label: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
}> = [
  {
    id: 'human_expert',
    label: 'HUMAN EXPERT',
    subtitle: 'Strictly preserved ECHO records',
    icon: UserCheck,
  },
  {
    id: 'ai_intelligence',
    label: 'AI INTELLIGENCE',
    subtitle: 'Direct external AI model',
    icon: Cpu,
  },
  {
    id: 'hybrid_intelligence',
    label: 'HYBRID INTELLIGENCE',
    subtitle: 'Human Experience + AI Analysis',
    icon: GitMerge,
  },
];

const LOADING_STAGES: Record<AskEchoMode, string[]> = {
  human_expert: [
    '1. Parsing natural-language question & intent...',
    '2. Searching Experts, PDFs, Decision DNA & Lessons...',
    '3. Verifying epistemic provenance & citations...',
  ],
  ai_intelligence: [
    '1. Parsing question & conversation context...',
    '2. Dispatching query to selected AI provider...',
    '3. Formatting analytical response & limitations...',
  ],
  hybrid_intelligence: [
    '1. Understanding problem, domain & constraints...',
    '2. Retrieving human expertise & Decision DNA...',
    '3. Running AI analysis over retrieved evidence...',
    '4. Comparing agreements, disagreements & synthesizing...',
  ],
};

export const AskEchoPage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AskEchoMode>('hybrid_intelligence');
  const [providers, setProviders] = useState<AIProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('auto');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [expertsList, setExpertsList] = useState<any[]>([]);
  const [domainsList, setDomainsList] = useState<string[]>([]);
  const [selectedExpertFilter, setSelectedExpertFilter] = useState<number | undefined>(undefined);
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('all');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStageIdx, setLoadingStageIdx] = useState(0);
  const [activeCitation, setActiveCitation] = useState<CitationSource | null>(null);
  const [expandedExperts, setExpandedExperts] = useState<Record<string, boolean>>({});
  const [sampleQueries, setSampleQueries] = useState<any[]>([]);
  const [showExamples, setShowExamples] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyProvider, setKeyProvider] = useState<string>('gemini');
  const [keyInput, setKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyStatusMsg, setKeyStatusMsg] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialMetadata();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) {
      setLoadingStageIdx(0);
      return;
    }
    const stages = LOADING_STAGES[mode];
    const timer = setInterval(() => {
      setLoadingStageIdx((prev) => (prev + 1 < stages.length ? prev + 1 : prev));
    }, 850);
    return () => clearInterval(timer);
  }, [loading, mode]);

  const loadInitialMetadata = async () => {
    try {
      const [samples, provs, expDom] = await Promise.all([
        api.getAskEchoSampleQueries(),
        api.getAskEchoProviders(),
        api.getAskEchoExpertsDomains(),
      ]);
      setSampleQueries(samples);
      setProviders(provs);
      setExpertsList(expDom.experts || []);
      setDomainsList(expDom.domains || []);
      const firstLlmConfigured = provs.find((p: AIProviderInfo) => p.configured && p.id !== 'web_search');
      if (firstLlmConfigured) {
        setSelectedProvider(firstLlmConfigured.id);
        setSelectedModel(firstLlmConfigured.default_model);
      } else {
        setSelectedProvider('auto');
        setSelectedModel('');
      }
    } catch (err) {
      console.error('Failed to load Ask ECHO metadata:', err);
    }
  };

  const handleProviderChange = (pid: string) => {
    setSelectedProvider(pid);
    if (pid === 'auto') {
      setSelectedModel('');
      return;
    }
    const found = providers.find((p) => p.id === pid);
    setSelectedModel(found ? found.default_model : '');
  };

  const handleSaveProviderKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim() || savingKey) return;
    setSavingKey(true);
    setKeyStatusMsg(null);
    try {
      const res = await api.configureAskEchoProvider(keyProvider, keyInput.trim());
      setKeyStatusMsg(res.message);
      if (res.success) {
        const provs = await api.getAskEchoProviders();
        setProviders(provs);
        handleProviderChange(keyProvider);
        setKeyInput('');
        setTimeout(() => {
          setShowKeyModal(false);
          setKeyStatusMsg(null);
        }, 900);
      }
    } catch {
      setKeyStatusMsg('Failed to connect to backend to save API key.');
    } finally {
      setSavingKey(false);
    }
  };

  const handleExecuteQuery = async (queryToRun: string) => {
    if (!queryToRun.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      queryText: queryToRun,
      mode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const historyTurns: ConversationTurn[] = messages
        .filter((m) => m.sender === 'echo' && m.result)
        .slice(-3)
        .map((m) => ({
          query: m.result!.query,
          answer: m.result!.hybrid_recommendation || m.result!.narrative_answer,
          expert_name: m.result!.primary_expert?.name,
        }));

      const res = await api.askEcho(queryToRun, historyTurns, selectedExpertFilter, {
        mode,
        aiProvider: selectedProvider,
        aiModel: selectedModel || undefined,
        focusDomain: selectedDomainFilter !== 'all' ? selectedDomainFilter : undefined,
      });

      const echoMessage: ChatMessage = {
        id: `e-${Date.now()}`,
        sender: 'echo',
        mode,
        result: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, echoMessage]);
    } catch (err) {
      console.error('Ask ECHO query error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteQuery(inputText);
  };

  const getClaimStyle = (type: string) => {
    switch (type) {
      case 'DOCUMENTED FACT':
        return 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400';
      case 'EXPERT-VERIFIED':
      case 'EXPERT-VERIFIED INFORMATION':
        return 'bg-cyan-950/30 border-cyan-500/40 text-cyan-400';
      case 'AI ANALYSIS':
        return 'bg-purple-950/30 border-purple-500/40 text-purple-400';
      case 'AI INFERENCE':
      case 'AI-GENERATED INFERENCE':
        return 'bg-violet-950/30 border-violet-500/40 text-violet-300';
      case 'HYPOTHETICAL':
        return 'bg-indigo-950/30 border-indigo-500/40 text-indigo-300';
      case 'INSUFFICIENT EVIDENCE':
      default:
        return 'bg-amber-950/30 border-amber-500/40 text-amber-400';
    }
  };

  const activeProviderObj = providers.find((p) => p.id === selectedProvider);

  return (
    <div className="space-y-5 animate-fade-in pb-16">
      <FeatureHeader featureKey="ask-echo" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#00D9FF]/15">
        <div>
          <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2.5">
            <Brain className="w-6 h-6 text-[#00D9FF]" />
            ASK ECHO — HUMAN–AI HYBRID INTELLIGENCE
          </h1>
          <p className="text-xs text-[#9FB2CA] mt-1">
            Combine preserved human expertise with AI analytical reasoning — transparent, evidence-backed, and fully traceable.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-[#00E6A0] bg-[#00E6A0]/10 px-3 py-1.5 rounded-xl border border-[#00E6A0]/20">
            <ShieldCheck className="w-4 h-4" />
            TRACEABLE PROVENANCE
          </span>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3 Selectable Intelligence Modes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {MODE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = mode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMode(opt.id)}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-3 ${
                isActive
                  ? opt.id === 'hybrid_intelligence'
                    ? 'bg-gradient-to-r from-[#00D9FF]/15 to-[#925CFF]/15 border-[#00D9FF] shadow-sm'
                    : 'bg-[#00D9FF]/10 border-[#00D9FF]'
                  : 'bg-[#061222]/80 border-slate-800 hover:border-slate-600'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isActive
                    ? 'bg-[#00D9FF]/20 text-[#00D9FF]'
                    : 'bg-slate-900 text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono tracking-wider text-white">
                    {opt.label}
                  </span>
                  {opt.id === 'hybrid_intelligence' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      DEFAULT
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#9FB2CA] truncate">{opt.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Configuration Bar (AI Provider Pills + Model + Expert/Domain Filter) */}
      <div className="bg-[#061222]/90 border border-slate-800 rounded-xl p-3.5 space-y-3 text-xs">
        {mode !== 'human_expert' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] font-mono text-[#9FB2CA] uppercase font-semibold">
                Select AI Provider (Gemini · ChatGPT · Claude · Perplexity · Grok · Live Web)
              </span>
              <button
                type="button"
                onClick={() => setShowKeyModal(true)}
                className="px-2.5 py-1 rounded-lg bg-[#00D9FF]/15 hover:bg-[#00D9FF]/25 border border-[#00D9FF]/40 text-[#00D9FF] text-[10px] font-mono font-bold cursor-pointer transition"
              >
                + Connect Gemini / ChatGPT / Claude Key
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleProviderChange('auto')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                  selectedProvider === 'auto'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-[#020713] border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <span>Auto (Best Available)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Always ready" />
              </button>
              {providers.map((p) => {
                const isSel = selectedProvider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProviderChange(p.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                      isSel
                        ? 'bg-purple-500/20 border-purple-400 text-white'
                        : 'bg-[#020713] border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span>{p.id === 'openai' ? 'ChatGPT (OpenAI)' : p.id === 'anthropic' ? 'Claude (Anthropic)' : p.name}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.configured ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      title={p.configured ? 'Ready' : 'API key not configured'}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {mode !== 'human_expert' && (
            <div>
              <label className="text-[10px] font-mono text-[#9FB2CA] uppercase block mb-1">
                AI Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={!activeProviderObj}
                className="w-full bg-[#020713] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00D9FF] disabled:opacity-50"
              >
                {!activeProviderObj ? (
                  <option value="">Auto-selected default model</option>
                ) : (
                  activeProviderObj.models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {mode !== 'ai_intelligence' && (
            <>
              <div>
                <label className="text-[10px] font-mono text-[#9FB2CA] uppercase block mb-1">
                  Expert Filter
                </label>
                <select
                  value={selectedExpertFilter ?? ''}
                  onChange={(e) =>
                    setSelectedExpertFilter(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full bg-[#020713] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                >
                  <option value="">All Archived Experts</option>
                  {expertsList.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#9FB2CA] uppercase block mb-1">
                  Domain Focus
                </label>
                <select
                  value={selectedDomainFilter}
                  onChange={(e) => setSelectedDomainFilter(e.target.value)}
                  className="w-full bg-[#020713] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                >
                  <option value="all">All Domains</option>
                  {domainsList.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Epistemic Label Legend */}
      <div className="bg-[#061222]/60 border border-slate-800/80 rounded-xl px-3.5 py-2 flex flex-wrap items-center gap-3 text-[10px] font-mono">
        <span className="text-[#9FB2CA] uppercase font-semibold">Epistemic Labels:</span>
        <span className="text-emerald-400">● DOCUMENTED FACT</span>
        <span className="text-cyan-400">● EXPERT-VERIFIED</span>
        <span className="text-purple-400">● AI ANALYSIS</span>
        <span className="text-violet-300">● AI INFERENCE</span>
        <span className="text-indigo-300">● HYPOTHETICAL</span>
        <span className="text-amber-400">● INSUFFICIENT EVIDENCE</span>
      </div>

      {/* Question Input Area */}
      <div className="p-4 rounded-2xl glass-panel border border-[#00D9FF]/30 bg-[#061222]/90">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleExecuteQuery(inputText);
                }
              }}
              placeholder="Ask any natural-language, comparative, or follow-up question (e.g., 'How can we improve the safety of an aircraft engine?')..."
              className="flex-1 bg-[#020713] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#00D9FF] resize-none"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="px-5 py-3 rounded-xl btn-cyber-primary text-xs uppercase tracking-wider font-bold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer sm:self-stretch"
            >
              <span>Analyze</span>
              <Send className="w-4 h-4" />
            </button>
          </div>

          {sampleQueries.length > 0 && (
            <div className="pt-1 space-y-2">
              <button
                type="button"
                onClick={() => setShowExamples((v) => !v)}
                className="text-[11px] font-mono text-[#9FB2CA] hover:text-[#00D9FF] flex items-center gap-1.5 cursor-pointer"
              >
                {showExamples ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{showExamples ? 'Hide' : 'Show'} Optional Example Suggestions ({sampleQueries.length})</span>
              </button>
              {showExamples && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {sampleQueries.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleExecuteQuery(s.query)}
                      className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-900 border border-slate-700/80 text-slate-300 hover:border-[#00D9FF] hover:text-white transition cursor-pointer"
                    >
                      <span className="font-mono text-[#00D9FF] mr-1">[{s.expert_name}]</span>
                      {s.query}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Empty State */}
      {messages.length === 0 && !loading && (
        <div className="p-8 rounded-2xl border border-slate-800 bg-[#061222]/50 text-center space-y-2">
          <Layers className="w-8 h-8 text-[#00D9FF] mx-auto opacity-80" />
          <h3 className="text-sm font-bold text-white">
            Ready for {MODE_OPTIONS.find((m) => m.id === mode)?.label}
          </h3>
          <p className="text-xs text-[#9FB2CA] max-w-xl mx-auto">
            Enter a question above or click a test query. Hybrid Intelligence retrieves real human expert records from PROJECT ECHO, runs analysis through your configured AI provider, and transparently compares agreements and disagreements.
          </p>
        </div>
      )}

      {/* Conversation Stream */}
      <div className="space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className="animate-fade-in">
            {msg.sender === 'user' ? (
              <div className="flex items-start justify-end gap-3 max-w-3xl ml-auto">
                <div className="bg-gradient-to-r from-indigo-600/30 to-cyan-600/30 border border-cyan-500/40 rounded-2xl rounded-tr-sm p-3.5 text-sm text-white">
                  <div className="flex items-center justify-end gap-2 mb-1 text-[10px] font-mono text-cyan-300">
                    <span>MODE: {(msg.mode || 'hybrid_intelligence').replace('_', ' ').toUpperCase()}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p className="font-medium">{msg.queryText}</p>
                </div>
              </div>
            ) : msg.result ? (
              <div className="space-y-4 p-5 rounded-2xl border border-[#00D9FF]/25 bg-[#061222]/90">
                {/* Greeting Mode */}
                {msg.result.engine_mode === 'greeting' ? (
                  <div className="text-sm text-slate-100 leading-relaxed whitespace-pre-line">
                    {msg.result.narrative_answer}
                  </div>
                ) : (
                  <>
                    {/* Intelligence Source Attribution Banner */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        {msg.result.human_intelligence?.available && msg.result.ai_intelligence?.available ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40">
                            SOURCE: HUMAN EXPERT + AI (HYBRID)
                          </span>
                        ) : msg.result.human_intelligence?.available ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            SOURCE: HUMAN EXPERT KNOWLEDGE ONLY
                          </span>
                        ) : msg.result.ai_intelligence?.available ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            SOURCE: AI / WEB KNOWLEDGE ONLY (No ECHO Human Records Found)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            SOURCE: INSUFFICIENT EVIDENCE
                          </span>
                        )}
                      </div>
                      {msg.result.ai_intelligence?.available && msg.result.ai_intelligence?.provider && (
                        <span className="text-[10px] font-mono text-slate-400">
                          Provider: <strong className="text-purple-300">{msg.result.ai_intelligence.provider}</strong> ({msg.result.ai_intelligence.model})
                        </span>
                      )}
                    </div>

                    {/* A. UNDERSTANDING THE QUESTION */}
                    {msg.result.understanding && (
                      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00D9FF]">
                            A. Understanding the Question
                          </span>
                          <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            {msg.result.understanding.question_type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200">{msg.result.understanding.summary}</p>
                        <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                          <span>Domain: <strong className="text-cyan-300">{msg.result.understanding.domain}</strong></span>
                          {msg.result.understanding.constraints_detected?.length > 0 && (
                            <span>
                              • Constraints: {msg.result.understanding.constraints_detected.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* B. HUMAN EXPERT INTELLIGENCE */}
                    {msg.result.human_intelligence && (
                      <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5" />
                            B. Human Expert Intelligence
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              msg.result.human_intelligence.available
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {msg.result.human_intelligence.available ? 'EVIDENCE RETRIEVED' : 'NO MATCHING RECORDS'}
                          </span>
                        </div>

                        {msg.result.human_intelligence.available ? (
                          <>
                            {/* Expandable Expert Cards */}
                            {msg.result.human_intelligence.experts &&
                              msg.result.human_intelligence.experts.length > 0 && (
                                <div className="space-y-2">
                                  {msg.result.human_intelligence.experts.map((exp) => {
                                    const expKey = `${msg.id}-${exp.id}`;
                                    const isExpanded = !!expandedExperts[expKey];
                                    return (
                                      <div
                                        key={exp.id}
                                        className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5 text-xs"
                                      >
                                        <div
                                          onClick={() =>
                                            setExpandedExperts((prev) => ({
                                              ...prev,
                                              [expKey]: !prev[expKey],
                                            }))
                                          }
                                          className="flex items-center justify-between cursor-pointer"
                                        >
                                          <div>
                                            <span className="font-bold text-white">{exp.name}</span>
                                            <span className="text-cyan-400 ml-2 text-[11px]">
                                              {exp.domain}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono text-emerald-400">
                                              {exp.verification_status || 'verified'}
                                            </span>
                                            {isExpanded ? (
                                              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                                            ) : (
                                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                            )}
                                          </div>
                                        </div>
                                        {isExpanded && (
                                          <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                                            <span>{exp.title}</span>
                                            <button
                                              type="button"
                                              onClick={() => navigate(`/experts/${exp.id}`)}
                                              className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                              Open Profile <ExternalLink className="w-3 h-3" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                            <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                              {msg.result.human_intelligence.summary}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-amber-200 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <span>
                              {msg.result.human_intelligence.summary ||
                                msg.result.human_intelligence.reason ||
                                "I couldn't find sufficient documented human expertise in PROJECT ECHO to answer this question reliably."}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* C. AI INTELLIGENCE */}
                    {msg.result.ai_intelligence && (
                      <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            C. AI Intelligence
                          </span>
                          {msg.result.ai_intelligence.provider && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-200 border border-purple-500/30">
                              {msg.result.ai_intelligence.provider} · {msg.result.ai_intelligence.model}
                            </span>
                          )}
                        </div>

                        {msg.result.ai_intelligence.available ? (
                          <div className="space-y-2 text-xs text-slate-200">
                            <p className="leading-relaxed whitespace-pre-line">
                              {msg.result.ai_intelligence.analysis}
                            </p>
                            {msg.result.ai_intelligence.recommendations &&
                              msg.result.ai_intelligence.recommendations.length > 0 && (
                                <div className="pt-1">
                                  <span className="text-[10px] font-mono uppercase text-purple-300 font-bold block mb-1">
                                    AI Recommendations:
                                  </span>
                                  <ul className="list-disc pl-4 space-y-0.5">
                                    {msg.result.ai_intelligence.recommendations.map((r, i) => (
                                      <li key={i}>{r}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            {msg.result.ai_intelligence.limitations &&
                              msg.result.ai_intelligence.limitations.length > 0 && (
                                <div className="text-[11px] text-purple-300/80 font-mono pt-1">
                                  Limitations: {msg.result.ai_intelligence.limitations.join(' • ')}
                                </div>
                              )}
                          </div>
                        ) : (
                          <div className="space-y-2.5 text-xs text-amber-300">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>
                                {msg.result.ai_intelligence.error ||
                                  msg.result.ai_intelligence.reason ||
                                  'AI analysis unavailable.'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 pl-6">
                              <button
                                type="button"
                                onClick={() => setShowKeyModal(true)}
                                className="px-3 py-1 rounded-lg bg-[#00D9FF]/15 hover:bg-[#00D9FF]/25 border border-[#00D9FF]/40 text-[#00D9FF] font-mono text-[11px] font-bold cursor-pointer"
                              >
                                Connect Gemini / ChatGPT / Claude Key
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleProviderChange('web_search');
                                }}
                                className="px-3 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-200 font-mono text-[11px] cursor-pointer"
                              >
                                Select Live Web Knowledge (No Key Needed)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* D. AGREEMENTS & E. DISAGREEMENTS (Hybrid Mode) */}
                    {(msg.result.mode_used === 'hybrid_intelligence' ||
                      (msg.result.agreements && msg.result.agreements.length > 0) ||
                      (msg.result.disagreements && msg.result.disagreements.length > 0)) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            D. Agreements (Human & AI)
                          </span>
                          {msg.result.agreements && msg.result.agreements.length > 0 ? (
                            <ul className="space-y-1 text-xs text-slate-200 list-disc pl-4">
                              {msg.result.agreements.map((a, idx) => (
                                <li key={idx}>{a}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">
                              No direct cross-validation agreements available (requires both human evidence and active AI analysis).
                            </p>
                          )}
                        </div>

                        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5" />
                            E. Disagreements & Divergent Priorities
                          </span>
                          {msg.result.disagreements && msg.result.disagreements.length > 0 ? (
                            <ul className="space-y-1 text-xs text-slate-200 list-disc pl-4">
                              {msg.result.disagreements.map((d, idx) => (
                                <li key={idx}>{d}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">
                              No conflicting assumptions or disagreements detected between retrieved human expertise and AI reasoning.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* F. HYBRID RECOMMENDATION */}
                    {msg.result.hybrid_recommendation && (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-[#00D9FF]/10 to-[#925CFF]/10 border border-[#00D9FF]/40 space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00D9FF] flex items-center gap-1.5">
                          <GitMerge className="w-3.5 h-3.5" />
                          F. Hybrid Recommendation
                        </span>
                        <div className="text-sm text-white leading-relaxed whitespace-pre-line">
                          {msg.result.hybrid_recommendation}
                        </div>
                      </div>
                    )}

                    {/* G. EVIDENCE & RELIABILITY + Traceable Claims & Citations */}
                    <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-[#00D9FF]" />
                          G. Evidence & Reliability
                        </span>
                        <span className="text-[10px] font-mono text-cyan-300">
                          Confidence: {Math.round(msg.result.overall_confidence * 100)}% •{' '}
                          {msg.result.evidence_reliability?.hybrid_completeness || msg.result.engine_mode}
                        </span>
                      </div>

                      {msg.result.structured_claims.length > 0 && (
                        <div className="space-y-1.5">
                          {msg.result.structured_claims.map((claim, cIdx) => (
                            <div
                              key={cIdx}
                              className={`p-2.5 rounded-lg border text-xs space-y-0.5 ${getClaimStyle(
                                claim.claim_type
                              )}`}
                            >
                              <div className="flex items-center justify-between font-mono text-[10px] font-bold">
                                <span>{claim.claim_type}</span>
                                <span>{Math.round(claim.confidence * 100)}%</span>
                              </div>
                              <p className="text-slate-100">{claim.statement}</p>
                              <p className="text-[10px] font-mono text-slate-400">
                                Source: {claim.grounding}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.result.citations.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                          {msg.result.citations.map((cite, i) => (
                            <div
                              key={i}
                              onClick={() => setActiveCitation(cite)}
                              className="p-3 rounded-lg bg-[#020713] border border-cyan-500/20 hover:border-cyan-400 cursor-pointer transition text-xs"
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 mb-1">
                                <span className="uppercase">{cite.source_type}</span>
                                <span>{cite.expert_name}</span>
                              </div>
                              <div className="font-semibold text-white line-clamp-1">{cite.title}</div>
                              <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                                {cite.snippet}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        ))}

        {/* Staged Processing Indicator */}
        {loading && (
          <div className="p-4 rounded-xl bg-slate-900 border border-[#00D9FF]/30 text-xs text-cyan-300 font-mono flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00D9FF] animate-ping" />
            <span>{LOADING_STAGES[mode][loadingStageIdx]}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Citation Deep Inspector Modal */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-cyan-500/40 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold block">
                  Source Provenance Verification
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{activeCitation.title}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Source: <strong className="text-cyan-300">{activeCitation.expert_name}</strong> ({activeCitation.source_type})
                </p>
              </div>
              <button
                onClick={() => setActiveCitation(null)}
                className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-line">
              {activeCitation.exact_passage || activeCitation.snippet}
            </div>
            {activeCitation.evidence_limitation && (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
                <strong className="block font-mono uppercase text-[10px] text-amber-400 mb-0.5">
                  Limitations & Boundaries:
                </strong>
                {activeCitation.evidence_limitation}
              </div>
            )}
            {activeCitation.provenance_url && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const url = activeCitation.provenance_url!;
                    setActiveCitation(null);
                    navigate(url);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  Open Source Record <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Connect AI Provider Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-[#00D9FF]/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-[#00D9FF] uppercase font-bold block">
                  Secure Backend Configuration
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Connect Gemini, ChatGPT, or Claude
                </h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveProviderKey} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono text-[#9FB2CA] uppercase block mb-1">
                  AI Provider
                </label>
                <select
                  value={keyProvider}
                  onChange={(e) => setKeyProvider(e.target.value)}
                  className="w-full bg-[#020713] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00D9FF]"
                >
                  <option value="gemini">Google Gemini (GEMINI_API_KEY)</option>
                  <option value="openai">ChatGPT / OpenAI (OPENAI_API_KEY)</option>
                  <option value="anthropic">Claude / Anthropic (ANTHROPIC_API_KEY)</option>
                  <option value="perplexity">Perplexity AI (PERPLEXITY_API_KEY)</option>
                  <option value="grok">Grok / xAI (GROK_API_KEY)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#9FB2CA] uppercase block mb-1">
                  API Key (stored securely in backend/.env)
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Paste your API key here..."
                  className="w-full bg-[#020713] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#00D9FF]"
                />
              </div>
              {keyStatusMsg && (
                <p className="text-[11px] font-mono text-cyan-300">{keyStatusMsg}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingKey || !keyInput.trim()}
                  className="px-4 py-1.5 rounded-lg btn-cyber-primary font-bold disabled:opacity-50 cursor-pointer"
                >
                  {savingKey ? 'Saving...' : 'Save & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
