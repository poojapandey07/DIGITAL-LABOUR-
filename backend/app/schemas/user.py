from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.user import UserRole


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    phone: str = Field(..., min_length=10, max_length=15)
    role: UserRole
    location: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=4)
    # Worker optional fields
    skills: Optional[List[str]] = None
    experience_years: Optional[str] = None
    daily_wage: Optional[int] = None
    bio: Optional[str] = None
    # Employer optional fields
    company_name: Optional[str] = None
    business_type: Optional[str] = None
    contact_person: Optional[str] = None


class UserLogin(BaseModel):
    phone: str
    password: str
    expected_role: Optional[UserRole] = None


class UserOut(UserBase):
    id: int
    created_at: datetime
    skills: Optional[List[str]] = None
    experience_years: Optional[str] = None
    daily_wage: Optional[int] = None
    availability: Optional[str] = "available"
    bio: Optional[str] = None
    company_name: Optional[str] = None
    business_type: Optional[str] = None
    contact_person: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenPayload(BaseModel):
    sub: Optional[str] = None


class WorkerProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    location: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_years: Optional[str] = None
    daily_wage: Optional[int] = None
    availability: Optional[str] = None
    bio: Optional[str] = None


class WorkerDashboardSummary(BaseModel):
    applications_count: int
    matching_jobs_count: int
    profile_completion_pct: int
