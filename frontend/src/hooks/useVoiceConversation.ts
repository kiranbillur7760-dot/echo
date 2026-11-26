/**
 * useVoiceConversation
 * ─────────────────────────────────────────────────────────────────────────────
 * Wraps the browser Web Speech API for ECHO Mirror voice conversations.
 *
 * Speech-to-Text  : SpeechRecognition / webkitSpeechRecognition (Chrome / Edge)
 * Text-to-Speech  : SpeechSynthesis + SpeechSynthesisUtterance (all modern browsers)
 *
 * No API keys required. No external service calls. All processing is local in
 * the browser. This is disclosed to the user via the UI — we do not claim
 * real-time cloud voice AI.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Browser type augmentations ──────────────────────────────────────────────
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type VoiceStatus =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error';

export interface ConversationTurn {
  id: string;
  role: 'user' | 'echo';
  text: string;
  confidence?: number;
  epistemic_label?: string;
  grounded_facts?: string[];
  intent_classified?: string;
  timestamp: Date;
}

export interface UseVoiceConversationOptions {
  /** Called with the recognised transcript so the parent can send it to the API */
  onQuery: (transcript: string) => Promise<{
    answer: string;
    confidence?: number;
    epistemic_label?: string;
    grounded_facts?: string[];
    intent_classified?: string;
  }>;
  /** If true, starts listening again after ECHO finishes speaking */
  continuousMode?: boolean;
}

export interface UseVoiceConversationReturn {
  // State
  status: VoiceStatus;
  error: string | null;
  transcript: string;           // live interim transcript
  conversation: ConversationTurn[];
  isMuted: boolean;
  isSupported: boolean;
  currentUtterance: string;     // text currently being spoken

  // Controls
  startListening: () => void;
  stopListening: () => void;
  stopSpeaking: () => void;
  replayLast: () => void;
  toggleMute: () => void;
  clearConversation: () => void;
}

// Pick the best available natural English voice
function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const preferred = [
    // Google / Edge high-quality voices
    'Google UK English Female',
    'Google US English',
    'Microsoft Aria Online (Natural)',
    'Microsoft Jenny Online (Natural)',
    'Microsoft Guy Online (Natural)',
    'Samantha',           // macOS
    'Karen',              // macOS AUS
    'Daniel',             // macOS UK
  ];

  for (const name of preferred) {
    const v = voices.find((v) => v.name === name);
    if (v) return v;
  }

  // Fallback: any en-US or en-GB online voice
  const online = voices.find((v) => v.lang.startsWith('en') && v.localService === false);
  if (online) return online;

  // Final fallback: any English voice
  return voices.find((v) => v.lang.startsWith('en')) ?? voices[0] ?? null;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

