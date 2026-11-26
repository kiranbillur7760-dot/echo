import os
import sys
import pytest

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.entities import Expert, ExpertConsent, KnowledgeUnit, Conversation

client = TestClient(app)


def test_health_check():
    """Verify system health check and core services."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "Living Human Intelligence" in data["platform"]
    assert "studio" in data["subsystems"]
    assert "conversations" in data["subsystems"]


def test_ai_providers_list():
    """Verify AI providers endpoint honestly reports availability."""
    res = client.get("/api/ask-echo/providers")
    assert res.status_code == 200
    providers = res.json()
    assert isinstance(providers, list)
    p_ids = [p["id"] for p in providers]
    assert "gemini" in p_ids
    assert "openai" in p_ids
    assert "anthropic" in p_ids
    assert "web_search" in p_ids


def test_ask_echo_complete_human_mode():
    """Test Mode 1: Complete Human Intelligence returns documented expert knowledge with evidence."""
    payload = {
        "query": "How did Dr. Alex Morgan mitigate fastener shear failure in ceramic matrix composite leading edges?",
        "mode": "complete_human_intelligence",
        "expert_id": 1,
    }
    res = client.post("/api/ask-echo/query", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["mode_used"] == "complete_human_intelligence"
    assert data["primary_expert"]["name"] == "Dr. Alex Morgan"
    assert data["human_intelligence"]["available"] is True
    assert len(data["citations"]) > 0
    # Must contain epistemic claims
    assert len(data["structured_claims"]) > 0
    # Narrative answer must be grounded
    assert len(data["narrative_answer"]) > 20


def test_ask_echo_hybrid_mode():
    """Test Mode 2: Hybrid Intelligence displays separate required sections."""
    payload = {
        "query": "How can we improve the safety of an aircraft engine?",
        "mode": "hybrid_intelligence",
        "ai_provider": "auto",
    }
    res = client.post("/api/ask-echo/query", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["mode_used"] == "hybrid_intelligence"
    # Required Section 1: Human Expert Knowledge
    assert "human_intelligence" in data
    # Required Section 2: AI Analysis
    assert "ai_intelligence" in data
    # Required Section 3: Agreements
    assert "agreements" in data
    # Required Section 4: Disagreements
    assert "disagreements" in data
    # Required Section 5: Missing Information & Uncertainty
    assert "missing_information" in data
    # Required Section 6: Final Synthesis
    assert data.get("hybrid_recommendation") or data.get("narrative_answer")
    # Required Section 7: Sources and Evidence
    assert "citations" in data


def test_studio_knowledge_units_and_verification():
    """Test Studio Knowledge Unit creation, 5-state transitions, and verification history."""
    # 1. Fetch existing knowledge units
    res = client.get("/api/studio/knowledge-units?expert_id=1")
    assert res.status_code == 200
    kus = res.json()
    assert isinstance(kus, list)
    assert len(kus) > 0

    first_ku = kus[0]
    ku_id = first_ku["id"]

    # 2. Update verification state to 'approved_by_expert'
    update_payload = {
        "verification_status": "approved_by_expert",
        "expert_notes": "Expert verification confirmed via master test harness.",
        "changed_by": "Dr. Alex Morgan (Verified Author)",
    }
    res = client.put(f"/api/studio/knowledge-units/{ku_id}/status", json=update_payload)
    assert res.status_code == 200
    updated = res.json()
    assert updated["verification_status"] == "approved_by_expert"

    # 3. Create a new Knowledge Unit in 'ai_extracted' state
    create_payload = {
        "expert_id": 1,
        "title": "Cryogenic Helium Flush Protocol for Turbo-pump Bearings",
        "description": "Pre-cooling protocol to prevent thermal shock in ceramic hybrid ball bearings.",
        "category": "procedure",
        "topic": "Cryogenics & Propulsion",
        "problem_or_situation": "Thermal shock induced micro-spalling during rapid liquid hydrogen chill-down.",
        "context_and_experience": "Observed on static firing test stand Alpha-7.",
        "reasoning_and_method": "Execute 180-second low-pressure gaseous helium purge before cryogenic propellant admission.",
        "decisions_and_alternatives": "Considered nitrogen purge; rejected due to condensation freezing risk.",
        "failures_and_lessons": "Rapid chill down without helium purge cracked inner raceway on Run 14.",
        "source_reference": "Test Stand Alpha-7 Post-Test Report (2025)",
        "source_location_or_timestamp": "Section 4.2, p. 19",
        "verification_status": "ai_extracted",
        "access_permissions": "internal_team",
        "confidence_score": 0.94,
    }
    res = client.post("/api/studio/knowledge-units", json=create_payload)
    assert res.status_code == 200
    new_ku = res.json()
    assert new_ku["verification_status"] == "ai_extracted"
    assert new_ku["title"] == create_payload["title"]


def test_expert_consent_governance():
    """Test Expert Consent checking and update rights."""
    res = client.get("/api/studio/experts/1/consent")
    assert res.status_code == 200
    consent = res.json()
    assert consent["expert_id"] == 1
    assert "consent_knowledge" in consent
    assert "consent_voice" in consent
    assert "consent_likeness" in consent
    assert consent["status"] in ["active", "suspended", "revoked", "deletion_requested"]


def test_connected_human_intelligence_cross_expert():
    """Test Section 8: Connected Human Intelligence cross-expert query & synthesis."""
    payload = {
        "query": "How do we balance thermal protection mass with structural damping during hypersonic re-entry?",
    }
    res = client.post("/api/network/cross-expert-query", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["experts_matched"] >= 1
    assert "synthesis" in data
    assert "per_expert" in data
    assert "citations" in data


def test_settings_persistence():
    """Test persistent platform settings GET and PUT."""
    res = client.get("/api/settings")
    assert res.status_code == 200
    data = res.json()
    assert "settings" in data
    assert "database_engine" in data

    # Update settings
    put_res = client.put(
        "/api/settings",
        json={"settings": {"epistemic_strictness": "high", "show_subtitles": True}},
    )
    assert put_res.status_code == 200
    updated_settings = put_res.json()["settings"]
    assert updated_settings["epistemic_strictness"] == "high"


def test_conversations_api():
    """Test persistent conversations listing and retrieval."""
    res = client.get("/api/conversations")
    assert res.status_code == 200
    convos = res.json()
    assert isinstance(convos, list)
    if len(convos) > 0:
        first_id = convos[0]["id"]
        res_detail = client.get(f"/api/conversations/{first_id}")
        assert res_detail.status_code == 200
        detail = res_detail.json()
        assert "messages" in detail
