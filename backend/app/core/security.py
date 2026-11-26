import base64
import hashlib
import hmac
import json
import os
import re
import time
from typing import Any, Dict, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.models.entities import User

bearer_scheme = HTTPBearer(auto_error=False)

ALLOWED_DOCUMENT_EXTENSIONS = {"pdf", "docx", "doc", "txt", "md", "json"}
ALLOWED_MEDIA_EXTENSIONS = {"webm", "wav", "mp3", "m4a", "ogg", "mp4", "mov"}
MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB


def hash_password(password: str) -> str:
    """Hash a password using standard-library scrypt with a random 16-byte salt."""
    salt = os.urandom(16)
    derived = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1)
    return f"scrypt${base64.b64encode(salt).decode()}${base64.b64encode(derived).decode()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against scrypt hash, supporting legacy synthetic seed hashes cleanly."""
    if not stored_hash:
        return False
    if stored_hash.startswith("scrypt$"):
        try:
            _, salt_b64, hash_b64 = stored_hash.split("$", 2)
            salt = base64.b64decode(salt_b64)
            expected = base64.b64decode(hash_b64)
            actual = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1)
            return hmac.compare_digest(actual, expected)
        except Exception:
            return False
    if stored_hash.startswith("hash_"):
        return hmac.compare_digest(f"hash_{password}", stored_hash)
    return False


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64url_decode(val: str) -> bytes:
    padding = "=" * (-len(val) % 4)
    return base64.urlsafe_b64decode(val + padding)


def create_access_token(payload: Dict[str, Any], expires_minutes: Optional[int] = None) -> str:
    """Create an HMAC-SHA256 signed JWT token without external fragile dependencies."""
    header = {"alg": "HS256", "typ": "JWT"}
    ttl = (expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES) * 60
    body = {
        **payload,
        "iat": int(time.time()),
        "exp": int(time.time()) + ttl,
    }
    h_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    b_b64 = _b64url_encode(json.dumps(body, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{h_b64}.{b_b64}".encode("ascii")
    sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    return f"{h_b64}.{b_b64}.{_b64url_encode(sig)}"


def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Malformed token")
        h_b64, b_b64, sig_b64 = parts
        signing_input = f"{h_b64}.{b_b64}".encode("ascii")
        expected_sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
        actual_sig = _b64url_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, actual_sig):
            raise ValueError("Invalid token signature")
        payload = json.loads(_b64url_decode(b_b64).decode("utf-8"))
        if int(payload.get("exp", 0)) < int(time.time()):
            raise ValueError("Token expired")
        return payload
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {exc}",
        )


def get_optional_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not creds or not creds.credentials:
        return None
    payload = decode_access_token(creds.credentials)
    uid = payload.get("sub")
    if not uid:
        return None
    return db.query(User).filter(User.id == int(uid), User.is_active == True).first()


def get_current_user_required(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    payload = decode_access_token(creds.credentials)
    uid = payload.get("sub")
    user = db.query(User).filter(User.id == int(uid), User.is_active == True).first() if uid else None
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")
    return user


def sanitize_filename(filename: str) -> str:
    base = os.path.basename(filename or "upload.bin")
    cleaned = re.sub(r"[^a-zA-Z0-9._-]", "_", base)
    return cleaned[:120] or "upload.bin"


def validate_upload(filename: str, size_bytes: int, allowed_exts: set) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Allowed: {', '.join(sorted(allowed_exts))}.",
        )
    if size_bytes > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum size limit ({MAX_UPLOAD_BYTES // (1024 * 1024)} MB).",
        )
    return ext
