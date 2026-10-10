from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database import engine, Base
from app.routers import (
    auth_router,
    workers_router,
    employers_router,
    jobs_router,
    applications_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure real SQL database tables exist on startup without any mock data
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"[Warning] Database table creation encountered error: {e}")
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
