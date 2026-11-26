import os
import sys

# Ensure backend path is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.schemas.common import AskEchoRequest, ConversationTurn
from app.services.ask_echo_engine import AskEchoEngine

def run_tests():
    db = SessionLocal()
    try:
        print("\n=======================================================")
        print("    ASK ECHO EVIDENCE-BASED GROUNDING TEST SUITE       ")
        print("=======================================================")

        # Test 1: Dr. Alex Morgan - Hypersonic Fastener CTE
        print("\n[Test 1/6] Testing Dr. Alex Morgan documented query...")
        req1 = AskEchoRequest(
            query="How did Dr. Alex Morgan mitigate fastener shear failure in ceramic matrix composite leading edges?"
        )
        res1 = AskEchoEngine.answer_query(db, req1)
        print(f"  Expert: {res1.primary_expert['name'] if res1.primary_expert else 'None'}")
        print(f"  Citations: {len(res1.citations)}")
        print(f"  Documented Facts: {len(res1.documented_facts)}")
        assert res1.primary_expert and "Alex Morgan" in res1.primary_expert["name"], "Expected Dr. Alex Morgan"
        assert len(res1.citations) >= 1, "Expected >= 1 citation"
        assert any("collet" in c.snippet.lower() or "grafoil" in c.snippet.lower() for c in res1.citations), "Expected collet/Grafoil in citation"
        assert res1.is_insufficient_evidence is False, "Should not be insufficient"
        print("  -> SUCCESS: Retrieved Dr. Alex Morgan Decision DNA with verified citations.")

        # Test 2: Dr. Elena Rostova - Biofilm Mitigation
        print("\n[Test 2/6] Testing Dr. Elena Rostova documented query...")
        req2 = AskEchoRequest(
            query="What method did Dr. Elena Rostova use to prevent biofilm in photobioreactors?"
        )
        res2 = AskEchoEngine.answer_query(db, req2)
        print(f"  Expert: {res2.primary_expert['name'] if res2.primary_expert else 'None'}")
        print(f"  Citations: {len(res2.citations)}")
        assert res2.primary_expert and "Elena Rostova" in res2.primary_expert["name"], "Expected Dr. Elena Rostova"
        assert any("42 khz" in c.snippet.lower() or "ultrasonic" in c.snippet.lower() or "piezo" in c.snippet.lower() for c in res2.citations), "Expected 42 kHz ultrasound citation"
        print("  -> SUCCESS: Retrieved Dr. Elena Rostova CELSS records.")

        # Test 3: Dr. Marcus Vance - Radiation & Secondary Neutrons
        print("\n[Test 3/6] Testing Dr. Marcus Vance documented query...")
        req3 = AskEchoRequest(
            query="Why did Dr. Marcus Vance reject lead and aluminum for deep space radiation shielding?"
        )
        res3 = AskEchoEngine.answer_query(db, req3)
        print(f"  Expert: {res3.primary_expert['name'] if res3.primary_expert else 'None'}")
        print(f"  Citations: {len(res3.citations)}")
        assert res3.primary_expert and "Marcus Vance" in res3.primary_expert["name"], "Expected Dr. Marcus Vance"
        assert any("neutron" in c.snippet.lower() or "spallation" in c.snippet.lower() or "aluminum" in c.snippet.lower() for c in res3.citations), "Expected neutron spallation citation"
        print("  -> SUCCESS: Retrieved Dr. Marcus Vance Titan Shield Decision DNA.")

        # Test 4: Director Sarah Lin - Gear Ratio Logistics
        print("\n[Test 4/6] Testing Director Sarah Lin documented query...")
        req4 = AskEchoRequest(
            query="What is the gear ratio penalty in Trans-Martian injection logistics according to Director Sarah Lin?"
        )
        res4 = AskEchoEngine.answer_query(db, req4)
        print(f"  Expert: {res4.primary_expert['name'] if res4.primary_expert else 'None'}")
        print(f"  Citations: {len(res4.citations)}")
        assert res4.primary_expert and "Sarah Lin" in res4.primary_expert["name"], "Expected Director Sarah Lin"
        assert any("gear" in c.snippet.lower() or "8.5" in c.snippet.lower() or "caelus" in c.snippet.lower() for c in res4.citations), "Expected gear ratio citation"
        print("  -> SUCCESS: Retrieved Director Sarah Lin Caelus logistics records.")

        # Test 5: Follow-up question with conversation history
        print("\n[Test 5/6] Testing conversational follow-up question...")
        req5 = AskEchoRequest(
            query="Why did she reject the Sabatier catalytic reactor?",
            conversation_history=[
                ConversationTurn(
                    query="Tell me about Dr. Elena Rostova's life support architecture",
                    answer="Dr. Elena Rostova designed the Ares Bio-Dome hybrid photobioreactor system.",
                    expert_name="Dr. Elena Rostova"
                )
            ]
        )
        res5 = AskEchoEngine.answer_query(db, req5)
        print(f"  Expert: {res5.primary_expert['name'] if res5.primary_expert else 'None'}")
        assert res5.primary_expert and "Elena Rostova" in res5.primary_expert["name"], "Context should identify Dr. Elena Rostova"
        assert "sabatier" in res5.narrative_answer.lower(), "Answer should explain Sabatier rejection"
        print("  -> SUCCESS: Conversational context correctly resolved 'she' to Dr. Elena Rostova.")

        # Test 6: Honest Unknown Information + External AI Fallback
        print("\n[Test 6/6] Testing honest refusal + external AI fallback on undocumented question...")
        req6 = AskEchoRequest(
            # Completely unrelated to any ECHO expert domain — no aerospace, life support, radiation or logistics keywords
            query="What are the best recipes for chocolate cake?"
        )
        res6 = AskEchoEngine.answer_query(db, req6)
        print(f"  is_insufficient_evidence: {res6.is_insufficient_evidence}")
        print(f"  engine_mode: {res6.engine_mode}")
        print(f"  external_ai_answer present: {bool(res6.external_ai_answer)}")
        print(f"  Citations count: {len(res6.citations)}")
        print(f"  First 120 chars: {res6.narrative_answer[:120]}...")

        # Must always flag as insufficient ECHO evidence
        assert res6.is_insufficient_evidence is True, "Expected insufficient evidence flag"

        if res6.external_ai_answer:
            # External AI or Web Search fallback activated — should return an answer clearly labeled
            assert res6.engine_mode.startswith("external_"), f"Expected external_* mode, got {res6.engine_mode}"
            assert len(res6.citations) == 1, "Should have exactly 1 citation (the external source)"
            assert res6.citations[0].source_type == "external_ai", "Citation must be labeled external_ai"
            assert "NOT" in res6.narrative_answer or "EXTERNAL" in res6.narrative_answer, \
                "Answer must clearly state it's not from ECHO"
            print(f"  -> SUCCESS: External fallback ({res6.engine_mode}) activated — clearly labeled as NOT ECHO expert knowledge.")
        else:
            # No AI key & offline — honest boundary disclosure
            assert res6.engine_mode == "honest_boundary_disclosure", f"Expected honest_boundary_disclosure, got {res6.engine_mode}"
            assert len(res6.citations) == 0, "Must NOT generate fake citations"
            assert res6.overall_confidence == 0.0, "Confidence should be 0.0"
            print("  -> SUCCESS: Refused undocumented query with 0 fake citations and clear missing information explanation.")

        # Test 7: Greeting ('hi') should NOT return expert records
        print("\n[Test 7/7] Testing greeting handling ('hi')...")
        req7 = AskEchoRequest(query="hi")
        res7 = AskEchoEngine.answer_query(db, req7)
        assert res7.engine_mode == "greeting", f"Expected greeting mode, got {res7.engine_mode}"
        assert res7.primary_expert is None, "Greeting should not attribute an expert"
        assert "Hello" in res7.narrative_answer, "Expected greeting text"
        print("  -> SUCCESS: Greeting handled cleanly without returning random expert data.")

        print("\n=======================================================")
        print(">>> ALL 7 REALISTIC ASK ECHO TESTS PASSED (100%) <<<")
        print("=======================================================\n")
    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
