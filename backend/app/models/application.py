import enum
from sqlalchemy import Column, BigInteger, Integer, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class ApplicationStatus(str, enum.Enum):
    APPLIED = "applied"
    VIEWED = "viewed"
    SHORTLISTED = "shortlisted"
    SELECTED = "selected"
    REJECTED = "rejected"


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("job_id", "worker_id", name="uq_job_worker_application"),
        {
            "mysql_charset": "utf8mb4",
            "mysql_collate": "utf8mb4_unicode_ci"
        }
    )

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True, index=True)
    job_id = Column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    worker_id = Column(
        BigInteger().with_variant(Integer, "sqlite"),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    status = Column(
        Enum(ApplicationStatus, name="application_status", native_enum=True),
        default=ApplicationStatus.APPLIED,
        nullable=False,
        index=True
    )
    applied_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    job = relationship("Job", back_populates="applications")
    worker = relationship("User", back_populates="applications")

    def __repr__(self):
        return f"<Application id={self.id} job_id={self.job_id} worker_id={self.worker_id} status={self.status}>"
