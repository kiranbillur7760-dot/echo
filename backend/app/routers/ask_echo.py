from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.common import AskEchoRequest, AskEchoResponse
from app.services.ask_echo_engine import AskEchoEngine

router = APIRouter(prefix="/ask-echo", tags=["Ask ECHO AI Assistant"])

@router.post("/query", response_model=AskEchoResponse)
def query_ask_echo(request: AskEchoRequest, db: Session = Depends(get_db)):
    return AskEchoEngine.answer_query(db, request)
