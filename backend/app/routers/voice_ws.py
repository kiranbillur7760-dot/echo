import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.database.session import SessionLocal
from app.schemas.common import AskEchoRequest, ConversationTurn
from app.services.ask_echo_engine import AskEchoEngine

router = APIRouter(tags=["Live Voice WebSocket"])


@router.websocket("/api/ws/voice")
async def voice_conversation_ws(websocket: WebSocket):
    """
    Low-latency WebSocket pipeline for Live Voice Intelligence:
      Receives JSON: {query, mode, expert_id, conversation_id, ai_providers, conversation_history}
      Streams stage events -> speech chunks -> full grounded AskEchoResponse payload.
    """
    await websocket.accept()
    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except Exception:
                await websocket.send_json({"type": "error", "message": "Invalid JSON message."})
                continue

            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            query = (msg.get("query") or "").strip()
            if not query:
                await websocket.send_json({"type": "error", "message": "Empty voice transcript."})
                continue

            await websocket.send_json({"type": "status", "stage": "retrieving", "detail": "Retrieving human expert knowledge..."})

            history = []
            for h in msg.get("conversation_history") or []:
                if isinstance(h, dict) and h.get("query"):
                    history.append(ConversationTurn(
                        query=h["query"],
                        answer=h.get("answer", ""),
                        expert_name=h.get("expert_name"),
                    ))

            req = AskEchoRequest(
                query=query,
                mode=msg.get("mode") or "hybrid_intelligence",
                expert_id=msg.get("expert_id"),
                ai_provider=msg.get("ai_provider") or "auto",
                ai_providers=msg.get("ai_providers"),
                conversation_id=msg.get("conversation_id"),
                is_voice=True,
                conversation_history=history,
            )

            await websocket.send_json({"type": "status", "stage": "thinking", "detail": "Synthesizing grounded response..."})

            def _run_query():
                db = SessionLocal()
                try:
                    return AskEchoEngine.answer_query(db, req)
                finally:
                    db.close()

            res = await asyncio.to_thread(_run_query)
            spoken_text = (res.hybrid_recommendation or res.narrative_answer or "").replace("#", "").replace("*", "")

            # Stream sentence chunks for low-latency TTS / subtitle progression
            sentences = [s.strip() for s in spoken_text.split("\n") if s.strip()]
            for sent in sentences[:6]:
                await websocket.send_json({"type": "chunk", "text": sent})

            await websocket.send_json({
                "type": "response",
                "spoken_text": spoken_text,
                "payload": json.loads(json.dumps(res.model_dump(), default=str)),
            })

    except WebSocketDisconnect:
        return
