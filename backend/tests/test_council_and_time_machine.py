import os
import sys

# Ensure backend path is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.services.council_service import CouncilService
from app.services.time_machine_service import TimeMachineService

def test_council():
    db = SessionLocal()
    try:
        challenges = CouncilService.get_challenges()
        print(f"Challenges count: {len(challenges)}")
        assert len(challenges) >= 3, "Expected at least 3 preset challenges"

        # Test deliberation on challenge 1
        res = CouncilService.deliberate(
            db=db,
            challenge_title=challenges[0]["title"],
            challenge_description=challenges[0]["summary"],
            expert_ids=challenges[0]["default_expert_ids"]
        )
        print(f"Deliberation successful! Perspectives: {len(res['expert_perspectives'])}, Agreements: {len(res['agreements'])}, Contentions: {len(res['contentions'])}")
        assert len(res["expert_perspectives"]) == 4, "Expected 4 expert perspectives"
        assert res["synthesized_recommendation"]["title"], "Expected synthesized recommendation"
        print("Council test PASSED!")
    finally:
        db.close()

def test_time_machine():
    db = SessionLocal()
    try:
        decisions = TimeMachineService.get_available_decisions(db)
        print(f"Time Machine decisions count: {len(decisions)}")
        assert len(decisions) >= 4, f"Expected at least 4 decisions, found {len(decisions)}"

        first_dec = decisions[0]
        # Simulate high temperature constraint
        sim = TimeMachineService.simulate_branch(
            db=db,
            decision_id=first_dec["id"],
            modified_constraints={
                "temperature_c": 2100,
                "mass_budget_kg": 260,
                "flight_reusability": 20
            }
        )
        print(f"Simulated branch: '{sim['simulated_selected_decision']}', Risk: {sim['branch_risk_rating']}")
        assert sim["simulated_selected_decision"], "Expected simulated decision choice"
        assert len(sim["comparison_table"]) > 0, "Expected comparison table entries"
        print("Time Machine test PASSED!")
    finally:
        db.close()

if __name__ == "__main__":
    test_council()
    test_time_machine()
    print("ALL TESTS PASSED SUCCESSFULLY!")
