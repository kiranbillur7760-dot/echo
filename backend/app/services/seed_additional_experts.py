import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.entities import (
    User, Organization, Expert, ExpertProfile, Project, Document, KnowledgeRecord,
    Decision, DecisionAlternative, Evidence, Outcome, Lesson, ActivityLog
)

def seed_elena_rostova(db: Session, admin_user: User, org: Organization):
    """Seed Dr. Elena Rostova - Bio-Regenerative Life Support & Ecological Engineering"""
    existing = db.query(Expert).filter(Expert.name == "Dr. Elena Rostova").first()
    if existing:
        return existing

    expert = Expert(
        user_id=admin_user.id,
        organization_id=org.id,
        name="Dr. Elena Rostova",
        title="Director of Closed-Loop Bioregenerative Systems & Astrobiology",
        organization="Biosphere & Deep Space Habitat Consortium",
        domain="Bio-Regenerative Life Support & Ecological Engineering",
        bio=(
            "[SYNTHETIC DEMONSTRATION DATA] Dr. Elena Rostova has 19 years of research specializing in "
            "Controlled Ecological Life Support Systems (CELSS), high-efficiency microalgae photobioreactors, "
            "and closed-loop wastewater catalytic purification for long-duration interplanetary missions."
        ),
        avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
        verification_status="verified",
        years_experience=19,
        is_synthetic_demo=True
    )
    db.add(expert)
    db.flush()

    profile = ExpertProfile(
        expert_id=expert.id,
        summary="Pioneering closed-loop biological life support, microalgal atmospheric scrubbing, and 98%+ water closure in extreme environments.",
        core_competencies=json.dumps([
            "Closed-Loop Bioregenerative Life Support (CELSS)",
            "Microalgae (Spirulina/Chlorella) Photobioreactor Design",
            "Catalytic Supercritical Water Oxidation (SCWO)",
            "Atmospheric CO2-to-O2 Biocatalysis",
            "Nutrient Loop Recovery & Hydroponic Substrates",
            "Space Microbiology & Pathogen Containment"
        ]),
        awards_recognitions=json.dumps([
            "COSPAR Space Life Sciences Laureate (Synthetic, 2022)",
            "International Ecological Closed-Cycle Pioneer Award (Synthetic, 2019)"
        ]),
        career_milestones=json.dumps([
            {"year": "2007-2014", "role": "Senior Astrobiologist", "org": "Biosphere Research Institute"},
            {"year": "2015-2021", "role": "Lead Architect, CELSS Protocols", "org": "Ares Habitat Simulator Alpha"},
            {"year": "2022-Present", "role": "Director of Bioregenerative Systems", "org": "Deep Space Consortium"}
        ]),
        publications=json.dumps([
            {"title": "Continuous Carbon Fixation in Microgravity Tubular Photobioreactors", "year": "2021"},
            {"title": "Multiphase Catalytic Graywater Recovery in Closed Ecoscapes", "year": "2018"}
        ])
    )
    db.add(profile)

    proj = Project(
        expert_id=expert.id,
        title="Ares Bio-Dome I — 500-Day Closed Ecological Simulation",
        description="Ground-based sealed multi-trophic human habitat test validating 98% water recovery and 31% caloric autotrophy for a 4-person crew.",
        domain="Ecological Engineering",
        start_date="2018",
        end_date="2022",
        role="Principal Investigator & Ecological Director",
        status="completed",
        is_synthetic_demo=True
    )
    db.add(proj)
    db.flush()

    doc = Document(
        expert_id=expert.id,
        title="Ares Bio-Dome I — 500-Day Ecological Mass Balance Synthesis Report",
        filename="Ares_BioDome_Mass_Balance_SYNTHETIC.pdf",
        file_path="./uploads/synthetic_ares_biodome.pdf",
        file_size=412900,
        file_type="pdf",
        processing_status="extracted",
        extracted_text=(
            "ARES BIO-DOME I FINAL RETROSPECTIVE (SYNTHETIC RECORD)\n"
            "Author: Dr. Elena Rostova, Lead Ecological Architect.\n"
            "Summary: Over 500 consecutive days of sealed isolation, the hybrid tubular photobioreactor "
            "maintained cabin oxygen at 21.0% ± 0.4% while consuming 100% of human metabolic CO2. "
            "Net water recycling through vacuum membrane distillation and UV catalytic oxidation achieved 98.4% efficiency. "
            "Spirulina biomass harvesting supplied 31.2% of the crew's daily dietary protein intake, reducing dry food mass by 420 kg."
        ),
        metadata_json=json.dumps({"classification": "Synthetic Demo", "pages": 28, "verified_by": "Dr. Elena Rostova"}),
        is_synthetic_demo=True
    )
    db.add(doc)
    db.flush()

    kr1 = KnowledgeRecord(
        expert_id=expert.id,
        project_id=proj.id,
        document_id=doc.id,
        title="Heuristic for Continuous Microalgae Culture in Low-Gravity Photobioreactors",
        category="heuristic",
        content=(
            "When culturing Chlorella vulgaris or Spirulina in closed loops, maintain culture optical density (OD680) "
            "between 2.2 and 2.8 with 580nm-tuned pulsed LED illumination. Decouple mechanical gas-phase accumulation "
            "from biological absorption: photosynthetic uptake exhibits a 15-30 minute kinetic latency, requiring a 50-liter "
            "pneumatic accumulator to buffer crew metabolic respiratory spikes."
        ),
        key_takeaways=json.dumps([
            "Pulsed 580nm LED lighting cuts photosynthetic thermal waste by 40%.",
            "Maintain OD680 between 2.2 and 2.8 to prevent cellular auto-shading.",
            "Gas buffer accumulators prevent crew hypercapnia during biological response lags."
        ]),
        source_reference="Ares Bio-Dome I Technical Monograph, Section 4.1",
        verification_status="verified",
        confidence_score=0.97,
        is_synthetic_demo=True
    )
    kr2 = KnowledgeRecord(
        expert_id=expert.id,
        project_id=proj.id,
        document_id=doc.id,
        title="Dual-Stage Catalytic UV-Oxidation for Martian Graywater Reclamation",
        category="methodology",
        content=(
            "Direct reverse osmosis of hygiene washwater rapidly fouls membranes due to long-chain fatty acids and skin lipids. "
            "Pre-filtering through an activated carbon bed followed by 185nm / 254nm dual-wavelength UV photolysis with titanium dioxide "
            "catalyst breaks down organic surfactants before membrane ingress, extending RO membrane operational lifespan by 400%."
        ),
        key_takeaways=json.dumps([
            "Pre-filter with activated carbon and titanium dioxide photocatalysis.",
            "Eliminates volatile organics and prevents membrane biofilm fouling.",
            "Guarantees >98% closed-loop water recovery."
        ]),
        source_reference="Journal of Life Support and Space Biology, 2020",
        verification_status="verified",
        confidence_score=0.96,
        is_synthetic_demo=True
    )
    db.add_all([kr1, kr2])

    dec = Decision(
        expert_id=expert.id,
        project_id=proj.id,
        title="Primary Atmospheric CO2 Scrubbing & Oxygen Generation System for Martian Surface Habitat",
        problem_definition=(
            "Select and architect the primary life support system to provide continuous oxygen (840 g/person/day) and remove "
            "toxic CO2 for a 6-person crew during an 18-month surface stay, constrained by an 850 kg payload mass and 4.2 kW "
            "total electrical power budget."
        ),
        context=(
            "Mechanical Sabatier and Bosch reactors are flight-proven but rely on consumable nickel-ruthenium catalysts and expendable "
            "hydrogen resupply. Purely biological open pond systems risk contamination and volume ballooning. The mission requires a "
            "robust, fail-safe hybrid approach."
        ),
        constraints=json.dumps([
            "Total dry mass allowance: ≤ 850 kg",
            "Maximum continuous electrical power: ≤ 4.2 kW",
            "Closed-loop water recycling efficiency: ≥ 98.0%",
            "Edible biomass nutritional offset: ≥ 25% crew daily caloric intake",
            "Autonomous stabilization time upon crew absence: < 4 hours"
        ]),
        reasoning=(
            "A purely mechanical Sabatier system demands 6.8 kW continuous power and zero food production, requiring 1,200 kg of additional "
            "dehydrated food cargo from Earth. Conversely, an open pond algae system is too prone to biofilm clogging. I designed a hybrid "
            "system coupling hollow-fiber helical tubular photobioreactors with an upstream solid-amine vacuum-desorption CO2 concentrator. "
            "This cut required electrical power to 3.8 kW by utilizing Martian daytime sunlight via parabolic solar light-pipes, while producing "
            "31% of the crew's daily protein needs as fresh spirulina paste."
        ),
        selected_decision=(
            "Hybrid Helical Tubular Microalgal Photobioreactor (Chlorella pyrenoidosa) coupled with Dual-Bed Solid Amine Vacuum Desorption "
            "(SAVD) and auxiliary proton-exchange membrane water electrolyzer."
        ),
        outcome=(
            "The system achieved 98.4% water recycling and 31.2% crew protein offset over the 500-day simulation. Cabin CO2 was kept below "
            "0.35% (nominal Earth baseline) with only 3.82 kW average power draw."
        ),
        lessons_learned=(
            "1. Biological lag times (15-45 minutes) require mechanical gas accumulators.\n"
            "2. Piezoelectric ultrasonic vibrations (42 kHz) completely prevent biofilm buildup on inner glass coils without lysing algae cells.\n"
            "3. Integrating food production directly into the life support cycle reduces interplanetary launch payload mass by >25%."
        ),
        confidence_rating=0.95,
        status="verified",
        is_synthetic_demo=True
    )
    db.add(dec)
    db.flush()

    alt1 = DecisionAlternative(
        decision_id=dec.id,
        title="Mechanical Sabatier Reactor + Bosch Carbon Deposition System",
        description="Thermo-catalytic reduction of CO2 with hydrogen over nickel catalyst producing water and solid graphite carbon.",
        pros=json.dumps(["Decades of ISS flight heritage", "Zero biological uncertainty", "Compact mechanical envelope"]),
        cons=json.dumps(["Continuous power draw reaches 6.8 kW (+62% over power budget)", "Catalyst poisoning risk from trace sulfur", "Produces zero edible caloric biomass"]),
        why_rejected="Exceeded the 4.2 kW power budget and forced launch of 1,200 kg extra food rations from Earth.",
        estimated_risk="High (Power & Resupply Failure)"
    )
    alt2 = DecisionAlternative(
        decision_id=dec.id,
        title="Supercritical Water Oxidation (SCWO) with Cyanobacteria Open Trays",
        description="High-temperature, high-pressure aqueous oxidation of human waste coupled with planar open algal growth tanks.",
        pros=json.dumps(["100% complete organic mineralization", "High theoretical reaction rate"]),
        cons=json.dumps(["Extreme operating pressure (22 MPa) creates explosive decompression risk in habitat", "Open tray algae easily contaminated by opportunistic bacteria", "Liquid sloshing vulnerability"]),
        why_rejected="22 MPa pressure lines inside crew living quarters presented unacceptable safety hazards.",
        estimated_risk="Extreme (Safety & Contamination)"
    )
    db.add_all([alt1, alt2])

    ev1 = Evidence(
        decision_id=dec.id,
        title="Ares Bio-Dome 500-Day Continuous Closed Mass Balance Telemetry",
        evidence_type="empirical_test",
        content="Continuous sensor telemetry recorded 98.4% water closure and stable 21% O2 / 0.35% CO2 cabin air across 500 days with 4 humans.",
        source_url_or_ref="Consortium Telemetry Database Run ARES-500-LOG",
        reliability_score=0.98,
        is_synthetic_demo=True
    )
    db.add(ev1)

    out1 = Outcome(
        decision_id=dec.id,
        metric_name="Closed-Loop Water Recovery Efficiency",
        expected_value="≥ 98.0%",
        actual_value="98.4% sustained over 18 months",
        impact_summary="Conserved 6,800 liters of water over the mission duration.",
        time_horizon="500-Day Habitat Simulation",
        validation_method="Gravimetric and inline conductivity flow metrology"
    )
    db.add(out1)

    les1 = Lesson(
        decision_id=dec.id,
        expert_id=expert.id,
        title="Piezoelectric Biofilm Prevention in Photobioreactors",
        category="technical",
        insight="Microalgae naturally form sticky EPS biofilms on transparent glass walls, attenuating light by up to 60% within 14 days. Continuous low-power 42 kHz acoustic waves disrupt adhesion without cell rupture.",
        anti_pattern_to_avoid="Relying on chemical biocides or mechanical wiper blades that scratch silica surfaces.",
        recommended_practice="Embed piezoelectric resonant transducers along tubular coils pulsing at 42 kHz for 5 seconds every minute.",
        is_synthetic_demo=True
    )
    db.add(les1)

    db.add(ActivityLog(
        user_id=admin_user.id,
        action_type="expert_created",
        entity_type="Expert",
        entity_id=expert.id,
        description="Preserved expert profile for Dr. Elena Rostova (Bio-Regenerative Life Support)."
    ))
    db.flush()
    return expert


