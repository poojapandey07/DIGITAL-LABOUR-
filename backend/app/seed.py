"""Database seeder script for Digital Labor Chowk."""
import logging
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.job import Job
from app.models.application import Application, ApplicationStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_database(db: Session):
    logger.info("Checking database state for seeding...")

    # Ensure tables exist (creates them if not already created via Alembic)
    Base.metadata.create_all(bind=engine)

    # Check if data already exists
    if db.query(User).count() > 0:
        logger.info("Database already contains users. Skipping seed.")
        return

    logger.info("Seeding demo users (workers and employers)...")

    # 1. Seed Workers
    worker_1 = User(
        name="Ramesh Kumar (रमेश कुमार)",
        phone="9876543210",
        role=UserRole.WORKER,
        hashed_password=get_password_hash("password123"),
        location="New Delhi / नई दिल्ली",
        skills=["Mason / राजमिस्त्री", "Tile & Marble Worker / टाइल कारीगर"],
        experience_years="7",
        daily_wage=850,
        availability="available",
        bio="अनुभवी राजमिस्त्री। आरसीसी ढलाई, ईंट चिनाई और प्लास्टर कार्य में 7 साल का कार्य अनुभव। समय पर कार्य पूर्ण करने की गारंटी।"
    )

    worker_2 = User(
        name="Sunita Devi (सुनीता देवी)",
        phone="9811223344",
        role=UserRole.WORKER,
        hashed_password=get_password_hash("password123"),
        location="Noida / नोएडा",
        skills=["Painter / पेंटर"],
        experience_years="4",
        daily_wage=750,
        availability="available",
        bio="घर और कमर्शियल पेंटिंग, वॉल पुट्टी और प्राइमर कार्य की विशेषज्ञ।"
    )

    # 2. Seed Employers
    employer_1 = User(
        name="Vikram Sharma",
        phone="9899001122",
        role=UserRole.EMPLOYER,
        hashed_password=get_password_hash("password123"),
        location="New Delhi / नई दिल्ली",
        company_name="Sharma Construction Co. (शर्मा कंस्ट्रक्शन)",
        business_type="Construction",
        contact_person="Vikram Sharma",
        bio="Building premium residential & commercial projects in Delhi-NCR since 2014."
    )

    employer_2 = User(
        name="Rajesh Gupta",
        phone="9812345678",
        role=UserRole.EMPLOYER,
        hashed_password=get_password_hash("password123"),
        location="Gurugram / गुरुग्राम",
        company_name="Metro Home Renovations (मेट्रो होम रेनोवेशन)",
        business_type="Household",
        contact_person="Rajesh Gupta",
        bio="Home repairs, plumbing, painting and renovation services."
    )

    db.add_all([worker_1, worker_2, employer_1, employer_2])
    db.commit()
    db.refresh(worker_1)
    db.refresh(employer_1)
    db.refresh(employer_2)

    logger.info("Seeding realistic job postings...")

    # 3. Seed Jobs
    jobs = [
        Job(
            employer_id=employer_1.id,
            title="Brick Masonry & Plaster for 3-Floor Villa",
            category="Mason / राजमिस्त्री",
            description="Need skilled masons for 9-inch brickwork and external cement plastering. Site has water and electricity. Lunch provided.",
            location="New Delhi / नई दिल्ली",
            address="Pocket B, Okhla Phase 2, New Delhi",
            wage=850,
            wage_type="per_day",
            workers_needed=4,
            duration_type="multi_day",
            contact_phone="9899001122",
            is_active=True
        ),
        Job(
            employer_id=employer_2.id,
            title="Interior Wall Putty & Emulsion Painting",
            category="Painter / पेंटर",
            description="3 BHK apartment interior repainting. 2 coats putty + 2 coats premium emulsion paint. Scaffolding provided.",
            location="Noida / नोएडा",
            address="Sector 62, Near Metro Station, Noida",
            wage=800,
            wage_type="per_day",
            workers_needed=3,
            duration_type="multi_day",
            contact_phone="9812345678",
            is_active=True
        ),
        Job(
            employer_id=employer_1.id,
            title="Electrical Conduit Pipe & Distribution Wiring",
            category="Electrician / इलेक्ट्रीशियन",
            description="Installation of PVC conduit pipes and wire pulling for 10 office cabins. Safety gear required.",
            location="Gurugram / गुरुग्राम",
            address="DLF Cyber City, Phase 3, Gurugram",
            wage=950,
            wage_type="per_day",
            workers_needed=2,
            duration_type="ongoing",
            contact_phone="9899001122",
            is_active=True
        ),
        Job(
            employer_id=employer_2.id,
            title="Bathroom CPVC Pipeline & Sanitary Fitting",
            category="Plumber / प्लंबर",
            description="Full bathroom plumbing overhaul. Concealed CPVC pipes, diverters and wall-hung commode installation.",
            location="Jaipur / जयपुर",
            address="Vaishali Nagar, Near National Handloom, Jaipur",
            wage=900,
            wage_type="per_day",
            workers_needed=2,
            duration_type="one_day",
            contact_phone="9812345678",
            is_active=True
        ),
        Job(
            employer_id=employer_1.id,
            title="Wooden Wardrobe & Modular Kitchen Assembly",
            category="Carpenter / बढ़ई",
            description="Plywood cutting, laminate pasting and hardware fixing for modern kitchen cabinets and 2 wardrobes.",
            location="Bengaluru / बेंगलुरु",
            address="Whitefield Main Road, Bengaluru",
            wage=1000,
            wage_type="per_day",
            workers_needed=3,
            duration_type="multi_day",
            contact_phone="9899001122",
            is_active=True
        ),
        Job(
            employer_id=employer_2.id,
            title="Structural Steel Grill & Arc Welding Work",
            category="Welder / वेल्डर",
            description="Boundary wall safety grills and main gate reinforcement welding. Welding rod & machine available at site.",
            location="Lucknow / लखनऊ",
            address="Vipul Khand, Gomti Nagar, Lucknow",
            wage=850,
            wage_type="per_day",
            workers_needed=2,
            duration_type="one_day",
            contact_phone="9812345678",
            is_active=True
        ),
        Job(
            employer_id=employer_1.id,
            title="Material Unloading & Site Shifting Helpers",
            category="General Labor / मजदूर",
            description="Unloading cement bags and sand from trucks and shifting to upper floor. Immediate cash payment on site.",
            location="New Delhi / नई दिल्ली",
            address="Rohini Sector 16, New Delhi",
            wage=700,
            wage_type="per_day",
            workers_needed=5,
            duration_type="one_day",
            contact_phone="9899001122",
            is_active=True
        ),
        Job(
            employer_id=employer_1.id,
            title="Vitrified Floor Tile & Marble Flooring",
            category="Tile & Marble Worker / टाइल कारीगर",
            description="2x4 vitrified floor tiles laying with laser leveling and epoxy grouting for 2000 sq ft hall.",
            location="New Delhi / नई दिल्ली",
            address="South Extension Part 1, New Delhi",
            wage=950,
            wage_type="per_day",
            workers_needed=3,
            duration_type="multi_day",
            contact_phone="9899001122",
            is_active=True
        )
    ]

    db.add_all(jobs)
    db.commit()
    for j in jobs:
        db.refresh(j)

    # 4. Seed Applications for Ramesh Kumar
    app_1 = Application(
        job_id=jobs[0].id,
        worker_id=worker_1.id,
        status=ApplicationStatus.SHORTLISTED
    )
    app_2 = Application(
        job_id=jobs[7].id,
        worker_id=worker_1.id,
        status=ApplicationStatus.APPLIED
    )
    db.add_all([app_1, app_2])
    db.commit()

    logger.info("Successfully seeded database with demo workers, employers, jobs, and applications.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
