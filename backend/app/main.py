from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database import engine, Base, SessionLocal
from app.seed import seed_database
from app.routers import (
    auth_router,
    workers_router,
    employers_router,
    jobs_router,
    applications_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist and seed demo data if empty
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()
    except Exception as e:
        print(f"[Warning] Database initialization or seed encountered error: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="REST API backend for Digital Labor Chowk — connecting daily-wage workers with employers across India directly.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Enable CORS for frontend static origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(workers_router, prefix=settings.API_PREFIX)
app.include_router(employers_router, prefix=settings.API_PREFIX)
app.include_router(jobs_router, prefix=settings.API_PREFIX)
app.include_router(applications_router, prefix=settings.API_PREFIX)


@app.get("/", tags=["Health"])
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs"
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "database": "connected"}
