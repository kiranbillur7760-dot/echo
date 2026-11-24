import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import CaseStudy, LearningChallenge, StudentSubmission, Assessment, SkillProfile, User
from app.schemas.common import (
    CaseStudyOut, LearningChallengeOut, SubmissionCreate, StudentSubmissionOut, SkillProfileOut
)
from app.services.learning_engine import LearningEngine

router = APIRouter(prefix="/learning", tags=["Intelligence Transfer Platform"])

@router.get("/case-studies", response_model=List[CaseStudyOut])
def list_case_studies(db: Session = Depends(get_db)):
    studies = db.query(CaseStudy).all()
    results = []
    for s in studies:
        try:
            tech_data = json.loads(s.technical_data) if s.technical_data else {}
        except Exception:
            tech_data = {}
        try:
            objs = json.loads(s.learning_objectives) if s.learning_objectives else []
        except Exception:
            objs = []

        results.append(CaseStudyOut(
            id=s.id,
            expert_id=s.expert_id,
            expert_name=s.expert.name if s.expert else None,
            decision_id=s.decision_id,
            title=s.title,
            summary=s.summary,
            domain=s.domain,
            industry=s.industry,
            background=s.background,
            core_dilemma=s.core_dilemma,
            technical_data=tech_data,
            learning_objectives=objs,
            difficulty=s.difficulty,
            is_synthetic_demo=s.is_synthetic_demo,
            created_at=s.created_at
        ))
    return results

@router.post("/case-studies", response_model=CaseStudyOut)
def create_case_study(
    title: str = Body(...),
    summary: str = Body(...),
    domain: str = Body("Aerospace Engineering"),
    industry: str = Body("Space Exploration"),
    background: str = Body(...),
    core_dilemma: str = Body(...),
    difficulty: str = Body("advanced"),
    expert_id: Optional[int] = Body(1),
    technical_data: Optional[dict] = Body({}),
    learning_objectives: Optional[List[str]] = Body([]),
    challenge_title: Optional[str] = Body("System Architecture Challenge"),
    challenge_prompt: Optional[str] = Body("Provide a technical proposal solving the core dilemma."),
    db: Session = Depends(get_db)
):
    case = CaseStudy(
        expert_id=expert_id,
        title=title,
        summary=summary,
        domain=domain,
        industry=industry,
        background=background,
        core_dilemma=core_dilemma,
        difficulty=difficulty,
        technical_data=json.dumps(technical_data or {}),
        learning_objectives=json.dumps(learning_objectives or []),
        is_synthetic_demo=False
    )
    db.add(case)
    db.flush()

    # Add challenge
    chal = LearningChallenge(
        case_study_id=case.id,
        title=challenge_title or "System Architecture Proposal",
        scenario_prompt=challenge_prompt or background[:300],
        constraints=json.dumps(["Mass budget strict", "No ablation permitted"]),
        evaluation_rubric=json.dumps({"reasoning": 25, "technical": 25, "evidence": 25, "alternatives": 25}),
        max_score=100
    )
    db.add(chal)
    db.commit()
    db.refresh(case)

    return CaseStudyOut(
        id=case.id,
        expert_id=case.expert_id,
        expert_name=case.expert.name if case.expert else "Dr. Alex Morgan",
        decision_id=case.decision_id,
        title=case.title,
        summary=case.summary,
        domain=case.domain,
        industry=case.industry,
        background=case.background,
        core_dilemma=case.core_dilemma,
        technical_data=technical_data or {},
        learning_objectives=learning_objectives or [],
        difficulty=case.difficulty,
        is_synthetic_demo=case.is_synthetic_demo,
        created_at=case.created_at
    )

