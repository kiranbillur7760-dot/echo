import os
import sys
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.models.entities import Expert
from app.schemas.common import AskEchoRequest, ConversationTurn
from app.services.hybrid_intelligence_service import HybridIntelligenceService


def run_benchmark():
    db = SessionLocal()
    try:
        experts = {e.name: e.id for e in db.query(Expert).all()}
        alex_id = next(v for k, v in experts.items() if "Alex Morgan" in k)
        elena_id = next(v for k, v in experts.items() if "Elena Rostova" in k)
        marcus_id = next(v for k, v in experts.items() if "Marcus Vance" in k)
        sarah_id = next(v for k, v in experts.items() if "Sarah Lin" in k)

        # (label, query, expert_id_filter, expected_expert_substr, expected_terms, expect_sufficient_human)
        cases = [
            # Dr. Alex Morgan
            ("Morgan-1 Fastener CTE", "How did Dr. Alex Morgan mitigate fastener shear failure in ceramic matrix composite leading edges?", None, "Alex Morgan", ["collet", "grafoil"], True),
            ("Morgan-2 Ta-10W Rejected", "Why was Ta-10W refractory alloy rejected in Project Hyperion?", None, "Alex Morgan", ["ta-10w", "rejected"], True),
            ("Morgan-3 C/SiC Reusability", "What thermal protection material was selected for reusable Mach 7+ leading edges?", None, "Alex Morgan", ["c/sic"], True),
            ("Morgan-4 Voice Self-Intro", "What did you work on?", alex_id, "Alex Morgan", ["hyperion"], True),
            # Dr. Elena Rostova
            ("Rostova-1 Biofilm", "How did Dr. Elena Rostova prevent biofilm fouling in photobioreactors?", None, "Elena Rostova", ["42 khz", "piezoelectric"], True),
            ("Rostova-2 Sabatier", "Why was the Sabatier catalytic reactor rejected for Ares Bio-Dome?", None, "Elena Rostova", ["sabatier"], True),
            ("Rostova-3 Voice Self-Intro", "Tell me about your projects and experience", elena_id, "Elena Rostova", ["ares", "bio-dome"], True),
            # Dr. Marcus Vance
            ("Vance-1 Lead/Al Rejection", "Why did Dr. Marcus Vance reject lead and aluminum for radiation shielding?", None, "Marcus Vance", ["neutron", "spallation"], True),
            ("Vance-2 BNNT Composite", "What material did Dr. Marcus Vance use for deep space GCR shielding?", None, "Marcus Vance", ["bnnt"], True),
            ("Vance-3 Voice Self-Intro", "What is your expertise?", marcus_id, "Marcus Vance", ["radiation"], True),
            # Director Sarah Lin
            ("Lin-1 Gear Ratio", "What is the gear ratio penalty in Trans-Martian injection logistics according to Director Sarah Lin?", None, "Sarah Lin", ["gear", "caelus"], True),
            ("Lin-2 ISRU Regolith", "Why did Director Sarah Lin choose autonomous ISRU regolith construction over Earth-shipped modules?", None, "Sarah Lin", ["isru"], True),
            ("Lin-3 Voice Self-Intro", "What did you work on?", sarah_id, "Sarah Lin", ["caelus"], True),
            # Cross-Expert Isolation (Voice Call must NEVER leak another expert's data)
            ("Isolation-1 Morgan asked Elena topic", "How do you prevent biofilm buildup using 42 kHz ultrasonic transducers?", alex_id, None, [], False),
            ("Isolation-2 Elena asked Vance topic", "Why did you reject lead and aluminum for cosmic ray spallation?", elena_id, None, [], False),
            # Negative Controls (Undocumented domains)
            ("Neg-1 Quantum", "Explain quantum computing algorithms.", None, None, [], False),
            ("Neg-2 Cooking", "What are the best recipes for chocolate cake?", None, None, [], False),
            ("Neg-3 Java vs Python", "What are the differences between Java and Python?", None, None, [], False),
            ("Neg-4 Roman Concrete", "How was ancient Roman concrete formulated?", None, None, [], False),
        ]

        latencies = []
        passed = 0
        total = len(cases) + 1  # +1 for follow-up test

        print("\n=======================================================================")
        print("         PROJECT ECHO — 100% ACCURACY & LATENCY BENCHMARK SUITE        ")
        print("=======================================================================")

        for idx, (label, query, exp_id, exp_substr, terms, expect_human) in enumerate(cases, 1):
            t0 = time.perf_counter()
            res = HybridIntelligenceService.execute(
                db, AskEchoRequest(query=query, mode="human_expert", expert_id=exp_id)
            )
            dt_ms = (time.perf_counter() - t0) * 1000.0
            latencies.append(dt_ms)

            human_avail = bool(res.human_intelligence and res.human_intelligence.get("available"))
            assert human_avail == expect_human, (
                f"[{label}] Expected human_avail={expect_human}, got {human_avail} (top_expert={res.primary_expert})"
            )

            if expect_human:
                assert res.primary_expert and exp_substr in res.primary_expert["name"], (
                    f"[{label}] Expected '{exp_substr}', got {res.primary_expert}"
                )
                assert len(res.citations) >= 1, f"[{label}] Expected >= 1 citation"
                combined_text = (
                    res.narrative_answer + " " + " ".join(c.snippet + " " + (c.exact_passage or "") for c in res.citations)
                ).lower()
                for term in terms:
                    assert term in combined_text, f"[{label}] Missing expected grounded term '{term}'"
            else:
                assert len(res.citations) == 0, f"[{label}] Negative control leaked {len(res.citations)} citations!"
                assert "couldn't find sufficient documented human expertise" in res.narrative_answer.lower()

            passed += 1
            print(f"  [PASS {idx:02d}/{total}] {label:34s} | {dt_ms:6.2f} ms | Citations: {len(res.citations)}")

        # Case 20: Multi-turn Follow-Up Resolution
        t0 = time.perf_counter()
        res_follow = HybridIntelligenceService.execute(
            db,
            AskEchoRequest(
                query="Why did she reject the Sabatier reactor?",
                mode="human_expert",
                conversation_history=[
                    ConversationTurn(
                        query="Tell me about Dr. Elena Rostova's life support design",
                        answer="Dr. Elena Rostova designed the Ares Bio-Dome photobioreactor.",
                        expert_name="Dr. Elena Rostova",
                    )
                ],
            ),
        )
        dt_ms = (time.perf_counter() - t0) * 1000.0
        latencies.append(dt_ms)
        assert res_follow.primary_expert and "Elena Rostova" in res_follow.primary_expert["name"]
        assert "sabatier" in res_follow.narrative_answer.lower()
        passed += 1
        print(f"  [PASS {total:02d}/{total}] {'FollowUp-1 Pronoun Context':34s} | {dt_ms:6.2f} ms | Citations: {len(res_follow.citations)}")

        avg_ms = sum(latencies) / len(latencies)
        max_ms = max(latencies)
        accuracy_pct = (passed / total) * 100.0

        print("-----------------------------------------------------------------------")
        print(f"  BENCHMARK ACCURACY : {passed}/{total} ({accuracy_pct:.1f}%)")
        print(f"  AVG LATENCY        : {avg_ms:.2f} ms")
        print(f"  MAX LATENCY        : {max_ms:.2f} ms")
        print("=======================================================================\n")
        assert accuracy_pct == 100.0
    finally:
        db.close()


if __name__ == "__main__":
    run_benchmark()
