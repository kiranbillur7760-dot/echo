from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import Organization, Expert, Decision

class NetworkService:
    @staticmethod
    def get_network_overview(db: Session) -> Dict[str, Any]:
        """Provides enterprise organizations, federation status, and multi-expert nodes."""
        orgs = db.query(Organization).all()
        experts = db.query(Expert).all()

        org_list = []
        for o in orgs:
            org_list.append({
                "id": o.id,
                "name": o.name,
                "code": o.code,
                "domain": o.domain,
                "security_tier": o.security_tier,
                "description": o.description,
                "expert_count": len(o.experts),
                "created_at": o.created_at
            })

        return {
            "federated_organizations": org_list,
            "total_active_experts": len(experts),
            "permission_models": [
                {"tier": "tier_1_public", "label": "Open Research Knowledge", "access": "Public Read"},
                {"tier": "tier_2_enterprise", "label": "Organization Enterprise Partition", "access": "Role Restricted"},
                {"tier": "tier_3_defense", "label": "Defense & Proprietary Enclave", "access": "Explicit Verification Only"}
            ]
        }

    @staticmethod
    def compare_experts(db: Session, expert_id_a: int = 1, expert_id_b: int = 2) -> Dict[str, Any]:
        """
        Performs multi-expert comparative analysis across engineering philosophy,
        material preferences, risk tolerance, and historical decisions.
        """
        expert_a = db.query(Expert).filter(Expert.id == expert_id_a).first()
        # For demonstration comparison, provide Dr. Alex Morgan vs an adjacent specialist profile
        exp_a_data = {
            "name": expert_a.name if expert_a else "Dr. Alex Morgan",
            "title": expert_a.title if expert_a else "Distinguished Fellow",
            "philosophy": "Passively cooled 3D-woven ceramic matrix composites with internal self-healing matrix chemistry and mechanical CTE compliance.",
            "preferred_materials": ["3D C/SiC", "Silicate Aerogels", "Slotted Grafoil Collets"],
            "risk_profile": "Conservative flight heritage (TRL 7+); prioritizes mechanical decoupling over peak theoretical thermal limits.",
            "key_heuristic": "Brittle hot structures never fail from average uniform thermal expansion; they fail from localized shear concentration at hard anchor points."
        }

        exp_b_data = {
            "name": "Dr. Sarah Lin (Synthetic Aerospace Comparative Fellow)",
            "title": "Principal Scientist of Ultra-High Temperature Ceramics",
            "philosophy": "Active transpiration cooling architectures utilizing monolithic Hafnium Diboride (HfB2) sharp leading edges for minimal drag.",
            "preferred_materials": ["UHTC HfB2-SiC", "Micro-channel Porous Inconel", "Liquid Methane Transpiration"],
            "risk_profile": "Aggressive aerodynamic optimization; accepts plumbing complexity to achieve lower vehicle drag coefficients.",
            "key_heuristic": "Active fluid transpiration alters the boundary shock layer itself, eliminating passive thermal soak constraints."
        }

        comparative_dimensions = [
            {"dimension": "Thermal Strategy", "expert_a": "Passive High-Temp CMC Shield", "expert_b": "Active Transpiration Cooling", "synthesis": "Dr. Morgan favors reliability for 15+ flights; Dr. Lin targets peak Mach 10+ boundary shock thinning."},
            {"dimension": "Mass Budget Impact", "expert_a": "128.4 kg (-11.4% margin under 145 kg)", "expert_b": "142.0 kg (+ pumps, valves, coolant lines)", "synthesis": "Passive C/SiC provides higher payload margin by omitting complex fluid management subsystems."},
            {"dimension": "Manufacturing Maturity", "expert_a": "TRL 7 (Pulsed CVI qualified)", "expert_b": "TRL 5 (Requires micro-channel EDM precision)", "synthesis": "Morgan's path presents substantially lower flight certification schedule risk."}
        ]

        return {
            "expert_a": exp_a_data,
            "expert_b": exp_b_data,
            "comparative_dimensions": comparative_dimensions,
            "collective_consensus": "Both experts agree that standard reinforced carbon-carbon (RCC) is unviable for reusable hypersonic atmospheric flight above Mach 7 without catalytic barrier enhancements."
        }