@router.get("/case-studies/{case_study_id}")
def get_case_study(case_study_id: int, db: Session = Depends(get_db)):
    s = db.query(CaseStudy).filter(CaseStudy.id == case_study_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Case study not found.")

    try:
        tech_data = json.loads(s.technical_data) if s.technical_data else {}
    except Exception:
        tech_data = {}
    try:
        objs = json.loads(s.learning_objectives) if s.learning_objectives else []
    except Exception:
        objs = []

    challenges = []
    for ch in s.challenges:
        try:
            constraints = json.loads(ch.constraints) if ch.constraints else []
        except Exception:
            constraints = []
        try:
            rubric = json.loads(ch.evaluation_rubric) if ch.evaluation_rubric else {}
        except Exception:
            rubric = {}
        challenges.append({
            "id": ch.id,
            "title": ch.title,
            "scenario_prompt": ch.scenario_prompt,
            "constraints": constraints,
            "evaluation_rubric": rubric,
            "max_score": ch.max_score
        })

    return {
        "id": s.id,
        "expert_id": s.expert_id,
        "expert_name": s.expert.name if s.expert else "Dr. Alex Morgan",
        "decision_id": s.decision_id,
        "title": s.title,
        "summary": s.summary,
        "domain": s.domain,
        "industry": s.industry,
        "background": s.background,
        "core_dilemma": s.core_dilemma,
        "technical_data": tech_data,
        "learning_objectives": objs,
        "difficulty": s.difficulty,
        "is_synthetic_demo": s.is_synthetic_demo,
        "created_at": s.created_at,
        "challenges": challenges
    }

@router.post("/submissions", response_model=StudentSubmissionOut)
def submit_challenge(sub_in: SubmissionCreate, db: Session = Depends(get_db)):
    sub = LearningEngine.evaluate_submission(db, sub_in)
    
    assessment_out = None
    if sub.assessment:
        try:
            strengths = json.loads(sub.assessment.strengths) if sub.assessment.strengths else []
        except Exception:
            strengths = []
        try:
            improvements = json.loads(sub.assessment.areas_for_improvement) if sub.assessment.areas_for_improvement else []
        except Exception:
            improvements = []

        assessment_out = {
            "id": sub.assessment.id,
            "submission_id": sub.assessment.submission_id,
            "overall_score": sub.assessment.overall_score,
            "reasoning_score": sub.assessment.reasoning_score,
            "evidence_score": sub.assessment.evidence_score,
            "technical_score": sub.assessment.technical_score,
            "problem_solving_score": sub.assessment.problem_solving_score,
            "comparative_analysis": sub.assessment.comparative_analysis,
            "strengths": strengths,
            "areas_for_improvement": improvements,
            "expert_comparison_notes": sub.assessment.expert_comparison_notes,
            "created_at": sub.assessment.created_at
        }

    return StudentSubmissionOut(
        id=sub.id,
        challenge_id=sub.challenge_id,
        student_name=sub.student_name,
        proposed_solution=sub.proposed_solution,
        reasoning_steps=sub.reasoning_steps,
        alternatives_considered=sub.alternatives_considered,
        evidence_cited=sub.evidence_cited,
        status=sub.status,
        score=sub.score,
        created_at=sub.created_at,
        assessment=assessment_out
    )

@router.get("/submissions", response_model=List[StudentSubmissionOut])
def list_submissions(challenge_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(StudentSubmission)
    if challenge_id:
        q = q.filter(StudentSubmission.challenge_id == challenge_id)
    subs = q.order_by(StudentSubmission.created_at.desc()).all()

    results = []
    for sub in subs:
        assessment_out = None
        if sub.assessment:
            try:
                strengths = json.loads(sub.assessment.strengths) if sub.assessment.strengths else []
            except Exception:
                strengths = []
            try:
                improvements = json.loads(sub.assessment.areas_for_improvement) if sub.assessment.areas_for_improvement else []
            except Exception:
                improvements = []

            assessment_out = {
                "id": sub.assessment.id,
                "submission_id": sub.assessment.submission_id,
                "overall_score": sub.assessment.overall_score,
                "reasoning_score": sub.assessment.reasoning_score,
                "evidence_score": sub.assessment.evidence_score,
                "technical_score": sub.assessment.technical_score,
                "problem_solving_score": sub.assessment.problem_solving_score,
                "comparative_analysis": sub.assessment.comparative_analysis,
                "strengths": strengths,
                "areas_for_improvement": improvements,
                "expert_comparison_notes": sub.assessment.expert_comparison_notes,
                "created_at": sub.assessment.created_at
            }

        results.append(StudentSubmissionOut(
            id=sub.id,
            challenge_id=sub.challenge_id,
            student_name=sub.student_name,
            proposed_solution=sub.proposed_solution,
            reasoning_steps=sub.reasoning_steps,
            alternatives_considered=sub.alternatives_considered,
            evidence_cited=sub.evidence_cited,
            status=sub.status,
            score=sub.score,
            created_at=sub.created_at,
            assessment=assessment_out
        ))
    return results

@router.get("/submissions/{submission_id}", response_model=StudentSubmissionOut)
def get_submission(submission_id: int, db: Session = Depends(get_db)):
    sub = db.query(StudentSubmission).filter(StudentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    assessment_out = None
    if sub.assessment:
        try:
            strengths = json.loads(sub.assessment.strengths) if sub.assessment.strengths else []
        except Exception:
            strengths = []
        try:
            improvements = json.loads(sub.assessment.areas_for_improvement) if sub.assessment.areas_for_improvement else []
        except Exception:
            improvements = []

        assessment_out = {
            "id": sub.assessment.id,
            "submission_id": sub.assessment.submission_id,
            "overall_score": sub.assessment.overall_score,
            "reasoning_score": sub.assessment.reasoning_score,
            "evidence_score": sub.assessment.evidence_score,
            "technical_score": sub.assessment.technical_score,
            "problem_solving_score": sub.assessment.problem_solving_score,
            "comparative_analysis": sub.assessment.comparative_analysis,
            "strengths": strengths,
            "areas_for_improvement": improvements,
            "expert_comparison_notes": sub.assessment.expert_comparison_notes,
            "created_at": sub.assessment.created_at
        }

    return StudentSubmissionOut(
        id=sub.id,
        challenge_id=sub.challenge_id,
        student_name=sub.student_name,
        proposed_solution=sub.proposed_solution,
        reasoning_steps=sub.reasoning_steps,
        alternatives_considered=sub.alternatives_considered,
        evidence_cited=sub.evidence_cited,
        status=sub.status,
        score=sub.score,
        created_at=sub.created_at,
        assessment=assessment_out
    )

@router.get("/skills", response_model=List[SkillProfileOut])
def list_skills(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(SkillProfile)
    if user_id:
        q = q.filter(SkillProfile.user_id == user_id)
    return q.all()
