import React, { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { Expert, ExpertConsentInfo, KnowledgeUnit } from '../types';
import {
  Sparkles,
  Mic,
  Video,
  FileText,
  PenTool,
  Wrench,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Upload,
  Square,
  Edit3,
  History,
} from 'lucide-react';

type CaptureTab = 'interview' | 'voice' | 'video' | 'document' | 'manual' | 'demonstration' | 'review';

const STATUS_BADGE: Record<string, string> = {
  ai_extracted: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  awaiting_expert_review: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  approved_by_expert: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  needs_correction: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
};

const CATEGORIES = [
  'fact_concept',
  'experience',
  'reasoning_decision',
  'practical_skill',
  'method_procedure',
  'problem_solution',
  'failure_lesson',
  'opinion_hypothesis',
  'observation',
];

export const CreateExpertStudioPage: React.FC = () => {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [selectedExpertId, setSelectedExpertId] = useState<number>(1);
  const [consent, setConsent] = useState<ExpertConsentInfo | null>(null);
  const [activeTab, setActiveTab] = useState<CaptureTab>('document');
  const [units, setUnits] = useState<KnowledgeUnit[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // 1. Document Capture
  const [docTitle, setDocTitle] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  // 2. AI-Guided Interview
  const [ivTopic, setIvTopic] = useState('');
  const [ivTurns, setIvTurns] = useState<Array<{ question: string; answer: string }>>([]);
  const [ivCurrentQ, setIvCurrentQ] = useState<string | null>(null);
  const [ivAnswer, setIvAnswer] = useState('');

  // 3. Voice & 4. Video Recording
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaTranscript, setMediaTranscript] = useState('');
  const [mediaTimestamp, setMediaTimestamp] = useState('00:00 - Full Recording');
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // 5. Manual Knowledge Unit
  const [manTitle, setManTitle] = useState('');
  const [manDesc, setManDesc] = useState('');
  const [manCategory, setManCategory] = useState('reasoning_decision');
  const [manTopic, setManTopic] = useState('');
  const [manProblem, setManProblem] = useState('');
  const [manContext, setManContext] = useState('');
  const [manMethod, setManMethod] = useState('');
  const [manAlts, setManAlts] = useState('');
  const [manLessons, setManLessons] = useState('');
  const [manLoc, setManLoc] = useState('Direct Expert Entry');
  const [manPerms, setManPerms] = useState('public');
  const [manApproveSelf, setManApproveSelf] = useState(false);

  // 6. Practical Demonstration
  const [demoTitle, setDemoTitle] = useState('');
  const [demoTopic, setDemoTopic] = useState('');
  const [demoScenario, setDemoScenario] = useState('');
  const [demoSteps, setDemoSteps] = useState('');
  const [demoTools, setDemoTools] = useState('');
  const [demoLessons, setDemoLessons] = useState('');

  // Edit / Correction modal
  const [editingUnit, setEditingUnit] = useState<KnowledgeUnit | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  const loadAll = async (eid?: number) => {
    const expList = await api.getExperts();
    setExperts(expList);
    const activeId = eid || selectedExpertId || expList[0]?.id || 1;
    if (expList.length && !expList.some((e) => e.id === activeId)) {
      setSelectedExpertId(expList[0].id);
    }
    const [unitRows, cInfo] = await Promise.all([
      api.getKnowledgeUnits({ expert_id: activeId, verification_status: statusFilter }),
      api.getExpertConsent(activeId).catch(() => null),
    ]);
    setUnits(unitRows);
    setConsent(cInfo);
  };

  useEffect(() => {
    loadAll(selectedExpertId);
  }, [selectedExpertId, statusFilter]);

  const showMsg = (type: 'ok' | 'err', msg: string) => {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 5000);
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', docFile);
      fd.append('expert_id', String(selectedExpertId));
      fd.append('title', docTitle || docFile.name);
      const res = await api.uploadDocument(fd);
      showMsg('ok', `Extracted ${res.knowledge_units_extracted} Knowledge Units from ${res.filename} (Status: AI EXTRACTED — awaiting expert review).`);
      setDocTitle('');
      setDocFile(null);
      await loadAll(selectedExpertId);
      setActiveTab('review');
    } catch (err: any) {
      showMsg('err', err?.message || 'Document upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const startInterview = async () => {
    if (!ivTopic.trim()) return;
    setBusy(true);
    try {
      const step = await api.interviewStep(selectedExpertId, ivTopic, []);
      setIvTurns([]);
      setIvCurrentQ(step.next_question);
    } catch (err: any) {
      showMsg('err', err?.message || 'Could not start interview.');
    } finally {
      setBusy(false);
    }
  };

  const submitInterviewTurn = async () => {
    if (!ivCurrentQ || !ivAnswer.trim()) return;
    const nextTurns = [...ivTurns, { question: ivCurrentQ, answer: ivAnswer.trim() }];
    setIvTurns(nextTurns);
    setIvAnswer('');
    setBusy(true);
    try {
      const step = await api.interviewStep(selectedExpertId, ivTopic, nextTurns);
      if (step.done) {
        await api.interviewFinalize(selectedExpertId, ivTopic, nextTurns);
        setIvCurrentQ(null);
        setIvTopic('');
        setIvTurns([]);
        showMsg('ok', 'AI-guided interview synthesized into structured Knowledge Units (awaiting expert review).');
        await loadAll(selectedExpertId);
        setActiveTab('review');
      } else {
        setIvCurrentQ(step.next_question);
      }
    } catch (err: any) {
      showMsg('err', err?.message || 'Interview step failed.');
    } finally {
      setBusy(false);
    }
  };

  const startBrowserRecording = async (kind: 'audio' | 'video') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === 'video' ? { audio: true, video: true } : { audio: true }
      );
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: kind === 'video' ? 'video/webm' : 'audio/webm' });
        const file = new File([blob], `recorded_${kind}_${Date.now()}.webm`, { type: blob.type });
        setMediaFile(file);
        showMsg('ok', `Captured ${kind} recording (${Math.round(file.size / 1024)} KB). Add or confirm transcript and save.`);
      };
      recorderRef.current = mr;
      mr.start();
      setIsRecording(true);
    } catch {
      showMsg('err', 'Microphone/Camera unavailable in this environment — upload a file or enter transcript directly.');
    }
  };

  const stopBrowserRecording = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleCaptureMedia = async (kind: 'audio' | 'video', e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaTitle.trim() && !mediaTranscript.trim() && !mediaFile) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('expert_id', String(selectedExpertId));
      fd.append('media_kind', kind);
      fd.append('title', mediaTitle || `${kind.toUpperCase()} Capture`);
      fd.append('transcript', mediaTranscript);
      fd.append('timestamp_notes', mediaTimestamp);
      if (mediaFile) fd.append('file', mediaFile);
      const res = await api.captureMedia(fd);
      showMsg('ok', `Saved ${kind} media and extracted ${res.extracted_units_count} Knowledge Units (Status: AI EXTRACTED).`);
      setMediaTitle('');
      setMediaFile(null);
      setMediaTranscript('');
      await loadAll(selectedExpertId);
      setActiveTab('review');
    } catch (err: any) {
      showMsg('err', err?.message || 'Failed to capture media.');
    } finally {
      setBusy(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createKnowledgeUnit({
        expert_id: selectedExpertId,
        title: manTitle,
        description: manDesc,
        category: manCategory,
        topic: manTopic || 'Engineering Knowledge',
        problem_or_situation: manProblem,
        context_and_experience: manContext,
        reasoning_and_method: manMethod,
        decisions_and_alternatives: manAlts,
        failures_and_lessons: manLessons,
        source_location_or_timestamp: manLoc,
        access_permissions: manPerms,
        verification_status: manApproveSelf ? 'approved_by_expert' : 'awaiting_expert_review',
      });
      showMsg('ok', `Knowledge Unit saved (${manApproveSelf ? 'Approved by Expert' : 'Awaiting Expert Review'}).`);
      setManTitle(''); setManDesc(''); setManProblem(''); setManContext(''); setManMethod(''); setManAlts(''); setManLessons('');
      await loadAll(selectedExpertId);
      setActiveTab('review');
    } catch (err: any) {
      showMsg('err', err?.message || 'Failed to create Knowledge Unit.');
    } finally {
      setBusy(false);
    }
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.captureDemonstration({
        expert_id: selectedExpertId,
        title: demoTitle,
        topic: demoTopic || 'Practical Procedure',
        scenario: demoScenario,
        steps_walkthrough: demoSteps,
        tools_and_parameters: demoTools,
        common_mistakes_and_lessons: demoLessons,
      });
      showMsg('ok', 'Practical demonstration captured into Knowledge Unit (Awaiting Expert Review).');
      setDemoTitle(''); setDemoScenario(''); setDemoSteps(''); setDemoTools(''); setDemoLessons('');
      await loadAll(selectedExpertId);
      setActiveTab('review');
    } catch (err: any) {
      showMsg('err', err?.message || 'Failed to save demonstration.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyStatus = async (unitId: number, status: string) => {
    const expName = experts.find((e) => e.id === selectedExpertId)?.name || 'Domain Expert';
    await api.verifyKnowledgeUnit(unitId, status, expName, `Reviewed in Studio (${status})`);
    showMsg('ok', `Unit #${unitId} transitioned to '${status.replace(/_/g, ' ')}'.`);
    await loadAll(selectedExpertId);
  };

  const openUnitEditor = async (unit: KnowledgeUnit) => {
    setEditingUnit({ ...unit });
    setEditNotes('');
    const hist = await api.getUnitHistory(unit.id);
    setHistoryItems(hist);
  };

  const saveUnitCorrection = async () => {
    if (!editingUnit) return;
    const expName = experts.find((e) => e.id === selectedExpertId)?.name || 'Expert Reviewer';
    await api.updateKnowledgeUnit(editingUnit.id, {
      title: editingUnit.title,
      description: editingUnit.description,
      problem_or_situation: editingUnit.problem_or_situation || undefined,
      context_and_experience: editingUnit.context_and_experience || undefined,
      reasoning_and_method: editingUnit.reasoning_and_method || undefined,
      decisions_and_alternatives: editingUnit.decisions_and_alternatives || undefined,
      failures_and_lessons: editingUnit.failures_and_lessons || undefined,
      verification_status: editingUnit.verification_status,
      access_permissions: editingUnit.access_permissions,
      reviewer_name: expName,
      review_notes: editNotes || 'Corrected via Expert Studio',
    });
    setEditingUnit(null);
    showMsg('ok', 'Knowledge Unit updated and verification audit logged.');
    await loadAll(selectedExpertId);
  };

  const handleConsentChange = async (nextStatus: ExpertConsentInfo['status']) => {
    if (!consent) return;
    const updated = await api.updateExpertConsent(selectedExpertId, { status: nextStatus });
    setConsent(updated);
    showMsg('ok', `Expert consent status updated to '${nextStatus}'.`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#00D9FF]/15">
        <div>
          <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-[#00D9FF]" />
            EXPERT INTELLIGENCE CREATION STUDIO
          </h1>
          <p className="text-xs text-[#9FB2CA] mt-1">
            Capture human expertise across 6 modalities, extract structured Knowledge Units, and enforce explicit Expert Verification &amp; Consent.
          </p>
        </div>

        {/* Active Expert + Consent Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedExpertId}
            onChange={(e) => setSelectedExpertId(Number(e.target.value))}
            className="bg-[#061222] border border-[#00D9FF]/30 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
          >
            {experts.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.domain})
              </option>
            ))}
          </select>

          {consent && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#061222] border border-white/10 text-xs">
              {consent.status === 'active' ? (
                <ShieldCheck className="w-4 h-4 text-[#00E6A0]" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              )}
              <span className="font-mono text-[11px] uppercase text-white">
                Consent: {consent.status}
              </span>
              {consent.status === 'active' ? (
                <button
                  onClick={() => handleConsentChange('suspended')}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer"
                >
                  Suspend
                </button>
              ) : (
                <button
                  onClick={() => handleConsentChange('active')}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer"
                >
                  Restore
                </button>
              )}
              {consent.status !== 'revoked' && (
                <button
                  onClick={() => handleConsentChange('revoked')}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 cursor-pointer"
                >
                  Revoke
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-mono flex items-center gap-2 ${
            notice.type === 'ok'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          }`}
        >
          {notice.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{notice.msg}</span>
        </div>
      )}

      {/* 6 Capture Channels + Verification Workbench Tab Bar */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'document', label: 'PDF & DOCX Docs', icon: FileText },
          { id: 'interview', label: 'AI-Guided Interview', icon: MessageSquare },
          { id: 'voice', label: 'Voice Recording', icon: Mic },
          { id: 'video', label: 'Video Recording', icon: Video },
          { id: 'manual', label: 'Manual Knowledge Unit', icon: PenTool },
          { id: 'demonstration', label: 'Practical Demonstration', icon: Wrench },
          { id: 'review', label: `Verification Workbench (${units.length})`, icon: ShieldCheck },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as CaptureTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono flex items-center gap-2 border transition cursor-pointer ${
                active
                  ? 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]/50 shadow-glow-cyan'
                  : 'bg-[#061222]/80 text-[#9FB2CA] border-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PDF & DOCX */}
      {activeTab === 'document' && (
        <form onSubmit={handleUploadDoc} className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/20 space-y-4 max-w-2xl">
          <h2 className="text-base font-bold text-white">Ingest PDF, DOCX, or Technical Report</h2>
          <p className="text-xs text-[#9FB2CA]">
            Original file is preserved and parsed into structured Knowledge Units marked <strong className="text-purple-300">AI EXTRACTED</strong> until the expert reviews and approves them.
          </p>
          <input
            type="text"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            placeholder="Document title (optional)"
            className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
          />
          <label className="border-2 border-dashed border-[#00D9FF]/30 rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-[#00D9FF]">
            <Upload className="w-7 h-7 text-[#00D9FF] mb-2" />
            <span className="text-xs text-white">{docFile ? docFile.name : 'Select PDF, DOCX, TXT, or MD file'}</span>
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md"
              className="hidden"
              onChange={(e) => setDocFile(e.target.files?.[0] || null)}
            />
          </label>
          <button type="submit" disabled={!docFile || busy} className="px-5 py-2.5 rounded-xl btn-cyber-primary text-xs font-bold disabled:opacity-40 cursor-pointer">
            {busy ? 'Extracting...' : 'Upload & Extract Knowledge Units'}
          </button>
        </form>
      )}

      {/* TAB 2: AI-GUIDED INTERVIEW */}
      {activeTab === 'interview' && (
        <div className="p-6 rounded-2xl glass-panel border border-[#925CFF]/30 space-y-4 max-w-3xl">
          <h2 className="text-base font-bold text-white">AI-Guided Expert Elicitation Interview</h2>
          {!ivCurrentQ ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={ivTopic}
                onChange={(e) => setIvTopic(e.target.value)}
                placeholder="Enter interview topic (e.g., Cryogenic Valve Cavitation Failure Modes)..."
                className="flex-1 bg-[#020713] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
              />
              <button
                onClick={startInterview}
                disabled={!ivTopic.trim() || busy}
                className="px-5 py-2.5 rounded-xl btn-cyber-primary text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                Start Guided Interview
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {ivTurns.map((t, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#020713]/80 border border-white/10 text-xs space-y-1">
                  <div className="font-mono text-[#00D9FF]">Q{i + 1}: {t.question}</div>
                  <div className="text-slate-200">{t.answer}</div>
                </div>
              ))}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                <div className="text-xs font-mono text-purple-300">Question {ivTurns.length + 1} of 4:</div>
                <p className="text-sm font-semibold text-white">{ivCurrentQ}</p>
                <textarea
                  rows={3}
                  value={ivAnswer}
                  onChange={(e) => setIvAnswer(e.target.value)}
                  placeholder="Provide your reasoning, context, rejected alternatives, or lessons learned..."
                  className="w-full bg-[#020713] border border-white/10 rounded-xl p-3 text-xs text-white"
                />
                <button
                  onClick={submitInterviewTurn}
                  disabled={!ivAnswer.trim() || busy}
                  className="px-5 py-2 rounded-xl btn-cyber-primary text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  {ivTurns.length === 3 ? 'Complete & Extract Knowledge Units' : 'Submit Answer & Next Question'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3 & 4: VOICE / VIDEO RECORDING */}
      {(activeTab === 'voice' || activeTab === 'video') && (
        <form
          onSubmit={(e) => handleCaptureMedia(activeTab === 'voice' ? 'audio' : 'video', e)}
          className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/20 space-y-4 max-w-2xl"
        >
          <h2 className="text-base font-bold text-white">
            Capture {activeTab === 'voice' ? 'Voice Recording' : 'Video Recording'} &amp; Transcript
          </h2>
          <div className="flex flex-wrap gap-3">
            {!isRecording ? (
              <button
                type="button"
                onClick={() => startBrowserRecording(activeTab === 'voice' ? 'audio' : 'video')}
                className="px-4 py-2 rounded-xl bg-[#00E6A0]/15 text-[#00E6A0] border border-[#00E6A0]/40 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer"
              >
                {activeTab === 'voice' ? <Mic className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                Record Live in Browser
              </button>
            ) : (
              <button
                type="button"
                onClick={stopBrowserRecording}
                className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/50 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer animate-pulse"
              >
                <Square className="w-4 h-4" />
                Stop Recording
              </button>
            )}
            <label className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white cursor-pointer hover:border-[#00D9FF]">
              {mediaFile ? `Selected: ${mediaFile.name}` : `Or Upload ${activeTab === 'voice' ? 'WAV/MP3/WEBM' : 'MP4/WEBM/MOV'}`}
              <input
                type="file"
                accept={activeTab === 'voice' ? 'audio/*' : 'video/*'}
                className="hidden"
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <input
            type="text"
            required
            value={mediaTitle}
            onChange={(e) => setMediaTitle(e.target.value)}
            placeholder="Recording title..."
            className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
          />
          <input
            type="text"
            value={mediaTimestamp}
            onChange={(e) => setMediaTimestamp(e.target.value)}
            placeholder="Source timestamp (e.g. 02:15 - 05:40)"
            className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
          />
          <textarea
            rows={4}
            value={mediaTranscript}
            onChange={(e) => setMediaTranscript(e.target.value)}
            placeholder="Spoken transcript or key technical explanations to extract into structured Knowledge Units..."
            className="w-full bg-[#020713] border border-white/10 rounded-xl p-3 text-xs text-white"
          />
          <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-xl btn-cyber-primary text-xs font-bold cursor-pointer">
            {busy ? 'Saving & Extracting...' : 'Preserve Source Media & Extract Units'}
          </button>
        </form>
      )}

      {/* TAB 5: MANUAL KNOWLEDGE UNIT */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/20 space-y-4 max-w-3xl">
          <h2 className="text-base font-bold text-white">Manual Structured Knowledge Unit Entry</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required value={manTitle} onChange={(e) => setManTitle(e.target.value)} placeholder="Title" className="bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white" />
            <input value={manTopic} onChange={(e) => setManTopic(e.target.value)} placeholder="Topic (e.g. Thermal Expansion)" className="bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white" />
            <select value={manCategory} onChange={(e) => setManCategory(e.target.value)} className="bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={manPerms} onChange={(e) => setManPerms(e.target.value)} className="bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white">
              <option value="public">Access: Public</option>
              <option value="organization">Access: Organization Only</option>
              <option value="restricted">Access: Restricted</option>
            </select>
          </div>
          <textarea required rows={2} value={manDesc} onChange={(e) => setManDesc(e.target.value)} placeholder="Summary description..." className="w-full bg-[#020713] border border-white/10 rounded-xl p-3 text-xs text-white" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <textarea rows={2} value={manProblem} onChange={(e) => setManProblem(e.target.value)} placeholder="Problem or situation..." className="bg-[#020713] border border-white/10 rounded-xl p-3 text-xs text-white" />
            <textarea rows={2} value={manContext} onChange={(e) => setManContext(e.target.value)} placeholder="Context and experience..." className="bg-[#020713] border border-white/10 rounded-xl p-3 text-xs text-white" />
            <textarea rows={2} value={manMethod} onChange={(e) => setManMethod(e.target.value)} placeholder="Reasoning and method..." className="bg-[#020713] border border-white/10 rounded-xl p-3 text-xs text-white" />
            <textarea rows={2} value={manAlts} onChange={(e) => setManAlts(e.target.value)} placeholder="Decisions and rejected alternatives..." className="bg-[#020713] border border-white/10 rounded-xl p-3 text-xs text-white" />
          </div>
          <textarea rows={2} value={manLessons} onChange={(e) => setManLessons(e.target.value)} placeholder="Failures and lessons learned..." className="w-full bg-[#020713] border border-white/10 rounded-xl p-3 text-xs text-white" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-[#9FB2CA] cursor-pointer">
              <input type="checkbox" checked={manApproveSelf} onChange={(e) => setManApproveSelf(e.target.checked)} />
              <span>I am the contributing expert and explicitly approve this Knowledge Unit</span>
            </label>
            <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-xl btn-cyber-primary text-xs font-bold cursor-pointer">
              Save Knowledge Unit
            </button>
          </div>
        </form>
      )}

      {/* TAB 6: PRACTICAL DEMONSTRATION */}
      {activeTab === 'demonstration' && (
        <form onSubmit={handleDemoSubmit} className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/20 space-y-4 max-w-3xl">
          <h2 className="text-base font-bold text-white">Practical Demonstration &amp; Walkthrough Capture</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required value={demoTitle} onChange={(e) => setDemoTitle(e.target.value)} placeholder="Demonstration title" className="bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white" />
            <input value={demoTopic} onChange={(e) => setDemoTopic(e.target.value)} placeholder="Topic / Procedure area" className="bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white" />
          </div>
          <textarea required rows={2} value={demoScenario} onChange={(e) => setDemoScenario(e.target.value)} placeholder="Scenario / when this practical method applies..." className="w-full bg-[#020713] border border-white/10 rounded-xl p-3 text-xs text-white" />
          <textarea required rows={4} value={demoSteps} onChange={(e) => setDemoSteps(e.target.value)} placeholder="Step-by-step practical demonstration & explanation..." className="w-full bg-[#020713] border border-white/10 rounded-xl p-3 text-xs text-white" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <textarea rows={2} value={demoTools} onChange={(e) => setDemoTools(e.target.value)} placeholder="Tools, tolerances, parameters..." className="bg-[#020713] border border-white/10 rounded-xl p-3 text-xs text-white" />
            <textarea rows={2} value={demoLessons} onChange={(e) => setDemoLessons(e.target.value)} placeholder="Common mistakes & safety warnings..." className="bg-[#020713] border border-white/10 rounded-xl p-3 text-xs text-white" />
          </div>
          <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-xl btn-cyber-primary text-xs font-bold cursor-pointer">
            Capture Demonstration
          </button>
        </form>
      )}

      {/* TAB 7: VERIFICATION WORKBENCH */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {['all', 'ai_extracted', 'awaiting_expert_review', 'approved_by_expert', 'needs_correction', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono border cursor-pointer ${
                  statusFilter === st ? 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]/40' : 'bg-[#061222] text-slate-400 border-white/10'
                }`}
              >
                {st.replace(/_/g, ' ').toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {units.map((u) => (
              <div key={u.id} className="p-5 rounded-2xl glass-panel border border-white/10 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase text-[#00D9FF]">{u.category.replace(/_/g, ' ')} • {u.topic}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${STATUS_BADGE[u.verification_status] || STATUS_BADGE.ai_extracted}`}>
                      {u.verification_status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{u.title}</h3>
                  <p className="text-xs text-[#9FB2CA] leading-relaxed">{u.description}</p>
                  {u.reasoning_and_method && (
                    <p className="text-[11px] text-slate-300 bg-[#020713]/70 p-2.5 rounded-lg border border-white/5">
                      <strong className="text-cyan-300">Reasoning/Method:</strong> {u.reasoning_and_method}
                    </p>
                  )}
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{u.source_reference || 'Source'} ({u.source_location_or_timestamp || 'Recorded'})</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {u.verification_status !== 'approved_by_expert' && (
                      <button
                        onClick={() => handleVerifyStatus(u.id, 'approved_by_expert')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleVerifyStatus(u.id, 'needs_correction')}
                      className="px-2.5 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 text-[10px] font-mono cursor-pointer"
                    >
                      Needs Correction
                    </button>
                    {u.verification_status !== 'rejected' && (
                      <button
                        onClick={() => handleVerifyStatus(u.id, 'rejected')}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => openUnitEditor(u)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" /> Edit / Audit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit & Verification History Modal */}
      {editingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl glass-panel border border-[#00D9FF]/40 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Review &amp; Correct Knowledge Unit #{editingUnit.id}</h3>
              <button onClick={() => setEditingUnit(null)} className="text-xs text-slate-400 hover:text-white">Close</button>
            </div>
            <input
              value={editingUnit.title}
              onChange={(e) => setEditingUnit({ ...editingUnit, title: e.target.value })}
              className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
            />
            <textarea
              rows={3}
              value={editingUnit.description}
              onChange={(e) => setEditingUnit({ ...editingUnit, description: e.target.value })}
              className="w-full bg-[#020713] border border-white/10 rounded-xl p-3 text-xs text-white"
            />
            <textarea
              rows={2}
              value={editingUnit.reasoning_and_method || ''}
              onChange={(e) => setEditingUnit({ ...editingUnit, reasoning_and_method: e.target.value })}
              placeholder="Reasoning and method"
              className="w-full bg-[#020713] border border-white/10 rounded-xl p-3 text-xs text-white"
            />
            <textarea
              rows={2}
              value={editingUnit.failures_and_lessons || ''}
              onChange={(e) => setEditingUnit({ ...editingUnit, failures_and_lessons: e.target.value })}
              placeholder="Failures and lessons"
              className="w-full bg-[#020713] border border-white/10 rounded-xl p-3 text-xs text-white"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={editingUnit.verification_status}
                onChange={(e) => setEditingUnit({ ...editingUnit, verification_status: e.target.value as any })}
                className="bg-[#020713] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="ai_extracted">AI extracted</option>
                <option value="awaiting_expert_review">Awaiting expert review</option>
                <option value="approved_by_expert">Approved by expert</option>
                <option value="needs_correction">Needs correction</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={editingUnit.access_permissions}
                onChange={(e) => setEditingUnit({ ...editingUnit, access_permissions: e.target.value })}
                className="bg-[#020713] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="public">Public</option>
                <option value="organization">Organization</option>
                <option value="restricted">Restricted</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <input
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Verification / correction audit note..."
              className="w-full bg-[#020713] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
            />

            {historyItems.length > 0 && (
              <div className="p-3 rounded-xl bg-[#020713]/80 border border-white/5 space-y-1.5">
                <div className="text-[10px] font-mono text-[#00D9FF] uppercase flex items-center gap-1">
                  <History className="w-3 h-3" /> Verification History
                </div>
                {historyItems.map((h) => (
                  <div key={h.id} className="text-[11px] text-slate-300">
                    • {h.previous_status || 'new'} → <strong>{h.new_status}</strong> by {h.reviewer_name} ({new Date(h.created_at).toLocaleString()})
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingUnit(null)} className="px-4 py-2 rounded-xl text-xs text-slate-400">Cancel</button>
              <button onClick={saveUnitCorrection} className="px-5 py-2 rounded-xl btn-cyber-primary text-xs font-bold cursor-pointer">Save &amp; Log Verification</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
