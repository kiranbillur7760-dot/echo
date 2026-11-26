import re
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.entities import (
    Expert, Conversation, Message, AIModelRun, EvidenceLink
)
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
    Orchestrates Ask ECHO across EXACTLY TWO INTELLIGENCE MODES:
      1. complete_human_intelligence — Speaks with one or multiple experts via their
         preserved, approved human knowledge & supporting evidence.
      2. hybrid_intelligence (Default) — Retrieves relevant human knowledge, queries
         configured AI providers (e.g., Gemini, OpenAI), compares agreements &
         disagreements, identifies missing information, and synthesizes a structured answer.
    """

    @staticmethod
    def _normalize_mode(raw_mode: Optional[str]) -> str:
        m = (raw_mode or "hybrid_intelligence").strip().lower()
        if m in ("complete_human_intelligence", "human_expert", "human"):
            return "complete_human_intelligence"
        return "hybrid_intelligence"

    @staticmethod
    def execute(db: Session, request: AskEchoRequest) -> AskEchoResponse:
        raw_query = request.query.strip()
        query_lower = raw_query.lower()
        mode = HybridIntelligenceService._normalize_mode(request.mode)

        IDENTITY_QUERIES = {
            "who are you", "who are you?", "what are you", "what are you?",
            "what is project echo", "what is ask echo"
        }
        if query_lower in GREETINGS or query_lower in IDENTITY_QUERIES or (len(raw_query.split()) <= 1 and len(raw_query) <= 5):
            return HybridIntelligenceService._handle_greeting(db, request, raw_query, mode)

        understanding = HybridIntelligenceService._understand_question(raw_query, request.focus_domain)

        if mode == "complete_human_intelligence":
            res = HybridIntelligenceService._run_complete_human_mode(db, request, understanding)
        else:
            res = HybridIntelligenceService._run_hybrid_mode(db, request, understanding)

        # Persist conversation, messages, AI runs, and evidence links
        HybridIntelligenceService._persist_turn(db, request, res)
        return res

    @staticmethod
    def _persist_turn(db: Session, request: AskEchoRequest, res: AskEchoResponse) -> None:
        try:
            conv: Optional[Conversation] = None
            if request.conversation_id:
                conv = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()

            if not conv:
                conv = Conversation(
                    title=request.query[:90],
                    mode=res.mode_used,
                    expert_id=request.expert_id or (res.primary_expert.get("id") if res.primary_expert else None),
                    expert_ids_json=json.dumps(request.expert_ids or ([request.expert_id] if request.expert_id else [])),
                    is_voice=bool(request.is_voice),
                )
                db.add(conv)
                db.flush()

            user_msg = Message(
                conversation_id=conv.id,
                sender="user",
                content=request.query,
                mode=res.mode_used,
                voice_used=bool(request.is_voice),
            )
            db.add(user_msg)
            db.flush()

            echo_msg = Message(
                conversation_id=conv.id,
                sender="echo",
                content=res.hybrid_recommendation or res.narrative_answer,
                mode=res.mode_used,
                response_json=json.dumps(res.model_dump(), default=str),
                epistemic_breakdown_json=json.dumps(res.epistemic_breakdown or {}),
                voice_used=bool(request.is_voice),
            )
            db.add(echo_msg)
            db.flush()

            for run in res.provider_runs:
                db.add(AIModelRun(
                    message_id=echo_msg.id,
                    conversation_id=conv.id,
                    provider_id=run.get("provider_id", "unknown"),
                    provider_name=run.get("provider_name", "Unknown"),
                    model=run.get("model", ""),
                    status="success" if run.get("success") else "failed",
                    latency_ms=int(run.get("latency_ms", 0)),
                    response_text=run.get("content"),
                    error_message=run.get("error"),
                ))

            for cite in res.citations:
                db.add(EvidenceLink(
                    message_id=echo_msg.id,
                    source_type=cite.source_type,
                    source_id=cite.reference_id,
                    source_title=cite.title,
                    expert_name=cite.expert_name,
                    location_or_timestamp=cite.provenance_url,
                    snippet=cite.snippet,
                    reliability_score=0.92,
                ))

            db.commit()
            res.conversation_id = conv.id
            res.message_id = echo_msg.id
        except Exception:
            db.rollback()

    @staticmethod
    def _handle_greeting(db: Session, request: AskEchoRequest, raw_query: str, mode: str) -> AskEchoResponse:
        expert_note = ""
        if request.expert_id:
            exp = db.query(Expert).filter(Expert.id == request.expert_id).first()
            if exp:
                expert_note = (
                    f"\n\nYou are speaking with the AI-powered digital representation of **{exp.name}** "
                    f"({exp.title}). Responses draw from their contributed and verified knowledge, "
                    "not private thoughts or human consciousness."
                )

        greeting_text = (
            "Hello! I am **PROJECT ECHO** — Living Human Intelligence.\n\n"
            "• **HYBRID INTELLIGENCE (Default)** — Combines verified human expert evidence with multi-provider AI analysis, highlighting agreements, disagreements, and knowledge gaps.\n"
            "• **COMPLETE HUMAN INTELLIGENCE** — Speaks directly from documented and expert-approved human knowledge with full source citations."
            + expert_note
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
                "expected_answer": "Conversational greeting and transparency disclosure",
                "summary": "User initiated conversation.",
            },
            epistemic_breakdown={
                "directly_documented_expert_knowledge": [],
                "expert_approved_knowledge": [],
                "ai_generated_interpretation": ["System orientation greeting"],
                "inference": [],
                "unknown_or_unavailable": [],
            },
            documented_facts=[],
            expert_verified_insights=[],
            ai_generated_inferences=[],
            uncertainties_and_gaps=[],
            citations=[],
            overall_confidence=1.0,
            engine_mode="greeting",
        )

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
            else:
                inferred_domain = "Interdisciplinary Human Expertise"

        constraints = []
        if any(k in q_lower for k in ["safety", "safe", "failure", "risk", "reliability"]):
            constraints.append("High safety & failure-mitigation margin")
        if any(k in q_lower for k in ["cost", "budget", "cheap", "economic"]):
            constraints.append("Economic / lifecycle cost efficiency")
        if any(k in q_lower for k in ["mass", "weight", "lightweight"]):
            constraints.append("Mass / payload budget constraint")
        if any(k in q_lower for k in ["temperature", "heat", "thermal", "°c"]):
            constraints.append("Extreme thermal operating envelope")

        return {
            "question_type": q_type,
            "domain": inferred_domain,
            "constraints_detected": constraints,
            "expected_answer": "Evidence-backed expert knowledge, rationale, and transparent epistemic boundaries",
            "summary": f"Identified a {q_type} inquiry in '{inferred_domain}'" + (f" ({', '.join(constraints)})." if constraints else "."),
        }

    @staticmethod
    def _build_human_package(db: Session, retrieved: Dict[str, Any]) -> Dict[str, Any]:
        if not retrieved["has_matches"]:
            all_experts = retrieved.get("all_experts") or []
            revoked_note = ""
            if retrieved.get("revoked_experts"):
                revoked_note = f" (Excluded suspended/revoked consent experts: {', '.join(retrieved['revoked_experts'])})"
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
                "unapproved_extracted_notes": [],
                "structured_claims": [],
                "narrative": (
                    "I couldn't find sufficient documented human expertise in PROJECT ECHO to answer this question reliably."
                ),
                "missing_info": (
                    "No matching active records found across Experts, Knowledge Units, Documents, Experiences, Decision DNA, or Lessons. "
                    + (f"Available consented experts: {', '.join(f'{e.name} ({e.domain})' for e in all_experts)}." if all_experts else "")
                    + revoked_note
                ),
            }

        primary_expert: Optional[Expert] = None
        if retrieved.get("knowledge_units"):
            primary_expert = retrieved["knowledge_units"][0].expert
        elif retrieved["decisions"]:
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
            "is_synthetic_demo": primary_expert.is_synthetic_demo,
        } if primary_expert else None

        experts_involved: List[Dict[str, Any]] = []
        seen_eids = set()
        for candidate in (
            [ku.expert for ku in retrieved.get("knowledge_units", []) if ku.expert]
            + [d.expert for d in retrieved["decisions"] if d.expert]
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
                    "is_synthetic_demo": candidate.is_synthetic_demo,
                })

        citations: List[CitationSource] = []
        documented_facts: List[str] = []
        expert_verified_insights: List[str] = []
        unapproved_notes: List[str] = []
        recommendations: List[str] = []
        experiences_summary: List[str] = []
        narrative_sections: List[str] = []
        structured_claims: List[EpistemicClaim] = []

        # 0. Structured Knowledge Units
        for ku in retrieved.get("knowledge_units", [])[:3]:
            exp_name = ku.expert.name if ku.expert else "ECHO Expert"
            is_approved = ku.verification_status == "approved_by_expert"
            status_badge = "EXPERT-APPROVED" if is_approved else ku.verification_status.upper()
            narrative_sections.append(
                f"### Knowledge Unit: {ku.title} [{status_badge}]\n"
                f"**Expert**: {exp_name} • **Topic**: {ku.topic} • **Source**: {ku.source_reference or 'Captured Source'} ({ku.source_location_or_timestamp or 'Recorded'})\n"
                f"{ku.description}"
                + (f"\n• **Reasoning & Method**: {ku.reasoning_and_method}" if ku.reasoning_and_method else "")
                + (f"\n• **Failures & Lessons**: {ku.failures_and_lessons}" if ku.failures_and_lessons else "")
            )
            if is_approved:
                msg = f"[{exp_name} — Expert-Approved] {ku.title}: {ku.description[:200]}"
                expert_verified_insights.append(msg)
                structured_claims.append(EpistemicClaim(
                    claim_type="EXPERT-VERIFIED",
                    statement=msg,
                    grounding=f"Approved Knowledge Unit #{ku.id} ({ku.source_reference or 'Studio'})",
                    confidence=ku.confidence_score or 0.96,
                ))
            else:
                note = f"[{exp_name} — {ku.verification_status}] {ku.title}: {ku.description[:180]}"
                unapproved_notes.append(note)
                structured_claims.append(EpistemicClaim(
                    claim_type="DOCUMENTED FACT",
                    statement=note,
                    grounding=f"Unapproved Knowledge Unit #{ku.id} (status: {ku.verification_status})",
                    confidence=ku.confidence_score or 0.80,
                ))
            if ku.reasoning_and_method:
                recommendations.append(ku.reasoning_and_method[:220])
            citations.append(CitationSource(
                source_type="knowledge_unit",
                title=f"Knowledge Unit: {ku.title}",
                reference_id=ku.id,
                expert_name=exp_name,
                snippet=ku.description[:180],
                provenance_url=f"/create-expert?unit={ku.id}",
                exact_passage=f"{ku.description}\n\nMethod: {ku.reasoning_and_method or 'N/A'}\nLessons: {ku.failures_and_lessons or 'N/A'}",
                evidence_limitation=f"Status: {ku.verification_status} | Location: {ku.source_location_or_timestamp or 'N/A'}",
            ))

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
            fact_str = f"Documented Outcome ({top_dec.title}): {top_dec.outcome}"
            documented_facts.append(fact_str)
            structured_claims.append(EpistemicClaim(
                claim_type="DOCUMENTED FACT",
                statement=fact_str,
                grounding=f"Decision DNA #{top_dec.id}: {top_dec.title}",
                confidence=0.98,
            ))

            recommendations.append(top_dec.selected_decision)
            insight_str = f"Expert Reasoning ({exp_name}): \"{top_dec.reasoning[:200]}...\""
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

        # 2. Rejected Alternatives
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
                title=f"Source Document: {doc.title}",
                reference_id=doc.id,
                expert_name=exp_name,
                snippet=snippet[:180],
                provenance_url=f"/create-expert?search={doc.title[:20]}",
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
            try:
                takeaways = json.loads(rec.key_takeaways) if rec.key_takeaways else []
            except Exception:
                takeaways = []
            takeaway_str = f" Key Takeaway: {takeaways[0]}" if takeaways else ""
            narrative_sections.append(
                f"### Knowledge Record: *{rec.title}* ({rec.category.upper()})\n{rec.content}\n{takeaway_str}"
            )
            if (rec.verification_status or "").lower() in ("verified", "approved_by_expert"):
                rec_str = f"Approved Heuristic #{rec.id} ({exp_name}): {rec.content[:180]}..."
                expert_verified_insights.append(rec_str)
                structured_claims.append(EpistemicClaim(
                    claim_type="EXPERT-VERIFIED",
                    statement=rec_str,
                    grounding=f"Approved Knowledge Record #{rec.id} ({rec.title})",
                    confidence=rec.confidence_score or 0.94,
                ))
            else:
                documented_facts.append(f"Unverified Record #{rec.id} ({rec.verification_status}): {rec.content[:160]}")
            recommendations.extend(takeaways[:2])
            citations.append(CitationSource(
                source_type="empirical_record",
                title=f"Knowledge Record #{rec.id}: {rec.title}",
                reference_id=rec.id,
                expert_name=exp_name,
                snippet=rec.content[:180],
                provenance_url="/create-expert",
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
                snippet=f"Insight: {lsn.insight[:140]}...",
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
                title=f"Empirical Evidence: {ev.title}",
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
            "unapproved_extracted_notes": unapproved_notes,
            "structured_claims": structured_claims,
            "narrative": narrative,
            "missing_info": None,
        }

    # ------------------------------------------------------------------
    # MODE 1: COMPLETE HUMAN INTELLIGENCE
    # ------------------------------------------------------------------
    @staticmethod
    def _run_complete_human_mode(
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
            expert_ids_filter=request.expert_ids,
            category_filter=request.category,
            verification_filter=request.verification_filter,
        )
        human = HybridIntelligenceService._build_human_package(db, retrieved)

        if not human["available"]:
            refusal = (
                "I couldn't find sufficient documented human expertise in PROJECT ECHO to answer this question reliably.\n\n"
                f"Unknown / Missing Information: {human['missing_info']}"
            )
            claims = [
                EpistemicClaim(
                    claim_type="INSUFFICIENT EVIDENCE",
                    statement=f"No matching human expert records found for: '{request.query}'.",
                    grounding="Full scan of consented Experts, Knowledge Units, Documents, Experiences, Decisions, and Lessons",
                    confidence=0.0,
                )
            ]
            return AskEchoResponse(
                query=request.query,
                mode_used="complete_human_intelligence",
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
                ai_intelligence={"available": False, "reason": "Complete Human Intelligence mode uses verified human records only."},
                provider_runs=[],
                agreements=[],
                disagreements=[],
                missing_information=[human["missing_info"]],
                hybrid_recommendation=None,
                evidence_reliability={
                    "sources_count": 0,
                    "verification_status": "insufficient_evidence",
                    "confidence_limitations": "No relevant human records found in PROJECT ECHO.",
                    "missing_information": [human["missing_info"]],
                    "hybrid_completeness": "human_only_insufficient",
                },
                epistemic_breakdown={
                    "directly_documented_expert_knowledge": [],
                    "expert_approved_knowledge": [],
                    "ai_generated_interpretation": [],
                    "inference": [],
                    "unknown_or_unavailable": [human["missing_info"]],
                },
                documented_facts=[],
                expert_verified_insights=[],
                ai_generated_inferences=[],
                uncertainties_and_gaps=[human["missing_info"]],
                citations=[],
                overall_confidence=0.0,
                engine_mode="complete_human_insufficient",
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
            mode_used="complete_human_intelligence",
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
            ai_intelligence={"available": False, "reason": "Disabled in Complete Human Intelligence mode."},
            provider_runs=[],
            agreements=[],
            disagreements=[],
            missing_information=gaps,
            hybrid_recommendation=None,
            evidence_reliability={
                "sources_count": len(human["citations"]),
                "verification_status": "expert_approved" if human["expert_verified_insights"] else "documented",
                "confidence_limitations": gaps[0] if gaps else "Bounded by archived test parameters.",
                "missing_information": gaps,
                "hybrid_completeness": "complete_human_intelligence",
            },
            epistemic_breakdown={
                "directly_documented_expert_knowledge": human["documented_facts"],
                "expert_approved_knowledge": human["expert_verified_insights"],
                "ai_generated_interpretation": [],
                "inference": [],
                "unknown_or_unavailable": gaps,
            },
            documented_facts=human["documented_facts"],
            expert_verified_insights=human["expert_verified_insights"],
            ai_generated_inferences=[],
            uncertainties_and_gaps=gaps,
            citations=human["citations"],
            overall_confidence=0.94,
            engine_mode="complete_human_grounded",
        )

    # ------------------------------------------------------------------
    # MODE 2: HYBRID INTELLIGENCE (DEFAULT)
    # ------------------------------------------------------------------
    @staticmethod
    def _run_hybrid_mode(
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
            expert_ids_filter=request.expert_ids,
            category_filter=request.category,
            verification_filter=request.verification_filter,
        )
        human = HybridIntelligenceService._build_human_package(db, retrieved)

        if human["available"]:
            evidence_snippets = [
                f"- [{c.source_type}] {c.title} (Expert: {c.expert_name}): {c.exact_passage or c.snippet}"
                for c in human["citations"]
            ]
            evidence_context = "Retrieved PROJECT ECHO Human Expert Evidence:\n" + "\n".join(evidence_snippets)
        else:
            evidence_context = "Retrieved PROJECT ECHO Human Expert Evidence: NONE FOUND."

        hybrid_system_prompt = (
            "You are an analytical AI provider inside PROJECT ECHO's Hybrid Intelligence Engine. "
            "You are given a user question and retrieved human expert evidence from PROJECT ECHO (if any). "
            "Respond strictly in valid JSON with these keys:\n"
            "{\n"
            '  "analysis": "Clear AI analytical perspective and interpretation",\n'
            '  "recommendations": ["Concrete recommendation 1", "Concrete recommendation 2"],\n'
            '  "limitations": ["Limitation or assumption 1"],\n'
            '  "agreements": ["Where AI analysis and the retrieved human evidence agree (empty list if no human evidence)"],\n'
            '  "disagreements": ["Real differences in assumptions, scope, or risk priorities (empty list if none — NEVER invent fake disagreements)"],\n'
            '  "inferences": ["Explicit AI inferences or extrapolations beyond the documented evidence"],\n'
            '  "missing_information": ["Critical data, measurements, or context that is missing"],\n'
            '  "hybrid_synthesis": "Structured synthesis combining human evidence and AI analysis"\n'
            "}"
        )

        ai_prompt = f"User Question: {request.query}\n\n{evidence_context}"
        history_dicts = [
            {"query": h.query, "answer": h.answer} for h in (request.conversation_history or [])
        ]

        requested_providers: Optional[List[str]] = None
        if request.ai_providers:
            requested_providers = request.ai_providers
        elif request.ai_provider and request.ai_provider != "auto":
            requested_providers = [request.ai_provider]

        raw_runs = AIProviderService.generate_multi(
            prompt=ai_prompt,
            system_prompt=hybrid_system_prompt,
            providers=requested_providers,
            history=history_dicts,
        )

        successful_runs: List[Dict[str, Any]] = []
        failed_runs: List[Dict[str, Any]] = []

        for run in raw_runs:
            if run["success"] and run.get("content"):
                raw_ai = run["content"].strip()
                parsed = None
                json_match = re.search(r"\{[\s\S]*\}", raw_ai)
                if json_match:
                    try:
                        parsed = json.loads(json_match.group(0))
                    except Exception:
                        parsed = None
                if parsed is None:
                    parsed = {
                        "analysis": raw_ai,
                        "recommendations": [],
                        "limitations": ["Provider returned prose rather than JSON structure."],
                        "agreements": [],
                        "disagreements": [],
                        "inferences": [raw_ai[:240]],
                        "missing_information": [],
                        "hybrid_synthesis": raw_ai,
                    }
                run["parsed"] = parsed
                successful_runs.append(run)
            else:
                failed_runs.append(run)

        human_avail = human["available"]
        ai_avail = len(successful_runs) > 0

        claims: List[EpistemicClaim] = list(human["structured_claims"])
        citations: List[CitationSource] = list(human["citations"])
        ai_inferences: List[str] = []
        ai_interpretations: List[str] = []
        gaps: List[str] = [c.evidence_limitation for c in citations if c.evidence_limitation]
        agreements: List[str] = []
        disagreements: List[str] = []
        missing_info_list: List[str] = []

        if not human_avail and human.get("missing_info"):
            missing_info_list.append(human["missing_info"])

        for f in failed_runs:
            err_txt = f"{f['provider_name']}: {f.get('error') or 'Unavailable'}"
            gaps.append(err_txt)

        if ai_avail:
            provider_analyses: List[Dict[str, Any]] = []
            all_recs: List[str] = []
            all_lims: List[str] = []
            synth_parts: List[str] = []

            for run in successful_runs:
                p = run["parsed"]
                p_label = f"{run['provider_name']} ({run['model']})"
                p_analysis = p.get("analysis") or ""
                provider_analyses.append({
                    "provider_id": run["provider_id"],
                    "provider": run["provider_name"],
                    "model": run["model"],
                    "latency_ms": run.get("latency_ms", 0),
                    "analysis": p_analysis,
                    "recommendations": p.get("recommendations") or [],
                    "limitations": p.get("limitations") or [],
                })
                ai_interpretations.append(f"[{p_label}] {p_analysis[:320]}")
                for ag in (p.get("agreements") or []):
                    if ag not in agreements:
                        agreements.append(ag)
                for dis in (p.get("disagreements") or []):
                    if dis not in disagreements:
                        disagreements.append(dis)
                for inf in (p.get("inferences") or p.get("additional_insights") or []):
                    ai_inferences.append(f"[{run['provider_name']}] {inf}")
                    claims.append(EpistemicClaim(
                        claim_type="AI INFERENCE",
                        statement=inf,
                        grounding=f"Inference by {p_label}",
                        confidence=0.75,
                    ))
                for miss in (p.get("missing_information") or []):
                    if miss not in missing_info_list:
                        missing_info_list.append(miss)
                all_recs.extend(p.get("recommendations") or [])
                all_lims.extend(p.get("limitations") or [])
                if p.get("hybrid_synthesis"):
                    synth_parts.append(f"**{p_label}**: {p['hybrid_synthesis']}")

                claims.append(EpistemicClaim(
                    claim_type="AI ANALYSIS",
                    statement=p_analysis[:280],
                    grounding=f"AI Analysis by {p_label}",
                    confidence=0.80,
                ))
                citations.append(CitationSource(
                    source_type="external_ai",
                    title=f"AI Analysis — {p_label}",
                    reference_id=0,
                    expert_name=p_label,
                    snippet=p_analysis[:200],
                    exact_passage=p_analysis,
                    evidence_limitation="AI-generated interpretation; distinguish from verified human evidence.",
                ))

            combined_analysis_text = "\n\n".join(
                f"[{pa['provider']} · {pa['model']}]\n{pa['analysis']}" for pa in provider_analyses
            )
            hybrid_rec = "\n\n".join(synth_parts) if synth_parts else combined_analysis_text
            if not human_avail:
                hybrid_rec = (
                    "No preserved human expert records matched this query in PROJECT ECHO. "
                    "The synthesis below comes from AI providers that returned results and has NOT been expert-verified:\n\n"
                    + hybrid_rec
                )

            ai_section = {
                "available": True,
                "provider": ", ".join(pa["provider"] for pa in provider_analyses),
                "model": ", ".join(pa["model"] for pa in provider_analyses),
                "providers_succeeded": provider_analyses,
                "providers_failed": [
                    {
                        "provider_id": f["provider_id"],
                        "provider": f["provider_name"],
                        "model": f.get("model", ""),
                        "error": f.get("error", "Request failed"),
                    }
                    for f in failed_runs
                ],
                "analysis": combined_analysis_text,
                "recommendations": all_recs[:6],
                "limitations": all_lims[:6],
            }

            if human_avail:
                completeness = "full_hybrid"
                narrative = f"{human['narrative']}\n\n### Final Hybrid Synthesis\n{hybrid_rec}"
                confidence = 0.91
                engine_mode = f"hybrid_{'_'.join(r['provider_id'] for r in successful_runs)}"
                is_insufficient = False
            else:
                completeness = "ai_only_no_human_records"
                narrative = hybrid_rec
                confidence = 0.72
                engine_mode = "hybrid_ai_only_unverified"
                is_insufficient = True
                claims.append(EpistemicClaim(
                    claim_type="INSUFFICIENT EVIDENCE",
                    statement=f"No matching human expert records found for '{request.query}'.",
                    grounding="Full database scan",
                    confidence=0.0,
                ))
        else:
            # No AI provider returned results — honestly report provider failures and continue with human evidence
            failed_summaries = [
                {
                    "provider_id": f["provider_id"],
                    "provider": f["provider_name"],
                    "model": f.get("model", ""),
                    "error": f.get("error", "Unavailable"),
                }
                for f in failed_runs
            ]
            ai_err = "; ".join(f"{f['provider']}: {f['error']}" for f in failed_summaries) or "No AI provider configured."
            ai_section = {
                "available": False,
                "provider": None,
                "model": None,
                "providers_succeeded": [],
                "providers_failed": failed_summaries,
                "error": ai_err,
                "analysis": None,
                "recommendations": [],
                "limitations": [ai_err],
            }
            missing_info_list.append(f"AI Provider Error/Unavailable: {ai_err}")
            claims.append(EpistemicClaim(
                claim_type="INSUFFICIENT EVIDENCE",
                statement=f"External AI providers could not complete analysis: {ai_err}",
                grounding="Live AI provider check",
                confidence=0.15,
            ))

            if human_avail:
                completeness = "human_only_ai_unavailable"
                hybrid_rec = (
                    "AI providers did not return results (" + ai_err + "). "
                    "Continuing with PROJECT ECHO's verified human expertise:\n• "
                    + ("\n• ".join(human["recommendations"]) if human["recommendations"] else human["narrative"][:300])
                )
                narrative = human["narrative"]
                confidence = 0.86
                engine_mode = "hybrid_human_only_ai_failed"
                is_insufficient = False
            else:
                completeness = "neither_available"
                hybrid_rec = None
                narrative = (
                    "I couldn't find sufficient documented human expertise in PROJECT ECHO to answer this question reliably.\n\n"
                    f"AI provider status: {ai_err}"
                )
                confidence = 0.0
                engine_mode = "honest_boundary_disclosure"
                is_insufficient = True

        all_gaps = list(dict.fromkeys([g for g in (missing_info_list + gaps) if g]))

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
            provider_runs=[
                {
                    "provider_id": r["provider_id"],
                    "provider_name": r["provider_name"],
                    "model": r.get("model", ""),
                    "success": r["success"],
                    "latency_ms": r.get("latency_ms", 0),
                    "error": r.get("error"),
                    "content": r.get("content"),
                }
                for r in raw_runs
            ],
            agreements=agreements,
            disagreements=disagreements,
            missing_information=all_gaps,
            hybrid_recommendation=hybrid_rec,
            evidence_reliability={
                "sources_count": len(citations),
                "verification_status": (
                    "expert_verified_plus_ai" if (human_avail and ai_avail)
                    else "expert_verified_only" if human_avail
                    else "ai_only_unverified" if ai_avail
                    else "insufficient_evidence"
                ),
                "confidence_limitations": all_gaps[0] if all_gaps else "Bounded by archived evidence.",
                "missing_information": all_gaps,
                "hybrid_completeness": completeness,
            },
            epistemic_breakdown={
                "directly_documented_expert_knowledge": human["documented_facts"],
                "expert_approved_knowledge": human["expert_verified_insights"],
                "ai_generated_interpretation": ai_interpretations,
                "inference": ai_inferences,
                "unknown_or_unavailable": all_gaps,
            },
            documented_facts=human["documented_facts"],
            expert_verified_insights=human["expert_verified_insights"],
            ai_generated_inferences=ai_inferences,
            uncertainties_and_gaps=all_gaps,
            citations=citations,
            overall_confidence=confidence,
            engine_mode=engine_mode,
        )
