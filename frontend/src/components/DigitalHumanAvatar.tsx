import React, { useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  ShieldAlert,
  Volume2,
  VolumeX,
  Waves,
  Sparkles,
} from 'lucide-react';
import { VisemeShape, VoiceStatus } from '../hooks/useVoiceConversation';

export interface DigitalHumanAvatarProps {
  expertName: string;
  expertTitle?: string;
  expertDomain?: string;
  avatarUrl?: string;
  isSyntheticDemo?: boolean;
  status: VoiceStatus;
  viseme: VisemeShape;
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
  compact?: boolean;
}

interface PersonaStyle {
  skinBase: string;
  skinShadow: string;
  skinHighlight: string;
  hairColor: string;
  eyeColor: string;
  jacketColor: string;
  accentColor: string;
  hairStyle: 'swept' | 'bob' | 'short' | 'bun';
}

function getPersonaStyle(name: string): PersonaStyle {
  const n = name.toLowerCase();
  if (n.includes('elena') || n.includes('rostova')) {
    return {
      skinBase: '#E9C3AE',
      skinShadow: '#C7967E',
      skinHighlight: '#F8DFD1',
      hairColor: '#3B251B',
      eyeColor: '#2B6E7D',
      jacketColor: '#0F2A3E',
      accentColor: '#00E6A0',
      hairStyle: 'bob',
    };
  }
  if (n.includes('sarah') || n.includes('lin')) {
    return {
      skinBase: '#E8C2A2',
      skinShadow: '#C49573',
      skinHighlight: '#F7DEC7',
      hairColor: '#1B1D26',
      eyeColor: '#2E251F',
      jacketColor: '#1B1A3A',
      accentColor: '#925CFF',
      hairStyle: 'bun',
    };
  }
  if (n.includes('marcus') || n.includes('vance')) {
    return {
      skinBase: '#C89270',
      skinShadow: '#9B684A',
      skinHighlight: '#DFAF90',
      hairColor: '#22242A',
      eyeColor: '#3B2C22',
      jacketColor: '#10243D',
      accentColor: '#167BFF',
      hairStyle: 'short',
    };
  }
  // Default / Dr. Alex Morgan
  return {
    skinBase: '#E5BCA3',
    skinShadow: '#BF8D73',
    skinHighlight: '#F6D9C7',
    hairColor: '#263042',
    eyeColor: '#2979A8',
    jacketColor: '#0E223A',
    accentColor: '#00D9FF',
    hairStyle: 'swept',
  };
}

const VISEME_TARGETS: Record<VisemeShape, { open: number; width: number; round: number }> = {
  rest: { open: 0.04, width: 0.95, round: 0.0 },
  A: { open: 0.85, width: 1.0, round: 0.15 },
  E: { open: 0.45, width: 1.15, round: 0.0 },
  I: { open: 0.30, width: 1.18, round: 0.0 },
  O: { open: 0.72, width: 0.65, round: 0.85 },
  U: { open: 0.42, width: 0.55, round: 0.95 },
  M: { open: 0.02, width: 0.92, round: 0.0 },
  F: { open: 0.18, width: 1.05, round: 0.0 },
};

