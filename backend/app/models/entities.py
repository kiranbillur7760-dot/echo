from datetime import datetime
import json
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.database.session import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(100), unique=True, index=True, nullable=False)
    domain = Column(String(100), nullable=False)
    security_tier = Column(String(50), default="tier_3_defense") # tier_1_public, tier_2_enterprise, tier_3_defense
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    memberships = relationship("Membership", back_populates="organization", cascade="all, delete-orphan")
    experts = relationship("Expert", back_populates="organization_ref")

class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    role = Column(String(50), default="member") # admin, expert_contributor, member, auditor
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="memberships")
    organization = relationship("Organization", back_populates="memberships")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="researcher") # admin, expert, researcher, student
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    expert_profile = relationship("Expert", back_populates="user", uselist=False)
    submissions = relationship("StudentSubmission", back_populates="user")
    skill_profiles = relationship("SkillProfile", back_populates="user")
    memberships = relationship("Membership", back_populates="user", cascade="all, delete-orphan")

class Expert(Base):
    __tablename__ = "experts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    name = Column(String(255), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    organization = Column(String(255), nullable=False)
    domain = Column(String(100), nullable=False, index=True) # e.g. Aerospace Engineering, Materials Science
    bio = Column(Text, nullable=False)
    avatar_url = Column(String(512), nullable=True)
    verification_status = Column(String(50), default="verified") # unverified, pending, verified
    years_experience = Column(Integer, default=15)
    is_synthetic_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="expert_profile")
    organization_ref = relationship("Organization", back_populates="experts")
    details = relationship("ExpertProfile", back_populates="expert", uselist=False, cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="expert", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="expert", cascade="all, delete-orphan")
    knowledge_records = relationship("KnowledgeRecord", back_populates="expert", cascade="all, delete-orphan")
    experiences = relationship("Experience", back_populates="expert", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="expert", cascade="all, delete-orphan")
    lessons = relationship("Lesson", back_populates="expert", cascade="all, delete-orphan")
    case_studies = relationship("CaseStudy", back_populates="expert", cascade="all, delete-orphan")
    consent = relationship("ExpertConsent", back_populates="expert", uselist=False, cascade="all, delete-orphan")
    source_media = relationship("SourceMedia", back_populates="expert", cascade="all, delete-orphan")
    knowledge_units = relationship("KnowledgeUnit", back_populates="expert", cascade="all, delete-orphan")

class ExpertProfile(Base):
    __tablename__ = "expert_profiles"

    id = Column(Integer, primary_key=True, index=True)
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=False, unique=True)
    summary = Column(Text, nullable=False)
    core_competencies = Column(Text, default="[]") # JSON list of strings
    awards_recognitions = Column(Text, default="[]") # JSON list of strings
    career_milestones = Column(Text, default="[]") # JSON list of objects
    publications = Column(Text, default="[]") # JSON list of objects

    expert = relationship("Expert", back_populates="details")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=False)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    domain = Column(String(100), nullable=False)
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    role = Column(String(100), nullable=False)
    status = Column(String(50), default="completed") # active, completed, archived
    is_synthetic_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    expert = relationship("Expert", back_populates="projects")
    decisions = relationship("Decision", back_populates="project")
    knowledge_records = relationship("KnowledgeRecord", back_populates="project")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=False)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, default=0)
    file_type = Column(String(50), nullable=False) # pdf, docx, txt, json
    processing_status = Column(String(50), default="extracted") # uploaded, processing, extracted, failed
    extracted_text = Column(Text, nullable=True)
    metadata_json = Column(Text, default="{}") # JSON metadata
    is_synthetic_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    expert = relationship("Expert", back_populates="documents")
    knowledge_records = relationship("KnowledgeRecord", back_populates="document")

class KnowledgeRecord(Base):
    __tablename__ = "knowledge_records"

    id = Column(Integer, primary_key=True, index=True)
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    title = Column(String(255), nullable=False, index=True)
    category = Column(String(50), default="experience") # experience, decision_pattern, heuristic, principle, methodology
    content = Column(Text, nullable=False)
    key_takeaways = Column(Text, default="[]") # JSON list of strings
    source_reference = Column(String(255), nullable=True)
    verification_status = Column(String(50), default="verified") # draft, verified, rejected
    confidence_score = Column(Float, default=0.95)
    is_synthetic_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    expert = relationship("Expert", back_populates="knowledge_records")
    project = relationship("Project", back_populates="knowledge_records")
    document = relationship("Document", back_populates="knowledge_records")
    evidence_items = relationship("Evidence", back_populates="knowledge_record")