export function useVoiceConversation({
  onQuery,
  continuousMode = false,
}: UseVoiceConversationOptions): UseVoiceConversationReturn {
  const [status, setStatus]               = useState<VoiceStatus>('idle');
  const [error, setError]                 = useState<string | null>(null);
  const [transcript, setTranscript]       = useState('');
  const [conversation, setConversation]   = useState<ConversationTurn[]>([]);
  const [isMuted, setIsMuted]             = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState('');

  const recognitionRef  = useRef<any>(null);
  const lastAnswerRef   = useRef('');
  const isMutedRef      = useRef(false);
  const statusRef       = useRef<VoiceStatus>('idle');

  // Keep refs in sync
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { statusRef.current = status; }, [status]);

  // Check browser support
  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
    'speechSynthesis' in window;

  // ── Speech Synthesis ──────────────────────────────────────────────────────
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    if (isMutedRef.current) {
      setStatus('idle');
      onEnd?.();
      return;
    }

    setCurrentUtterance(text);
    setStatus('speaking');

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate  = 0.95;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    // Try to pick a good voice; voices may not be loaded yet
    const trySetVoice = () => {
      const voice = pickVoice();
      if (voice) utter.voice = voice;
    };
    trySetVoice();
    if (!utter.voice) {
      window.speechSynthesis.onvoiceschanged = () => {
        trySetVoice();
        window.speechSynthesis.onvoiceschanged = null;
      };
    }

    utter.onend = () => {
      setStatus('idle');
      setCurrentUtterance('');
      onEnd?.();
    };
    utter.onerror = () => {
      setStatus('idle');
      setCurrentUtterance('');
      onEnd?.();
    };

    window.speechSynthesis.speak(utter);
  }, []);

  // ── Shared query handler ──────────────────────────────────────────────────
  const handleTranscript = useCallback(async (finalText: string) => {
    if (!finalText.trim()) return;

    setStatus('processing');
    setTranscript('');

    const userTurn: ConversationTurn = {
      id: uid(),
      role: 'user',
      text: finalText,
      timestamp: new Date(),
    };
    setConversation((prev) => [...prev, userTurn]);

    try {
      const result = await onQuery(finalText);
      const echoTurn: ConversationTurn = {
        id: uid(),
        role: 'echo',
        text: result.answer,
        confidence: result.confidence,
        epistemic_label: result.epistemic_label,
        grounded_facts: result.grounded_facts,
        intent_classified: result.intent_classified,
        timestamp: new Date(),
      };
      setConversation((prev) => [...prev, echoTurn]);
      lastAnswerRef.current = result.answer;

      speak(result.answer, () => {
        if (continuousMode) startListeningInternal();
      });
    } catch {
      const errMsg = 'I encountered an error processing your question. Please try again.';
      setConversation((prev) => [
        ...prev,
        { id: uid(), role: 'echo', text: errMsg, timestamp: new Date() },
      ]);
      speak(errMsg);
    }
  }, [onQuery, speak, continuousMode]);

  // ── Speech Recognition ────────────────────────────────────────────────────
  const startListeningInternal = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (statusRef.current === 'listening') return;

    window.speechSynthesis.cancel();

    const SpeechRecognitionAPI =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous      = false;
    recognition.interimResults  = true;
    recognition.lang            = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatus('listening');
      setError(null);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final   = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setTranscript(interim || final);
      if (final) {
        recognition.stop();
        handleTranscript(final.trim());
      }
    };

    recognition.onerror = (event: any) => {
      const msgs: Record<string, string> = {
        'no-speech':          'No speech detected. Tap the mic and speak clearly.',
        'audio-capture':      'Microphone not found. Check your device settings.',
        'not-allowed':        'Microphone access denied. Allow microphone permission in your browser.',
        'network':            'Network error during speech recognition.',
        'aborted':            '',
      };
      const msg = msgs[event.error] ?? `Speech error: ${event.error}`;
      if (msg) setError(msg);
      setStatus('idle');
    };

    recognition.onend = () => {
      if (statusRef.current === 'listening') setStatus('idle');
    };

    recognitionRef.current = recognition;
    setStatus('requesting_permission');
    recognition.start();
  }, [isSupported, handleTranscript]);

  const startListening = useCallback(() => {
    setError(null);
    startListeningInternal();
  }, [startListeningInternal]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus('idle');
    setTranscript('');
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setStatus('idle');
    setCurrentUtterance('');
  }, []);

  const replayLast = useCallback(() => {
    if (lastAnswerRef.current) speak(lastAnswerRef.current);
  }, [speak]);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      const next = !m;
      if (next) window.speechSynthesis?.cancel();
      return next;
    });
  }, []);

  const clearConversation = useCallback(() => {
    window.speechSynthesis?.cancel();
    recognitionRef.current?.stop();
    setConversation([]);
    setTranscript('');
    setStatus('idle');
    setError(null);
    lastAnswerRef.current = '';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  return {
    status,
    error,
    transcript,
    conversation,
    isMuted,
    isSupported,
    currentUtterance,
    startListening,
    stopListening,
    stopSpeaking,
    replayLast,
    toggleMute,
    clearConversation,
  };
}
