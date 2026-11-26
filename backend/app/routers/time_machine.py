from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.time_machine_service import TimeMachineService

router = APIRouter(prefix="/time-machine", tags=["ECHO Decision Time Machine"])

class SimulationRequest(BaseModel):
    decision_id: int
    modified_constraints: Dict[str, Any]

@router.get("/decisions")
def get_time_machine_decisions(db: Session = Depends(get_db)):
    """Retrieve all historical Decision DNA records available for counterfactual simulation."""
    return TimeMachineService.get_available_decisions(db)

@router.get("/decisions/{decision_id}")
def get_time_machine_decision_detail(decision_id: int, db: Session = Depends(get_db)):
    """Retrieve full Decision DNA with original constraints, alternatives, and outcomes."""
    try:
        return TimeMachineService.get_decision_detail(db, decision_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/simulate")
def simulate_decision_branch(req: SimulationRequest, db: Session = Depends(get_db)):
    """Simulate counterfactual branching when historical constraints are manipulated."""
    try:
        return TimeMachineService.simulate_branch(
            db=db,
            decision_id=req.decision_id,
            modified_constraints=req.modified_constraints
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")
