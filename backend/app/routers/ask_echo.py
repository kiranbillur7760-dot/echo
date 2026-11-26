from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import Expert, ExpertConsent
from app.schemas.common import AskEchoRequest, AskEchoResponse
from app.services.ask_echo_engine import AskEchoEngine
from app.services.ai_provider_service import AIProviderService

router = APIRouter(prefix="/ask-echo", tags=["Ask ECHO Hybrid Intelligence"])


class ProviderKeyConfigRequest(BaseModel):
    provider: str
    api_key: str


@router.post("/configure-provider")
def configure_ai_provider(req: ProviderKeyConfigRequest) -> Dict[str, Any]:
    """Securely saves a provider API key to backend/.env and activates it immediately."""
    return AIProviderService.configure_provider_key(req.provider, req.api_key)


@router.post("/query", response_model=AskEchoResponse)
def query_ask_echo(request: AskEchoRequest, db: Session = Depends(get_db)):
    """
    Executes Ask ECHO across its two intelligence modes:
      - complete_human_intelligence: speaks with one or multiple experts via approved human knowledge
      - hybrid_intelligence (default): combines retrieved human evidence with configured AI providers,
        identifies agreements, disagreements, missing info, and synthesizes an answer
    """
    return AskEchoEngine.answer_query(db, request)


@router.get("/providers")
def get_ai_providers() -> List[Dict[str, Any]]:
    """Returns supported AI providers, models, and live backend configuration status."""
    return AIProviderService.list_providers()


@router.get("/experts-domains")
def get_experts_and_domains(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns consented experts and domains for Ask ECHO filtering."""
    experts = db.query(Expert).all()
    consents = {c.expert_id: c for c in db.query(ExpertConsent).all()}
    active_experts = []
    for e in experts:
        c = consents.get(e.id)
        if c and (c.status != "active" or not c.consent_knowledge):
            continue
        active_experts.append({
            "id": e.id,
            "name": e.name,
            "domain": e.domain,
            "title": e.title,
            "is_synthetic_demo": e.is_synthetic_demo,
        })
    domains = sorted({e["domain"] for e in active_experts if e["domain"]})
    return {
        "experts": active_experts,
        "domains": domains,
    }


@router.get("/sample-queries")
def get_sample_queries() -> List[Dict[str, Any]]:
    """Returns curated sample prompts demonstrating Complete Human & Hybrid Intelligence."""
    return [
        {
            "category": "Hybrid Aerospace Safety",
            "query": "How can we improve the safety of an aircraft engine?",
            "expert_name": "Hybrid Intelligence",
            "type": "hybrid",
        },
        {
            "category": "Hypersonic Structures (Dr. Alex Morgan)",
            "query": "How did Dr. Alex Morgan mitigate fastener shear failure in ceramic matrix composite leading edges?",
            "expert_name": "Dr. Alex Morgan",
            "type": "documented",
        },
        {
            "category": "Life Support Systems (Dr. Elena Rostova)",
            "query": "What method did Dr. Elena Rostova use to prevent biofilm buildup in photobioreactors?",
            "expert_name": "Dr. Elena Rostova",
            "type": "documented",
        },
        {
            "category": "Radiation Shielding (Dr. Marcus Vance)",
            "query": "Why did Dr. Marcus Vance reject lead and aluminum for deep space radiation shielding?",
            "expert_name": "Dr. Marcus Vance",
            "type": "documented",
        },
        {
            "category": "Orbital Logistics (Director Sarah Lin)",
            "query": "What is the gear ratio penalty in Trans-Martian injection logistics according to Director Sarah Lin?",
            "expert_name": "Director Sarah Lin",
            "type": "documented",
        },
        {
            "category": "Out-of-Scope Negative Control",
            "query": "What are the best recipes for chocolate cake?",
            "expert_name": "Unrecorded Domain",
            "type": "negative_control",
        },
    ]