class Experience(Base):
    __tablename__ = "experiences"

    id = Column(Integer, primary_key=True, index=True)
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    title = Column(String(255), nullable=False)
    context = Column(Text, nullable=False)
    situation = Column(Text, nullable=False)
    challenge = Column(Text, nullable=False)
    actions_taken = Column(Text, nullable=False)
    results = Column(Text, nullable=False)
    key_learnings = Column(Text, nullable=False)
    verified = Column(Boolean, default=True)
    is_synthetic_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    expert = relationship("Expert", back_populates="experiences")

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    title = Column(String(255), nullable=False, index=True)
    problem_definition = Column(Text, nullable=False)
    context = Column(Text, nullable=False)
    constraints = Column(Text, default="[]") # JSON list of strings
    reasoning = Column(Text, nullable=False)
    selected_decision = Column(Text, nullable=False)
    outcome = Column(Text, nullable=False)
    lessons_learned = Column(Text, nullable=False)
    confidence_rating = Column(Float, default=0.92)
    status = Column(String(50), default="verified") # draft, verified
    is_synthetic_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    expert = relationship("Expert", back_populates="decisions")
    project = relationship("Project", back_populates="decisions")
    alternatives = relationship("DecisionAlternative", back_populates="decision", cascade="all, delete-orphan")
    evidence_items = relationship("Evidence", back_populates="decision", cascade="all, delete-orphan")
    outcomes = relationship("Outcome", back_populates="decision", cascade="all, delete-orphan")
    lessons = relationship("Lesson", back_populates="decision", cascade="all, delete-orphan")
    case_studies = relationship("CaseStudy", back_populates="decision")

class DecisionAlternative(Base):
    __tablename__ = "decision_alternatives"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    pros = Column(Text, default="[]") # JSON list
    cons = Column(Text, default="[]") # JSON list
    why_rejected = Column(Text, nullable=False)
    estimated_risk = Column(String(50), default="Medium") # Low, Medium, High, Extreme
    created_at = Column(DateTime, default=datetime.utcnow)

    decision = relationship("Decision", back_populates="alternatives")

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=True)
    knowledge_record_id = Column(Integer, ForeignKey("knowledge_records.id"), nullable=True)
    title = Column(String(255), nullable=False)
    evidence_type = Column(String(50), default="empirical_test") # empirical_test, historical_precedent, simulation_data, peer_reviewed_paper, expert_observation
    content = Column(Text, nullable=False)
    source_url_or_ref = Column(String(512), nullable=True)
    reliability_score = Column(Float, default=0.95)
    is_synthetic_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    decision = relationship("Decision", back_populates="evidence_items")
    knowledge_record = relationship("KnowledgeRecord", back_populates="evidence_items")

class Outcome(Base):
    __tablename__ = "outcomes"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=False)
    metric_name = Column(String(255), nullable=False)
    expected_value = Column(String(100), nullable=False)
    actual_value = Column(String(100), nullable=False)
    impact_summary = Column(Text, nullable=False)
    time_horizon = Column(String(100), default="Medium-term (1-3 years)")
    validation_method = Column(String(255), default="Telemetry & Destructive Testing")
    created_at = Column(DateTime, default=datetime.utcnow)

    decision = relationship("Decision", back_populates="outcomes")

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=True)
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=True)
    title = Column(String(255), nullable=False)
    category = Column(String(50), default="technical") # technical, operational, organizational, risk_management
    insight = Column(Text, nullable=False)
    anti_pattern_to_avoid = Column(Text, nullable=False)
    recommended_practice = Column(Text, nullable=False)
    is_synthetic_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    decision = relationship("Decision", back_populates="lessons")
    expert = relationship("Expert", back_populates="lessons")

class KnowledgeRelationship(Base):
    __tablename__ = "knowledge_relationships"

    id = Column(Integer, primary_key=True, index=True)
    source_type = Column(String(50), nullable=False) # expert, project, decision, evidence, lesson, skill
    source_id = Column(Integer, nullable=False, index=True)
    target_type = Column(String(50), nullable=False)
    target_id = Column(Integer, nullable=False, index=True)
    relation_type = Column(String(50), nullable=False) # solves, constrained_by, alternative_to, supported_by, derived_from, resulted_in, teaches
    strength = Column(Float, default=1.0)
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)

