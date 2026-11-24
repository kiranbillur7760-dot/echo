import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.common import SelfEvolutionProposalCreate, SelfEvolutionProposalOut
from app.services.self_evolution_service import SelfEvolutionService

router = APIRouter(prefix="/self-evolution", tags=["Controlled Self-Evolution"])

@router.get("/proposals", response_model=List[SelfEvolutionProposalOut])
def list_proposals(db: Session = Depends(get_db)):
    proposals = SelfEvolutionService.list_proposals(db)
    results = []
    for p in proposals:
        try:
            base = json.loads(p.baseline_benchmark) if p.baseline_benchmark else {}
        except Exception:
            base = {}
        try:
            proj = json.loads(p.projected_benchmark) if p.projected_benchmark else {}
        except Exception:
            proj = {}

        results.append(SelfEvolutionProposalOut(
            id=p.id,
            title=p.title,
            subsystem=p.subsystem,
            identified_weakness=p.identified_weakness,
            evidence_rationale=p.evidence_rationale,
            proposed_change=p.proposed_change,
            baseline_benchmark=base,
            projected_benchmark=proj,
            test_suite_description=p.test_suite_description,
            status=p.status,
            reviewed_by=p.reviewed_by,
            review_notes=p.review_notes,
            applied_at=p.applied_at,
            created_at=p.created_at
        ))
    return results

@router.post("/proposals", response_model=SelfEvolutionProposalOut)
def create_proposal(req: SelfEvolutionProposalCreate, db: Session = Depends(get_db)):
    p = SelfEvolutionService.create_proposal(
        db,
        title=req.title,
        subsystem=req.subsystem,
        identified_weakness=req.identified_weakness,
        evidence_rationale=req.evidence_rationale,
        proposed_change=req.proposed_change,
        baseline_benchmark=req.baseline_benchmark,
        projected_benchmark=req.projected_benchmark,
        test_suite_description=req.test_suite_description
    )

    try:
        base = json.loads(p.baseline_benchmark) if p.baseline_benchmark else {}
    except Exception:
        base = {}
    try:
        proj = json.loads(p.projected_benchmark) if p.projected_benchmark else {}
    except Exception:
        proj = {}

    return SelfEvolutionProposalOut(
        id=p.id,
        title=p.title,
        subsystem=p.subsystem,
        identified_weakness=p.identified_weakness,
        evidence_rationale=p.evidence_rationale,
        proposed_change=p.proposed_change,
        baseline_benchmark=base,
        projected_benchmark=proj,
        test_suite_description=p.test_suite_description,
        status=p.status,
        reviewed_by=p.reviewed_by,
        review_notes=p.review_notes,
        applied_at=p.applied_at,
        created_at=p.created_at
    )

@router.post("/proposals/{proposal_id}/review", response_model=SelfEvolutionProposalOut)
def review_proposal(
    proposal_id: int,
    approved: bool = Body(...),
    reviewer_name: str = Body("Human Lead Architect"),
    review_notes: str = Body("Approved following evaluation of baseline vs projected metrics."),
    db: Session = Depends(get_db)
):
    try:
        p = SelfEvolutionService.review_proposal(
            db,
            proposal_id=proposal_id,
            approved=approved,
            reviewer_name=reviewer_name,
            review_notes=review_notes
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    try:
        base = json.loads(p.baseline_benchmark) if p.baseline_benchmark else {}
    except Exception:
        base = {}
    try:
        proj = json.loads(p.projected_benchmark) if p.projected_benchmark else {}
    except Exception:
        proj = {}

    return SelfEvolutionProposalOut(
        id=p.id,
        title=p.title,
        subsystem=p.subsystem,
        identified_weakness=p.identified_weakness,
        evidence_rationale=p.evidence_rationale,
        proposed_change=p.proposed_change,
        baseline_benchmark=base,
        projected_benchmark=proj,
        test_suite_description=p.test_suite_description,
        status=p.status,
        reviewed_by=p.reviewed_by,
        review_notes=p.review_notes,
        applied_at=p.applied_at,
        created_at=p.created_at
    )