export const DigitalHumanAvatar: React.FC<DigitalHumanAvatarProps> = ({
  expertName,
  expertTitle,
  expertDomain,
  isSyntheticDemo = false,
  status,
  viseme,
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
  compact = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    status,
    viseme,
    speechEnergy,
    mouseX: 0,
    mouseY: 0,
    curOpen: 0.04,
    curWidth: 0.95,
    curRound: 0.0,
    blink: 0,
    nextBlinkTick: 110,
    gazeX: 0,
    gazeY: 0,
  });

  useEffect(() => {
    stateRef.current.status = status;
    stateRef.current.viseme = viseme;
    stateRef.current.speechEnergy = speechEnergy;
  }, [status, viseme, speechEnergy]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const persona = getPersonaStyle(expertName);
    let rafId = 0;
    let tick = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
      stateRef.current.mouseX = Math.max(-1, Math.min(1, nx));
      stateRef.current.mouseY = Math.max(-1, Math.min(1, ny));
    };
    window.addEventListener('mousemove', onMouseMove);

    const drawFrame = () => {
      tick += 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const st = stateRef.current;

      ctx.clearRect(0, 0, w, h);

      // Background holographic studio gradient
      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.4, 20, w * 0.5, h * 0.5, w * 0.72);
      bgGrad.addColorStop(0, `${persona.accentColor}24`);
      bgGrad.addColorStop(0.55, 'rgba(7, 24, 43, 0.92)');
      bgGrad.addColorStop(1, '#020713');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle futuristic scan-ring aura behind head
      const cx = w * 0.5;
      const cy = h * 0.44;
      const scale = Math.min(w, h) / 310;
      const breath = Math.sin(tick * 0.04) * 2.2 * scale;
      const isSpeaking = st.status === 'speaking';
      const isListening = st.status === 'listening';
      const isThinking = st.status === 'processing';

      // Head motion (natural nod when speaking, slight attentive tilt when listening)
      const headYaw =
        isThinking
          ? Math.sin(tick * 0.05) * 4 * scale
          : isSpeaking
          ? Math.sin(tick * 0.11) * 3.5 * scale
          : st.mouseX * 4 * scale;
      const headPitch =
        isSpeaking
          ? Math.sin(tick * 0.16) * 2.5 * scale
          : isListening
          ? -2 * scale
          : st.mouseY * 2.5 * scale;

      // Halo ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 108 * scale, 0, Math.PI * 2);
      ctx.strokeStyle = isSpeaking
        ? `${persona.accentColor}66`
        : isListening
        ? 'rgba(0, 230, 160, 0.55)'
        : isThinking
        ? 'rgba(146, 92, 255, 0.55)'
        : `${persona.accentColor}25`;
      ctx.lineWidth = isSpeaking || isListening ? 2.5 : 1.2;
      ctx.stroke();

      // Voice reactive acoustic ring
      if (isSpeaking || isListening) {
        ctx.beginPath();
        const pts = 48;
        for (let i = 0; i <= pts; i++) {
          const ang = (i / pts) * Math.PI * 2;
          const amp = isSpeaking
            ? (4 + st.speechEnergy * 10) * Math.sin(ang * 6 + tick * 0.25)
            : 4 * Math.sin(ang * 4 + tick * 0.12);
          const rad = (114 * scale) + amp * scale;
          const px = cx + Math.cos(ang) * rad;
          const py = cy + Math.sin(ang) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = isListening ? 'rgba(0,230,160,0.45)' : `${persona.accentColor}55`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      // Interpolate viseme smoothly
      const targetViseme = isSpeaking
        ? VISEME_TARGETS[st.viseme] || VISEME_TARGETS.A
        : VISEME_TARGETS.rest;
      const energyBoost = isSpeaking ? 0.65 + st.speechEnergy * 0.45 : 1.0;
      st.curOpen += (targetViseme.open * energyBoost - st.curOpen) * 0.34;
      st.curWidth += (targetViseme.width - st.curWidth) * 0.3;
      st.curRound += (targetViseme.round - st.curRound) * 0.3;

      // Blinking timer
      if (tick >= st.nextBlinkTick) {
        st.blink = 1.0;
        st.nextBlinkTick = tick + 120 + Math.floor(Math.random() * 140);
      } else {
        st.blink = Math.max(0, st.blink - 0.18);
      }
      const eyeOpenFactor = 1.0 - Math.sin(st.blink * Math.PI);

      // Gaze target (up-left when thinking, user/cursor otherwise)
      const targetGazeX = isThinking ? -0.45 : st.mouseX * 0.55;
      const targetGazeY = isThinking ? -0.35 : st.mouseY * 0.45;
      st.gazeX += (targetGazeX - st.gazeX) * 0.12;
      st.gazeY += (targetGazeY - st.gazeY) * 0.12;

      // Shoulders / Suit Torso
      ctx.save();
      ctx.translate(0, breath * 0.6);
      const shoulderY = cy + 92 * scale;
      const suitGrad = ctx.createLinearGradient(cx - 115 * scale, shoulderY, cx + 115 * scale, h);
      suitGrad.addColorStop(0, persona.jacketColor);
      suitGrad.addColorStop(1, '#06101E');
      ctx.fillStyle = suitGrad;
      ctx.beginPath();
      ctx.moveTo(cx - 122 * scale, h + 10);
      ctx.quadraticCurveTo(cx - 112 * scale, shoulderY, cx - 34 * scale, shoulderY - 10 * scale);
      ctx.lineTo(cx + 34 * scale, shoulderY - 10 * scale);
      ctx.quadraticCurveTo(cx + 112 * scale, shoulderY, cx + 122 * scale, h + 10);
      ctx.closePath();
      ctx.fill();

      // Collar / Lapels with subtle cyan trim
      ctx.strokeStyle = `${persona.accentColor}55`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx - 32 * scale, shoulderY - 8 * scale);
      ctx.lineTo(cx, shoulderY + 34 * scale);
      ctx.lineTo(cx + 32 * scale, shoulderY - 8 * scale);
      ctx.stroke();

      // Neck
      const neckGrad = ctx.createLinearGradient(cx, shoulderY - 35 * scale, cx, shoulderY + 12 * scale);
      neckGrad.addColorStop(0, persona.skinShadow);
      neckGrad.addColorStop(1, persona.skinBase);
      ctx.fillStyle = neckGrad;
      ctx.beginPath();
      ctx.roundRect(cx - 21 * scale + headYaw * 0.3, cy + 44 * scale, 42 * scale, 48 * scale, 14 * scale);
      ctx.fill();
      ctx.restore();

      // Head Group
      ctx.save();
      ctx.translate(cx + headYaw, cy + headPitch + breath * 0.4);
      const tiltAngle = isListening ? 0.035 : isSpeaking ? Math.sin(tick * 0.08) * 0.02 : 0;
      ctx.rotate(tiltAngle);

      // Back hair silhouette for bob/bun personas
      ctx.fillStyle = persona.hairColor;
      if (persona.hairStyle === 'bob') {
        ctx.beginPath();
        ctx.ellipse(0, 6 * scale, 68 * scale, 78 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (persona.hairStyle === 'bun') {
        ctx.beginPath();
        ctx.arc(0, -68 * scale, 22 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ears
      ctx.fillStyle = persona.skinShadow;
      ctx.beginPath();
      ctx.ellipse(-56 * scale, 4 * scale, 8 * scale, 16 * scale, 0, 0, Math.PI * 2);
      ctx.ellipse(56 * scale, 4 * scale, 8 * scale, 16 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Face Oval with 3D Studio Shading
      const faceGrad = ctx.createRadialGradient(-14 * scale, -18 * scale, 8 * scale, 0, 5 * scale, 78 * scale);
      faceGrad.addColorStop(0, persona.skinHighlight);
      faceGrad.addColorStop(0.58, persona.skinBase);
      faceGrad.addColorStop(1, persona.skinShadow);
      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.moveTo(0, -68 * scale);
      ctx.bezierCurveTo(56 * scale, -68 * scale, 58 * scale, 12 * scale, 44 * scale, 46 * scale);
      ctx.bezierCurveTo(28 * scale, 70 * scale, 14 * scale, 74 * scale, 0, 74 * scale);
      ctx.bezierCurveTo(-14 * scale, 74 * scale, -28 * scale, 70 * scale, -44 * scale, 46 * scale);
      ctx.bezierCurveTo(-58 * scale, 12 * scale, -56 * scale, -68 * scale, 0, -68 * scale);
      ctx.closePath();
      ctx.fill();

      // Subtle holographic rim light along jawline
      ctx.strokeStyle = `${persona.accentColor}44`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top Hair
      ctx.fillStyle = persona.hairColor;
      ctx.beginPath();
      if (persona.hairStyle === 'swept' || persona.hairStyle === 'short') {
        ctx.moveTo(-54 * scale, -18 * scale);
        ctx.bezierCurveTo(-58 * scale, -68 * scale, -20 * scale, -82 * scale, 8 * scale, -78 * scale);
        ctx.bezierCurveTo(44 * scale, -75 * scale, 58 * scale, -48 * scale, 54 * scale, -18 * scale);
        ctx.bezierCurveTo(38 * scale, -42 * scale, 8 * scale, -48 * scale, -24 * scale, -40 * scale);
        ctx.bezierCurveTo(-40 * scale, -35 * scale, -48 * scale, -24 * scale, -54 * scale, -18 * scale);
      } else {
        ctx.moveTo(-58 * scale, -10 * scale);
        ctx.bezierCurveTo(-60 * scale, -72 * scale, -12 * scale, -80 * scale, 0, -78 * scale);
        ctx.bezierCurveTo(18 * scale, -80 * scale, 60 * scale, -70 * scale, 58 * scale, -10 * scale);
        ctx.bezierCurveTo(38 * scale, -44 * scale, 6 * scale, -48 * scale, -6 * scale, -44 * scale);
        ctx.bezierCurveTo(-24 * scale, -46 * scale, -46 * scale, -36 * scale, -58 * scale, -10 * scale);
      }
      ctx.closePath();
      ctx.fill();

      // Eyebrows (expressive lift when listening or speaking)
      const browLift = (isListening ? -3.2 : isSpeaking ? -1.8 * st.speechEnergy : isThinking ? 1.5 : 0) * scale;
      ctx.strokeStyle = persona.hairColor;
      ctx.lineWidth = 3.2 * scale;
      ctx.lineCap = 'round';
      // Left brow
      ctx.beginPath();
      ctx.moveTo(-34 * scale, -18 * scale + browLift);
      ctx.quadraticCurveTo(-21 * scale, -24 * scale + browLift, -9 * scale, -18 * scale + browLift * 0.6);
      ctx.stroke();
      // Right brow
      ctx.beginPath();
      ctx.moveTo(9 * scale, -18 * scale + browLift * 0.6);
      ctx.quadraticCurveTo(21 * scale, -24 * scale + browLift, 34 * scale, -18 * scale + browLift);
      ctx.stroke();

      // Eyes (Sclera, Iris, Pupil, Specular Glint, Blinking Eyelid)
      const drawEye = (ex: number) => {
        const ey = -4 * scale;
        const ew = 11.5 * scale;
        const eh = Math.max(0.8 * scale, 6.2 * scale * eyeOpenFactor);

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(ex, ey, ew, eh, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#F7FAFC';
        ctx.fill();
        ctx.clip();

        // Iris
        const ix = ex + st.gazeX * 3.8 * scale;
        const iy = ey + st.gazeY * 2.2 * scale;
        ctx.beginPath();
        ctx.arc(ix, iy, 5.2 * scale, 0, Math.PI * 2);
        ctx.fillStyle = persona.eyeColor;
        ctx.fill();

        // Pupil
        ctx.beginPath();
        ctx.arc(ix, iy, 2.4 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#070C14';
        ctx.fill();

        // Corneal highlight
        ctx.beginPath();
        ctx.arc(ix - 1.6 * scale, iy - 1.6 * scale, 1.3 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();

        // Upper lash line
        ctx.strokeStyle = '#1E2430';
        ctx.lineWidth = 1.8 * scale;
        ctx.beginPath();
        ctx.ellipse(ex, ey, ew, eh, 0, Math.PI, Math.PI * 2);
        ctx.stroke();
      };

      drawEye(-21 * scale);
      drawEye(21 * scale);

      // Nose Bridge & Tip Shading
      ctx.strokeStyle = persona.skinShadow;
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.moveTo(0, -4 * scale);
      ctx.quadraticCurveTo(3 * scale, 14 * scale, 4 * scale, 19 * scale);
      ctx.quadraticCurveTo(0, 22 * scale, -4 * scale, 19 * scale);
      ctx.stroke();

      // Mouth & Lip-Sync Viseme Rig
      const mouthY = 39 * scale;
      const mouthHalfW = 16 * scale * st.curWidth;
      const mouthOpenH = Math.max(1.2 * scale, 13 * scale * st.curOpen);
      const smileLift = isSpeaking ? 1.8 * scale : isListening ? 2.5 * scale : 1.2 * scale;

      // Mouth cavity when open
      if (st.curOpen > 0.12) {
        ctx.fillStyle = '#3B161B';
        ctx.beginPath();
        ctx.ellipse(0, mouthY + mouthOpenH * 0.25, mouthHalfW * 0.85, mouthOpenH * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();

        // Upper teeth hint
        ctx.fillStyle = '#F2F4F8';
        ctx.beginPath();
        ctx.ellipse(0, mouthY - mouthOpenH * 0.15, mouthHalfW * 0.65, Math.min(3 * scale, mouthOpenH * 0.3), 0, 0, Math.PI);
        ctx.fill();
      }

      // Upper Lip
      ctx.strokeStyle = '#9E5A58';
      ctx.fillStyle = '#B86E6B';
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.moveTo(-mouthHalfW, mouthY - smileLift * 0.4);
      ctx.quadraticCurveTo(-mouthHalfW * 0.45, mouthY - 3.5 * scale, 0, mouthY - 2 * scale);
      ctx.quadraticCurveTo(mouthHalfW * 0.45, mouthY - 3.5 * scale, mouthHalfW, mouthY - smileLift * 0.4);
      ctx.quadraticCurveTo(0, mouthY + 1.5 * scale - mouthOpenH * 0.25, -mouthHalfW, mouthY - smileLift * 0.4);
      ctx.fill();

      // Lower Lip
      ctx.fillStyle = '#C67B78';
      ctx.beginPath();
      ctx.moveTo(-mouthHalfW * 0.92, mouthY + mouthOpenH * 0.15);
      ctx.quadraticCurveTo(0, mouthY + mouthOpenH * 1.05 + 4 * scale, mouthHalfW * 0.92, mouthY + mouthOpenH * 0.15);
      ctx.quadraticCurveTo(0, mouthY + mouthOpenH * 0.55, -mouthHalfW * 0.92, mouthY + mouthOpenH * 0.15);
      ctx.fill();

      ctx.restore();
      rafId = requestAnimationFrame(drawFrame);
    };

    drawFrame();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [expertName]);

  const statusBadge = {
    idle: { label: 'READY TO SPEAK', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40' },
    requesting_permission: { label: 'MIC ACCESS...', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40' },
    listening: { label: 'LISTENING', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse' },
    processing: { label: 'RETRIEVING & ANALYZING', cls: 'bg-purple-500/20 text-purple-300 border-purple-500/50 animate-pulse' },
    speaking: { label: 'SPEAKING', cls: 'bg-cyan-500/25 text-white border-cyan-400 shadow-glow-cyan' },
    error: { label: 'AUDIO ISSUE', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  }[status];

  return (
    <div className="rounded-2xl glass-panel border border-[#00D9FF]/30 overflow-hidden flex flex-col">
      {/* Transparency & AI Representation Disclosure */}
      <div className="px-4 py-2 bg-[#020713]/90 border-b border-[#00D9FF]/15 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-200">
          <Sparkles className="w-3.5 h-3.5 text-[#00D9FF] flex-shrink-0" />
          <span>
            AI Digital Representation of <strong>{expertName}</strong> (Not human consciousness)
          </span>
          {isSyntheticDemo && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              SYNTHETIC DEMO
            </span>
          )}
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${statusBadge.cls}`}>
          {statusBadge.label}
        </span>
      </div>

      {/* Avatar Canvas Stage */}
      <div className={`relative w-full ${compact ? 'h-64' : 'h-80 sm:h-96'} bg-[#020713]`}>
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Expert Identity Overlay Top-Left */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-[#020713]/75 backdrop-blur-md border border-white/10">
          <div className="text-xs font-bold text-white">{expertName}</div>
          {expertTitle && <div className="text-[10px] text-[#00D9FF] line-clamp-1">{expertTitle}</div>}
          {expertDomain && <div className="text-[9px] font-mono text-[#9FB2CA]">{expertDomain}</div>}
        </div>

        {/* Live Subtitles Bar */}
        {subtitle && (
          <div className="absolute bottom-3 left-3 right-3 px-4 py-2.5 rounded-xl bg-[#020713]/85 backdrop-blur-md border border-[#00D9FF]/25 text-center">
            <p className="text-xs sm:text-sm text-white leading-snug line-clamp-2">{subtitle}</p>
          </div>
        )}
      </div>

      {/* Voice Call Controls */}
      <div className="px-4 py-3 bg-[#061222]/90 border-t border-[#00D9FF]/15 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {!callActive && onStartCall ? (
            <button
              type="button"
              onClick={onStartCall}
              className="px-4 py-2 rounded-xl btn-cyber-primary text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              Start Voice Call
            </button>
          ) : (
            <>
              {status === 'speaking' ? (
                <button
                  type="button"
                  onClick={onInterrupt}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition"
                  title="Interrupt avatar and ask a follow-up question"
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            className={`px-3 py-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 cursor-pointer transition ${
              isMuted
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-white/5 border-white/10 text-[#9FB2CA] hover:text-white'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'Muted' : 'Audio On'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
