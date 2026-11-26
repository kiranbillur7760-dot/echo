import os
import shutil
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import ALLOWED_DOCUMENT_EXTENSIONS, sanitize_filename, validate_upload
from app.database.session import get_db
from app.models.entities import (
    Document, Expert, KnowledgeRecord, SourceMedia, KnowledgeUnit, VerificationHistory, ActivityLog
)
from app.schemas.common import DocumentOut
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["Knowledge Capture & Documents"])


@router.get("", response_model=List[DocumentOut])
def list_documents(db: Session = Depends(get_db)):
    return db.query(Document).order_by(Document.created_at.desc()).all()


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    expert_id: int = Form(...),
    title: str = Form(...),
    db: Session = Depends(get_db),
):
    expert = db.query(Expert).filter(Expert.id == expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found.")

    raw_bytes = await file.read()
    safe_name = sanitize_filename(file.filename or "document.txt")
    file_ext = validate_upload(safe_name, len(raw_bytes), ALLOWED_DOCUMENT_EXTENSIONS)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    clean_filename = f"{expert_id}_{safe_name}"
    file_path = os.path.join(settings.UPLOAD_DIR, clean_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(raw_bytes)

    file_size = len(raw_bytes)

    try:
        extracted_text, segments = DocumentService.extract_text_with_locations(file_path, file_ext)
        analysis = DocumentService.analyze_and_extract_entities(extracted_text, expert.name)
        extracted_units = DocumentService.extract_knowledge_units_from_text(
            extracted_text, expert.name, title or safe_name, segments
        )
        status = "extracted"
    except Exception as e:
        extracted_text = f"Text extraction error: {str(e)}"
        analysis = {"candidate_records": []}
        extracted_units = []
        status = "failed"

    doc = Document(
        expert_id=expert.id,
        title=title or safe_name,
        filename=safe_name,
        file_path=file_path,
        file_size=file_size,
        file_type=file_ext,
        processing_status=status,
        extracted_text=extracted_text,
        metadata_json=json.dumps(analysis),
        is_synthetic_demo=False,
    )
    db.add(doc)
    db.flush()

    media = SourceMedia(
        expert_id=expert.id,
        media_type=file_ext,
        title=title or safe_name,
        filename=safe_name,
        storage_path=file_path,
        mime_type=file.content_type or "application/octet-stream",
        file_size=file_size,
        transcript=extracted_text if status == "extracted" else None,
        metadata_json=json.dumps({"document_id": doc.id, "segments_count": len(extracted_units)}),
        status=status,
        is_synthetic_demo=False,
    )
    db.add(media)
    db.flush()

    # Never label AI-extracted records as expert-approved until the expert actually approves them.
    created_records = []
    if status == "extracted" and analysis.get("candidate_records"):
        for cand in analysis["candidate_records"]:
            kr = KnowledgeRecord(
                expert_id=expert.id,
                document_id=doc.id,
                title=cand["title"],
                category=cand["category"],
                content=cand["content"],
                key_takeaways=json.dumps(cand.get("key_takeaways", [])),
                source_reference=f"Extracted from {doc.filename}",
                verification_status="draft",
                confidence_score=cand.get("confidence_score", 0.86),
                is_synthetic_demo=False,
            )
            db.add(kr)
            created_records.append(kr)

    created_units = []
    for unit_data in extracted_units:
        ku = KnowledgeUnit(
            expert_id=expert.id,
            source_media_id=media.id,
            document_id=doc.id,
            title=unit_data["title"],
            description=unit_data["description"],
            category=unit_data["category"],
            topic=unit_data["topic"],
            problem_or_situation=unit_data.get("problem_or_situation"),
            context_and_experience=unit_data.get("context_and_experience"),
            reasoning_and_method=unit_data.get("reasoning_and_method"),
            decisions_and_alternatives=unit_data.get("decisions_and_alternatives"),
            failures_and_lessons=unit_data.get("failures_and_lessons"),
            source_reference=doc.filename,
            source_location_or_timestamp=unit_data.get("source_location_or_timestamp"),
            verification_status="ai_extracted",
            access_permissions="public",
            confidence_score=unit_data.get("confidence_score", 0.84),
            is_synthetic_demo=False,
        )
        db.add(ku)
        db.flush()
        db.add(VerificationHistory(
            knowledge_unit_id=ku.id,
            previous_status=None,
            new_status="ai_extracted",
            reviewer_name="ECHO Extraction Engine",
            reviewer_role="system",
            notes=f"Automatically extracted from {doc.filename} ({unit_data.get('source_location_or_timestamp')}); awaiting expert review.",
        ))
        created_units.append(ku)

    db.add(ActivityLog(
        action_type="document_processed",
        entity_type="Document",
        entity_id=doc.id,
        description=f"Processed '{doc.title}' ({file_ext.upper()}) for {expert.name}; extracted {len(created_units)} Knowledge Units (status: ai_extracted).",
    ))

    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "source_media_id": media.id,
        "title": doc.title,
        "filename": doc.filename,
        "file_type": doc.file_type,
        "processing_status": doc.processing_status,
        "extracted_character_count": len(extracted_text),
        "candidate_records_count": len(created_records),
        "knowledge_units_extracted": len(created_units),
        "verification_status": "ai_extracted",
        "created_at": doc.created_at,
    }


@router.post("/{document_id}/re-extract")
def re_extract_document(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=400, detail="Physical file missing from server storage.")

    extracted = DocumentService.extract_text_from_file(doc.file_path, doc.file_type)
    analysis = DocumentService.analyze_and_extract_entities(extracted, doc.expert.name if doc.expert else "")
    doc.extracted_text = extracted
    doc.metadata_json = json.dumps(analysis)
    doc.processing_status = "extracted"
    db.commit()
    return {"status": "success", "extracted_words": len(extracted.split())}
