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
  claim_type: 'DOCUMENTED FACT' | 'EXPERT-VERIFIED INFORMATION' | 'AI-GENERATED INFERENCE' | 'HYPOTHETICAL SIMULATION' | 'INSUFFICIENT EVIDENCE';
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
}

export interface AskEchoResult {
  query: string;
  structured_claims: EpistemicClaim[];
  narrative_answer: string;
  documented_facts: string[];
  expert_verified_insights: string[];
  ai_generated_inferences: string[];
  hypothetical_simulations?: string[];
  uncertainties_and_gaps: string[];
  citations: CitationSource[];
  overall_confidence: number;
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

