import re
import json
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.entities import Expert
from app.schemas.common import (
    AskEchoRequest, AskEchoResponse, EpistemicClaim, CitationSource
)
from app.services.ai_provider_service import AIProviderService
from app.services.human_knowledge_service import HumanKnowledgeService


GREETINGS = {
    "hi", "hello", "hey", "howdy", "hiya", "sup", "yo", "greetings",
    "good morning", "good afternoon", "good evening", "what's up", "how are you"
}


class HybridIntelligenceService:
    """
    Orchestrates Ask ECHO across three distinct intelligence modes:
      1. human_expert        — Strictly grounded in preserved PROJECT ECHO records.
      2. ai_intelligence     — Direct analysis from configured AI provider/model.
      3. hybrid_intelligence — Combines retrieved human expertise + AI analysis,
                               comparing agreements, disagreements, and traceability.
    """

    @staticmethod
    def execute(db: Session, request: AskEchoRequest) -> AskEchoResponse:
        raw_query = request.query.strip()
        query_lower = raw_query.lower()
        mode = (request.mode or "hybrid_intelligence").strip().lower()
        if mode not in ("human_expert", "ai_intelligence", "hybrid_intelligence"):
            mode = "hybrid_intelligence"

        # Handle simple greetings & identity questions cleanly
        IDENTITY_QUERIES = {"who are you", "who are you?", "what are you", "what are you?", "what is project echo", "what is ask echo"}
        if query_lower in GREETINGS or query_lower in IDENTITY_QUERIES or (len(raw_query.split()) <= 1 and len(raw_query) <= 5):
            return HybridIntelligenceService._handle_greeting(raw_query, mode)

        # STEP 1: Understand the question
        understanding = HybridIntelligenceService._understand_question(raw_query, request.focus_domain)

        # Dispatch by mode
        if mode == "human_expert":
            return HybridIntelligenceService._run_human_expert_mode(db, request, understanding)
        if mode == "ai_intelligence":
            return HybridIntelligenceService._run_ai_only_mode(request, understanding)
        return HybridIntelligenceService._run_hybrid_mode(db, request, understanding)

    # ------------------------------------------------------------------
    # Greeting
    # ------------------------------------------------------------------
    @staticmethod
    def _handle_greeting(raw_query: str, mode: str) -> AskEchoResponse:
        greeting_text = (
            "Hello! I am **Ask ECHO**, a Human–AI Hybrid Intelligence system.\n\n"
            "Select a mode above to begin:\n"
            "• **HYBRID INTELLIGENCE (Default)** — Retrieves preserved human expert decisions & evidence, runs AI analysis, and compares agreements/disagreements.\n"
            "• **HUMAN EXPERT** — Answers strictly from verified human expertise stored in PROJECT ECHO.\n"
            "• **AI INTELLIGENCE** — Queries your selected AI provider (Gemini, OpenAI GPT, Claude, Perplexity, or Grok) directly.\n\n"
            "Try asking any natural-language question, e.g. *\"How can we improve the safety of an aircraft engine?\"*"
        )
        return AskEchoResponse(
            query=raw_query,
            mode_used=mode,
            structured_claims=[],
            narrative_answer=greeting_text,
            primary_expert=None,
            is_insufficient_evidence=False,
            is_general_knowledge=False,
            understanding={
                "question_type": "greeting",
                "domain": "General",
                "constraints_detected": [],
                "expected_answer": "Conversational greeting and system orientation",
                "summary": "User initiated conversation with a greeting."
            },
            documented_facts=[],
            expert_verified_insights=[],
            ai_generated_inferences=[],
            uncertainties_and_gaps=[],
            citations=[],
            overall_confidence=1.0,
            engine_mode="greeting",
        )

    # ------------------------------------------------------------------
    # STEP 1: Question Understanding
    # ------------------------------------------------------------------
    @staticmethod
    def _understand_question(raw_query: str, focus_domain: Optional[str] = None) -> Dict[str, Any]:
        q_lower = raw_query.lower()

        if any(w in q_lower for w in ["what if", "what-if", "suppose", "if we", "hypothetical"]):
            q_type = "what-if / counterfactual"
        elif any(w in q_lower for w in ["compare", "versus", "vs", "difference between", "better than"]):
            q_type = "comparison"
        elif " and " in q_lower and ("?" in q_lower or len(q_lower.split()) > 10):
            q_type = "multi-part / analytical"
        elif q_lower.startswith("why"):
            q_type = "why / causal reasoning"
        elif q_lower.startswith("how"):
            q_type = "how / engineering methodology"
        elif q_lower.startswith("what"):
            q_type = "what / factual & conceptual"
        else:
            q_type = "analytical"

        # Infer domain across ECHO & open-ended general domains
        inferred_domain = focus_domain if focus_domain and focus_domain != "all" else "Cross-Domain"
        if inferred_domain == "Cross-Domain":
            if any(k in q_lower for k in ["aircraft", "engine", "hypersonic", "thermal", "fastener", "mach", "tps", "propulsion", "c/sic", "turbine"]):
                inferred_domain = "Aerospace & Hypersonic Structures"
            elif any(k in q_lower for k in ["life support", "algae", "biofilm", "water", "oxygen", "co2", "eclss", "habitat"]):
                inferred_domain = "Closed-Loop Life Support (CELSS)"
            elif any(k in q_lower for k in ["radiation", "shielding", "neutron", "cosmic", "regolith", "bnnt"]):
                inferred_domain = "Deep Space Radiation Shielding"
            elif any(k in q_lower for k in ["logistics", "gear ratio", "mars", "isru", "inflatable"]):
                inferred_domain = "Interplanetary Logistics & Architecture"
            elif any(k in q_lower for k in ["python", "java", "javascript", "code", "programming", "algorithm", "software", "database", "api", "quantum computing"]):
                inferred_domain = "Computing, Software & Quantum Systems"
            elif any(k in q_lower for k in ["business", "startup", "strategy", "market", "revenue", "pricing", "company", "product"]):
                inferred_domain = "Business Strategy & Economics"
            elif any(k in q_lower for k in ["brain", "learn", "neural", "climate", "black hole", "physics", "biology", "evolution", "chemistry", "quantum"]):
                inferred_domain = "Science, Physics & Cognitive Systems"
            elif any(k in q_lower for k in ["story", "poem", "creative", "design", "imagine", "metaphor"]):
                inferred_domain = "Creative & Conceptual Synthesis"
            else:
                inferred_domain = "General & Interdisciplinary Knowledge"

        # Detect constraints mentioned in query
        constraints = []
        if any(k in q_lower for k in ["safety", "safe", "failure", "risk", "reliability"]):
            constraints.append("High safety & failure-mitigation margin")
        if any(k in q_lower for k in ["cost", "budget", "cheap", "economic"]):
            constraints.append("Economic / lifecycle cost efficiency")
        if any(k in q_lower for k in ["mass", "weight", "lightweight"]):
            constraints.append("Mass / payload budget constraint")
        if any(k in q_lower for k in ["temperature", "heat", "thermal", "°c"]):
            constraints.append("Extreme thermal operating envelope")

        expected_answer = (
            "Evidence-backed engineering recommendations, trade-offs, and risk boundaries"
            if "how" in q_type or "what-if" in q_type or "analytical" in q_type
            else "Verified causal rationale, supporting evidence, and comparative context"
        )

        return {
            "question_type": q_type,
            "domain": inferred_domain,
            "constraints_detected": constraints,
            "expected_answer": expected_answer,
            "summary": (
                f"Identified a {q_type} inquiry in '{inferred_domain}'"
                + (f" with constraints: {', '.join(constraints)}." if constraints else ".")
            ),
        }

    # ------------------------------------------------------------------
    # Helper: Build Human Intelligence Package from Retrieved DB Records
    # ------------------------------------------------------------------
    @staticmethod
    def _build_human_package(
        db: Session,
        retrieved: Dict[str, Any],
    ) -> Dict[str, Any]:
        if not retrieved["has_matches"]:
            all_experts = retrieved.get("all_experts") or db.query(Expert).all()
            return {
                "available": False,
                "primary_expert": None,
                "experts_involved": [],
                "expert_info": None,
                "experiences_summary": [],
                "recommendations": [],
                "citations": [],
                "documented_facts": [],
                "expert_verified_insights": [],
                "structured_claims": [],
                "narrative": (
                    "I couldn't find sufficient documented human expertise in PROJECT ECHO to answer this question reliably."
                ),
                "missing_info": (
                    "No matching records found across PROJECT ECHO's stored Experts, Documents, Experiences, "
                    "KnowledgeRecords, Decision DNA, or Lessons Learned. Archived domains currently cover: "
                    + ", ".join(f"{e.name} ({e.domain})" for e in all_experts)
                ),
            }

        # Determine primary expert
        primary_expert: Optional[Expert] = None
        if retrieved["decisions"]:
            primary_expert = retrieved["decisions"][0].expert
        elif retrieved["records"]:
            primary_expert = retrieved["records"][0].expert
        elif retrieved["experiences"]:
            primary_expert = retrieved["experiences"][0].expert
        elif retrieved["documents"]:
            primary_expert = retrieved["documents"][0][0].expert
        elif retrieved["experts"]:
            primary_expert = retrieved["experts"][0]

        expert_info = {
            "id": primary_expert.id,
            "name": primary_expert.name,
            "title": primary_expert.title,
            "domain": primary_expert.domain,
            "avatar_url": primary_expert.avatar_url,
            "years_experience": primary_expert.years_experience,
            "organization": primary_expert.organization,
            "verification_status": primary_expert.verification_status,
        } if primary_expert else None

        experts_involved: List[Dict[str, Any]] = []
        seen_eids = set()
        for candidate in (
            [d.expert for d in retrieved["decisions"] if d.expert]
            + [r.expert for r in retrieved["records"] if r.expert]
            + [ex.expert for ex in retrieved["experiences"] if ex.expert]
            + [doc.expert for doc, _, _ in retrieved["documents"] if doc.expert]
            + retrieved["experts"]
        ):
            if candidate and candidate.id not in seen_eids:
                seen_eids.add(candidate.id)
                experts_involved.append({
                    "id": candidate.id,
                    "name": candidate.name,
                    "title": candidate.title,
                    "domain": candidate.domain,
                    "verification_status": candidate.verification_status,
                })

        citations: List[CitationSource] = []
        documented_facts: List[str] = []
        expert_verified_insights: List[str] = []
        recommendations: List[str] = []
        experiences_summary: List[str] = []
        narrative_sections: List[str] = []
        structured_claims: List[EpistemicClaim] = []

        # 1. Decision DNA
        if retrieved["decisions"]:
            top_dec = retrieved["decisions"][0]
            exp_name = top_dec.expert.name if top_dec.expert else (primary_expert.name if primary_expert else "ECHO Expert")
            is_verified = (top_dec.status or "").lower() == "verified"

            narrative_sections.append(
                f"### Preserved Decision DNA: {top_dec.title}\n"
                f"**Domain Authority**: {exp_name}\n"
                f"• **Problem**: {top_dec.problem_definition}\n"
                f"• **Selected Decision**: {top_dec.selected_decision}\n"
                f"• **Reasoning**: {top_dec.reasoning}\n"
                f"• **Outcome**: {top_dec.outcome}"
            )
            fact_str = f"Flight/Empirical Outcome ({top_dec.title}): {top_dec.outcome}"
            documented_facts.append(fact_str)
            structured_claims.append(EpistemicClaim(
                claim_type="DOCUMENTED FACT",
                statement=fact_str,
                grounding=f"Decision DNA #{top_dec.id}: {top_dec.title}",
                confidence=0.98,
            ))

            recommendations.append(f"{top_dec.selected_decision}")
            insight_str = f"Documented Reasoning ({exp_name}): \"{top_dec.reasoning[:200]}...\""
            if is_verified:
                expert_verified_insights.append(insight_str)
                structured_claims.append(EpistemicClaim(
                    claim_type="EXPERT-VERIFIED",
                    statement=insight_str,
                    grounding=f"Verified Decision DNA #{top_dec.id} by {exp_name}",
                    confidence=0.95,
                ))

            citations.append(CitationSource(
                source_type="decision",
                title=f"Decision DNA: {top_dec.title}",
                reference_id=top_dec.id,
                expert_name=exp_name,
                snippet=f"Selected: {top_dec.selected_decision[:120]}... Outcome: {top_dec.outcome[:100]}...",
                provenance_url=f"/decisions/{top_dec.id}",
                exact_passage=f"Problem: {top_dec.problem_definition}\nDecision: {top_dec.selected_decision}\nReasoning: {top_dec.reasoning}",
                evidence_limitation="Bound by tested mission profiles and physical operating envelope.",
            ))

        # 2. Rejected / Failed Alternatives
        if retrieved["alternatives"]:
            alt_texts = []
            for alt in retrieved["alternatives"][:2]:
                alt_texts.append(f"• **{alt.title}**: Rejected — *{alt.why_rejected}* (Risk: {alt.estimated_risk})")
                experiences_summary.append(f"Rejected alternative '{alt.title}': {alt.why_rejected}")
            narrative_sections.append("### Evaluated Alternatives & Failure Modes:\n" + "\n".join(alt_texts))

        # 3. Uploaded Documents
        if retrieved["documents"]:
            doc, _, snippet = retrieved["documents"][0]
            exp_name = doc.expert.name if doc.expert else (primary_expert.name if primary_expert else "ECHO Expert")
            narrative_sections.append(f"### Document Evidence: *{doc.title}*\n> \"{snippet}\"")
            doc_fact = f"Document Archive ({doc.filename}): \"{snippet[:160]}\""
            documented_facts.append(doc_fact)
            structured_claims.append(EpistemicClaim(
                claim_type="DOCUMENTED FACT",
                statement=doc_fact,
                grounding=f"Uploaded {doc.file_type.upper()} document #{doc.id}: {doc.filename}",
                confidence=0.97,
            ))
            citations.append(CitationSource(
                source_type="document",
                title=f"Technical Report: {doc.title}",
                reference_id=doc.id,
                expert_name=exp_name,
                snippet=snippet[:180],
                provenance_url=f"/knowledge?search={doc.title[:20]}",
                exact_passage=snippet,
                evidence_limitation=f"Extracted from {doc.file_type.upper()} ({doc.file_size} bytes).",
            ))

        # 4. Experiences
        if retrieved["experiences"]:
            ex = retrieved["experiences"][0]
            exp_name = ex.expert.name if ex.expert else (primary_expert.name if primary_expert else "ECHO Expert")
            experiences_summary.append(f"{ex.title}: {ex.actions_taken} -> {ex.results}")
            narrative_sections.append(
                f"### Documented Experience: *{ex.title}*\n"
                f"• **Challenge**: {ex.challenge}\n"
                f"• **Actions Taken**: {ex.actions_taken}\n"
                f"• **Results**: {ex.results}"
            )
            if ex.verified:
                ev_str = f"Verified Field Experience ({ex.title}): {ex.key_learnings}"
                expert_verified_insights.append(ev_str)
                structured_claims.append(EpistemicClaim(
                    claim_type="EXPERT-VERIFIED",
                    statement=ev_str,
                    grounding=f"Verified Experience #{ex.id} by {exp_name}",
                    confidence=0.95,
                ))

        # 5. Knowledge Records
        if retrieved["records"]:
            rec = retrieved["records"][0]
            exp_name = rec.expert.name if rec.expert else (primary_expert.name if primary_expert else "ECHO Expert")
            takeaways = []
            try:
                takeaways = json.loads(rec.key_takeaways) if rec.key_takeaways else []
            except Exception:
                takeaways = []
            takeaway_str = f" Key Takeaway: {takeaways[0]}" if takeaways else ""
            narrative_sections.append(
                f"### Knowledge Record: *{rec.title}* ({rec.category.upper()})\n{rec.content}\n{takeaway_str}"
            )
            if (rec.verification_status or "").lower() == "verified":
                rec_str = f"Heuristic Rule #{rec.id} ({exp_name}): {rec.content[:180]}..."
                expert_verified_insights.append(rec_str)
                structured_claims.append(EpistemicClaim(
                    claim_type="EXPERT-VERIFIED",
                    statement=rec_str,
                    grounding=f"Verified Knowledge Record #{rec.id} ({rec.title})",
                    confidence=rec.confidence_score or 0.94,
                ))
            recommendations.extend(takeaways[:2])
            citations.append(CitationSource(
                source_type="empirical_record",
                title=f"Knowledge Record #{rec.id}: {rec.title}",
                reference_id=rec.id,
                expert_name=exp_name,
                snippet=rec.content[:180],
                provenance_url="/knowledge",
                exact_passage=rec.content,
                evidence_limitation=f"Category: {rec.category}, verification: {rec.verification_status}, confidence: {rec.confidence_score}.",
            ))

        # 6. Lessons Learned
        if retrieved["lessons"]:
            lsn = retrieved["lessons"][0]
            exp_name = lsn.expert.name if lsn.expert else (primary_expert.name if primary_expert else "ECHO Expert")
            narrative_sections.append(
                f"### Lesson Learned: *{lsn.title}*\n"
                f"• **Insight**: {lsn.insight}\n"
                f"• **Anti-Pattern to Avoid**: {lsn.anti_pattern_to_avoid}\n"
                f"• **Recommended Practice**: {lsn.recommended_practice}"
            )
            recommendations.append(lsn.recommended_practice)
            experiences_summary.append(f"Avoid: {lsn.anti_pattern_to_avoid}")
            citations.append(CitationSource(
                source_type="lesson",
                title=f"Lesson Learned: {lsn.title}",
                reference_id=lsn.id,
                expert_name=exp_name,
                snippet=f"Insight: {lsn.insight[:140]}... Practice: {lsn.recommended_practice[:80]}...",
                provenance_url=f"/experts/{lsn.expert_id}" if lsn.expert_id else "/experts",
                exact_passage=f"Insight: {lsn.insight}\nAnti-Pattern: {lsn.anti_pattern_to_avoid}\nRecommended: {lsn.recommended_practice}",
                evidence_limitation="Operational retrospective engineering lesson.",
            ))

        # 7. Evidence Items
        if retrieved["evidence"]:
            ev = retrieved["evidence"][0]
            ev_fact = f"Empirical Benchmark ({ev.title}): {ev.content[:160]}..."
            documented_facts.append(ev_fact)
            structured_claims.append(EpistemicClaim(
                claim_type="DOCUMENTED FACT",
                statement=ev_fact,
                grounding=f"Evidence Log #{ev.id} ({ev.evidence_type})",
                confidence=ev.reliability_score or 0.95,
            ))
            citations.append(CitationSource(
                source_type="evidence",
                title=f"Test Log: {ev.title}",
                reference_id=ev.id,
                expert_name=primary_expert.name if primary_expert else "Testing Directorate",
                snippet=ev.content[:180],
                provenance_url=None,
                exact_passage=ev.content,
                evidence_limitation=f"Type: {ev.evidence_type}, Reliability Score: {ev.reliability_score}.",
            ))

        narrative = "\n\n".join(narrative_sections) if narrative_sections else (
            f"Retrieved preserved records from {primary_expert.name if primary_expert else 'PROJECT ECHO'}."
        )

        return {
            "available": True,
            "primary_expert": primary_expert,
            "expert_info": expert_info,
            "experts_involved": experts_involved,
            "experiences_summary": experiences_summary,
            "recommendations": [r for r in recommendations if r],
            "citations": citations,
            "documented_facts": documented_facts,
            "expert_verified_insights": expert_verified_insights,
            "structured_claims": structured_claims,
            "narrative": narrative,
            "missing_info": None,
        }

    # ------------------------------------------------------------------
    # MODE 1: HUMAN EXPERT MODE
    # ------------------------------------------------------------------
    @staticmethod
    def _run_human_expert_mode(
        db: Session,
        request: AskEchoRequest,
        understanding: Dict[str, Any],
    ) -> AskEchoResponse:
        retrieved = HumanKnowledgeService.retrieve(
            db,
            request.query,
            request.conversation_history,
            request.expert_id,
            request.focus_domain,
        )
        human = HybridIntelligenceService._build_human_package(db, retrieved)

        if not human["available"]:
            refusal = (
                "I couldn't find sufficient documented human expertise in PROJECT ECHO to answer this question reliably.\n\n"
                f"Missing Information: {human['missing_info']}"
            )
            claims = [
                EpistemicClaim(
                    claim_type="INSUFFICIENT EVIDENCE",
                    statement=f"No matching human expert records found for: '{request.query}'.",
                    grounding="Full scan of Experts, Documents, Experiences, KnowledgeRecords, Decisions, and Lessons",
                    confidence=0.0,
                )
            ]
            return AskEchoResponse(
                query=request.query,
                mode_used="human_expert",
                structured_claims=claims,
                narrative_answer=refusal,
                primary_expert=None,
                is_insufficient_evidence=True,
                missing_information_explanation=human["missing_info"],
                understanding=understanding,
                human_intelligence={
                    "available": False,
                    "experts": [],
                    "documented_experience": [],
                    "recommendations": [],
                    "summary": refusal,
                },
                ai_intelligence={"available": False, "reason": "Not requested in Human Expert mode."},
                agreements=[],
                disagreements=[],
                hybrid_recommendation=None,
                evidence_reliability={
                    "sources_count": 0,
                    "verification_status": "insufficient_evidence",
                    "confidence_limitations": "No relevant human records found in PROJECT ECHO.",
                    "missing_information": [human["missing_info"]],
                    "hybrid_completeness": "human_only_insufficient",
                },
                documented_facts=[],
                expert_verified_insights=[],
                ai_generated_inferences=[],
                uncertainties_and_gaps=[human["missing_info"]],
                citations=[],
                overall_confidence=0.0,
                engine_mode="human_expert_insufficient",
            )

        claims = list(human["structured_claims"])
        gaps = [c.evidence_limitation for c in human["citations"] if c.evidence_limitation]
        if gaps:
            claims.append(EpistemicClaim(
                claim_type="INSUFFICIENT EVIDENCE",
                statement=gaps[0],
                grounding="Operating envelope boundary of archived records",
                confidence=0.25,
            ))

        return AskEchoResponse(
            query=request.query,
            mode_used="human_expert",
            structured_claims=claims,
            narrative_answer=human["narrative"],
            primary_expert=human["expert_info"],
            is_insufficient_evidence=False,
            understanding=understanding,
            human_intelligence={
                "available": True,
                "experts": human["experts_involved"],
                "documented_experience": human["experiences_summary"],
                "recommendations": human["recommendations"],
                "summary": human["narrative"],
            },
            ai_intelligence={"available": False, "reason": "AI analysis disabled in Human Expert mode."},
            agreements=[],
            disagreements=[],
            hybrid_recommendation=None,
            evidence_reliability={
                "sources_count": len(human["citations"]),
                "verification_status": "verified" if human["expert_verified_insights"] else "documented",
                "confidence_limitations": gaps[0] if gaps else "Bounded by archived test parameters.",
                "missing_information": gaps,
                "hybrid_completeness": "human_only",
            },
            documented_facts=human["documented_facts"],
            expert_verified_insights=human["expert_verified_insights"],
            ai_generated_inferences=[],
            uncertainties_and_gaps=gaps,
            citations=human["citations"],
            overall_confidence=0.94,
            engine_mode="human_expert_grounded",
        )

    # ------------------------------------------------------------------
    # MODE 2: AI INTELLIGENCE MODE
    # ------------------------------------------------------------------
    @staticmethod
    def _run_ai_only_mode(
        request: AskEchoRequest,
        understanding: Dict[str, Any],
    ) -> AskEchoResponse:
        history_dicts = [
            {"query": h.query, "answer": h.answer} for h in (request.conversation_history or [])
        ]
        system_prompt = (
            "You are the AI Intelligence engine of PROJECT ECHO. Provide a rigorous, structured analytical response "
            "with clear recommendations and explicit limitations. Do NOT claim to speak as a PROJECT ECHO human expert."
        )
        ai_res = AIProviderService.generate(
            prompt=request.query,
            system_prompt=system_prompt,
            provider=request.ai_provider,
            model=request.ai_model,
            history=history_dicts,
        )

        if not ai_res["success"]:
            err_msg = ai_res["error"] or "Configured AI provider is unavailable."
            return AskEchoResponse(
                query=request.query,
                mode_used="ai_intelligence",
                structured_claims=[
                    EpistemicClaim(
                        claim_type="INSUFFICIENT EVIDENCE",
                        statement=err_msg,
                        grounding="AI Provider availability check",
                        confidence=0.0,
                    )
                ],
                narrative_answer=f"AI Intelligence Unavailable: {err_msg}",
                primary_expert=None,
                is_insufficient_evidence=True,
                missing_information_explanation=err_msg,
                understanding=understanding,
                human_intelligence={"available": False, "reason": "Not queried in AI Intelligence mode."},
                ai_intelligence={
                    "available": False,
                    "provider": ai_res["provider_name"],
                    "model": ai_res["model"],
                    "error": err_msg,
                    "analysis": None,
                    "recommendations": [],
                    "limitations": [err_msg],
                },
                agreements=[],
                disagreements=[],
                hybrid_recommendation=None,
                evidence_reliability={
                    "sources_count": 0,
                    "verification_status": "ai_unavailable",
                    "confidence_limitations": err_msg,
                    "missing_information": [err_msg],
                    "hybrid_completeness": "ai_unavailable",
                },
                documented_facts=[],
                expert_verified_insights=[],
                ai_generated_inferences=[],
                uncertainties_and_gaps=[err_msg],
                citations=[],
                overall_confidence=0.0,
                engine_mode="ai_provider_unavailable",
            )

        content = ai_res["content"]
        provider_label = f"{ai_res['provider_name']} ({ai_res['model']})"
        claims = [
            EpistemicClaim(
                claim_type="AI ANALYSIS",
                statement=f"Analysis generated by {provider_label}.",
                grounding=f"External AI provider ({provider_label}) — not verified against PROJECT ECHO human records.",
                confidence=0.78,
            )
        ]

        return AskEchoResponse(
            query=request.query,
            mode_used="ai_intelligence",
            structured_claims=claims,
            narrative_answer=content,
            primary_expert=None,
            is_insufficient_evidence=False,
            is_general_knowledge=True,
            external_ai_answer=content,
            understanding=understanding,
            human_intelligence={"available": False, "reason": "Human database not queried in AI Intelligence mode."},
            ai_intelligence={
                "available": True,
                "provider": ai_res["provider_name"],
                "model": ai_res["model"],
                "analysis": content,
                "recommendations": [],
                "limitations": [
                    "Generated solely by an external AI model without PROJECT ECHO human expert verification."
                ],
            },
            agreements=[],
            disagreements=[],
            hybrid_recommendation=None,
            evidence_reliability={
                "sources_count": 1,
                "verification_status": "ai_unverified",
                "confidence_limitations": "AI-only response; not cross-checked against preserved human expertise.",
                "missing_information": ["No PROJECT ECHO human expert records were consulted in AI-only mode."],
                "hybrid_completeness": "ai_only",
            },
            documented_facts=[],
            expert_verified_insights=[],
            ai_generated_inferences=[f"[{provider_label}] {content[:300]}..."],
            uncertainties_and_gaps=["Not verified against PROJECT ECHO human expert records."],
            citations=[
                CitationSource(
                    source_type="external_ai",
                    title=f"AI Response — {provider_label}",
                    reference_id=0,
                    expert_name=provider_label,
                    snippet=content[:200],
                    exact_passage=content,
                    evidence_limitation="External AI output; not verified by any PROJECT ECHO human authority.",
                )
            ],
            overall_confidence=0.75,
            engine_mode=f"ai_only_{ai_res['provider_id']}",
        )

    # ------------------------------------------------------------------
    # MODE 3: HYBRID INTELLIGENCE MODE (SIGNATURE FEATURE)
    # ------------------------------------------------------------------
    @staticmethod
    def _run_hybrid_mode(
        db: Session,
        request: AskEchoRequest,
        understanding: Dict[str, Any],
    ) -> AskEchoResponse:
        # STEP 2: Retrieve human expertise
        retrieved = HumanKnowledgeService.retrieve(
            db,
            request.query,
            request.conversation_history,
            request.expert_id,
            request.focus_domain,
        )
        human = HybridIntelligenceService._build_human_package(db, retrieved)

        # STEP 3: Build evidence context and call selected AI provider
        evidence_context = ""
        if human["available"]:
            evidence_snippets = [
                f"- [{c.source_type}] {c.title} (Expert: {c.expert_name}): {c.exact_passage or c.snippet}"
                for c in human["citations"]
            ]
            evidence_context = (
                "Retrieved PROJECT ECHO Human Expert Evidence:\n"
                + "\n".join(evidence_snippets)
            )
        else:
            evidence_context = "Retrieved PROJECT ECHO Human Expert Evidence: NONE FOUND."

        hybrid_system_prompt = (
            "You are the Hybrid Intelligence analyst for PROJECT ECHO. "
            "You are given a user question and the retrieved human expert evidence from PROJECT ECHO (if any). "
            "Respond strictly in valid JSON with these keys:\n"
            "{\n"
            '  "analysis": "Clear AI analytical perspective on the question",\n'
            '  "recommendations": ["Concrete recommendation 1", "Concrete recommendation 2"],\n'
            '  "limitations": ["Limitation or assumption 1"],\n'
            '  "agreements": ["Where AI reasoning and the retrieved human evidence agree (empty list if no human evidence)"],\n'
            '  "disagreements": ["Real differences in assumptions, scope, or priorities (empty list if none — NEVER invent fake disagreements)"],\n'
            '  "additional_insights": ["Additional insights AI contributes beyond the stored records"],\n'
            '  "missing_information": ["What critical data or test evidence is missing"],\n'
            '  "hybrid_synthesis": "Combined recommendation integrating human evidence and AI analysis while preserving any unresolved disagreements"\n'
            "}"
        )

        ai_prompt = f"User Question: {request.query}\n\n{evidence_context}"
        history_dicts = [
            {"query": h.query, "answer": h.answer} for h in (request.conversation_history or [])
        ]

        ai_res = AIProviderService.generate(
            prompt=ai_prompt,
            system_prompt=hybrid_system_prompt,
            provider=request.ai_provider,
            model=request.ai_model,
            history=history_dicts,
        )

        # Parse AI JSON if successful
        ai_parsed: Optional[Dict[str, Any]] = None
        if ai_res["success"] and ai_res["content"]:
            raw_ai = ai_res["content"].strip()
            # Extract JSON block if wrapped in markdown fences
            json_match = re.search(r"\{[\s\S]*\}", raw_ai)
            if json_match:
                try:
                    ai_parsed = json.loads(json_match.group(0))
                except Exception:
                    ai_parsed = None
            if ai_parsed is None:
                ai_parsed = {
                    "analysis": raw_ai,
                    "recommendations": [],
                    "limitations": ["AI returned unstructured prose rather than JSON comparison fields."],
                    "agreements": [],
                    "disagreements": [],
                    "additional_insights": [raw_ai[:260]],
                    "missing_information": [],
                    "hybrid_synthesis": raw_ai,
                }

        # STEP 4, 5, 6: Assemble Hybrid Intelligence Response honestly
        human_avail = human["available"]
        ai_avail = bool(ai_res["success"] and ai_parsed)

        claims: List[EpistemicClaim] = list(human["structured_claims"])
        citations: List[CitationSource] = list(human["citations"])
        ai_inferences: List[str] = []
        gaps: List[str] = [c.evidence_limitation for c in citations if c.evidence_limitation]
        agreements: List[str] = []
        disagreements: List[str] = []

        if human_avail and ai_avail:
            completeness = "full_hybrid"
            provider_label = f"{ai_res['provider_name']} ({ai_res['model']})"
            agreements = ai_parsed.get("agreements") or []
            disagreements = ai_parsed.get("disagreements") or []
            ai_analysis_text = ai_parsed.get("analysis") or ""
            ai_recs = ai_parsed.get("recommendations") or []
            ai_lims = ai_parsed.get("limitations") or []
            ai_missing = ai_parsed.get("missing_information") or []
            additional = ai_parsed.get("additional_insights") or []
            hybrid_rec = ai_parsed.get("hybrid_synthesis") or ai_analysis_text

            for ins in additional[:2]:
                ai_inferences.append(ins)
                claims.append(EpistemicClaim(
                    claim_type="AI INFERENCE",
                    statement=ins,
                    grounding=f"AI extrapolation by {provider_label}",
                    confidence=0.76,
                ))
            claims.append(EpistemicClaim(
                claim_type="AI ANALYSIS",
                statement=ai_analysis_text[:280],
                grounding=f"Comparative analysis by {provider_label}",
                confidence=0.82,
            ))
            gaps.extend(ai_missing)

            ai_section = {
                "available": True,
                "provider": ai_res["provider_name"],
                "model": ai_res["model"],
                "analysis": ai_analysis_text,
                "recommendations": ai_recs,
                "limitations": ai_lims,
            }
            narrative = f"{human['narrative']}\n\n### Hybrid Intelligence Synthesis ({provider_label})\n{hybrid_rec}"
            confidence = 0.90
            engine_mode = f"hybrid_{ai_res['provider_id']}"
            is_insufficient = False

        elif human_avail and not ai_avail:
            completeness = "human_only_ai_unavailable"
            ai_err = ai_res["error"] or "No AI provider configured."
            hybrid_rec = (
                "Hybrid synthesis is incomplete because no external AI provider is currently configured/reachable. "
                "The recommendations below are grounded strictly in PROJECT ECHO's preserved human expertise:\n• "
                + ("\n• ".join(human["recommendations"]) if human["recommendations"] else human["narrative"][:300])
            )
            ai_section = {
                "available": False,
                "provider": ai_res["provider_name"],
                "model": ai_res["model"],
                "error": ai_err,
                "analysis": None,
                "recommendations": [],
                "limitations": [ai_err],
            }
            gaps.append(f"AI provider unavailable ({ai_err}) — response reflects preserved human records only.")
            claims.append(EpistemicClaim(
                claim_type="INSUFFICIENT EVIDENCE",
                statement=f"External AI analysis unavailable: {ai_err}",
                grounding="AI Provider configuration check",
                confidence=0.20,
            ))
            narrative = human["narrative"]
            confidence = 0.85
            engine_mode = "hybrid_human_only_no_ai"
            is_insufficient = False

        elif not human_avail and ai_avail:
            completeness = "ai_only_no_human_records"
            provider_label = f"{ai_res['provider_name']} ({ai_res['model']})"
            ai_analysis_text = ai_parsed.get("analysis") or ""
            ai_recs = ai_parsed.get("recommendations") or []
            ai_lims = ai_parsed.get("limitations") or []
            hybrid_rec = (
                f"No relevant human expertise was found in PROJECT ECHO. This answer is provided solely by {provider_label} "
                f"and has NOT been validated by any ECHO domain expert:\n\n{ai_parsed.get('hybrid_synthesis') or ai_analysis_text}"
            )
            ai_section = {
                "available": True,
                "provider": ai_res["provider_name"],
                "model": ai_res["model"],
                "analysis": ai_analysis_text,
                "recommendations": ai_recs,
                "limitations": ai_lims + ["No PROJECT ECHO human records existed to validate this AI output."],
            }
            claims.append(EpistemicClaim(
                claim_type="INSUFFICIENT EVIDENCE",
                statement=f"No matching human expert records found in PROJECT ECHO for: '{request.query}'.",
                grounding="Full database scan across all ECHO knowledge tables",
                confidence=0.0,
            ))
            claims.append(EpistemicClaim(
                claim_type="AI ANALYSIS",
                statement=ai_analysis_text[:280],
                grounding=f"External AI analysis by {provider_label} (unverified by human records)",
                confidence=0.72,
            ))
            citations.append(CitationSource(
                source_type="external_ai",
                title=f"External AI Analysis — {provider_label}",
                reference_id=0,
                expert_name=provider_label,
                snippet=ai_analysis_text[:200],
                exact_passage=ai_analysis_text,
                evidence_limitation="No ECHO human expert records found; AI-only response.",
            ))
            gaps.append(human["missing_info"] or "No preserved human expert records matched this query.")
            ai_inferences.append(ai_analysis_text[:280])
            narrative = hybrid_rec
            confidence = 0.70
            engine_mode = f"external_ai_{ai_res['provider_id']}"
            is_insufficient = True

        else:
            completeness = "neither_available"
            ai_err = ai_res["error"] or "No AI provider configured."
            hybrid_rec = None
            ai_section = {
                "available": False,
                "provider": ai_res["provider_name"],
                "model": ai_res["model"],
                "error": ai_err,
                "analysis": None,
                "recommendations": [],
                "limitations": [ai_err],
            }
            gaps.extend([
                human["missing_info"] or "No matching human expert records found.",
                f"AI provider unavailable: {ai_err}",
            ])
            claims.append(EpistemicClaim(
                claim_type="INSUFFICIENT EVIDENCE",
                statement="Neither preserved human records nor a configured AI provider could answer this query.",
                grounding="Database scan + AI provider check",
                confidence=0.0,
            ))
            narrative = (
                "I couldn't find sufficient documented human expertise in PROJECT ECHO to answer this question reliably.\n\n"
                f"Additionally, external AI analysis is unavailable ({ai_err})."
            )
            confidence = 0.0
            engine_mode = "honest_boundary_disclosure"
            is_insufficient = True

        return AskEchoResponse(
            query=request.query,
            mode_used="hybrid_intelligence",
            structured_claims=claims,
            narrative_answer=narrative,
            primary_expert=human["expert_info"],
            is_insufficient_evidence=is_insufficient,
            missing_information_explanation=human["missing_info"] if not human_avail else None,
            is_general_knowledge=bool(not human_avail and ai_avail),
            external_ai_answer=ai_section.get("analysis") if (not human_avail and ai_avail) else None,
            understanding=understanding,
            human_intelligence={
                "available": human_avail,
                "experts": human["experts_involved"],
                "documented_experience": human["experiences_summary"],
                "recommendations": human["recommendations"],
                "summary": human["narrative"],
            },
            ai_intelligence=ai_section,
            agreements=agreements,
            disagreements=disagreements,
            hybrid_recommendation=hybrid_rec,
            evidence_reliability={
                "sources_count": len(citations),
                "verification_status": (
                    "expert_verified_plus_ai" if (human_avail and ai_avail)
                    else "expert_verified_only" if human_avail
                    else "ai_only_unverified" if ai_avail
                    else "insufficient_evidence"
                ),
                "confidence_limitations": gaps[0] if gaps else "Bounded by archived evidence.",
                "missing_information": [g for g in gaps if g],
                "hybrid_completeness": completeness,
            },
            documented_facts=human["documented_facts"],
            expert_verified_insights=human["expert_verified_insights"],
            ai_generated_inferences=ai_inferences,
            uncertainties_and_gaps=[g for g in gaps if g],
            citations=citations,
            overall_confidence=confidence,
            engine_mode=engine_mode,
        )