class CaseStudy(Base):
    __tablename__ = "case_studies"

    id = Column(Integer, primary_key=True, index=True)
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=True)
    title = Column(String(255), nullable=False, index=True)
    summary = Column(Text, nullable=False)
    domain = Column(String(100), nullable=False)
    industry = Column(String(100), nullable=False)
    background = Column(Text, nullable=False)
    core_dilemma = Column(Text, nullable=False)
    technical_data = Column(Text, default="{}") # JSON dict with engineering specs, charts, constraints
    learning_objectives = Column(Text, default="[]") # JSON list
    difficulty = Column(String(50), default="advanced") # beginner, intermediate, advanced
    is_synthetic_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    expert = relationship("Expert", back_populates="case_studies")
    decision = relationship("Decision", back_populates="case_studies")
    challenges = relationship("LearningChallenge", back_populates="case_study", cascade="all, delete-orphan")

class LearningChallenge(Base):
    __tablename__ = "learning_challenges"

    id = Column(Integer, primary_key=True, index=True)
    case_study_id = Column(Integer, ForeignKey("case_studies.id"), nullable=False)
    title = Column(String(255), nullable=False)
    scenario_prompt = Column(Text, nullable=False)
    constraints = Column(Text, default="[]") # JSON list
    evaluation_rubric = Column(Text, default="{}") # JSON dict
    max_score = Column(Integer, default=100)
    created_at = Column(DateTime, default=datetime.utcnow)

    case_study = relationship("CaseStudy", back_populates="challenges")
    submissions = relationship("StudentSubmission", back_populates="challenge", cascade="all, delete-orphan")

class StudentSubmission(Base):
    __tablename__ = "student_submissions"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("learning_challenges.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    student_name = Column(String(255), default="Cadet Engineer")
    proposed_solution = Column(Text, nullable=False)
    reasoning_steps = Column(Text, nullable=False)
    alternatives_considered = Column(Text, default="")
    evidence_cited = Column(Text, default="")
    status = Column(String(50), default="submitted") # submitted, evaluating, evaluated
    score = Column(Float, nullable=True)
    feedback_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)

    challenge = relationship("LearningChallenge", back_populates="submissions")
    user = relationship("User", back_populates="submissions")
    assessment = relationship("Assessment", back_populates="submission", uselist=False, cascade="all, delete-orphan")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("student_submissions.id"), nullable=False, unique=True)
    overall_score = Column(Float, nullable=False)
    reasoning_score = Column(Float, nullable=False)
    evidence_score = Column(Float, nullable=False)
    technical_score = Column(Float, nullable=False)
    problem_solving_score = Column(Float, nullable=False)
    comparative_analysis = Column(Text, nullable=False)
    strengths = Column(Text, default="[]") # JSON list
    areas_for_improvement = Column(Text, default="[]") # JSON list
    expert_comparison_notes = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("StudentSubmission", back_populates="assessment")

class SkillProfile(Base):
    __tablename__ = "skill_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    skill_name = Column(String(100), nullable=False)
    category = Column(String(100), default="Aerospace Systems")
    mastery_level = Column(String(50), default="Competent") # Novice, Competent, Proficient, Expert
    score_points = Column(Integer, default=75)
    evidence_count = Column(Integer, default=1)
    is_synthetic_demo = Column(Boolean, default=False)
    verified_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="skill_profiles")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action_type = Column(String(100), nullable=False) # e.g. expert_created, document_processed, decision_reconstructed, case_study_published, challenge_evaluated
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=False)
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)

