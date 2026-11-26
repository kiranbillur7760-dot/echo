export interface Expert {
  id: number;
  name: string;
  title: string;
  organization: string;
  domain: string;
  bio: string;
  avatar_url?: string;
  verification_status: string;
  years_experience: number;
  is_synthetic_demo: boolean;
  created_at: string;
}

export interface ExpertDetail extends Expert {
  profile: {
    summary?: string;
    core_competencies?: string[];
    awards_recognitions?: string[];
    career_milestones?: Array<{ year: string; role: string; org: string }>;
    publications?: Array<{ title: string; year: string }>;
  };
  projects: Array<{
    id: number;
    title: string;
    description: string;
    domain: string;
    role: string;
    status: string;
  }>;
  decisions: Array<{
    id: number;
    title: string;
    problem: string;
    selected_decision: string;
    confidence: number;
    status: string;
  }>;
}

export interface KnowledgeRecord {
  id: number;
  expert_id: number;
  project_id?: number;
  document_id?: number;
  title: string;
  category: 'experience' | 'decision_pattern' | 'heuristic' | 'principle' | 'methodology';
  content: string;
  key_takeaways: string[];
  source_reference?: string;
  verification_status: 'draft' | 'verified' | 'rejected';
  confidence_score: number;
  is_synthetic_demo: boolean;
  created_at: string;
}

export interface Alternative {
  id?: number;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  why_rejected: string;
  estimated_risk: string;
}

export interface EvidenceItem {
  id?: number;
  title: string;
  evidence_type: string;
  content: string;
  source_url_or_ref?: string;
  reliability_score: number;
}

export interface OutcomeItem {
  id?: number;
  metric_name: string;
  expected_value: string;
  actual_value: string;
  impact_summary: string;
  time_horizon: string;
  validation_method: string;
}

export interface LessonItem {
  id: number;
  title: string;
  category: string;
  insight: string;
  anti_pattern_to_avoid: string;
  recommended_practice: string;
  is_synthetic_demo: boolean;
  created_at: string;
}

export interface DecisionDNA {
  id: number;
  expert_id: number;
  expert_name: string;
  project_id?: number;
  project_title?: string;
  title: string;
  problem_definition: string;
  context: string;
  constraints: string[];
  reasoning: string;
  selected_decision: string;
  outcome: string;
  lessons_learned: string;
  confidence_rating: number;
  status: string;
  is_synthetic_demo: boolean;
  created_at: string;
  alternatives: Alternative[];
  evidence_items: EvidenceItem[];
  outcomes: OutcomeItem[];
  lessons: LessonItem[];
}

export interface DecisionReplayResult {
  decision_id: number;
  original_title: string;
  original_selected_decision: string;
  modified_parameters: Record<string, string>;
  branching_divergence_point: string;
  replayed_selected_approach: string;
  replayed_rationale: string;
  tradeoff_comparison: Record<string, string>;
  hypothetical_projected_outcome: string;
  is_hypothetical_simulation: boolean;
  epistemic_warning: string;
}

export interface HistoricalMatch {
  decision_id: number;
  title: string;
  similarity_score: number;
  domain: string;
  key_similarities: string[];
  key_differences: string[];
  expert_name: string;
}

export interface SimulationApproach {
  approach_name: string;
  strategy_summary: string;
  historical_grounding: string;
  supporting_evidence: string[];
  projected_tradeoffs: Record<string, string>;
  confidence_level: 'High' | 'Moderate' | 'Low';
  ai_inferences: string[];
  missing_parameters: string[];
}

export interface SimulationResult {
  problem_analyzed: string;
  domain: string;
  relevant_historical_decisions: HistoricalMatch[];
  recommended_approaches: SimulationApproach[];
  synthesis_statement: string;
  epistemic_disclaimer: string;
}

