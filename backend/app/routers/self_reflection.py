import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.common import SelfReflectionCreate, SelfReflectionOut
from app.services.self_reflection_service import SelfReflectionService

router = APIRouter(prefix="/reflection", tags=["Self-Reflection Laboratory"])

@router.get("", response_model=List[SelfReflectionOut])
def list_reflections(db: Session = Depends(get_db)):
    records = SelfReflectionService.list_reflections(db)
    if not records:
        SelfReflectionService.seed_samples(db)
        records = SelfReflectionService.list_reflections(db)

    results = []
    for r in records:
        try:
            evs = json.loads(r.evidence_sources) if r.evidence_sources else []
        except Exception:
            evs = []
        try:
            lims = json.loads(r.identified_limitations) if r.identified_limitations else []
        except Exception:
            lims = []
        try:
            crit = json.loads(r.evaluation_criteria) if r.evaluation_criteria else {}
        except Exception:
            crit = {}

        results.append(SelfReflectionOut(
            id=r.id,
            user_request=r.user_request,
            echo_response=r.echo_response,
            evidence_sources=evs,
            accuracy_score=r.accuracy_score,
            evidence_grounding_score=r.evidence_grounding_score,
            epistemic_honesty_score=r.epistemic_honesty_score,
            latency_ms=r.latency_ms,
            identified_limitations=lims,
            uncertainty_level=r.uncertainty_level,
            suggested_improvements=r.suggested_improvements,
            evaluation_criteria=crit,
            test_status=r.test_status,
            created_at=r.created_at
        ))
    return results

@router.post("/evaluate", response_model=SelfReflectionOut)
def evaluate_interaction(req: SelfReflectionCreate, db: Session = Depends(get_db)):
    r = SelfReflectionService.evaluate_interaction(
        db,
        user_request=req.user_request,
        echo_response=req.echo_response,
        evidence_sources=req.evidence_sources
    )

    try:
        evs = json.loads(r.evidence_sources) if r.evidence_sources else []
    except Exception:
        evs = []
    try:
        lims = json.loads(r.identified_limitations) if r.identified_limitations else []
    except Exception:
        lims = []
    try:
        crit = json.loads(r.evaluation_criteria) if r.evaluation_criteria else {}
    except Exception:
        crit = {}

    return SelfReflectionOut(
        id=r.id,
        user_request=r.user_request,
        echo_response=r.echo_response,
        evidence_sources=evs,
        accuracy_score=r.accuracy_score,
        evidence_grounding_score=r.evidence_grounding_score,
        epistemic_honesty_score=r.epistemic_honesty_score,
        latency_ms=r.latency_ms,
        identified_limitations=lims,
        uncertainty_level=r.uncertainty_level,
        suggested_improvements=r.suggested_improvements,
        evaluation_criteria=crit,
        test_status=r.test_status,
        created_at=r.created_at
    )

@router.get("/audit")
def run_self_audit(db: Session = Depends(get_db)):
    """
    Returns aggregate metacognitive audit telemetry across historical interactions.
    """
    return SelfReflectionService.run_self_audit(db)
