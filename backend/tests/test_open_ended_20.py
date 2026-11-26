import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.schemas.common import AskEchoRequest, ConversationTurn
from app.services.hybrid_intelligence_service import HybridIntelligenceService


OPEN_ENDED_QUESTIONS = [
    # General Knowledge & Science
    ("Explain quantum computing.", "hybrid_intelligence", False),
    ("How does the human brain learn?", "hybrid_intelligence", False),
    ("What causes climate change?", "hybrid_intelligence", False),
    ("Explain black holes.", "ai_intelligence", False),
    ("How do mRNA vaccines train the immune system?", "hybrid_intelligence", False),
    ("Why is the sky blue during the day and red at sunset?", "ai_intelligence", False),
    # Programming
    ("What are the differences between Java and Python?", "hybrid_intelligence", False),
    ("Explain how REST APIs differ from GraphQL.", "ai_intelligence", False),
    ("How does garbage collection work in modern programming languages?", "hybrid_intelligence", False),
    # Business & Strategy
    ("Build a business strategy for a startup.", "hybrid_intelligence", False),
    ("How should a SaaS company price its enterprise tier?", "ai_intelligence", False),
    ("How do venture capital firms evaluate Series A startups?", "hybrid_intelligence", False),
    # Creative & Conceptual
    ("Write a short metaphor comparing memory to an archive.", "hybrid_intelligence", False),
    ("How would you design a floating city on ocean waves?", "hybrid_intelligence", False),
    # Complex Reasoning & Engineering
    ("How can we improve aircraft engine safety?", "hybrid_intelligence", True),
    ("What happens to reusable heat shields when thermal expansion is ignored?", "human_expert", True),
    ("Compare passive radiation shielding with active magnetic deflection.", "hybrid_intelligence", True),
    ("How do closed-loop algae systems prevent biological fouling over long missions?", "human_expert", True),
    ("What are the trade-offs between Earth-launched habitats and in-situ regolith construction?", "hybrid_intelligence", True),
    ("Explain a topic that has never been stored in PROJECT ECHO, such as ancient Roman concrete.", "hybrid_intelligence", False),
    # Negative controls in Human Expert Mode
    ("Explain quantum computing.", "human_expert", False),
    ("What are the differences between Java and Python?", "human_expert", False),
]


def run_tests():
    db = SessionLocal()
    try:
        print("\n================================================================")
        print("   ASK ECHO 22-QUESTION OPEN-ENDED & 3-MODE VERIFICATION        ")
        print("================================================================")

        passed = 0
        for idx, (query, mode, expect_human) in enumerate(OPEN_ENDED_QUESTIONS, 1):
            res = HybridIntelligenceService.execute(
                db, AskEchoRequest(query=query, mode=mode, ai_provider="auto")
            )
            assert res.mode_used == mode, f"Mode mismatch for Q{idx}: {res.mode_used} != {mode}"
            assert res.understanding is not None, f"Missing understanding for Q{idx}"

            if mode == "human_expert":
                if expect_human:
                    assert res.human_intelligence["available"] is True, f"Expected human records for Q{idx}: {query}"
                    assert len(res.citations) >= 1
                else:
                    assert res.human_intelligence["available"] is False, f"Should NOT find human records for Q{idx}"
                    assert "couldn't find sufficient documented human expertise" in res.narrative_answer.lower()
            elif mode == "ai_intelligence":
                assert res.ai_intelligence is not None
                # Either live web/AI answered or honestly reported unavailability
                assert res.ai_intelligence["available"] is True or bool(res.ai_intelligence.get("error"))
            else:  # hybrid_intelligence
                if expect_human:
                    assert res.human_intelligence["available"] is True, f"Expected human evidence in Hybrid for Q{idx}"
                else:
                    assert res.human_intelligence["available"] is False, f"Unexpected human match for Q{idx}"
                assert res.evidence_reliability is not None

            passed += 1
            h_flag = "Human:YES" if res.human_intelligence and res.human_intelligence.get("available") else "Human:NO"
            a_flag = "AI:YES" if res.ai_intelligence and res.ai_intelligence.get("available") else "AI:OFFLINE/UNAVAIL"
            print(f"[{idx:02d}/{len(OPEN_ENDED_QUESTIONS)}] ({mode:19s}) {h_flag:9s} {a_flag:18s} | {query[:48]}")

        # Follow-up test
        follow_res = HybridIntelligenceService.execute(
            db,
            AskEchoRequest(
                query="What were the main trade-offs she considered?",
                mode="hybrid_intelligence",
                conversation_history=[
                    ConversationTurn(
                        query="How did Director Sarah Lin analyze Mars surface habitats?",
                        answer="Director Sarah Lin compared Earth-shipped modules vs ISRU regolith sintering.",
                        expert_name="Director Sarah Lin",
                    )
                ],
            ),
        )
        assert follow_res.human_intelligence["available"] is True
        assert follow_res.primary_expert and "Sarah Lin" in follow_res.primary_expert["name"]
        print("[23/23] Follow-up contextual question resolved to Director Sarah Lin")

        print(f"\n>>> ALL {passed + 1} OPEN-ENDED & FOLLOW-UP TESTS PASSED (100%) <<<\n")
    finally:
        db.close()


if __name__ == "__main__":
    run_tests()
