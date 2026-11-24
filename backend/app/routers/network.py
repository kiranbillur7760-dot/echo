from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.network_service import NetworkService

router = APIRouter(prefix="/network", tags=["ECHO Network & Multi-Expert Hub"])

@router.get("/overview")
def get_network_overview(db: Session = Depends(get_db)):
    return NetworkService.get_network_overview(db)

@router.get("/compare-experts")
def compare_experts(
    expert_a_id: int = Query(1),
    expert_b_id: int = Query(2),
    db: Session = Depends(get_db)
):
    return NetworkService.compare_experts(db, expert_a_id, expert_b_id)
