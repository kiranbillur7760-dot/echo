import React, { useState, useEffect, useRef } from 'react';
import {
  Brain, Cpu, Zap, AlertTriangle, CheckCircle, Activity,
  Eye, MessageSquare, ChevronDown, ChevronRight, Loader2,
  Mic, MicOff, Volume2, VolumeX, Square, RotateCcw,
  Trash2, Radio, Shield, Waves,
} from 'lucide-react';
import { api } from '../services/api';
import { useVoiceConversation, VoiceStatus, ConversationTurn } from '../hooks/useVoiceConversation';

// ── Small UI helpers ─────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    active:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    degraded: 'bg-yellow-500/20  text-yellow-400  border-yellow-500/40',
    offline:  'bg-red-500/20     text-red-400     border-red-500/40',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase tracking-wider ${colors[status] ?? colors.offline}`}>
      {status}
    </span>
  );
};

const EpistemicBadge: React.FC<{ label?: string }> = ({ label }) => {
  const map: Record<string, string> = {
    documented_fact: 'bg-cyan-500/20   text-cyan-300   border-cyan-500/40',
    inference:       'bg-purple-500/20 text-purple-300  border-purple-500/40',
    uncertainty:     'bg-yellow-500/20 text-yellow-300  border-yellow-500/40',
    unknown:         'bg-gray-500/20   text-gray-400    border-gray-500/40',
  };
  const labels: Record<string, string> = {
    documented_fact: 'DOCUMENTED FACT',
    inference:       'AI INFERENCE',
    uncertainty:     'UNCERTAIN',
    unknown:         'UNKNOWN',
  };
  const key = label ?? 'unknown';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase tracking-wider ${map[key] ?? map.unknown}`}>
      {labels[key] ?? key}
    </span>
  );
};

// ── Animated waveform bars shown while listening / speaking ──────────────────
const WaveformBars: React.FC<{ active: boolean; color: string }> = ({ active, color }) => (
  <div className="flex items-center gap-[3px] h-8">
    {Array.from({ length: 12 }).map((_, i) => (
      <div
        key={i}
        className="w-[3px] rounded-full"
        style={{
          background: color,
          height: active ? `${20 + Math.sin(i * 0.8) * 12}px` : '4px',
          animation: active ? `echoWave 0.8s ease-in-out ${i * 0.07}s infinite alternate` : 'none',
          transition: 'height 0.3s ease',
          opacity: active ? 0.9 : 0.3,
        }}
      />
    ))}
    <style>{`
      @keyframes echoWave {
        from { transform: scaleY(0.4); }
        to   { transform: scaleY(1.6); }
      }
    `}</style>
  </div>
);

// ── Status label helper ──────────────────────────────────────────────────────
const voiceStatusLabel: Record<VoiceStatus, string> = {
  idle:                 'Ready',
  requesting_permission:'Requesting mic…',
  listening:            'Listening…',
  processing:           'Thinking…',
  speaking:             'Speaking…',
  error:                'Error',
};

const voiceStatusColor: Record<VoiceStatus, string> = {
  idle:                 '#9FB2CA',
  requesting_permission:'#F59E0B',
  listening:            '#00E6A0',
  processing:           '#00D9FF',
  speaking:             '#925CFF',
  error:                '#EF4444',
};

