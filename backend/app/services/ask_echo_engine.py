from sqlalchemy.orm import Session
from app.schemas.common import AskEchoRequest, AskEchoResponse
from app.services.hybrid_intelligence_service import HybridIntelligenceService


class AskEchoEngine:
    """
    Facade preserving backward compatibility while delegating to the
    Human-AI Hybrid Intelligence Orchestrator.
    """

    @staticmethod
    def answer_query(db: Session, request: AskEchoRequest) -> AskEchoResponse:
        return HybridIntelligenceService.execute(db, request)
