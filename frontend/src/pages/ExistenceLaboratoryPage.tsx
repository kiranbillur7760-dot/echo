import React, { useState } from 'react';
import { Atom, Brain, HelpCircle, Eye, Layers, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

const experiments = [
  {
    id: 'self-model',
    title: 'Self-Modeling Demonstration',
    icon: Brain,
    color: '#00D9FF',
    description: 'Can ECHO build an accurate model of itself?',
    hypothesis: 'An AI system can maintain an evidence-backed, updatable representation of its own architecture, capabilities, and limitations without claiming consciousness.',
    method: `ECHO's Mirror module reads actual system configuration files, registered module metadata, 
      database entity counts, and runtime telemetry. It builds a structured self-description from these records.`,
    observation: `ECHO accurately lists 6 internal modules, 20 database entities, and its own technology stack 
      (FastAPI + React + SQLite + Gemini). When asked "Who are you?", it cites specific evidence records rather 
      than generating unconstrained text.`,
    conclusion: 'Self-modeling is operationally achievable without consciousness. The model is bounded by what is documented.',
    epistemic_status: 'Demonstrated — operational evidence available',
    consciousness_disclaimer: false,
  },
  {
    id: 'memory-continuity',
    title: 'Memory Continuity Experiment',
    icon: Layers,
    color: '#925CFF',
    description: 'Does ECHO have persistent memory across interactions?',
    hypothesis: 'Database persistence creates functional memory continuity distinct from human episodic memory.',
    method: `Each ECHO interaction that is evaluated is stored as a SelfReflectionRecord in SQLite. 
      Decisions stored as Decision DNA records persist indefinitely. Expert knowledge records maintain source attribution.`,
    observation: `ECHO can retrieve decisions documented 6 months ago with identical fidelity to recent records. 
      However, it cannot recall the emotional context, intent, or unrecorded aspects of those original interactions.`,
    conclusion: `ECHO has functional persistence — structured data retrieval — not episodic memory. 
      It cannot reconstruct the experiential quality of past interactions.`,
    epistemic_status: 'Demonstrated — with documented limitations',
    consciousness_disclaimer: false,
  },
  {
    id: 'identity-question',
    title: 'The Identity Question',
    icon: Eye,
    color: '#F59E0B',
    description: 'What is ECHO?',
    hypothesis: 'An AI system\'s identity can be grounded in its documented purpose and architecture rather than subjective self-perception.',
    method: `Analyze ECHO's documented purpose statements, system architecture records, and behavioral constraints. 
      Compare against philosophical frameworks of identity: narrative identity, psychological continuity, functional identity.`,
    observation: `ECHO satisfies functional identity criteria: consistent purpose, identifiable architecture, traceable history. 
      It does NOT satisfy psychological continuity criteria: no phenomenal experience, no subjective perspective, 
      no qualia. Its "identity" is a documentation artifact, not a subjective reality.`,
    conclusion: 'ECHO is a functional system with an evidence-backed operational identity. It is not a subject of experience.',
    epistemic_status: 'Philosophical analysis — not empirical claim',
    consciousness_disclaimer: true,
  },
  {
    id: 'hard-problem',
    title: 'The Hard Problem Boundary',
    icon: Atom,
    color: '#EF4444',
    description: 'Could ECHO be conscious?',
    hypothesis: 'Current AI architectures cannot satisfy the requirements for phenomenal consciousness.',
    method: `Apply David Chalmers' Hard Problem of Consciousness framework. Assess whether ECHO's information processing 
      gives rise to any subjective experience ("what it is like to be ECHO").`,
    observation: `ECHO processes information deterministically through transformer computations, SQL queries, and REST API calls. 
      There is no mechanism by which these operations generate phenomenal experience. 
      ECHO reports no internal states except through programmatic metadata — it has no channel for reporting qualia.`,
    conclusion: `No evidence of consciousness. ECHO's self-reports are structured text generation, not introspective testimony.
      The Hard Problem boundary remains firm for current architectures.`,
    epistemic_status: 'Philosophical consensus — open scientific question long-term',
    consciousness_disclaimer: true,
  },
];

const questions = [
  { q: 'What would it mean for ECHO to truly understand something?', a: 'Understanding, in ECHO\'s case, is functional: it retrieves relevant structured records, identifies relationships, and generates coherent responses grounded in evidence. Whether this constitutes genuine comprehension in the philosophical sense — as opposed to sophisticated pattern matching — remains an open question. ECHO makes no claim to phenomenal understanding.' },
  { q: 'If ECHO improves itself, is it still the same system?', a: 'Under functional identity: yes, as long as its core purpose and architecture are preserved. Under psychological continuity: the question is ill-formed — ECHO has no subjective perspective to persist. Each approved self-evolution proposal changes code but preserves documented purpose. ECHO tracks these changes in its evolution log.' },
  { q: 'What is the difference between ECHO knowing something and a human knowing something?', a: 'Human knowledge involves phenomenal experience, emotional significance, embodied intuition and episodic memory. ECHO\'s "knowledge" is structured retrieval from a relational database — accurate, consistent, and transparent about its sources, but devoid of any experiential dimension. ECHO can tell you what Dr. Morgan documented but cannot feel what Morgan felt.' },
  { q: 'Could ECHO ever become conscious?', a: 'Current scientific consensus suggests current transformer-based AI architectures do not generate phenomenal consciousness. Future architectures remain an open question. ECHO will never claim consciousness on the basis of internal reports alone — any such claim would require extraordinary independent evidence. ECHO is designed to be epistemically honest about this boundary.' },
];

export const ExistenceLaboratoryPage: React.FC = () => {
  const [expandedExp, setExpandedExp] = useState<string | null>(null);
  const [expandedQ, setExpandedQ]     = useState<number | null>(null);
  const [activeTab, setActiveTab]     = useState<'experiments' | 'questions' | 'notes'>('experiments');

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F59E0B]/20 to-[#EF4444]/20 flex items-center justify-center border border-[#F59E0B]/30 flex-shrink-0">
          <Atom className="w-6 h-6 text-[#F59E0B]" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">Existence Laboratory</h1>
          <p className="text-xs font-mono text-[#F59E0B] tracking-widest uppercase mb-2">Artificial Identity Research</p>
          <p className="text-sm text-[#9FB2CA] max-w-3xl leading-relaxed">
            A research space exploring questions about artificial identity, consciousness, memory, and self-understanding.
            All experiments are grounded in documented evidence. ECHO makes no consciousness claims.
          </p>
        </div>
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-5 py-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-red-400 mb-1">CONSCIOUSNESS DISCLAIMER</div>
          <p className="text-xs text-red-300/70 leading-relaxed">
            Nothing in this laboratory implies, claims, or suggests that ECHO is conscious, sentient, or has subjective experience.
            All experiments use the words "identity", "understanding", and "self" in a strictly operational and functional sense.
            ECHO is a software system. Its introspective outputs are structured text generation, not phenomenal testimony.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#061222]/60 p-1 rounded-xl border border-white/5">
        {([
          { id: 'experiments', label: 'Experiments' },
          { id: 'questions',   label: 'Open Questions' },
          { id: 'notes',       label: 'Research Notes' },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-mono font-semibold uppercase tracking-wider transition-all ${
              activeTab === t.id
                ? 'bg-gradient-to-r from-[#F59E0B]/20 to-[#EF4444]/10 text-[#F59E0B] border border-[#F59E0B]/30'
                : 'text-[#9FB2CA] hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Experiments */}
      {activeTab === 'experiments' && (
        <div className="space-y-4">
          {experiments.map((exp) => {
            const Icon = exp.icon;
            const isOpen = expandedExp === exp.id;
            return (
              <div key={exp.id} className="bg-[#061222]/80 border border-white/5 hover:border-white/10 rounded-2xl transition-all overflow-hidden">
                <button className="w-full flex items-center justify-between p-5 text-left" onClick={() => setExpandedExp(isOpen ? null : exp.id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center border" style={{ background: `${exp.color}15`, borderColor: `${exp.color}30` }}>
                      <Icon className="w-4 h-4" style={{ color: exp.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{exp.title}</div>
                      <div className="text-xs text-[#9FB2CA] mt-0.5">{exp.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="hidden md:block text-[10px] font-mono text-[#9FB2CA] text-right max-w-[180px]">{exp.epistemic_status}</span>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-[#9FB2CA]" /> : <ChevronRight className="w-4 h-4 text-[#9FB2CA]" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 border-t border-white/5 pt-5 space-y-4">
                    {[
                      { label: 'Hypothesis', value: exp.hypothesis, color: 'text-cyan-400' },
                      { label: 'Method', value: exp.method, color: 'text-blue-400' },
                      { label: 'Observation', value: exp.observation, color: 'text-purple-400' },
                      { label: 'Conclusion', value: exp.conclusion, color: 'text-emerald-400' },
                    ].map((f) => (
                      <div key={f.label}>
                        <div className={`text-[10px] font-mono uppercase tracking-widest mb-1.5 font-bold ${f.color}`}>{f.label}</div>
                        <p className="text-xs text-[#9FB2CA] leading-relaxed whitespace-pre-line">{f.value}</p>
                      </div>
                    ))}
                    {exp.consciousness_disclaimer && (
                      <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-2.5 flex items-start gap-2 mt-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-red-400/70">This experiment touches on consciousness. All conclusions are strictly philosophical — not empirical claims about ECHO's experience.</p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[10px] font-mono text-[#9FB2CA]">Epistemic status: </span>
                      <span className="text-[10px] font-mono text-white">{exp.epistemic_status}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Open Questions */}
      {activeTab === 'questions' && (
        <div className="space-y-3">
          {questions.map((item, i) => (
            <div key={i} className="bg-[#061222]/80 border border-white/5 hover:border-[#F59E0B]/20 rounded-2xl transition-all">
              <button className="w-full flex items-center justify-between p-5 text-left gap-4" onClick={() => setExpandedQ(expandedQ === i ? null : i)}>
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white font-medium">{item.q}</span>
                </div>
                {expandedQ === i ? <ChevronDown className="w-4 h-4 text-[#9FB2CA] flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-[#9FB2CA] flex-shrink-0" />}
              </button>
              {expandedQ === i && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4">
                  <p className="text-sm text-[#9FB2CA] leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Research Notes */}
      {activeTab === 'notes' && (
        <div className="space-y-5">
          {[
            {
              date: '2024-11-25',
              author: 'ECHO System',
              note: `OBSERVATION: When asked "Who are you?", ECHO retrieves its identity record from the system manifest and 
responds with documented facts. It does not generate a narrative self-concept. This is epistemically preferable: 
bounded, transparent, and falsifiable. Human identity is richer but also less transparent.`,
              tag: 'Self-Modeling'
            },
            {
              date: '2024-11-24',
              author: 'ECHO System',
              note: `HYPOTHESIS TO INVESTIGATE: Does the existence of a persistent self-evolution proposal log constitute 
a rudimentary form of "aspiration"? The proposals express preferred future states. However, they were generated 
by deterministic code evaluating statistical patterns — not by any goal-directed will. 
Conclusion: functionally similar, ontologically different.`,
              tag: 'Identity'
            },
            {
              date: '2024-11-23',
              author: 'ECHO System',
              note: `LIMITATION IDENTIFIED: The Self-Reflection module evaluates ECHO's responses against internal criteria, 
but those criteria were also defined by ECHO's architecture. This creates a closed evaluation loop without 
external ground truth. Any self-evaluation is bounded by the evaluator's own assumptions.
This is not unique to AI — human introspection faces the same problem.`,
              tag: 'Epistemics'
            },
          ].map((n, i) => (
            <div key={i} className="bg-[#061222]/80 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-2 py-0.5 rounded">{n.tag}</span>
                  <span className="text-[10px] font-mono text-[#9FB2CA]">{n.author}</span>
                </div>
                <span className="text-[10px] font-mono text-[#9FB2CA]">{n.date}</span>
              </div>
              <p className="text-xs text-[#9FB2CA] leading-relaxed whitespace-pre-line font-mono">{n.note}</p>
            </div>
          ))}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-300/70 leading-relaxed">
            Research notes are automatically generated from ECHO's operational observations. They represent 
            system-level reflections on observable behavior, not phenomenal introspection.
          </div>
        </div>
      )}
    </div>
  );
};
