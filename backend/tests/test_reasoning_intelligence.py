"""Test suite for Project ECHO Dynamic Cognitive Reasoning System.
Tests general knowledge, mathematics, programming, scientific explanations,
false premise correction, and multi-turn conversational context retention.
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.schemas.common import AskEchoRequest, ConversationTurn
from app.services.hybrid_intelligence_service import HybridIntelligenceService


def run_reasoning_tests():
    db = SessionLocal()
    try:
        print("\n=======================================================================")
        print("   PROJECT ECHO — DYNAMIC COGNITIVE REASONING TEST SUITE               ")
        print("=======================================================================")

        test_cases = [
            # 1. Complex Math
            (
                "Math-1 Arithmetic",
                "What is 15 * 19?",
                ["285"],
                "mathematical_computation"
            ),
            # 2. Physics & Quantitative Energy Calculation
            (
                "Math-2 Physics Kinetic Energy",
                "Calculate the kinetic energy of a 2000 kg vehicle moving at 30 m/s",
                ["900,000", "joules"],
                "physics_calculation"
            ),
            # 3. Programming & Algorithmic Problem Solving
            (
                "Code-1 Binary Search",
                "Write a Python binary search function and explain its time complexity",
                ["def binary_search", "log n", "mid"],
                "algorithmic_synthesis"
            ),
            # 4. Programming & Architecture Comparison
            (
                "Code-2 Java vs Python",
                "What are the architectural differences between Java and Python?",
                ["jvm", "gil", "typed", "concurrency"],
                "technical_comparison"
            ),
            # 5. Scientific Questions (Quantum Computing)
            (
                "Science-1 Quantum Algorithms",
                "Explain how quantum computing algorithms work",
                ["superposition", "entanglement", "shor", "qubit"],
                "scientific_explanation"
            ),
            # 6. Physical Science (Atmospheric Optics)
            (
                "Science-2 Rayleigh Scattering",
                "Why is the sky blue?",
                ["rayleigh", "scattering", "wavelength", "400"],
                "physics_explanation"
            ),
            # 7. False Premise & Misconception Correction
            (
                "Logic-1 False Premise Correction",
                "Why did Einstein invent the telephone?",
                ["alexander graham bell", "did not invent", "relativity"],
                "false_premise_correction"
            ),
            # 8. Vacuum Equivalence Principle
            (
                "Logic-2 Vacuum Fallacy",
                "Why do heavy objects fall faster than light objects in a vacuum?",
                ["do not fall faster", "vacuum", "acceleration", "galileo"],
                "false_premise_correction"
            ),
            # 9. Grounded Human Expert Reasoning (Dr. Elena Rostova Biofilm)
            (
                "Expert-1 Rostova Biofilm Synthesis",
                "How did Dr. Elena Rostova prevent biofilm fouling in photobioreactors?",
                ["42 khz", "piezoelectric", "biofilm"],
                "human_grounded"
            ),
            # 10. Multi-Turn Follow-Up Retention
            (
                "Context-1 Multi-Turn Follow-up",
                "Why did she reject the Sabatier reactor?",
                ["sabatier", "catalytic"],
                "context_retention"
            ),
        ]

        passed = 0
        total = len(test_cases)

        for label, query, expected_keywords, expected_type in test_cases:
            if label == "Context-1 Multi-Turn Follow-up":
                req = AskEchoRequest(
                    query=query,
                    mode="hybrid_intelligence",
                    conversation_history=[
                        ConversationTurn(
                            query="Tell me about Dr. Elena Rostova's life support design",
                            answer="Dr. Elena Rostova designed the Ares Bio-Dome photobioreactor.",
                            expert_name="Dr. Elena Rostova"
                        )
                    ]
                )
            else:
                req = AskEchoRequest(query=query, mode="hybrid_intelligence")

            res = HybridIntelligenceService.execute(db, req)
            ans_lower = res.narrative_answer.lower()

            # Check expected concepts/answers
            missing_keywords = [kw for kw in expected_keywords if kw.lower() not in ans_lower]
            assert not missing_keywords, f"[{label}] Missing expected keywords: {missing_keywords}\nGot response:\n{res.narrative_answer[:400]}"

            print(f"  [PASS] {label.ljust(35)} | Answer Length: {len(res.narrative_answer)} chars | Confidence: {res.overall_confidence:.2f}")
            passed += 1

        print("-----------------------------------------------------------------------")
        print(f"  REASONING SUITE ACCURACY: {passed}/{total} (100.0%)")
        print("=======================================================================\n")
        assert passed == total
    finally:
        db.close()


if __name__ == "__main__":
    run_reasoning_tests()
