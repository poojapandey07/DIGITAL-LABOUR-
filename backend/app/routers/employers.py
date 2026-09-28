from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.application import Application
from app.schemas.job import JobOut
from app.schemas.application import ApplicationOut
from app.deps import get_current_user

router = APIRouter(prefix="/employers", tags=["Employers"])


@router.get("/{employer_id}/jobs", response_model=List[JobOut])
def get_employer_jobs(
    employer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all jobs posted by this employer."""
    if current_user.id != employer_id and current_user.role != UserRole.EMPLOYER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="अनधिकृत पहुंच (Unauthorized)")

    jobs = (
        db.query(Job)
        .options(joinedload(Job.employer))
        .filter(Job.employer_id == employer_id)
        .order_by(Job.posted_at.desc())
        .all()
    )

    results = []
    for job in jobs:
        j_out = JobOut.model_validate(job)
        if job.employer:
            j_out.employer_name = job.employer.company_name or job.employer.name
        results.append(j_out)

    return results


@router.get("/{employer_id}/jobs/{job_id}/applicants", response_model=List[ApplicationOut])
def get_job_applicants(
    employer_id: int,
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all worker applicants for a specific job. Only the job's owning employer may access."""
    if current_user.id != employer_id or current_user.role != UserRole.EMPLOYER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="अनधिकृत पहुंच (Unauthorized)")

    # Verify job ownership
    job = db.query(Job).filter(Job.id == job_id, Job.employer_id == employer_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="कार्य नहीं मिला (Job not found)")

    applications = (
        db.query(Application)
        .options(joinedload(Application.worker), joinedload(Application.job))
        .filter(Application.job_id == job_id)
        .order_by(Application.applied_at.desc())
        .all()
    )

    return [ApplicationOut.model_validate(app) for app in applications]
