from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.application import ApplicationStatus
from app.schemas.job import JobOut
from app.schemas.user import UserOut


class ApplicationCreate(BaseModel):
    job_id: int


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationOut(BaseModel):
    id: int
    job_id: int
    worker_id: int
    status: ApplicationStatus
    applied_at: datetime
    job: Optional[JobOut] = None
    worker: Optional[UserOut] = None

    model_config = ConfigDict(from_attributes=True)
