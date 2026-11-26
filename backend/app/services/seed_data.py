import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.entities import (
    User, Organization, Membership, Expert, ExpertProfile, Project, Document, KnowledgeRecord,
    Experience, Decision, DecisionAlternative, Evidence, Outcome,
    Lesson, CaseStudy, LearningChallenge, StudentSubmission, Assessment,
    SkillProfile, KnowledgeConflict, KnowledgeUpdate, KnowledgeVerification, ActivityLog
)

def seed_database(db: Session):
    """
    Seeds the database with the complete fictional aerospace engineering
    scenario for Dr. Alex Morgan, strictly labeled as SYNTHETIC DEMONSTRATION DATA.
    """
    # Check if already seeded
    from app.services.seed_additional_experts import seed_additional_experts
    from app.services.seed_living_extensions import seed_living_extensions

    existing_expert = db.query(Expert).filter(Expert.name == "Dr. Alex Morgan").first()
    if existing_expert:
        seed_additional_experts(db)
        seed_living_extensions(db)
        return

    # 1. Base Users
    admin_user = User(
        email="admin@echo.intel",
        hashed_password="scrypt:synthetic_hashed_pass_2026",
        full_name="ECHO Platform Administrator",
        role="admin",
        is_active=True
    )
    cadet_user = User(
        email="cadet.chen@echo.intel",
        hashed_password="scrypt:synthetic_hashed_pass_2026",
        full_name="Cadet Elena Chen",
        role="student",
        is_active=True
    )
    db.add_all([admin_user, cadet_user])
    db.flush()

    # 1B. Organization & Memberships (ECHO ENTERPRISE & FEDERATION)
    org = Organization(
        name="Advanced Aerothermal Propulsion & Spaceflight Directorate",
        code="AAPSD-ORBITAL",
        domain="Aerospace & Defense Systems",
        security_tier="tier_3_defense",
        description="Pioneering extreme-environment thermal protection, scramjet propulsion, and reusable hypersonic spacecraft systems."
    )
    db.add(org)
    db.flush()

    admin_user.organization_id = org.id
    cadet_user.organization_id = org.id

    mem1 = Membership(user_id=admin_user.id, organization_id=org.id, role="admin")
    mem2 = Membership(user_id=cadet_user.id, organization_id=org.id, role="member")
    db.add_all([mem1, mem2])

    # 2. Expert: Dr. Alex Morgan (SYNTHETIC DEMONSTRATION DATA)
    expert = Expert(
        user_id=admin_user.id,
        organization_id=org.id,
        name="Dr. Alex Morgan",
        title="Distinguished Fellow of Hypersonic Structures & High-Temperature Materials",
        organization="Advanced Aerothermal Propulsion & Spaceflight Directorate",
        domain="Aerospace Engineering & Materials Science",
        bio=(
            "[SYNTHETIC DEMONSTRATION DATA] Dr. Alex Morgan has spent over 22 years pioneering "
            "extreme-environment materials architecture for atmospheric re-entry vehicles, scramjet "
            "leading edges, and reusable orbital spacecraft. Known for bridging theoretical thermodynamics "
            "with pragmatic, fail-safe flight hardware manufacturing."
        ),
        avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        verification_status="verified",
        years_experience=22,
        is_synthetic_demo=True
    )
    db.add(expert)
    db.flush()

    # 3. Expert Profile Details
    expert_profile = ExpertProfile(
        expert_id=expert.id,
        summary="Specialist in Carbon-Silicon-Carbide Ceramic Matrix Composites (C/SiC), aerothermal boundary layer modeling, and structural reusability certification.",
        core_competencies=json.dumps([
            "Ceramic Matrix Composites (CMC)",
            "Hypersonic Aerothermodynamics",
            "Atmospheric Re-entry TPS Design",
            "Fracture Mechanics at >1600°C",
            "Aero-acoustic Structural Damping",
            "Ablative-to-Reusable Architecture Transitions"
        ]),
        awards_recognitions=json.dumps([
            "AIAA Aerospace Materials Excellence Medal (Synthetic, 2021)",
            "Orbital Flight Systems Engineering Laureate (Synthetic, 2018)",
            "Chief Technologist Commendation for Reusable Shield Innovations (Synthetic, 2014)"
        ]),
        career_milestones=json.dumps([
            {"year": "2004-2009", "role": "Senior Aerothermal Analyst", "org": "Orbital Flight Dynamics Group"},
            {"year": "2010-2017", "role": "Chief Materials Architect", "org": "Hypersonic Re-entry Program Alpha"},
            {"year": "2018-Present", "role": "Distinguished Fellow", "org": "Advanced Aerothermal Propulsion Directorate"}
        ]),
        publications=json.dumps([
            {"title": "Thermo-mechanical Failure Modes of C/SiC Panels under Mach 8 Shock Impingement", "year": "2020"},
            {"title": "Multi-cycle Microcracking Mitigation in Chemical Vapor Infiltrated Composites", "year": "2017"},
            {"title": "Comparative Trade Studies in Reusable Atmospheric Entry Vehicle Leading Edges", "year": "2013"}
        ])
    )
    db.add(expert_profile)

    # 4. Fictional Aerospace Projects
    proj1 = Project(
        expert_id=expert.id,
        title="Project Hyperion — Mach 7+ Atmospheric Transition Demonstrator",
        description="Next-generation sub-orbital re-entry flight vehicle qualifying reusable non-ablative nose cone and wing leading edge thermal protection assemblies.",
        domain="Aerospace Systems",
        start_date="2016",
        end_date="2021",
        role="Chief Materials Architect & Flight Systems Director",
        status="completed",
        is_synthetic_demo=True
    )
    proj2 = Project(
        expert_id=expert.id,
        title="Aegis-IV — Reusable Cryogenic Composite Tank Shielding",
        description="Dual-function aerothermal and structural mass optimization program integrating cryogenic liquid hydrogen containment with exterior thermal barrier shields.",
        domain="Materials & Propulsion",
        start_date="2021",
        end_date="2024",
        role="Principal Investigator",
        status="completed",
        is_synthetic_demo=True
    )
    db.add_all([proj1, proj2])
    db.flush()

    # 5. Documents & Source Provenance
    doc1 = Document(
        expert_id=expert.id,
        title="Hyperion Flight Test 04 — Post-Flight Structural Disassembly & Thermal Analysis",
        filename="Hyperion_FT04_Disassembly_Report_SYNTHETIC.pdf",
        file_path="./uploads/synthetic_hyperion_ft04.pdf",
        file_size=348210,
        file_type="pdf",
        processing_status="extracted",
        extracted_text=(
            "PROJECT HYPERION — FLIGHT TEST 04 RETROSPECTIVE (SYNTHETIC RECORD)\n"
            "Author: Dr. Alex Morgan, Lead Materials Architect.\n"
            "Summary: Inspection of the wing leading-edge sections following Mach 7.4 re-entry at 38 km altitude. "
            "Peak recorded surface temperature reached 1710°C at stagnation line. "
            "The graded C/SiC architecture maintained internal bondline temperatures below 185°C, satisfying all primary safety bounds. "
            "Crucially, ultrasonic C-scans revealed zero delamination along the fastener attachment flanges, validating the flexible isolator gasket choice."
        ),
        metadata_json=json.dumps({"classification": "Synthetic Demo", "pages": 14, "verified_by": "Dr. Alex Morgan"}),
        is_synthetic_demo=True
    )
    db.add(doc1)
    db.flush()

    # 6. Knowledge Records
    kr1 = KnowledgeRecord(
        expert_id=expert.id,
        project_id=proj1.id,
        document_id=doc1.id,
        title="Heuristic for Aerothermal Fastener Attachment Flanges",
        category="heuristic",
        content=(
            "When fastening brittle ceramic matrix composite (CMC) leading edges to metallic underlying airframe ribs, "
            "never torque bolts directly against bare composite laminates. Differential thermal expansion (CTE mismatch) "
            "between titanium substructure (8.6×10⁻⁶ /K) and C/SiC (2.1×10⁻⁶ /K) induces shear failure above 600°C. "
            "Always utilize spring-energized slotted conical collets with high-purity Grafoil compliance pads."
        ),
        key_takeaways=json.dumps([
            "Decouple metallic rib expansion from composite leading edges via slotted collets.",
            "Grafoil pads provide both thermal barrier and compliant shear relaxation.",
            "Torque tolerances must be calibrated for at-temperature expansion, not room temp."
        ]),
        source_reference="Hyperion FT-04 Disassembly Report, Section 6.2 (Synthetic)",
        verification_status="verified",
        confidence_score=0.98,
        is_synthetic_demo=True
    )
    kr2 = KnowledgeRecord(
        expert_id=expert.id,
        project_id=proj1.id,
        document_id=doc1.id,
        title="Graded Density Infiltration vs Uniform CVI in Reusable CMCs",
        category="methodology",
        content=(
            "Uniform chemical vapor infiltration creates premature surface crusting ('canning') that starves inner fiber tows. "
            "By implementing reverse thermal-gradient pulsed CVI, we achieved 93% bulk density with a 200-micron oxidation-resistant "
            "pure SiC outer skin that withstood 40 simulated plasma arc-jet runs without degradation."
        ),
        key_takeaways=json.dumps([
            "Pulsed CVI prevents premature surface pore closure.",
            "200-micron outer SiC seal layer blocks oxygen ingress up to 1750°C."
        ]),
        source_reference="Aero-Materials Symposium 2019 Keynote (Synthetic)",
        verification_status="verified",
        confidence_score=0.96,
        is_synthetic_demo=True
    )
    db.add_all([kr1, kr2])

    # 7. Signature Decision: Decision DNA
    dec1 = Decision(
        expert_id=expert.id,
        project_id=proj1.id,
        title="Leading Edge Material Architecture Selection for Reusable Mach 7+ Glider",
        problem_definition=(
            "Select and qualify a primary structural material architecture for the nose cap and wing leading edges of "
            "the Hyperion reusable hypersonic glider, capable of surviving repeated peak stagnation temperatures of 1700°C "
            "without ablation, while adhering to an aggressive total leading-edge weight budget of 145 kg."
        ),
        context=(
            "The program required minimum 15-flight reusability without depot-level replacement. The previous generation used "
            "phenolic-impregnated carbon ablators (PICA-X), which required complete nose-cap refurbishment after every mission, "
            "causing 4-month turnaround times and unsustainable operational costs."
        ),
        constraints=json.dumps([
            "Maximum continuous stagnation temperature: 1750°C",
            "Total mass allocated to leading-edge assemblies: ≤ 145.0 kg",
            "Zero in-flight ablative shape change to preserve aerodynamic lift-to-drag (L/D) ratio > 3.8",
            "Internal titanium structural bondline temperature must not exceed 200°C",
            "Must survive 160 dB acoustic buffet environment during atmospheric transition"
        ]),
        reasoning=(
            "While monolithic refractory metals (Tantalum-Hafnium-Carbide alloys) offer extraordinary temperature limits (>2400°C), "
            "their mass density (14.2 g/cm³) severely violated our payload limit, bringing assembly weight to 290 kg. "
            "Conversely, reinforced carbon-carbon (RCC) exhibits superb low density (1.6 g/cm³) but suffers rapid catastrophic "
            "oxidation above 500°C if the seal coating develops pinhole cracks during vibration. "
            "I chose a three-dimensionally woven Carbon-Silicon Carbide (C/SiC) composite manufactured via pulsed chemical vapor "
            "infiltration, paired with an internal multi-foil fibrous aerogel insulator. This offered the optimum balance: 2.1 g/cm³ "
            "density (128 kg total mass, well below our 145 kg ceiling) with self-healing boron-doped silicate crack sealing."
        ),
        selected_decision=(
            "3D-Woven Graded C/SiC Ceramic Matrix Composite with internal Titanium silicate aerogel insulation and Grafoil-isolated "
            "slotted mechanical mounting brackets."
        ),
        outcome=(
            "Flight Test 04 successfully completed 12.4 minutes of Mach 7.4 hypersonic glide. Post-flight disassembly confirmed zero "
            "structural micro-fractures, nose stagnation profile shape variance < 0.12 mm (zero perceptible ablation), and assembly weight "
            "was certified at 128.4 kg (-11.4% mass margin under budget)."
        ),
        lessons_learned=(
            "1. Thermal expansion compliance pads are as critical as the primary hot structure itself.\n"
            "2. Never rely on external spray coatings alone; boron silicate glass formers within the matrix provide autonomous crack healing.\n"
            "3. Flight telemetry must correlate real-time stagnation pressure with strain-gage acoustic harmonics to preempt flutter."
        ),
        confidence_rating=0.96,
        status="verified",
        is_synthetic_demo=True
    )
    db.add(dec1)
    db.flush()

    # 8. Decision Alternatives
    alt1 = DecisionAlternative(
        decision_id=dec1.id,
        title="Refractory Metal Alloy (Ta-10W / HfC Plasma-Clad)",
        description="High-density ductile refractory tungsten/tantalum alloy with hafnium carbide ultra-high-temperature protective outer barrier.",
        pros=json.dumps(["Immune to brittle fracture", "Operating ceiling > 2200°C", "Proven welding and machining protocols"]),
        cons=json.dumps(["Extreme density (14.2 g/cm³)", "Assembly mass reaches 288 kg (+98% over mass budget)", "High ductile-to-brittle transition temperature risk during ascent chill"]),
        why_rejected="Violated vehicle center-of-gravity and mass budget by 143 kg. Would have reduced scientific payload to zero.",
        estimated_risk="Extreme (Mass Budget Failure)"
    )
    alt2 = DecisionAlternative(
        decision_id=dec1.id,
        title="Reinforced Carbon-Carbon (RCC) with SiC Conversion Coating",
        description="Space Shuttle legacy baseline: 2D carbon-carbon substrate with silicon carbide chemical conversion outer diffusion layer.",
        pros=json.dumps(["Lowest mass density (1.6 g/cm³)", "High thermal shock resistance", "Decades of flight heritage"]),
        cons=json.dumps(["Susceptible to catalytic oxidation via microscopic coating crazing", "Low interlaminar shear strength (12 MPa)", "Extremely labor-intensive multi-stage seal repair"]),
        why_rejected="Acoustic vibration at 160 dB reliably initiates micro-cracks in the thin SiC conversion layer, leading to rapid catastrophic subsurface carbon oxidation during re-entry deceleration.",
        estimated_risk="High (Oxidation Burn-through)"
    )
    alt3 = DecisionAlternative(
        decision_id=dec1.id,
        title="Phenolic Impregnated Carbon Ablator (PICA-X Re-cast)",
        description="Low-density carbon fiber matrix impregnated with porous phenolic resin that pyrolyzes to absorb heat.",
        pros=json.dumps(["Very mature technology", "Low cost per flight set", "Predictable recession thermodynamics"]),
        cons=json.dumps(["Single-flight expendable only", "Ablative nose recession alters hypersonic aerodynamic trim", "Violated program core mandate for 15-flight reusability without overhaul"]),
        why_rejected="Rejected because aerodynamic mold-line alteration degraded hypersonic glide L/D ratio below 3.8 and required complete post-flight disassembly.",
        estimated_risk="Moderate (Mission Mandate Failure)"
    )
    db.add_all([alt1, alt2, alt3])

    # 9. Evidence Records
    ev1 = Evidence(
        decision_id=dec1.id,
        title="Arc-Jet Facility Run #AJ-882: 45-Cycle Mach 8 Aerothermal Exposure",
        evidence_type="empirical_test",
        content=(
            "Sample coupon of 3D-woven C/SiC subjected to 45 consecutive 90-second cycles in 1720°C air plasma stream at 0.35 atm. "
            "Mass loss was limited to 0.04% over entire test matrix. Flexural residual strength retained 96.2% of pristine control."
        ),
        source_url_or_ref="National Hypersonic Wind Tunnel Facility Run Log AJ-882 (Synthetic)",
        reliability_score=0.98,
        is_synthetic_demo=True
    )
    ev2 = Evidence(
        decision_id=dec1.id,
        title="Finite Element Anisotropic Thermal-Stress Simulation (Hyperion Model v3.4)",
        evidence_type="simulation_data",
        content=(
            "Coupled aerothermo-elastic FEA model predicting localized shear stress at leading-edge attachment points. "
            "Predicted peak shear of 18.4 MPa under 160 dB buffet; confirmed 1.8x safety factor when Grafoil compliance pads were modeled."
        ),
        source_url_or_ref="Internal Structural Simulation Archive FEA-HYP-342 (Synthetic)",
        reliability_score=0.94,
        is_synthetic_demo=True
    )
    db.add_all([ev1, ev2])

    # 10. Outcomes
    out1 = Outcome(
        decision_id=dec1.id,
        metric_name="Total Leading Edge Assembly Mass",
        expected_value="≤ 145.0 kg",
        actual_value="128.4 kg (-11.4% margin)",
        impact_summary="Enabled additional 16.6 kg of onboard scientific sensor payload while maintaining center-of-gravity stability.",
        time_horizon="Flight Test 04 Qualification (2021)",
        validation_method="High-precision digital metrology load-cell calibration"
    )
    out2 = Outcome(
        decision_id=dec1.id,
        metric_name="Surface Shape Recession after 12.4m Mach 7.4 Re-entry",
        expected_value="< 0.50 mm",
        actual_value="0.11 mm (Negligible)",
        impact_summary="Vehicle maintained exact predicted L/D ratio of 3.92 throughout the terminal approach, confirming aerodynamic stability.",
        time_horizon="Post-flight laser profilometry scan",
        validation_method="3D Coordinate Measuring Machine (CMM) inspection"
    )
    db.add_all([out1, out2])

    # 11. Lessons
    les1 = Lesson(
        decision_id=dec1.id,
        expert_id=expert.id,
        title="CTE Mismatch Mitigation in Fastener Bosses",
        category="technical",
        insight="Brittle hot structures never fail from average uniform thermal expansion; they fail from localized shear concentration at hard metallic boundary anchor points.",
        anti_pattern_to_avoid="Direct metal-to-composite bolting without compliant interfacial layers or slotted degrees of freedom.",
        recommended_practice="Implement spring-loaded Belleville washers with exfoliated flexible graphite gaskets to isolate mechanical expansion from thermal gradient growth.",
        is_synthetic_demo=True
    )
    les2 = Lesson(
        decision_id=dec1.id,
        expert_id=expert.id,
        title="Multi-Flight Self-Healing Matrix Chemistry",
        category="technical",
        insight="Surface oxidation barriers will develop transient micro-fissures under hypersonic thermal shocks. The interior matrix must carry an active phase-change sealant.",
        anti_pattern_to_avoid="Relying on external ceramic paint or single-pass CVD coats without internal matrix boron dopants.",
        recommended_practice="Incorporate sub-micron boron carbide particulate inside the carbon preform to form viscous boria-silica glass when exposed to oxygen at elevated temperatures.",
        is_synthetic_demo=True
    )
    db.add_all([les1, les2])

    # 12. Case Study (Intelligence Transfer Pillar)
    case1 = CaseStudy(
        expert_id=expert.id,
        decision_id=dec1.id,
        title="The Hypersonic Thermal Dilemma: Mach 7+ Leading Edge Material Architecture",
        summary="An aerospace engineering case study examining the trade-offs between refractory alloys, reinforced carbon-carbon, and ceramic matrix composites under severe aerothermal and mass constraints.",
        domain="Aerospace Engineering",
        industry="Space Exploration & Defense",
        background=(
            "As lead structures engineer for an uncrewed hypersonic glide research vehicle, you are tasked with specifying the "
            "thermal protection system for the wing leading edges. The vehicle enters the upper atmosphere at Mach 7.5, where "
            "stagnation temperatures peak at 1700°C for approximately 8 minutes. Reusability is paramount: the vehicle must fly "
            "10 missions with minimal ground turnaround inspection."
        ),
        core_dilemma=(
            "How do you design a reusable leading edge that will not oxidize, ablate, or suffer catastrophic thermal shock failure, "
            "while strictly respecting an all-up mass budget of 145 kg and an interface temperature constraint of 200°C on the titanium airframe?"
        ),
        technical_data=json.dumps({
            "peak_stagnation_heat_flux": "125 W/cm²",
            "peak_temperature": "1720°C",
            "glide_duration": "12.4 minutes",
            "mass_budget_kg": 145.0,
            "max_bondline_temp_c": 200,
            "aerodynamic_drag_tolerance": "< 3% variance over 10 flights"
        }),
        learning_objectives=json.dumps([
            "Analyze trade-offs between thermal tolerance, structural density, and oxidation kinetics.",
            "Formulate mechanical attachment strategies that accommodate severe CTE mismatch.",
            "Construct a multi-attribute decision matrix justifying material selection against quantifiable mission metrics.",
            "Evaluate self-healing composite chemistries versus passive sacrificial ablators."
        ]),
        difficulty="advanced",
        is_synthetic_demo=True
    )
    db.add(case1)
    db.flush()

    # 13. Practical Learning Challenge
    chal1 = LearningChallenge(
        case_study_id=case1.id,
        title="System Architecture Proposal: Leading Edge Material & Attachment Design",
        scenario_prompt=(
            "You are presenting to the Flight Safety and Technical Review Board. Provide a structured engineering proposal "
            "specifying your selected material architecture, interfacial thermal insulation system, and mechanical attachment mechanism. "
            "You must explicitly address: (1) Primary material selection and justification; (2) Reusability and oxidation protection; "
            "(3) Fastener/CTE mismatch mitigation; (4) Trade-off comparison against at least one rejected alternative."
        ),
        constraints=json.dumps([
            "Weight budget ≤ 145 kg total leading-edge weight",
            "Titanium interface rib temperature ≤ 200°C",
            "No consumable ablation permitted (zero shape change)",
            "Must provide analytical rationale for shear stress accommodation"
        ]),
        evaluation_rubric=json.dumps({
            "reasoning_clarity": "25 points: Logical progression from requirements to physics-based solution",
            "technical_soundness": "25 points: Accurate physics, thermal boundaries, and structural mechanics",
            "evidence_grounding": "25 points: Grounded in empirical test data and validated material properties",
            "alternative_analysis": "25 points: Comprehensive critique and risk justification of rejected paths"
        }),
        max_score=100
    )
    db.add(chal1)
    db.flush()

    # 14. Sample Student Submission (Elena Chen) & Assessment
    sub1 = StudentSubmission(
        challenge_id=chal1.id,
        user_id=cadet_user.id,
        student_name="Cadet Elena Chen",
        proposed_solution=(
            "I propose a 3D-woven carbon-fiber preform infiltrated with silicon carbide (C/SiC) matrix via pulsed chemical vapor "
            "infiltration, backed by a 25mm rigidized ceramic aerogel internal tile. The attachment to the titanium spar will use "
            "slotted refractory Inconel collets with Grafoil flexible graphite gaskets to isolate expansion."
        ),
        reasoning_steps=(
            "1. At Mach 7.4 stagnation heating (1700°C), monolithic metals are precluded by severe mass penalties (>280 kg for Ta-10W).\n"
            "2. Traditional RCC possesses adequate density but fails under vibration-induced micro-cracking and rapid oxygen burn-through.\n"
            "3. C/SiC provides structural density of ~2.2 g/cm³, allowing a leading edge shell mass of ~85 kg and aerogel insulation of ~32 kg (total 117 kg, safely inside the 145 kg ceiling).\n"
            "4. The slotted collets decouple thermal expansion between titanium (α=8.6) and C/SiC (α=2.1), preventing fastener shear failure."
        ),
        alternatives_considered=(
            "Considered Tantalum-10W alloy with HfC protective coating. Rejected strictly due to excessive mass (288 kg), which would have "
            "forced an unviable forward shift in vehicle center-of-mass, compromising glide pitch stability."
        ),
        evidence_cited="Referenced arc-jet plasma test benchmarks showing <0.05% mass loss for C/SiC at 1700°C air plasma over 40 cycles.",
        status="evaluated",
        score=94.5
    )
    db.add(sub1)
    db.flush()

    assessment1 = Assessment(
        submission_id=sub1.id,
        overall_score=94.5,
        reasoning_score=24.5,
        evidence_score=23.0,
        technical_score=24.0,
        problem_solving_score=23.0,
        comparative_analysis=(
            "Superb engineering submission. Elena's proposal mirrors the core physical principles established by Dr. Alex Morgan in "
            "Project Hyperion. Her analysis rigorously links thermodynamics to structural mechanics, correctly identifying that fastener "
            "thermal strain concentration represents the true failure point rather than raw material heat capacity."
        ),
        strengths=json.dumps([
            "Exact mass calculation showing 117 kg total assembly (19% mass safety margin).",
            "Clear mechanical decoupling scheme via slotted collets and Grafoil isolators.",
            "Accurate differentiation between oxidation kinetics of RCC versus self-healing C/SiC."
        ]),
        areas_for_improvement=json.dumps([
            "Consider transient acoustic resonant frequencies during hypersonic boundary layer transition (140-160 dB).",
            "Quantify the oxidation threshold of Grafoil in direct contact with aerated boundary air."
        ]),
        expert_comparison_notes=(
            "Dr. Alex Morgan's Historical Comment: 'Elena's grasp of the CTE mismatch dilemma is exceptional. In our early tests in 2017, "
            "we sheared three test brackets before adopting the exact slotted collet strategy she independently derived here.'"
        )
    )
    db.add(assessment1)

    # 15. Student Skill Portfolio
    skill1 = SkillProfile(
        user_id=cadet_user.id,
        skill_name="High-Temperature Materials Architecture",
        category="Aerospace Systems",
        mastery_level="Proficient",
        score_points=95,
        evidence_count=2,
        is_synthetic_demo=True
    )
    skill2 = SkillProfile(
        user_id=cadet_user.id,
        skill_name="Aerothermal Structural Trade Analysis",
        category="Systems Engineering",
        mastery_level="Proficient",
        score_points=92,
        evidence_count=2,
        is_synthetic_demo=True
    )
    skill3 = SkillProfile(
        user_id=cadet_user.id,
        skill_name="Differential Thermal Expansion (CTE) Mitigation",
        category="Mechanical Design",
        mastery_level="Expert",
        score_points=98,
        evidence_count=3,
        is_synthetic_demo=True
    )
    db.add_all([skill1, skill2, skill3])

    # 15B. Knowledge Evolution & Conflict Radar (SYSTEM 6: EVOLVE)
    conflict1 = KnowledgeConflict(
        title="Grafoil Interfacial Oxidation Temperature Threshold Disagreement",
        record_id_1=kr1.id,
        record_id_2=kr2.id,
        conflict_type="boundary_disagreement",
        description="Static furnace testing indicates Grafoil oxidation onset at 650°C, whereas hypersonic arc-jet flight data demonstrates stability up to 820°C due to oxygen boundary layer depletion.",
        expert_claim_a="Static lab furnace tests: Grafoil degrades above 650°C in atmospheric air.",
        expert_claim_b="Flight Telemetry & Arc-Jet Run AJ-882: Stagnation boundary layer flow limits net oxygen flux, allowing brief excursion to 820°C.",
        severity="high",
        resolution_status="under_review",
        resolution_notes="Recommend updating design manual to distinguish static heat soak vs dynamic stagnation shock conditions.",
        is_synthetic_demo=True
    )
    db.add(conflict1)

    update1 = KnowledgeUpdate(
        record_id=kr2.id,
        previous_content="Uniform Chemical Vapor Infiltration (CVI) at constant 1050°C was standard specification.",
        updated_content="Reverse thermal-gradient pulsed CVI achieving 93% bulk density with 200-micron oxidation skin.",
        reason_for_update="2014 flight tests revealed uniform CVI suffered premature surface crusting that starved core fiber bundles.",
        decay_indicator="superseded",
        new_evidence_ref="Arc-Jet Facility Run AJ-882",
        is_synthetic_demo=True
    )
    db.add(update1)

    verify1 = KnowledgeVerification(
        record_id=kr1.id,
        verified_by_expert_id=expert.id,
        verification_status="verified",
        verification_notes="Empirically confirmed during Project Hyperion post-flight disassembly inspection. Grafoil pads retained resilience.",
    )
    db.add(verify1)

    # 16. Activity Logs
    logs = [
        ActivityLog(
            user_id=admin_user.id,
            action_type="expert_created",
            entity_type="Expert",
            entity_id=expert.id,
            description="Preserved expert profile for Dr. Alex Morgan (Hypersonic Structures)."
        ),
        ActivityLog(
            user_id=admin_user.id,
            action_type="document_processed",
            entity_type="Document",
            entity_id=doc1.id,
            description="Extracted and indexed Hyperion Flight Test 04 Disassembly Report."
        ),
        ActivityLog(
            user_id=admin_user.id,
            action_type="decision_reconstructed",
            entity_type="Decision",
            entity_id=dec1.id,
            description="Reconstructed Decision DNA: Mach 7+ Leading Edge Material Architecture Selection."
        ),
        ActivityLog(
            user_id=admin_user.id,
            action_type="case_study_published",
            entity_type="CaseStudy",
            entity_id=case1.id,
            description="Published interactive Case Study: 'The Hypersonic Thermal Dilemma'."
        ),
        ActivityLog(
            user_id=cadet_user.id,
            action_type="challenge_evaluated",
            entity_type="StudentSubmission",
            entity_id=sub1.id,
            description="Evaluated Elena Chen's solution with score 94.5/100 (Proficient Mastery awarded)."
        )
    ]
    db.add_all(logs)

    db.commit()
    seed_additional_experts(db)
    seed_living_extensions(db)
    print("Database successfully seeded with Dr. Alex Morgan synthetic demonstration scenario!")