class KnowledgeConflict(Base):
    __tablename__ = "knowledge_conflicts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    record_id_1 = Column(Integer, ForeignKey("knowledge_records.id"), nullable=True)
    record_id_2 = Column(Integer, ForeignKey("knowledge_records.id"), nullable=True)
    conflict_type = Column(String(50), default="contradiction") # contradiction, boundary_disagreement, outdated_metric
    description = Column(Text, nullable=False)
    expert_claim_a = Column(Text, nullable=False)
    expert_claim_b = Column(Text, nullable=False)
    severity = Column(String(50), default="high") # low, medium, high, critical
    resolution_status = Column(String(50), default="under_review") # unresolved, under_review, resolved
    resolution_notes = Column(Text, nullable=True)
    is_synthetic_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class KnowledgeUpdate(Base):
    __tablename__ = "knowledge_updates"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("knowledge_records.id"), nullable=False)
    previous_content = Column(Text, nullable=False)
    updated_content = Column(Text, nullable=False)
    reason_for_update = Column(Text, nullable=False)
    decay_indicator = Column(String(50), default="superseded") # active, aging, superseded
    new_evidence_ref = Column(String(255), nullable=True)
    is_synthetic_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class KnowledgeVerification(Base):
    __tablename__ = "knowledge_verifications"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("knowledge_records.id"), nullable=False)
    verified_by_expert_id = Column(Integer, ForeignKey("experts.id"), nullable=False)
    verification_status = Column(String(50), default="verified") # verified, rejected, conditional
    verification_notes = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class SelfReflectionRecord(Base):
    __tablename__ = "self_reflections"

    id = Column(Integer, primary_key=True, index=True)
    user_request = Column(Text, nullable=False)
    echo_response = Column(Text, nullable=False)
    evidence_sources = Column(Text, default="[]") # JSON list of strings/citations
    accuracy_score = Column(Float, default=92.0)
    evidence_grounding_score = Column(Float, default=95.0)
    epistemic_honesty_score = Column(Float, default=98.0)
    latency_ms = Column(Integer, default=320)
    identified_limitations = Column(Text, default="[]") # JSON list of strings
    uncertainty_level = Column(String(50), default="low") # low, moderate, high
    suggested_improvements = Column(Text, nullable=True)
    evaluation_criteria = Column(Text, default="{}") # JSON dict
    test_status = Column(String(50), default="evaluated") # evaluated, pending_test, improved
    created_at = Column(DateTime, default=datetime.utcnow)

class SelfEvolutionProposal(Base):
    __tablename__ = "self_evolution_proposals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    subsystem = Column(String(100), nullable=False) # e.g. Experience Simulation Engine, Epistemic Classifier
    identified_weakness = Column(Text, nullable=False)
    evidence_rationale = Column(Text, nullable=False)
    proposed_change = Column(Text, nullable=False)
    baseline_benchmark = Column(Text, default="{}") # JSON dict metrics
    projected_benchmark = Column(Text, default="{}") # JSON dict metrics
    test_suite_description = Column(Text, nullable=True)
    status = Column(String(50), default="pending_approval") # pending_approval, approved, rejected, applied
    reviewed_by = Column(String(100), nullable=True)
    review_notes = Column(Text, nullable=True)
    applied_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ==============================================================================
# PROJECT ECHO LIVING HUMAN INTELLIGENCE EXTENSIONS
# ==============================================================================

class ExpertConsent(Base):
    __tablename__ = "expert_consents"

    id = Column(Integer, primary_key=True, index=True)
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=False, unique=True)
    consent_knowledge = Column(Boolean, default=True)
    consent_voice = Column(Boolean, default=True)
    consent_likeness = Column(Boolean, default=True)
    disclosure_acknowledged = Column(Boolean, default=True)
    status = Column(String(50), default="active")  # active, suspended, revoked, deletion_requested
    consent_text = Column(Text, default="Expert explicitly consents to preservation of contributed knowledge and AI-assisted digital representation with full review and revocation rights.")
    signed_by = Column(String(255), nullable=True)
    signed_at = Column(DateTime, default=datetime.utcnow)
    revoked_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    expert = relationship("Expert", back_populates="consent")


class SourceMedia(Base):
    __tablename__ = "source_media"

    id = Column(Integer, primary_key=True, index=True)
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=False)
    media_type = Column(String(50), nullable=False)  # pdf, docx, txt, audio, video, interview, demonstration, manual
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=True)
    storage_path = Column(String(512), nullable=True)
    mime_type = Column(String(120), nullable=True)
    file_size = Column(Integer, default=0)
    duration_seconds = Column(Float, nullable=True)
    transcript = Column(Text, nullable=True)
    metadata_json = Column(Text, default="{}")
    status = Column(String(50), default="captured")  # captured, transcribed, extracted, failed, suspended
    is_synthetic_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    expert = relationship("Expert", back_populates="source_media")
    knowledge_units = relationship("KnowledgeUnit", back_populates="source_media")


