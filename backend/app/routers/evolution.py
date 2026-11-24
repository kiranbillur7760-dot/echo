from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.evolution_service import EvolutionService

router = APIRouter(prefix="/evolution", tags=["Knowledge Evolution & Conflict Radar"])

@router.get("/radar")
def get_evolution_radar(db: Session = Depends(get_db)):
    return EvolutionService.get_evolution_radar(db)

@router.post("/conflicts/{conflict_id}/resolve")
def resolve_conflict(
    conflict_id: int,
    resolution_notes: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    try:
        return EvolutionService.resolve_conflict(db, conflict_id, resolution_notes)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
