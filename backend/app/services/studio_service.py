import json
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import (
    ActivityLog,
    Document,
    Expert,
    ExpertConsent,
    KnowledgeUnit,
    SourceMedia,
    VerificationHistory,
)
from app.services.ai_provider_service import AIProviderService
from app.services.document_service import DocumentService

VALID_VERIFICATION_STATES = {
    "ai_extracted",
    "awaiting_expert_review",
    "approved_by_expert",
    "rejected",
    "needs_correction",
}


INTERVIEW_STAGES = [
    {
        "stage": 1,
        "key": "problem_or_situation",
        "question": "What specific critical problem, failure risk, or high-stakes situation in your domain taught you a lasting lesson?",
    },
    {
        "stage": 2,
        "key": "context_and_experience",
        "question": "What operating conditions, constraints, and real-world context shaped how you approached that situation?",
    },
    {
        "stage": 3,
        "key": "reasoning_and_method",
        "question": "Walk me through your step-by-step reasoning, practical methods, and why you rejected conventional or alternative approaches.",
    },
    {
        "stage": 4,
        "key": "failures_and_lessons",
        "question": "What failed or nearly failed along the way, and what core heuristic or warning should future practitioners never forget?",
    },
]


class StudioService:
    """
    Expert Intelligence Creation Studio service handling all 6 capture modalities,
    AI-assisted / heuristic Knowledge Unit extraction, 5-state Expert Verification,
    and explicit Consent / Revocation governance.
    """

    @staticmethod
    def serialize_unit(ku: KnowledgeUnit) -> Dict[str, Any]:
        return {
            "id": ku.id,
            "expert_id": ku.expert_id,
            "expert_name": ku.expert.name if ku.expert else "Unknown Expert",
            "source_media_id": ku.source_media_id,
            "document_id": ku.document_id,
            "title": ku.title,
            "description": ku.description,
            "category": ku.category,
            "topic": ku.topic,
            "problem_or_situation": ku.problem_or_situation,
            "context_and_experience": ku.context_and_experience,
            "reasoning_and_method": ku.reasoning_and_method,
            "decisions_and_alternatives": ku.decisions_and_alternatives,
            "failures_and_lessons": ku.failures_and_lessons,
            "source_reference": ku.source_reference,
            "source_location_or_timestamp": ku.source_location_or_timestamp,
            "verification_status": ku.verification_status,
            "access_permissions": ku.access_permissions,
            "confidence_score": ku.confidence_score,
            "expert_notes": ku.expert_notes,
            "is_synthetic_demo": ku.is_synthetic_demo,
            "created_at": ku.created_at,
            "updated_at": ku.updated_at,
        }

    @staticmethod
    def list_knowledge_units(
        db: Session,
        expert_id: Optional[int] = None,
        category: Optional[str] = None,
        topic: Optional[str] = None,
        verification_status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        q = db.query(KnowledgeUnit)
        if expert_id:
            q = q.filter(KnowledgeUnit.expert_id == expert_id)
        if category and category != "all":
            q = q.filter(KnowledgeUnit.category == category)
        if topic and topic != "all":
            q = q.filter(KnowledgeUnit.topic.ilike(f"%{topic}%"))
        if verification_status and verification_status != "all":
            q = q.filter(KnowledgeUnit.verification_status == verification_status)
        if search:
            pat = f"%{search}%"
            q = q.filter(
                KnowledgeUnit.title.ilike(pat)
                | KnowledgeUnit.description.ilike(pat)
                | KnowledgeUnit.topic.ilike(pat)
                | KnowledgeUnit.reasoning_and_method.ilike(pat)
                | KnowledgeUnit.failures_and_lessons.ilike(pat)
            )
        units = q.order_by(KnowledgeUnit.updated_at.desc(), KnowledgeUnit.created_at.desc()).all()
        return [StudioService.serialize_unit(u) for u in units]

    @staticmethod
    def create_manual_unit(db: Session, payload: Dict[str, Any]) -> Dict[str, Any]:
        expert = db.query(Expert).filter(Expert.id == payload["expert_id"]).first()
        if not expert:
            raise ValueError("Expert not found.")

        status = payload.get("verification_status") or "awaiting_expert_review"
        if status not in VALID_VERIFICATION_STATES:
            status = "awaiting_expert_review"

        media = SourceMedia(
            expert_id=expert.id,
            media_type=payload.get("capture_channel", "manual"),
            title=payload["title"],
            transcript=payload.get("description", ""),
            status="extracted",
            is_synthetic_demo=False,
        )
        db.add(media)
        db.flush()

        ku = KnowledgeUnit(
            expert_id=expert.id,
            source_media_id=media.id,
            title=payload["title"],
            description=payload["description"],
            category=payload.get("category", "experience"),
            topic=payload.get("topic", expert.domain),
            problem_or_situation=payload.get("problem_or_situation"),
            context_and_experience=payload.get("context_and_experience"),
            reasoning_and_method=payload.get("reasoning_and_method"),
            decisions_and_alternatives=payload.get("decisions_and_alternatives"),
            failures_and_lessons=payload.get("failures_and_lessons"),
            source_reference=payload.get("source_reference") or "Manual Expert Knowledge Entry",
            source_location_or_timestamp=payload.get("source_location_or_timestamp") or "Direct Authoring",
            verification_status=status,
            access_permissions=payload.get("access_permissions", "public"),
            confidence_score=1.0 if status == "approved_by_expert" else 0.9,
            expert_notes=payload.get("expert_notes"),
            is_synthetic_demo=False,
        )
        db.add(ku)
        db.flush()

        db.add(VerificationHistory(
            knowledge_unit_id=ku.id,
            previous_status=None,
            new_status=status,
            reviewer_name=expert.name if status == "approved_by_expert" else "ECHO Studio Capture",
            reviewer_role="expert" if status == "approved_by_expert" else "contributor",
            notes="Created via Expert Intelligence Creation Studio.",
        ))
        db.add(ActivityLog(
            action_type="knowledge_unit_created",
            entity_type="KnowledgeUnit",
            entity_id=ku.id,
            description=f"Captured Knowledge Unit '{ku.title}' for {expert.name} [{status}].",
        ))
        db.commit()
        db.refresh(ku)
        return StudioService.serialize_unit(ku)

    @staticmethod
    def update_unit(db: Session, unit_id: int, updates: Dict[str, Any]) -> Dict[str, Any]:
        ku = db.query(KnowledgeUnit).filter(KnowledgeUnit.id == unit_id).first()
        if not ku:
            raise ValueError("Knowledge unit not found.")

        editable = [
            "title", "description", "category", "topic",
            "problem_or_situation", "context_and_experience",
            "reasoning_and_method", "decisions_and_alternatives",
            "failures_and_lessons", "source_location_or_timestamp",
            "access_permissions", "expert_notes",
        ]
        changed_fields = []
        for field in editable:
            if field in updates and updates[field] is not None:
                setattr(ku, field, updates[field])
                changed_fields.append(field)

        prev_status = ku.verification_status
        new_status = updates.get("verification_status")
        if new_status and new_status in VALID_VERIFICATION_STATES and new_status != prev_status:
            ku.verification_status = new_status
        else:
            new_status = prev_status

        db.add(VerificationHistory(
            knowledge_unit_id=ku.id,
            previous_status=prev_status,
            new_status=new_status,
            reviewer_name=updates.get("reviewer_name") or (ku.expert.name if ku.expert else "Expert Reviewer"),
            reviewer_role="expert",
            notes=updates.get("review_notes") or f"Updated fields: {', '.join(changed_fields) or 'none'}.",
        ))
        db.commit()
        db.refresh(ku)
        return StudioService.serialize_unit(ku)

    @staticmethod
    def verify_unit(
        db: Session,
        unit_id: int,
        new_status: str,
        reviewer_name: str = "Domain Expert",
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        if new_status not in VALID_VERIFICATION_STATES:
            raise ValueError(f"Invalid status '{new_status}'. Must be one of {sorted(VALID_VERIFICATION_STATES)}.")
        ku = db.query(KnowledgeUnit).filter(KnowledgeUnit.id == unit_id).first()
        if not ku:
            raise ValueError("Knowledge unit not found.")

        prev_status = ku.verification_status
        ku.verification_status = new_status
        if notes:
            ku.expert_notes = notes
        if new_status == "approved_by_expert":
            ku.confidence_score = max(ku.confidence_score or 0.9, 0.96)

        db.add(VerificationHistory(
            knowledge_unit_id=ku.id,
            previous_status=prev_status,
            new_status=new_status,
            reviewer_name=reviewer_name,
            reviewer_role="expert",
            notes=notes or f"Verification status updated from '{prev_status}' to '{new_status}'.",
        ))
        db.add(ActivityLog(
            action_type="knowledge_unit_verified",
            entity_type="KnowledgeUnit",
            entity_id=ku.id,
            description=f"Knowledge Unit '{ku.title}' transitioned {prev_status} -> {new_status} by {reviewer_name}.",
        ))
        db.commit()
        db.refresh(ku)
        return StudioService.serialize_unit(ku)

    @staticmethod
    def extract_units_with_ai_or_heuristic(
        text: str,
        expert_name: str,
        source_title: str,
        segments: Optional[List[Dict[str, str]]] = None,
    ) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """
        Attempts structured LLM extraction when a real AI provider is configured,
        falling back cleanly to deterministic structural extraction when offline.
        """
        provider_used = AIProviderService.get_default_configured_provider()
        if provider_used and text.strip():
            sys_prompt = (
                "You are an expert knowledge engineer for PROJECT ECHO. Extract 1 to 4 structured Knowledge Units "
                "from the provided source transcript/document. Respond ONLY with a valid JSON array of objects with keys: "
                "title, description, category (one of: fact_concept, experience, reasoning_decision, practical_skill, "
                "method_procedure, problem_solution, failure_lesson, opinion_hypothesis, observation), topic, "
                "problem_or_situation, context_and_experience, reasoning_and_method, decisions_and_alternatives, "
                "failures_and_lessons, source_location_or_timestamp. Never invent facts outside the text."
            )
            ai_res = AIProviderService.generate(
                prompt=f"Expert: {expert_name}\nSource: {source_title}\n\nContent:\n{text[:7000]}",
                system_prompt=sys_prompt,
                provider=provider_used,
            )
            if ai_res["success"] and ai_res.get("content"):
                m = re.search(r"\[[\s\S]*\]", ai_res["content"])
                if m:
                    try:
                        parsed = json.loads(m.group(0))
                        if isinstance(parsed, list) and parsed:
                            cleaned = []
                            for item in parsed[:6]:
                                if isinstance(item, dict) and item.get("title"):
                                    cleaned.append({
                                        "title": str(item.get("title"))[:200],
                                        "description": str(item.get("description") or item.get("context_and_experience") or "")[:400],
                                        "category": str(item.get("category") or "experience"),
                                        "topic": str(item.get("topic") or "Domain Knowledge"),
                                        "problem_or_situation": item.get("problem_or_situation"),
                                        "context_and_experience": item.get("context_and_experience"),
                                        "reasoning_and_method": item.get("reasoning_and_method"),
                                        "decisions_and_alternatives": item.get("decisions_and_alternatives"),
                                        "failures_and_lessons": item.get("failures_and_lessons"),
                                        "source_reference": source_title,
                                        "source_location_or_timestamp": str(item.get("source_location_or_timestamp") or "AI Extracted Segment"),
                                        "confidence_score": 0.87,
                                    })
                            if cleaned:
                                return cleaned, f"{ai_res['provider_name']} ({ai_res['model']})"
                    except Exception:
                        pass

        units = DocumentService.extract_knowledge_units_from_text(text, expert_name, source_title, segments)
        return units, None

    @staticmethod
    def generate_interview_followup(
        expert: Expert,
        topic: str,
        qa_turns: List[Dict[str, str]],
    ) -> Dict[str, Any]:
        stage_idx = len(qa_turns)
        if stage_idx >= len(INTERVIEW_STAGES):
            return {"done": True, "next_question": None, "stage": stage_idx}

        # Try adaptive follow-up via configured AI provider; fall back cleanly to structured stage prompt
        provider_id = AIProviderService.get_default_configured_provider()
        if provider_id and qa_turns:
            transcript = "\n".join(f"Q: {t['question']}\nA: {t['answer']}" for t in qa_turns)
            ai_res = AIProviderService.generate(
                prompt=(
                    f"You are interviewing {expert.name} ({expert.title}, {expert.domain}) about '{topic}'.\n"
                    f"Transcript so far:\n{transcript}\n\n"
                    "Ask ONE concise, probing follow-up question focused on reasoning, rejected alternatives, or failure lessons."
                ),
                system_prompt="Ask a single concise expert elicitation question (max 35 words).",
                provider=provider_id,
            )
            if ai_res["success"] and ai_res.get("content"):
                return {
                    "done": False,
                    "stage": stage_idx + 1,
                    "total_stages": len(INTERVIEW_STAGES),
                    "next_question": ai_res["content"].strip().strip('"'),
                    "ai_powered": True,
                    "provider": ai_res["provider_name"],
                }

        stage = INTERVIEW_STAGES[stage_idx]
        q_text = stage["question"]
        if stage_idx == 0 and topic:
            q_text = f"Regarding {topic}: {q_text}"
        return {
            "done": False,
            "stage": stage_idx + 1,
            "total_stages": len(INTERVIEW_STAGES),
            "next_question": q_text,
            "ai_powered": False,
            "provider": None,
        }

    @staticmethod
    def get_or_create_consent(db: Session, expert: Expert) -> ExpertConsent:
        consent = db.query(ExpertConsent).filter(ExpertConsent.expert_id == expert.id).first()
        if not consent:
            consent = ExpertConsent(
                expert_id=expert.id,
                consent_knowledge=True,
                consent_voice=True,
                consent_likeness=True,
                disclosure_acknowledged=True,
                status="active",
                signed_by=expert.name,
            )
            db.add(consent)
            db.commit()
            db.refresh(consent)
        return consent
