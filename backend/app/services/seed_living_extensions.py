import json
from sqlalchemy.orm import Session
from app.models.entities import (
    Expert,
    ExpertConsent,
    ExpertRelationship,
    KnowledgeRecord,
    KnowledgeUnit,
    Decision,
    SourceMedia,
    VerificationHistory,
    Conversation,
    Message,
)


def seed_living_extensions(db: Session) -> None:
    """
    Idempotently populates ExpertConsent, SourceMedia, structured KnowledgeUnits,
    VerificationHistory, ExpertRelationships, and a sample Conversation across
    all seeded synthetic experts.
    """
    experts = db.query(Expert).all()
    if not experts:
        return

    # 1. Ensure every expert has an explicit ExpertConsent record
    for exp in experts:
        existing_c = db.query(ExpertConsent).filter(ExpertConsent.expert_id == exp.id).first()
        if not existing_c:
            db.add(ExpertConsent(
                expert_id=exp.id,
                consent_knowledge=True,
                consent_voice=True,
                consent_likeness=True,
                disclosure_acknowledged=True,
                status="active",
                signed_by=exp.name,
                notes="Synthetic demonstration consent — digital representation only (not human consciousness).",
            ))
    db.flush()

    # 2. Seed structured KnowledgeUnits if empty
    if db.query(KnowledgeUnit).count() == 0:
        records = db.query(KnowledgeRecord).all()
        decisions = db.query(Decision).all()
        exp_map = {e.id: e for e in experts}

        for rec in records:
            exp = exp_map.get(rec.expert_id)
            if not exp:
                continue
            status = "approved_by_expert" if rec.verification_status in ("verified", "approved_by_expert") else "awaiting_expert_review"
            media = SourceMedia(
                expert_id=exp.id,
                media_type="pdf",
                title=rec.source_reference or rec.title,
                filename=f"synthetic_source_{rec.id}.pdf",
                transcript=rec.content,
                status="extracted",
                is_synthetic_demo=rec.is_synthetic_demo,
            )
            db.add(media)
            db.flush()

            ku = KnowledgeUnit(
                expert_id=exp.id,
                source_media_id=media.id,
                document_id=rec.document_id,
                title=rec.title,
                description=rec.content,
                category="practical_skill" if rec.category == "heuristic" else "method_procedure",
                topic=exp.domain,
                problem_or_situation=f"Critical operational challenge in {exp.domain}",
                context_and_experience=rec.content,
                reasoning_and_method=rec.content,
                decisions_and_alternatives="Evaluated against baseline architectures and flight/test limits.",
                failures_and_lessons="Avoid violating thermal/structural/biological coupling boundaries.",
                source_reference=rec.source_reference or "Preserved Archive",
                source_location_or_timestamp="Section 4.2",
                verification_status=status,
                access_permissions="public",
                confidence_score=rec.confidence_score or 0.95,
                is_synthetic_demo=rec.is_synthetic_demo,
            )
            db.add(ku)
            db.flush()
            db.add(VerificationHistory(
                knowledge_unit_id=ku.id,
                previous_status="ai_extracted",
                new_status=status,
                reviewer_name=exp.name,
                reviewer_role="expert",
                notes="Synthetic demonstration record pre-verified for initial exploration.",
            ))

        for dec in decisions:
            exp = exp_map.get(dec.expert_id)
            if not exp:
                continue
            ku = KnowledgeUnit(
                expert_id=exp.id,
                title=f"Decision Architecture: {dec.title}",
                description=dec.selected_decision,
                category="reasoning_decision",
                topic=exp.domain,
                problem_or_situation=dec.problem_definition,
                context_and_experience=dec.context,
                reasoning_and_method=dec.reasoning,
                decisions_and_alternatives="; ".join(f"{a.title} (Rejected: {a.why_rejected})" for a in dec.alternatives),
                failures_and_lessons=dec.lessons_learned,
                source_reference=f"Decision DNA #{dec.id}",
                source_location_or_timestamp="Full Decision Record",
                verification_status="approved_by_expert",
                access_permissions="public",
                confidence_score=dec.confidence_rating or 0.96,
                is_synthetic_demo=dec.is_synthetic_demo,
            )
            db.add(ku)
            db.flush()
            db.add(VerificationHistory(
                knowledge_unit_id=ku.id,
                previous_status="awaiting_expert_review",
                new_status="approved_by_expert",
                reviewer_name=exp.name,
                reviewer_role="expert",
                notes="Approved Decision DNA architecture.",
            ))

        # Add 2 unapproved units (ai_extracted + awaiting_expert_review) to demonstrate strict verification boundary
        if experts:
            first_exp = experts[0]
            ku_pending = KnowledgeUnit(
                expert_id=first_exp.id,
                title="Candidate Heuristic: Rapid Cryo-Thermal Shock Cycling Limits",
                description="AI-extracted observation from thermal cycle logs suggesting acoustic emission precursors appear 12 cycles before visible C/SiC micro-spallation.",
                category="observation",
                topic="Non-Destructive Thermal Diagnostics",
                problem_or_situation="Detecting subsurface matrix microcracking between flight turnarounds.",
                context_and_experience="Observed in synthetic arc-jet acoustic telemetry channel B.",
                reasoning_and_method="Ultrasonic pulse-echo baseline drift > 4% warrants borescope inspection.",
                failures_and_lessons="Unverified threshold — requires expert sign-off before operational adoption.",
                source_reference="Hyperion Diagnostic Telemetry Log (Pending Review)",
                source_location_or_timestamp="Timestamp 04:18 - Run AJ-882",
                verification_status="awaiting_expert_review",
                access_permissions="public",
                confidence_score=0.81,
                is_synthetic_demo=True,
            )
            db.add(ku_pending)
            db.flush()
            db.add(VerificationHistory(
                knowledge_unit_id=ku_pending.id,
                previous_status="ai_extracted",
                new_status="awaiting_expert_review",
                reviewer_name="ECHO Extraction Engine",
                reviewer_role="system",
                notes="Extracted candidate awaiting explicit expert approval.",
            ))

    # 3. Seed ExpertRelationships for Connected Human Intelligence
    if db.query(ExpertRelationship).count() == 0 and len(experts) >= 2:
        pairs = [
            (0, 1, "complementary_domain", ["Thermal Control", "Closed-Loop Habitats", "Material Outgassing"], "Aerothermal structures (Dr. Morgan) must avoid toxic off-gassing and provide thermal stability for Dr. Rostova's closed-loop biological photobioreactors.", 0.84),
            (0, 2, "methodological_tension", ["Mass Budget", "Composite Shielding", "Multi-Layer Walls"], "Dr. Morgan optimizes high-heat C/SiC mass margins while Dr. Vance mandates low-Z hydrogenated BNNT/water shielding against secondary neutron cascades.", 0.72),
            (1, 3, "shared_program", ["Mars Base Alpha", "Mass Gear Ratio", "ISRU Autotrophy"], "Dr. Rostova's biological protein/water closure cuts Earth resupply mass directly, amplifying Director Lin's 1:8.5 orbital launch gear ratio savings.", 0.91),
            (2, 3, "complementary_domain", ["In-Situ Regolith Sintering", "Launch Mass Economics"], "Dr. Vance's microwave-sintered regolith radiation berms align with Director Lin's ISRU break-even threshold by replacing heavy Earth-launched shielding.", 0.89),
        ]
        for ia, ib, rtype, topics, summary, score in pairs:
            if ia < len(experts) and ib < len(experts):
                db.add(ExpertRelationship(
                    expert_a_id=experts[ia].id,
                    expert_b_id=experts[ib].id,
                    relationship_type=rtype,
                    shared_topics=json.dumps(topics),
                    summary=summary,
                    agreement_score=score,
                    is_synthetic_demo=True,
                ))

    # 4. Seed starter Conversation if empty
    if db.query(Conversation).count() == 0 and experts:
        conv = Conversation(
            title="Hypersonic C/SiC Fastener Shear Mitigation",
            mode="complete_human_intelligence",
            expert_id=experts[0].id,
            expert_ids_json=json.dumps([experts[0].id]),
            is_voice=False,
        )
        db.add(conv)
        db.flush()
        db.add(Message(
            conversation_id=conv.id,
            sender="user",
            content="How did Dr. Alex Morgan prevent fastener shear failure in C/SiC leading edges?",
            mode="complete_human_intelligence",
        ))
        db.add(Message(
            conversation_id=conv.id,
            sender="echo",
            content="Dr. Alex Morgan's approved Knowledge Unit specifies decoupling titanium ribs (CTE 8.6e-6/K) from C/SiC (CTE 2.1e-6/K) using spring-energized slotted conical collets and Grafoil compliance pads, validated in Project Hyperion Flight Test 04.",
            mode="complete_human_intelligence",
        ))

    db.commit()
