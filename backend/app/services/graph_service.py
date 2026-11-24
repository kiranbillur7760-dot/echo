from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import (
    Expert, Project, Decision, DecisionAlternative, Evidence, Lesson, SkillProfile, CaseStudy
)
from app.schemas.common import KnowledgeGraphResponse, GraphNode, GraphEdge

class GraphService:
    @staticmethod
    def get_full_graph(db: Session) -> KnowledgeGraphResponse:
        """
        Extracts all connected entities from the database and returns
        a unified knowledge network graph with nodes, categories, and typed edges.
        """
        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []

        # 1. Experts
        experts = db.query(Expert).all()
        for exp in experts:
            nodes.append(GraphNode(
                id=f"exp_{exp.id}",
                label=exp.name,
                type="expert",
                category="Human Intelligence",
                details={
                    "title": exp.title,
                    "organization": exp.organization,
                    "domain": exp.domain,
                    "verification": exp.verification_status,
                    "experience": f"{exp.years_experience} Years"
                },
                is_synthetic=exp.is_synthetic_demo
            ))

        # 2. Projects
        projects = db.query(Project).all()
        for proj in projects:
            nodes.append(GraphNode(
                id=f"proj_{proj.id}",
                label=proj.title,
                type="project",
                category="Mission & Program",
                details={
                    "domain": proj.domain,
                    "role": proj.role,
                    "status": proj.status,
                    "description": proj.description[:120] + "..."
                },
                is_synthetic=proj.is_synthetic_demo
            ))
            edges.append(GraphEdge(
                id=f"edge_exp_proj_{proj.id}",
                source=f"exp_{proj.expert_id}",
                target=f"proj_{proj.id}",
                label="directed_program",
                strength=1.0
            ))

        # 3. Decisions
        decisions = db.query(Decision).all()
        for dec in decisions:
            nodes.append(GraphNode(
                id=f"dec_{dec.id}",
                label=dec.title,
                type="decision",
                category="Decision DNA",
                details={
                    "problem": dec.problem_definition[:100] + "...",
                    "selected": dec.selected_decision[:100] + "...",
                    "confidence": f"{int(dec.confidence_rating * 100)}%",
                    "status": dec.status
                },
                is_synthetic=dec.is_synthetic_demo
            ))
            # Edge to expert
            edges.append(GraphEdge(
                id=f"edge_exp_dec_{dec.id}",
                source=f"exp_{dec.expert_id}",
                target=f"dec_{dec.id}",
                label="formulated_decision",
                strength=1.0
            ))
            # Edge to project
            if dec.project_id:
                edges.append(GraphEdge(
                    id=f"edge_proj_dec_{dec.id}",
                    source=f"proj_{dec.project_id}",
                    target=f"dec_{dec.id}",
                    label="governs_architecture",
                    strength=0.9
                ))

            # 4. Alternatives for this decision
            for alt in dec.alternatives:
                alt_node_id = f"alt_{alt.id}"
                nodes.append(GraphNode(
                    id=alt_node_id,
                    label=alt.title,
                    type="alternative",
                    category="Explored Path",
                    details={
                        "risk": alt.estimated_risk,
                        "why_rejected": alt.why_rejected[:120] + "..."
                    },
                    is_synthetic=dec.is_synthetic_demo
                ))
                edges.append(GraphEdge(
                    id=f"edge_dec_alt_{alt.id}",
                    source=f"dec_{dec.id}",
                    target=alt_node_id,
                    label="evaluated_alternative",
                    strength=0.7
                ))

            # 5. Evidence for this decision
            for ev in dec.evidence_items:
                ev_node_id = f"ev_{ev.id}"
                nodes.append(GraphNode(
                    id=ev_node_id,
                    label=ev.title,
                    type="evidence",
                    category="Empirical Grounding",
                    details={
                        "type": ev.evidence_type,
                        "reliability": f"{int(ev.reliability_score * 100)}%",
                        "content": ev.content[:100] + "..."
                    },
                    is_synthetic=ev.is_synthetic_demo
                ))
                edges.append(GraphEdge(
                    id=f"edge_dec_ev_{ev.id}",
                    source=f"dec_{dec.id}",
                    target=ev_node_id,
                    label="supported_by_evidence",
                    strength=0.95
                ))

            # 6. Lessons
            for les in dec.lessons:
                les_node_id = f"les_{les.id}"
                nodes.append(GraphNode(
                    id=les_node_id,
                    label=les.title,
                    type="lesson",
                    category="Heuristic & Insight",
                    details={
                        "category": les.category,
                        "insight": les.insight[:100] + "...",
                        "anti_pattern": les.anti_pattern_to_avoid[:100] + "..."
                    },
                    is_synthetic=les.is_synthetic_demo
                ))
                edges.append(GraphEdge(
                    id=f"edge_dec_les_{les.id}",
                    source=f"dec_{dec.id}",
                    target=les_node_id,
                    label="derived_lesson",
                    strength=0.85
                ))

        # 7. Case Studies
        case_studies = db.query(CaseStudy).all()
        for cs in case_studies:
            cs_node_id = f"cs_{cs.id}"
            nodes.append(GraphNode(
                id=cs_node_id,
                label=cs.title,
                type="case_study",
                category="Intelligence Transfer",
                details={
                    "domain": cs.domain,
                    "difficulty": cs.difficulty,
                    "summary": cs.summary[:100] + "..."
                },
                is_synthetic=cs.is_synthetic_demo
            ))
            if cs.decision_id:
                edges.append(GraphEdge(
                    id=f"edge_dec_cs_{cs.id}",
                    source=f"dec_{cs.decision_id}",
                    target=cs_node_id,
                    label="teaches_scenario",
                    strength=0.9
                ))

        # 8. Skills
        skills = db.query(SkillProfile).all()
        for sk in skills:
            sk_node_id = f"sk_{sk.id}"
            nodes.append(GraphNode(
                id=sk_node_id,
                label=sk.skill_name,
                type="skill",
                category="Demonstrated Mastery",
                details={
                    "category": sk.category,
                    "mastery": sk.mastery_level,
                    "points": f"{sk.score_points} pts"
                },
                is_synthetic=sk.is_synthetic_demo
            ))
            if case_studies:
                edges.append(GraphEdge(
                    id=f"edge_cs_sk_{sk.id}",
                    source=f"cs_{case_studies[0].id}",
                    target=sk_node_id,
                    label="builds_competency",
                    strength=0.8
                ))

        return KnowledgeGraphResponse(nodes=nodes, edges=edges)
