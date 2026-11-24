import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import Decision, DecisionAlternative, Evidence, Outcome, Lesson

class DecisionDNAService:
    @staticmethod
    def format_decision_dna(decision: Decision) -> Dict[str, Any]:
        """Serializes a Decision entity into full Decision DNA format."""
        try:
            constraints_list = json.loads(decision.constraints) if decision.constraints else []
        except Exception:
            constraints_list = [decision.constraints] if decision.constraints else []

        alternatives = []
        for alt in decision.alternatives:
            try:
                pros = json.loads(alt.pros) if alt.pros else []
            except Exception:
                pros = [alt.pros] if alt.pros else []
            try:
                cons = json.loads(alt.cons) if alt.cons else []
            except Exception:
                cons = [alt.cons] if alt.cons else []

            alternatives.append({
                "id": alt.id,
                "title": alt.title,
                "description": alt.description,
                "pros": pros,
                "cons": cons,
                "why_rejected": alt.why_rejected,
                "estimated_risk": alt.estimated_risk
            })

        evidence_items = []
        for ev in decision.evidence_items:
            evidence_items.append({
                "id": ev.id,
                "title": ev.title,
                "evidence_type": ev.evidence_type,
                "content": ev.content,
                "source_url_or_ref": ev.source_url_or_ref,
                "reliability_score": ev.reliability_score
            })

        outcomes = []
        for out in decision.outcomes:
            outcomes.append({
                "id": out.id,
                "metric_name": out.metric_name,
                "expected_value": out.expected_value,
                "actual_value": out.actual_value,
                "impact_summary": out.impact_summary,
                "time_horizon": out.time_horizon,
                "validation_method": out.validation_method
            })

        lessons = []
        for les in decision.lessons:
            lessons.append({
                "id": les.id,
                "decision_id": les.decision_id,
                "expert_id": les.expert_id,
                "title": les.title,
                "category": les.category,
                "insight": les.insight,
                "anti_pattern_to_avoid": les.anti_pattern_to_avoid,
                "recommended_practice": les.recommended_practice,
                "is_synthetic_demo": les.is_synthetic_demo,
                "created_at": les.created_at
            })

        return {
            "id": decision.id,
            "expert_id": decision.expert_id,
            "expert_name": decision.expert.name if decision.expert else "Unknown Expert",
            "project_id": decision.project_id,
            "project_title": decision.project.title if decision.project else None,
            "title": decision.title,
            "problem_definition": decision.problem_definition,
            "context": decision.context,
            "constraints": constraints_list,
            "reasoning": decision.reasoning,
            "selected_decision": decision.selected_decision,
            "outcome": decision.outcome,
            "lessons_learned": decision.lessons_learned,
            "confidence_rating": decision.confidence_rating,
            "status": decision.status,
            "is_synthetic_demo": decision.is_synthetic_demo,
            "created_at": decision.created_at,
            "alternatives": alternatives,
            "evidence_items": evidence_items,
            "outcomes": outcomes,
            "lessons": lessons
        }

    @staticmethod
    def compare_alternatives(decision: Decision) -> Dict[str, Any]:
        """Provides side-by-side trade-off matrix for the selected decision vs alternatives."""
        dna = DecisionDNAService.format_decision_dna(decision)
        matrix = {
            "decision_title": decision.title,
            "problem": decision.problem_definition,
            "selected": {
                "title": decision.selected_decision,
                "rationale": decision.reasoning,
                "outcome": decision.outcome,
                "confidence": decision.confidence_rating
            },
            "alternatives_compared": dna["alternatives"]
        }
        return matrix

    @staticmethod
    def replay_decision(db: Session, request: Any) -> Dict[str, Any]:
        """
        Replays an expert historical decision under modified constraints or assumptions,
        identifying the critical divergence point and projecting hypothetical branches.
        """
        decision = db.query(Decision).filter(Decision.id == request.decision_id).first()
        if not decision:
            raise ValueError(f"Decision #{request.decision_id} not found.")

        # Analyze modified parameters
        temp = request.modified_temperature_c or 1750.0
        mass_budget = request.modified_mass_budget_kg or 145.0
        is_single_use = request.modified_mission_profile == "single_use_expendable"
        cycles = request.modified_flight_cycles or (1 if is_single_use else 15)

        modified_params = {
            "Peak Stagnation Temperature": f"{temp}°C (Original: 1750°C)",
            "Mass Budget Ceiling": f"{mass_budget} kg (Original: 145.0 kg)",
            "Flight Cycle Lifespan Target": f"{cycles} missions (Original: 15 reusable)",
            "Mission Profile": "Single-Use Expendable" if is_single_use else "Multi-Flight Reusable"
        }

        # Branching logic based on physics and historical trade-offs
        if is_single_use:
            divergence_point = "Mission profile shifted from multi-flight reusability to single-use expendable flight test."
            replayed_approach = "Recast Phenolic-Impregnated Carbon Ablator (PICA-X) with high-density charring resin."
            replayed_rationale = (
                "Under single-use expendable constraints, manufacturing complex 3D-woven C/SiC composites with pulsed CVI "
                "is cost-inefficient. PICA-X provides reliable thermal heat dissipation via endothermic pyrolysis at 1/5th the "
                "procurement lead time, accepting minor aerodynamic nose recession."
            )
            tradeoffs = {
                "Fabrication Cost": "Dramatically lower (-70% cheaper than C/SiC)",
                "Lead Time": "Reduced from 16 weeks to 3 weeks",
                "Reusability": "Zero (Nose assembly discarded post-splashdown)",
                "Mass Penalty": "Acceptable (118 kg total mass)"
            }
            projected_outcome = "Successful single atmospheric entry; post-flight nose cap ablated by 6.2 mm, validating trajectory at minimal capital expense."

        elif temp > 2000.0:
            divergence_point = f"Peak temperature of {temp}°C exceeds the oxidation ceiling of passive C/SiC (~1800°C)."
            replayed_approach = "Ultra-High Temperature Ceramic (UHTC) monolithic Hafnium Diboride (HfB2-20%SiC) with transpiration cooling."
            replayed_rationale = (
                f"At {temp}°C, the silica glass protective layer on C/SiC boils and evaporates. Dr. Alex Morgan's heuristics dictating "
                "passive CMC fail. The engineering solution must pivot to refractory diborides with active cooling bleed channels."
            )
            tradeoffs = {
                "Thermal Ceiling": f"Survives continuous exposure up to 2400°C",
                "Mass Penalty": "Severe (+32 kg over budget; requires lightening internal titanium frames)",
                "System Complexity": "High (adds cryogenic valves and porous coolant plumbing)"
            }
            projected_outcome = "Hypothetical re-entry survived without surface recession, but high localized thermal gradients induce micro-cracking risk during chilldown."

        elif mass_budget < 110.0:
            divergence_point = f"Mass budget of {mass_budget} kg cannot accommodate standard 25mm aerogel insulation backed C/SiC (~128 kg)."
            replayed_approach = "Ultra-thin carbon-carbon substrate with chemical vapor infiltrated SiC skin and thin radiation heat shields."
            replayed_rationale = (
                "Extreme mass restrictions force sacrificing structural insulation thickness. To protect the internal titanium airframe, "
                "the flight vehicle must adjust entry trajectory to reduce flight duration in peak heat zone."
            )
            tradeoffs = {
                "Assembly Mass": f"Optimal (104 kg, satisfying {mass_budget} kg limit)",
                "Thermal Buffer Margin": "Critically low (titanium interface reaches 195°C, close to 200°C failure bound)",
                "Inspection Interval": "Requires non-destructive X-ray scan between every flight"
            }
            projected_outcome = "Vehicle meets mass constraints, but operational safety margin is degraded from 1.8x to 1.1x."

        else:
            divergence_point = "Parameters remain within the validated Project Hyperion operating envelope."
            replayed_approach = decision.selected_decision
            replayed_rationale = decision.reasoning
            tradeoffs = {
                "Reliability": "Very High",
                "Mass Margin": "-11.4% under 145 kg ceiling",
                "Reusability": "15+ confirmed flights"
            }
            projected_outcome = decision.outcome

        return {
            "decision_id": decision.id,
            "original_title": decision.title,
            "original_selected_decision": decision.selected_decision,
            "modified_parameters": modified_params,
            "branching_divergence_point": divergence_point,
            "replayed_selected_approach": replayed_approach,
            "replayed_rationale": replayed_rationale,
            "tradeoff_comparison": tradeoffs,
            "hypothetical_projected_outcome": projected_outcome,
            "is_hypothetical_simulation": True,
            "epistemic_warning": (
                "NOTICE: This Decision Replay is a synthesized HYPOTHETICAL SIMULATION exploring altered constraints. "
                "It does NOT represent a real flight record or historical event."
            )
        }
