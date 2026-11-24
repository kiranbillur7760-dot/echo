from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.common import KnowledgeGraphResponse
from app.services.graph_service import GraphService

router = APIRouter(prefix="/graph", tags=["Knowledge Graph Engine"])

@router.get("/data", response_model=KnowledgeGraphResponse)
def get_graph_data(db: Session = Depends(get_db)):
    return GraphService.get_full_graph(db)
