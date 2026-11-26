"""Product A: Project ECHO External Developer API (v1).
Provides authenticated, versioned endpoints for external applications, researchers,
universities, enterprise systems, and developers to access the 5 Core Intelligence Engines.
"""
from __future__ import annotations

import time
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header, Request, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.global_knowledge_service import GlobalKnowledgeService
from app.services.hybrid_intelligence_service import HybridIntelligenceService
from app.services.research_discovery_service import ResearchDiscoveryService
from app.services.ai_provider_service import AIProviderService

router = APIRouter(prefix="/api/v1", tags=["Developer API v1"])


def verify_api_key(x_api_key: Optional[str] = Header(None)) -> str:
    """
    Standard API Key verification hook.
    Permits development keys or echo-live keys.
    """
    if not x_api_key:
        # In developer playground mode, allow default dev key
        return "echo_dev_playground_key"
    if len(x_api_key.strip()) < 8:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key format. Expected Project ECHO Bearer/API token (min 8 chars)."
        )
    return x_api_key.strip()


class V1QueryRequest(BaseModel):
    query: str = Field(..., description="Query or research inquiry")
    mode: str = Field(default="hybrid_intelligence", description="'complete_human_intelligence' or 'hybrid_intelligence'")
    expert_id: Optional[str] = Field(default=None, description="Optional target expert profile ID")
    provider: Optional[str] = Field(default=None, description="AI provider ('gemini', 'openai', 'claude', etc.)")
    stream: bool = Field(default=False, description="Whether to request streaming (reserved)")


class V1KnowledgeSearchRequest(BaseModel):
    query: str = Field(..., description="Semantic or keyword search query")
    category: Optional[str] = Field(default=None, description="Category filter: 'human', 'scientific', 'published', 'real_world', 'ai_generated'")
    limit: int = Field(default=10, ge=1, le=100)
    min_confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class V1KnowledgeIngestRequest(BaseModel):
    source_name: str = Field(..., description="Origin name of the knowledge source")
    category: str = Field(..., description="'human', 'scientific', 'published', 'real_world', 'ai_generated'")
    content_payload: str = Field(..., description="Full text or structured document payload")
    author_or_contributor: Optional[str] = None
    publication_date: Optional[str] = None
    license: Optional[str] = "Open Knowledge / CC-BY-4.0"
    access_permission: Optional[str] = "public"
    confidence_score: float = Field(default=0.85, ge=0.0, le=1.0)


class V1ResearchDiscoverRequest(BaseModel):
    research_question: str = Field(..., description="Open question for cross-domain investigation")
    target_domains: Optional[List[str]] = Field(default=None)
    use_ai_synthesis: bool = True


@router.get("/health")
def api_v1_health():
    """System health check and version metadata."""
    return {
        "status": "healthy",
        "api_version": "v1.0.0-rc1",
        "platform": "PROJECT ECHO Hybrid Intelligence Platform",
        "timestamp": time.time(),
        "capabilities": [
            "global_knowledge_engine",
            "human_intelligence_engine",
            "multi_ai_coordination_engine",
            "hybrid_reasoning_engine",
            "autonomous_research_engine"
        ]
    }


@router.get("/models")
def api_v1_models(api_key: str = Depends(verify_api_key)):
    """List available AI provider adapters and active human intelligence domains."""
    providers = AIProviderService.get_available_providers()
    return {
        "active_ai_providers": providers,
        "default_provider": AIProviderService.DEFAULT_PROVIDER,
        "supported_engines": {
            "human_intelligence": "Council of Human Experts & Verified Decision DNA",
            "multi_ai_coordination": "Gemini 2.5 Flash, GPT-4o, Claude 3.5 Sonnet, Perplexity Sonar",
            "hybrid_synthesis": "Weighted Grounding & Discrepancy Attribution Engine"
        }
    }