def seed_marcus_vance(db: Session, admin_user: User, org: Organization):
    """Seed Dr. Marcus Vance - Extreme Nanomaterials & Radiation Shielding"""
    existing = db.query(Expert).filter(Expert.name == "Dr. Marcus Vance").first()
    if existing:
        return existing

    expert = Expert(
        user_id=admin_user.id,
        organization_id=org.id,
        name="Dr. Marcus Vance",
        title="Principal Research Scientist in Extreme Nanomaterials & Radiation Shielding",
        organization="Institute for Advanced Space Materials & Nuclear Technologies",
        domain="Materials Science & Nuclear Physics",
        bio=(
            "[SYNTHETIC DEMONSTRATION DATA] Dr. Marcus Vance has 24 years of experience specializing in "
            "high-Z/low-Z composite radiation shielding, Boron-Nitride Nanotubes (BNNT), and in-situ regolith "
            "microwave sintering for lunar and Martian planetary habitats."
        ),
        avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        verification_status="verified",
        years_experience=24,
        is_synthetic_demo=True
    )
    db.add(expert)
    db.flush()

    profile = ExpertProfile(
        expert_id=expert.id,
        summary="Specializing in Galactic Cosmic Radiation (GCR) mitigation, secondary neutron spallation suppression, and additive regolith sintering.",
        core_competencies=json.dumps([
            "Galactic Cosmic Radiation (GCR) & Solar Particle Event (SPE) Attenuation",
            "Boron-Nitride Nanotube (BNNT) Reinforced Polymers",
            "In-Situ Regolith Microwave Sintering & Additive Construction",
            "Secondary Neutron Spallation Mitigation",
            "Cryogenic High-Modulus Resins & Nanocomposites",
            "High-Z vs Low-Z Nuclear Fragmentation Modeling"
        ]),
        awards_recognitions=json.dumps([
            "Deep Space Radiation Protection Gold Cross (Synthetic, 2020)",
            "Materials Research Society Distinguished Pioneer Award (Synthetic, 2017)"
        ]),
        career_milestones=json.dumps([
            {"year": "2002-2010", "role": "Senior Nuclear Physicist", "org": "Particle Accelerator Radiation Laboratory"},
            {"year": "2011-2018", "role": "Chief Scientist, Advanced Nanocomposites", "org": "Institute for Space Materials"},
            {"year": "2019-Present", "role": "Principal Research Scientist", "org": "Nuclear & Planetary Materials Directorate"}
        ]),
        publications=json.dumps([
            {"title": "Secondary Neutron Suppression in Borated Polyethylene-BNNT Matrices", "year": "2020"},
            {"title": "Microwave Dielectric Heating of Basaltic Simulants in Vacuum", "year": "2016"}
        ])
    )
    db.add(profile)

    proj = Project(
        expert_id=expert.id,
        title="Titan Shield — Deep Space Habitation Radiation Wall Optimization",
        description="Multilayer composite shield design balancing Galactic Cosmic Ray attenuation and structural integrity for crew deep space habitats.",
        domain="Nuclear Materials Engineering",
        start_date="2017",
        end_date="2022",
        role="Principal Investigator",
        status="completed",
        is_synthetic_demo=True
    )
    db.add(proj)
    db.flush()

    doc = Document(
        expert_id=expert.id,
        title="Titan Shield Phase III — Radiation Attenuation & Structural Blast Test Report",
        filename="Titan_Shield_PhaseIII_Report_SYNTHETIC.pdf",
        file_path="./uploads/synthetic_titan_shield.pdf",
        file_size=389100,
        file_type="pdf",
        processing_status="extracted",
        extracted_text=(
            "TITAN SHIELD PHASE III SYNTHESIS (SYNTHETIC RECORD)\n"
            "Author: Dr. Marcus Vance, Lead Radiation Materials Scientist.\n"
            "Summary: Heavy ion beam tests at 1 GeV/nucleon 56Fe demonstrated that high-Z lead or aluminum alloys "
            "create dangerous secondary neutron showers. Incorporating hydrogenated BNNT / UHMWPE layered with an internal water wall "
            "reduced total biological dose equivalent to 118 mSv/year, well below the 150 mSv safety threshold. Areal mass was verified at 38.5 g/cm²."
        ),
        metadata_json=json.dumps({"classification": "Synthetic Demo", "pages": 22, "verified_by": "Dr. Marcus Vance"}),
        is_synthetic_demo=True
    )
    db.add(doc)
    db.flush()

    kr1 = KnowledgeRecord(
        expert_id=expert.id,
        project_id=proj.id,
        document_id=doc.id,
        title="Heuristic for Secondary Neutron Spallation Avoidance in Deep Space",
        category="heuristic",
        content=(
            "High-atomic-number (High-Z) materials like lead or tantalum produce intense secondary neutron showers when hit "
            "by relativistic iron nuclei (56Fe). Always place low-Z hydrogen-dense materials (UHMWPE or water jackets) "
            "behind structural metal shells to thermalize and absorb neutrons. Doping with Boron-10 captures thermalized neutrons "
            "without releasing hazardous gamma emissions."
        ),
        key_takeaways=json.dumps([
            "Avoid pure high-Z metal shells for Galactic Cosmic Ray (GCR) protection.",
            "Hydrogen-rich low-Z composites absorb relativistic nuclei without secondary spallation.",
            "Boron-10 capture cross-section neutralizes thermalized neutrons safely."
        ]),
        source_reference="Titan Shield Phase III Technical Synthesis, Section 5",
        verification_status="verified",
        confidence_score=0.98,
        is_synthetic_demo=True
    )
    kr2 = KnowledgeRecord(
        expert_id=expert.id,
        project_id=proj.id,
        document_id=doc.id,
        title="Microwave Sintering Parameters for Martian Regolith Simulant Bricks",
        category="methodology",
        content=(
            "Applying 2.45 GHz microwave radiation at 1.8 kW for 45 minutes induces dielectric breakdown in iron-oxide nanoparticles "
            "within Martian basaltic regolith simulant, fusing uncompressed soil into compressive load-bearing blocks exceeding 42 MPa "
            "without requiring chemical binder imports."
        ),
        key_takeaways=json.dumps([
            "2.45 GHz microwave energy couples with iron oxide in regolith.",
            "Produces 42 MPa compressive strength blocks with zero imported binder.",
            "Provides effective 1.2-meter protective radiation berm around habitats."
        ]),
        source_reference="Planetary Additive Manufacturing Symposium 2021",
        verification_status="verified",
        confidence_score=0.95,
        is_synthetic_demo=True
    )
    db.add_all([kr1, kr2])

    dec = Decision(
        expert_id=expert.id,
        project_id=proj.id,
        title="Radiation Shielding Topology for Long-Duration Deep Space Habitation Modules",
        problem_definition=(
            "Architect a radiation shielding system to limit Galactic Cosmic Ray (GCR) and Solar Particle Event (SPE) absorbed "
            "dose to < 150 mSv/year for a 1,000-day interplanetary mission, while strictly keeping areal mass below 42 g/cm²."
        ),
        context=(
            "Unshielded deep space radiation delivers ~600 mSv/year, causing severe cognitive degradation and long-term cancer risk. "
            "Traditional metallic shields produce lethal secondary neutrons that make total biological damage worse than no shielding."
        ),
        constraints=json.dumps([
            "Annual biological dose ceiling: < 150 mSv/year",
            "Areal mass limit: ≤ 42.0 g/cm²",
            "Structural tensile strength: ≥ 350 MPa",
            "Secondary neutron generation fraction: < 8% of total dose",
            "Operational lifetime: > 15 years in Cislunar/Martian space"
        ]),
        reasoning=(
            "A monolithic aluminum-lithium shell of sufficient thickness to absorb GCR would weigh over 110 g/cm², completely grounding "
            "the mission due to booster payload limits. Lead generates lethal secondary neutrons. I developed a graded functionally gradient "
            "architecture: an outer 3mm Nextel/Kevlar micrometeoroid bumper, followed by a 12mm hydrogenated Boron-Nitride Nanotube (BNNT) "
            "reinforced ultra-high-molecular-weight polyethylene (UHMWPE) core, backed by an inner potable water bladder wall. Boron-10 "
            "naturally captures thermalized neutrons without generating gamma radiation, achieving 118 mSv/year at only 38.5 g/cm²."
        ),
        selected_decision=(
            "Functionally Graded Multi-Layer Architecture: Outer Kevlar/Aerogel thermal-meteoroid bumper, intermediate Hydrogenated "
            "BNNT/UHMWPE structural core, and inner active fluid containment layer."
        ),
        outcome=(
            "Beamline validation at Brookhaven Space Radiation Laboratory confirmed an annual dose equivalent of 118.4 mSv/year "
            "(21% below NASA 150 mSv limit) at an areal density of 38.5 g/cm²."
        ),
        lessons_learned=(
            "1. Never use monolithic heavy metals for deep space radiation; hydrogen and light isotopes are king for GCR.\n"
            "2. Boron-10 enrichment in carbon/nanotube matrices prevents secondary neutron cascade hazards.\n"
            "3. Multi-functional integration (using potable graywater as passive radiation mass) reduces dry launch mass by >30%."
        ),
        confidence_rating=0.96,
        status="verified",
        is_synthetic_demo=True
    )
    db.add(dec)
    db.flush()

    alt1 = DecisionAlternative(
        decision_id=dec.id,
        title="Monolithic Aluminum-Lithium 2195 Shell",
        description="Traditional aerospace structural alloy increased to 45mm thickness to provide passive radiation attenuation.",
        pros=json.dumps(["Standard aerospace manufacturing", "High structural rigidity", "Low material cost"]),
        cons=json.dumps(["Areal mass reaches 115 g/cm² (+173% over mass limit)", "Heavy secondary neutron spallation cascades", "Severely cuts scientific payload to near zero"]),
        why_rejected="Massive weight penalty made the spacecraft impossible to launch with planned booster infrastructure.",
        estimated_risk="Extreme (Mass Budget Failure)"
    )
    alt2 = DecisionAlternative(
        decision_id=dec.id,
        title="Active Superconducting Magnetic Deflection Coil System",
        description="High-temperature superconducting coils generating an 8 Tesla toroidal magnetic field to deflect charged GCR particles.",
        pros=json.dumps(["Low passive structural mass", "High theoretical deflection efficiency for high-energy ions"]),
        cons=json.dumps(["Requires 35 kW continuous electrical power", "Cryogenic cooling failure triggers instant unshielded exposure", "Heavy fringe magnetic field interferes with crew electronics"]),
        why_rejected="High failure risk; single cooling pump malfunction causes total shield collapse in deep space.",
        estimated_risk="High (Single-Point Failure Hazard)"
    )
    db.add_all([alt1, alt2])

    ev1 = Evidence(
        decision_id=dec.id,
        title="Brookhaven National Laboratory Space Radiation Simulator Beamline Test #BNL-GCR-404",
        evidence_type="empirical_test",
        content="Irradiated multi-layer BNNT/UHMWPE sample with 1 GeV/nucleon 56Fe ion beam. Transmitted dose equivalent was 118.4 mSv/year with negligible neutron spallation.",
        source_url_or_ref="BNL Accelerator Test Log #404-TITAN",
        reliability_score=0.99,
        is_synthetic_demo=True
    )
    db.add(ev1)

    out1 = Outcome(
        decision_id=dec.id,
        metric_name="Annual Equivalent Radiation Dose",
        expected_value="< 150.0 mSv/yr",
        actual_value="118.4 mSv/yr (-21% safety margin)",
        impact_summary="Permits up to 1,200 days of interplanetary transit without exceeding astronaut career exposure limits.",
        time_horizon="1,000-Day Deep Space Mission",
        validation_method="Calibrated tissue-equivalent proportional counters (TEPC)"
    )
    db.add(out1)

    les1 = Lesson(
        decision_id=dec.id,
        expert_id=expert.id,
        title="Active Fluid Integration for Parasitic Mass Elimination",
        category="technical",
        insight="A human crew requires ~4,000 kg of water on board. Placing water tanks inside perimeter wall cavities provides dual-benefit radiation protection without adding parasitic shield mass.",
        anti_pattern_to_avoid="Designing dedicated lead or tungsten blankets while storing water tanks centrally in the habitat.",
        recommended_practice="Route life-support graywater and fresh water supply lines directly through circumferential honeycomb wall voids.",
        is_synthetic_demo=True
    )
    db.add(les1)

    db.add(ActivityLog(
        user_id=admin_user.id,
        action_type="expert_created",
        entity_type="Expert",
        entity_id=expert.id,
        description="Preserved expert profile for Dr. Marcus Vance (Radiation Shielding & Nanomaterials)."
    ))
    db.flush()
    return expert


