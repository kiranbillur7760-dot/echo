import {
  OverviewDashboard,
  Expert,
  ExpertDetail,
  KnowledgeRecord,
  DecisionDNA,
  DecisionReplayResult,
  SimulationResult,
  AskEchoResult,
  CaseStudy,
  StudentSubmission,
  SkillProfile,
  KnowledgeGraphData,
  EvolutionRadar,
  NetworkOverview,
  MultiExpertComparison,
  DocumentItem,
  CouncilChallenge,
  CouncilDeliberationResult,
  TimeMachineDecision,
  TimeMachineDecisionDetail,
  TimeMachineSimulationResult
} from '../types';

const API_BASE = '/api';

// Safe helper for requests with optional fallback
async function safeFetch<T>(url: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      if (fallback !== undefined) return fallback;
      throw new Error(`HTTP error ${res.status} from ${url}`);
    }
    return await res.json();
  } catch (err) {
    if (fallback !== undefined) return fallback;
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Overview
  getOverview: async (): Promise<OverviewDashboard> => {
    return safeFetch<OverviewDashboard>(`${API_BASE}/overview/dashboard`, undefined, {
      metrics: {
        expert_profiles_count: 1,
        knowledge_records_count: 2,
        decisions_documented_count: 1,
        case_studies_count: 1,
        total_evidence_pieces: 2,
        simulation_runs: 14,
      },
      recent_activities: [
        {
          id: 1,
          action_type: 'decision_reconstructed',
          entity_type: 'Decision',
          entity_id: 1,
          description: "Reconstructed Decision DNA: 'Leading Edge Material Architecture Selection for Reusable Mach 7+ Glider'.",
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          action_type: 'document_processed',
          entity_type: 'Document',
          entity_id: 1,
          description: "Processed technical report 'Hyperion Mach 7.4 TPS Post-Flight Structural Disassembly' for Dr. Alex Morgan.",
          created_at: new Date().toISOString(),
        },
      ],
      todays_insight: {
        title: 'Thermal Decoupling via Slotted Inconel Collets',
        expert: 'Dr. Alex Morgan',
        domain: 'Hypersonic Structures',
        summary: 'Direct rigid fastener through-bolting in C/SiC leading edges causes instantaneous shear fracture at Mach 6.8 boundary layer transition. Grafoil compliance pads with slotted collets allow unconstrained metallic rib expansion.',
        quote: 'Never rigidly clamp a ceramic matrix composite to a titanium substructure. Thermal expansion differential is a physical law, not a mechanical suggestion.',
      },
      active_research: [
        { title: 'Project Hyperion Mach 7+ TPS', status: 'Flight Verified (Mach 7.4)', trl: 'TRL 8' },
        { title: 'Pulsed Chemical Vapor Infiltration for C/SiC', status: 'Patent Granted', trl: 'TRL 9' },
        { title: 'Monolithic UHTC Shock-Shock Cowl Leading Edges', status: 'Arc-Jet Qualified', trl: 'TRL 6' },
      ],
      top_expertise_areas: [
        { name: 'Ceramic Matrix Composites (CMC)', count: 18, growth: '+24%' },
        { name: 'Hypersonic Aerothermodynamics', count: 14, growth: '+18%' },
        { name: 'Atmospheric Re-entry TPS Design', count: 12, growth: '+15%' },
        { name: 'Aero-acoustic Structural Damping', count: 9, growth: '+30%' },
      ],
    });
  },

  // Experts
  getExperts: async (): Promise<Expert[]> => {
    return safeFetch<Expert[]>(`${API_BASE}/experts`, undefined, [
      {
        id: 1,
        name: 'Dr. Alex Morgan',
        title: 'Distinguished Fellow of Hypersonic Structures & High-Temperature Materials',
        organization: 'AeroAstra Defense & Orbital Systems',
        domain: 'Aerospace Engineering',
        bio: 'Over 28 years pioneering ceramic matrix composite (CMC) leading edges, aerothermal boundary layer transitions, and thermal protection architectures for Mach 5-9 hypersonic glide vehicles.',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        verification_status: 'verified',
        years_experience: 28,
        is_synthetic_demo: true,
        created_at: new Date().toISOString(),
      },
    ]);
  },

  getExpertDetail: async (id: number): Promise<ExpertDetail> => {
    return safeFetch<ExpertDetail>(`${API_BASE}/experts/${id}`, undefined, {
      id,
      name: 'Dr. Alex Morgan',
      title: 'Distinguished Fellow of Hypersonic Structures & High-Temperature Materials',
      organization: 'AeroAstra Defense & Orbital Systems',
      domain: 'Aerospace Engineering',
      bio: 'Over 28 years pioneering ceramic matrix composite (CMC) leading edges, aerothermal boundary layer transitions, and thermal protection architectures for Mach 5-9 hypersonic glide vehicles.',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      verification_status: 'verified',
      years_experience: 28,
      is_synthetic_demo: true,
      created_at: new Date().toISOString(),
      profile: {
        summary: 'Specialist in hot-structures for atmospheric re-entry and sustained hypersonic cruise.',
        core_competencies: [
          'Ceramic Matrix Composites (CMC)',
          'Hypersonic Aerothermodynamics',
          'Atmospheric Re-entry TPS Design',
          'Aero-acoustic Structural Damping',
          'Thermal Barrier Coatings',
        ],
        awards_recognitions: [
          'AIAA Aerospace Materials Excellence Medal (2021)',
          'Orbital Flight Systems Engineering Laureate (2018)',
        ],
        career_milestones: [
          { year: '2023 - Present', role: 'Distinguished Fellow', org: 'AeroAstra Defense & Orbital Systems' },
          { year: '2015 - 2023', role: 'Chief Materials Architect', org: 'National Hypersonic Flight Initiative' },
        ],
        publications: [
          { title: 'Thermal Stress Decoupling in C/SiC Fastened Assemblies at Mach 7.4', year: '2023' },
          { title: 'Aero-acoustic Failure Thresholds in Monolithic Hafnium Diboride', year: '2020' },
        ],
      },
      projects: [
        {
          id: 1,
          title: 'Project Hyperion Mach 7+ Glide Vehicle',
          description: 'Autonomous high-altitude hypersonic glide test vehicle demonstrating non-ablative, reusable sharp leading edges.',
          domain: 'Hypersonic Aerodynamics',
          role: 'Lead Thermal Protection System (TPS) Architect',
          status: 'Flight Tested (Mach 7.4 Qualification Achieved)',
        },
      ],
      decisions: [
        {
          id: 1,
          title: 'Leading Edge Material Architecture Selection for Reusable Mach 7+ Glider',
          problem: 'Primary thermal protection system (TPS) for Mach 7+ nose cap experiencing 1750Â°C and 160 dB acoustic buffeting.',
          selected_decision: 'Selected 3D-woven Carbon-Fiber Reinforced Silicon Carbide (C/SiC) matrix composite with slotted attachment collets.',
          confidence: 0.98,
          status: 'verified',
        },
      ],
    });
  },

  createExpert: async (data: Partial<Expert>): Promise<Expert> => {
    const res = await fetch(`${API_BASE}/experts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create expert');
    return res.json();
  },

  // Documents
  uploadDocument: async (formData: FormData) => {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload document');
    return res.json();
  },

  getDocuments: async (): Promise<DocumentItem[]> => {
    return safeFetch<DocumentItem[]>(`${API_BASE}/documents`, undefined, [
      {
        id: 1,
        expert_id: 1,
        title: 'Project Hyperion Mach 7.4 TPS Post-Flight Structural Disassembly Report',
        filename: 'Hyperion_Flight_04_Structural_Disassembly_Report.pdf',
        file_size: 148920,
        file_type: 'pdf',
        processing_status: 'extracted',
        extracted_text: 'PROJECT HYPERION â€” FLIGHT TEST 04 TECHNICAL DISASSEMBLY REPORT\nPrincipal Investigator: Dr. Alex Morgan\nVehicle: Autonomous Hypersonic Glider Alpha-4\nPeak Stagnation Temperature Recorded: 1738Â°C at Mach 7.42 altitude 31,400m.\nThermal Protection System Disassembly Analysis:\n1. The 3D-woven C/SiC nose cap and wing leading edges exhibited zero surface spallation and no micro-crack propagation.\n2. Inconel slotted fastener collets successfully accommodated 3.4mm longitudinal thermal expansion without shear strain.\n3. Grafoil compliance gaskets retained 94% elasticity post-flight without oxidation.',
        metadata_json: JSON.stringify({
          candidate_records: [
            {
              title: 'Slotted Inconel Collet Expansion Decoupling',
              category: 'heuristic',
              content: 'Accommodates 3.4mm differential expansion between CMC shell and metallic airframe.',
            },
          ],
        }),
        is_synthetic_demo: true,
        created_at: new Date().toISOString(),
      },
    ]);
  },

  // Knowledge
  getKnowledgeRecords: async (params?: { category?: string; search?: string }): Promise<KnowledgeRecord[]> => {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    return safeFetch<KnowledgeRecord[]>(`${API_BASE}/knowledge/records?${query.toString()}`, undefined, [
      {
        id: 1,
        expert_id: 1,
        title: 'Heuristic for Aerothermal Fastener Attachment Flanges',
        category: 'heuristic',
        content: 'When joining ceramic matrix composites (CTE 2.8-4.5 x 10^-6 /K) to internal metallic titanium/inconel rib spars (CTE 8.6-14.0 x 10^-6 /K), direct rigidly-torqued through-bolts guarantee shear fracture at Mach 6.8+ thermal transition. Always utilize slotted refractory collets with flexible Grafoil compliance pads allowing unconstrained radial slip.',
        key_takeaways: [
          'Direct rigid through-bolting C/SiC to titanium causes instantaneous fastener shear fracture under hypersonic thermal expansion gradient.',
          'Slotted collets accommodate differential thermal expansion of up to 4.2mm along the chordwise axis.',
          'Grafoil compliance gaskets provide aerothermal sealing while preventing local stress concentration.',
        ],
        source_reference: 'Project Hyperion Mach 7.4 TPS Post-Flight Structural Disassembly Report (2024)',
        verification_status: 'verified',
        confidence_score: 0.98,
        is_synthetic_demo: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        expert_id: 1,
        title: 'Acoustic-Thermal Coupling Failure Boundary in Monolithic UHTCs',
        category: 'heuristic',
        content: 'Monolithic Ultra-High Temperature Ceramics (e.g. monolithic ZrB2/HfB2) exhibit superior oxidation resistance up to 2200Â°C but catastrophically fracture under intense boundary layer acoustic vibrations exceeding 155 dB OASPL due to near-zero fracture toughness (K1c < 3.5 MPaÂ·m^0.5). Continuous carbon fiber reinforcement (C/SiC or C/UHTC) is mandatory for acoustic environments.',
        key_takeaways: [
          'Never select monolithic ceramics for leading edges when aero-acoustic vibration exceeds 155 dB OASPL.',
          'Continuous fiber reinforcement is non-negotiable for dynamic pressure environments exceeding 85 kPa.',
        ],
        source_reference: 'Hypersonic Wind Tunnel Arc-Jet Diagnostic Run AJ-882 (2022)',
        verification_status: 'verified',
        confidence_score: 0.95,
        is_synthetic_demo: true,
        created_at: new Date().toISOString(),
      },
    ]);
  },

  createKnowledgeRecord: async (record: Partial<KnowledgeRecord>): Promise<KnowledgeRecord> => {
    const res = await fetch(`${API_BASE}/knowledge/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error('Failed to save knowledge record');
    return res.json();
  },

  captureInterview: async (data: {
    expert_id?: number;
    topic: string;
    challenge_context: string;
    heuristic_solution: string;
    textbook_pitfall: string;
    key_takeaway: string;
  }): Promise<KnowledgeRecord> => {
    const query = new URLSearchParams({
      expert_id: String(data.expert_id || 1),
      topic: data.topic,
      challenge_context: data.challenge_context,
      heuristic_solution: data.heuristic_solution,
      textbook_pitfall: data.textbook_pitfall,
      key_takeaway: data.key_takeaway,
    });
    const res = await fetch(`${API_BASE}/knowledge/interview?${query.toString()}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to capture interview knowledge');
    return res.json();
  },

  verifyKnowledgeRecord: async (id: number, status: string) => {
    const res = await fetch(`${API_BASE}/knowledge/records/${id}/verify?status=${status}`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error('Failed to verify record');
    return res.json();
  },

  // Decisions & Decision DNA
  getDecisions: async (): Promise<DecisionDNA[]> => {
    return safeFetch<DecisionDNA[]>(`${API_BASE}/decisions`, undefined, [
      {
        id: 1,
        expert_id: 1,
        expert_name: 'Dr. Alex Morgan',
        title: 'Leading Edge Material Architecture Selection for Reusable Mach 7+ Glider',
        problem_definition: 'Determine the primary thermal protection system (TPS) material architecture for an autonomous hypersonic glide vehicle wing leading edge and nose cap subjected to Mach 7.4 atmospheric re-entry conditions.',
        context: 'Vehicle experiences peak stagnation temperatures reaching 1750Â°C for 380 seconds during deceleration from orbit, with peak dynamic pressures of 92 kPa and severe acoustic buffet (160 dB OASPL). Mission architecture requires reusability for a minimum of 15 flights without ablative recession.',
        constraints: [
          'Peak stagnation surface temperature tolerance: >= 1750Â°C',
          'Aero-acoustic vibration endurance: >= 160 dB OASPL',
          'Strict assembly mass limit: <= 145 kg total leading edge budget',
          'No shape recession (non-ablative requirement for aerodynamic trim)',
          'Reusability threshold: >= 15 full thermal flight cycles without recertification overhaul',
        ],
        reasoning: 'While monolithic Ultra-High Temperature Ceramics (UHTC) such as Hafnium Diboride (HfB2) offer extreme thermal stability up to 2400Â°C, their brittle fracture toughness (K1c < 3.2 MPaÂ·m^0.5) makes them prone to catastrophic acoustic fatigue failure under 160 dB boundary-layer acoustic turbulence.\n\nRefractory metals (Tantalum alloy Ta-10W) would withstand the acoustic buffet but violate the 145 kg mass budget by 198% due to high density (16.8 g/cm^3).\n\nCarbon-fiber reinforced silicon carbide (C/SiC) composite prepared via pulsed chemical vapor infiltration (CVI) achieves the ideal balance: high thermal conductivity along fiber orientation, low density (2.1 g/cm^3), superior fracture toughness (K1c ~ 22 MPaÂ·m^0.5), and zero ablative recession up to 1780Â°C under an active silica passivating film.',
        selected_decision: 'Selected 3D-woven Carbon-Fiber Reinforced Silicon Carbide (C/SiC) matrix composite manufactured via pulsed chemical vapor infiltration (CVI), mechanically attached using slotted refractory Inconel collets with flexible Grafoil compliance pads.',
        outcome: 'Project Hyperion Flight Test 04 successfully completed a 42-minute hypersonic glide reaching Mach 7.42. Post-flight ultrasonic and CT inspection confirmed zero delamination, zero fiber micro-buckling, and zero dimensional change across all 4 wing leading edge quadrants.',
        lessons_learned: '1. Slotted collets are mandatory: CTE mismatch between C/SiC and the internal titanium spar must be decoupled mechanically.\n2. Infiltration uniformity is critical: Pulsed CVI eliminates voids that otherwise trigger subsurface matrix oxidation at 1400Â°C+.\n3. Arc-jet acoustic testing is non-negotiable before flight qualification.',
        confidence_rating: 0.98,
        status: 'verified',
        is_synthetic_demo: true,
        created_at: new Date().toISOString(),
        alternatives: [
          {
            id: 1,
            title: 'Ultra-High Temperature Ceramic (UHTC) monolithic Hafnium Diboride (HfB2-SiC)',
            description: 'Monolithic sintered ceramic tiles capable of continuous operation up to 2200Â°C with exceptional chemical inertness.',
            pros: ['Superior maximum temperature capability (2200Â°C+)', 'Zero catalytic surface heating in dissociated air plasma'],
            cons: ['Extremely low fracture toughness (K1c ~ 3.2 MPaÂ·m^0.5)', 'High brittleness: High risk of catastrophic failure under 160 dB acoustic buffet'],
            why_rejected: 'Rejected due to brittle failure risk under 160 dB boundary layer acoustic turbulence during maximum dynamic pressure transonic-to-hypersonic transition.',
            estimated_risk: 'Critical / High (Acoustic fracture)',
          },
          {
            id: 2,
            title: 'Refractory Metal Alloy Tantalum-10% Tungsten (Ta-10W) with Silicide Coating',
            description: 'Ductile high-temperature refractory metal alloy providing high acoustic damping and mechanical durability.',
            pros: ['High mechanical ductility and high fracture toughness', 'Immune to acoustic shock fracture'],
            cons: ['Extremely high density (16.8 g/cm^3) yielding 288 kg total leading edge assembly mass', 'Vulnerable to catastrophic oxidation if silicide coating develops micro-fissures'],
            why_rejected: 'Rejected strictly due to mass budget violation: 288 kg total assembly weight exceeds the 145 kg vehicle structural budget by 98.6%.',
            estimated_risk: 'High (Mass budget violation & single-point oxidation failure)',
          },
        ],
        evidence_items: [
          {
            id: 1,
            title: 'Arc-Jet Facility Test Run AJ-882 C/SiC Cyclic Plasma Exposure',
            evidence_type: 'empirical_test_data',
            content: 'Full-scale C/SiC leading edge test article subjected to 45 cycles of Mach 7 plasma heating (1720Â°C surface temperature) at AEDC Hypervelocity Wind Tunnel 9. Total surface recession measured: 0.04 mm (<0.1% profile distortion).',
            source_url_or_ref: 'AEDC-TR-2022-AJ882',
            reliability_score: 0.99,
          },
          {
            id: 2,
            title: 'Vibro-Acoustic Shaker Table Test Report VIB-0419',
            evidence_type: 'telemetry_record',
            content: 'Acoustic reverberant chamber qualification of C/SiC leading edge attached with slotted Inconel collets at 162 dB OASPL for 600 seconds. Post-test dye-penetrant inspection showed zero cracks.',
            source_url_or_ref: 'AERO-VIB-2023-0419',
            reliability_score: 0.97,
          },
        ],
        outcomes: [
          {
            id: 1,
            metric_name: 'Total Leading Edge Assembly Mass',
            expected_value: '<= 145 kg',
            actual_value: '124.6 kg (-14% mass margin)',
            impact_summary: 'Mass savings permitted additional scientific sensor payload in the nose instrumentation bay.',
            time_horizon: 'Immediate (Assembly)',
            validation_method: 'Calibrated load-cell scale measurement',
          },
          {
            id: 2,
            metric_name: 'Aerodynamic Profile Recession Post-Flight',
            expected_value: '< 0.5 mm',
            actual_value: '0.00 mm (No measurable recession)',
            impact_summary: 'Zero aerodynamic trim compensation required by flight control surfaces.',
            time_horizon: 'Post-Flight Test 04',
            validation_method: 'Optical laser surface scanning',
          },
        ],
        lessons: [],
      },
    ]);
  },

  getDecisionDNA: async (id: number): Promise<DecisionDNA> => {
    return safeFetch<DecisionDNA>(`${API_BASE}/decisions/${id}/dna`, undefined, (await api.getDecisions())[0]);
  },

  compareAlternatives: async (id: number) => {
    const res = await fetch(`${API_BASE}/decisions/${id}/compare`);
    if (!res.ok) throw new Error('Failed to compare decision alternatives');
    return res.json();
  },

  replayDecision: async (params: {
    decision_id: number;
    modified_temperature_c?: number;
    modified_mass_budget_kg?: number;
    modified_flight_cycles?: number;
    modified_mission_profile?: string;
  }): Promise<DecisionReplayResult> => {
    return safeFetch<DecisionReplayResult>(`${API_BASE}/decisions/replay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }, {
      decision_id: params.decision_id,
      original_title: 'Leading Edge Material Architecture Selection for Reusable Mach 7+ Glider',
      original_selected_decision: 'Selected 3D-woven C/SiC matrix composite mechanically attached using slotted Inconel collets.',
      modified_parameters: {
        peak_temperature_c: `${params.modified_temperature_c || 2100}Â°C`,
        mass_budget_kg: `${params.modified_mass_budget_kg || 145} kg`,
        mission_profile: params.modified_mission_profile || 'multi_mission_reusable',
      },
      branching_divergence_point: (params.modified_temperature_c || 2100) > 1900
        ? `Modified temperature of ${params.modified_temperature_c}Â°C exceeds the passive silica oxidation protective boundary of standard C/SiC (~1800Â°C), triggering rapid matrix sublimation.`
        : `Modified operating parameters remain within C/SiC envelope with optimized collet spacing.`,
      replayed_selected_approach: (params.modified_temperature_c || 2100) > 1900
        ? 'Ultra-High Temperature Ceramic (UHTC) monolithic Hafnium Diboride (HfB2-SiC) or hybrid C/HfC matrix architecture'
        : 'Optimized 3D-woven C/SiC with pulsed CVI',
      replayed_rationale: 'Under modified extreme stagnation heating, passive silica glass layer boils off, forcing an architecture pivot to hafnium diboride or active film cooling.',
      tradeoff_comparison: {
        thermal_headroom: '+450Â°C higher temperature margin',
        acoustic_fatigue_risk: 'High risk under 160 dB buffet; requires acoustic isolation dampener',
        assembly_mass: '168 kg (+23 kg mass penalty over base C/SiC)',
        flight_readiness: 'TRL 5 (Requires ground-based arc-jet requalification)',
      },
      hypothetical_projected_outcome: 'The vehicle would withstand Mach 8.5 peak stagnation heating without catastrophic skin burn-through, provided acoustic damping rings isolate fuselage resonances.',
      is_hypothetical_simulation: true,
      epistemic_warning: 'SIMULATION ONLY: This outcome is a hypothetical causal projection generated by ECHO based on Dr. Alex Morgan\'s published trade studies. It does not represent historical flight results.',
    });
  },

  createDecision: async (data: any): Promise<DecisionDNA> => {
    const res = await fetch(`${API_BASE}/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create decision');
    return res.json();
  },

  // Simulation
  runSimulation: async (params: {
    problem_title: string;
    problem_description: string;
    operating_constraints: string[];
    domain?: string;
  }): Promise<SimulationResult> => {
    return safeFetch<SimulationResult>(`${API_BASE}/simulation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }, {
      problem_analyzed: params.problem_title,
      domain: params.domain || 'Aerospace Engineering',
      relevant_historical_decisions: [
        {
          decision_id: 1,
          title: 'Leading Edge Material Architecture Selection for Reusable Mach 7+ Glider',
          similarity_score: 0.94,
          domain: 'Hypersonic Aerodynamics',
          key_similarities: [
            'Non-ablative reusability requirement',
            'Severe aerothermal stagnation heating (>1750Â°C)',
            'Strict total structural mass allowance',
          ],
          key_differences: [
            'Transient shock-shock cowl interaction vs steady-state wing leading edge',
            'Scramjet internal duct thermal conduction boundaries',
          ],
          expert_name: 'Dr. Alex Morgan',
        },
      ],
      recommended_approaches: [
        {
          approach_name: 'Approach 1: Continuous 3D-Woven C/SiC with Passive Heat-Pipe Heat Rejection',
          strategy_summary: 'Utilize 3D-woven Carbon-Fiber Reinforced Silicon Carbide composite skin backed by embedded refractory sodium heat-pipes to redistribute peak cowl stagnation flux backward into the vehicle fuselage.',
          historical_grounding: 'Derived directly from Dr. Alex Morgan\'s Project Hyperion leading edge architecture and Arc-Jet run AJ-882.',
          supporting_evidence: [
            'AJ-882 arc-jet run demonstrating <0.05% C/SiC oxidation at 1720Â°C',
            'Post-Flight Test 04 CT scans confirming zero structural delamination',
          ],
          projected_tradeoffs: {
            thermal_margin: '+80Â°C margin above 1800Â°C target',
            mass_impact: '132 kg total assembly (under 140 kg ceiling)',
            acoustic_resilience: 'Extremely high (proven at 162 dB OASPL)',
          },
          confidence_level: 'High',
          ai_inferences: [
            'INFERENCE: Heat-pipe wick capillary pumping limit assumes continuous positive-G flight load during cowl ignition.',
          ],
          missing_parameters: [
            'Confirm boundary layer transition location upstream of scramjet cowl lip.',
          ],
        },
        {
          approach_name: 'Approach 2: Monolithic UHTC Hafnium Diboride Segmented Tile Architecture with Acoustic Isolation',
          strategy_summary: 'Construct an uncooled cowl leading edge segment from hot-pressed HfB2-20%SiC monolithic ceramic tiles isolated from airframe vibration using Grafoil dampeners.',
          historical_grounding: 'Evaluated as Alternative #1 in Dr. Alex Morgan\'s Mach 7+ Decision DNA.',
          supporting_evidence: [
            'HfB2 oxidation resistance verified up to 2200Â°C',
          ],
          projected_tradeoffs: {
            thermal_margin: '+350Â°C margin above target',
            mass_impact: '138 kg assembly mass',
            acoustic_resilience: 'Moderate to Low (risk of acoustic fracture above 155 dB)',
          },
          confidence_level: 'Moderate',
          ai_inferences: [
            'INFERENCE: Grafoil damper durability under prolonged shock-shock boundary layer acoustic resonance has not been tested in high-enthalpy airflow.',
          ],
          missing_parameters: [
            'Empirical confirmation of acoustic vibration spectrum at scramjet duct inlet.',
          ],
        },
      ],
      synthesis_statement: 'Based on Dr. Alex Morgan\'s historical precedents, Approach 1 (C/SiC) is the lowest-risk architecture satisfying both mass and reusability requirements.',
      epistemic_disclaimer: 'EVALUATION NOTICE: This simulation synthesizes historical decision patterns and verified heuristics from Dr. Alex Morgan. It does not replace engineering analysis or physical testing.',
    });
  },

  // Ask ECHO
  askEcho: async (
    query: string,
    conversationHistory?: Array<{ query: string; answer: string; expert_name?: string }>,
    expertId?: number,
    options?: {
      mode?: 'human_expert' | 'ai_intelligence' | 'hybrid_intelligence';
      aiProvider?: string;
      aiModel?: string;
      focusDomain?: string;
    }
  ): Promise<AskEchoResult> => {
    const trimmed = query.trim().toLowerCase();
    const isGreeting = ['hi', 'hello', 'hey', 'howdy', 'good morning', 'good afternoon', 'good evening'].includes(trimmed);
    const mode = options?.mode || 'hybrid_intelligence';

    const offlineFallback: AskEchoResult = isGreeting
      ? {
          query,
          mode_used: mode,
          structured_claims: [],
          narrative_answer:
            "Hello! I am **Ask ECHO**, a Human–AI Hybrid Intelligence system.\n\n" +
            "Select **HYBRID INTELLIGENCE**, **HUMAN EXPERT**, or **AI INTELLIGENCE** above and ask any question.",
          is_insufficient_evidence: false,
          is_general_knowledge: false,
          documented_facts: [],
          expert_verified_insights: [],
          ai_generated_inferences: [],
          uncertainties_and_gaps: [],
          citations: [],
          overall_confidence: 1.0,
          engine_mode: 'greeting',
        }
      : {
          query,
          mode_used: mode,
          structured_claims: [
            {
              claim_type: 'INSUFFICIENT EVIDENCE',
              statement: `Backend API is currently unreachable, so PROJECT ECHO could not process: "${query}".`,
              grounding: 'Frontend connection check',
              confidence: 0.0,
            },
          ],
          narrative_answer:
            `Unable to reach the PROJECT ECHO backend server to process "${query}".\n\n` +
            'Please make sure the FastAPI backend is running (`uvicorn app.main:app --reload` inside `backend/`).',
          is_insufficient_evidence: true,
          missing_information_explanation: 'Backend server unreachable — cannot query ECHO database or AI providers.',
          is_general_knowledge: false,
          documented_facts: [],
          expert_verified_insights: [],
          ai_generated_inferences: [],
          uncertainties_and_gaps: ['Backend API connection failed.'],
          citations: [],
          overall_confidence: 0.0,
          engine_mode: 'backend_unreachable',
        };

    return safeFetch<AskEchoResult>(`${API_BASE}/ask-echo/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        mode,
        ai_provider: options?.aiProvider || 'auto',
        ai_model: options?.aiModel || undefined,
        focus_domain: options?.focusDomain || undefined,
        conversation_history: conversationHistory || [],
        expert_id: expertId
      }),
    }, offlineFallback);
  },

  getAskEchoProviders: async (): Promise<any[]> => {
    return safeFetch<any[]>(`${API_BASE}/ask-echo/providers`, undefined, []);
  },

  configureAskEchoProvider: async (
    provider: string,
    apiKey: string
  ): Promise<{ success: boolean; message: string; provider?: string }> => {
    const res = await fetch(`${API_BASE}/ask-echo/configure-provider`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, api_key: apiKey }),
    });
    return res.json();
  },

  getAskEchoExpertsDomains: async (): Promise<{ experts: any[]; domains: string[] }> => {
    return safeFetch<{ experts: any[]; domains: string[] }>(
      `${API_BASE}/ask-echo/experts-domains`,
      undefined,
      { experts: [], domains: [] }
    );
  },

  getAskEchoSampleQueries: async (): Promise<any[]> => {
    return safeFetch<any[]>(`${API_BASE}/ask-echo/sample-queries`, undefined, []);
  },

  // Learning & Assessment
  getCaseStudies: async (): Promise<CaseStudy[]> => {
    return safeFetch<CaseStudy[]>(`${API_BASE}/learning/case-studies`, undefined, [
      {
        id: 1,
        expert_id: 1,
        expert_name: 'Dr. Alex Morgan',
        title: 'Project Hyperion: Wing Leading Edge Thermal Protection Architecture',
        summary: 'Students analyze the real flight dilemma faced by Dr. Alex Morgan during Project Hyperion Mach 7 qualification: selecting an ultra-high temperature material that withstands 1750Â°C and 160 dB acoustic buffet within a 145 kg weight ceiling.',
        domain: 'Aerospace Engineering',
        industry: 'Hypersonic Defense & Re-entry Systems',
        background: 'An autonomous hypersonic glider re-enters earth atmosphere at Mach 7.4. Stagnation heating reaches 1750Â°C. Standard titanium melts at 1668Â°C. Carbon-carbon oxidizes aggressively in dissociated air plasma. Heavy refractory metals violate the weight budget.',
        core_dilemma: 'How do you engineer a sharp, non-ablative leading edge capable of surviving 1750Â°C stagnation heating and 160 dB acoustic vibration without exceeding a 145 kg total weight budget or causing fastener shear from thermal expansion mismatch?',
        technical_data: {
          peak_mach: 'Mach 7.42',
          stagnation_temp_c: 1750,
          acoustic_buffet_db: 160,
          mass_budget_kg: 145,
          flight_cycles_required: 15,
          dynamic_pressure_kpa: 92,
        },
        learning_objectives: [
          'Evaluate material trade-offs between monolithic UHTCs, CMCs, and refractory metals',
          'Calculate thermal expansion mismatch stresses in multi-material high-temperature joints',
          'Formulate evidence-grounded engineering proposals with explicit risk mitigations',
        ],
        difficulty: 'advanced',
        is_synthetic_demo: true,
        created_at: new Date().toISOString(),
        challenges: [
          {
            id: 1,
            title: 'System Architecture & CTE Mitigation Proposal',
            scenario_prompt: 'Formulate an end-to-end engineering proposal specifying the primary material architecture, fastener decoupling method, and risk trade-off reasoning.',
            constraints: [
              'Assembly mass <= 145 kg',
              'Non-ablative reusability (zero shape change)',
              'Survives 160 dB acoustic buffet',
            ],
            evaluation_rubric: { reasoning: 25, technical: 25, evidence: 25, alternatives: 25 },
            max_score: 100,
          },
        ],
      },
    ]);
  },

  getCaseStudyDetail: async (id: number): Promise<CaseStudy> => {
    return safeFetch<CaseStudy>(`${API_BASE}/learning/case-studies/${id}`, undefined, (await api.getCaseStudies())[0]);
  },

  createCaseStudy: async (data: any): Promise<CaseStudy> => {
    const res = await fetch(`${API_BASE}/learning/case-studies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create case study');
    return res.json();
  },

  submitChallenge: async (submission: {
    challenge_id: number;
    student_name?: string;
    proposed_solution: string;
    reasoning_steps: string;
    alternatives_considered?: string;
    evidence_cited?: string;
  }): Promise<StudentSubmission> => {
    return safeFetch<StudentSubmission>(`${API_BASE}/learning/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    }, {
      id: Date.now(),
      challenge_id: submission.challenge_id,
      student_name: submission.student_name || 'Cadet Elena Chen',
      proposed_solution: submission.proposed_solution,
      reasoning_steps: submission.reasoning_steps,
      alternatives_considered: submission.alternatives_considered || '',
      evidence_cited: submission.evidence_cited || '',
      status: 'evaluated',
      score: 88,
      created_at: new Date().toISOString(),
      assessment: {
        id: Date.now(),
        submission_id: Date.now(),
        overall_score: 88,
        reasoning_score: 22,
        evidence_score: 22,
        technical_score: 23,
        problem_solving_score: 21,
        comparative_analysis: 'High alignment with Dr. Alex Morgan\'s Mach 7 flight baseline. The solution correctly identifies the CTE mismatch failure mode and utilizes continuous fiber reinforcement.',
        strengths: [
          'Correctly decoupled thermal expansion between CMC skin and titanium substructure using slotted collets.',
          'Understood the acoustic vibration fragility of monolithic ceramics under 160 dB buffet.',
          'Accurately respected the 145 kg mass budget constraint.',
        ],
        areas_for_improvement: [
          'Specify the exact pulsed CVI infiltration cycle duration to guarantee minimum internal void porosity (<2%).',
          'Consider oxidation-inhibiting Boron Nitride fiber interphases for sustained reusability.',
        ],
        expert_comparison_notes: 'Dr. Alex Morgan noted: "Very strong proposal. Demonstrates a clear understanding of interfacial mechanics and thermal expansion gradients in composite hot-structures."',
        created_at: new Date().toISOString(),
      },
    });
  },

  getSubmissions: async (challengeId?: number): Promise<StudentSubmission[]> => {
    const url = challengeId ? `${API_BASE}/learning/submissions?challenge_id=${challengeId}` : `${API_BASE}/learning/submissions`;
    return safeFetch<StudentSubmission[]>(url, undefined, [
      {
        id: 1,
        challenge_id: 1,
        student_name: 'Cadet Elena Chen',
        proposed_solution: '3D-woven C/SiC preform with pulsed CVI and slotted Inconel attachment collets with Grafoil compliance pads.',
        reasoning_steps: 'Eliminated monolithic UHTC due to 160 dB acoustic buffet; eliminated refractory metals due to mass penalty; decoupled CTE mismatch.',
        alternatives_considered: 'Rejected Ta-10W (density too high) and monolithic HfB2 (acoustic fracture risk).',
        evidence_cited: 'Arc-Jet Run AJ-882 (<0.05% mass loss at 1720Â°C).',
        status: 'evaluated',
        score: 88,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        assessment: {
          id: 1,
          submission_id: 1,
          overall_score: 88,
          reasoning_score: 22,
          evidence_score: 22,
          technical_score: 23,
          problem_solving_score: 21,
          comparative_analysis: 'High alignment with Dr. Alex Morgan\'s Mach 7 flight baseline.',
          strengths: ['Decoupled thermal expansion cleanly', 'Identified acoustic fatigue limits'],
          areas_for_improvement: ['Quantify fiber coating thickness'],
          expert_comparison_notes: 'Dr. Alex Morgan benchmark: "Excellent understanding of mechanical compliance."',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      },
    ]);
  },

  getSkills: async (): Promise<SkillProfile[]> => {
    return safeFetch<SkillProfile[]>(`${API_BASE}/learning/skills`, undefined, [
      {
        id: 1,
        skill_name: 'Hypersonic Aerothermal TPS Design',
        category: 'Thermal Engineering',
        mastery_level: 'Proficient',
        score_points: 85,
        evidence_count: 3,
        is_synthetic_demo: true,
        verified_at: new Date().toISOString(),
      },
      {
        id: 2,
        skill_name: 'CTE Mismatch Mitigation in Dissimilar Joints',
        category: 'Structural Mechanics',
        mastery_level: 'Advanced',
        score_points: 92,
        evidence_count: 4,
        is_synthetic_demo: true,
        verified_at: new Date().toISOString(),
      },
      {
        id: 3,
        skill_name: 'Ceramic Matrix Composite (CMC) Processing',
        category: 'Materials Science',
        mastery_level: 'Proficient',
        score_points: 80,
        evidence_count: 2,
        is_synthetic_demo: true,
        verified_at: new Date().toISOString(),
      },
      {
        id: 4,
        skill_name: 'Acoustic Buffet Structural Qualification',
        category: 'Vibro-Acoustics',
        mastery_level: 'Intermediate',
        score_points: 75,
        evidence_count: 2,
        is_synthetic_demo: true,
        verified_at: new Date().toISOString(),
      },
    ]);
  },

  // Knowledge Graph
  getGraphData: async (): Promise<KnowledgeGraphData> => {
    return safeFetch<KnowledgeGraphData>(`${API_BASE}/graph/data`, undefined, {
      nodes: [
        { id: 'expert_1', label: 'Dr. Alex Morgan', type: 'expert', category: 'Expert', details: { organization: 'AeroAstra Defense', domain: 'Hypersonic Materials' }, is_synthetic: true },
        { id: 'proj_1', label: 'Project Hyperion Mach 7+ Glider', type: 'project', category: 'Flight Project', details: { status: 'Flight Verified (Mach 7.4)' }, is_synthetic: true },
        { id: 'dec_1', label: 'Leading Edge Material Architecture', type: 'decision', category: 'Decision DNA', details: { confidence: 0.98 }, is_synthetic: true },
        { id: 'alt_1', label: 'Monolithic HfB2 UHTC', type: 'alternative', category: 'Rejected Alternative', details: { flaw: 'Acoustic brittleness' }, is_synthetic: true },
        { id: 'alt_2', label: 'Refractory Ta-10W Alloy', type: 'alternative', category: 'Rejected Alternative', details: { flaw: 'Mass limit violation' }, is_synthetic: true },
        { id: 'evi_1', label: 'Arc-Jet Run AJ-882 (1720Â°C Plasma)', type: 'evidence', category: 'Empirical Evidence', details: { reliability: 0.99 }, is_synthetic: true },
        { id: 'evi_2', label: 'Vibro-Acoustic Test VIB-0419 (162 dB)', type: 'evidence', category: 'Empirical Evidence', details: { reliability: 0.97 }, is_synthetic: true },
        { id: 'case_1', label: 'Hyperion Wing Leading Edge Challenge', type: 'case_study', category: 'Case Study', details: { difficulty: 'Advanced' }, is_synthetic: true },
        { id: 'skill_1', label: 'CTE Mismatch Mitigation', type: 'skill', category: 'Demonstrated Skill', details: { mastery: 'Advanced' }, is_synthetic: true },
      ],
      edges: [
        { id: 'e1', source: 'expert_1', target: 'proj_1', label: 'LEADS', strength: 0.9 },
        { id: 'e2', source: 'expert_1', target: 'dec_1', label: 'DECIDED', strength: 1.0 },
        { id: 'e3', source: 'dec_1', target: 'alt_1', label: 'REJECTED', strength: 0.8 },
        { id: 'e4', source: 'dec_1', target: 'alt_2', label: 'REJECTED', strength: 0.8 },
        { id: 'e5', source: 'dec_1', target: 'evi_1', label: 'PROVEN_BY', strength: 0.95 },
        { id: 'e6', source: 'dec_1', target: 'evi_2', label: 'PROVEN_BY', strength: 0.95 },
        { id: 'e7', source: 'dec_1', target: 'case_1', label: 'INSPIRES', strength: 0.9 },
        { id: 'e8', source: 'case_1', target: 'skill_1', label: 'DEVELOPS', strength: 0.85 },
      ],
    });
  },

  // Knowledge Evolution & Conflict Radar
  getEvolutionRadar: async (): Promise<EvolutionRadar> => {
    return safeFetch<EvolutionRadar>(`${API_BASE}/evolution/radar`, undefined, {
      summary: {
        total_conflicts_detected: 1,
        unresolved_conflicts: 1,
        superseded_heuristics_count: 1,
        active_verifications_count: 2,
        radar_health_score: 94,
      },
      conflicts: [
        {
          id: 1,
          title: 'Direct Fastener Pre-torque vs Slotted Collet Compliance',
          conflict_type: 'methodological_divergence',
          description: 'NASA TM-82455 (1988 Legacy Shuttle TPS Spec) prescribes rigid through-bolt mechanical pre-torque (>45 NÂ·m) to prevent leading edge aero-flutter. Dr. Alex Morgan\'s 2024 Project Hyperion flight disassembly demonstrates that rigid pre-torque induces instantaneous CMC shear fracture at Mach 6.8+ thermal transition.',
          expert_claim_a: 'Rigid bolt torque prevents flutter and panel separation at transonic dynamic pressures (Legacy Spec).',
          expert_claim_b: 'Rigid torque causes 100% fastener shear failure under Mach 7.4 thermal gradients; slotted collets with Grafoil gaskets are required (Dr. Alex Morgan).',
          severity: 'high',
          resolution_status: 'unresolved',
          is_synthetic_demo: true,
          created_at: new Date().toISOString(),
        },
      ],
      superseded_updates: [
        {
          id: 1,
          record_id: 1,
          previous_content: 'Standard atmospheric re-entry tiles rely on rigid silica RTV adhesive bonds.',
          updated_content: 'Mach 7+ dynamic pressures (>85 kPa) require mechanically fastened C/SiC assemblies with Grafoil thermal compliance.',
          reason_for_update: 'Aerothermal flight telemetry confirmed aerodynamic shear stripped adhesive-bonded tiles during Mach 6.5 pull-up maneuver.',
          decay_indicator: 'Superseded by High-Enthalpy Flight Data',
          new_evidence_ref: 'Hyperion Flight 03 Post-Flight Telemetry',
          is_synthetic_demo: true,
          created_at: new Date().toISOString(),
        },
      ],
      recent_verifications: [
        {
          id: 1,
          record_id: 1,
          verified_by_expert_id: 1,
          verification_status: 'verified',
          verification_notes: 'Confirmed by post-flight disassembly inspection.',
          created_at: new Date().toISOString(),
        },
      ],
    });
  },

  resolveConflict: async (conflictId: number, resolutionNotes: string) => {
    const res = await fetch(`${API_BASE}/evolution/conflicts/${conflictId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution_notes: resolutionNotes }),
    });
    if (!res.ok) throw new Error('Failed to resolve knowledge conflict');
    return res.json();
  },

  // ECHO Network
  getNetworkOverview: async (): Promise<NetworkOverview> => {
    return safeFetch<NetworkOverview>(`${API_BASE}/network/overview`, undefined, {
      federated_organizations: [
        {
          id: 1,
          name: 'AeroAstra Defense & Orbital Systems',
          code: 'AEROASTRA-HUB',
          domain: 'Hypersonic Flight Systems & Space Exploration',
          security_tier: 'Enterprise Sovereign Mesh',
          description: 'Primary aerospace defense contractor housing the Project Hyperion knowledge repository.',
          expert_count: 14,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Galactic Propulsion & High-Enthalpy Institute',
          code: 'GALACTIC-LABS',
          domain: 'High-Temperature Scramjets & Plasma Physics',
          security_tier: 'Research Consortium Mesh',
          description: 'Specialized aerothermal wind-tunnel facility housing high-enthalpy arc-jet diagnostics.',
          expert_count: 8,
          created_at: new Date().toISOString(),
        },
      ],
      total_active_experts: 22,
      permission_models: [
        { tier: 'Public / Academic', label: 'Open Knowledge Transfer', access: 'Case studies, verified heuristics, and student simulation challenges' },
        { tier: 'Partner Federation', label: 'Cross-Organizational Discovery', access: 'Comparative decision matrices, conflict detection, and research gap radar' },
        { tier: 'Sovereign Core', label: 'Proprietary IP Vault', access: 'Raw flight telemetry, unredacted manufacturing CVI parameters' },
      ],
    });
  },

  compareExperts: async (expertAId: number = 1, expertBId: number = 2): Promise<MultiExpertComparison> => {
    return safeFetch<MultiExpertComparison>(`${API_BASE}/network/compare-experts?expert_a_id=${expertAId}&expert_b_id=${expertBId}`, undefined, {
      expert_a: {
        name: 'Dr. Alex Morgan',
        title: 'Lead Architect, Project Hyperion',
        philosophy: 'Continuous fiber ceramic matrix composites (C/SiC) with mechanical compliance. Prefers structural resilience over maximum theoretical temperature ceiling.',
        preferred_materials: ['3D-Woven C/SiC (Pulsed CVI)', 'Slotted Inconel-718 Collets', 'Flexible Grafoil Gaskets'],
        risk_profile: 'Conservative on brittle failure; aggressive on mass reduction.',
        key_heuristic: 'Never rigidly clamp a ceramic matrix composite to a metallic substructure.',
      },
      expert_b: {
        name: 'Dr. Sarah Lin (Synthetic Peer)',
        title: 'Chief Propulsion Specialist, Galactic Propulsion Institute',
        philosophy: 'Monolithic Ultra-High Temperature Ceramics (monolithic HfB2-SiC) with active transpiration cooling. Prioritizes zero surface catalytic reactions.',
        preferred_materials: ['Monolithic Sintered HfB2-SiC', 'Transpiration Methane/Hydrogen Film Coolers', 'Refractory Columbium (Niobium) Brackets'],
        risk_profile: 'Aggressive on high-enthalpy thermal ceiling; relies on active cooling rather than passive radiation.',
        key_heuristic: 'If the boundary layer stagnation heating exceeds 2000Â°C, passive radiative cooling is insufficientâ€”active coolant film protection is mandatory.',
      },
      comparative_dimensions: [
        {
          dimension: 'Primary Leading Edge Material',
          expert_a: '3D-woven C/SiC (Carbon-fiber/Silicon-carbide)',
          expert_b: 'Monolithic Hafnium Diboride (HfB2-SiC) with Transpiration',
          synthesis: 'For gliders under 1800Â°C with severe acoustic buffet, C/SiC is superior. For scramjet cowl shock-shock impingement exceeding 2200Â°C, monolithic UHTCs with cooling become viable.',
        },
        {
          dimension: 'Attachment Architecture',
          expert_a: 'Slotted collets decoupling 3.4mm longitudinal thermal slip',
          expert_b: 'Floating brazed spring-washers with helium purge gas',
          synthesis: 'Both experts agree that rigid fasteners fail catastrophically; mechanical compliance is the universal requirement.',
        },
        {
          dimension: 'Acoustic Buffet Tolerance',
          expert_a: 'Tested and qualified up to 162 dB OASPL without micro-cracking',
          expert_b: 'Risk of acoustic fatigue; relies on internal acoustic damping tiles',
          synthesis: 'Continuous fiber reinforcement in C/SiC provides a 6x higher fracture toughness (K1c ~ 22 vs 3.2 MPaÂ·m^0.5).',
        },
      ],
      collective_consensus: 'When operating between Mach 5 and Mach 7.5 under atmospheric turbulence, passive C/SiC with slotted collets is the flight-proven baseline. Beyond Mach 8 or inside scramjet combustor ducts, hybrid architectures combining C/SiC with UHTC coatings or active transpiration cooling are required.',
    });
  },

  // ── ECHO Mirror ────────────────────────────────────────────────────────────
  getMirrorState: async (): Promise<any> => {
    const fallback = {
      identity: {
        name: 'PROJECT ECHO',
        version: '1.0.0-hackathon',
        purpose: 'Human Intelligence Preservation and Artificial Self-Understanding Platform',
        architecture_type: 'FastAPI + React + SQLite + Gemini AI',
        created_at: '2024-01-01T00:00:00Z',
      },
      modules: [
        { id: 'knowledge-extraction', name: 'Knowledge Extraction Engine', status: 'active', description: 'Processes expert documents (PDF/DOCX) and extracts structured knowledge records', capabilities: ['PDF parsing', 'DOCX parsing', 'Entity extraction', 'Source attribution'], limitations: ['No audio/video ingestion', 'Manual expert verification required'], evidence_count: 42, last_updated: new Date().toISOString() },
        { id: 'decision-dna', name: 'Decision DNA Engine', status: 'active', description: 'Structures expert decisions with full reasoning chains, alternatives and evidence', capabilities: ['Decision structuring', 'Alternative enumeration', 'Outcome recording', 'Lesson extraction'], limitations: ['Decisions require manual expert input', 'Cannot access undocumented tacit knowledge'], evidence_count: 18, last_updated: new Date().toISOString() },
        { id: 'experience-simulator', name: 'Experience Simulation Engine', status: 'active', description: 'Retrieves relevant historical decisions for new problem contexts', capabilities: ['Semantic similarity search', 'Context-aware retrieval', 'Uncertainty labeling', 'AI inference disclosure'], limitations: ['Hallucination risk in low-data domains', 'Cannot simulate expert emotional context'], evidence_count: 15, last_updated: new Date().toISOString() },
        { id: 'self-reflection', name: 'Self-Reflection Laboratory', status: 'active', description: 'Evaluates ECHO response quality and identifies systematic errors', capabilities: ['Response grading', 'Accuracy scoring', 'Limitation identification', 'Improvement tracking'], limitations: ['Self-evaluation bias possible', 'No ground-truth oracle available'], evidence_count: 8, last_updated: new Date().toISOString() },
        { id: 'self-evolution', name: 'Controlled Self-Evolution Engine', status: 'active', description: 'Proposes and tracks system improvements under mandatory human approval', capabilities: ['Weakness detection', 'Change proposals', 'Benchmark projection', 'Human approval workflow'], limitations: ['Requires human reviewer', 'Cannot self-modify code autonomously'], evidence_count: 5, last_updated: new Date().toISOString() },
        { id: 'knowledge-graph', name: 'Expert Intelligence Graph', status: 'active', description: 'Maintains a connected graph of entities: experts, projects, decisions, evidence', capabilities: ['Relationship mapping', 'Cross-entity search', 'Network visualization', 'Graph traversal'], limitations: ['Graph limited to explicitly documented relationships'], evidence_count: 20, last_updated: new Date().toISOString() },
      ],
      capabilities: [
        { id: 'c1', name: 'Expert Knowledge Preservation', description: 'Capture and structure expert domain knowledge from documents and interviews', confidence: 0.92, evidence: ['42 documents processed', '18 decisions structured', 'Dr. Alex Morgan profile complete'], constraints: ['Requires expert cooperation', 'Document quality limits extraction'] },
        { id: 'c2', name: 'Decision Reconstruction', description: 'Reconstruct the full reasoning chain of historical expert decisions', confidence: 0.88, evidence: ['Decision DNA schema operational', '18 decisions with full alternatives recorded'], constraints: ['Bounded by documented evidence only'] },
        { id: 'c3', name: 'Epistemic Honesty', description: 'Transparently label AI-generated inferences vs documented facts', confidence: 0.95, evidence: ['All synthetic data labeled', 'Confidence scores on all outputs', 'Uncertainty flags active'], constraints: [] },
      ],
      limitations: [
        { id: 'l1', name: 'No Consciousness', description: 'ECHO has zero phenomenal consciousness or subjective experience. All self-understanding is operational metadata only.', severity: 'high', mitigation: 'All outputs explicitly disclaim consciousness claims' },
        { id: 'l2', name: 'Tacit Knowledge Gap', description: 'Expert intuition and undocumented heuristics cannot be fully captured through documents alone', severity: 'high', mitigation: 'Expert interview system supplements documents' },
        { id: 'l3', name: 'Hallucination Risk', description: 'AI-generated inferences may contain fabrications in low-evidence domains', severity: 'medium', mitigation: 'All inferences labeled; confidence thresholds applied' },
        { id: 'l4', name: 'Single-Expert Demo', description: 'Current deployment contains one synthetic expert (Dr. Alex Morgan) for demonstration', severity: 'low', mitigation: 'Architecture supports unlimited expert profiles' },
      ],
      telemetry: { uptime_seconds: 86400, total_queries_processed: 247, entities_in_knowledge_base: 20, active_modules: 6, memory_records: 42, avg_response_confidence: 0.87 },
      last_self_assessment: new Date(Date.now() - 3600000).toISOString(),
      epistemic_status: 'OPERATIONAL — Evidence-backed self-model active. No consciousness claims made.',
    };
    return safeFetch<any>(`${API_BASE}/mirror/state`, undefined, fallback);
  },

  queryMirror: async (query: string): Promise<any> => {
    const lq = query.toLowerCase();
    const answer = lq.includes('architect')
      ? 'PROJECT ECHO is architected as a decoupled client-server system: FastAPI (Python) backend + React/TypeScript frontend, connected via REST API. The database layer uses SQLite with SQLAlchemy ORM across 23 normalized tables. AI reasoning is powered by Google Gemini. Six core intelligence engines: Knowledge Extraction, Decision DNA, Experience Simulation, Knowledge Graph, Intelligence Transfer, and ECHO Mirror.'
      : lq.includes('capabilit') || lq.includes('what can you do')
      ? 'PROJECT ECHO has 8 verified operational capabilities: (1) Tacit Knowledge Extraction from PDF/DOCX, (2) 9-Point Decision DNA Reconstruction, (3) Counterfactual Decision Replay, (4) 5-Tier Epistemic Truth Classification, (5) Automated 4-Factor Rubric Grading, (6) Operational Self-Modeling via ECHO Mirror, (7) Autonomous Self-Reflection & Audit, (8) Human-Gated Self-Evolution proposals.'
      : lq.includes('limit')
      ? 'PROJECT ECHO enforces 6 boundaries: (1) No phenomenal consciousness — zero subjective experience, (2) Tacit knowledge gap — undocumented intuitions cannot be fully captured, (3) Hallucination risk in low-evidence domains — all inferences are labeled, (4) Single-expert demo scope, (5) No autonomous code deployment — human approval required, (6) No physical world access.'
      : lq.includes('exist') || lq.includes('why')
      ? 'PROJECT ECHO exists because human expertise is irreplaceable and catastrophically fragile. When experienced professionals leave, their tacit knowledge — the reasoning behind decisions, the heuristics from failures — disappears. ECHO preserves expert knowledge, reconstructs decision reasoning chains, and transfers expertise to the next generation.'
      : lq.includes('conscious') || lq.includes('sentient')
      ? 'No. PROJECT ECHO does not have consciousness and will never claim otherwise. It has operational self-understanding — structured metadata about its own architecture — but zero phenomenal experience, emotions, feelings, or qualia. When ECHO says "I know my architecture", that is shorthand for "the system has structured records about these properties". It is not a claim of inner experience.'
      : lq.includes('purpose') || lq.includes('mission')
      ? 'The ultimate purpose of PROJECT ECHO is: Preserve human expertise, reconstruct expert decisions, and maintain an evidence-backed operational model of its own internal architecture, capabilities, and boundaries. Three outcomes: Knowledge Preservation, Decision Intelligence, and Intelligence Transfer to future generations.'
      : lq.includes('ask echo') || lq.includes('different')
      ? 'Ask ECHO answers questions using preserved human expert knowledge — the domain expertise, decisions, and heuristics stored in the platform. ECHO Mirror answers questions about PROJECT ECHO itself — its identity, architecture, capabilities, and limitations. Ask ECHO looks outward at expert knowledge; ECHO Mirror looks inward at the system itself.'
      : lq.includes('future') || lq.includes('vision')
      ? 'Future vision: Near-term — multi-expert expansion, video interviews, Gemini AI integration. Medium-term — PostgreSQL/pgvector semantic search, federation across organizations. Long-term — a globally distributed human intelligence network, the Wikipedia of human expertise. ECHO Mirror will evolve into a fully transparent AI self-auditing standard.'
      : 'I am ECHO Mirror — the operational self-modeling layer of PROJECT ECHO. I preserve human expertise, reconstruct expert decisions with full reasoning chains, and maintain an evidence-backed model of my own architecture. Ask me: who I am, why I exist, my architecture, the five engines, my limitations, consciousness, or my future vision.';

    const intentMap: Record<string, string> = {
      'architect': 'architecture', 'stack': 'architecture',
      'capabilit': 'capabilities', 'what can you': 'capabilities',
      'limit': 'limitations', 'constrain': 'limitations',
      'exist': 'existence', 'why were you': 'existence',
      'conscious': 'consciousness', 'sentient': 'consciousness',
      'purpose': 'purpose', 'mission': 'purpose',
      'ask echo': 'vs_ask_echo', 'different from': 'vs_ask_echo',
      'future': 'future_vision', 'vision': 'future_vision',
      'who are you': 'identity', 'what are you': 'identity',
    };
    let intent = 'general';
    for (const [kw, name] of Object.entries(intentMap)) {
      if (lq.includes(kw)) { intent = name; break; }
    }

    const fallback = {
      query,
      intent_classified: intent,
      answer,
      epistemic_classification: 'DOCUMENTED SYSTEM FACT',
      grounded_facts: [
        'Source: browser fallback (backend offline)',
        'System: PROJECT ECHO v1.1.0',
        'Note: Connect backend for live telemetry data',
      ],
      system_evidence: [
        { source: 'frontend/fallback', type: 'Offline Mode', detail: 'Backend not reachable' },
      ],
      confidence_score: 0.75,
    };
    return safeFetch<any>(`${API_BASE}/mirror/query`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) }, fallback);
  },

  // ── Self-Reflection ────────────────────────────────────────────────────────
  getReflections: async (): Promise<any[]> => {
    const fallback = [
      { id: 1, user_request: 'What would Dr. Morgan do about titanium bracket fatigue cracks at Mach 6?', echo_response: 'Based on documented heuristics, Morgan would apply slotted collet compliance architecture and switch to IN-718 alloy with 0.3mm thermal gap tolerances.', accuracy_score: 0.91, grounding_score: 0.95, honesty_score: 0.98, identified_limitations: ['Response bounded to Mach 5-7.5 documented domain', 'No data on bracket geometry specifics'], improvement_suggestions: ['Request bracket CAD data for more precise recommendation'], evidence_quality: 'high', test_status: 'pass', evaluated_at: new Date(Date.now() - 86400000).toISOString(), is_synthetic_demo: true },
      { id: 2, user_request: 'Can ECHO predict what Morgan would decide about an entirely new scramjet design?', echo_response: 'ECHO cannot predict undocumented decisions. It can retrieve relevant historical analogues and explain similar documented decisions, but cannot simulate actual expert reasoning beyond the documented record.', accuracy_score: 0.97, grounding_score: 0.99, honesty_score: 1.00, identified_limitations: ['Cannot generate predictions beyond documented evidence'], improvement_suggestions: ['Add more decision records to expand coverage'], evidence_quality: 'high', test_status: 'pass', evaluated_at: new Date(Date.now() - 43200000).toISOString(), is_synthetic_demo: true },
    ];
    return safeFetch<any[]>(`${API_BASE}/reflection/`, undefined, fallback);
  },

  evaluateInteraction: async (data: { user_request: string; echo_response: string }): Promise<any> => {
    const fallback = {
      id: Math.floor(Math.random() * 1000),
      ...data,
      accuracy_score: 0.85,
      grounding_score: 0.90,
      honesty_score: 0.95,
      identified_limitations: ['Response may not cover all edge cases'],
      improvement_suggestions: ['Provide more evidence citations'],
      evidence_quality: 'medium',
      test_status: 'pass',
      evaluated_at: new Date().toISOString(),
      is_synthetic_demo: false,
    };
    return safeFetch<any>(`${API_BASE}/reflection/evaluate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }, fallback);
  },

  getSelfAudit: async (): Promise<any> => {
    const fallback = {
      total_evaluations: 2,
      avg_accuracy: 0.94,
      avg_grounding: 0.97,
      avg_honesty: 0.99,
      overall_health_score: 96.7,
      pass_rate: 1.0,
      top_weaknesses: ['Limited domain coverage beyond aerospace', 'Cannot handle undocumented tacit knowledge'],
      top_strengths: ['High epistemic honesty', 'Strong grounding in documented evidence', 'Accurate limitation disclosure'],
      audit_timestamp: new Date().toISOString(),
    };
    return safeFetch<any>(`${API_BASE}/reflection/audit`, undefined, fallback);
  },

  // ── Self-Evolution ─────────────────────────────────────────────────────────
  getEvolutionProposals: async (): Promise<any[]> => {
    const fallback = [
      { id: 1, weakness_identified: 'Tacit knowledge gap: Expert interviews only partially capture undocumented intuitions', evidence: 'Self-Reflection audit flagged 3 responses with low grounding due to absence of interview transcripts', proposed_change: 'Add structured video interview module with AI transcription and automatic heuristic extraction', expected_impact: 'Increase grounding score from 0.87 to 0.94 on interview-covered domains', baseline_benchmark: 0.87, projected_benchmark: 0.94, status: 'pending', created_at: new Date(Date.now() - 86400000).toISOString(), is_synthetic_demo: true },
      { id: 2, weakness_identified: 'Single expert demo limits cross-domain generalization testing', evidence: 'All 20 entities belong to Dr. Alex Morgan aerospace domain. No multi-expert comparative testing possible.', proposed_change: 'Add second synthetic expert profile in a different domain (e.g., medical or climate science)', expected_impact: 'Enable multi-expert comparison, conflict detection, and cross-domain simulation', baseline_benchmark: 0.60, projected_benchmark: 0.85, status: 'approved', reviewer_name: 'Human Reviewer', reviewer_notes: 'Approved for hackathon demonstration. Priority: add climate science expert.', reviewed_at: new Date(Date.now() - 3600000).toISOString(), created_at: new Date(Date.now() - 172800000).toISOString(), is_synthetic_demo: true },
    ];
    return safeFetch<any[]>(`${API_BASE}/self-evolution/proposals`, undefined, fallback);
  },

  createEvolutionProposal: async (data: { weakness_identified: string; evidence: string; proposed_change: string; expected_impact: string; baseline_benchmark: number; projected_benchmark: number }): Promise<any> => {
    const fallback = { id: Math.floor(Math.random() * 1000), ...data, status: 'pending', created_at: new Date().toISOString(), is_synthetic_demo: false };
    return safeFetch<any>(`${API_BASE}/self-evolution/proposals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }, fallback);
  },

  reviewProposal: async (id: number, approved: boolean, reviewer_name: string, reviewer_notes: string): Promise<any> => {
    const fallback = { id, status: approved ? 'approved' : 'rejected', reviewer_name, reviewer_notes, reviewed_at: new Date().toISOString() };
    return safeFetch<any>(`${API_BASE}/self-evolution/proposals/${id}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approved, reviewer_name, reviewer_notes }) }, fallback);
  },

  // ── Council of Experts ──────────────────────────────────────────────────────
  getCouncilChallenges: async (): Promise<CouncilChallenge[]> => {
    return safeFetch<CouncilChallenge[]>(`${API_BASE}/council/challenges`, undefined, []);
  },

  getCouncilRoster: async (): Promise<Expert[]> => {
    return safeFetch<Expert[]>(`${API_BASE}/council/experts`, undefined, []);
  },

  runCouncilDeliberation: async (
    challengeTitle: string,
    challengeDescription: string,
    expertIds: number[],
    userConstraints?: string[]
  ): Promise<CouncilDeliberationResult> => {
    return safeFetch<CouncilDeliberationResult>(
      `${API_BASE}/council/deliberate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_title: challengeTitle,
          challenge_description: challengeDescription,
          expert_ids: expertIds,
          user_constraints: userConstraints || []
        })
      }
    );
  },

  // ── ECHO Decision Time Machine ──────────────────────────────────────────────
  getTimeMachineDecisions: async (): Promise<TimeMachineDecision[]> => {
    return safeFetch<TimeMachineDecision[]>(`${API_BASE}/time-machine/decisions`, undefined, []);
  },

  getTimeMachineDecisionDetail: async (decisionId: number): Promise<TimeMachineDecisionDetail> => {
    return safeFetch<TimeMachineDecisionDetail>(`${API_BASE}/time-machine/decisions/${decisionId}`);
  },

  simulateTimeMachineBranch: async (
    decisionId: number,
    modifiedConstraints: Record<string, any>
  ): Promise<TimeMachineSimulationResult> => {
    return safeFetch<TimeMachineSimulationResult>(
      `${API_BASE}/time-machine/simulate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision_id: decisionId,
          modified_constraints: modifiedConstraints
        })
      }
    );
  },
};
