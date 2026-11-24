import os
import shutil
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.session import get_db
from app.models.entities import Document, Expert, KnowledgeRecord, ActivityLog
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
    db: Session = Depends(get_db)
):
    expert = db.query(Expert).filter(Expert.id == expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found.")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    clean_filename = f"{expert_id}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, clean_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)
    file_ext = file.filename.split(".")[-1].lower() if "." in file.filename else "txt"

    # Extract text using PyMuPDF / docx
    try:
        extracted_text = DocumentService.extract_text_from_file(file_path, file_ext)
        analysis = DocumentService.analyze_and_extract_entities(extracted_text, expert.name)
        status = "extracted"
    except Exception as e:
        extracted_text = f"Text extraction error: {str(e)}"
        analysis = {"candidate_records": []}
        status = "failed"

    doc = Document(
        expert_id=expert.id,
        title=title or file.filename,
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        file_type=file_ext,
        processing_status=status,
        extracted_text=extracted_text,
        metadata_json=json.dumps(analysis),
        is_synthetic_demo=False
    )
    db.add(doc)
    db.flush()

    # Automatically generate extracted candidate knowledge records if successful
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
                verification_status="verified",
                confidence_score=cand.get("confidence_score", 0.92),
                is_synthetic_demo=False
            )
            db.add(kr)
            created_records.append(kr)

    log = ActivityLog(
        action_type="document_processed",
        entity_type="Document",
        entity_id=doc.id,
        description=f"Processed and indexed '{doc.title}' ({file_ext.upper()}) for {expert.name}."
    )
    db.add(log)

    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "title": doc.title,
        "filename": doc.filename,
        "file_type": doc.file_type,
        "processing_status": doc.processing_status,
        "extracted_character_count": len(extracted_text),
        "candidate_records_count": len(created_records),
        "created_at": doc.created_at
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
