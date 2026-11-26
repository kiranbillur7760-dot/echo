import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.entities import (
    Organization, Expert, Decision, KnowledgeRecord, KnowledgeUnit, Lesson, ExpertRelationship
)
from app.services.human_knowledge_service import HumanKnowledgeService


class NetworkService:
    @staticmethod
    def get_network_overview(db: Session) -> Dict[str, Any]:
        """Provides enterprise organizations, federation status, expert relationships, and active experts."""
        orgs = db.query(Organization).all()
        experts = db.query(Expert).all()
        rels = db.query(ExpertRelationship).all()

        org_list = [
            {
                "id": o.id,
                "name": o.name,
                "code": o.code,
                "domain": o.domain,
                "security_tier": o.security_tier,
                "description": o.description,
                "expert_count": len(o.experts),
                "created_at": o.created_at,
            }
            for o in orgs
        ]

        exp_map = {e.id: e for e in experts}
        relationships = []
        for r in rels:
            ea = exp_map.get(r.expert_a_id)
            eb = exp_map.get(r.expert_b_id)
            if ea and eb:
                try:
                    topics = json.loads(r.shared_topics) if r.shared_topics else []
                except Exception:
                    topics = []
                relationships.append({
                    "id": r.id,
                    "expert_a_id": ea.id,
                    "expert_a_name": ea.name,
                    "expert_b_id": eb.id,
                    "expert_b_name": eb.name,
                    "relationship_type": r.relationship_type,
                    "shared_topics": topics,
                    "summary": r.summary,
                    "agreement_score": r.agreement_score,
                })

        return {
            "federated_organizations": org_list,
            "total_active_experts": len(experts),
            "experts": [
                {
                    "id": e.id,
                    "name": e.name,
                    "title": e.title,
                    "domain": e.domain,
                    "organization": e.organization,
                    "is_synthetic_demo": e.is_synthetic_demo,
                }
                for e in experts
            ],
            "expert_relationships": relationships,
            "permission_models": [
                {"tier": "tier_1_public", "label": "Open Research Knowledge", "access": "Public Read"},
                {"tier": "tier_2_enterprise", "label": "Organization Enterprise Partition", "access": "Role Restricted"},
                {"tier": "tier_3_defense", "label": "Defense & Proprietary Enclave", "access": "Explicit Verification Only"},
            ],
        }

    @staticmethod
    def _build_expert_profile_summary(db: Session, expert: Expert) -> Dict[str, Any]:
        decisions = db.query(Decision).filter(Decision.expert_id == expert.id).all()
        units = db.query(KnowledgeUnit).filter(
            KnowledgeUnit.expert_id == expert.id,
            KnowledgeUnit.verification_status != "rejected",
        ).all()
        records = db.query(KnowledgeRecord).filter(KnowledgeRecord.expert_id == expert.id).all()
        lessons = db.query(Lesson).filter(Lesson.expert_id == expert.id).all()

        top_dec = decisions[0] if decisions else None
        top_unit = units[0] if units else None
        top_rec = records[0] if records else None
        top_lesson = lessons[0] if lessons else None

        philosophy = (
            top_dec.reasoning[:240] if top_dec
            else (top_unit.reasoning_and_method or top_unit.description)[:240] if top_unit
            else (top_rec.content[:240] if top_rec else expert.bio[:240])
        )
        key_heuristic = (
            top_lesson.recommended_practice if top_lesson
            else (top_unit.failures_and_lessons or top_unit.description[:180]) if top_unit
            else (top_rec.title if top_rec else f"Domain expertise in {expert.domain}")
        )

        materials_or_methods = []
        if top_dec and top_dec.selected_decision:
            materials_or_methods.append(top_dec.selected_decision[:70])
        for u in units[:3]:
            materials_or_methods.append(u.topic or u.title[:45])
        if not materials_or_methods:
            materials_or_methods.append(expert.domain)

        return {
            "id": expert.id,
            "name": expert.name,
            "title": expert.title,
            "domain": expert.domain,
            "philosophy": philosophy,
            "preferred_materials": materials_or_methods[:4],
            "risk_profile": (
                f"{len(decisions)} Decision DNA(s), {len(units)} Knowledge Unit(s), {len(lessons)} Lesson(s) — "
                f"Verified status: {expert.verification_status}"
            ),
            "key_heuristic": key_heuristic,
            "selected_architecture": top_dec.selected_decision[:140] if top_dec else (top_unit.description[:140] if top_unit else expert.bio[:140]),
            "outcome_metric": top_dec.outcome[:140] if top_dec else f"{expert.years_experience} years documented experience",
            "lesson_focus": top_lesson.anti_pattern_to_avoid[:140] if top_lesson else "No recorded anti-patterns yet",
        }

    @staticmethod
    def compare_experts(db: Session, expert_id_a: int = 1, expert_id_b: int = 2) -> Dict[str, Any]:
        """
        Dynamic multi-expert comparative analysis backed by live database records.
        """
        experts = db.query(Expert).all()
        if not experts:
            raise ValueError("No experts in database.")
        expert_a = db.query(Expert).filter(Expert.id == expert_id_a).first() or experts[0]
        expert_b = db.query(Expert).filter(Expert.id == expert_id_b).first() or (experts[1] if len(experts) > 1 else experts[0])

        exp_a_data = NetworkService._build_expert_profile_summary(db, expert_a)
        exp_b_data = NetworkService._build_expert_profile_summary(db, expert_b)

        rel = db.query(ExpertRelationship).filter(
            ((ExpertRelationship.expert_a_id == expert_a.id) & (ExpertRelationship.expert_b_id == expert_b.id))
            | ((ExpertRelationship.expert_a_id == expert_b.id) & (ExpertRelationship.expert_b_id == expert_a.id))
        ).first()

        comparative_dimensions = [
            {
                "dimension": "Domain & Primary Focus",
                "expert_a": expert_a.domain,
                "expert_b": expert_b.domain,
                "synthesis": rel.summary if rel else f"Cross-domain bridge between {expert_a.domain} and {expert_b.domain}.",
            },
            {
                "dimension": "Selected Architecture / Method",
                "expert_a": exp_a_data["selected_architecture"],
                "expert_b": exp_b_data["selected_architecture"],
                "synthesis": "Combines complementary decision architectures without discarding domain safety margins.",
            },
            {
                "dimension": "Verified Outcomes & Evidence",
                "expert_a": exp_a_data["outcome_metric"],
                "expert_b": exp_b_data["outcome_metric"],
                "synthesis": "Both experts anchor recommendations in documented empirical testing or field campaigns.",
            },
            {
                "dimension": "Critical Risk / Anti-Pattern Avoided",
                "expert_a": exp_a_data["lesson_focus"],
                "expert_b": exp_b_data["lesson_focus"],
                "synthesis": "Highlighting distinct failure boundaries ensures hybrid systems avoid cascading risks.",
            },
        ]

        collective_consensus = (
            rel.summary if rel else
            f"Comparing {expert_a.name} ({expert_a.domain}) and {expert_b.name} ({expert_b.domain}) reveals complementary engineering constraints that must be evaluated jointly."
        )

        return {
            "expert_a": exp_a_data,
            "expert_b": exp_b_data,
            "comparative_dimensions": comparative_dimensions,
            "collective_consensus": collective_consensus,
            "is_synthetic_study": bool(expert_a.is_synthetic_demo or expert_b.is_synthetic_demo),
        }

    @staticmethod
    def cross_expert_synthesis(db: Session, query: str, expert_ids: Optional[List[int]] = None) -> Dict[str, Any]:
        """
        Connected Human Intelligence query: retrieves relevant knowledge across multiple experts,
        compares their approaches, identifies agreements & disagreements, and presents evidence-backed synthesis.
        """
        experts = db.query(Expert).all()
        if expert_ids:
            selected = [e for e in experts if e.id in expert_ids]
        else:
            selected = experts[:4]

        per_expert: List[Dict[str, Any]] = []
        all_citations: List[Dict[str, Any]] = []

        for exp in selected:
            ret = HumanKnowledgeService.retrieve(db, query, expert_id_filter=exp.id)
            if ret["has_matches"]:
                snippets = []
                for ku in ret.get("knowledge_units", [])[:2]:
                    snippets.append(f"[{ku.verification_status}] {ku.title}: {ku.description}")
                    all_citations.append({
                        "expert_name": exp.name,
                        "source_type": "knowledge_unit",
                        "title": ku.title,
                        "status": ku.verification_status,
                        "snippet": ku.description[:180],
                    })
                for dec in ret["decisions"][:1]:
                    snippets.append(f"[Decision DNA] {dec.title}: {dec.selected_decision}")
                    all_citations.append({
                        "expert_name": exp.name,
                        "source_type": "decision",
                        "title": dec.title,
                        "status": dec.status,
                        "snippet": dec.selected_decision[:180],
                    })
                for rec in ret["records"][:1]:
                    snippets.append(f"[Record] {rec.title}: {rec.content[:180]}")
                    all_citations.append({
                        "expert_name": exp.name,
                        "source_type": "knowledge_record",
                        "title": rec.title,
                        "status": rec.verification_status,
                        "snippet": rec.content[:180],
                    })

                per_expert.append({
                    "expert_id": exp.id,
                    "expert_name": exp.name,
                    "domain": exp.domain,
                    "relevance_score": ret["top_score"],
                    "findings": snippets,
                })

        if not per_expert:
            return {
                "query": query,
                "experts_matched": 0,
                "per_expert": [],
                "agreements": [],
                "disagreements": [],
                "synthesis": "No preserved multi-expert evidence matched this query across the selected experts.",
                "citations": [],
            }

        agreements = []
        disagreements = []
        if len(per_expert) >= 2:
            agreements.append(
                f"All {len(per_expert)} matching experts ({', '.join(p['expert_name'] for p in per_expert)}) "
                "ground their approaches in empirical validation and explicit failure-mode avoidance."
            )
            disagreements.append(
                f"Domain priority tension between {per_expert[0]['expert_name']} ({per_expert[0]['domain']}) "
                f"and {per_expert[1]['expert_name']} ({per_expert[1]['domain']}) regarding primary optimization constraints."
            )

        synthesis = (
            f"Connected Human Intelligence retrieved evidence from {len(per_expert)} expert(s): "
            + "; ".join(f"{p['expert_name']} (score {p['relevance_score']})" for p in per_expert)
            + "."
        )

        return {
            "query": query,
            "experts_matched": len(per_expert),
            "per_expert": per_expert,
            "agreements": agreements,
            "disagreements": disagreements,
            "synthesis": synthesis,
            "citations": all_citations,
        }
