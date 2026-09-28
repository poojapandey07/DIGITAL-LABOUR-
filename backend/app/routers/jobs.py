from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, desc, asc
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.job import Job
from app.models.user import User, UserRole
from app.schemas.job import JobCreate, JobUpdate, JobOut, JobListResponse
from app.deps import get_current_user, get_current_employer

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_employer)
):
    """Create a new job posting. Requires employer authentication."""
    job = Job(
        employer_id=current_user.id,
        title=job_in.title.strip(),
        category=job_in.category.strip(),
        description=job_in.description.strip() if job_in.description else None,
        location=job_in.location.strip(),
        address=job_in.address.strip() if job_in.address else None,
        wage=job_in.wage,
        wage_type=job_in.wage_type,
        workers_needed=job_in.workers_needed,
        duration_type=job_in.duration_type,
        contact_phone=job_in.contact_phone.strip() if job_in.contact_phone else current_user.phone,
        is_active=True
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    job_out = JobOut.model_validate(job)
    job_out.employer_name = current_user.company_name or current_user.name
    return job_out


@router.get("", response_model=JobListResponse)
def list_jobs(
    q: Optional[str] = Query(None, description="Keyword search in title, description, category, or location"),
    category: Optional[str] = Query(None, description="Filter by skill or trade category"),
    location: Optional[str] = Query(None, description="Filter by city or location"),
    min_wage: Optional[int] = Query(None, ge=0, description="Minimum daily wage"),
    max_wage: Optional[int] = Query(None, ge=0, description="Maximum daily wage"),
    duration_type: Optional[str] = Query(None, description="Filter by duration (one_day, multi_day, ongoing)"),
    sort: Optional[str] = Query("newest", pattern="^(newest|wage_desc|wage_asc)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    include_inactive: bool = Query(False, description="Whether to include closed/inactive jobs"),
    db: Session = Depends(get_db)
):
    """List and search jobs with multi-criteria filtering, sorting, and pagination."""
    query = db.query(Job).options(joinedload(Job.employer))

    if not include_inactive:
        query = query.filter(Job.is_active == True)

    # Keyword search across title, description, category, and location
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Job.title.ilike(term),
                Job.description.ilike(term),
                Job.category.ilike(term),
                Job.location.ilike(term)
            )
        )

    # Category filter
    if category and category.lower() != "all":
        query = query.filter(Job.category.ilike(f"%{category.strip()}%"))

    # Location filter
    if location and location.lower() != "all":
        query = query.filter(Job.location.ilike(f"%{location.strip()}%"))

    # Wage range filter
    if min_wage is not None and min_wage > 0:
        query = query.filter(Job.wage >= min_wage)
    if max_wage is not None and max_wage > 0:
        query = query.filter(Job.wage <= max_wage)

    # Duration filter
    if duration_type and duration_type.lower() != "all":
        query = query.filter(Job.duration_type == duration_type)

    # Total matching count before pagination
    total = query.count()

    # Sorting
    if sort == "wage_desc":
        query = query.order_by(desc(Job.wage))
    elif sort == "wage_asc":
        query = query.order_by(asc(Job.wage))
    else:
        query = query.order_by(desc(Job.posted_at))

    # Pagination
    offset = (page - 1) * limit
    jobs = query.offset(offset).limit(limit).all()

    items = []
    for job in jobs:
        j_out = JobOut.model_validate(job)
        if job.employer:
            j_out.employer_name = job.employer.company_name or job.employer.name
        items.append(j_out)

    return JobListResponse(items=items, total=total, page=page, limit=limit)


@router.get("/{job_id}", response_model=JobOut)
def get_job_detail(job_id: int, db: Session = Depends(get_db)):
    """Retrieve full details of a specific job listing."""
    job = db.query(Job).options(joinedload(Job.employer)).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="कार्य नहीं मिला (Job not found)")

    j_out = JobOut.model_validate(job)
    if job.employer:
        j_out.employer_name = job.employer.company_name or job.employer.name
    return j_out


@router.put("/{job_id}", response_model=JobOut)
def update_job(
    job_id: int,
    job_in: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_employer)
):
    """Update job listing. Only the job's owning employer may update."""
    job = db.query(Job).options(joinedload(Job.employer)).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="कार्य नहीं मिला (Job not found)")

    if job.employer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="केवल कार्य पोस्ट करने वाला नियोक्ता ही अपडेट कर सकता है")

    update_data = job_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)

    j_out = JobOut.model_validate(job)
    j_out.employer_name = current_user.company_name or current_user.name
    return j_out


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_employer)
):
    """Soft-delete job listing by setting is_active=False. Only the owner employer may delete."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="कार्य नहीं मिला (Job not found)")

    if job.employer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="केवल कार्य पोस्ट करने वाला नियोक्ता ही हटा सकता है")

    job.is_active = False
    db.commit()
    return None