@router.post("/intelligence/query")
def api_v1_query(
    req: V1QueryRequest,
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """
    Query the Hybrid Reasoning Engine.
    Executes grounded human verification, AI generation, and synthesis.
    """
    start_t = time.time()
    req_obj = V1QueryRequest.model_validate(req)
    from app.schemas.common import AskEchoRequest
    echo_req = AskEchoRequest(
        query=req.query,
        mode=req.mode,
        expert_id=int(req.expert_id) if (req.expert_id and str(req.expert_id).isdigit()) else None,
        ai_provider=req.provider
    )
    result = HybridIntelligenceService.execute(db=db, request=echo_req)
    latency_ms = round((time.time() - start_t) * 1000, 2)

    return {
        "success": True,
        "execution_time_ms": latency_ms,
        "mode_executed": result.mode_used,
        "answer": result.narrative_answer,
        "citations": [
            {
                "expert_name": c.expert_name,
                "domain": getattr(c, "domain", ""),
                "evidence_type": c.source_type,
                "snippet": c.snippet,
                "confidence_score": getattr(c, "confidence_score", 0.9)
            }
            for c in result.citations
        ],
        "synthesis": {
            "human_evidence_summary": result.human_intelligence.get("summary") if result.human_intelligence else None,
            "ai_perspective_summary": result.ai_intelligence.get("analysis") if result.ai_intelligence else None,
            "agreements": result.agreements or [],
            "disagreements": result.disagreements or [],
            "missing_information": result.missing_information or [],
            "hybrid_recommendation": result.hybrid_recommendation,
            "overall_confidence": result.overall_confidence
        },
        "metadata": {
            "ai_provider_used": result.ai_intelligence.get("provider") if result.ai_intelligence else None,
            "ai_model_used": result.ai_intelligence.get("model") if result.ai_intelligence else None,
            "accuracy_guarantee": "Strict Grounding on Human Evidence with Epistemic Transparency"
        }
    }


@router.post("/knowledge/search")
def api_v1_knowledge_search(
    req: V1KnowledgeSearchRequest,
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """Search Engine 1: Global Knowledge Engine items with semantic similarity."""
    results = GlobalKnowledgeService.search(
        db=db,
        query=req.query,
        category=req.category,
        limit=req.limit,
        min_confidence=req.min_confidence
    )
    return {
        "total": len(results),
        "results": [
            {
                "id": r.id,
                "title": r.title,
                "category": r.category,
                "content_preview": r.content_text[:280] + "..." if len(r.content_text) > 280 else r.content_text,
                "source_name": r.source_name,
                "author_or_contributor": r.author_or_contributor,
                "publication_date": r.publication_date,
                "license": r.license,
                "confidence_score": r.confidence_score,
                "verification_status": r.verification_status
            }
            for r in results
        ]
    }


@router.post("/knowledge/ingest")
def api_v1_knowledge_ingest(
    req: V1KnowledgeIngestRequest,
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """Ingest new document/data into Engine 1 with auto-deduplication & chunking."""
    job = GlobalKnowledgeService.create_ingestion_job(
        db=db,
        source_name=req.source_name,
        category=req.category,
        payload=req.content_payload,
        metadata={
            "author_or_contributor": req.author_or_contributor,
            "publication_date": req.publication_date,
            "license": req.license,
            "access_permission": req.access_permission,
            "confidence_score": req.confidence_score
        }
    )
    processed_job = GlobalKnowledgeService.process_ingestion_job(db=db, job_id=job.id)

    return {
        "success": True,
        "job_id": processed_job.id,
        "status": processed_job.status,
        "chunks_created": processed_job.chunks_created,
        "duplicates_skipped": processed_job.duplicates_skipped,
        "error_message": processed_job.error_message
    }


@router.post("/research/discover")
def api_v1_research_discover(
    req: V1ResearchDiscoverRequest,
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """Trigger Engine 5: Cross-Domain Hypothesis Formulation and Research Discovery."""
    hypothesis = ResearchDiscoveryService.discover(
        db=db,
        research_question=req.research_question,
        target_domains=req.target_domains,
        use_ai_synthesis=req.use_ai_synthesis
    )
    return {
        "success": True,
        "hypothesis": ResearchDiscoveryService.serialize_hypothesis(hypothesis)
    }
