from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.common import SimulationRequest, SimulationResponse
from app.services.simulation_engine import ExperienceSimulationEngine

router = APIRouter(prefix="/simulation", tags=["Experience Simulation"])

@router.post("/run", response_model=SimulationResponse)
def run_simulation(request: SimulationRequest, db: Session = Depends(get_db)):
    return ExperienceSimulationEngine.simulate_problem(db, request)
