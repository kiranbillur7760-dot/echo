from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.session import engine, Base, get_db
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
    network
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="PROJECT ECHO — The Next-Generation Human Intelligence Platform Backend",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
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
    # Automatically seed the database with Dr. Alex Morgan synthetic scenario
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
app.include_router(decisions.router, prefix=settings.API_V1_STR)
app.include_router(simulation.router, prefix=settings.API_V1_STR)
app.include_router(ask_echo.router, prefix=settings.API_V1_STR)
app.include_router(learning.router, prefix=settings.API_V1_STR)
app.include_router(graph.router, prefix=settings.API_V1_STR)
app.include_router(overview.router, prefix=settings.API_V1_STR)
app.include_router(evolution.router, prefix=settings.API_V1_STR)
app.include_router(network.router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "sqlite_ready",
        "ai_engine": "gemini_ready" if settings.GEMINI_API_KEY else "demonstration_mode"
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to PROJECT ECHO — The Future of Human Knowledge",
        "docs": "/docs",
        "status": "operational"
    }