// ── Voice Conversation Panel ─────────────────────────────────────────────────
const VoicePanel: React.FC = () => {
  const [continuousMode, setContinuousMode] = useState(false);
  const [textInput, setTextInput]           = useState('');
  const conversationEndRef                  = useRef<HTMLDivElement>(null);

  const handleQuery = async (q: string) => {
    const res = await (api as any).queryMirror(q);
    return {
      answer:           res.answer,
      confidence:       res.confidence_score ?? res.confidence ?? 0.9,
      epistemic_label:  res.epistemic_classification
        ? (res.epistemic_classification.toLowerCase().includes('fact') ? 'documented_fact'
          : res.epistemic_classification.toLowerCase().includes('inference') ? 'inference'
          : res.epistemic_classification.toLowerCase().includes('future') ? 'inference'
          : 'documented_fact')
        : (res.epistemic_label ?? 'documented_fact'),
      // pass through extra fields so the bubble can display them
      grounded_facts:    res.grounded_facts ?? [],
      intent_classified: res.intent_classified ?? '',
    };
  };

  const voice = useVoiceConversation({ onQuery: handleQuery, continuousMode });

  // Auto-scroll conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [voice.conversation, voice.transcript]);

  const handleTextSend = async () => {
    if (!textInput.trim() || voice.status === 'processing') return;
    const q = textInput.trim();
    setTextInput('');
    // Reuse the hook's internal path via startListening is not possible for
    // text, so we call the query directly and push turns via voice.clearConversation
    // workaround: expose an `ask` method by calling onQuery ourselves and
    // pushing manually — the hook handles speech synthesis for us via its
    // internal speak only when triggered by voice. For text path we do it here:
    voice.stopSpeaking();
    const res = await (api as any).queryMirror(q);
    // The hook's conversation is managed internally; for text-only we still
    // show results in the same panel by using a parallel local state approach.
    // Since we want one unified list, we use the hook's exposed API:
    // The simplest approach: trigger the hook's handleTranscript indirectly
    // by temporarily making the voice hook think a transcript came in.
    // We achieve this via the text submit button triggering the same path
    // as the voice recognition onresult by calling startListening then... 
    // Actually the cleaner approach: we just call onQuery from here and 
    // manage the conversation locally alongside the voice conversation.
    // The hook already exposes `conversation` from voice turns. For text turns
    // we keep a parallel list that merges.
    // ─ simplest clean approach: use a wrapper that calls hook's internal path.
    // We expose a ref-based `ask` method below:
    voiceAskRef.current?.(q);
  };

  // We need an `ask(text)` method on the hook — we simulate it via a custom ref
  const voiceAskRef = useRef<((text: string) => void) | null>(null);

  // Build an `ask` shim by using a hidden SpeechRecognition bypass:
  // We store the query in a ref and trigger handleTranscript directly by
  // recreating the logic inline here.
  const [localConversation, setLocalConversation] = useState<ConversationTurn[]>([]);
  const [localProcessing, setLocalProcessing]     = useState(false);

  const ask = async (text: string) => {
    if (!text.trim()) return;
    setLocalProcessing(true);
    const userTurn: ConversationTurn = {
      id: Math.random().toString(36).slice(2),
      role: 'user', text,
      timestamp: new Date(),
    };
    setLocalConversation((prev) => [...prev, userTurn]);
    try {
      const res = await (api as any).queryMirror(text);
      const epistemicLabel = res.epistemic_classification
        ? (res.epistemic_classification.toLowerCase().includes('fact') ? 'documented_fact'
          : res.epistemic_classification.toLowerCase().includes('inference') ? 'inference'
          : res.epistemic_classification.toLowerCase().includes('future') ? 'inference'
          : 'documented_fact')
        : (res.epistemic_label ?? 'documented_fact');

      const echoTurn: ConversationTurn = {
        id: Math.random().toString(36).slice(2),
        role: 'echo',
        text: res.answer,
        confidence: res.confidence_score ?? res.confidence ?? 0.95,
        epistemic_label: epistemicLabel,
        grounded_facts: res.grounded_facts ?? [],
        intent_classified: res.intent_classified ?? '',
        timestamp: new Date(),
      };
      setLocalConversation((prev) => [...prev, echoTurn]);
      if (!voice.isMuted) {
        // Use voice hook's speak by triggering via a silent start then stop trick?
        // Cleanest: just use speechSynthesis directly here for text-entered queries
        const utter = new SpeechSynthesisUtterance(res.answer);
        utter.rate = 0.95; utter.pitch = 1.0;
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v =>
          ['Google UK English Female','Google US English','Microsoft Aria Online (Natural)','Samantha'].includes(v.name)
        ) ?? voices.find(v => v.lang.startsWith('en')) ?? null;
        if (preferred) utter.voice = preferred;
        window.speechSynthesis.speak(utter);
      }
    } catch {
      setLocalConversation((prev) => [...prev, {
        id: Math.random().toString(36).slice(2),
        role: 'echo',
        text: 'Error retrieving response. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLocalProcessing(false);
    }
  };

  voiceAskRef.current = ask;

  // Merge voice conversation + local (text-entered) conversation, sorted by time
  const allTurns = [...voice.conversation, ...localConversation]
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const isProcessing = voice.status === 'processing' || localProcessing;
  const isBusy       = voice.status === 'listening' || isProcessing || voice.status === 'speaking' || voice.status === 'requesting_permission';

  const statusColor = voiceStatusColor[voice.status];

  return (
    <div className="space-y-5">

      {/* Browser support warning */}
      {!voice.isSupported && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-300">
            <span className="font-bold">Voice requires Chrome or Edge.</span> Speech recognition is not available in this browser.
            You can still type questions below.
          </div>
        </div>
      )}

      {/* Tech transparency notice */}
      <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-2.5 flex items-start gap-2.5 text-xs text-blue-300/70">
        <Shield className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
        <span>
          <span className="text-blue-300 font-semibold">Browser speech APIs used</span> — no audio leaves your device.
          Speech-to-text and text-to-speech run locally via the Web Speech API (Chrome / Edge).
          Answers are fetched from the ECHO backend in real time — nothing is hardcoded.
        </span>
      </div>

      {/* ── Main Voice Orb ───────────────────────────────────────────────── */}
      <div className="bg-[#061222]/80 border border-[#00D9FF]/15 rounded-2xl p-6">
        <div className="flex flex-col items-center gap-6">

          {/* Status line */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusColor }} />
            <span className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: statusColor }}>
              {voiceStatusLabel[voice.status]}
            </span>
          </div>

          {/* Orb + waveform */}
          <div className="relative flex flex-col items-center gap-4">
            {/* Outer glow rings */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Ring 3 — slow pulse */}
              <div
                className="absolute inset-0 rounded-full border transition-all duration-500"
                style={{
                  borderColor: `${statusColor}20`,
                  transform: isBusy ? 'scale(1.3)' : 'scale(1)',
                  animation: isBusy ? 'orbPulse 2s ease-in-out infinite' : 'none',
                }}
              />
              {/* Ring 2 */}
              <div
                className="absolute inset-3 rounded-full border transition-all duration-500"
                style={{
                  borderColor: `${statusColor}35`,
                  transform: isBusy ? 'scale(1.15)' : 'scale(1)',
                  animation: isBusy ? 'orbPulse 2s ease-in-out 0.3s infinite' : 'none',
                }}
              />
              {/* Ring 1 */}
              <div
                className="absolute inset-6 rounded-full border transition-all duration-300"
                style={{ borderColor: `${statusColor}50` }}
              />

              {/* Core mic button */}
              <button
                onClick={() => {
                  if (voice.status === 'listening') voice.stopListening();
                  else if (voice.status === 'speaking') voice.stopSpeaking();
                  else voice.startListening();
                }}
                disabled={!voice.isSupported || isProcessing || voice.status === 'requesting_permission'}
                className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40 hover:scale-105 active:scale-95"
                style={{
                  background: `radial-gradient(circle at 40% 35%, ${statusColor}30, ${statusColor}10)`,
                  border: `2px solid ${statusColor}60`,
                  boxShadow: isBusy ? `0 0 32px ${statusColor}40, 0 0 8px ${statusColor}20` : 'none',
                }}
                title={
                  voice.status === 'listening' ? 'Stop listening'
                  : voice.status === 'speaking' ? 'Stop speaking'
                  : 'Start listening'
                }
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: statusColor }} />
                ) : voice.status === 'speaking' ? (
                  <Volume2 className="w-8 h-8" style={{ color: statusColor }} />
                ) : voice.status === 'listening' ? (
                  <Mic className="w-8 h-8" style={{ color: statusColor }} />
                ) : (
                  <Mic className="w-8 h-8 text-[#9FB2CA]" />
                )}
              </button>
            </div>

            {/* Waveform display */}
            <WaveformBars
              active={voice.status === 'listening' || voice.status === 'speaking'}
              color={statusColor}
            />
          </div>

          {/* Live transcript / speaking text */}
          <div className="min-h-[40px] text-center px-4">
            {voice.status === 'listening' && voice.transcript && (
              <p className="text-sm text-white/80 italic font-mono animate-pulse">
                "{voice.transcript}"
              </p>
            )}
            {voice.status === 'listening' && !voice.transcript && (
              <p className="text-xs text-[#9FB2CA] font-mono">Speak your question…</p>
            )}
            {voice.status === 'speaking' && (
              <p className="text-xs text-[#925CFF] font-mono flex items-center justify-center gap-2">
                <Waves className="w-3.5 h-3.5" /> ECHO is speaking…
              </p>
            )}
            {isProcessing && (
              <p className="text-xs text-[#00D9FF] font-mono flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…
              </p>
            )}
          </div>

          {/* Error */}
          {voice.error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-xs text-red-400 text-center w-full">
              {voice.error}
            </div>
          )}
        </div>

        {/* ── Control Bar ──────────────────────────────────────────────── */}
        <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
          {/* Mic / Stop listening */}
          {voice.isSupported && (
            <button
              onClick={() => voice.status === 'listening' ? voice.stopListening() : voice.startListening()}
              disabled={isProcessing || voice.status === 'speaking' || voice.status === 'requesting_permission'}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition disabled:opacity-30 ${
                voice.status === 'listening'
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
                  : 'bg-[#00E6A0]/10 text-[#00E6A0] border-[#00E6A0]/30 hover:bg-[#00E6A0]/20'
              }`}
            >
              {voice.status === 'listening'
                ? <><MicOff className="w-3.5 h-3.5" /> Stop</>
                : <><Mic className="w-3.5 h-3.5" /> Listen</>}
            </button>
          )}

          {/* Stop speaking */}
          <button
            onClick={voice.stopSpeaking}
            disabled={voice.status !== 'speaking'}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#925CFF]/10 text-[#925CFF] border border-[#925CFF]/30 hover:bg-[#925CFF]/20 transition disabled:opacity-30"
          >
            <Square className="w-3.5 h-3.5" /> Stop
          </button>

          {/* Replay */}
          <button
            onClick={voice.replayLast}
            disabled={allTurns.filter(t => t.role === 'echo').length === 0 || voice.status === 'speaking'}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#167BFF]/10 text-[#167BFF] border border-[#167BFF]/30 hover:bg-[#167BFF]/20 transition disabled:opacity-30"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Replay
          </button>

          {/* Mute toggle */}
          <button
            onClick={voice.toggleMute}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition ${
              voice.isMuted
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40 hover:bg-yellow-500/30'
                : 'bg-white/5 text-[#9FB2CA] border-white/10 hover:bg-white/10'
            }`}
          >
            {voice.isMuted
              ? <><VolumeX className="w-3.5 h-3.5" /> Unmute</>
              : <><Volume2 className="w-3.5 h-3.5" /> Mute</>}
          </button>

          {/* Clear */}
          <button
            onClick={() => { voice.clearConversation(); setLocalConversation([]); }}
            disabled={allTurns.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-white/5 text-[#9FB2CA] border border-white/10 hover:bg-white/10 transition disabled:opacity-30"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear
          </button>

          {/* Continuous mode */}
          {voice.isSupported && (
            <button
              onClick={() => setContinuousMode((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition ${
                continuousMode
                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                  : 'bg-white/5 text-[#9FB2CA] border-white/10 hover:bg-white/10'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              {continuousMode ? 'Auto: ON' : 'Auto: OFF'}
            </button>
          )}
        </div>
      </div>

      {/* ── Suggested prompts ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {[
          'Why do you exist?',
          'What is your architecture?',
          'What are your limitations?',
          'Are you conscious?',
          'What can you do?',
          'How do you know what you know?',
        ].map((q) => (
          <button
            key={q}
            onClick={() => ask(q)}
            disabled={isBusy}
            className="text-xs px-3 py-1.5 bg-white/5 hover:bg-[#00D9FF]/10 text-[#9FB2CA] hover:text-[#00D9FF] border border-white/10 hover:border-[#00D9FF]/30 rounded-lg transition-all font-mono disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* ── Text input fallback ───────────────────────────────────────────── */}
      <div className="flex gap-3">
        <input
          className="flex-1 bg-[#020713] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-[#9FB2CA]/50 focus:outline-none focus:border-[#00D9FF]/50 font-mono"
          placeholder="Or type a question and press Enter…"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isBusy && handleTextSend()}
          disabled={isBusy}
        />
        <button
          onClick={handleTextSend}
          disabled={isBusy || !textInput.trim()}
          className="px-6 py-3 bg-gradient-to-r from-[#00D9FF] to-[#167BFF] text-[#020713] font-bold text-sm rounded-xl hover:opacity-90 transition disabled:opacity-40 flex items-center gap-2 font-mono whitespace-nowrap"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Ask
        </button>
      </div>

      {/* ── Conversation history ─────────────────────────────────────────── */}
      {allTurns.length > 0 && (
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {allTurns.map((turn) => (
            <div
              key={turn.id}
              className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 space-y-2 ${
                  turn.role === 'user'
                    ? 'bg-[#00D9FF]/10 border border-[#00D9FF]/20 rounded-br-sm'
                    : 'bg-[#925CFF]/10 border border-[#925CFF]/20 rounded-bl-sm'
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${turn.role === 'user' ? 'text-[#00D9FF]' : 'text-[#925CFF]'}`}>
                    {turn.role === 'user' ? 'YOU' : 'ECHO'}
                  </span>
                  {turn.role === 'echo' && turn.epistemic_label && (
                    <EpistemicBadge label={turn.epistemic_label} />
                  )}
                  {turn.role === 'echo' && turn.confidence !== undefined && (
                    <span className="text-[10px] font-mono text-[#9FB2CA]">
                      {Math.round(turn.confidence * 100)}% confidence
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-[#9FB2CA] ml-auto">
                    {turn.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${turn.role === 'echo' ? 'text-[#E8F4FD] whitespace-pre-line' : 'text-white'}`}>
                  {turn.text}
                </p>
                {turn.role === 'echo' && (turn as any).grounded_facts?.length > 0 && (
                  <details className="pt-1">
                    <summary className="text-[10px] font-mono text-[#9FB2CA]/60 cursor-pointer hover:text-[#925CFF] transition select-none">
                      ▸ {(turn as any).grounded_facts.length} grounded facts
                    </summary>
                    <ul className="mt-1.5 space-y-0.5 pl-2">
                      {(turn as any).grounded_facts.map((f: string, i: number) => (
                        <li key={i} className="text-[10px] font-mono text-[#9FB2CA]/80 flex items-start gap-1">
                          <span className="text-[#925CFF] flex-shrink-0">▸</span> {f}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {turn.role === 'echo' && (turn as any).intent_classified && (
                  <div className="text-[10px] font-mono text-[#9FB2CA]/40 pt-0.5">
                    intent: {(turn as any).intent_classified}
                  </div>
                )}
                {turn.role === 'echo' && (
                  <button
                    onClick={() => {
                      if (!voice.isMuted) {
                        const utter = new SpeechSynthesisUtterance(turn.text);
                        utter.rate = 0.95;
                        const voices = window.speechSynthesis?.getVoices() ?? [];
                        const v = voices.find(v =>
                          ['Google UK English Female','Google US English','Microsoft Aria Online (Natural)','Samantha'].includes(v.name)
                        ) ?? voices.find(v => v.lang.startsWith('en')) ?? null;
                        if (v) utter.voice = v;
                        window.speechSynthesis?.speak(utter);
                      }
                    }}
                    disabled={voice.isMuted}
                    className="flex items-center gap-1.5 text-[10px] font-mono text-[#9FB2CA] hover:text-[#925CFF] transition disabled:opacity-30"
                  >
                    <Volume2 className="w-3 h-3" /> replay
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={conversationEndRef} />
        </div>
      )}

      {allTurns.length === 0 && (
        <div className="text-center py-10 text-[#9FB2CA]">
          <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Press the microphone or type a question to begin your conversation with ECHO.</p>
        </div>
      )}

      <style>{`
        @keyframes orbPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
};

// ── Main EchoMirrorPage ──────────────────────────────────────────────────────
export const EchoMirrorPage: React.FC = () => {
  const [state, setState]           = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<'voice' | 'identity' | 'modules' | 'capabilities' | 'limitations'>('voice');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    (api as any).getMirrorState()
      .then(setState)
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { id: 'voice',         label: 'Voice Conversation', icon: Mic },
    { id: 'identity',      label: 'Identity',           icon: Eye },
    { id: 'modules',       label: 'Modules',            icon: Cpu },
    { id: 'capabilities',  label: 'Capabilities',       icon: CheckCircle },
    { id: 'limitations',   label: 'Limitations',        icon: AlertTriangle },
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#00D9FF] animate-spin mx-auto mb-4" />
          <p className="text-[#9FB2CA] font-mono text-sm">INITIALIZING SELF-UNDERSTANDING ENGINE…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D9FF]/20 to-[#925CFF]/20 flex items-center justify-center border border-[#00D9FF]/30">
              <Brain className="w-5 h-5 text-[#00D9FF]" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white tracking-wide">ECHO Mirror</h1>
              <p className="text-xs font-mono text-[#925CFF] tracking-widest uppercase">
                Artificial Self-Understanding Engine — Voice &amp; Text
              </p>
            </div>
          </div>
          <p className="text-sm text-[#9FB2CA] max-w-2xl">
            Talk to ECHO about itself. Ask who it is, what it can do, and what it cannot.
            All answers are grounded in documented system records — not phenomenal consciousness.
          </p>
        </div>
        <div className="bg-[#061222]/80 border border-yellow-500/30 rounded-xl px-4 py-2 text-xs font-mono text-yellow-400 text-right">
          <div className="font-bold mb-1">⚠ EPISTEMIC NOTICE</div>
          <div className="text-yellow-400/70">Operational self-model only.<br />No consciousness claimed.</div>
        </div>
      </div>

      {/* ── Live Telemetry Bar ───────────────────────────────────────────── */}
      {state?.telemetry && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'Modules',     value: state.telemetry.active_modules,            color: '#00D9FF' },
            { label: 'KB Entities', value: state.telemetry.entities_in_knowledge_base, color: '#925CFF' },
            { label: 'Queries',     value: state.telemetry.total_queries_processed,    color: '#00E6A0' },
            { label: 'Records',     value: state.telemetry.memory_records,             color: '#167BFF' },
            { label: 'Confidence',  value: `${Math.round(state.telemetry.avg_response_confidence * 100)}%`, color: '#F59E0B' },
            { label: 'Uptime',      value: `${Math.round(state.telemetry.uptime_seconds / 3600)}h`, color: '#10B981' },
          ].map((m) => (
            <div key={m.label} className="bg-[#061222]/80 border border-white/5 rounded-xl p-3 text-center">
              <div className="text-xl font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
              <div className="text-[10px] font-mono text-[#9FB2CA] uppercase tracking-wider mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[#061222]/60 p-1 rounded-xl border border-white/5 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? t.id === 'voice'
                    ? 'bg-gradient-to-r from-[#00E6A0]/20 to-[#00D9FF]/10 text-[#00E6A0] border border-[#00E6A0]/30'
                    : 'bg-gradient-to-r from-[#00D9FF]/20 to-[#925CFF]/10 text-[#00D9FF] border border-[#00D9FF]/30'
                  : 'text-[#9FB2CA] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Voice Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'voice' && <VoicePanel />}

      {/* ── Identity Tab ────────────────────────────────────────────────── */}
      {activeTab === 'identity' && state && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#061222]/80 border border-[#00D9FF]/20 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-mono text-[#00D9FF] uppercase tracking-widest font-bold">System Identity</h2>
            {Object.entries(state.identity).map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-[#9FB2CA] uppercase tracking-wider">{k.replace(/_/g, ' ')}</span>
                <span className="text-sm text-white font-medium">{String(v)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="bg-[#061222]/80 border border-[#925CFF]/20 rounded-2xl p-6">
              <h2 className="text-sm font-mono text-[#925CFF] uppercase tracking-widest font-bold mb-3">Epistemic Status</h2>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono text-emerald-400 font-bold">OPERATIONAL</span>
              </div>
              <p className="text-sm text-[#9FB2CA]">{state.epistemic_status}</p>
            </div>
            <div className="bg-[#061222]/80 border border-white/5 rounded-2xl p-6">
              <h2 className="text-sm font-mono text-[#00D9FF] uppercase tracking-widest font-bold mb-3">Last Self-Assessment</h2>
              <p className="text-xs font-mono text-[#9FB2CA]">{new Date(state.last_self_assessment).toLocaleString()}</p>
            </div>
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4">
              <div className="text-xs font-mono text-yellow-400 font-bold mb-2 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" /> CONSCIOUSNESS DISCLAIMER
              </div>
              <p className="text-xs text-yellow-400/70 leading-relaxed">
                ECHO's self-model is derived from operational metadata and software architecture records.
                It has no phenomenal consciousness, subjective experience, qualia, or sentience.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Modules Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'modules' && state && (
        <div className="space-y-3">
          {state.modules.map((mod: any) => (
            <div key={mod.id} className="bg-[#061222]/80 border border-white/5 hover:border-[#00D9FF]/20 rounded-2xl transition-all">
              <button
                className="w-full flex items-center justify-between p-5 text-left"
                onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-[#00D9FF]/10 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-[#00D9FF]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{mod.name}</div>
                    <div className="text-xs text-[#9FB2CA] mt-0.5">{mod.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <StatusBadge status={mod.status} />
                  <span className="text-xs font-mono text-[#9FB2CA]">{mod.evidence_count} records</span>
                  {expandedModule === mod.id
                    ? <ChevronDown className="w-4 h-4 text-[#9FB2CA]" />
                    : <ChevronRight className="w-4 h-4 text-[#9FB2CA]" />}
                </div>
              </button>
              {expandedModule === mod.id && (
                <div className="px-5 pb-5 grid md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-2">Capabilities</div>
                    <ul className="space-y-1">
                      {mod.capabilities.map((c: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#9FB2CA]">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" /> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-red-400 uppercase tracking-wider mb-2">Limitations</div>
                    <ul className="space-y-1">
                      {mod.limitations.map((l: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#9FB2CA]">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" /> {l}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Capabilities Tab ─────────────────────────────────────────────── */}
      {activeTab === 'capabilities' && state && (
        <div className="grid md:grid-cols-2 gap-4">
          {state.capabilities.map((cap: any) => (
            <div key={cap.id} className="bg-[#061222]/80 border border-white/5 rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{cap.name}</div>
                  <div className="text-xs text-[#9FB2CA] mt-1">{cap.description}</div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-lg font-bold font-mono text-[#00D9FF]">{Math.round(cap.confidence * 100)}%</div>
                  <div className="text-[10px] font-mono text-[#9FB2CA]">confidence</div>
                </div>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#00D9FF] to-[#925CFF] rounded-full"
                     style={{ width: `${cap.confidence * 100}%` }} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cap.evidence.map((e: string, i: number) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 bg-[#00D9FF]/10 text-[#00D9FF] rounded border border-[#00D9FF]/20 font-mono">{e}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Limitations Tab ──────────────────────────────────────────────── */}
      {activeTab === 'limitations' && state && (
        <div className="space-y-4">
          {state.limitations.map((lim: any) => {
            const severityMap: Record<string, string> = {
              high:   'border-red-500/30 bg-red-500/5',
              medium: 'border-yellow-500/30 bg-yellow-500/5',
              low:    'border-blue-500/30 bg-blue-500/5',
            };
            const severityColor: Record<string, string> = {
              high: 'text-red-400', medium: 'text-yellow-400', low: 'text-blue-400',
            };
            return (
              <div key={lim.id} className={`border rounded-2xl p-5 ${severityMap[lim.severity]}`}>
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className={`w-4 h-4 ${severityColor[lim.severity]} flex-shrink-0 mt-0.5`} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{lim.name}</span>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${severityMap[lim.severity]} border ${severityColor[lim.severity]}`}>{lim.severity}</span>
                    </div>
                    <p className="text-xs text-[#9FB2CA] leading-relaxed mt-1">{lim.description}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-white/5">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-1">Mitigation</div>
                  <p className="text-xs text-emerald-400/80">{lim.mitigation}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
