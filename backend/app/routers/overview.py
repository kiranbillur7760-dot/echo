from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.entities import Expert, KnowledgeRecord, Decision, CaseStudy, Evidence, ActivityLog
from app.schemas.common import PlatformOverview, OverviewMetrics, RecentActivityOut

router = APIRouter(prefix="/overview", tags=["Platform Overview"])

@router.get("/dashboard", response_model=PlatformOverview)
def get_dashboard_overview(db: Session = Depends(get_db)):
    experts_count = db.query(Expert).count()
    records_count = db.query(KnowledgeRecord).count()
    decisions_count = db.query(Decision).count()
    case_studies_count = db.query(CaseStudy).count()
    evidence_count = db.query(Evidence).count()

    metrics = OverviewMetrics(
        expert_profiles_count=experts_count,
        knowledge_records_count=records_count,
        decisions_documented_count=decisions_count,
        case_studies_count=case_studies_count,
        total_evidence_pieces=evidence_count,
        simulation_runs=12
    )

    activities = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(8).all()
    recent_activities = [
        RecentActivityOut(
            id=a.id,
            action_type=a.action_type,
            entity_type=a.entity_type,
            entity_id=a.entity_id,
            description=a.description,
            created_at=a.created_at
        )
        for a in activities
    ]

    todays_insight = {
        "title": "Mitigating Interfacial Shear in High-Heat Fastener Assemblies",
        "expert": "Dr. Alex Morgan",
        "domain": "Aerospace Engineering",
        "summary": "Never bolt directly against bare composite laminates. Differential thermal expansion between metallic ribs and C/SiC induces catastrophic shear failure above 600°C without slotted compliance isolators.",
        "quote": "Brittle hot structures never fail from average uniform thermal expansion; they fail from localized shear concentration at hard boundary anchor points."
    }

    active_research = [
        {"title": "Pulsed Chemical Vapor Infiltration Kinetics", "status": "Active Validation", "trl": "TRL 7"},
        {"title": "Multi-mission Micro-cracking Self-Healing Silicates", "status": "In Review", "trl": "TRL 6"},
        {"title": "Cryogenic-Aero Boundary Interface Optimization", "status": "Flight Ready", "trl": "TRL 8"}
    ]

    top_expertise_areas = [
        {"name": "Hypersonic Aerothermodynamics", "count": 28, "growth": "+18%"},
        {"name": "Ceramic Matrix Composites (CMC)", "count": 34, "growth": "+24%"},
        {"name": "Atmospheric Re-entry TPS Design", "count": 21, "growth": "+12%"},
        {"name": "Differential Thermal Expansion (CTE)", "count": 19, "growth": "+15%"}
    ]

    return PlatformOverview(
        metrics=metrics,
        recent_activities=recent_activities,
        todays_insight=todays_insight,
        active_research=active_research,
        top_expertise_areas=top_expertise_areas
    )
