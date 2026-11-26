from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import Expert
from app.services.council_service import CouncilService

router = APIRouter(prefix="/council", tags=["Council of Experts"])

class DeliberationRequest(BaseModel):
    challenge_title: str
    challenge_description: str
    expert_ids: List[int]
    user_constraints: Optional[List[str]] = None

@router.get("/challenges")
def get_council_challenges():
    """Retrieve preset multi-disciplinary engineering challenges for the Council."""
    return CouncilService.get_challenges()

@router.get("/experts")
def get_council_roster(db: Session = Depends(get_db)):
    """Retrieve domain experts available to serve on the Council."""
    experts = db.query(Expert).all()
    roster = []
    for exp in experts:
        roster.append({
            "id": exp.id,
            "name": exp.name,
            "title": exp.title,
            "organization": exp.organization,
            "domain": exp.domain,
            "bio": exp.bio,
            "avatar_url": exp.avatar_url,
            "years_experience": exp.years_experience,
            "verification_status": exp.verification_status
        })
    return roster

@router.post("/deliberate")
def run_council_deliberation(req: DeliberationRequest, db: Session = Depends(get_db)):
    """Run an evidence-grounded multi-expert deliberation session."""
    try:
        return CouncilService.deliberate(
            db=db,
            challenge_title=req.challenge_title,
            challenge_description=req.challenge_description,
            expert_ids=req.expert_ids,
            user_constraints=req.user_constraints
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deliberation error: {str(e)}")
