import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import ALLOWED_MEDIA_EXTENSIONS, sanitize_filename, validate_upload
from app.database.session import get_db
from app.models.entities import (
    ActivityLog,
    Expert,
    ExpertConsent,
    KnowledgeUnit,
    SourceMedia,
    VerificationHistory,
)
from app.services.studio_service import INTERVIEW_STAGES, StudioService

router = APIRouter(prefix="/studio", tags=["Expert Intelligence Creation Studio"])


class KnowledgeUnitCreateReq(BaseModel):
    expert_id: int
    title: str
    description: str
    category: str = "experience"
    topic: str = "Engineering & Decision Making"
    problem_or_situation: Optional[str] = None
    context_and_experience: Optional[str] = None
    reasoning_and_method: Optional[str] = None
    decisions_and_alternatives: Optional[str] = None
    failures_and_lessons: Optional[str] = None
    source_reference: Optional[str] = None
    source_location_or_timestamp: Optional[str] = None
    verification_status: str = "awaiting_expert_review"
    access_permissions: str = "public"
    capture_channel: str = "manual"
    expert_notes: Optional[str] = None


class KnowledgeUnitUpdateReq(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    topic: Optional[str] = None
    problem_or_situation: Optional[str] = None
    context_and_experience: Optional[str] = None
    reasoning_and_method: Optional[str] = None
    decisions_and_alternatives: Optional[str] = None
    failures_and_lessons: Optional[str] = None
    source_location_or_timestamp: Optional[str] = None
    verification_status: Optional[str] = None
    access_permissions: Optional[str] = None
    expert_notes: Optional[str] = None
    reviewer_name: Optional[str] = None
    review_notes: Optional[str] = None


class VerifyUnitReq(BaseModel):
    verification_status: str
    reviewer_name: str = "Domain Expert"
    notes: Optional[str] = None


class InterviewTurnReq(BaseModel):
    expert_id: int
    topic: str
    qa_turns: List[Dict[str, str]] = []


class DemonstrationCaptureReq(BaseModel):
    expert_id: int
    title: str
    topic: str
    scenario: str
    steps_walkthrough: str
    tools_and_parameters: Optional[str] = None
    common_mistakes_and_lessons: Optional[str] = None
    timestamp_notes: Optional[str] = "00:00 - Live Walkthrough"
    access_permissions: str = "public"


class ConsentUpdateReq(BaseModel):
    consent_knowledge: Optional[bool] = None
    consent_voice: Optional[bool] = None
    consent_likeness: Optional[bool] = None
    disclosure_acknowledged: Optional[bool] = None
    status: Optional[str] = None  # active, suspended, revoked, deletion_requested
    notes: Optional[str] = None
    signed_by: Optional[str] = None


@router.get("/knowledge-units")
def list_knowledge_units(
    expert_id: Optional[int] = None,
    category: Optional[str] = None,
    topic: Optional[str] = None,
    verification_status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return StudioService.list_knowledge_units(
        db, expert_id=expert_id, category=category, topic=topic,
        verification_status=verification_status, search=search,
    )


@router.post("/knowledge-units")
def create_knowledge_unit(req: KnowledgeUnitCreateReq, db: Session = Depends(get_db)):
    try:
        return StudioService.create_manual_unit(db, req.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/knowledge-units/{unit_id}")
def update_knowledge_unit(unit_id: int, req: KnowledgeUnitUpdateReq, db: Session = Depends(get_db)):
    try:
        return StudioService.update_unit(db, unit_id, req.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.put("/knowledge-units/{unit_id}/verify")
def verify_knowledge_unit(unit_id: int, req: VerifyUnitReq, db: Session = Depends(get_db)):
    try:
        return StudioService.verify_unit(
            db, unit_id, req.verification_status, req.reviewer_name, req.notes
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/knowledge-units/{unit_id}/history")
def get_unit_verification_history(unit_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(VerificationHistory)
        .filter(VerificationHistory.knowledge_unit_id == unit_id)
        .order_by(VerificationHistory.created_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "previous_status": r.previous_status,
            "new_status": r.new_status,
            "reviewer_name": r.reviewer_name,
            "reviewer_role": r.reviewer_role,
            "notes": r.notes,
            "created_at": r.created_at,
        }
        for r in rows
    ]


@router.get("/media")
def list_source_media(expert_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(SourceMedia)
    if expert_id:
        q = q.filter(SourceMedia.expert_id == expert_id)
    rows = q.order_by(SourceMedia.created_at.desc()).all()
    return [
        {
            "id": m.id,
            "expert_id": m.expert_id,
            "expert_name": m.expert.name if m.expert else "Unknown",
            "media_type": m.media_type,
            "title": m.title,
            "filename": m.filename,
            "file_size": m.file_size,
            "duration_seconds": m.duration_seconds,
            "transcript": m.transcript,
            "status": m.status,
            "is_synthetic_demo": m.is_synthetic_demo,
            "created_at": m.created_at,
        }
        for m in rows
    ]


@router.post("/capture/media")
async def capture_voice_or_video_recording(
    expert_id: int = Form(...),
    media_kind: str = Form("audio"),  # audio | video
    title: str = Form(...),
    transcript: str = Form(""),
    duration_seconds: float = Form(0.0),
    timestamp_notes: str = Form("00:00 - Full Recording"),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    """
    Preserves voice or video recordings + transcript, extracts structured Knowledge Units
    marked as 'ai_extracted' (awaiting expert verification).
    """
    expert = db.query(Expert).filter(Expert.id == expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found.")

    file_path = None
    filename = None
    file_size = 0
    mime_type = None
    if file is not None:
        raw = await file.read()
        filename = sanitize_filename(file.filename or f"recording.{ 'webm' if media_kind == 'video' else 'wav' }")
        validate_upload(filename, len(raw), ALLOWED_MEDIA_EXTENSIONS)
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        file_path = os.path.join(settings.UPLOAD_DIR, f"{expert.id}_{media_kind}_{filename}")
        with open(file_path, "wb") as f:
            f.write(raw)
        file_size = len(raw)
        mime_type = file.content_type

    clean_transcript = (transcript or "").strip()
    if not clean_transcript and file is None:
        raise HTTPException(status_code=400, detail="Provide an audio/video recording file or spoken transcript.")

    media = SourceMedia(
        expert_id=expert.id,
        media_type=media_kind if media_kind in ("audio", "video") else "audio",
        title=title,
        filename=filename or f"{media_kind}_capture.txt",
        storage_path=file_path,
        mime_type=mime_type,
        file_size=file_size,
        duration_seconds=duration_seconds or None,
        transcript=clean_transcript or f"[Media file preserved: {filename}; manual/ASR transcript pending]",
        metadata_json=json.dumps({"timestamp_notes": timestamp_notes}),
        status="extracted" if clean_transcript else "captured",
        is_synthetic_demo=False,
    )
    db.add(media)
    db.flush()

    created_units = []
    ai_provider_used = None
    if clean_transcript:
        units, ai_provider_used = StudioService.extract_units_with_ai_or_heuristic(
            clean_transcript, expert.name, title
        )
        for u in units:
            ku = KnowledgeUnit(
                expert_id=expert.id,
                source_media_id=media.id,
                title=u["title"],
                description=u["description"],
                category=u["category"],
                topic=u["topic"],
                problem_or_situation=u.get("problem_or_situation"),
                context_and_experience=u.get("context_and_experience"),
                reasoning_and_method=u.get("reasoning_and_method"),
                decisions_and_alternatives=u.get("decisions_and_alternatives"),
                failures_and_lessons=u.get("failures_and_lessons"),
                source_reference=f"{media_kind.upper()} Recording: {title}",
                source_location_or_timestamp=timestamp_notes or u.get("source_location_or_timestamp"),
                verification_status="ai_extracted",
                access_permissions="public",
                confidence_score=u.get("confidence_score", 0.85),
                is_synthetic_demo=False,
            )
            db.add(ku)
            db.flush()
            db.add(VerificationHistory(
                knowledge_unit_id=ku.id,
                previous_status=None,
                new_status="ai_extracted",
                reviewer_name=ai_provider_used or "ECHO Media Extraction",
                reviewer_role="system",
                notes=f"Extracted from {media_kind} capture '{title}' ({timestamp_notes}).",
            ))
            created_units.append(StudioService.serialize_unit(ku))

    db.add(ActivityLog(
        action_type="media_captured",
        entity_type="SourceMedia",
        entity_id=media.id,
        description=f"Captured {media_kind.upper()} source '{title}' for {expert.name} ({len(created_units)} units extracted).",
    ))
    db.commit()

    return {
        "source_media_id": media.id,
        "status": media.status,
        "ai_extractor": ai_provider_used or "deterministic_parser",
        "extracted_units_count": len(created_units),
        "knowledge_units": created_units,
    }


@router.post("/capture/interview/step")
def interview_step(req: InterviewTurnReq, db: Session = Depends(get_db)):
    expert = db.query(Expert).filter(Expert.id == req.expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found.")
    return StudioService.generate_interview_followup(expert, req.topic, req.qa_turns)


@router.post("/capture/interview/finalize")
def interview_finalize(req: InterviewTurnReq, db: Session = Depends(get_db)):
    expert = db.query(Expert).filter(Expert.id == req.expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found.")
    if not req.qa_turns:
        raise HTTPException(status_code=400, detail="Interview has no recorded Q&A turns.")

    transcript = "\n\n".join(
        f"[Stage {i+1}] Q: {t.get('question','')}\nA: {t.get('answer','')}"
        for i, t in enumerate(req.qa_turns)
    )

    media = SourceMedia(
        expert_id=expert.id,
        media_type="interview",
        title=f"AI-Guided Interview: {req.topic}",
        transcript=transcript,
        status="extracted",
        is_synthetic_demo=False,
    )
    db.add(media)
    db.flush()

    units, ai_used = StudioService.extract_units_with_ai_or_heuristic(
        transcript, expert.name, f"AI-Guided Interview: {req.topic}"
    )
    if not units:
        units = [{
            "title": f"Interview Insights: {req.topic}",
            "description": req.qa_turns[0].get("answer", "")[:300],
            "category": "experience",
            "topic": req.topic,
            "problem_or_situation": req.qa_turns[0].get("answer") if len(req.qa_turns) > 0 else None,
            "context_and_experience": req.qa_turns[1].get("answer") if len(req.qa_turns) > 1 else transcript,
            "reasoning_and_method": req.qa_turns[2].get("answer") if len(req.qa_turns) > 2 else None,
            "failures_and_lessons": req.qa_turns[3].get("answer") if len(req.qa_turns) > 3 else None,
            "source_location_or_timestamp": f"Interview Turns 1-{len(req.qa_turns)}",
        }]

    created = []
    for u in units:
        ku = KnowledgeUnit(
            expert_id=expert.id,
            source_media_id=media.id,
            title=u["title"],
            description=u["description"],
            category=u["category"],
            topic=u.get("topic") or req.topic,
            problem_or_situation=u.get("problem_or_situation"),
            context_and_experience=u.get("context_and_experience"),
            reasoning_and_method=u.get("reasoning_and_method"),
            decisions_and_alternatives=u.get("decisions_and_alternatives"),
            failures_and_lessons=u.get("failures_and_lessons"),
            source_reference=f"AI-Guided Interview: {req.topic}",
            source_location_or_timestamp=u.get("source_location_or_timestamp") or f"Turns 1-{len(req.qa_turns)}",
            verification_status="awaiting_expert_review",
            access_permissions="public",
            confidence_score=0.90,
            is_synthetic_demo=False,
        )
        db.add(ku)
        db.flush()
        db.add(VerificationHistory(
            knowledge_unit_id=ku.id,
            previous_status=None,
            new_status="awaiting_expert_review",
            reviewer_name=ai_used or "ECHO Interview Engine",
            reviewer_role="system",
            notes="Synthesized from AI-guided interview; awaiting expert review.",
        ))
        created.append(StudioService.serialize_unit(ku))

    db.add(ActivityLog(
        action_type="interview_completed",
        entity_type="SourceMedia",
        entity_id=media.id,
        description=f"Completed AI-guided interview '{req.topic}' with {expert.name}; created {len(created)} Knowledge Units awaiting review.",
    ))
    db.commit()
    return {"source_media_id": media.id, "knowledge_units": created}


@router.post("/capture/demonstration")
def capture_practical_demonstration(req: DemonstrationCaptureReq, db: Session = Depends(get_db)):
    expert = db.query(Expert).filter(Expert.id == req.expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found.")

    transcript = (
        f"PRACTICAL DEMONSTRATION: {req.title}\n"
        f"Scenario: {req.scenario}\n"
        f"Procedure & Walkthrough:\n{req.steps_walkthrough}\n"
        f"Tools & Parameters: {req.tools_and_parameters or 'N/A'}\n"
        f"Failure Modes & Safety Lessons: {req.common_mistakes_and_lessons or 'N/A'}"
    )
    media = SourceMedia(
        expert_id=expert.id,
        media_type="demonstration",
        title=req.title,
        transcript=transcript,
        status="extracted",
        is_synthetic_demo=False,
    )
    db.add(media)
    db.flush()

    ku = KnowledgeUnit(
        expert_id=expert.id,
        source_media_id=media.id,
        title=req.title,
        description=req.scenario,
        category="method_procedure",
        topic=req.topic,
        problem_or_situation=req.scenario,
        context_and_experience=req.tools_and_parameters,
        reasoning_and_method=req.steps_walkthrough,
        failures_and_lessons=req.common_mistakes_and_lessons,
        source_reference=f"Practical Demonstration: {req.title}",
        source_location_or_timestamp=req.timestamp_notes or "Demonstration Walkthrough",
        verification_status="awaiting_expert_review",
        access_permissions=req.access_permissions,
        confidence_score=0.91,
        is_synthetic_demo=False,
    )
    db.add(ku)
    db.flush()
    db.add(VerificationHistory(
        knowledge_unit_id=ku.id,
        previous_status=None,
        new_status="awaiting_expert_review",
        reviewer_name="ECHO Demonstration Studio",
        reviewer_role="system",
        notes="Practical demonstration captured; awaiting expert review.",
    ))
    db.commit()
    db.refresh(ku)
    return {"source_media_id": media.id, "knowledge_unit": StudioService.serialize_unit(ku)}


@router.get("/experts/{expert_id}/consent")
def get_expert_consent(expert_id: int, db: Session = Depends(get_db)):
    expert = db.query(Expert).filter(Expert.id == expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found.")
    consent = StudioService.get_or_create_consent(db, expert)
    return {
        "expert_id": expert.id,
        "expert_name": expert.name,
        "consent_knowledge": consent.consent_knowledge,
        "consent_voice": consent.consent_voice,
        "consent_likeness": consent.consent_likeness,
        "disclosure_acknowledged": consent.disclosure_acknowledged,
        "status": consent.status,
        "consent_text": consent.consent_text,
        "signed_by": consent.signed_by,
        "signed_at": consent.signed_at,
        "revoked_at": consent.revoked_at,
        "notes": consent.notes,
    }


@router.put("/experts/{expert_id}/consent")
def update_expert_consent(expert_id: int, req: ConsentUpdateReq, db: Session = Depends(get_db)):
    expert = db.query(Expert).filter(Expert.id == expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found.")
    consent = StudioService.get_or_create_consent(db, expert)

    for field in ("consent_knowledge", "consent_voice", "consent_likeness", "disclosure_acknowledged", "notes", "signed_by"):
        val = getattr(req, field)
        if val is not None:
            setattr(consent, field, val)

    if req.status is not None:
        if req.status not in ("active", "suspended", "revoked", "deletion_requested"):
            raise HTTPException(status_code=400, detail="Invalid consent status.")
        consent.status = req.status
        if req.status in ("revoked", "deletion_requested"):
            consent.revoked_at = datetime.utcnow()
            consent.consent_knowledge = False
            consent.consent_voice = False
            consent.consent_likeness = False
        elif req.status == "active":
            consent.revoked_at = None

    db.add(ActivityLog(
        action_type="consent_updated",
        entity_type="ExpertConsent",
        entity_id=consent.id,
        description=f"Consent updated for {expert.name}: status={consent.status}, voice={consent.consent_voice}, likeness={consent.consent_likeness}.",
    ))
    db.commit()
    db.refresh(consent)
    return get_expert_consent(expert_id, db)
