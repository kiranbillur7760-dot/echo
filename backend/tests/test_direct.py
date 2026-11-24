import sys
import os
import asyncio
import httpx

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

async def run_tests():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        print("[1/9] Testing /api/health...")
        r = await client.get("/api/health")
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "healthy"
        print("  -> Health OK:", r.json())

        print("[2/9] Testing /api/overview/dashboard...")
        r = await client.get("/api/overview/dashboard")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["metrics"]["expert_profiles_count"] >= 1
        print("  -> Overview OK: Experts count =", data["metrics"]["expert_profiles_count"])

        print("[3/9] Testing /api/experts...")
        r = await client.get("/api/experts")
        assert r.status_code == 200, r.text
        experts = r.json()
        assert len(experts) >= 1
        exp_id = experts[0]["id"]
        r_det = await client.get(f"/api/experts/{exp_id}")
        assert r_det.status_code == 200, r_det.text
        print(f"  -> Experts OK: Found {experts[0]['name']} (ID: {exp_id})")

        print("[4/9] Testing /api/knowledge/records...")
        r = await client.get("/api/knowledge/records")
        assert r.status_code == 200, r.text
        records = r.json()
        assert len(records) >= 1
        print(f"  -> Knowledge Records OK: Retrieved {len(records)} records")

        print("[5/9] Testing /api/decisions and Decision DNA...")
        r = await client.get("/api/decisions")
        assert r.status_code == 200, r.text
        decisions = r.json()
        assert len(decisions) >= 1
        dec_id = decisions[0]["id"]
        dna_r = await client.get(f"/api/decisions/{dec_id}/dna")
        assert dna_r.status_code == 200, dna_r.text
        dna = dna_r.json()
        assert len(dna["alternatives"]) >= 2
        comp_r = await client.get(f"/api/decisions/{dec_id}/compare")
        assert comp_r.status_code == 200, comp_r.text
        print(f"  -> Decision DNA OK: {dna['title']} with {len(dna['alternatives'])} alternatives")

        print("[6/9] Testing /api/simulation/run...")
        sim_payload = {
            "problem_title": "Scramjet Leading Edge Aerothermal Shield",
            "problem_description": "We need to mitigate 1700°C aerothermal heating under 140kg mass budget.",
            "operating_constraints": ["Mass <= 140kg", "Non-ablative reusability"],
            "domain": "Aerospace Engineering"
        }
        sim_r = await client.post("/api/simulation/run", json=sim_payload)
        assert sim_r.status_code == 200, sim_r.text
        sim_data = sim_r.json()
        assert len(sim_data["relevant_historical_decisions"]) >= 1
        assert len(sim_data["recommended_approaches"]) >= 1
        print(f"  -> Experience Simulation OK: Generated {len(sim_data['recommended_approaches'])} approaches")

        print("[7/9] Testing /api/ask-echo/query (Epistemic Grounding)...")
        ask_r = await client.post("/api/ask-echo/query", json={"query": "How did Dr. Alex Morgan prevent fastener shear failure?"})
        assert ask_r.status_code == 200, ask_r.text
        ask_data = ask_r.json()
        assert len(ask_data["structured_claims"]) >= 1
        assert len(ask_data["citations"]) >= 1
        print(f"  -> Ask ECHO OK: {len(ask_data['structured_claims'])} epistemic claims, {len(ask_data['citations'])} citations")

        print("[8/9] Testing /api/learning/submissions & Automated Assessment...")
        studies_r = await client.get("/api/learning/case-studies")
        assert studies_r.status_code == 200, studies_r.text
        study_id = studies_r.json()[0]["id"]
        study_det = (await client.get(f"/api/learning/case-studies/{study_id}")).json()
        chal_id = study_det["challenges"][0]["id"]

        sub_payload = {
            "challenge_id": chal_id,
            "student_name": "Cadet Marcus Vance",
            "proposed_solution": "Deploy 3D-woven C/SiC composite with internal titanium silicate aerogel and slotted collets.",
            "reasoning_steps": "1. C/SiC limits total assembly mass to ~120 kg.\n2. Slotted collets prevent shear failure from thermal expansion mismatch.\n3. Aerogel guarantees sub-200°C bondline temperature.",
            "alternatives_considered": "Evaluated refractory Ta-10W; rejected due to 280 kg mass penalty.",
            "evidence_cited": "Cited Arc-Jet test AJ-882 empirical data."
        }
        sub_r = await client.post("/api/learning/submissions", json=sub_payload)
        assert sub_r.status_code == 200, sub_r.text
        sub_data = sub_r.json()
        assert sub_data["status"] == "evaluated"
        assert sub_data["score"] >= 80.0
        print(f"  -> Learning Transfer OK: Evaluated submission with score {sub_data['score']}/100")

        print("[9/9] Testing /api/graph/data...")
        graph_r = await client.get("/api/graph/data")
        assert graph_r.status_code == 200, graph_r.text
        graph_data = graph_r.json()
        assert len(graph_data["nodes"]) >= 6
        assert len(graph_data["edges"]) >= 5
        print(f"  -> Knowledge Graph OK: {len(graph_data['nodes'])} nodes, {len(graph_data['edges'])} edges")

        print("\n=======================================================")
        print(">>> ALL 9 PROJECT ECHO BACKEND SUITES PASSED! <<<")
        print("=======================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
