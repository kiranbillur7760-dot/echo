import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import Expert, ExpertProfile, Project, Decision, ActivityLog
from app.schemas.common import ExpertOut, ExpertCreate, ProjectOut, DecisionDNAOut

router = APIRouter(prefix="/experts", tags=["Expert Management"])

@router.get("", response_model=List[ExpertOut])
def list_experts(db: Session = Depends(get_db)):
    return db.query(Expert).order_by(Expert.created_at.desc()).all()

@router.get("/{expert_id}")
def get_expert_detail(expert_id: int, db: Session = Depends(get_db)):
    expert = db.query(Expert).filter(Expert.id == expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found.")

    details = expert.details
    profile_data = {}
    if details:
        try:
            core_comps = json.loads(details.core_competencies) if details.core_competencies else []
        except Exception:
            core_comps = []
        try:
            awards = json.loads(details.awards_recognitions) if details.awards_recognitions else []
        except Exception:
            awards = []
        try:
            milestones = json.loads(details.career_milestones) if details.career_milestones else []
        except Exception:
            milestones = []
        try:
            pubs = json.loads(details.publications) if details.publications else []
        except Exception:
            pubs = []

        profile_data = {
            "summary": details.summary,
            "core_competencies": core_comps,
            "awards_recognitions": awards,
            "career_milestones": milestones,
            "publications": pubs
        }

    projects = [
        {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "domain": p.domain,
            "role": p.role,
            "status": p.status
        }
        for p in expert.projects
    ]

    decisions = [
        {
            "id": d.id,
            "title": d.title,
            "problem": d.problem_definition[:120] + "...",
            "selected_decision": d.selected_decision[:120] + "...",
            "confidence": d.confidence_rating,
            "status": d.status
        }
        for d in expert.decisions
    ]

    return {
        "id": expert.id,
        "name": expert.name,
        "title": expert.title,
        "organization": expert.organization,
        "domain": expert.domain,
        "bio": expert.bio,
        "avatar_url": expert.avatar_url,
        "verification_status": expert.verification_status,
        "years_experience": expert.years_experience,
        "is_synthetic_demo": expert.is_synthetic_demo,
        "created_at": expert.created_at,
        "profile": profile_data,
        "projects": projects,
        "decisions": decisions
    }

@router.post("", response_model=ExpertOut)
def create_expert(expert_in: ExpertCreate, db: Session = Depends(get_db)):
    expert = Expert(
        name=expert_in.name,
        title=expert_in.title,
        organization=expert_in.organization,
        domain=expert_in.domain,
        bio=expert_in.bio,
        avatar_url=expert_in.avatar_url or "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        verification_status=expert_in.verification_status or "verified",
        years_experience=expert_in.years_experience or 10,
        is_synthetic_demo=expert_in.is_synthetic_demo or False
    )
    db.add(expert)
    db.flush()

    profile = ExpertProfile(
        expert_id=expert.id,
        summary=expert_in.summary or expert_in.bio[:200],
        core_competencies=json.dumps(expert_in.core_competencies or []),
        awards_recognitions=json.dumps(expert_in.awards_recognitions or []),
        career_milestones=json.dumps([]),
        publications=json.dumps([])
    )
    db.add(profile)

    log = ActivityLog(
        action_type="expert_created",
        entity_type="Expert",
        entity_id=expert.id,
        description=f"Created expert intelligence profile for {expert.name} ({expert.domain})."
    )
    db.add(log)

    db.commit()
    db.refresh(expert)
    return expert

@router.get("/{expert_id}/projects", response_model=List[ProjectOut])
def get_expert_projects(expert_id: int, db: Session = Depends(get_db)):
    return db.query(Project).filter(Project.expert_id == expert_id).all()
