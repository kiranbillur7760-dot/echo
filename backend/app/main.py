from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.session import engine, Base, get_db
from app.services.ai_provider_service import AIProviderService
from app.services.seed_data import seed_database
from app.routers import (
    auth,
    experts,
    documents,
    knowledge,
    decisions,
    simulation,
    ask_echo,
    learning,
    graph,
    overview,
    evolution,
    network,
    echo_mirror,
    self_reflection,
    self_evolution,
    council,
    time_machine,
    studio,
    conversations,
    settings_router,
    voice_ws,
    research,
    developer_api,
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="PROJECT ECHO — Living Human Intelligence Platform Backend",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    db = next(get_db())
    try:
        seed_database(db)
    finally:
        db.close()


# Include routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(experts.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(knowledge.router, prefix=settings.API_V1_STR)
app.include_router(studio.router, prefix=settings.API_V1_STR)
app.include_router(conversations.router, prefix=settings.API_V1_STR)
app.include_router(settings_router.router, prefix=settings.API_V1_STR)
app.include_router(decisions.router, prefix=settings.API_V1_STR)
app.include_router(simulation.router, prefix=settings.API_V1_STR)
app.include_router(ask_echo.router, prefix=settings.API_V1_STR)
app.include_router(learning.router, prefix=settings.API_V1_STR)
app.include_router(graph.router, prefix=settings.API_V1_STR)
app.include_router(overview.router, prefix=settings.API_V1_STR)
app.include_router(evolution.router, prefix=settings.API_V1_STR)
app.include_router(network.router, prefix=settings.API_V1_STR)
app.include_router(echo_mirror.router, prefix=settings.API_V1_STR)
app.include_router(self_reflection.router, prefix=settings.API_V1_STR)
app.include_router(self_evolution.router, prefix=settings.API_V1_STR)
app.include_router(council.router, prefix=settings.API_V1_STR)
app.include_router(time_machine.router, prefix=settings.API_V1_STR)
app.include_router(voice_ws.router)
app.include_router(research.router)
app.include_router(developer_api.router)


@app.get("/api/health")
def health_check():
    configured_providers = AIProviderService.get_configured_providers()
    db_kind = "postgresql" if settings.DATABASE_URL.startswith("postgres") else "sqlite_ready"
    return {
        "status": "healthy",
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_kind,
        "ai_providers_configured": configured_providers,
        "ai_engine": f"live_providers:{','.join(configured_providers)}" if configured_providers else "no_external_ai_keys_configured",
    }


@app.get("/")
def root():
    return {
        "message": "Welcome to PROJECT ECHO — Living Human Intelligence",
        "docs": "/docs",
        "status": "operational",
    }
