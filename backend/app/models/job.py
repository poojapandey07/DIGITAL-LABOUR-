import enum
from sqlalchemy import Column, BigInteger, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = {
        "mysql_charset": "utf8mb4",
        "mysql_collate": "utf8mb4_unicode_ci"
    }

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True, index=True)
    employer_id = Column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False, index=True)  # e.g. "Mason / राजमिस्त्री"
    description = Column(Text, nullable=True)
    location = Column(String(100), nullable=False, index=True)
    address = Column(String(255), nullable=True)
    wage = Column(Integer, nullable=False)
    wage_type = Column(String(20), default="per_day", nullable=False)  # "per_day" or "per_hour"
    workers_needed = Column(Integer, default=1, nullable=False)
    duration_type = Column(String(20), default="one_day", nullable=False)  # "one_day", "multi_day", "ongoing"
    contact_phone = Column(String(15), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    posted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    employer = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Job id={self.id} title={self.title} employer_id={self.employer_id}>"