class KnowledgeUnit(Base):
    __tablename__ = "knowledge_units"

    id = Column(Integer, primary_key=True, index=True)
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=False, index=True)
    source_media_id = Column(Integer, ForeignKey("source_media.id"), nullable=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(100), default="experience", index=True)
    # Categories: fact_concept, experience, reasoning_decision, practical_skill, method_procedure, problem_solution, failure_lesson, opinion_hypothesis, observation
    topic = Column(String(150), default="General Engineering", index=True)
    problem_or_situation = Column(Text, nullable=True)
    context_and_experience = Column(Text, nullable=True)
    reasoning_and_method = Column(Text, nullable=True)
    decisions_and_alternatives = Column(Text, nullable=True)
    failures_and_lessons = Column(Text, nullable=True)
    source_reference = Column(String(255), nullable=True)
    source_location_or_timestamp = Column(String(150), nullable=True)
    # Verification states: ai_extracted, awaiting_expert_review, approved_by_expert, rejected, needs_correction
    verification_status = Column(String(50), default="ai_extracted", index=True)
    access_permissions = Column(String(50), default="public")  # public, organization, restricted, suspended
    confidence_score = Column(Float, default=0.88)
    expert_notes = Column(Text, nullable=True)
    is_synthetic_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    expert = relationship("Expert", back_populates="knowledge_units")
    source_media = relationship("SourceMedia", back_populates="knowledge_units")
    verification_history = relationship("VerificationHistory", back_populates="knowledge_unit", cascade="all, delete-orphan")


class VerificationHistory(Base):
    __tablename__ = "verification_history"

    id = Column(Integer, primary_key=True, index=True)
    knowledge_unit_id = Column(Integer, ForeignKey("knowledge_units.id"), nullable=False, index=True)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    reviewer_name = Column(String(255), nullable=False)
    reviewer_role = Column(String(50), default="expert")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    knowledge_unit = relationship("KnowledgeUnit", back_populates="verification_history")


class ExpertRelationship(Base):
    __tablename__ = "expert_relationships"

    id = Column(Integer, primary_key=True, index=True)
    expert_a_id = Column(Integer, ForeignKey("experts.id"), nullable=False, index=True)
    expert_b_id = Column(Integer, ForeignKey("experts.id"), nullable=False, index=True)
    relationship_type = Column(String(80), default="complementary_domain")  # complementary_domain, methodological_tension, shared_program, cross_validation
    shared_topics = Column(Text, default="[]")  # JSON list
    summary = Column(Text, nullable=False)
    agreement_score = Column(Float, default=0.75)
    is_synthetic_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    mode = Column(String(50), default="hybrid_intelligence")  # complete_human_intelligence, hybrid_intelligence
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=True)
    expert_ids_json = Column(Text, default="[]")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_voice = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False, index=True)
    sender = Column(String(30), nullable=False)  # user, echo
    content = Column(Text, nullable=False)
    mode = Column(String(50), default="hybrid_intelligence")
    response_json = Column(Text, default="{}")
    epistemic_breakdown_json = Column(Text, default="{}")
    voice_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
    ai_runs = relationship("AIModelRun", back_populates="message", cascade="all, delete-orphan")
    evidence_links = relationship("EvidenceLink", back_populates="message", cascade="all, delete-orphan")


class AIModelRun(Base):
    __tablename__ = "ai_model_runs"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=True)
    provider_id = Column(String(50), nullable=False)
    provider_name = Column(String(100), nullable=False)
    model = Column(String(100), nullable=False)
    status = Column(String(30), nullable=False)  # success, failed, skipped
    latency_ms = Column(Integer, default=0)
    response_text = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    message = relationship("Message", back_populates="ai_runs")


class EvidenceLink(Base):
    __tablename__ = "evidence_links"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=False, index=True)
    knowledge_unit_id = Column(Integer, ForeignKey("knowledge_units.id"), nullable=True)
    source_type = Column(String(60), nullable=False)
    source_id = Column(Integer, default=0)
    source_title = Column(String(255), nullable=False)
    expert_name = Column(String(255), nullable=False)
    location_or_timestamp = Column(String(150), nullable=True)
    snippet = Column(Text, nullable=True)
    reliability_score = Column(Float, default=0.9)
    created_at = Column(DateTime, default=datetime.utcnow)

    message = relationship("Message", back_populates="evidence_links")


class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value_json = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)



