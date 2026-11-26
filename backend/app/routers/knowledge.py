import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import (
    KnowledgeRecord, Experience, Lesson, Expert, KnowledgeUnit, VerificationHistory, SourceMedia
)
from app.schemas.common import KnowledgeRecordOut, KnowledgeRecordCreate, ExperienceOut, LessonOut

router = APIRouter(prefix="/knowledge", tags=["Knowledge Intelligence"])


@router.get("/records", response_model=List[KnowledgeRecordOut])
def list_knowledge_records(
    expert_id: Optional[int] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(KnowledgeRecord)
    if expert_id:
        query = query.filter(KnowledgeRecord.expert_id == expert_id)
    if category and category != "all":
        query = query.filter(KnowledgeRecord.category == category)
    if search:
        query = query.filter(
            KnowledgeRecord.title.ilike(f"%{search}%")
            | KnowledgeRecord.content.ilike(f"%{search}%")
        )

    records = query.order_by(KnowledgeRecord.created_at.desc()).all()
    results = []
    for r in records:
        try:
            takeaways = json.loads(r.key_takeaways) if r.key_takeaways else []
        except Exception:
            takeaways = [r.key_takeaways] if r.key_takeaways else []

        results.append(KnowledgeRecordOut(
            id=r.id,
            expert_id=r.expert_id,
            project_id=r.project_id,
            document_id=r.document_id,
            title=r.title,
            category=r.category,
            content=r.content,
            key_takeaways=takeaways,
            source_reference=r.source_reference,
            verification_status=r.verification_status,
            confidence_score=r.confidence_score,
            is_synthetic_demo=r.is_synthetic_demo,
            created_at=r.created_at,
        ))
    return results


@router.get("/records/{record_id}", response_model=KnowledgeRecordOut)
def get_knowledge_record(record_id: int, db: Session = Depends(get_db)):
    r = db.query(KnowledgeRecord).filter(KnowledgeRecord.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Knowledge record not found.")

    try:
        takeaways = json.loads(r.key_takeaways) if r.key_takeaways else []
    except Exception:
        takeaways = [r.key_takeaways] if r.key_takeaways else []

    return KnowledgeRecordOut(
        id=r.id,
        expert_id=r.expert_id,
        project_id=r.project_id,
        document_id=r.document_id,
        title=r.title,
        category=r.category,
        content=r.content,
        key_takeaways=takeaways,
        source_reference=r.source_reference,
        verification_status=r.verification_status,
        confidence_score=r.confidence_score,
        is_synthetic_demo=r.is_synthetic_demo,
        created_at=r.created_at,
    )


@router.post("/records", response_model=KnowledgeRecordOut)
def create_knowledge_record(rec_in: KnowledgeRecordCreate, db: Session = Depends(get_db)):
    expert = db.query(Expert).filter(Expert.id == rec_in.expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found.")

    status_val = rec_in.verification_status or "awaiting_expert_review"
    r = KnowledgeRecord(
        expert_id=rec_in.expert_id,
        project_id=rec_in.project_id,
        document_id=rec_in.document_id,
        title=rec_in.title,
        category=rec_in.category,
        content=rec_in.content,
        key_takeaways=json.dumps(rec_in.key_takeaways or []),
        source_reference=rec_in.source_reference or "Manual Expert Submission",
        verification_status=status_val,
        confidence_score=rec_in.confidence_score or 0.95,
        is_synthetic_demo=rec_in.is_synthetic_demo or False,
    )
    db.add(r)
    db.flush()

    # Mirror into structured KnowledgeUnit so Studio and Retrieval share one unified knowledge graph
    ku_status = "approved_by_expert" if status_val in ("verified", "approved_by_expert") else "awaiting_expert_review"
    ku = KnowledgeUnit(
        expert_id=expert.id,
        document_id=rec_in.document_id,
        title=rec_in.title,
        description=rec_in.content[:320],
        category=rec_in.category,
        topic=expert.domain,
        context_and_experience=rec_in.content,
        source_reference=r.source_reference,
        source_location_or_timestamp="Manual Entry",
        verification_status=ku_status,
        confidence_score=r.confidence_score,
        is_synthetic_demo=r.is_synthetic_demo,
    )
    db.add(ku)
    db.commit()
    db.refresh(r)

    try:
        takeaways = json.loads(r.key_takeaways) if r.key_takeaways else []
    except Exception:
        takeaways = []

    return KnowledgeRecordOut(
        id=r.id,
        expert_id=r.expert_id,
        project_id=r.project_id,
        document_id=r.document_id,
        title=r.title,
        category=r.category,
        content=r.content,
        key_takeaways=takeaways,
        source_reference=r.source_reference,
        verification_status=r.verification_status,
        confidence_score=r.confidence_score,
        is_synthetic_demo=r.is_synthetic_demo,
        created_at=r.created_at,
    )


@router.post("/interview", response_model=KnowledgeRecordOut)
def capture_interview_knowledge(
    expert_id: int = Query(1),
    topic: str = Query(...),
    challenge_context: str = Query(...),
    heuristic_solution: str = Query(...),
    textbook_pitfall: str = Query(...),
    key_takeaway: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    Synthesizes an expert debrief interview into a structured KnowledgeRecord and KnowledgeUnit
    placed in 'awaiting_expert_review' until explicitly approved by the expert.
    """
    expert = db.query(Expert).filter(Expert.id == expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found.")

    synthesized_content = (
        f"INTERVIEW RETROSPECTIVE — {topic.upper()}\n"
        f"Operational Challenge: {challenge_context}\n"
        f"Expert Heuristic: {heuristic_solution}\n"
        f"Conventional Trap / Anti-Pattern: {textbook_pitfall}"
    )

    takeaways = [
        key_takeaway,
        f"Captured during debrief with {expert.name}",
        f"Avoid standard trap: {textbook_pitfall[:80]}",
    ]

    media = SourceMedia(
        expert_id=expert.id,
        media_type="interview",
        title=f"Debrief Interview: {topic}",
        transcript=synthesized_content,
        status="extracted",
        is_synthetic_demo=False,
    )
    db.add(media)
    db.flush()

    record = KnowledgeRecord(
        expert_id=expert.id,
        title=f"Expert Debrief: {topic}",
        category="heuristic",
        content=synthesized_content,
        key_takeaways=json.dumps(takeaways),
        source_reference=f"Structured Expert Interview with {expert.name}",
        verification_status="awaiting_expert_review",
        confidence_score=0.92,
        is_synthetic_demo=False,
    )
    db.add(record)
    db.flush()

    ku = KnowledgeUnit(
        expert_id=expert.id,
        source_media_id=media.id,
        title=f"Expert Debrief: {topic}",
        description=key_takeaway,
        category="reasoning_decision",
        topic=topic,
        problem_or_situation=challenge_context,
        context_and_experience=synthesized_content,
        reasoning_and_method=heuristic_solution,
        failures_and_lessons=textbook_pitfall,
        source_reference=f"Debrief Interview ({expert.name})",
        source_location_or_timestamp="Structured Debrief Q1-Q4",
        verification_status="awaiting_expert_review",
        confidence_score=0.92,
        is_synthetic_demo=False,
    )
    db.add(ku)
    db.flush()
    db.add(VerificationHistory(
        knowledge_unit_id=ku.id,
        previous_status=None,
        new_status="awaiting_expert_review",
        reviewer_name="ECHO Studio Interview Capture",
        reviewer_role="system",
        notes="Interview synthesized; awaiting expert verification.",
    ))
    db.commit()
    db.refresh(record)

    return KnowledgeRecordOut(
        id=record.id,
        expert_id=record.expert_id,
        project_id=record.project_id,
        document_id=record.document_id,
        title=record.title,
        category=record.category,
        content=record.content,
        key_takeaways=takeaways,
        source_reference=record.source_reference,
        verification_status=record.verification_status,
        confidence_score=record.confidence_score,
        is_synthetic_demo=record.is_synthetic_demo,
        created_at=record.created_at,
    )


@router.put("/records/{record_id}/verify")
def update_verification_status(
    record_id: int,
    status: str = Query(..., pattern="^(verified|rejected|draft|ai_extracted|awaiting_expert_review|approved_by_expert|needs_correction)$"),
    db: Session = Depends(get_db),
):
    r = db.query(KnowledgeRecord).filter(KnowledgeRecord.id == record_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Knowledge record not found.")

    r.verification_status = status
    db.commit()
    return {"id": r.id, "title": r.title, "verification_status": r.verification_status}


@router.get("/experiences", response_model=List[ExperienceOut])
def list_experiences(expert_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Experience)
    if expert_id:
        q = q.filter(Experience.expert_id == expert_id)
    return q.all()


@router.get("/lessons", response_model=List[LessonOut])
def list_lessons(expert_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Lesson)
    if expert_id:
        q = q.filter(Lesson.expert_id == expert_id)
    return q.all()
