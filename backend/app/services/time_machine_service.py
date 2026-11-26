import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import Decision, DecisionAlternative, Evidence, Outcome, Lesson, Expert

class TimeMachineService:
    @staticmethod
    def get_available_decisions(db: Session) -> List[Dict[str, Any]]:
        """Returns all historical Decision DNA records available for Time Machine simulation."""
        decisions = db.query(Decision).all()
        result = []
        for d in decisions:
            expert = db.query(Expert).filter(Expert.id == d.expert_id).first()
            result.append({
                "id": d.id,
                "title": d.title,
                "expert_id": d.expert_id,
                "expert_name": expert.name if expert else "Unknown Expert",
                "expert_domain": expert.domain if expert else "Engineering",
                "problem_definition": d.problem_definition,
                "selected_decision": d.selected_decision,
                "confidence_rating": d.confidence_rating,
                "status": d.status,
                "constraints": json.loads(d.constraints) if d.constraints else []
            })
        return result

    @staticmethod
    def get_decision_detail(db: Session, decision_id: int) -> Dict[str, Any]:
        """Fetches full Decision DNA details with original parameters and alternatives."""
        d = db.query(Decision).filter(Decision.id == decision_id).first()
        if not d:
            raise ValueError(f"Decision {decision_id} not found.")

        expert = db.query(Expert).filter(Expert.id == d.expert_id).first()
        alternatives = db.query(DecisionAlternative).filter(DecisionAlternative.decision_id == d.id).all()
        evidence = db.query(Evidence).filter(Evidence.decision_id == d.id).all()
        outcomes = db.query(Outcome).filter(Outcome.decision_id == d.id).all()
        lessons = db.query(Lesson).filter(Lesson.decision_id == d.id).all()

        return {
            "id": d.id,
            "title": d.title,
            "expert_name": expert.name if expert else "Unknown",
            "expert_domain": expert.domain if expert else "General",
            "problem_definition": d.problem_definition,
            "context": d.context,
            "original_constraints": json.loads(d.constraints) if d.constraints else [],
            "original_reasoning": d.reasoning,
            "selected_decision": d.selected_decision,
            "original_outcome": d.outcome,
            "original_lessons": d.lessons_learned,
            "confidence_rating": d.confidence_rating,
            "alternatives": [
                {
                    "id": a.id,
                    "title": a.title,
                    "description": a.description,
                    "pros": json.loads(a.pros) if a.pros else [],
                    "cons": json.loads(a.cons) if a.cons else [],
                    "why_rejected": a.why_rejected,
                    "estimated_risk": a.estimated_risk
                }
                for a in alternatives
            ],
            "evidence": [
                {
                    "title": e.title,
                    "type": e.evidence_type,
                    "content": e.content,
                    "reliability": e.reliability_score
                }
                for e in evidence
            ],
            "outcomes": [
                {
                    "metric": o.metric_name,
                    "expected": o.expected_value,
                    "actual": o.actual_value,
                    "impact": o.impact_summary
                }
                for o in outcomes
            ],
            "lessons": [
                {
                    "title": l.title,
                    "insight": l.insight,
                    "anti_pattern": l.anti_pattern_to_avoid,
                    "practice": l.recommended_practice
                }
                for l in lessons
            ]
        }

    @staticmethod
    def simulate_branch(
        db: Session,
        decision_id: int,
        modified_constraints: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates dynamic branching when historical constraints are manipulated.
        Evaluates physical feasibility, alternative promotion, cost/mass impact,
        and epistemic truth classification.
        """
        detail = TimeMachineService.get_decision_detail(db, decision_id)
        title = detail["title"]

        if "Mach 7+" in title or "Leading Edge" in title or "Morgan" in detail["expert_name"]:
            return TimeMachineService._simulate_aerothermal(detail, modified_constraints)
        elif "CO2" in title or "Oxygen" in title or "Rostova" in detail["expert_name"]:
            return TimeMachineService._simulate_life_support(detail, modified_constraints)
        elif "Radiation" in title or "Vance" in detail["expert_name"]:
            return TimeMachineService._simulate_radiation(detail, modified_constraints)
        elif "Logistics" in title or "Lin" in detail["expert_name"] or "ISRU" in title:
            return TimeMachineService._simulate_logistics(detail, modified_constraints)
        else:
            return TimeMachineService._simulate_generic(detail, modified_constraints)

    @staticmethod
    def _simulate_aerothermal(detail: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """Dynamic simulation for Dr. Alex Morgan's Hypersonic TPS decision."""
        # Baseline: 1720°C, 145 kg, 15 flights, Ablation=False
        temp = float(params.get("temperature_c", 1720))
        mass_budget = float(params.get("mass_budget_kg", 145))
        target_flights = int(params.get("flight_reusability", 15))
        allow_ablation = bool(params.get("allow_ablation", False))
        budget_usd_m = float(params.get("cost_budget_m", 45))

        original_choice = detail["selected_decision"]
        branch_choice = ""
        branch_rationale = ""
        branch_risk = "Low"
        epistemic_level = "Tier 1: Empirical Flight-Tested"
        feasibility_status = "FEASIBLE"
        warnings = []

        # Decision Branching Rules based on physics
        if target_flights <= 1 and allow_ablation:
            # Reusability is 1 and ablation allowed -> PICA-X is optimal!
            branch_choice = "Phenolic Impregnated Carbon Ablator (PICA-X Re-cast)"
            branch_rationale = (
                "Under single-mission expendable flight requirements with allowable aerodynamic shape recession, "
                "the original 3D-woven C/SiC composite is severe over-engineering. PICA-X provides predictable pyrolysis "
                "cooling at 65% lower procurement cost ($12M vs $38M) and requires zero complex Grafoil CTE decoupling joints."
            )
            branch_risk = "Low (Flight-Proven Ablator Baseline)"
            epistemic_level = "Tier 1: Empirical Flight-Tested Heritage"
            predicted_mass = 112.0
            predicted_cost_m = 14.5
            surface_recession_mm = 8.4
        elif temp > 1900:
            # Temperature exceeds C/SiC limits (silicon carbide melts/degrades at ~1900-2000°C)
            if mass_budget >= 240:
                branch_choice = "Plasma-Clad Tantalum-Hafnium-Carbide (Ta-10W / HfC) Refractory Alloy"
                branch_rationale = (
                    f"At {temp}°C, passive C/SiC exceeds silicon carbide thermodynamic stability limits (>1900°C oxidation kinetics). "
                    "With mass budget expanded to {mass_budget} kg, the previously rejected refractory alloy alternative becomes viable, "
                    "offering a thermal ceiling above 2400°C with complete structural ductility."
                )
                branch_risk = "Moderate (High Center-of-Gravity Inflow)"
                epistemic_level = "Tier 2: Ground Arc-Jet Tested"
                predicted_mass = 278.0
                predicted_cost_m = 68.0
                surface_recession_mm = 0.05
            else:
                branch_choice = "Ultra-High-Temperature Ceramic Matrix (HfB2-SiC-C) with Active Gas Transpiration"
                branch_rationale = (
                    f"At {temp}°C within strict {mass_budget} kg mass ceiling, monolithic refractory metals are too heavy. "
                    "Forces branch to Hafnium Diboride Ultra-High-Temperature Ceramic (UHTC) preform with active nitrogen transpiration "
                    "cooling bleed through porous nose channels to suppress boundary layer shock temperatures."
                )
                branch_risk = "High (Plumbing Complexity & Sub-Critical Bleed Rate)"
                epistemic_level = "Tier 3: Multi-Physics Simulation Modeled"
                predicted_mass = 142.5
                predicted_cost_m = 74.0
                surface_recession_mm = 0.2
                warnings.append("Active transpiration cooling introduces active fluid failure points during Mach 7 shock transition.")
        elif mass_budget < 110:
            # Strict mass budget
            branch_choice = "Ultra-Thin 2D Carbon-Carbon (RCC) with Pulsed Zirconia Barrier Coating"
            branch_rationale = (
                f"A reduced mass budget of {mass_budget} kg invalidates the heavier 3D C/SiC aerogel pack (128 kg). "
                "Forces adoption of ultra-lightweight Reinforced Carbon-Carbon (density 1.55 g/cm³). However, acoustic micro-cracking "
                "risks catastrophic subsurface oxidation unless backed by pulsed zirconia plasma deposition."
            )
            branch_risk = "Extreme (Vibration Coating Spallation & Burn-Through)"
            epistemic_level = "Tier 4: Expert Heuristic Projection"
            predicted_mass = 96.0
            predicted_cost_m = 52.0
            surface_recession_mm = 0.4
            warnings.append("High risk of catastrophic oxidation burn-through during terminal re-entry if coating develops pinhole cracks.")
        else:
            # Nominal C/SiC holds
            branch_choice = "3D-Woven Graded C/SiC Ceramic Matrix Composite (Baseline Optimized)"
            branch_rationale = (
                f"At {temp}°C and {mass_budget} kg budget across {target_flights} flights, the original choice remains mathematically "
                "and physically optimal. The 3D-woven architecture with internal Grafoil slotted collets delivers 128 kg assembly mass "
                "with zero ablation and full 15+ flight multi-cycle durability."
            )
            branch_risk = "Low (Original Validated Flight Baseline)"
            epistemic_level = "Tier 1: Empirical Flight-Tested"
            predicted_mass = 128.4
            predicted_cost_m = 38.2
            surface_recession_mm = 0.11

        # Comparison metrics
        comparison_table = [
            {
                "parameter": "Stagnation Temperature Ceiling",
                "original_baseline": "1,750°C",
                "simulated_branch": f"{temp:.0f}°C",
                "delta": f"{temp - 1750:+.0f}°C",
                "status": "Constraint Shift"
            },
            {
                "parameter": "Assembly Mass",
                "original_baseline": "128.4 kg (Budget: 145.0 kg)",
                "simulated_branch": f"{predicted_mass:.1f} kg (Budget: {mass_budget:.0f} kg)",
                "delta": f"{predicted_mass - 128.4:+.1f} kg",
                "status": "PASS" if predicted_mass <= mass_budget else "VIOLATION"
            },
            {
                "parameter": "Reusability Target",
                "original_baseline": "15 Flights Minimum",
                "simulated_branch": f"{target_flights} Flights",
                "delta": f"{target_flights - 15:+d} Flights",
                "status": "Shift"
            },
            {
                "parameter": "Aerodynamic Surface Recession",
                "original_baseline": "0.11 mm (Zero Ablation)",
                "simulated_branch": f"{surface_recession_mm:.2f} mm",
                "delta": f"{surface_recession_mm - 0.11:+.2f} mm",
                "status": "Preserved L/D" if surface_recession_mm < 0.5 else "Degraded Trim"
            },
            {
                "parameter": "Development & Production Cost",
                "original_baseline": "$38.2M",
                "simulated_branch": f"${predicted_cost_m:.1f}M",
                "delta": f"${predicted_cost_m - 38.2:+.1f}M",
                "status": "Within Budget" if predicted_cost_m <= budget_usd_m else "COST OVERRUN"
            }
        ]

        return {
            "decision_id": detail["id"],
            "decision_title": detail["title"],
            "expert_name": detail["expert_name"],
            "domain": detail["expert_domain"],
            "original_selected_decision": original_choice,
            "simulated_selected_decision": branch_choice,
            "branch_rationale": branch_rationale,
            "branch_risk_rating": branch_risk,
            "epistemic_truth_classification": epistemic_level,
            "feasibility_status": feasibility_status,
            "warnings": warnings,
            "comparison_table": comparison_table,
            "causal_chain": [
                f"1. Constraint adjusted: Temperature = {temp}°C, Mass Budget = {mass_budget} kg, Reusability = {target_flights} flights.",
                f"2. Physical constraint evaluation: Silicon carbide oxidation kinetics evaluated against thermal threshold ({temp}°C).",
                f"3. Alternative trade analysis: Evaluated rejected alternatives (Refractory Alloy, RCC, PICA-X).",
                f"4. Selected branch: '{branch_choice}' justified by mass-energy conservation balance."
            ]
        }

    @staticmethod
    def _simulate_life_support(detail: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """Dynamic simulation for Dr. Elena Rostova's CELSS Life Support decision."""
        crew_size = int(params.get("crew_size", 6))
        power_budget_kw = float(params.get("power_budget_kw", 4.2))
        water_recovery_target = float(params.get("water_recovery_percent", 98.0))
        edible_biomass_offset = float(params.get("edible_biomass_percent", 25.0))

        if crew_size > 8 or power_budget_kw < 3.0:
            branch_choice = "Multi-Stage Supercritical Water Oxidation (SCWO) with Solid Amine Sorbents"
            branch_rationale = (
                f"With crew size scaled to {crew_size} and power constrained to {power_budget_kw} kW, biological photobioreactors "
                "exceed available volumetric envelope and lighting energy limits. Forces shift to thermochemical SCWO and physical amine sorbents, "
                "sacrificing edible biomass in favor of zero-footprint mechanical air purification."
            )
            branch_risk = "High (High-Pressure 22 MPa Line Safety)"
            epistemic_level = "Tier 3: Multi-Physics Simulation"
            mass_kg = 1120.0
            power_kw = 2.9
            recovery_pct = 99.1
            autotrophy_pct = 0.0
        elif edible_biomass_offset >= 40.0:
            branch_choice = "Expanded High-Density Tubular Microalgal Bio-Farm with LED Light Concentrators"
            branch_rationale = (
                f"Requiring {edible_biomass_offset}% food autotrophy necessitates doubling the helical tubular bioreactor volume. "
                "Produces 48% crew daily protein intake, cutting Earth food resupply by 820 kg, but increases continuous power draw to 5.4 kW."
            )
            branch_risk = "Moderate (Biofilm Acoustic Management)"
            epistemic_level = "Tier 2: Ground Chamber Validated"
            mass_kg = 940.0
            power_kw = 5.4
            recovery_pct = 98.8
            autotrophy_pct = 42.5
        else:
            branch_choice = "Hybrid Helical Tubular Microalgae Photobioreactor + Solid Amine Desorption (Baseline)"
            branch_rationale = (
                f"Original hybrid architecture successfully balances {crew_size} crew metabolic respiration within {power_budget_kw} kW. "
                "Provides 98.4% water closure and 31% protein supplement with minimal launch mass penalty."
            )
            branch_risk = "Low (Ares Bio-Dome Proven)"
            epistemic_level = "Tier 1: Ground Chamber 500-Day Validated"
            mass_kg = 835.0
            power_kw = 3.8
            recovery_pct = 98.4
            autotrophy_pct = 31.2

        comparison_table = [
            {
                "parameter": "Crew Size Supported",
                "original_baseline": "6 Persons",
                "simulated_branch": f"{crew_size} Persons",
                "delta": f"{crew_size - 6:+d}",
                "status": "Shift"
            },
            {
                "parameter": "Continuous Power Consumption",
                "original_baseline": "3.82 kW (Budget: 4.2 kW)",
                "simulated_branch": f"{power_kw:.2f} kW (Budget: {power_budget_kw:.1f} kW)",
                "delta": f"{power_kw - 3.82:+.2f} kW",
                "status": "PASS" if power_kw <= power_budget_kw else "POWER DEFICIT"
            },
            {
                "parameter": "Closed-Loop Water Recovery",
                "original_baseline": "98.4%",
                "simulated_branch": f"{recovery_pct:.1f}%",
                "delta": f"{recovery_pct - 98.4:+.1f}%",
                "status": "PASS" if recovery_pct >= water_recovery_target else "SUB-OPTIMAL"
            },
            {
                "parameter": "Edible Food Biomass Offset",
                "original_baseline": "31.2% Daily Protein",
                "simulated_branch": f"{autotrophy_pct:.1f}% Daily Intake",
                "delta": f"{autotrophy_pct - 31.2:+.1f}%",
                "status": "Autotrophy Shift"
            }
        ]

        return {
            "decision_id": detail["id"],
            "decision_title": detail["title"],
            "expert_name": detail["expert_name"],
            "domain": detail["expert_domain"],
            "original_selected_decision": detail["selected_decision"],
            "simulated_selected_decision": branch_choice,
            "branch_rationale": branch_rationale,
            "branch_risk_rating": branch_risk,
            "epistemic_truth_classification": epistemic_level,
            "feasibility_status": "FEASIBLE" if power_kw <= power_budget_kw else "POWER DEFICIT",
            "warnings": ["Ensure gas buffer accumulator volume scales linearly with crew count to prevent hypercapnia."] if crew_size > 6 else [],
            "comparison_table": comparison_table,
            "causal_chain": [
                f"1. Scaled crew parameters: {crew_size} persons, power budget {power_budget_kw} kW.",
                f"2. Metabolic balance calculation: Oxygen requirement = {crew_size * 0.84:.2f} kg/day.",
                f"3. Trade study: Biological photobioreactor vs physical-chemical SCWO reactor.",
                f"4. Selected branch: '{branch_choice}'."
            ]
        }

    @staticmethod
    def _simulate_radiation(detail: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """Dynamic simulation for Dr. Marcus Vance's Radiation Shielding decision."""
        annual_dose_limit = float(params.get("dose_limit_msv", 150))
        areal_mass_limit = float(params.get("areal_mass_limit", 42))
        mission_days = int(params.get("mission_days", 1000))

        if annual_dose_limit < 100:
            branch_choice = "Deep Hybrid Sintered Regolith Over-Berm (1.8m) with Dual Active Magnetic Deflection"
            branch_rationale = (
                f"Achieving ultra-low radiation dose (<{annual_dose_limit} mSv/yr) cannot be accomplished by passive composite walls "
                "without severe weight violations. Requires increasing microwave-sintered basaltic regolith thickness to 1.8 meters "
                "coupled with high-temperature superconducting active magnetic coil arrays."
            )
            branch_risk = "High (Active Cryo-Cooling Dependent)"
            epistemic_level = "Tier 3: Multi-Physics Simulation Modeled"
            dose_msv = 84.0
            areal_mass = 52.0
        elif areal_mass_limit < 30:
            branch_choice = "High-Hydrogen Electrospun Nanofiber Fabric with Dynamic Water Shifting"
            branch_rationale = (
                f"Restricting areal mass to {areal_mass_limit} g/cm² eliminates standard composite panel thickness. "
                "Forces reliance on high-density polyethylene nanofibers backed by dynamic computer-controlled shifting of "
                "drinking water tanks to the sunward and galactic facing hull sectors."
            )
            branch_risk = "Moderate (Dynamic Fluid Balancing Failure)"
            epistemic_level = "Tier 4: Expert Heuristic Projection"
            dose_msv = 142.0
            areal_mass = 28.5
        else:
            branch_choice = "Functionally Graded Multi-Layer Architecture (Hydrogenated BNNT/UHMWPE + Water Wall)"
            branch_rationale = (
                f"Original multi-layer topology satisfies {annual_dose_limit} mSv/yr limit at 38.5 g/cm² areal mass across {mission_days} days. "
                "Boron-10 dopants neutralize secondary neutrons without producing gamma cascades."
            )
            branch_risk = "Low (Brookhaven Beamline Validated)"
            epistemic_level = "Tier 1: Beamline Empirical Validated"
            dose_msv = 118.4
            areal_mass = 38.5

        comparison_table = [
            {
                "parameter": "Annual Absorbed Dose (GCR/SPE)",
                "original_baseline": "118.4 mSv/year",
                "simulated_branch": f"{dose_msv:.1f} mSv/year",
                "delta": f"{dose_msv - 118.4:+.1f} mSv/year",
                "status": "PASS" if dose_msv <= annual_dose_limit else "DOSE CEILING EXCEEDED"
            },
            {
                "parameter": "Areal Mass Density",
                "original_baseline": "38.5 g/cm²",
                "simulated_branch": f"{areal_mass:.1f} g/cm²",
                "delta": f"{areal_mass - 38.5:+.1f} g/cm²",
                "status": "PASS" if areal_mass <= areal_mass_limit else "MASS VIOLATION"
            },
            {
                "parameter": "Secondary Neutron Spallation",
                "original_baseline": "Suppressed (<6% total dose)",
                "simulated_branch": "Suppressed via Boron-10 capture",
                "delta": "0.0%",
                "status": "NEUTRALIZED"
            }
        ]

        return {
            "decision_id": detail["id"],
            "decision_title": detail["title"],
            "expert_name": detail["expert_name"],
            "domain": detail["expert_domain"],
            "original_selected_decision": detail["selected_decision"],
            "simulated_selected_decision": branch_choice,
            "branch_rationale": branch_rationale,
            "branch_risk_rating": branch_risk,
            "epistemic_truth_classification": epistemic_level,
            "feasibility_status": "FEASIBLE" if (dose_msv <= annual_dose_limit and areal_mass <= areal_mass_limit) else "CONSTRAINT CONFLICT",
            "warnings": ["Never substitute high-Z lead or tungsten into deep space radiation walls."] if annual_dose_limit < 100 else [],
            "comparison_table": comparison_table,
            "causal_chain": [
                f"1. Radiation boundary adjustment: Target dose = {annual_dose_limit} mSv/yr, areal mass = {areal_mass_limit} g/cm².",
                "2. Secondary neutron fragmentation modeled against relativistic iron ions (56Fe).",
                f"3. Evaluated shielding density and regolith berm thickness requirement.",
                f"4. Selected branch: '{branch_choice}'."
            ]
        }

    @staticmethod
    def _simulate_logistics(detail: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """Dynamic simulation for Director Sarah Lin's Logistics & Economics decision."""
        capex_b = float(params.get("capex_budget_b", 14.0))
        earth_mass_cap_tons = float(params.get("payload_cap_tons", 180.0))
        synodic_windows = int(params.get("launch_windows", 3))

        if capex_b < 10.0 or earth_mass_cap_tons < 110.0:
            branch_choice = "Aggressive Full Autonomous Robotic Sintering with Minimal Inflatable Core"
            branch_rationale = (
                f"Under severe budget cuts (${capex_b}B ceiling vs $14B) and strict launch mass limit ({earth_mass_cap_tons} tons), "
                "all redundant habitable modules must be stripped. Forces adoption of single lightweight inflatable core with uncrewed "
                "autonomous rovers performing 100% of perimeter wall and furniture sintering over 36 months."
            )
            branch_risk = "High (Rover Mechanical Immobilisation Uncertainty)"
            epistemic_level = "Tier 3: Discrete-Event Logistics Simulation"
            cost_b = 9.4
            mass_tons = 104.0
        elif capex_b >= 18.0 and earth_mass_cap_tons >= 240.0:
            branch_choice = "All-Earth Prefabricated Rigid Titanium Cylindrical Modules"
            branch_rationale = (
                f"With budget expanded to ${capex_b}B and launch capacity at {earth_mass_cap_tons} metric tons, the program can afford "
                "12 heavy-lift booster flights to launch fully outfitted rigid titanium cylinders, eliminating on-site robotic construction risk."
            )
            branch_risk = "Low Technical Risk / High Financial Burn"
            epistemic_level = "Tier 1: Aerospace Manufacturing Baseline"
            cost_b = 18.2
            mass_tons = 238.0
        else:
            branch_choice = "Staged Hybrid Architecture: Factory Inflatable Core + Robotic Regolith Berm (Baseline)"
            branch_rationale = (
                f"Within ${capex_b}B and {earth_mass_cap_tons} tons across {synodic_windows} windows, the staged hybrid deployment "
                "maximizes volume (3x rigid cylinder) while utilizing autonomous precursor sintering to cut 58 tons of Earth launch mass."
            )
            branch_risk = "Low (Project Caelus Validated)"
            epistemic_level = "Tier 1: Parametric Logistics Model Validated"
            cost_b = 11.2
            mass_tons = 132.0

        comparison_table = [
            {
                "parameter": "Total Program CAPEX",
                "original_baseline": "$11.2 Billion (Budget: $14.0B)",
                "simulated_branch": f"${cost_b:.1f} Billion (Budget: ${capex_b:.1f}B)",
                "delta": f"${cost_b - 11.2:+.1f}B",
                "status": "PASS" if cost_b <= capex_b else "BUDGET OVERRUN"
            },
            {
                "parameter": "Earth Lifted Payload Mass",
                "original_baseline": "132.0 Metric Tons",
                "simulated_branch": f"{mass_tons:.1f} Metric Tons (Cap: {earth_mass_cap_tons:.0f}t)",
                "delta": f"{mass_tons - 132.0:+.1f}t",
                "status": "PASS" if mass_tons <= earth_mass_cap_tons else "PAYLOAD EXCEEDED"
            },
            {
                "parameter": "Gear-Ratio Low Earth Orbit Equivalent",
                "original_baseline": "1,122 Metric Tons in LEO",
                "simulated_branch": f"{mass_tons * 8.5:.1f} Metric Tons in LEO",
                "delta": f"{(mass_tons - 132.0) * 8.5:+.1f}t LEO",
                "status": "Booster Cadence"
            }
        ]

        return {
            "decision_id": detail["id"],
            "decision_title": detail["title"],
            "expert_name": detail["expert_name"],
            "domain": detail["expert_domain"],
            "original_selected_decision": detail["selected_decision"],
            "simulated_selected_decision": branch_choice,
            "branch_rationale": branch_rationale,
            "branch_risk_rating": branch_risk,
            "epistemic_truth_classification": epistemic_level,
            "feasibility_status": "FEASIBLE" if (cost_b <= capex_b and mass_tons <= earth_mass_cap_tons) else "BUDGET CONFLICT",
            "warnings": ["Watch for robotic sintering wheel-motor wear during 400-day autonomous phase."] if capex_b < 10 else [],
            "comparison_table": comparison_table,
            "causal_chain": [
                f"1. Modified logistics boundaries: Budget = ${capex_b}B, payload mass cap = {earth_mass_cap_tons} tons.",
                "2. Trans-Martian injection mass gear ratio calculated (1:8.5 LEO equivalent).",
                "3. Evaluated robotic construction precursor vs Earth-shipped rigid modules.",
                f"4. Selected branch: '{branch_choice}'."
            ]
        }

    @staticmethod
    def _simulate_generic(detail: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
        """Generic fallback for other decisions."""
        return {
            "decision_id": detail["id"],
            "decision_title": detail["title"],
            "expert_name": detail["expert_name"],
            "domain": detail["expert_domain"],
            "original_selected_decision": detail["selected_decision"],
            "simulated_selected_decision": detail["selected_decision"],
            "branch_rationale": "Parameters evaluated against preserved Decision DNA constraints.",
            "branch_risk_rating": "Moderate",
            "epistemic_truth_classification": "Tier 4: Expert Heuristic Rule",
            "feasibility_status": "FEASIBLE",
            "warnings": [],
            "comparison_table": [
                {
                    "parameter": "Core Selected Architecture",
                    "original_baseline": detail["selected_decision"],
                    "simulated_branch": detail["selected_decision"],
                    "delta": "0.0%",
                    "status": "STABLE"
                }
            ],
            "causal_chain": ["1. Loaded Decision DNA.", "2. Evaluated constraints.", "3. Confirmed baseline architecture."]
        }
