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
import { VoiceConsultationPanel } from '../components/VoiceConsultationPanel';
import { useVoiceConversation } from '../hooks/useVoiceConversation';
import {
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Database,
  CheckCircle2,
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
  Volume2,
  VolumeX,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Radio,
  FileText,
  HelpCircle,
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
  badge?: string;
  icon: React.FC<{ className?: string }>;
}> = [
  {
    id: 'hybrid_intelligence',
    label: 'HYBRID INTELLIGENCE',
    subtitle: 'Human Expert Evidence + Multi-Provider AI Comparison & Synthesis',
    badge: 'RECOMMENDED DEFAULT',
    icon: GitMerge,
  },
  {
    id: 'complete_human_intelligence',
    label: 'COMPLETE HUMAN INTELLIGENCE',
    subtitle: 'Strictly Preserved Expert Knowledge & Digital Human Representation',
    icon: UserCheck,
  },
];

const LOADING_STAGES: Record<AskEchoMode, string[]> = {
  complete_human_intelligence: [
    '1. Parsing question & analyzing intent against approved expert domains...',
    '2. Searching verified Knowledge Units, Decision DNA & Lesson archives...',
    '3. Verifying expert consent status & epistemic provenance...',
    '4. Assembling evidence-grounded response without generative hallucinations...',
  ],
  hybrid_intelligence: [
    '1. Understanding problem, domain & operating constraints...',
    '2. Retrieving documented human expertise from PROJECT ECHO...',
    '3. Querying configured AI providers (Gemini, ChatGPT, Claude)...',
    '4. Comparing agreements, disagreements & identifying missing uncertainty...',
    '5. Synthesizing unified decision recommendation with transparent citations...',
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
  const [showAvatarCard, setShowAvatarCard] = useState(true);
  const [callActive, setCallActive] = useState(false);

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyProvider, setKeyProvider] = useState<string>('gemini');
  const [keyInput, setKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyStatusMsg, setKeyStatusMsg] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Hook up Live Voice & Avatar Viseme Animation Engine
  const {
    status: voiceStatus,
    transcript: liveTranscript,
    isSupported: isVoiceSupported,
    startListening,
    stopListening,
    interruptAndListen,
    speakText: speakUtterance,
    stopSpeaking: cancelSpeech,
    toggleMute,
    isMuted,
    viseme,
    speechEnergy,
    currentSubtitle,
  } = useVoiceConversation({
    onQuery: async (spokenText) => {
      await handleExecuteQuery(spokenText, true);
      return { answer: 'Processed query.' };
    },
    continuousMode: false,
    preferFemaleVoice: false,
  });

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
    const stages = LOADING_STAGES[mode] || LOADING_STAGES.hybrid_intelligence;
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

  const handleExecuteQuery = async (queryToRun: string, isFromVoice = false) => {
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

      // Automatically speak the synthesized or narrative response through Digital Human Avatar if call active or from voice
      const speechText = res.hybrid_recommendation || res.narrative_answer;
      if (speechText && (callActive || isFromVoice || showAvatarCard)) {
        speakUtterance(speechText);
      }
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

  const handleStartVoiceCall = () => {
    setCallActive(true);
    startListening();
  };

  const handleEndVoiceCall = () => {
    setCallActive(false);
    stopListening();
    cancelSpeech();
  };

  const getClaimStyle = (type: string) => {
    switch (type) {
      case 'DOCUMENTED FACT':
      case 'DIRECTLY DOCUMENTED EXPERT KNOWLEDGE':
        return 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400';
      case 'EXPERT-VERIFIED':
      case 'EXPERT-APPROVED KNOWLEDGE':
      case 'EXPERT-VERIFIED INFORMATION':
        return 'bg-cyan-950/30 border-cyan-500/40 text-cyan-400';
      case 'AI ANALYSIS':
      case 'AI-GENERATED INTERPRETATION':
        return 'bg-purple-950/30 border-purple-500/40 text-purple-400';
      case 'AI INFERENCE':
      case 'AI-GENERATED INFERENCE':
      case 'INFERENCE':
        return 'bg-violet-950/30 border-violet-500/40 text-violet-300';
      case 'HYPOTHETICAL':
      case 'HYPOTHETICAL SIMULATION':
        return 'bg-indigo-950/30 border-indigo-500/40 text-indigo-300';
      case 'INSUFFICIENT EVIDENCE':
      case 'UNKNOWN OR UNAVAILABLE':
      default:
        return 'bg-amber-950/30 border-amber-500/40 text-amber-400';
    }
  };

  const selectedExpertObj = expertsList.find((e) => e.id === selectedExpertFilter);
  const activeProviderObj = providers.find((p) => p.id === selectedProvider);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <FeatureHeader featureKey="ask-echo" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#00D9FF]/15">
        <div>
          <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2.5">
            <Brain className="w-6 h-6 text-[#00D9FF]" />
            ASK ECHO — LIVING HUMAN INTELLIGENCE
          </h1>
          <p className="text-xs text-[#9FB2CA] mt-1">
            Two distinct intelligence paradigms: Converse directly with verified expert representations or combine human records with multi-AI comparative analysis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAvatarCard(!showAvatarCard)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition cursor-pointer ${
              showAvatarCard
                ? 'bg-[#00D9FF]/20 border-[#00D9FF] text-[#00D9FF]'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{showAvatarCard ? 'AVATAR DOCKED' : 'SHOW AVATAR'}</span>
          </button>
          {messages.length > 0 && (
            <button
              onClick={() => {
                setMessages([]);
                cancelSpeech();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Two Intelligence Modes Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = mode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMode(opt.id)}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer relative overflow-hidden ${
                isActive
                  ? opt.id === 'hybrid_intelligence'
                    ? 'bg-gradient-to-r from-[#00D9FF]/20 via-[#925CFF]/15 to-[#061222] border-[#00D9FF] shadow-lg shadow-[#00D9FF]/10'
                    : 'bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-[#061222] border-emerald-400 shadow-lg shadow-emerald-500/10'
                  : 'bg-[#061222]/80 border-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isActive
                      ? opt.id === 'hybrid_intelligence'
                        ? 'bg-[#00D9FF]/25 text-[#00D9FF]'
                        : 'bg-emerald-500/25 text-emerald-300'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold font-mono tracking-wider text-white">
                      {opt.label}
                    </span>
                    {opt.badge && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9FB2CA] leading-relaxed">{opt.subtitle}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Avatar Engine + Conversation Stream */}
      <div className={`grid grid-cols-1 ${showAvatarCard ? 'lg:grid-cols-12' : ''} gap-6`}>
        {/* Left Column: Digital Human Avatar & Live Voice Engine */}
        {showAvatarCard && (
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel p-4 rounded-2xl border border-[#00D9FF]/25 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold font-mono text-white">
                    {selectedExpertObj ? selectedExpertObj.name : 'AI Digital Human Representation'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#00D9FF]">
                  {voiceStatus.toUpperCase()}
                </span>
              </div>

              {/* Voice-Only Consultation Console */}
              <div className="flex justify-center">
                <VoiceConsultationPanel
                  expertName={selectedExpertObj ? selectedExpertObj.name : 'Dr. Alex Morgan'}
                  expertTitle={selectedExpertObj ? selectedExpertObj.title : 'Principal Hypersonic Systems Architect'}
                  expertDomain={selectedExpertObj ? selectedExpertObj.domain : 'Aerospace Propulsion & Re-entry Systems'}
                  status={voiceStatus}
                  speechEnergy={speechEnergy}
                  subtitle={currentSubtitle || liveTranscript}
                  isMuted={isMuted}
                  isVoiceSupported={isVoiceSupported}
                  callActive={callActive}
                  onStartCall={handleStartVoiceCall}
                  onEndCall={handleEndVoiceCall}
                  onMicClick={() => {
                    if (voiceStatus === 'listening') stopListening();
                    else startListening();
                  }}
                  onInterrupt={interruptAndListen}
                  onToggleMute={toggleMute}
                />
              </div>

              {/* Voice Subtitles Ribbon */}
              {(currentSubtitle || liveTranscript) && (
                <div className="p-3 rounded-xl bg-slate-950/90 border border-[#00D9FF]/30 text-xs text-cyan-200 font-mono">
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 mb-1">
                    {voiceStatus === 'listening' ? 'User Speech Input:' : 'Digital Avatar Speaking:'}
                  </div>
                  <p className="italic leading-relaxed">"{currentSubtitle || liveTranscript}"</p>
                </div>
              )}

              {/* Call Controls */}
              <div className="flex items-center justify-center gap-3 pt-1">
                {!callActive ? (
                  <button
                    onClick={handleStartVoiceCall}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>START LIVE VOICE CALL</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleEndVoiceCall}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono flex items-center gap-2 transition cursor-pointer"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>END CALL</span>
                    </button>
                    <button
                      onClick={interruptAndListen}
                      className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                      title="Interrupt and speak"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>INTERRUPT</span>
                    </button>
                    <button
                      onClick={toggleMute}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </div>

              {/* AI Representation Disclosure */}
              <div className="p-2.5 rounded-xl bg-[#020713]/80 border border-white/5 text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00E6A0] flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Ethical AI Disclosure:</strong> You are interacting with an AI digital human representation grounded in verified expert records. It does not possess consciousness or reproduce private thoughts.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Query Form & Conversation Results */}
        <div className={showAvatarCard ? 'lg:col-span-7 space-y-5' : 'space-y-5'}>
          {/* Query Filter and Configuration Toolbar */}
          <div className="bg-[#061222]/90 border border-slate-800 rounded-2xl p-4 space-y-3.5 text-xs">
            {/* Mode 2: Multi-AI Provider Selector */}
            {mode === 'hybrid_intelligence' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] font-mono text-[#9FB2CA] uppercase font-semibold">
                    Configured AI Providers (Gemini · OpenAI · Claude · Perplexity · Grok)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(true)}
                    className="px-2.5 py-1 rounded-lg bg-[#00D9FF]/15 hover:bg-[#00D9FF]/25 border border-[#00D9FF]/40 text-[#00D9FF] text-[10px] font-mono font-bold cursor-pointer transition"
                  >
                    + Connect Gemini / OpenAI / Claude Key
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
                    <span>Auto (Parallel Query All Available)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
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
                        <span>{p.name}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            p.configured ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                          title={p.configured ? 'Configured & Ready' : 'API Key Not Set'}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Expert & Domain Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-[#9FB2CA] uppercase block mb-1">
                  {mode === 'complete_human_intelligence' ? 'Select Expert Representation' : 'Target Expert Filter'}
                </label>
                <select
                  value={selectedExpertFilter ?? ''}
                  onChange={(e) =>
                    setSelectedExpertFilter(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full bg-[#020713] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                >
                  <option value="">
                    {mode === 'complete_human_intelligence'
                      ? 'All Active Consented Experts (Multi-Expert Representation)'
                      : 'All Archived Experts'}
                  </option>
                  {expertsList.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} — {ex.domain}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#9FB2CA] uppercase block mb-1">
                  Domain Filter
                </label>
                <select
                  value={selectedDomainFilter}
                  onChange={(e) => setSelectedDomainFilter(e.target.value)}
                  className="w-full bg-[#020713] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                >
                  <option value="all">All Domains</option>
                  {domainsList.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Question Input Box */}
          <div className="p-4 rounded-2xl glass-panel border border-[#00D9FF]/30 bg-[#061222]/90 space-y-3">
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
                  placeholder={
                    mode === 'complete_human_intelligence'
                      ? "Ask this expert about their documented decisions, methods, failures, and approved knowledge..."
                      : "Ask any complex question (e.g., 'How can we improve the safety of an aircraft engine?')..."
                  }
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

              {/* Sample Queries */}
              {sampleQueries.length > 0 && (
                <div className="pt-1 space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowExamples((v) => !v)}
                    className="text-[11px] font-mono text-[#9FB2CA] hover:text-[#00D9FF] flex items-center gap-1.5 cursor-pointer"
                  >
                    {showExamples ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>{showExamples ? 'Hide' : 'Show'} Curated Demonstration Prompts ({sampleQueries.length})</span>
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

          {/* Epistemic Labels Legend */}
          <div className="bg-[#061222]/60 border border-slate-800/80 rounded-xl px-3.5 py-2 flex flex-wrap items-center gap-3 text-[10px] font-mono">
            <span className="text-[#9FB2CA] uppercase font-semibold">Provenance Standards:</span>
            <span className="text-emerald-400">● DIRECTLY DOCUMENTED EXPERT KNOWLEDGE</span>
            <span className="text-cyan-400">● EXPERT-APPROVED KNOWLEDGE</span>
            <span className="text-purple-400">● AI-GENERATED INTERPRETATION</span>
            <span className="text-violet-300">● INFERENCE</span>
            <span className="text-amber-400">● UNKNOWN / UNAVAILABLE</span>
          </div>

          {/* Conversation Stream */}
          <div className="space-y-6">
            {messages.length === 0 && !loading && (
              <div className="p-8 rounded-2xl border border-slate-800 bg-[#061222]/50 text-center space-y-2">
                <Layers className="w-8 h-8 text-[#00D9FF] mx-auto opacity-80" />
                <h3 className="text-sm font-bold text-white">
                  Ready for {mode === 'hybrid_intelligence' ? 'Hybrid Intelligence Analysis' : 'Complete Human Intelligence Dialogue'}
                </h3>
                <p className="text-xs text-[#9FB2CA] max-w-xl mx-auto">
                  {mode === 'hybrid_intelligence'
                    ? 'Enter your question above or speak naturally. Hybrid Intelligence queries both human expert records and external AI models to contrast agreements and synthesize answers.'
                    : 'Ask questions directly to the digital human representation. ECHO retrieves only verified, approved expert knowledge with exact source references.'}
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="animate-fade-in">
                {msg.sender === 'user' ? (
                  <div className="flex items-start justify-end gap-3 max-w-2xl ml-auto">
                    <div className="bg-gradient-to-r from-indigo-600/30 to-cyan-600/30 border border-cyan-500/40 rounded-2xl rounded-tr-sm p-3.5 text-sm text-white">
                      <div className="flex items-center justify-end gap-2 mb-1 text-[10px] font-mono text-cyan-300">
                        <span>MODE: {(msg.mode || mode).replace(/_/g, ' ').toUpperCase()}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="font-medium">{msg.queryText}</p>
                    </div>
                  </div>
                ) : msg.result ? (
                  <div className="space-y-4 p-5 rounded-2xl border border-[#00D9FF]/25 bg-[#061222]/90">
                    {/* Header Banner */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        {msg.result.mode_used === 'complete_human_intelligence' ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5" />
                            MODE 1: COMPLETE HUMAN INTELLIGENCE
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                            <GitMerge className="w-3.5 h-3.5" />
                            MODE 2: HYBRID INTELLIGENCE (HUMAN + AI)
                          </span>
                        )}
                        {msg.result.primary_expert && (
                          <span className="text-[11px] font-mono text-slate-300">
                            Expert: <strong className="text-white">{msg.result.primary_expert.name}</strong>
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          const toSpeak = msg.result!.hybrid_recommendation || msg.result!.narrative_answer;
                          if (toSpeak) speakUtterance(toSpeak);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#00D9FF]/15 hover:bg-[#00D9FF]/25 border border-[#00D9FF]/30 text-[#00D9FF] text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Speak Through Avatar</span>
                      </button>
                    </div>

                    {/* SECTION 1: HUMAN EXPERT KNOWLEDGE */}
                    {msg.result.human_intelligence && (
                      <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4" />
                            1. Human Expert Knowledge
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              msg.result.human_intelligence.available
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {msg.result.human_intelligence.available ? 'APPROVED RECORDS FOUND' : 'NO RECORDED EVIDENCE'}
                          </span>
                        </div>

                        {msg.result.human_intelligence.available ? (
                          <div className="space-y-2.5">
                            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                              {msg.result.human_intelligence.summary}
                            </p>

                            {/* Expandable Expert Cards */}
                            {msg.result.human_intelligence.experts && msg.result.human_intelligence.experts.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                {msg.result.human_intelligence.experts.map((exp) => (
                                  <div key={exp.id} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between">
                                    <div>
                                      <span className="font-bold text-white">{exp.name}</span>
                                      <span className="text-cyan-400 ml-2 text-[11px] font-mono">{exp.domain}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/experts/${exp.id}`)}
                                      className="text-cyan-400 hover:underline text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                                    >
                                      Profile <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-amber-300 flex items-start gap-2 bg-amber-950/20 p-3 rounded-lg border border-amber-500/30">
                            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <span>
                              {msg.result.human_intelligence.summary ||
                                msg.result.human_intelligence.reason ||
                                "No verified human expertise recorded on this topic in PROJECT ECHO. As an approved representation, ECHO will not fabricate an answer."}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION 2: AI ANALYSIS (Hybrid Mode Only) */}
                    {msg.result.mode_used === 'hybrid_intelligence' && msg.result.ai_intelligence && (
                      <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" />
                            2. AI Analysis & Multi-Provider Response
                          </span>
                          {msg.result.ai_intelligence.provider && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-200 border border-purple-500/30">
                              Active: {msg.result.ai_intelligence.provider} ({msg.result.ai_intelligence.model})
                            </span>
                          )}
                        </div>

                        {/* List individual providers that actually returned results */}
                        {msg.result.provider_runs && msg.result.provider_runs.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-1">
                            {msg.result.provider_runs.map((pr, pidx) => (
                              <div key={pidx} className="p-2 rounded-lg bg-slate-900/80 border border-purple-500/20 text-xs space-y-0.5">
                                <div className="flex items-center justify-between font-mono text-[10px]">
                                  <span className="font-bold text-white">{pr.provider_name}</span>
                                  <span className={pr.success ? 'text-emerald-400' : 'text-amber-400'}>
                                    {pr.success ? `${pr.latency_ms}ms` : 'FAILED / UNCONFIGURED'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-300 line-clamp-2">{pr.content || pr.error}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.result.ai_intelligence.available ? (
                          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                            {msg.result.ai_intelligence.analysis}
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                            <span>
                              {msg.result.ai_intelligence.error ||
                                msg.result.ai_intelligence.reason ||
                                'Configured external AI provider credentials unavailable.'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION 3 & 4: AGREEMENTS & DISAGREEMENTS */}
                    {msg.result.mode_used === 'hybrid_intelligence' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* 3. Agreements */}
                        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            3. Agreements (Human & AI)
                          </span>
                          {msg.result.agreements && msg.result.agreements.length > 0 ? (
                            <ul className="space-y-1 text-xs text-slate-200 list-disc pl-4">
                              {msg.result.agreements.map((a, idx) => (
                                <li key={idx}>{a}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">
                              No explicit overlapping points detected across human records and active AI models.
                            </p>
                          )}
                        </div>

                        {/* 4. Disagreements */}
                        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5" />
                            4. Disagreements & Divergent Priorities
                          </span>
                          {msg.result.disagreements && msg.result.disagreements.length > 0 ? (
                            <ul className="space-y-1 text-xs text-slate-200 list-disc pl-4">
                              {msg.result.disagreements.map((d, idx) => (
                                <li key={idx}>{d}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">
                              No conflicting methodologies or risk trade-off disputes detected.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SECTION 5: MISSING INFORMATION & UNCERTAINTY */}
                    {((msg.result.missing_information && msg.result.missing_information.length > 0) ||
                      msg.result.uncertainties_and_gaps?.length > 0 ||
                      msg.result.missing_information_explanation) && (
                      <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          5. Missing Information & Epistemic Uncertainty
                        </span>
                        <div className="text-xs text-slate-200 space-y-1">
                          {msg.result.missing_information_explanation && (
                            <p className="text-amber-200 font-medium">{msg.result.missing_information_explanation}</p>
                          )}
                          <ul className="list-disc pl-4 space-y-0.5">
                            {(msg.result.missing_information || msg.result.uncertainties_and_gaps).map((m, idx) => (
                              <li key={idx}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* SECTION 6: FINAL SYNTHESIS */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-[#00D9FF]/10 via-[#925CFF]/10 to-[#061222] border border-[#00D9FF]/40 space-y-2">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#00D9FF] flex items-center gap-1.5">
                        <GitMerge className="w-4 h-4" />
                        6. Final Synthesis & Recommendation
                      </span>
                      <div className="text-sm text-white leading-relaxed whitespace-pre-line font-medium">
                        {msg.result.hybrid_recommendation || msg.result.narrative_answer}
                      </div>
                    </div>

                    {/* SECTION 7: SOURCES AND EVIDENCE */}
                    <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Database className="w-4 h-4 text-[#00D9FF]" />
                          7. Sources & Evidence Grounding ({msg.result.citations.length} Verified References)
                        </span>
                        <span className="text-[10px] font-mono text-cyan-300">
                          Provenance Confidence: {Math.round(msg.result.overall_confidence * 100)}%
                        </span>
                      </div>

                      {/* Structured Claims Provenance */}
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
                                <span>{Math.round(claim.confidence * 100)}% Provenance</span>
                              </div>
                              <p className="text-slate-100">{claim.statement}</p>
                              <p className="text-[10px] font-mono text-slate-400">
                                Source Citation: {claim.grounding}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Citation Deep Links */}
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
                  </div>
                ) : null}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="p-4 rounded-xl bg-slate-900 border border-[#00D9FF]/30 text-xs text-cyan-300 font-mono flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00D9FF] animate-ping" />
                <span>
                  {(LOADING_STAGES[mode] || LOADING_STAGES.hybrid_intelligence)[loadingStageIdx]}
                </span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>
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
                  Secure Backend Credentials
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Connect Gemini, OpenAI, or Claude
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
                  <option value="openai">OpenAI ChatGPT (OPENAI_API_KEY)</option>
                  <option value="anthropic">Anthropic Claude (ANTHROPIC_API_KEY)</option>
                  <option value="perplexity">Perplexity AI (PERPLEXITY_API_KEY)</option>
                  <option value="grok">xAI Grok (GROK_API_KEY)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#9FB2CA] uppercase block mb-1">
                  API Key (Encrypted and saved to server backend/.env)
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
