from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: str
    full_name: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "researcher"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Expert Schemas ---
class ExpertBase(BaseModel):
    name: str
    title: str
    organization: str
    domain: str
    bio: str
    avatar_url: Optional[str] = None
    verification_status: Optional[str] = "verified"
    years_experience: Optional[int] = 15
    is_synthetic_demo: Optional[bool] = False

class ExpertCreate(ExpertBase):
    summary: Optional[str] = ""
    core_competencies: Optional[List[str]] = []
    awards_recognitions: Optional[List[str]] = []

class ExpertOut(ExpertBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectOut(BaseModel):
    id: int
    expert_id: int
    title: str
    description: str
    domain: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    role: str
    status: str
    is_synthetic_demo: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    title: str
    description: str
    domain: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    role: str
    status: Optional[str] = "completed"

# --- Document Schemas ---
class DocumentOut(BaseModel):
    id: int
    expert_id: int
    title: str
    filename: str
    file_size: int
    file_type: str
    processing_status: str
    extracted_text: Optional[str] = None
    metadata_json: Optional[str] = "{}"
    is_synthetic_demo: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Knowledge Schemas ---
class KnowledgeRecordBase(BaseModel):
    expert_id: int
    project_id: Optional[int] = None
    document_id: Optional[int] = None
    title: str
    category: str = "experience"
    content: str
    key_takeaways: Optional[List[str]] = []
    source_reference: Optional[str] = None
    verification_status: Optional[str] = "verified"
    confidence_score: Optional[float] = 0.95
    is_synthetic_demo: Optional[bool] = False

class KnowledgeRecordCreate(KnowledgeRecordBase):
    pass

class KnowledgeRecordOut(KnowledgeRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ExperienceOut(BaseModel):
    id: int
    expert_id: int
    project_id: Optional[int] = None
    title: str
    context: str
    situation: str
    challenge: str
    actions_taken: str
    results: str
    key_learnings: str
    verified: bool
    is_synthetic_demo: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LessonOut(BaseModel):
    id: int
    decision_id: Optional[int] = None
    expert_id: Optional[int] = None
    title: str
    category: str
    insight: str
    anti_pattern_to_avoid: str
    recommended_practice: str
    is_synthetic_demo: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Decision DNA Schemas ---
class AlternativeSchema(BaseModel):
    id: Optional[int] = None
    title: str
    description: str
    pros: List[str] = []
    cons: List[str] = []
    why_rejected: str
    estimated_risk: str = "Medium"

class EvidenceSchema(BaseModel):
    id: Optional[int] = None
    title: str
    evidence_type: str
    content: str
    source_url_or_ref: Optional[str] = None
    reliability_score: float = 0.95

class OutcomeSchema(BaseModel):
    id: Optional[int] = None
    metric_name: str
    expected_value: str
    actual_value: str
    impact_summary: str
    time_horizon: str
    validation_method: str

class DecisionCreate(BaseModel):
    expert_id: int
    project_id: Optional[int] = None
    title: str
    problem_definition: str
    context: str
    constraints: List[str] = []
    reasoning: str
    selected_decision: str
    outcome: str
    lessons_learned: str
    confidence_rating: Optional[float] = 0.92
    alternatives: Optional[List[AlternativeSchema]] = []
    evidence_items: Optional[List[EvidenceSchema]] = []
    outcomes: Optional[List[OutcomeSchema]] = []

class DecisionDNAOut(BaseModel):
    id: int
    expert_id: int
    expert_name: Optional[str] = None
    project_id: Optional[int] = None
    project_title: Optional[str] = None
    title: str
    problem_definition: str
    context: str
    constraints: List[str]
    reasoning: str
    selected_decision: str
    outcome: str
    lessons_learned: str
    confidence_rating: float
    status: str
    is_synthetic_demo: bool
    created_at: datetime
    alternatives: List[AlternativeSchema] = []
    evidence_items: List[EvidenceSchema] = []
    outcomes: List[OutcomeSchema] = []
    lessons: List[LessonOut] = []

    class Config:
        from_attributes = True

# --- Experience Simulation Schemas ---
class SimulationRequest(BaseModel):
    problem_title: str
    problem_description: str
    operating_constraints: List[str] = []
    domain: Optional[str] = "Aerospace Engineering"
    expert_id: Optional[int] = None

class HistoricalMatch(BaseModel):
    decision_id: int
    title: str
    similarity_score: float
    domain: str
    key_similarities: List[str]
    key_differences: List[str]
    expert_name: str

class SimulationApproach(BaseModel):
    approach_name: str
    strategy_summary: str
    historical_grounding: str
    supporting_evidence: List[str]
    projected_tradeoffs: Dict[str, str]
    confidence_level: str # High, Moderate, Low
    ai_inferences: List[str] # Explicitly labeled AI inferences
    missing_parameters: List[str] # Missing info to verify before acting

class SimulationResponse(BaseModel):
    problem_analyzed: str
    domain: str
    relevant_historical_decisions: List[HistoricalMatch]
    recommended_approaches: List[SimulationApproach]
    synthesis_statement: str
    epistemic_disclaimer: str

# --- Organization Schemas ---
class OrganizationBase(BaseModel):
    name: str
    code: str
    domain: str
    security_tier: Optional[str] = "tier_3_defense"
    description: Optional[str] = None

class OrganizationOut(OrganizationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Evolution & Conflict Schemas ---
class KnowledgeConflictOut(BaseModel):
    id: int
    title: str
    record_id_1: Optional[int] = None
    record_id_2: Optional[int] = None
    conflict_type: str
    description: str
    expert_claim_a: str
    expert_claim_b: str
    severity: str
    resolution_status: str
    resolution_notes: Optional[str] = None
    is_synthetic_demo: bool
    created_at: datetime

    class Config:
        from_attributes = True

class KnowledgeUpdateOut(BaseModel):
    id: int
    record_id: int
    previous_content: str
    updated_content: str
    reason_for_update: str
    decay_indicator: str
    new_evidence_ref: Optional[str] = None
    is_synthetic_demo: bool
    created_at: datetime

    class Config:
        from_attributes = True

class KnowledgeVerificationOut(BaseModel):
    id: int
    record_id: int
    verified_by_expert_id: int
    verification_status: str
    verification_notes: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Decision Replay Schemas ---
class DecisionReplayRequest(BaseModel):
    decision_id: int
    modified_temperature_c: Optional[float] = None
    modified_mass_budget_kg: Optional[float] = None
    modified_flight_cycles: Optional[int] = None
    modified_mission_profile: Optional[str] = None # e.g. 'single_use_expendable', 'multi_mission_reusable'
    custom_assumptions: Optional[Dict[str, Any]] = {}

class DecisionReplayResponse(BaseModel):
    decision_id: int
    original_title: str
    original_selected_decision: str
    modified_parameters: Dict[str, Any]
    branching_divergence_point: str
    replayed_selected_approach: str
    replayed_rationale: str
    tradeoff_comparison: Dict[str, str]
    hypothetical_projected_outcome: str
    is_hypothetical_simulation: bool = True
    epistemic_warning: str

# --- Ask ECHO Schemas ---
class CitationSource(BaseModel):
    source_type: str # 'document', 'decision', 'evidence', 'empirical_record'
    title: str
    reference_id: int
    expert_name: str
    snippet: str
    provenance_url: Optional[str] = None

class EpistemicClaim(BaseModel):
    claim_type: str # 'DOCUMENTED FACT', 'EXPERT-VERIFIED INFORMATION', 'AI-GENERATED INFERENCE', 'HYPOTHETICAL SIMULATION', 'INSUFFICIENT EVIDENCE'
    statement: str
    grounding: str
    confidence: float

class AskEchoRequest(BaseModel):
    query: str
    expert_id: Optional[int] = None
    focus_domain: Optional[str] = None

class AskEchoResponse(BaseModel):
    query: str
    structured_claims: List[EpistemicClaim]
    narrative_answer: str
    documented_facts: List[str]
    expert_verified_insights: List[str]
    ai_generated_inferences: List[str]
    hypothetical_simulations: List[str] = []
    uncertainties_and_gaps: List[str]
    citations: List[CitationSource]
    overall_confidence: float

# --- Learning & Assessment Schemas ---
class CaseStudyOut(BaseModel):
    id: int
    expert_id: Optional[int] = None
    expert_name: Optional[str] = None
    decision_id: Optional[int] = None
    title: str
    summary: str
    domain: str
    industry: str
    background: str
    core_dilemma: str
    technical_data: Dict[str, Any] = {}
    learning_objectives: List[str] = []
    difficulty: str
    is_synthetic_demo: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LearningChallengeOut(BaseModel):
    id: int
    case_study_id: int
    title: str
    scenario_prompt: str
    constraints: List[str]
    evaluation_rubric: Dict[str, Any]
    max_score: int
    created_at: datetime

    class Config:
        from_attributes = True

class SubmissionCreate(BaseModel):
    challenge_id: int
    student_name: Optional[str] = "Cadet Systems Engineer"
    proposed_solution: str
    reasoning_steps: str
    alternatives_considered: Optional[str] = ""
    evidence_cited: Optional[str] = ""

class AssessmentOut(BaseModel):
    id: int
    submission_id: int
    overall_score: float
    reasoning_score: float
    evidence_score: float
    technical_score: float
    problem_solving_score: float
    comparative_analysis: str
    strengths: List[str]
    areas_for_improvement: List[str]
    expert_comparison_notes: str
    created_at: datetime

    class Config:
        from_attributes = True

class StudentSubmissionOut(BaseModel):
    id: int
    challenge_id: int
    student_name: str
    proposed_solution: str
    reasoning_steps: str
    alternatives_considered: str
    evidence_cited: str
    status: str
    score: Optional[float] = None
    created_at: datetime
    assessment: Optional[AssessmentOut] = None

    class Config:
        from_attributes = True

class SkillProfileOut(BaseModel):
    id: int
    skill_name: str
    category: str
    mastery_level: str
    score_points: int
    evidence_count: int
    is_synthetic_demo: bool
    verified_at: datetime

    class Config:
        from_attributes = True

# --- Knowledge Graph Schemas ---
class GraphNode(BaseModel):
    id: str
    label: str
    type: str # 'expert', 'project', 'decision', 'alternative', 'evidence', 'lesson', 'skill'
    category: str
    details: Dict[str, Any] = {}
    is_synthetic: bool = False

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str # 'solves', 'constrained_by', 'alternative_to', 'supported_by', 'derived_from', 'resulted_in', 'teaches'
    strength: float = 1.0

class KnowledgeGraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

# --- Analytics & Overview Schemas ---
class OverviewMetrics(BaseModel):
    expert_profiles_count: int
    knowledge_records_count: int
    decisions_documented_count: int
    case_studies_count: int
    total_evidence_pieces: int
    simulation_runs: int

class RecentActivityOut(BaseModel):
    id: int
    action_type: str
    entity_type: str
    entity_id: Optional[int] = None
    description: str
    created_at: datetime

    class Config:
        from_attributes = True

class PlatformOverview(BaseModel):
    metrics: OverviewMetrics
    recent_activities: List[RecentActivityOut]
    todays_insight: Dict[str, str]
    active_research: List[Dict[str, str]]
    top_expertise_areas: List[Dict[str, Any]]
