import enum
from sqlalchemy import Column, BigInteger, Integer, String, Text, DateTime, JSON, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class UserRole(str, enum.Enum):
    WORKER = "worker"
    EMPLOYER = "employer"


class User(Base):
    __tablename__ = "users"
    __table_args__ = {
        "mysql_charset": "utf8mb4",
        "mysql_collate": "utf8mb4_unicode_ci"
    }

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True, index=True)
    role = Column(Enum(UserRole, name="user_role", native_enum=True), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    phone = Column(String(15), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    location = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Worker-specific attributes
    skills = Column(JSON, nullable=True)  # List of skill string tags, e.g. ["Mason", "Plumber"]
    experience_years = Column(String(10), nullable=True)
    bio = Column(Text, nullable=True)
    daily_wage = Column(Integer, nullable=True)
    availability = Column(String(20), default="available", nullable=True)  # "available" or "busy"

    # Employer-specific attributes
    business_type = Column(String(50), nullable=True)
    company_name = Column(String(120), nullable=True)
    contact_person = Column(String(120), nullable=True)

    # Relationships
    jobs = relationship("Job", back_populates="employer", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="worker", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User id={self.id} phone={self.phone} role={self.role}>"
