import json
import re
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.entities import (
    AuditLog, Decision, Expert, KnowledgeConflict, Lesson, ResearchHypothesis
)
from app.services.ai_provider_service import AIProviderService
from app.services.global_knowledge_service import GlobalKnowledgeService
from app.services.human_knowledge_service import HumanKnowledgeService


class ResearchDiscoveryService:
    """
    ENGINE 5: Autonomous Research & Discovery Engine
    Identifies knowledge gaps, cross-domain connections, and conflicting findings;
    generates testable hypotheses and experiment designs; and tracks validation.
    Never presents an unvalidated hypothesis as an established scientific discovery.
    """

    @staticmethod
    def discover(
        db: Session,
        research_question: str,
        domain: Optional[str] = None,
        ai_provider: str = "auto",
    ) -> Dict[str, Any]:
        q_clean = research_question.strip()
        human_ctx = HumanKnowledgeService.retrieve(db, q_clean, focus_domain=domain)
        global_ctx = GlobalKnowledgeService.search(db, q_clean, domain=domain, limit=6)
        conflicts = db.query(KnowledgeConflict).all()
        decisions = db.query(Decision).all()
        experts = db.query(Expert).all()

        # 1. Identify Knowledge Gaps from retrieved evidence
        gaps: List[str] = []
        if not human_ctx["has_matches"]:
            gaps.append(
                f"No archived human expert decisions or empirical test logs directly cover '{q_clean}'."
            )
        if global_ctx["total"] == 0:
            gaps.append(
                "No ingested scientific papers or real-world datasets in the Global Knowledge Engine match this inquiry yet."
            )
        for dec in human_ctx.get("decisions", [])[:2]:
            gaps.append(
                f"Decision '{dec.title}' is bounded by its tested operating envelope and requires validation outside original constraints."
            )
        if not gaps:
            gaps.append("Cross-domain experimental validation under combined operational stresses is not yet recorded.")

        # 2. Discover Cross-Domain Relationships
        cross_links: List[str] = []
        if len(experts) >= 2:
            domains_present = sorted({e.domain for e in experts if e.domain})
            if len(domains_present) >= 2:
                cross_links.append(
                    f"Potential synthesis between {domains_present[0]} and {domains_present[1]} methodologies."
                )
        for dec in decisions[:2]:
            cross_links.append(f"Historical precedent: {dec.title} ({dec.expert.domain if dec.expert else 'Engineering'})")

        # 3. Conflicting Findings
        conflict_list: List[str] = [
            f"{c.title} [{c.severity}]: {c.expert_claim_a} vs. {c.expert_claim_b}"
            for c in conflicts[:3]
        ]

        # 4. Consult configured AI provider (never fake AI if unavailable)
        inferred_domain = domain or (
            human_ctx["decisions"][0].expert.domain
            if human_ctx.get("decisions") and human_ctx["decisions"][0].expert
            else "Interdisciplinary Research"
        )

        ai_used: Optional[str] = None
        hypothesis_stmt = ""
        experiments: List[Dict[str, str]] = []
        required_evidence = ""
        limitations_risks = ""

        # Check if a real LLM key is configured before calling AI for hypothesis generation
        llm_provider = None
        if ai_provider and ai_provider not in ("auto", "web_search"):
            llm_provider = ai_provider
        else:
            for pid in ["gemini", "openai", "anthropic", "perplexity", "grok"]:
                if AIProviderService.get_provider_key(pid):
                    llm_provider = pid
                    break

        if llm_provider:
            evidence_summary = "\n".join(
                [f"- Decision: {d.title} -> {d.selected_decision}" for d in human_ctx.get("decisions", [])[:3]]
                + [f"- Global: {g['title']}: {g['content'][:160]}" for g in global_ctx["results"][:3]]
            ) or "No matching local records."

            sys_prompt = (
                "You are PROJECT ECHO's Autonomous Research & Discovery Engine. "
                "Respond strictly in valid JSON with keys:\n"
                '{"hypothesis_statement": "...", '
                '"proposed_experiments": [{"title": "...", "method": "...", "evaluation_criteria": "..."}], '
                '"required_validation_evidence": "...", '
                '"limitations_and_risks": "..."}'
            )
            ai_res = AIProviderService.generate(
                prompt=f"Research Question: {q_clean}\n\nExisting Evidence:\n{evidence_summary}\n\nKnown Gaps:\n" + "\n".join(gaps),
                system_prompt=sys_prompt,
                provider=llm_provider,
            )
            if ai_res["success"] and ai_res["content"]:
                ai_used = f"{ai_res['provider_name']} ({ai_res['model']})"
                m = re.search(r"\{[\s\S]*\}", ai_res["content"])
                if m:
                    try:
                        parsed = json.loads(m.group(0))
                        hypothesis_stmt = parsed.get("hypothesis_statement", "")
                        experiments = parsed.get("proposed_experiments", [])
                        required_evidence = parsed.get("required_validation_evidence", "")
                        limitations_risks = parsed.get("limitations_and_risks", "")
                    except Exception:
                        pass

        # Deterministic evidence-grounded fallback if no LLM key is configured
        if not hypothesis_stmt:
            if human_ctx.get("decisions"):
                top_d = human_ctx["decisions"][0]
                hypothesis_stmt = (
                    f"[UNVALIDATED HYPOTHESIS] Extending the architecture from '{top_d.title}' "
                    f"({top_d.selected_decision}) into '{q_clean}' may improve performance if "
                    "boundary-layer failure modes are instrumented under controlled cyclic testing."
                )
            else:
                hypothesis_stmt = (
                    f"[UNVALIDATED HYPOTHESIS] Addressing '{q_clean}' requires a multi-variable baseline "
                    "comparing existing materials/methods against instrumented prototype trials before any "
                    "operational claims can be made."
                )
            experiments = [
                {
                    "title": "Controlled Baseline vs. Candidate Comparative Trial",
                    "method": "Design a reproducible bench-scale or simulation benchmark isolating the primary failure mode.",
                    "evaluation_criteria": "Statistically significant improvement (>=15%) with zero regression in safety margin.",
                },
                {
                    "title": "Boundary Stress & Failure-Mode Audit",
                    "method": "Subject candidate approach to extreme thermal, cyclic, or load edge cases.",
                    "evaluation_criteria": "Documented failure threshold and empirical repeatability across >=10 runs.",
                },
            ]
            required_evidence = (
                "Peer-reviewed empirical test measurements, instrumented failure logs, and independent replication. "
                + ("(No external AI LLM key configured; generated from local ECHO gap analysis.)" if not ai_used else "")
            )
            limitations_risks = (
                "This hypothesis has NOT been experimentally validated. Do not treat it as an established scientific discovery."
            )

        record = ResearchHypothesis(
            research_question=q_clean,
            domain=inferred_domain,
            knowledge_gaps=json.dumps(gaps),
            cross_domain_links=json.dumps(cross_links),
            conflicting_findings=json.dumps(conflict_list),
            hypothesis_statement=hypothesis_stmt,
            proposed_experiments=json.dumps(experiments),
            required_validation_evidence=required_evidence,
            limitations_and_risks=limitations_risks,
            status="proposed",
            ai_provider_used=ai_used or "local_gap_analysis_only",
        )
        db.add(record)
        db.add(AuditLog(
            actor="research_discovery_engine",
            action="hypothesis_generated",
            resource_type="ResearchHypothesis",
            resource_id="pending",
            details=f"question={q_clean[:100]}, ai={ai_used or 'none'}",
        ))
        db.commit()
        db.refresh(record)

        return ResearchDiscoveryService.serialize_hypothesis(record)

    @staticmethod
    def update_validation(
        db: Session,
        hypothesis_id: int,
        status: str,
        experiment_results: str,
        reviewer: str = "researcher",
    ) -> Dict[str, Any]:
        hyp = db.query(ResearchHypothesis).filter(ResearchHypothesis.id == hypothesis_id).first()
        if not hyp:
            raise ValueError(f"ResearchHypothesis {hypothesis_id} not found")
        if status not in ("proposed", "testing", "validated", "refuted"):
            raise ValueError("Invalid status")

        hyp.status = status
        hyp.experiment_results = experiment_results
        if status in ("validated", "refuted"):
            hyp.validated_at = datetime.utcnow()

        # If experimentally validated, promote into Global Knowledge Engine as real_world verified finding
        if status == "validated" and experiment_results.strip():
            job = GlobalKnowledgeService.create_ingestion_job(
                db, "text", f"Validated Research #{hyp.id}", "real_world"
            )
            GlobalKnowledgeService.process_ingestion_job(
                db=db,
                job_id=job.id,
                title=f"Validated Finding: {hyp.research_question[:120]}",
                raw_content=f"Hypothesis: {hyp.hypothesis_statement}\n\nValidated Experimental Results: {experiment_results}",
                category="real_world",
                domain=hyp.domain,
                source_name=f"ECHO Research Hypothesis #{hyp.id}",
                author_or_contributor=reviewer,
                verification_status="verified",
                limitations=hyp.limitations_and_risks,
            )

        db.add(AuditLog(
            actor=reviewer,
            action=f"hypothesis_{status}",
            resource_type="ResearchHypothesis",
            resource_id=str(hyp.id),
            details=experiment_results[:180],
        ))
        db.commit()
        db.refresh(hyp)
        return ResearchDiscoveryService.serialize_hypothesis(hyp)

    @staticmethod
    def list_hypotheses(db: Session, limit: int = 20) -> List[Dict[str, Any]]:
        rows = db.query(ResearchHypothesis).order_by(ResearchHypothesis.created_at.desc()).limit(limit).all()
        return [ResearchDiscoveryService.serialize_hypothesis(r) for r in rows]

    @staticmethod
    def serialize_hypothesis(h: ResearchHypothesis) -> Dict[str, Any]:
        return {
            "id": h.id,
            "research_question": h.research_question,
            "domain": h.domain,
            "knowledge_gaps": json.loads(h.knowledge_gaps or "[]"),
            "cross_domain_links": json.loads(h.cross_domain_links or "[]"),
            "conflicting_findings": json.loads(h.conflicting_findings or "[]"),
            "hypothesis_statement": h.hypothesis_statement,
            "proposed_experiments": json.loads(h.proposed_experiments or "[]"),
            "required_validation_evidence": h.required_validation_evidence,
            "limitations_and_risks": h.limitations_and_risks,
            "status": h.status,
            "experiment_results": h.experiment_results,
            "ai_provider_used": h.ai_provider_used,
            "created_at": h.created_at.isoformat() if h.created_at else None,
            "validated_at": h.validated_at.isoformat() if h.validated_at else None,
        }
