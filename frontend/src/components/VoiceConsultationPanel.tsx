import React from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  ShieldAlert,
  Volume2,
  VolumeX,
  Waves,
  Radio,
} from 'lucide-react';
import { VoiceStatus } from '../hooks/useVoiceConversation';

export interface VoiceConsultationPanelProps {
  expertName: string;
  expertTitle?: string;
  expertDomain?: string;
  isSyntheticDemo?: boolean;
  status: VoiceStatus;
  speechEnergy: number;
  subtitle?: string;
  isMuted: boolean;
  isVoiceSupported: boolean;
  callActive?: boolean;
  onStartCall?: () => void;
  onEndCall?: () => void;
  onMicClick: () => void;
  onInterrupt: () => void;
  onToggleMute: () => void;
}

const BAR_FACTORS = [0.35, 0.55, 0.78, 0.95, 1.0, 0.85, 0.65, 0.9, 1.0, 0.72, 0.5, 0.35];

export const VoiceConsultationPanel: React.FC<VoiceConsultationPanelProps> = ({
  expertName,
  expertTitle,
  expertDomain,
  isSyntheticDemo = false,
  status,
  speechEnergy,
  subtitle,
  isMuted,
  isVoiceSupported,
  callActive = true,
  onStartCall,
  onEndCall,
  onMicClick,
  onInterrupt,
  onToggleMute,
}) => {
  const statusBadge = {
    idle: { label: 'VOICE READY', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' },
    requesting_permission: { label: 'MIC ACCESS...', cls: 'bg-amber-500/20 text-amber-200 border-amber-500/40' },
    listening: { label: 'LISTENING', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse' },
    processing: { label: 'RETRIEVING EVIDENCE...', cls: 'bg-purple-500/20 text-purple-300 border-purple-500/50 animate-pulse' },
    speaking: { label: 'SPEAKING', cls: 'bg-cyan-500/25 text-white border-cyan-400' },
    error: { label: 'AUDIO ISSUE', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  }[status];

  const isActiveWave = status === 'speaking' || status === 'listening' || status === 'processing';

  return (
    <div className="rounded-2xl glass-panel border border-[#00D9FF]/30 overflow-hidden flex flex-col w-full max-w-2xl">
      {/* Header */}
      <div className="px-4 py-2.5 bg-[#020713]/95 border-b border-white/10 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
          <Radio className="w-3.5 h-3.5 text-[#00D9FF] flex-shrink-0" />
          <span>
            Voice Consultation: <strong className="text-white">{expertName}</strong>
          </span>
          {isSyntheticDemo && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px]">
              SYNTHETIC DEMO
            </span>
          )}
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
      </div>

      {/* Pure Voice Acoustic Stage */}
      <div className="px-6 py-8 bg-gradient-to-b from-[#061222] to-[#020713] flex flex-col items-center text-center space-y-5">
        <div className="space-y-1">
          <h4 className="text-base font-bold text-white">{expertName}</h4>
          {expertTitle && <p className="text-xs text-[#00D9FF]">{expertTitle}</p>}
          {expertDomain && <p className="text-[11px] font-mono text-[#9FB2CA]">{expertDomain}</p>}
        </div>

        {/* Live Acoustic Waveform */}
        <div className="flex items-center justify-center gap-1.5 h-16 px-6 py-3 rounded-2xl bg-[#020713]/80 border border-[#00D9FF]/20">
          {BAR_FACTORS.map((factor, idx) => {
            const dynamicScale =
              status === 'speaking'
                ? Math.max(0.22, Math.min(1, factor * (0.35 + speechEnergy * 0.95)))
                : status === 'listening'
                ? Math.max(0.2, factor * 0.6)
                : status === 'processing'
                ? Math.max(0.2, factor * 0.45)
                : 0.18;
            return (
              <span
                key={idx}
                style={{ height: `${Math.round(dynamicScale * 40)}px` }}
                className={`w-1.5 rounded-full transition-all duration-150 ${
                  status === 'listening'
                    ? 'bg-emerald-400'
                    : status === 'processing'
                    ? 'bg-purple-400'
                    : isActiveWave
                    ? 'bg-[#00D9FF]'
                    : 'bg-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Live Subtitles / Transcript */}
        {subtitle ? (
          <div className="w-full p-3.5 rounded-xl bg-black/50 border border-[#00D9FF]/25 text-xs sm:text-sm text-slate-100 leading-relaxed">
            {subtitle}
          </div>
        ) : (
          <p className="text-xs font-mono text-slate-400">
            {status === 'listening'
              ? 'Listening — speak your question clearly...'
              : status === 'processing'
              ? 'Searching preserved records and generating grounded answer...'
              : 'Press "Speak Question" to ask by voice, or type in the conversation panel.'}
          </p>
        )}
      </div>

      {/* Voice Controls */}
      <div className="px-4 py-3 bg-[#061222]/95 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {!callActive && onStartCall ? (
            <button
              type="button"
              onClick={onStartCall}
              className="px-4 py-2 rounded-xl btn-cyber-primary text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              Start Voice Consultation
            </button>
          ) : (
            <>
              {status === 'speaking' ? (
                <button
                  type="button"
                  onClick={onInterrupt}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition"
                  title="Interrupt and ask a follow-up question"
                >
                  <Waves className="w-4 h-4" />
                  Interrupt &amp; Speak
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onMicClick}
                  disabled={!isVoiceSupported || status === 'processing'}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border cursor-pointer transition disabled:opacity-40 ${
                    status === 'listening'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                      : 'bg-[#00E6A0]/15 text-[#00E6A0] border-[#00E6A0]/40 hover:bg-[#00E6A0]/25'
                  }`}
                >
                  {status === 'listening' ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      Stop Mic
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      {isVoiceSupported ? 'Speak Question' : 'Mic Unavailable (Use Text)'}
                    </>
                  )}
                </button>
              )}

              {onEndCall && (
                <button
                  type="button"
                  onClick={onEndCall}
                  className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  End
                </button>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          title={isMuted ? 'Unmute voice output' : 'Mute voice output'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
          {isMuted ? 'Muted' : 'Audio On'}
        </button>
      </div>

      {/* Transparency Footer */}
      <div className="px-4 py-1.5 bg-[#020713] border-t border-white/5 flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
        <ShieldAlert className="w-3 h-3 text-cyan-400 flex-shrink-0" />
        <span>
          AI-assisted voice synthesis grounded in preserved records. Not the actual expert speaking.
        </span>
      </div>
    </div>
  );
};
