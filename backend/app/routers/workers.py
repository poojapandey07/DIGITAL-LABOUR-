from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.application import Application
from app.schemas.user import UserOut, WorkerProfileUpdate, WorkerDashboardSummary
from app.schemas.application import ApplicationOut
from app.deps import get_current_user

router = APIRouter(prefix="/workers", tags=["Workers"])


@router.get("/{worker_id}", response_model=UserOut)
def get_worker_profile(worker_id: int, db: Session = Depends(get_db)):
    """Public profile view of a registered worker."""
    worker = db.query(User).filter(User.id == worker_id, User.role == UserRole.WORKER).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="श्रमिक नहीं मिला (Worker not found)")
    return UserOut.model_validate(worker)


@router.put("/{worker_id}", response_model=UserOut)
def update_worker_profile(
    worker_id: int,
    profile_in: WorkerProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update own worker profile. Must match authenticated worker ID."""
    if current_user.id != worker_id or current_user.role != UserRole.WORKER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="केवल अपनी प्रोफ़ाइल ही संशोधित कर सकते हैं (Can only update your own profile)"
        )

    worker = db.query(User).filter(User.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="श्रमिक नहीं मिला (Worker not found)")

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(worker, field, value)

    db.commit()
    db.refresh(worker)
    return UserOut.model_validate(worker)


@router.get("/{worker_id}/dashboard", response_model=WorkerDashboardSummary)
def get_worker_dashboard(
    worker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard summary metrics: applications sent, matching jobs count, profile completion %."""
    if current_user.id != worker_id and current_user.role != UserRole.WORKER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="अनधिकृत पहुंच (Unauthorized)")

    worker = db.query(User).filter(User.id == worker_id, User.role == UserRole.WORKER).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="श्रमिक नहीं मिला")

    # 1. Total applications count
    apps_count = db.query(Application).filter(Application.worker_id == worker_id).count()

    # 2. Matching jobs count (based on worker's skills or location)
    matching_query = db.query(Job).filter(Job.is_active == True)
    skills = worker.skills or []
    if skills:
        # Match if any skill keyword is in job category or title
        conditions = [Job.category.ilike(f"%{s.split('/')[0].strip()}%") for s in skills]
        matching_query = matching_query.filter(conditions[0] if len(conditions) == 1 else (conditions[0] | conditions[1]))
    matching_jobs_count = matching_query.count()

    # 3. Profile completion percentage calculation
    fields = [
        worker.name,
        worker.phone,
        worker.skills and len(worker.skills) > 0,
        worker.location,
        worker.experience_years,
        worker.daily_wage,
        worker.bio
    ]
    completed_fields = sum(1 for f in fields if f)
    profile_pct = int((completed_fields / len(fields)) * 100)

    return WorkerDashboardSummary(
        applications_count=apps_count,
        matching_jobs_count=matching_jobs_count,
        profile_completion_pct=profile_pct
    )


@router.get("/{worker_id}/applications", response_model=List[ApplicationOut])
def get_worker_applications(
    worker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List applications submitted by this worker, with embedded job and employer details."""
    if current_user.id != worker_id and current_user.role != UserRole.WORKER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="अनधिकृत पहुंच (Unauthorized)")

    applications = (
        db.query(Application)
        .options(joinedload(Application.job).joinedload(Job.employer))
        .filter(Application.worker_id == worker_id)
        .order_by(Application.applied_at.desc())
        .all()
    )

    results = []
    for app in applications:
        app_out = ApplicationOut.model_validate(app)
        if app.job and app.job.employer:
            app_out.job.employer_name = app.job.employer.company_name or app.job.employer.name
        results.append(app_out)

    return results
