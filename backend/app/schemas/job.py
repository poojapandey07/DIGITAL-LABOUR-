from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class JobBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    category: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    location: str = Field(..., min_length=2, max_length=100)
    address: Optional[str] = None
    wage: int = Field(..., gt=0)
    wage_type: str = "per_day"  # "per_day", "per_hour"
    workers_needed: int = Field(default=1, gt=0)
    duration_type: str = "one_day"  # "one_day", "multi_day", "ongoing"
    contact_phone: Optional[str] = None


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    category: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    wage: Optional[int] = Field(None, gt=0)
    wage_type: Optional[str] = None
    workers_needed: Optional[int] = Field(None, gt=0)
    duration_type: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: Optional[bool] = None


class JobOut(JobBase):
    id: int
    employer_id: int
    employer_name: Optional[str] = None
    is_active: bool
    posted_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JobListResponse(BaseModel):
    items: List[JobOut]
    total: int
    page: int
    limit: int
