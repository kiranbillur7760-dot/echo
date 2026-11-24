from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import KnowledgeConflict, KnowledgeUpdate, KnowledgeVerification, KnowledgeRecord

class EvolutionService:
    @staticmethod
    def get_evolution_radar(db: Session) -> Dict[str, Any]:
        """
        Retrieves active knowledge conflicts, decay status radar,
        and human verification metrics.
        """
        conflicts = db.query(KnowledgeConflict).order_by(KnowledgeConflict.created_at.desc()).all()
        updates = db.query(KnowledgeUpdate).order_by(KnowledgeUpdate.created_at.desc()).all()
        verifications = db.query(KnowledgeVerification).order_by(KnowledgeVerification.created_at.desc()).all()

        conflict_list = []
        for c in conflicts:
            conflict_list.append({
                "id": c.id,
                "title": c.title,
                "conflict_type": c.conflict_type,
                "description": c.description,
                "expert_claim_a": c.expert_claim_a,
                "expert_claim_b": c.expert_claim_b,
                "severity": c.severity,
                "resolution_status": c.resolution_status,
                "resolution_notes": c.resolution_notes,
                "is_synthetic_demo": c.is_synthetic_demo,
                "created_at": c.created_at
            })

        update_list = []
        for u in updates:
            update_list.append({
                "id": u.id,
                "record_id": u.record_id,
                "previous_content": u.previous_content,
                "updated_content": u.updated_content,
                "reason_for_update": u.reason_for_update,
                "decay_indicator": u.decay_indicator,
                "new_evidence_ref": u.new_evidence_ref,
                "is_synthetic_demo": u.is_synthetic_demo,
                "created_at": u.created_at
            })

        verification_list = []
        for v in verifications:
            verification_list.append({
                "id": v.id,
                "record_id": v.record_id,
                "verified_by_expert_id": v.verified_by_expert_id,
                "verification_status": v.verification_status,
                "verification_notes": v.verification_notes,
                "created_at": v.created_at
            })

        # Summary Metrics
        summary = {
            "total_conflicts_detected": len(conflicts),
            "unresolved_conflicts": len([c for c in conflicts if c.resolution_status != 'resolved']),
            "superseded_heuristics_count": len(updates),
            "active_verifications_count": len(verifications),
            "radar_health_score": 96.5 # Platform epistemic health index
        }

        return {
            "summary": summary,
            "conflicts": conflict_list,
            "superseded_updates": update_list,
            "recent_verifications": verification_list
        }

    @staticmethod
    def resolve_conflict(db: Session, conflict_id: int, resolution_notes: str) -> Dict[str, Any]:
        """Resolves an identified knowledge contradiction with expert reconciliation notes."""
        c = db.query(KnowledgeConflict).filter(KnowledgeConflict.id == conflict_id).first()
        if not c:
            raise ValueError(f"Knowledge conflict #{conflict_id} not found.")

        c.resolution_status = "resolved"
        c.resolution_notes = resolution_notes
        db.commit()
        return {
            "id": c.id,
            "title": c.title,
            "resolution_status": c.resolution_status,
            "resolution_notes": c.resolution_notes
        }
