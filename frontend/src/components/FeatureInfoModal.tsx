import React, { useState } from 'react';
import { Info, X, ChevronRight, CheckCircle2, Shield, Layers, Cpu, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type FeatureKey =
  | 'overview'
  | 'experts'
  | 'knowledge'
  | 'decisions'
  | 'graph'
  | 'simulation'
  | 'ask-echo'
  | 'council'
  | 'time-machine';

export interface FeatureDocumentation {
  title: string;
  stageNumber: number;
  stageLabel: string;
  tagline: string;
  whatItDoes: string;
  whyAdded: string;
  howItWorks: string;
  contribution: string;
  nextRoute?: string;
  nextLabel?: string;
}

export const FEATURE_DOCS: Record<FeatureKey, FeatureDocumentation> = {
  overview: {
    title: 'Ecosystem Intelligence Overview',
    stageNumber: 1,
    stageLabel: 'Stage 1 of 7: Platform Introduction',
    tagline: 'High-level telemetry, verified heuristic radar, and active research metrics',
    whatItDoes:
      'Provides a comprehensive command overview of the entire preserved human knowledge base, displaying real-time metrics (experts, knowledge records, decisions, evidence pieces), today’s featured expert heuristic, active research programs, and platform activity logs.',
    whyAdded:
      'To give stakeholders and researchers an immediate, quantifiable view of preserved human intelligence volume and system operational health before drilling into specific expert repositories.',
    howItWorks:
      'Aggregates live database counts and highlights across SQLAlchemy models (Expert, Decision, KnowledgeRecord, Evidence) via the GET /api/overview/dashboard endpoint, rendering metrics into responsive cyber-glass cards.',
    contribution:
      'Serves as the executive summary and starting gate of PROJECT ECHO, proving system stability, entity counts, and live provenance grounding.',
    nextRoute: '/experts',
    nextLabel: 'Proceed to Step 2: Expert Profiles',
  },
  experts: {
    title: 'Expert Intelligence Roster',
    stageNumber: 2,
    stageLabel: 'Stage 2 of 7: Human Provenance',
    tagline: 'Verified profiles anchoring tacit knowledge to real senior practitioners',
    whatItDoes:
      'Manages verified expert profiles (such as Dr. Alex Morgan in hypersonic systems), displaying credentials, career milestones, organizational affiliations, and domain specializations.',
    whyAdded:
      'Knowledge is inherently human. To preserve intelligence with academic and legal integrity, all downstream decisions and heuristics must be explicitly anchored to verified human practitioners rather than anonymous data dumps.',
    howItWorks:
      'Queries the Expert and ExpertProfile database tables via GET /api/experts. Supports onboarding new experts and drilling into detailed DNA profiles with project affiliations.',
    contribution:
      'Forms the provenance foundation for the entire platform. Every decision, heuristic, and simulation traces back to a verified expert in this roster.',
    nextRoute: '/knowledge',
    nextLabel: 'Proceed to Step 3: Knowledge Extraction',
  },
  knowledge: {
    title: 'Knowledge Extraction Studio',
    stageNumber: 3,
    stageLabel: 'Stage 3 of 7: Tacit Ingestion',
    tagline: 'Transforming unstructured technical documents and interviews into verified heuristics',
    whatItDoes:
      'Ingests technical documents (PDF, DOCX) and expert debrief interviews, extracting structured knowledge records, rules of thumb, and empirical heuristics with strict source attribution.',
    whyAdded:
      'Decades of critical engineering insight are locked inside unindexed technical reports or lost during retirement. Manual re-reading doesn’t scale; automated extraction preserves tacit understanding permanently.',
    howItWorks:
      'Combines PyMuPDF byte-stream extraction and python-docx parsing on the backend to parse documents, organizing extracted text into verified KnowledgeRecord entities with category tags (heuristic, principle, methodology).',
    contribution:
      'Feeds raw empirical and tacit knowledge into the platform, preparing it for causal modeling in Decision DNA and topological mapping in the Knowledge Graph.',
    nextRoute: '/decisions',
    nextLabel: 'Proceed to Step 4: Decision DNA',
  },
  decisions: {
    title: 'Decision DNA Engine & Replay Studio',
    stageNumber: 4,
    stageLabel: 'Stage 4 of 7: Causal Reconstruction',
    tagline: '9-point decision framework preserving reasoning, alternatives, and lessons',
    whatItDoes:
      'Reconstructs historical engineering decisions using a 9-point framework (Problem, Context, Constraints, Alternatives, Selected Decision, Reasoning, Evidence, Outcome, Lessons Learned), with an interactive Decision Replay slider to test counterfactual parameter shifts.',
    whyAdded:
      'Facts alone do not make an expert. Real expertise is defined by decision-making under severe constraints—specifically why certain plausible alternatives were rejected.',
    howItWorks:
      'Maintains relational models across decisions, decision_alternatives, evidence, and outcomes. The Decision Replay engine evaluates boundary threshold shifts (e.g., thermal ceiling >1900°C) and projects divergence points.',
    contribution:
      'Converts static documentation into reconstructible human decision intelligence, enabling future teams to avoid repeating costly historical mistakes.',
    nextRoute: '/graph',
    nextLabel: 'Proceed to Step 5: Knowledge Graph',
  },
  graph: {
    title: 'Interactive Knowledge Graph',
    stageNumber: 5,
    stageLabel: 'Stage 5 of 7: Topological Synthesis',
    tagline: 'Multi-entity force-directed topology revealing interconnected expertise',
    whatItDoes:
      'Generates a real-time, force-directed physics graph connecting 8 entity types: experts, projects, decisions, alternatives, evidence, heuristics, case studies, and skills.',
    whyAdded:
      'Complex technical knowledge does not exist in silos. True insight occurs at the intersections where decisions connect to physical evidence, projects, and cross-domain heuristics.',
    howItWorks:
      'Fetches structured graph payloads (nodes and directional links) from GET /api/graph/data and renders them via HTML5 Canvas using a spring-electrical physics layout engine with interactive zooming, dragging, and node filtering.',
    contribution:
      'Provides judges with visual, tangible proof of an interconnected human intelligence ecosystem rather than disconnected database rows.',
    nextRoute: '/simulation',
    nextLabel: 'Proceed to Step 6: Experience Simulation',
  },
  simulation: {
    title: 'Experience Simulation Engine',
    stageNumber: 6,
    stageLabel: 'Stage 6 of 7: Counterfactual Research',
    tagline: 'Testing new engineering challenges against historical expert decision precedents',
    whatItDoes:
      'Allows researchers to input a new problem with constraints (e.g., hypersonic glider atmospheric turbulence at Mach 7.5) and retrieves similar historical decisions, explaining applicable approaches and identifying missing telemetry.',
    whyAdded:
      'To allow engineers to stress-test new concepts against historical expert precedent before committing massive budgets, cutting metal, or launching physical tests.',
    howItWorks:
      'Executes multi-factor semantic and token matching against Decision DNA records, synthesizing applicable historical approaches while explicitly separating documented facts from AI-generated projections.',
    contribution:
      'Bridges historical preserved knowledge with future missions, transforming static archival data into active engineering guidance.',
    nextRoute: '/ask-echo',
    nextLabel: 'Proceed to Step 7: Ask ECHO',
  },
  'ask-echo': {
    title: 'Ask ECHO Epistemic Query Engine',
    stageNumber: 7,
    stageLabel: 'Stage 7 of 7: Natural Inquiry & Truth Classification',
    tagline: 'Conversational inquiry with 5-tier truth labeling and source citations',
    whatItDoes:
      'Answers natural language technical questions using preserved expert records, classifying every statement into 5 epistemic tiers: Documented Fact, Expert-Verified, AI Inference, Hypothetical Simulation, or Insufficient Evidence.',
    whyAdded:
      'Ordinary AI chatbots hallucinate confidently. Ask ECHO was built with strict epistemic honesty so mission-critical aerospace teams can verify every claim against citations.',
    howItWorks:
      'Queries backend KnowledgeRecord, Decision, Evidence, and Lesson entities. Dynamically constructs cited narrative responses backed by provenance links and confidence metrics via POST /api/ask-echo/query.',
    contribution:
      'Represents the ultimate user inquiry interface, proving that preserved human intelligence can be queried accurately with zero ungrounded fabrication.',
    nextRoute: '/',
    nextLabel: 'Complete Demo: Return to Overview',
  },
  council: {
    title: 'Council of Experts Deliberation Chamber',
    stageNumber: 4,
    stageLabel: 'Signature Feature 1: Multi-Disciplinary Deliberation',
    tagline: 'Multi-expert grand challenge deliberation, agreement detection, and synthesized consensus roadmaps',
    whatItDoes:
      'Convenes multiple domain experts preserved in PROJECT ECHO into an interactive council. Deliberates over complex multi-disciplinary challenges (e.g. Martian surface habitat, hypersonic fleet reusability, deep space transit), identifies points of agreement and trade-offs, and synthesizes a 4-phase reconciled execution roadmap.',
    whyAdded:
      'Engineering breakthroughs require cross-domain synthesis. Single-agent or single-expert AI offers narrow views that fail when adjacent physical constraints (heat, mass, power, radiation) interact. The Council demonstrates true multi-expert intelligence.',
    howItWorks:
      'Queries backend Expert, Decision, and KnowledgeRecord entities. Formulates individual domain perspectives, evaluates cross-domain constraints, detects agreement and contention points, and applies constraint-relaxation heuristics to produce balanced scorecards and phased roadmaps.',
    contribution:
      'Proves PROJECT ECHO can reconcile complex conflicting expert perspectives into actionable consensus architectures.',
    nextRoute: '/time-machine',
    nextLabel: 'Proceed to Signature 2: Decision Time Machine',
  },
  'time-machine': {
    title: 'ECHO Decision Time Machine',
    stageNumber: 5,
    stageLabel: 'Signature Feature 2: Counterfactual Decision Replay',
    tagline: 'Interactive boundary constraint stress-testing, dynamic branching calculation, and epistemic truth grading',
    whatItDoes:
      'Enables users to select historical Decision DNA, interactively manipulate core constraints (temperatures, mass budgets, flight reusability cycles, mission CAPEX), and observe dynamic alternative branching.',
    whyAdded:
      'Historical engineering decisions are too often treated as static dogmas. When mission conditions change, legacy solutions fail catastrophically. The Decision Time Machine exposes the exact constraint boundaries where decisions break or shift.',
    howItWorks:
      'Re-evaluates the 9-point Decision DNA against adjusted constraint parameters. Re-calculates physical viability (e.g. C/SiC oxidation kinetics, payload gear ratio multipliers), evaluates previously rejected alternatives, and generates side-by-side comparison tables with 5-tier Epistemic Truth Classification.',
    contribution:
      'Transforms static historical records into an interactive counterfactual simulation laboratory, preventing future programs from repeating costly design mistakes.',
    nextRoute: '/overview',
    nextLabel: 'Return to Overview',
  },
};

interface FeatureHeaderProps {
  featureKey: FeatureKey;
}

export const FeatureHeader: React.FC<FeatureHeaderProps> = ({ featureKey }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const doc = FEATURE_DOCS[featureKey];
  const navigate = useNavigate();

  return (
    <>
      {/* Workflow Navigation Banner */}
      <div className="flex items-center justify-between p-3.5 mb-6 rounded-xl bg-[#061222]/80 border border-[#00D9FF]/20 shadow-glow-cyan/10">
        <div className="flex items-center gap-3">
          <div className="px-2.5 py-1 rounded-md bg-[#00D9FF]/15 border border-[#00D9FF]/30 text-[11px] font-mono font-bold text-[#00D9FF] uppercase tracking-wider">
            {doc.stageLabel}
          </div>
          <p className="text-xs text-[#9FB2CA] hidden sm:block">
            {doc.tagline}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Info Button */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#00D9FF]/15 text-[#9FB2CA] hover:text-[#00D9FF] border border-white/10 hover:border-[#00D9FF]/30 transition text-xs font-mono"
            title="Inspect feature technical architecture"
          >
            <Info className="w-3.5 h-3.5 text-[#00D9FF]" />
            <span className="hidden md:inline">Feature Info</span>
          </button>

          {/* Next Demo Step CTA */}
          {doc.nextRoute && (
            <button
              onClick={() => navigate(doc.nextRoute!)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#00D9FF]/20 to-[#167BFF]/20 hover:from-[#00D9FF]/30 hover:to-[#167BFF]/30 text-[#00D9FF] border border-[#00D9FF]/40 transition text-xs font-mono font-semibold"
            >
              <span>{doc.nextLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Feature Technical Explanation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl bg-[#061222] border border-[#00D9FF]/30 p-6 sm:p-7 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00D9FF]/15 text-[#00D9FF] border border-[#00D9FF]/30 font-bold uppercase tracking-wider">
                    {doc.stageLabel}
                  </span>
                  <span className="text-xs font-mono text-[#00E6A0]">VERIFIED MODULE</span>
                </div>
                <h2 className="text-xl font-bold font-display text-white">{doc.title}</h2>
                <p className="text-xs text-[#9FB2CA] mt-0.5">{doc.tagline}</p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#9FB2CA] hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4 Pillars of Technical Explanation */}
            <div className="space-y-4 text-xs">
              {/* 1. What it does */}
              <div className="p-3.5 rounded-xl bg-[#020713]/80 border border-[#00D9FF]/15">
                <div className="flex items-center gap-2 font-mono text-[#00D9FF] font-bold uppercase tracking-wider mb-1.5">
                  <Layers className="w-4 h-4 text-[#00D9FF]" />
                  1. What It Does
                </div>
                <p className="text-[#F4F8FF]/90 leading-relaxed pl-6">
                  {doc.whatItDoes}
                </p>
              </div>

              {/* 2. Why it was added */}
              <div className="p-3.5 rounded-xl bg-[#020713]/80 border border-[#925CFF]/15">
                <div className="flex items-center gap-2 font-mono text-[#925CFF] font-bold uppercase tracking-wider mb-1.5">
                  <Shield className="w-4 h-4 text-[#925CFF]" />
                  2. Why It Was Added
                </div>
                <p className="text-[#F4F8FF]/90 leading-relaxed pl-6">
                  {doc.whyAdded}
                </p>
              </div>

              {/* 3. How it works */}
              <div className="p-3.5 rounded-xl bg-[#020713]/80 border border-[#00E6A0]/15">
                <div className="flex items-center gap-2 font-mono text-[#00E6A0] font-bold uppercase tracking-wider mb-1.5">
                  <Cpu className="w-4 h-4 text-[#00E6A0]" />
                  3. How It Works (Actual Code & Architecture)
                </div>
                <p className="text-[#F4F8FF]/90 leading-relaxed pl-6">
                  {doc.howItWorks}
                </p>
              </div>

              {/* 4. Contribution to PROJECT ECHO */}
              <div className="p-3.5 rounded-xl bg-[#020713]/80 border border-white/10">
                <div className="flex items-center gap-2 font-mono text-white font-bold uppercase tracking-wider mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00E6A0]" />
                  4. Contribution to Human Intelligence Platform
                </div>
                <p className="text-[#F4F8FF]/90 leading-relaxed pl-6">
                  {doc.contribution}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#9FB2CA]">
                PROJECT ECHO • Technical Audit &amp; Grounding
              </span>
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs transition"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
