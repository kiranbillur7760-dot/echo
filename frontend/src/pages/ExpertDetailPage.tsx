import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ExpertDetail, KnowledgeUnit, ExpertConsentInfo } from '../types';
import { DigitalHumanAvatar } from '../components/DigitalHumanAvatar';
import { useVoiceConversation } from '../hooks/useVoiceConversation';
import {
  ShieldCheck,
  Award,
  Briefcase,
  ChevronRight,
  ArrowLeft,
  Cpu,
  FileText,
  Calendar,
  CheckCircle2,
  BookOpen,
  Network,
  PhoneCall,
  PhoneOff,
  Mic,
  Volume2,
  VolumeX,
  Radio,
  Lock,
  Layers,
  Sparkles,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { FeatureHeader } from '../components/FeatureInfoModal';

export const ExpertDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expert, setExpert] = useState<ExpertDetail | null>(null);
  const [knowledgeUnits, setKnowledgeUnits] = useState<KnowledgeUnit[]>([]);
  const [consent, setConsent] = useState<ExpertConsentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Live Voice Call Modal State
  const [showCallModal, setShowCallModal] = useState(false);
  const [callActive, setCallActive] = useState(false);

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
      if (!expert) return { answer: 'Expert unavailable.' };
      const res = await api.askEcho(spokenText, [], expert.id, {
        mode: 'complete_human_intelligence',
        aiProvider: 'auto',
      });
      const answer = res.narrative_answer || res.hybrid_recommendation || 'No verified information available.';
      speakUtterance(answer);
      return { answer };
    },
    continuousMode: false,
  });

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [expRes, kuRes, consentRes] = await Promise.all([
          api.getExpertDetail(Number(id)),
          api.getKnowledgeUnits({ expert_id: Number(id) }).catch(() => []),
          api.getExpertConsent(Number(id)).catch(() => null),
        ]);
        setExpert(expRes);
        setKnowledgeUnits(kuRes);
        setConsent(consentRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleStartCall = () => {
    setShowCallModal(true);
    setCallActive(true);
    startListening();
  };

  const handleEndCall = () => {
    setCallActive(false);
    stopListening();
    cancelSpeech();
    setShowCallModal(false);
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center font-mono text-[#00D9FF]">
        Retrieving Expert Intelligence Profile #{id}...
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="p-8 text-center text-red-400">
        Expert profile #{id} not found in the intelligence repository.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      <FeatureHeader featureKey="experts" />

      {/* Top Back Nav */}
      <button
        onClick={() => navigate('/experts')}
        className="flex items-center gap-2 text-xs font-mono text-[#9FB2CA] hover:text-[#00D9FF] transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO ROSTER
      </button>

      {/* Header Profile Card */}
      <div className="p-8 rounded-2xl glass-panel border border-[#00D9FF]/20 relative overflow-hidden">
        {expert.is_synthetic_demo && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded text-xs font-mono bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-semibold">
            SYNTHETIC DEMONSTRATION RECORD
          </div>
        )}

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <img
            src={
              expert.avatar_url ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
            }
            alt={expert.name}
            className="w-28 h-28 rounded-2xl object-cover border-2 border-[#00D9FF] shadow-glow-cyan"
          />

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold font-display text-white">{expert.name}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                VERIFIED SPECIALIST
              </span>
            </div>

            <p className="text-sm font-semibold text-[#00D9FF] mb-1">{expert.title}</p>
            <p className="text-xs text-[#9FB2CA]">{expert.organization} • {expert.domain} • {expert.years_experience} Years Preserved Experience</p>

            <p className="text-xs text-[#F4F8FF]/80 leading-relaxed mt-4 max-w-4xl">
              {expert.bio}
            </p>
          </div>
        </div>

        {/* Action Bar with Prominent "Speak with Digital Human" Button */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-white/5">
          <button
            onClick={handleStartCall}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>SPEAK WITH DIGITAL HUMAN AVATAR</span>
          </button>

          <button
            onClick={() => navigate('/ask-echo')}
            className="px-5 py-2.5 rounded-xl btn-cyber-primary text-xs flex items-center gap-2 uppercase tracking-wider font-bold"
          >
            <Radio className="w-4 h-4" />
            <span>Open in Ask ECHO (Complete Human Mode)</span>
          </button>

          <button
            onClick={() => navigate('/decisions')}
            className="px-5 py-2.5 rounded-xl btn-cyber-secondary text-xs flex items-center gap-2 uppercase tracking-wider font-semibold"
          >
            <Cpu className="w-4 h-4 text-[#00D9FF]" />
            <span>Reconstruct Decision DNA</span>
          </button>

          <button
            onClick={() => navigate('/graph')}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#9FB2CA] hover:text-white border border-white/10 text-xs flex items-center gap-2 uppercase tracking-wider font-semibold cursor-pointer"
          >
            <Network className="w-4 h-4 text-[#00D9FF]" />
            <span>Knowledge Graph</span>
          </button>
        </div>
      </div>

      {/* Grid: Core Competencies & Consent Governance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Competencies */}
        <div className="p-6 rounded-2xl glass-panel space-y-4">
          <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#00D9FF]" />
            CORE TECHNICAL COMPETENCIES
          </h3>

          <div className="flex flex-wrap gap-2">
            {(expert.profile?.core_competencies || [
              'Ceramic Matrix Composites (CMC)',
              'Hypersonic Aerothermodynamics',
              'Atmospheric Re-entry TPS Design',
              'Aero-acoustic Structural Damping',
              'Thermal Barrier Coatings',
            ]).map((comp, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-lg bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/30 text-xs font-mono"
              >
                {comp}
              </span>
            ))}
          </div>

          <h4 className="text-xs font-mono text-[#9FB2CA] uppercase tracking-wider mt-6 mb-2">
            Awards & Commendations
          </h4>
          <div className="space-y-2">
            {(expert.profile?.awards_recognitions || [
              'AIAA Aerospace Materials Excellence Medal (Synthetic, 2021)',
              'Orbital Flight Systems Engineering Laureate (Synthetic, 2018)',
            ]).map((award, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs text-white">
                <Award className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
                <span>{award}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expert Consent & Ethical Governance (Section 13) */}
        <div className="p-6 rounded-2xl glass-panel space-y-4">
          <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#00E6A0]" />
            EXPERT CONSENT & ETHICAL GOVERNANCE
          </h3>

          <p className="text-xs text-[#9FB2CA] leading-relaxed">
            PROJECT ECHO enforces strict cryptographic consent and review rights for every preserved specialist before utilizing their voice, knowledge, or digital likeness.
          </p>

          <div className="space-y-2.5 pt-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#020713]/80 border border-white/5 flex items-center justify-between">
              <span className="text-slate-300">Knowledge Preservation Consent</span>
              <span className={`px-2 py-0.5 rounded text-[10px] ${consent?.consent_knowledge !== false ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400'}`}>
                {consent?.consent_knowledge !== false ? 'ACTIVE & SIGNED' : 'REVOKED'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#020713]/80 border border-white/5 flex items-center justify-between">
              <span className="text-slate-300">Voice Synthesis & Lip-Sync Consent</span>
              <span className={`px-2 py-0.5 rounded text-[10px] ${consent?.consent_voice !== false ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400'}`}>
                {consent?.consent_voice !== false ? 'AUTHORIZED' : 'DENIED'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#020713]/80 border border-white/5 flex items-center justify-between">
              <span className="text-slate-300">Digital Avatar Likeness Consent</span>
              <span className={`px-2 py-0.5 rounded text-[10px] ${consent?.consent_likeness !== false ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400'}`}>
                {consent?.consent_likeness !== false ? 'ACTIVE' : 'RESTRICTED'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#020713]/80 border border-white/5 flex items-center justify-between">
              <span className="text-slate-300">Ethical Disclosure State</span>
              <span className="text-[#00D9FF]">AI REPRESENTATION DISCLOSED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Knowledge Units (Section 3) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#00D9FF]" />
            STRUCTURED KNOWLEDGE UNITS ({knowledgeUnits.length})
          </h3>
          <span className="text-xs font-mono text-[#9FB2CA]">
            5 Verification States Enforced
          </span>
        </div>

        {knowledgeUnits.length === 0 ? (
          <div className="p-6 rounded-2xl glass-panel text-center text-xs text-[#9FB2CA]">
            No Knowledge Units yet approved for this expert. Create them in the Expert Intelligence Studio.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledgeUnits.map((ku) => (
              <div
                key={ku.id}
                className="p-5 rounded-2xl glass-panel border border-[#00D9FF]/15 space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/30 font-bold">
                    {ku.category.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      ku.verification_status === 'approved_by_expert'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : ku.verification_status === 'awaiting_expert_review'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : ku.verification_status === 'ai_extracted'
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {ku.verification_status.replace(/_/g, ' ')}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{ku.title}</h4>
                <p className="text-[#9FB2CA] text-xs leading-relaxed">{ku.description}</p>

                {ku.reasoning_and_method && (
                  <div className="p-2.5 rounded-lg bg-[#020713]/80 border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono text-[#00D9FF] uppercase block font-semibold">
                      Reasoning & Method
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">{ku.reasoning_and_method}</p>
                  </div>
                )}

                {ku.source_reference && (
                  <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5 flex items-center justify-between">
                    <span>Source: {ku.source_reference}</span>
                    <span>Confidence: {Math.round(ku.confidence_score * 100)}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Linked Projects */}
      <div className="space-y-4">
        <h3 className="text-base font-bold font-display text-white">
          PRESERVED FLIGHT & ENGINEERING PROGRAMS ({expert.projects.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expert.projects.map((proj) => (
            <div key={proj.id} className="p-5 rounded-2xl glass-panel border border-[#00D9FF]/15">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-[#167BFF]/15 text-[#167BFF] border border-[#167BFF]/30">
                  {proj.domain}
                </span>
                <span className="text-[11px] font-mono text-[#00E6A0] uppercase">{proj.status}</span>
              </div>

              <h4 className="text-sm font-bold text-white mb-1.5">{proj.title}</h4>
              <p className="text-xs text-[#9FB2CA] leading-relaxed mb-3">{proj.description}</p>
              <div className="text-[11px] font-mono text-[#00D9FF]">Role: {proj.role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Linked Decisions */}
      <div className="space-y-4">
        <h3 className="text-base font-bold font-display text-white">
          RECONSTRUCTED DECISION DNA ({expert.decisions.length})
        </h3>

        <div className="space-y-3">
          {expert.decisions.map((dec) => (
            <div
              key={dec.id}
              onClick={() => navigate('/decisions')}
              className="p-5 rounded-2xl glass-panel glass-panel-hover cursor-pointer flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono text-[#925CFF] uppercase font-semibold">
                  Decision DNA #{dec.id} • {Math.round(dec.confidence * 100)}% Confidence
                </span>
                <h4 className="text-sm font-bold text-white mt-1">{dec.title}</h4>
                <p className="text-xs text-[#9FB2CA] mt-1">{dec.problem}</p>
              </div>

              <div className="flex items-center gap-1 text-xs text-[#00D9FF] font-medium ml-4">
                <span>Inspect DNA</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Voice Call Modal with Digital Human Avatar */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-[#00D9FF]/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-base font-bold text-white">
                  Live Voice Call: {expert.name}
                </h3>
              </div>
              <button
                onClick={handleEndCall}
                className="px-3 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex justify-center py-2">
              <DigitalHumanAvatar
                expertName={expert.name}
                expertTitle={expert.title}
                expertDomain={expert.domain}
                status={voiceStatus}
                viseme={viseme}
                speechEnergy={speechEnergy}
                subtitle={currentSubtitle || liveTranscript}
                isMuted={isMuted}
                isVoiceSupported={isVoiceSupported}
                callActive={callActive}
                onStartCall={() => {
                  setCallActive(true);
                  startListening();
                }}
                onEndCall={handleEndCall}
                onMicClick={() => {
                  if (voiceStatus === 'listening') stopListening();
                  else startListening();
                }}
                onInterrupt={interruptAndListen}
                onToggleMute={toggleMute}
                compact={false}
              />
            </div>

            {(currentSubtitle || liveTranscript) && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-[#00D9FF]/30 text-xs text-cyan-200 font-mono">
                <div className="text-[9px] uppercase tracking-wider text-slate-400 mb-1">
                  {voiceStatus === 'listening' ? 'You said:' : `${expert.name} Speaking:`}
                </div>
                <p className="italic leading-relaxed">"{currentSubtitle || liveTranscript}"</p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleEndCall}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono flex items-center gap-2 cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>END CALL</span>
              </button>
              <button
                onClick={interruptAndListen}
                className="px-4 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>INTERRUPT & SPEAK</span>
              </button>
              <button
                onClick={toggleMute}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400 font-mono pt-1">
              Live Voice Intelligence uses speech-to-text, WebSocket/REST retrieval, and real-time lip sync visemes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
