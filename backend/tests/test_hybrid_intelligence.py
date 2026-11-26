import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.schemas.common import AskEchoRequest, ConversationTurn
from app.services.ai_provider_service import AIProviderService
from app.services.hybrid_intelligence_service import HybridIntelligenceService


def run_tests():
    db = SessionLocal()
    try:
        print("\n============================================================")
        print("   ASK ECHO HUMAN-AI HYBRID INTELLIGENCE TEST SUITE         ")
        print("============================================================")

        # 1. Provider catalog check
        providers = AIProviderService.list_providers()
        provider_ids = {p["id"] for p in providers}
        assert {"gemini", "openai", "anthropic"}.issubset(provider_ids), "Missing core AI providers"
        print(f"[1/6] AI Providers registered: {[p['id'] for p in providers]}")

        # 2. Human Expert Mode: Non-predefined aerospace safety question
        q_safety = "How can we improve the safety of an aircraft engine?"
        res_human = HybridIntelligenceService.execute(
            db, AskEchoRequest(query=q_safety, mode="human_expert")
        )
        assert res_human.mode_used in ("human_expert", "complete_human_intelligence")
        assert res_human.human_intelligence["available"] is True, "Should retrieve aerospace records"
        assert len(res_human.citations) >= 1, "Should include verifiable citations"
        assert res_human.understanding["domain"] == "Aerospace & Hypersonic Structures"
        print(f"[2/6] Human Expert Mode retrieved {len(res_human.citations)} aerospace citations for: '{q_safety}'")

        # 3. AI Intelligence Mode: handles configured OR gracefully reports unavailable
        res_ai = HybridIntelligenceService.execute(
            db, AskEchoRequest(query=q_safety, mode="ai_intelligence", ai_provider="gemini")
        )
        assert res_ai.mode_used in ("ai_intelligence", "hybrid_intelligence")
        assert res_ai.ai_intelligence is not None
        if res_ai.ai_intelligence["available"]:
            assert len(res_ai.ai_intelligence["analysis"]) > 20
            print(f"[3/6] AI Intelligence Mode succeeded via {res_ai.ai_intelligence['provider']}")
        else:
            assert "not configured" in res_ai.ai_intelligence["error"].lower() or "failed" in res_ai.ai_intelligence["error"].lower()
            print(f"[3/6] AI Intelligence Mode reported unavailability honestly (no fake AI response)")

        # 4. Hybrid Intelligence Mode (Default)
        res_hybrid = HybridIntelligenceService.execute(
            db, AskEchoRequest(query=q_safety, mode="hybrid_intelligence")
        )
        assert res_hybrid.mode_used == "hybrid_intelligence"
        assert res_hybrid.understanding is not None
        assert res_hybrid.human_intelligence["available"] is True
        assert res_hybrid.hybrid_recommendation is not None
        assert res_hybrid.evidence_reliability is not None
        print(f"[4/6] Hybrid Intelligence Mode completeness: {res_hybrid.evidence_reliability['hybrid_completeness']}")

        # 5. Human Expert Mode negative control (exact required refusal message)
        res_neg = HybridIntelligenceService.execute(
            db, AskEchoRequest(query="What are the best recipes for chocolate cake?", mode="human_expert")
        )
        assert res_neg.is_insufficient_evidence is True
        assert "I couldn't find sufficient documented human expertise in PROJECT ECHO to answer this question reliably." in res_neg.narrative_answer
        assert len(res_neg.citations) == 0
        print("[5/6] Human Expert Mode negative control returned exact honest refusal with 0 citations")

        # 6. Follow-up context retention
        res_follow = HybridIntelligenceService.execute(
            db,
            AskEchoRequest(
                query="Why did she reject the Sabatier reactor?",
                mode="hybrid_intelligence",
                conversation_history=[
                    ConversationTurn(
                        query="Tell me about Dr. Elena Rostova's life support design",
                        answer="Dr. Elena Rostova designed the Ares Bio-Dome photobioreactor.",
                        expert_name="Dr. Elena Rostova",
                    )
                ],
            ),
        )
        assert res_follow.primary_expert and "Elena Rostova" in res_follow.primary_expert["name"]
        print("[6/6] Follow-up question retained context for Dr. Elena Rostova")

        print("\n============================================================")
        print(">>> ALL 6 HYBRID INTELLIGENCE TESTS PASSED (100%) <<<")
        print("============================================================\n")
    finally:
        db.close()


if __name__ == "__main__":
    run_tests()
