"""Research and Discovery router for Project ECHO Engine 5."""
from __future__ import annotations

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.research_discovery_service import ResearchDiscoveryService

router = APIRouter(prefix="/api/research", tags=["Research & Discovery"])


class ResearchDiscoverRequest(BaseModel):
    research_question: str = Field(..., description="Open research question or investigative inquiry")
    target_domains: Optional[List[str]] = Field(default=None, description="Specific domains to bridge (e.g., ['materials_science', 'bioengineering'])")
    use_ai_synthesis: bool = Field(default=True, description="Whether to employ configured AI providers for hypothesis formulation")


class HypothesisValidationRequest(BaseModel):
    new_status: str = Field(..., description="'testing', 'validated', or 'refuted'")
    validation_evidence: str = Field(..., description="Experimental findings or empirical verification proof")
    confidence_delta: float = Field(default=0.1, description="Adjustment to confidence score (-1.0 to 1.0)")


@router.post("/discover")
def trigger_research_discovery(
    req: ResearchDiscoverRequest,
    db: Session = Depends(get_db)
):
    """
    Autonomous Engine 5: Cross-Domain Discovery.
    Identifies knowledge gaps, discovers cross-domain analogical links,
    surfaces conflicting findings, and synthesizes testable research hypotheses.
    """
    if not req.research_question.strip():
        raise HTTPException(status_code=400, detail="Research question cannot be empty.")

    hypothesis = ResearchDiscoveryService.discover(
        db=db,
        research_question=req.research_question,
        target_domains=req.target_domains,
        use_ai_synthesis=req.use_ai_synthesis,
    )

    return {
        "success": True,
        "hypothesis": ResearchDiscoveryService.serialize_hypothesis(hypothesis)
    }


@router.get("/hypotheses")
def list_hypotheses(
    status: Optional[str] = Query(None, description="Filter by status: 'proposed', 'testing', 'validated', 'refuted'"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Retrieve tracked research hypotheses across all domains.
    """
    hypotheses = ResearchDiscoveryService.list_hypotheses(db=db, status=status, limit=limit)
    return {
        "total": len(hypotheses),
        "hypotheses": [ResearchDiscoveryService.serialize_hypothesis(h) for h in hypotheses]
    }


@router.post("/hypotheses/{hypothesis_id}/validate")
def validate_hypothesis(
    hypothesis_id: str,
    req: HypothesisValidationRequest,
    db: Session = Depends(get_db)
):
    """
    Update hypothesis validation state with empirical evidence.
    If validated, auto-promotes the discovery into Global Knowledge.
    """
    updated = ResearchDiscoveryService.update_validation(
        db=db,
        hypothesis_id=hypothesis_id,
        new_status=req.new_status,
        validation_evidence=req.validation_evidence,
        confidence_delta=req.confidence_delta,
    )

    if not updated:
        raise HTTPException(status_code=404, detail="Hypothesis not found.")

    return {
        "success": True,
        "message": f"Hypothesis updated to '{updated.status}'",
        "hypothesis": ResearchDiscoveryService.serialize_hypothesis(updated)
    }
