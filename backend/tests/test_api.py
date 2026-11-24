import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

def run_all_tests():
    with TestClient(app) as client:
        print("Testing health check...")
        resp = client.get("/api/health")
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == "healthy"
        print("-> PASS: /api/health")

        print("Testing overview dashboard...")
        resp = client.get("/api/overview/dashboard")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["metrics"]["expert_profiles_count"] >= 1
        assert len(data["recent_activities"]) > 0
        print("-> PASS: /api/overview/dashboard")

        print("Testing expert list & details...")
        resp = client.get("/api/experts")
        assert resp.status_code == 200, resp.text
        experts = resp.json()
        assert len(experts) >= 1
        expert_id = experts[0]["id"]
        assert "Dr. Alex Morgan" in experts[0]["name"]

        resp_detail = client.get(f"/api/experts/{expert_id}")
        assert resp_detail.status_code == 200, resp_detail.text
        detail = resp_detail.json()
        assert "profile" in detail
        assert len(detail["projects"]) >= 1
        print("-> PASS: /api/experts and /api/experts/{id}")

        print("Testing knowledge records...")
        resp = client.get("/api/knowledge/records")
        assert resp.status_code == 200, resp.text
        records = resp.json()
        assert len(records) >= 1
        print("-> PASS: /api/knowledge/records")

        print("Testing decision DNA and alternative comparison...")
        resp = client.get("/api/decisions")
        assert resp.status_code == 200, resp.text
        decisions = resp.json()
        assert len(decisions) >= 1
        dec_id = decisions[0]["id"]

        dna_resp = client.get(f"/api/decisions/{dec_id}/dna")
        assert dna_resp.status_code == 200, dna_resp.text
        dna = dna_resp.json()
        assert len(dna["alternatives"]) >= 2
        assert len(dna["evidence_items"]) >= 1

        comp_resp = client.get(f"/api/decisions/{dec_id}/compare")
        assert comp_resp.status_code == 200, comp_resp.text
        print("-> PASS: /api/decisions and DNA comparison")

        print("Testing experience simulation engine...")
        sim_payload = {
            "problem_title": "Leading Edge Thermal Shock at Mach 7.8",
            "problem_description": "We need non-ablative leading edges surviving 1750°C without exceeding 140kg total budget.",
            "operating_constraints": ["Mass <= 140kg", "Non-ablative reusability"],
            "domain": "Aerospace Engineering"
        }
        sim_resp = client.post("/api/simulation/run", json=sim_payload)
        assert sim_resp.status_code == 200, sim_resp.text
        sim_data = sim_resp.json()
        assert len(sim_data["relevant_historical_decisions"]) >= 1
        assert len(sim_data["recommended_approaches"]) >= 1
        assert "epistemic_disclaimer" in sim_data
        print("-> PASS: /api/simulation/run")

        print("Testing Ask ECHO epistemic grounded queries...")
        ask_resp = client.post("/api/ask-echo/query", json={"query": "How was fastener thermal expansion managed?"})
        assert ask_resp.status_code == 200, ask_resp.text
        ask_data = ask_resp.json()
        assert len(ask_data["structured_claims"]) >= 1
        assert len(ask_data["citations"]) >= 1
        print("-> PASS: /api/ask-echo/query")

        print("Testing learning challenge submission & evaluation cycle...")
        studies_resp = client.get("/api/learning/case-studies")
        assert studies_resp.status_code == 200, studies_resp.text
        studies = studies_resp.json()
        assert len(studies) >= 1
        study_id = studies[0]["id"]

        study_detail = client.get(f"/api/learning/case-studies/{study_id}").json()
        assert len(study_detail["challenges"]) >= 1
        chal_id = study_detail["challenges"][0]["id"]

        sub_payload = {
            "challenge_id": chal_id,
            "student_name": "Cadet Marcus Vance",
            "proposed_solution": "Deploy 3D-woven C/SiC composite with internal titanium silicate aerogel and slotted collets.",
            "reasoning_steps": "1. C/SiC limits total assembly mass to ~120 kg.\n2. Slotted collets prevent shear failure from thermal expansion mismatch.\n3. Aerogel guarantees sub-200°C bondline temperature.",
            "alternatives_considered": "Evaluated refractory Ta-10W; rejected due to 280 kg mass penalty.",
            "evidence_cited": "Cited Arc-Jet test AJ-882 empirical data."
        }
        sub_resp = client.post("/api/learning/submissions", json=sub_payload)
        assert sub_resp.status_code == 200, sub_resp.text
        sub_result = sub_resp.json()
        assert sub_result["status"] == "evaluated"
        assert sub_result["score"] >= 80.0
        assert sub_result["assessment"] is not None
        print("-> PASS: /api/learning/submissions (Automated Assessment Generated)")

        print("Testing knowledge graph engine...")
        graph_resp = client.get("/api/graph/data")
        assert graph_resp.status_code == 200, graph_resp.text
        graph_data = graph_resp.json()
        assert len(graph_data["nodes"]) >= 6
        assert len(graph_data["edges"]) >= 5
        print("-> PASS: /api/graph/data")

        print("\n=======================================================")
        print(">>> ALL 9 PROJECT ECHO BACKEND SUITES PASSED! <<<")
        print("=======================================================")

if __name__ == "__main__":
    run_all_tests()
