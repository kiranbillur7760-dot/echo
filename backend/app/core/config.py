import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "PROJECT ECHO"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database - resolve to canonical location in backend directory
    _backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    _db_path = os.path.join(_backend_dir, "echo_ecosystem.db").replace("\\", "/")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{_db_path}")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "echo_futuristic_super_secret_key_925cff_00d9ff_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ]
    
    # AI Engine (supports Gemini, OpenAI/ChatGPT, Anthropic/Claude, Perplexity, Grok)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    PERPLEXITY_API_KEY: str = os.getenv("PERPLEXITY_API_KEY", "")
    GROK_API_KEY: str = os.getenv("GROK_API_KEY", "")
    
    # Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    
    class Config:
        case_sensitive = True
        env_file = os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")), ".env")
        extra = "ignore"

settings = Settings()
