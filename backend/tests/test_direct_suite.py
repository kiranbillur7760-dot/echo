import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.routers import (
    overview, experts, knowledge, decisions, simulation, ask_echo, learning, graph, evolution, network
)
from app.schemas.common import (
    SimulationRequest, AskEchoRequest, SubmissionCreate, DecisionReplayRequest
)

def run_suite():
    db = SessionLocal()
    try:
        print("\n=======================================================")
        print("    PROJECT ECHO INTELLIGENCE PLATFORM TEST SUITE     ")
        print("=======================================================\n")

        # 1. Overview Dashboard
        print("[1/8] Testing Overview Dashboard...")
        dash = overview.get_dashboard_overview(db)
        assert dash.metrics.expert_profiles_count >= 1, "Expected >=1 expert profile"
        assert dash.metrics.decisions_documented_count >= 1, "Expected >=1 decision"
        assert len(dash.recent_activities) >= 1, "Expected recent activities"
        print(f"  -> SUCCESS: {dash.metrics.expert_profiles_count} Expert(s), {dash.metrics.knowledge_records_count} Records, {dash.metrics.decisions_documented_count} Decisions")

        # 2. Experts
        print("\n[2/8] Testing Expert Management...")
        expert_list = experts.list_experts(db)
        assert len(expert_list) >= 1, "Expected experts in list"
        alex = next((e for e in expert_list if "Alex Morgan" in e.name), None)
        assert alex is not None, "Expected Dr. Alex Morgan in expert list"
        assert alex.is_synthetic_demo is True, "Expected synthetic demo flag"

        alex_detail = experts.get_expert_detail(alex.id, db)
        assert "profile" in alex_detail, "Expected profile data"
        assert len(alex_detail["projects"]) >= 1, "Expected projects"
        print(f"  -> SUCCESS: Verified '{alex.name}' ({alex.title}) with {len(alex_detail['projects'])} projects")

        # 3. Knowledge Records & Verification
        print("\n[3/8] Testing Knowledge Records & Heuristics...")
        records = knowledge.list_knowledge_records(db=db)
        assert len(records) >= 1, "Expected knowledge records"
        rec = next((r for r in records if getattr(r, "verification_status", "") == "verified"), records[0])
        assert rec.confidence_score >= 0.90, "Expected high confidence score"
        print(f"  -> SUCCESS: Retrieved record '{rec.title}' [Status: {rec.verification_status}, Conf: {rec.confidence_score}]")

        # 4. Decision DNA & Comparison Engine
        print("\n[4/10] Testing Decision DNA Engine & Decision Replay...")
        decision_list = decisions.list_decisions(db=db)
        assert len(decision_list) >= 1, "Expected decisions"
        primary_dec = decision_list[0]
        dna = decisions.get_decision_dna(primary_dec["id"], db)
        assert len(dna["alternatives"]) >= 2, "Expected >= 2 alternatives evaluated"
        assert len(dna["evidence_items"]) >= 1, "Expected supporting evidence"
        assert len(dna["outcomes"]) >= 1, "Expected measurable outcomes"
        print(f"  -> SUCCESS: Decision DNA '{dna['title']}' loaded with {len(dna['alternatives'])} alternatives & {len(dna['evidence_items'])} evidence items")

        # Test Decision Replay with modified assumptions
        replay_req = DecisionReplayRequest(
            decision_id=primary_dec["id"],
            modified_temperature_c=2200.0,
            modified_mission_profile="multi_mission_reusable"
        )
        replay_res = decisions.replay_decision_with_assumptions(replay_req, db)
        assert replay_res["is_hypothetical_simulation"] is True, "Expected hypothetical simulation flag"
        assert "HfB2" in replay_res["replayed_selected_approach"] or "Ultra-High" in replay_res["replayed_selected_approach"], "Expected UHTC pivot at 2200C"
        print(f"  -> SUCCESS: Decision Replay simulated pivot at 2200°C: '{replay_res['replayed_selected_approach'][:60]}...'")

        compare_matrix = decisions.compare_decision_alternatives(primary_dec["id"], db)
        assert "selected" in compare_matrix, "Expected selected decision"
        assert len(compare_matrix["alternatives_compared"]) >= 2, "Expected alternatives matrix"
        print(f"  -> SUCCESS: Alternative comparison matrix generated across {len(compare_matrix['alternatives_compared'])} candidates")

        # 5. Experience Simulation Engine
        print("\n[5/8] Testing Experience Simulation Engine...")
        sim_req = SimulationRequest(
            problem_title="Hypersonic Nose Cap Thermal Protection for Mach 7.8 Re-entry",
            problem_description="We must survive 1750°C transient aerothermal shock while remaining within 140kg total mass.",
            operating_constraints=["Total Mass <= 140 kg", "Non-ablative reusability"],
            domain="Aerospace Engineering"
        )
        sim_res = simulation.run_simulation(sim_req, db)
        assert len(sim_res.relevant_historical_decisions) >= 1, "Expected historical matches"
        assert len(sim_res.recommended_approaches) >= 1, "Expected approaches synthesized"
        assert "epistemic_disclaimer" in sim_res.__dict__, "Expected epistemic disclaimer"
        assert any("[INFERENCE]" in inf for inf in sim_res.recommended_approaches[0].ai_inferences), "Expected labeled inferences"
        print(f"  -> SUCCESS: Simulation matched {len(sim_res.relevant_historical_decisions)} historical cases and synthesized {len(sim_res.recommended_approaches)} approaches with strict epistemic boundaries")

        # 6. Ask ECHO Epistemic Grounded Intelligence
        print("\n[6/8] Testing Ask ECHO Epistemic Grounded Q&A...")
        ask_req = AskEchoRequest(
            query="How did Dr. Alex Morgan prevent fastener shear failure under high thermal expansion?"
        )
        ask_res = ask_echo.query_ask_echo(ask_req, db)
        claim_types = [c.claim_type for c in ask_res.structured_claims]
        assert "DOCUMENTED FACT" in claim_types, "Expected DOCUMENTED FACT claim"
        assert any(t in claim_types for t in ["EXPERT-VERIFIED", "EXPERT-VERIFIED INFORMATION"]), "Expected EXPERT-VERIFIED claim"
        # Either AI ANALYSIS (when AI key is configured) or INSUFFICIENT EVIDENCE (when AI provider is unavailable)
        assert any(t in claim_types for t in ["AI ANALYSIS", "AI-GENERATED INFERENCE", "INSUFFICIENT EVIDENCE"]), "Expected AI ANALYSIS or INSUFFICIENT EVIDENCE claim"
        assert "INSUFFICIENT EVIDENCE" in claim_types, "Expected INSUFFICIENT EVIDENCE claim"
        assert len(ask_res.citations) >= 1, "Expected citations"
        print(f"  -> SUCCESS: Query answered with {len(ask_res.structured_claims)} classified claims and {len(ask_res.citations)} verifiable citations")

        # 7. Intelligence Transfer: Case Study, Student Submission & Assessment
        print("\n[7/8] Testing Intelligence Transfer & Skill Assessment...")
        case_studies = learning.list_case_studies(db)
        assert len(case_studies) >= 1, "Expected case studies"
        case_id = case_studies[0].id
        case_detail = learning.get_case_study(case_id, db)
        assert len(case_detail["challenges"]) >= 1, "Expected learning challenges"
        challenge_id = case_detail["challenges"][0]["id"]

        sub_req = SubmissionCreate(
            challenge_id=challenge_id,
            student_name="Cadet Elena Chen",
            proposed_solution="3D-woven C/SiC leading edge with slotted collets and flexible Grafoil thermal barrier gaskets.",
            reasoning_steps="1. CTE mismatch shears rigid bolts above 600°C.\n2. Slotted collets allow thermal growth along chordwise axis.\n3. Assembly mass remains at 128 kg, satisfying 145 kg constraint.",
            alternatives_considered="Evaluated Ta-10W refractory alloy; rejected due to 288 kg mass violation.",
            evidence_cited="Arc-Jet Facility Run AJ-882 empirical data."
        )
        submission = learning.submit_challenge(sub_req, db)
        assert submission.score >= 80.0, "Expected passing score >= 80"
        assert submission.assessment is not None, "Expected generated assessment"
        assert len(submission.assessment.strengths) >= 1, "Expected assessment strengths"
        print(f"  -> SUCCESS: Evaluated Cadet submission [Score: {submission.score}/100, Mastery: Proficient]")

        skills = learning.list_skills(db=db)
        assert len(skills) >= 1, "Expected updated skill profiles"
        print(f"  -> SUCCESS: Updated student skill portfolio ({len(skills)} verified competencies)")

        # 8. Knowledge Graph Data Engine
        print("\n[8/10] Testing Interactive Knowledge Graph Engine...")
        graph_data = graph.get_graph_data(db)
        assert len(graph_data.nodes) >= 6, "Expected >=6 graph nodes"
        assert len(graph_data.edges) >= 5, "Expected >=5 graph edges"
        types = set(n.type for n in graph_data.nodes)
        assert "expert" in types and "decision" in types and "evidence" in types
        print(f"  -> SUCCESS: Knowledge graph generated with {len(graph_data.nodes)} nodes and {len(graph_data.edges)} relationships across entity types: {types}")

        # 9. Knowledge Evolution & Conflict Radar (SYSTEM 6: EVOLVE)
        print("\n[9/10] Testing Knowledge Evolution & Conflict Radar...")
        radar = evolution.get_evolution_radar(db)
        assert radar["summary"]["total_conflicts_detected"] >= 1, "Expected conflicts in radar"
        assert len(radar["conflicts"]) >= 1, "Expected conflict items"
        assert len(radar["superseded_updates"]) >= 1, "Expected superseded heuristics"
        conflict_id = radar["conflicts"][0]["id"]
        res_conflict = evolution.resolve_conflict(conflict_id, "Reconciled under dynamic arc-jet conditions", db)
        assert res_conflict["resolution_status"] == "resolved", "Expected conflict resolution"
        print(f"  -> SUCCESS: Knowledge Evolution Radar loaded ({radar['summary']['total_conflicts_detected']} conflicts, {len(radar['superseded_updates'])} superseded updates)")

        # 10. ECHO Network & Multi-Expert Hub
        print("\n[10/10] Testing ECHO Network & Cross-Expert Comparison...")
        net_overview = network.get_network_overview(db)
        assert len(net_overview["federated_organizations"]) >= 1, "Expected organizations"
        comp_experts = network.compare_experts(1, 2, db)
        assert "expert_a" in comp_experts and "expert_b" in comp_experts
        assert len(comp_experts["comparative_dimensions"]) >= 2
        print(f"  -> SUCCESS: ECHO Network verified ({len(net_overview['federated_organizations'])} organizations, cross-expert comparison active)")

        print("\n=======================================================")
        print(">>> ALL 10 BACKEND ENGINE & API SUITES PASSED (100%) <<<")
        print("=======================================================\n")

    finally:
        db.close()

if __name__ == "__main__":
    run_suite()
