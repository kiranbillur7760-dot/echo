from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.network_service import NetworkService

router = APIRouter(prefix="/network", tags=["ECHO Network & Multi-Expert Hub"])


class CrossExpertQueryReq(BaseModel):
    query: str
    expert_ids: Optional[List[int]] = None


@router.get("/overview")
def get_network_overview(db: Session = Depends(get_db)):
    return NetworkService.get_network_overview(db)


@router.get("/compare-experts")
def compare_experts(
    expert_a_id: int = Query(1),
    expert_b_id: int = Query(2),
    db: Session = Depends(get_db),
):
    try:
        return NetworkService.compare_experts(db, expert_a_id, expert_b_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/cross-expert-query")
def cross_expert_query(req: CrossExpertQueryReq, db: Session = Depends(get_db)):
    return NetworkService.cross_expert_synthesis(db, req.query, req.expert_ids)
