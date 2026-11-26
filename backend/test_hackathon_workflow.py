import sys
sys.path.insert(0, r'C:\Users\Kiran Revappa Billur\Desktop\echo\backend')

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("=" * 60)
print("PROJECT ECHO — 7-STAGE HACKATHON WORKFLOW VERIFICATION")
print("=" * 60)

tests = [
    ("Stage 1: Overview Dashboard", "GET", "/api/overview/dashboard", None, 200),
    ("Stage 2: Expert Roster", "GET", "/api/experts", None, 200),
    ("Stage 2b: Expert Detail (Dr. Alex Morgan)", "GET", "/api/experts/1", None, 200),
    ("Stage 3: Knowledge Extraction Records", "GET", "/api/knowledge", None, 200),
    ("Stage 4: Decision DNA Records", "GET", "/api/decisions", None, 200),
    ("Stage 4b: Decision Replay", "POST", "/api/decisions/replay", {
        "decision_id": 1,
        "temperature_celsius": 2100.0,
        "weight_budget_kg": 145.0,
        "reusability_profile": "multi_mission_reusable"
    }, 200),
    ("Stage 5: Knowledge Graph Topology", "GET", "/api/graph/data", None, 200),
    ("Stage 6: Experience Simulation", "POST", "/api/simulation/run", {
        "problem_title": "Scramjet Cowl Thermal Shock at Mach 8",
        "problem_description": "Mitigating aerothermal shock impingement on uncooled leading edges with restricted mass allowance.",
        "operating_constraints": ["Mass <= 140 kg", "Temperature ceiling 1850C", "Non-ablative reusability"],
        "domain": "Aerospace Engineering"
    }, 200),
    ("Stage 7: Ask ECHO Epistemic Query", "POST", "/api/ask-echo/query", {
        "query": "How did Dr. Alex Morgan mitigate fastener shear failure in ceramic matrix composite leading edges?"
    }, 200)
]

all_passed = True
for name, method, url, payload, expected_status in tests:
    if method == "GET":
        res = client.get(url)
    else:
        res = client.post(url, json=payload)
    
    passed = res.status_code == expected_status
    if not passed:
        all_passed = False
    
    status_label = "PASS" if passed else "FAIL"
    print(f"[{status_label}] {name}")
    print(f"       Method: {method} {url}")
    print(f"       Status: {res.status_code} (Expected {expected_status})")
    
    if passed:
        data = res.json()
        if isinstance(data, list):
            print(f"       Payload: {len(data)} items returned")
        elif isinstance(data, dict):
            keys = list(data.keys())[:4]
            print(f"       Keys: {', '.join(keys)}...")
    else:
        print(f"       Error: {res.text[:150]}")
    print()

print("=" * 60)
print(f"FINAL RESULT: {'ALL 7 STAGES FULLY OPERATIONAL' if all_passed else 'SOME TESTS FAILED'}")
print("=" * 60)
