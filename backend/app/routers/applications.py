from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.application import Application, ApplicationStatus
from app.models.job import Job
from app.models.user import User, UserRole
from app.schemas.application import ApplicationCreate, ApplicationOut, ApplicationStatusUpdate
from app.deps import get_current_user, get_current_worker, get_current_employer

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def apply_to_job(
    app_in: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_worker)
):
    """Worker applies to a job. Prevents duplicate applications with 409 Conflict."""
    # Check if job exists and is active
    job = db.query(Job).options(joinedload(Job.employer)).filter(Job.id == app_in.job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="कार्य उपलब्ध नहीं है (Job not found)")

    if not job.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="यह कार्य अब सक्रिय नहीं है (Job is closed)")

    # Check for existing application
    existing_app = (
        db.query(Application)
        .filter(Application.job_id == app_in.job_id, Application.worker_id == current_user.id)
        .first()
    )
    if existing_app:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="आप पहले ही इस कार्य के लिए आवेदन कर चुके हैं (Already applied to this job)"
        )

    new_app = Application(
        job_id=app_in.job_id,
        worker_id=current_user.id,
        status=ApplicationStatus.APPLIED
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    # Return with relations populated
    app_out = ApplicationOut.model_validate(new_app)
    app_out.job = job
    app_out.worker = current_user
    if job.employer:
        app_out.job.employer_name = job.employer.company_name or job.employer.name
    return app_out


@router.get("/{application_id}", response_model=ApplicationOut)
def get_application_detail(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single application detail. Accessible by the applicant worker or job employer."""
    app = (
        db.query(Application)
        .options(joinedload(Application.job).joinedload(Job.employer), joinedload(Application.worker))
        .filter(Application.id == application_id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="आवेदन नहीं मिला (Application not found)")

    # Access check: must be either the worker who applied or the employer who posted the job
    is_worker = app.worker_id == current_user.id
    is_job_employer = app.job and app.job.employer_id == current_user.id
    if not (is_worker or is_job_employer):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="अनधिकृत पहुंच (Unauthorized)")

    app_out = ApplicationOut.model_validate(app)
    if app.job and app.job.employer:
        app_out.job.employer_name = app.job.employer.company_name or app.job.employer.name
    return app_out


@router.patch("/{application_id}/status", response_model=ApplicationOut)
def update_application_status(
    application_id: int,
    status_in: ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_employer)
):
    """Employer updates application status (viewed, shortlisted, selected, rejected)."""
    app = (
        db.query(Application)
        .options(joinedload(Application.job).joinedload(Job.employer), joinedload(Application.worker))
        .filter(Application.id == application_id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="आवेदन नहीं मिला (Application not found)")

    # Verify that current user owns the job for this application
    if not app.job or app.job.employer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="केवल कार्य का नियोक्ता ही स्थिति बदल सकता है (Only job owner can update status)"
        )

    app.status = status_in.status
    db.commit()
    db.refresh(app)

    app_out = ApplicationOut.model_validate(app)
    if app.job and app.job.employer:
        app_out.job.employer_name = app.job.employer.company_name or app.job.employer.name
    return app_out
