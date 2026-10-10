import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger(__name__)

connect_args = {}
engine_kwargs = {"pool_pre_ping": True}
db_url = settings.DATABASE_URL

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    engine = create_engine(db_url, connect_args=connect_args, **engine_kwargs)
else:
    engine_kwargs["pool_recycle"] = 3600
    try:
        candidate_engine = create_engine(db_url, connect_args=connect_args, **engine_kwargs)
        with candidate_engine.connect() as conn:
            pass
        engine = candidate_engine
        logger.info("[Database] Successfully connected to MySQL database.")
    except Exception as err:
        logger.warning(
            f"[Database] MySQL connection refused on '{db_url}': {err}. "
            "Falling back to persistent SQLite SQL database (digital_labor_chowk.db). "
            "All real user data will be stored cleanly in SQL tables."
        )
        db_url = "sqlite:///./digital_labor_chowk.db"
        connect_args = {"check_same_thread": False}
        engine = create_engine(db_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for creating and closing a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
