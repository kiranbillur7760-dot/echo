from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.common import (
    EchoMirrorStateResponse, EchoMirrorQueryRequest, EchoMirrorQueryResponse
)
from app.services.echo_mirror_service import EchoMirrorService

router = APIRouter(prefix="/mirror", tags=["ECHO Mirror (Artificial Self-Understanding)"])

@router.get("/state", response_model=EchoMirrorStateResponse)
def get_mirror_state(db: Session = Depends(get_db)):
    """
    Returns the evidence-backed model of ECHO's identity, software architecture,
    internal modules, capabilities, limitations, missing information, and runtime telemetry.
    """
    return EchoMirrorService.get_full_state(db)

@router.post("/query", response_model=EchoMirrorQueryResponse)
def query_mirror_self(req: EchoMirrorQueryRequest, db: Session = Depends(get_db)):
    """
    Grounded self-understanding query engine answering inquiries about identity,
    architecture, tools, capabilities, limitations, and supporting evidence.
    """
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    return EchoMirrorService.query_self(db, req.query)

@router.get("/modules")
def get_registered_modules(db: Session = Depends(get_db)):
    """
    Returns the real-time software module registry with endpoints and evidence grounding.
    """
    return EchoMirrorService.get_registered_modules(db)
