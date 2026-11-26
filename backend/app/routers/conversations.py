import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import Conversation, Message, Expert

router = APIRouter(prefix="/conversations", tags=["Conversations & History"])


class ConversationCreateReq(BaseModel):
    title: str
    mode: str = "hybrid_intelligence"
    expert_id: Optional[int] = None
    is_voice: bool = False


@router.get("")
def list_conversations(limit: int = 30, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    convs = db.query(Conversation).order_by(Conversation.updated_at.desc(), Conversation.created_at.desc()).limit(limit).all()
    experts = {e.id: e for e in db.query(Expert).all()}
    result = []
    for c in convs:
        exp = experts.get(c.expert_id) if c.expert_id else None
        msg_count = len(c.messages)
        last_msg = c.messages[-1].content[:140] if c.messages else ""
        result.append({
            "id": c.id,
            "title": c.title,
            "mode": c.mode,
            "expert_id": c.expert_id,
            "expert_name": exp.name if exp else "Multi-Expert / General",
            "is_voice": c.is_voice,
            "message_count": msg_count,
            "last_preview": last_msg,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
        })
    return result


@router.get("/{conversation_id}")
def get_conversation_detail(conversation_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    exp = db.query(Expert).filter(Expert.id == conv.expert_id).first() if conv.expert_id else None

    messages_out = []
    for m in conv.messages:
        parsed_resp = None
        if m.response_json and m.response_json != "{}":
            try:
                parsed_resp = json.loads(m.response_json)
            except Exception:
                parsed_resp = None
        messages_out.append({
            "id": m.id,
            "sender": m.sender,
            "content": m.content,
            "mode": m.mode,
            "voice_used": m.voice_used,
            "response": parsed_resp,
            "ai_runs": [
                {
                    "provider_id": r.provider_id,
                    "provider_name": r.provider_name,
                    "model": r.model,
                    "status": r.status,
                    "latency_ms": r.latency_ms,
                    "error_message": r.error_message,
                }
                for r in m.ai_runs
            ],
            "evidence_links": [
                {
                    "source_type": el.source_type,
                    "source_id": el.source_id,
                    "source_title": el.source_title,
                    "expert_name": el.expert_name,
                    "snippet": el.snippet,
                }
                for el in m.evidence_links
            ],
            "created_at": m.created_at,
        })

    return {
        "id": conv.id,
        "title": conv.title,
        "mode": conv.mode,
        "expert_id": conv.expert_id,
        "expert_name": exp.name if exp else "Multi-Expert / General",
        "is_voice": conv.is_voice,
        "created_at": conv.created_at,
        "messages": messages_out,
    }


@router.post("")
def create_conversation(req: ConversationCreateReq, db: Session = Depends(get_db)) -> Dict[str, Any]:
    conv = Conversation(
        title=req.title,
        mode=req.mode,
        expert_id=req.expert_id,
        is_voice=req.is_voice,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return {"id": conv.id, "title": conv.title, "mode": conv.mode}


@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    db.delete(conv)
    db.commit()
    return {"deleted": True, "id": conversation_id}