export interface EpistemicClaim {
  claim_type: 'DOCUMENTED FACT' | 'EXPERT-VERIFIED' | 'EXPERT-VERIFIED INFORMATION' | 'AI ANALYSIS' | 'AI-GENERATED INFERENCE' | 'HYPOTHETICAL' | 'HYPOTHETICAL SIMULATION' | 'INSUFFICIENT EVIDENCE';
  statement: string;
  grounding: string;
  confidence: number;
}

export interface CitationSource {
  source_type: string;
  title: string;
  reference_id: number;
  expert_name: string;
  snippet: string;
  provenance_url?: string;
  exact_passage?: string;
  evidence_limitation?: string;
}

export interface ConversationTurn {
  query: string;
  answer: string;
  expert_name?: string;
}

export type AskEchoMode = 'complete_human_intelligence' | 'hybrid_intelligence';

export interface ProviderRunInfo {
  provider_id: string;
  provider_name: string;
  model: string;
  success: boolean;
  latency_ms: number;
  error?: string | null;
  content?: string | null;
}

export interface KnowledgeUnit {
  id: number;
  expert_id: number;
  expert_name: string;
  source_media_id?: number | null;
  document_id?: number | null;
  title: string;
  description: string;
  category: string;
  topic: string;
  problem_or_situation?: string | null;
  context_and_experience?: string | null;
  reasoning_and_method?: string | null;
  decisions_and_alternatives?: string | null;
  failures_and_lessons?: string | null;
  source_reference?: string | null;
  source_location_or_timestamp?: string | null;
  verification_status: 'ai_extracted' | 'awaiting_expert_review' | 'approved_by_expert' | 'rejected' | 'needs_correction';
  access_permissions: string;
  confidence_score: number;
  expert_notes?: string | null;
  is_synthetic_demo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ExpertConsentInfo {
  expert_id: number;
  expert_name: string;
  consent_knowledge: boolean;
  consent_voice: boolean;
  consent_likeness: boolean;
  disclosure_acknowledged: boolean;
  status: 'active' | 'suspended' | 'revoked' | 'deletion_requested';
  consent_text?: string;
  signed_by?: string | null;
  signed_at?: string | null;
  revoked_at?: string | null;
  notes?: string | null;
}

export interface ConversationSummary {
  id: number;
  title: string;
  mode: string;
  expert_id?: number | null;
  expert_name: string;
  is_voice: boolean;
  message_count: number;
  last_preview: string;
  created_at: string;
  updated_at?: string;
}

export interface AIProviderInfo {
  id: string;
  name: string;
  models: string[];
  default_model: string;
  configured: boolean;
  env_var: string;
}

export interface AskEchoResult {
  query: string;
  mode_used?: AskEchoMode | string;
  conversation_id?: number | null;
  message_id?: number | null;
  structured_claims: EpistemicClaim[];
  narrative_answer: string;
  primary_expert?: {
    id: number;
    name: string;
    title: string;
    domain: string;
    avatar_url?: string;
    years_experience?: number;
    organization?: string;
    verification_status?: string;
    is_synthetic_demo?: boolean;
  };
  is_insufficient_evidence?: boolean;
  missing_information_explanation?: string;
  is_general_knowledge?: boolean;
  external_ai_answer?: string;
  understanding?: {
    question_type: string;
    domain: string;
    constraints_detected: string[];
    expected_answer: string;
    summary: string;
  };
  human_intelligence?: {
    available: boolean;
    experts?: Array<{
      id: number;
      name: string;
      title: string;
      domain: string;
      verification_status?: string;
      is_synthetic_demo?: boolean;
    }>;
    documented_experience?: string[];
    recommendations?: string[];
    summary?: string;
    reason?: string;
  };
  ai_intelligence?: {
    available: boolean;
    provider?: string;
    model?: string;
    providers_succeeded?: Array<{
      provider_id: string;
      provider: string;
      model: string;
      latency_ms: number;
      analysis: string;
      recommendations: string[];
      limitations: string[];
    }>;
    providers_failed?: Array<{
      provider_id: string;
      provider: string;
      model: string;
      error: string;
    }>;
    analysis?: string | null;
    recommendations?: string[];
    limitations?: string[];
    error?: string;
    reason?: string;
  };
  provider_runs?: ProviderRunInfo[];
  agreements?: string[];
  disagreements?: string[];
  missing_information?: string[];
  hybrid_recommendation?: string | null;
  evidence_reliability?: {
    sources_count: number;
    verification_status: string;
    confidence_limitations: string;
    missing_information: string[];
    hybrid_completeness: string;
  };
  epistemic_breakdown?: {
    directly_documented_expert_knowledge: string[];
    expert_approved_knowledge: string[];
    ai_generated_interpretation: string[];
    inference: string[];
    unknown_or_unavailable: string[];
  };
  documented_facts: string[];
  expert_verified_insights: string[];
  ai_generated_inferences: string[];
  hypothetical_simulations?: string[];
  uncertainties_and_gaps: string[];
  citations: CitationSource[];
  overall_confidence: number;
  engine_mode?: string;
}

export interface CaseStudy {
  id: number;
  expert_id?: number;
  expert_name?: string;
  decision_id?: number;
  title: string;
  summary: string;
  domain: string;
  industry: string;
  background: string;
  core_dilemma: string;
  technical_data: Record<string, any>;
  learning_objectives: string[];
  difficulty: string;
  is_synthetic_demo: boolean;
  created_at: string;
  challenges?: Array<{
    id: number;
    title: string;
    scenario_prompt: string;
    constraints: string[];
    evaluation_rubric: Record<string, any>;
    max_score: number;
  }>;
}

export interface Assessment {
  id: number;
  submission_id: number;
  overall_score: number;
  reasoning_score: number;
  evidence_score: number;
  technical_score: number;
  problem_solving_score: number;
  comparative_analysis: string;
  strengths: string[];
  areas_for_improvement: string[];
  expert_comparison_notes: string;
  created_at: string;
}

export interface StudentSubmission {
  id: number;
  challenge_id: number;
  student_name: string;
  proposed_solution: string;
  reasoning_steps: string;
  alternatives_considered: string;
  evidence_cited: string;
  status: string;
  score?: number;
  created_at: string;
  assessment?: Assessment;
}

export interface SkillProfile {
  id: number;
  skill_name: string;
  category: string;
  mastery_level: string;
  score_points: number;
  evidence_count: number;
  is_synthetic_demo: boolean;
  verified_at: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  category: string;
  details: Record<string, any>;
  is_synthetic: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  strength: number;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface EvolutionConflict {
  id: number;
  title: string;
  conflict_type: string;
  description: string;
  expert_claim_a: string;
  expert_claim_b: string;
  severity: string;
  resolution_status: string;
  resolution_notes?: string;
  is_synthetic_demo: boolean;
  created_at: string;
}

export interface EvolutionUpdate {
  id: number;
  record_id: number;
  previous_content: string;
  updated_content: string;
  reason_for_update: string;
  decay_indicator: string;
  new_evidence_ref?: string;
  is_synthetic_demo: boolean;
  created_at: string;
}

export interface EvolutionRadar {
  summary: {
    total_conflicts_detected: number;
    unresolved_conflicts: number;
    superseded_heuristics_count: number;
    active_verifications_count: number;
    radar_health_score: number;
  };
  conflicts: EvolutionConflict[];
  superseded_updates: EvolutionUpdate[];
  recent_verifications: Array<{
    id: number;
    record_id: number;
    verified_by_expert_id: number;
    verification_status: string;
    verification_notes: string;
    created_at: string;
  }>;
}

export interface FederatedOrganization {
  id: number;
  name: string;
  code: string;
  domain: string;
  security_tier: string;
  description: string;
  expert_count: number;
  created_at: string;
}

export interface NetworkOverview {
  federated_organizations: FederatedOrganization[];
  total_active_experts: number;
  permission_models: Array<{
    tier: string;
    label: string;
    access: string;
  }>;
}

export interface MultiExpertComparison {
  expert_a: {
    name: string;
    title: string;
    philosophy: string;
    preferred_materials: string[];
    risk_profile: string;
    key_heuristic: string;
  };
  expert_b: {
    name: string;
    title: string;
    philosophy: string;
    preferred_materials: string[];
    risk_profile: string;
    key_heuristic: string;
  };
  comparative_dimensions: Array<{
    dimension: string;
    expert_a: string;
    expert_b: string;
    synthesis: string;
  }>;
  collective_consensus: string;
}

export interface OverviewDashboard {
  metrics: {
    expert_profiles_count: number;
    knowledge_records_count: number;
    decisions_documented_count: number;
    case_studies_count: number;
    total_evidence_pieces: number;
    simulation_runs: number;
  };
  recent_activities: Array<{
    id: number;
    action_type: string;
    entity_type: string;
    entity_id?: number;
    description: string;
    created_at: string;
  }>;
  todays_insight: {
    title: string;
    expert: string;
    domain: string;
    summary: string;
    quote: string;
  };
  active_research: Array<{
    title: string;
    status: string;
    trl: string;
  }>;
  top_expertise_areas: Array<{
    name: string;
    count: number;
    growth: string;
  }>;
}

export interface DocumentItem {
  id: number;
  expert_id: number;
  title: string;
  filename: string;
  file_size: number;
  file_type: string;
  processing_status: 'pending' | 'extracted' | 'failed';
  extracted_text?: string;
  metadata_json?: string;
  is_synthetic_demo: boolean;
  created_at: string;
}


// --- ECHO Mirror ------------------------------------------------------------
export interface EchoMirrorModule {
  id: string;
  name: string;
  status: 'active' | 'degraded' | 'offline';
  description: string;
  capabilities: string[];
  limitations: string[];
  evidence_count: number;
  last_updated: string;
}

export interface EchoMirrorCapability {
  id: string;
  name: string;
  description: string;
  confidence: number;
  evidence: string[];
  constraints: string[];
}

export interface EchoMirrorLimitation {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface EchoMirrorTelemetry {
  uptime_seconds: number;
  total_queries_processed: number;
  entities_in_knowledge_base: number;
  active_modules: number;
  memory_records: number;
  avg_response_confidence: number;
}

export interface EchoMirrorState {
  identity: {
    name: string;
    version: string;
    purpose: string;
    architecture_type: string;
    created_at: string;
  };
  modules: EchoMirrorModule[];
  capabilities: EchoMirrorCapability[];
  limitations: EchoMirrorLimitation[];
  telemetry: EchoMirrorTelemetry;
  last_self_assessment: string;
  epistemic_status: string;
}

export interface EchoMirrorQueryResponse {
  query: string;
  answer: string;
  confidence: number;
  evidence_sources: string[];
  epistemic_label: 'documented_fact' | 'inference' | 'uncertainty' | 'unknown';
  relevant_modules: string[];
  caveats: string[];
}

// --- Self-Reflection --------------------------------------------------------
export interface SelfReflectionRecord {
  id: number;
  user_request: string;
  echo_response: string;
  accuracy_score: number;
  grounding_score: number;
  honesty_score: number;
  identified_limitations: string[];
  improvement_suggestions: string[];
  evidence_quality: 'high' | 'medium' | 'low';
  test_status: 'pass' | 'fail' | 'partial';
  evaluated_at: string;
  is_synthetic_demo: boolean;
}

export interface SelfAuditResult {
  total_evaluations: number;
  avg_accuracy: number;
  avg_grounding: number;
  avg_honesty: number;
  overall_health_score: number;
  pass_rate: number;
  top_weaknesses: string[];
  top_strengths: string[];
  audit_timestamp: string;
}

// --- Self-Evolution ---------------------------------------------------------
export interface SelfEvolutionProposal {
  id: number;
  weakness_identified: string;
  evidence: string;
  proposed_change: string;
  expected_impact: string;
  baseline_benchmark: number;
  projected_benchmark: number;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  reviewer_name?: string;
  reviewer_notes?: string;
  reviewed_at?: string;
  created_at: string;
  is_synthetic_demo: boolean;
}

// --- Council of Experts Types ---
export interface CouncilChallenge {
  id: string;
  title: string;
  domain: string;
  category: string;
  summary: string;
  difficulty: string;
  default_expert_ids: number[];
  constraints: string[];
}

export interface ExpertPerspective {
  expert_id: number;
  expert_name: string;
  title: string;
  organization: string;
  domain: string;
  avatar_url?: string;
  years_experience: number;
  stance: string;
  priorities: string[];
  key_quote: string;
  grounded_evidence: string;
  trade_off_willingness: string;
  records_count: number;
  decisions_count: number;
}

export interface CouncilAgreement {
  topic: string;
  summary: string;
  consensus_level: string;
  expert_alignments: Array<{ name: string; reason: string }>;
}

export interface CouncilContention {
  topic: string;
  severity: string;
  dimension: string;
  perspective_a: { advocate: string; position: string };
  perspective_b: { advocate: string; position: string };
  synthesis_resolution: string;
}

export interface CouncilRecommendation {
  title: string;
  executive_summary: string;
  phased_roadmap: Array<{
    phase: string;
    timeframe: string;
    lead_domain: string;
    actions: string[];
  }>;
  balanced_scorecard: Record<string, string>;
  critical_risk_mitigations: Array<{ risk: string; mitigation: string }>;
}

export interface CouncilDeliberationResult {
  challenge_title: string;
  challenge_description: string;
  experts_count: number;
  expert_perspectives: ExpertPerspective[];
  agreements: CouncilAgreement[];
  contentions: CouncilContention[];
  synthesized_recommendation: CouncilRecommendation;
  cited_decisions: Array<{ id: number; title: string; expert_name: string; selected_decision: string; confidence: number }>;
  cited_knowledge_records: Array<{ id: number; title: string; expert_name: string; category: string; takeaways: string[] }>;
  status: string;
  epistemic_classification: string;
}

// --- ECHO Decision Time Machine Types ---
export interface TimeMachineDecision {
  id: number;
  title: string;
  expert_id: number;
  expert_name: string;
  expert_domain: string;
  problem_definition: string;
  selected_decision: string;
  confidence_rating: number;
  status: string;
  constraints: string[];
}

export interface TimeMachineDecisionDetail {
  id: number;
  title: string;
  expert_name: string;
  expert_domain: string;
  problem_definition: string;
  context: string;
  original_constraints: string[];
  original_reasoning: string;
  selected_decision: string;
  original_outcome: string;
  original_lessons: string;
  confidence_rating: number;
  alternatives: Array<{
    id?: number;
    title: string;
    description: string;
    pros: string[];
    cons: string[];
    why_rejected: string;
    estimated_risk: string;
  }>;
  evidence: Array<{
    title: string;
    type: string;
    content: string;
    reliability: number;
  }>;
  outcomes: Array<{
    metric: string;
    expected: string;
    actual: string;
    impact: string;
  }>;
  lessons: Array<{
    title: string;
    insight: string;
    anti_pattern: string;
    practice: string;
  }>;
}

export interface TimeMachineComparisonItem {
  parameter: string;
  original_baseline: string;
  simulated_branch: string;
  delta: string;
  status: string;
}

export interface TimeMachineSimulationResult {
  decision_id: number;
  decision_title: string;
  expert_name: string;
  domain: string;
  original_selected_decision: string;
  simulated_selected_decision: string;
  branch_rationale: string;
  branch_risk_rating: string;
  epistemic_truth_classification: string;
  feasibility_status: string;
  warnings: string[];
  comparison_table: TimeMachineComparisonItem[];
  causal_chain: string[];
}
