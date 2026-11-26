import json
from typing import Any, Dict
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.models.entities import PlatformSetting
from app.services.ai_provider_service import AIProviderService

router = APIRouter(prefix="/settings", tags=["System & Intelligence Settings"])

DEFAULT_SETTINGS: Dict[str, Any] = {
    "default_mode": "hybrid_intelligence",
    "epistemic_strictness": "high",
    "voice_rate": 0.96,
    "voice_pitch": 1.0,
    "auto_listen_after_reply": False,
    "show_subtitles": True,
    "ai_disclosure_banner": True,
}


class SettingsUpdateReq(BaseModel):
    settings: Dict[str, Any]


@router.get("")
def get_settings(db: Session = Depends(get_db)) -> Dict[str, Any]:
    stored = dict(DEFAULT_SETTINGS)
    for row in db.query(PlatformSetting).all():
        try:
            stored[row.key] = json.loads(row.value_json)
        except Exception:
            stored[row.key] = row.value_json

    db_backend = "postgresql" if settings.DATABASE_URL.startswith("postgres") else "sqlite"
    return {
        "settings": stored,
        "database_engine": db_backend,
        "providers": AIProviderService.list_providers(),
    }


@router.put("")
def update_settings(req: SettingsUpdateReq, db: Session = Depends(get_db)) -> Dict[str, Any]:
    for key, val in req.settings.items():
        row = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
        serialized = json.dumps(val)
        if row:
            row.value_json = serialized
        else:
            db.add(PlatformSetting(key=key, value_json=serialized))
    db.commit()
    return get_settings(db)
