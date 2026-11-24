import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import Decision, DecisionAlternative, Evidence, Outcome, Lesson, Expert, ActivityLog
from app.schemas.common import DecisionDNAOut, DecisionCreate, DecisionReplayRequest, DecisionReplayResponse
from app.services.decision_dna_service import DecisionDNAService

router = APIRouter(prefix="/decisions", tags=["Decision Intelligence"])

@router.post("/replay", response_model=DecisionReplayResponse)
def replay_decision_with_assumptions(request: DecisionReplayRequest, db: Session = Depends(get_db)):
    try:
        return DecisionDNAService.replay_decision(db, request)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("", response_model=List[DecisionDNAOut])
def list_decisions(expert_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Decision)
    if expert_id:
        query = query.filter(Decision.expert_id == expert_id)
    decisions = query.order_by(Decision.created_at.desc()).all()
    return [DecisionDNAService.format_decision_dna(d) for d in decisions]

@router.get("/{decision_id}", response_model=DecisionDNAOut)
def get_decision(decision_id: int, db: Session = Depends(get_db)):
    dec = db.query(Decision).filter(Decision.id == decision_id).first()
    if not dec:
        raise HTTPException(status_code=404, detail="Decision not found.")
    return DecisionDNAService.format_decision_dna(dec)

@router.get("/{decision_id}/dna")
def get_decision_dna(decision_id: int, db: Session = Depends(get_db)):
    dec = db.query(Decision).filter(Decision.id == decision_id).first()
    if not dec:
        raise HTTPException(status_code=404, detail="Decision not found.")
    return DecisionDNAService.format_decision_dna(dec)

@router.get("/{decision_id}/compare")
def compare_decision_alternatives(decision_id: int, db: Session = Depends(get_db)):
    dec = db.query(Decision).filter(Decision.id == decision_id).first()
    if not dec:
        raise HTTPException(status_code=404, detail="Decision not found.")
    return DecisionDNAService.compare_alternatives(dec)

@router.post("", response_model=DecisionDNAOut)
def create_decision(dec_in: DecisionCreate, db: Session = Depends(get_db)):
    expert = db.query(Expert).filter(Expert.id == dec_in.expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found.")

    dec = Decision(
        expert_id=dec_in.expert_id,
        project_id=dec_in.project_id,
        title=dec_in.title,
        problem_definition=dec_in.problem_definition,
        context=dec_in.context,
        constraints=json.dumps(dec_in.constraints),
        reasoning=dec_in.reasoning,
        selected_decision=dec_in.selected_decision,
        outcome=dec_in.outcome,
        lessons_learned=dec_in.lessons_learned,
        confidence_rating=dec_in.confidence_rating or 0.92,
        status="verified",
        is_synthetic_demo=False
    )
    db.add(dec)
    db.flush()

    if dec_in.alternatives:
        for alt in dec_in.alternatives:
            da = DecisionAlternative(
                decision_id=dec.id,
                title=alt.title,
                description=alt.description,
                pros=json.dumps(alt.pros),
                cons=json.dumps(alt.cons),
                why_rejected=alt.why_rejected,
                estimated_risk=alt.estimated_risk
            )
            db.add(da)

    if dec_in.evidence_items:
        for ev in dec_in.evidence_items:
            evi = Evidence(
                decision_id=dec.id,
                title=ev.title,
                evidence_type=ev.evidence_type,
                content=ev.content,
                source_url_or_ref=ev.source_url_or_ref,
                reliability_score=ev.reliability_score
            )
            db.add(evi)

    if dec_in.outcomes:
        for out in dec_in.outcomes:
            oc = Outcome(
                decision_id=dec.id,
                metric_name=out.metric_name,
                expected_value=out.expected_value,
                actual_value=out.actual_value,
                impact_summary=out.impact_summary,
                time_horizon=out.time_horizon,
                validation_method=out.validation_method
            )
            db.add(oc)

    log = ActivityLog(
        action_type="decision_reconstructed",
        entity_type="Decision",
        entity_id=dec.id,
        description=f"Reconstructed Decision DNA: '{dec.title}' by {expert.name}."
    )
    db.add(log)

    db.commit()
    db.refresh(dec)
    return DecisionDNAService.format_decision_dna(dec)
