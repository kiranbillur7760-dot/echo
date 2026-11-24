import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import KnowledgeRecord, Experience, Lesson, Expert, ActivityLog
from app.schemas.common import KnowledgeRecordOut, KnowledgeRecordCreate, ExperienceOut, LessonOut

router = APIRouter(prefix="/knowledge", tags=["Knowledge Intelligence"])

@router.get("/records", response_model=List[KnowledgeRecordOut])
def list_knowledge_records(
    expert_id: Optional[int] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(KnowledgeRecord)
    if expert_id:
        query = query.filter(KnowledgeRecord.expert_id == expert_id)
    if category and category != "all":
        query = query.filter(KnowledgeRecord.category == category)
    if search:
        query = query.filter(
            KnowledgeRecord.title.ilike(f"%{search}%") | 
            KnowledgeRecord.content.ilike(f"%{search}%")
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
            created_at=r.created_at
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
        created_at=r.created_at
    )

@router.post("/records", response_model=KnowledgeRecordOut)
def create_knowledge_record(rec_in: KnowledgeRecordCreate, db: Session = Depends(get_db)):
    expert = db.query(Expert).filter(Expert.id == rec_in.expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found.")

    r = KnowledgeRecord(
        expert_id=rec_in.expert_id,
        project_id=rec_in.project_id,
        document_id=rec_in.document_id,
        title=rec_in.title,
        category=rec_in.category,
        content=rec_in.content,
        key_takeaways=json.dumps(rec_in.key_takeaways or []),
        source_reference=rec_in.source_reference or "Manual Expert Submission",
        verification_status=rec_in.verification_status or "verified",
        confidence_score=rec_in.confidence_score or 0.95,
        is_synthetic_demo=rec_in.is_synthetic_demo or False
    )
    db.add(r)
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
        created_at=r.created_at
    )

@router.post("/interview", response_model=KnowledgeRecordOut)
def capture_interview_knowledge(
    expert_id: int = Query(1),
    topic: str = Query(...),
    challenge_context: str = Query(...),
    heuristic_solution: str = Query(...),
    textbook_pitfall: str = Query(...),
    key_takeaway: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Synthesizes an expert debrief interview into a structured, provenance-grounded KnowledgeRecord.
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
        f"Heuristic validated by {expert.name}",
        f"Avoid standard trap: {textbook_pitfall[:80]}..."
    ]

    record = KnowledgeRecord(
        expert_id=expert.id,
        title=f"Expert Debrief: {topic}",
        category="heuristic",
        content=synthesized_content,
        key_takeaways=json.dumps(takeaways),
        source_reference=f"Structured Expert Interview with {expert.name}",
        verification_status="verified",
        confidence_score=0.97,
        is_synthetic_demo=False
    )
    db.add(record)
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
        created_at=record.created_at
    )

@router.put("/records/{record_id}/verify")
def update_verification_status(
    record_id: int,
    status: str = Query(..., pattern="^(verified|rejected|draft)$"),
    db: Session = Depends(get_db)
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