def seed_sarah_lin(db: Session, admin_user: User, org: Organization):
    """Seed Director Sarah Lin - Orbital Logistics & Space Architecture Economics"""
    existing = db.query(Expert).filter(Expert.name == "Director Sarah Lin").first()
    if existing:
        return existing

    expert = Expert(
        user_id=admin_user.id,
        organization_id=org.id,
        name="Director Sarah Lin",
        title="Head of Orbital Logistics & Deep Space Infrastructure Economics",
        organization="Interplanetary Supply Chain & Orbital Architecture Directorate",
        domain="Systems Engineering & Space Economics",
        bio=(
            "[SYNTHETIC DEMONSTRATION DATA] Director Sarah Lin is an orbital logistics strategist with 21 years of "
            "experience directing planetary supply chain architectures, lunar fuel depot logistics, and the economic "
            "break-even modeling of In-Situ Resource Utilization (ISRU) versus Earth-launch freight."
        ),
        avatar_url="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
        verification_status="verified",
        years_experience=21,
        is_synthetic_demo=True
    )
    db.add(expert)
    db.flush()

    profile = ExpertProfile(
        expert_id=expert.id,
        summary="Architecting resilient interplanetary supply networks, payload mass 'gear ratios', and ISRU capital expenditure optimization.",
        core_competencies=json.dumps([
            "Trans-Martian Injection Mass 'Gear Ratio' Optimization",
            "In-Situ Resource Utilization (ISRU) Economic Break-Even Modeling",
            "Modular In-Orbit Assembly & Robotic Staging",
            "Supply Chain Resilience & Redundant Spare Part Manifesting",
            "Lifecycle Capex/Opex Modeling for Deep Space Exploration",
            "Mission Risk & Redundancy Multi-Attribute Trade Studies"
        ]),
        awards_recognitions=json.dumps([
            "AIAA Space Systems Engineering Leadership Medal (Synthetic, 2021)",
            "Interplanetary Logistics Innovation Award (Synthetic, 2018)"
        ]),
        career_milestones=json.dumps([
            {"year": "2005-2012", "role": "Senior Trajectory & Freight Analyst", "org": "Commercial Launch Services"},
            {"year": "2013-2019", "role": "Director of Space Logistics & Cislunar Staging", "org": "Gateway Architecture Office"},
            {"year": "2020-Present", "role": "Head of Orbital Logistics", "org": "Interplanetary Supply Chain Directorate"}
        ]),
        publications=json.dumps([
            {"title": "Parametric Break-Even Economics of Lunar Propellant Harvesting", "year": "2020"},
            {"title": "The Gear Ratio Tax: Compounding Mass Inefficiencies in Mars Surface Architectures", "year": "2017"}
        ])
    )
    db.add(profile)

    proj = Project(
        expert_id=expert.id,
        title="Project Caelus — Trans-Martian Logistics Manifest & Depot Optimization",
        description="High-efficiency multi-launch orbital assembly cadence and fuel depot architecture reducing total mission cost by $3.4B.",
        domain="Space Logistics & Systems Economics",
        start_date="2019",
        end_date="2023",
        role="Program Director",
        status="completed",
        is_synthetic_demo=True
    )
    db.add(proj)
    db.flush()

    doc = Document(
        expert_id=expert.id,
        title="Project Caelus Final Architecture & Capex Optimization Report",
        filename="Project_Caelus_Logistics_Report_SYNTHETIC.pdf",
        file_path="./uploads/synthetic_project_caelus.pdf",
        file_size=428500,
        file_type="pdf",
        processing_status="extracted",
        extracted_text=(
            "PROJECT CAELUS FINAL REPORT (SYNTHETIC RECORD)\n"
            "Author: Director Sarah Lin, Head of Orbital Logistics.\n"
            "Summary: Every 1 kg of hardware delivered to the Martian surface demands ~8.5 kg of initial payload in Low Earth Orbit. "
            "Launching fully assembled rigid titanium habitats requires 12 heavy-lift booster launches costing $18.2B. "
            "By deploying a factory-tested inflatable core shelter coupled with two autonomous regolith sintering rovers to build an exterior "
            "radiation berm over 18 months of uncrewed precursor operations, Earth launch mass was reduced by 58 metric tons, saving $3.2B."
        ),
        metadata_json=json.dumps({"classification": "Synthetic Demo", "pages": 34, "verified_by": "Director Sarah Lin"}),
        is_synthetic_demo=True
    )
    db.add(doc)
    db.flush()

    kr1 = KnowledgeRecord(
        expert_id=expert.id,
        project_id=proj.id,
        document_id=doc.id,
        title="The Gear-Ratio Penalty in Interplanetary Transport Logistics",
        category="heuristic",
        content=(
            "For every 1 kg of dry mass landed on Mars, between 7.5 and 11 kg of propellant and hardware must be lifted to Low Earth Orbit. "
            "Shaving 100 kg from surface habitat payload saves over 800 kg of initial launch mass and $4.8M in booster procurement. "
            "Never import mass from Earth that can be mechanically gathered or sintered from local planetary materials."
        ),
        key_takeaways=json.dumps([
            "1 kg of surface payload requires 7.5 - 11 kg of LEO booster mass.",
            "Shaving 100 kg of surface mass saves ~$4.8M in direct launch procurement.",
            "Local in-situ materials should always replace passive Earth-shipped shielding mass."
        ]),
        source_reference="Project Caelus Final Architecture Report, Section 2.3",
        verification_status="verified",
        confidence_score=0.99,
        is_synthetic_demo=True
    )
    kr2 = KnowledgeRecord(
        expert_id=expert.id,
        project_id=proj.id,
        document_id=doc.id,
        title="ISRU Infrastructure Break-Even Threshold Heuristic",
        category="methodology",
        content=(
            "In-situ resource utilization (ISRU) machinery carries upfront development and landing risks. ISRU becomes economically "
            "superior to Earth-shipped spares only if the mission operates for more than 2 synodic windows (52 months) or produces "
            "> 40 metric tons of finished water, propellant, or sintering mass. For short sortie missions, Earth resupply remains cheaper."
        ),
        key_takeaways=json.dumps([
            "ISRU break-even point requires ≥ 2 synodic windows or > 40 tons produced.",
            "Short duration missions should prioritize Earth-supplied consumables.",
            "Long-duration planetary bases achieve exponential ROI via autonomous robotic precursors."
        ]),
        source_reference="Space Systems Economics Journal, Vol 14",
        verification_status="verified",
        confidence_score=0.97,
        is_synthetic_demo=True
    )
    db.add_all([kr1, kr2])

    dec = Decision(
        expert_id=expert.id,
        project_id=proj.id,
        title="Surface Infrastructure Deployment: Earth-Shipped Prefabricated Modules vs Robotic ISRU Regolith Construction",
        problem_definition=(
            "Select the primary surface infrastructure deployment architecture for an initial 12-person Martian outpost within "
            "a $14B capital expenditure budget and 3 consecutive launch windows."
        ),
        context=(
            "Launching fully assembled rigid titanium habitat structures from Earth requires 9 heavy-lift launches at extreme cost "
            "and creates a single-point failure risk during atmospheric entry and landing. Conversely, relying 100% on unproven robotic "
            "3D-printing rovers presents severe operational schedule risk."
        ),
        constraints=json.dumps([
            "Total mission hardware & launch CAPEX: ≤ $14.0 Billion",
            "Total Earth-lifted payload mass: ≤ 180 metric tons across 3 launch windows",
            "Habitat pressurized volume per person: ≥ 45 m³",
            "Operational readiness for crew ingress: < 30 days after human arrival",
            "Reliability certification threshold: 99.9% structural integrity under 100-year dust storms"
        ]),
        reasoning=(
            "An all-Earth-fabricated approach would consume $18.2B, exceeding budget by $4.2B, and requiring 12 heavy-lift boosters. "
            "Fully robotic autonomous excavation before human landing carried unacceptable 34% probability of mechanical immobilisation "
            "during sintering rovers' autonomous phase. I selected a two-tier phased hybrid: Launch a compact, factory-tested deployable "
            "inflatable Kevlar/Vectran core module (providing immediate safe haven with zero assembly), followed by 2 autonomous regolith "
            "excavation rovers that pile and microwave-sinter a 1.2m thick regolith radiation berm over the dome over an 18-month uncrewed "
            "precursor period. This minimized Earth launch mass by 58 tons while eliminating human crew exposure to construction risks."
        ),
        selected_decision=(
            "Staged Hybrid Architecture: Factory-integrated deployable inflatable pressure vessel with autonomous robotic regolith shielding "
            "berm pre-construction."
        ),
        outcome=(
            "Saved $2.8B against the $14B budget ceiling ($11.2B total spend). Total Earth-lifted payload was held to 132 metric tons "
            "(26% margin under 180t cap). The robotic sintering rovers completed the 1.2m protective berm 4 months ahead of crew landing."
        ),
        lessons_learned=(
            "1. Never send human crews to construct heavy radiation shielding on planetary surfaces; heavy mass operations must either be completed autonomously prior to crew arrival or avoided via inflatable geometries.\n"
            "2. The 'gear ratio' dictates that any kilogram saved on the planetary surface saves 8-10 kilograms in Low Earth Orbit.\n"
            "3. Staged hybrid architectures de-risk missions by decoupling immediate atmospheric survival from long-term radiation hardening."
        ),
        confidence_rating=0.97,
        status="verified",
        is_synthetic_demo=True
    )
    db.add(dec)
    db.flush()

    alt1 = DecisionAlternative(
        decision_id=dec.id,
        title="All-Earth Prefabricated Rigid Titanium Cylindrical Modules",
        description="Deliver fully outfitted, rigid welded titanium modules on multiple heavy landers.",
        pros=json.dumps(["Zero on-site construction risk", "Pre-certified clean-room plumbing and wiring", "Immediate crew occupancy upon landing"]),
        cons=json.dumps(["Requires 12 heavy-lift booster launches", "Total mission cost of $18.2B (+30% over budget)", "Volumetric payload envelope restricted by 9-meter rocket fairing diameter"]),
        why_rejected="Exceeded budget ceiling by $4.2 Billion and pushed required launch cadence beyond booster fleet capacity.",
        estimated_risk="Extreme (Cost & Schedule Overrun)"
    )
    alt2 = DecisionAlternative(
        decision_id=dec.id,
        title="100% Autonomous Robotic Subsurface Tunnel Boring",
        description="Land heavy autonomous boring machines to excavate underground lava tubes and seal interior walls before crew landing.",
        pros=json.dumps(["Ultimate radiation shielding (10+ meters of basalt rock overhead)", "Zero surface dust storm vulnerability"]),
        cons=json.dumps(["Severe mechanical failure risk in uncharacterized geological strata", "Excavation machine mass exceeds 60 metric tons", "High likelihood of cutter-head jamming before crew arrives"]),
        why_rejected="34% calculated probability of unrecoverable cutter-head seizure without human mechanics present.",
        estimated_risk="High (Uncharacterized Subsurface Hazards)"
    )
    db.add_all([alt1, alt2])

    ev1 = Evidence(
        decision_id=dec.id,
        title="Project Caelus Parametric Life-Cycle Cost Model v4.1",
        evidence_type="simulation_data",
        content="Monte Carlo simulation across 10,000 launch iterations confirmed $3.2B median cost savings and 99.4% probability of mission completion within 3 synodic windows for hybrid deployable architecture.",
        source_url_or_ref="Orbital Logistics Directorate Archive #CAELUS-MC-41",
        reliability_score=0.97,
        is_synthetic_demo=True
    )
    db.add(ev1)

    out1 = Outcome(
        decision_id=dec.id,
        metric_name="Total Program Capital Expenditure",
        expected_value="≤ $14.0 Billion",
        actual_value="$11.2 Billion (-$2.8B under budget)",
        impact_summary="Freed $2.8B in capital reserves to fund surface science rovers and redundant life support spares.",
        time_horizon="3 Synodic Windows (6.5 Years)",
        validation_method="Audited Defense Logistics Contract Accounting"
    )
    db.add(out1)

    les1 = Lesson(
        decision_id=dec.id,
        expert_id=expert.id,
        title="The Inflatable Deployment Advantage in Planetary Architecture",
        category="operational",
        insight="Inflatable Kevlar/Vectran structures pack into 1/4 the fairing volume of rigid cylinders while providing 3x the usable pressurized living volume once inflated. This resolves the rocket fairing volumetric bottleneck.",
        anti_pattern_to_avoid="Insisting on rigid aluminum or titanium pressure shells for planetary habitats.",
        recommended_practice="Use multi-layer inflatable pressure vessels coupled with autonomous external regolith sintering for radiation and micrometeoroid protection.",
        is_synthetic_demo=True
    )
    db.add(les1)

    db.add(ActivityLog(
        user_id=admin_user.id,
        action_type="expert_created",
        entity_type="Expert",
        entity_id=expert.id,
        description="Preserved expert profile for Director Sarah Lin (Orbital Logistics & Systems Economics)."
    ))
    db.flush()
    return expert


def seed_additional_experts(db: Session):
    """Seed all additional domain experts if they are not already present."""
    admin_user = db.query(User).filter(User.email == "admin@echo.intel").first()
    org = db.query(Organization).first()

    if not admin_user or not org:
        return

    seed_elena_rostova(db, admin_user, org)
    seed_marcus_vance(db, admin_user, org)
    seed_sarah_lin(db, admin_user, org)
    db.commit()
    print("Successfully seeded Dr. Elena Rostova, Dr. Marcus Vance, and Director Sarah Lin!")
