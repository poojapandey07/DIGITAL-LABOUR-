# 🏛️ Digital Labor Chowk — FastAPI REST API Backend

This is the production-grade **Python (FastAPI)** backend for **Digital Labor Chowk (डिजिटल लेबर चौक)**, connecting daily-wage workers with employers across India. It persists data in **MySQL (8.0+)** via **SQLAlchemy ORM** with the `PyMySQL` driver, secures endpoints with **JWT Bearer authentication**, enforces role-based authorization, and is fully integrated with the vanilla HTML/CSS/JS frontend.

---

## 🛠️ Tech Stack & Key Features

- **Framework**: FastAPI (Python 3.11+) + Uvicorn ASGI
- **Database**: MySQL 8.0+ via SQLAlchemy 2.0 ORM & `PyMySQL`
- **Full Hindi / Devanagari UTF-8**: Configured with `utf8mb4` charset for names, trade skills, and site descriptions
- **Authentication**: JWT access tokens (HMAC-SHA256) with `passlib[bcrypt]` password hashing
- **Migrations**: Alembic database migrations (`alembic upgrade head`)
- **Docker Compose**: Containerized MySQL 8.0 service with automated health checks
- **API Documentation**: Auto-generated interactive Swagger UI at `http://localhost:8000/docs`

---

## 📂 File Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app instance, CORS middleware, router registration
│   ├── database.py              # SQLAlchemy engine, SessionLocal, and DB dependencies
│   ├── seed.py                  # Database seeder with realistic Indian labor market data
│   ├── deps.py                  # JWT user extraction and role-based access guards
│   ├── core/
│   │   ├── config.py            # Environment configuration via pydantic-settings
│   │   └── security.py          # Bcrypt hashing and JWT encoding/decoding
│   ├── models/
│   │   ├── user.py              # User ORM model (worker and employer roles)
│   │   ├── job.py               # Job ORM model with soft-delete support
│   │   └── application.py       # Application ORM model with status tracking
│   ├── schemas/
│   │   ├── user.py              # Pydantic models for signup, login, profiles, metrics
│   │   ├── job.py               # Pydantic models for job creation, search, pagination
│   │   └── application.py       # Pydantic models for applications and status updates
│   └── routers/
│       ├── auth.py              # /api/auth/signup, /login, /me
│       ├── workers.py           # /api/workers/{id}, profile update, dashboard, apps
│       ├── employers.py         # /api/employers/{id}/jobs, applicant inspector
│       ├── jobs.py              # /api/jobs CRUD, search, filter, pagination
│       └── applications.py      # /api/applications, duplicate prevention, status patch
├── alembic/
│   ├── env.py                   # Alembic migration environment
│   └── versions/
│       └── 001_initial_tables.py # Initial database migration
├── tests/
│   ├── conftest.py              # In-memory test DB fixture
│   ├── test_auth.py             # Auth & signup tests
│   ├── test_jobs.py             # Job CRUD & search tests
│   └── test_applications.py     # Application lifecycle & duplicate prevention tests
├── docker-compose.yml           # MySQL 8.0 service
├── requirements.txt             # Python package dependencies
├── .env.example                 # Environment configuration template
└── README.md                    # Setup guide and API documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.11+ installed (`python --version`)
- MySQL 8.0 server (either installed locally or run via Docker)

### 2. Setup Virtual Environment
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` matches your MySQL credentials:
```env
DATABASE_URL=mysql+pymysql://labor_user:labor_pass@localhost:3306/digital_labor_chowk
SECRET_KEY=digital_labor_chowk_jwt_secret_key_2026_super_secure
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=["*"]
```

> **Note for SQLite zero-install testing**: You can also set `DATABASE_URL=sqlite:///./labor_chowk.db` to test the backend immediately without MySQL running.

### 4. Run MySQL with Docker Compose (Recommended)
If you have Docker installed, spin up MySQL with:
```bash
docker compose up -d db
```
This starts MySQL 8.0 with `utf8mb4` charset and creates the `digital_labor_chowk` database automatically on port `3306`.

### 5. Apply Database Migrations
```bash
alembic upgrade head
```

### 6. Seed Demo Data
Populate realistic Indian demo workers (Ramesh Kumar, Sunita Devi), employers (Sharma Constructions), and 8 active job postings:
```bash
python -m app.seed
```

### 7. Start the Development Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Open **http://localhost:8000/docs** in your browser to view the interactive OpenAPI / Swagger UI!

---

## 🧪 Running Automated Tests

Run the test suite with Pytest (uses an isolated in-memory test database):
```bash
pytest -v
```

---

## 📡 API Reference Overview

| Category | Method | Endpoint | Access Role | Description |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/signup` | Public | Register new worker or employer |
| **Auth** | `POST` | `/api/auth/login` | Public | Login with phone & password &rarr; JWT token |
| **Auth** | `GET` | `/api/auth/me` | Authenticated | Get current logged-in user profile |
| **Workers** | `GET` | `/api/workers/{id}` | Public | View worker public profile |
| **Workers** | `PUT` | `/api/workers/{id}` | Worker (Self) | Update worker profile (skills, wage, bio) |
| **Workers** | `GET` | `/api/workers/{id}/dashboard` | Worker (Self) | Dashboard metrics (apps sent, matching jobs) |
| **Workers** | `GET` | `/api/workers/{id}/applications` | Worker (Self) | List worker's job applications with statuses |
| **Employers**| `GET` | `/api/employers/{id}/jobs` | Employer (Self) | List jobs posted by this employer |
| **Employers**| `GET` | `/api/employers/{id}/jobs/{job_id}/applicants` | Employer (Owner) | List applicants for a specific job |
| **Jobs** | `GET` | `/api/jobs` | Public | Search/filter jobs with pagination |
| **Jobs** | `POST` | `/api/jobs` | Employer | Publish a new job posting |
| **Jobs** | `GET` | `/api/jobs/{id}` | Public | View job details |
| **Jobs** | `PUT` | `/api/jobs/{id}` | Employer (Owner) | Update job listing |
| **Jobs** | `DELETE`| `/api/jobs/{id}` | Employer (Owner) | Soft-delete job listing |
| **Applications** | `POST` | `/api/applications` | Worker | Apply for a job (prevents duplicates: 409) |
| **Applications** | `GET` | `/api/applications/{id}` | Applicant / Owner | View application details |
| **Applications** | `PATCH`| `/api/applications/{id}/status` | Employer (Owner) | Update status (`viewed`, `shortlisted`, etc.) |

---

## 📋 Example cURL Requests

### 1. Worker Sign Up
```bash
curl -X POST "http://localhost:8000/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ramesh Kumar (रमेश कुमार)",
    "phone": "9876543210",
    "password": "password123",
    "role": "worker",
    "location": "New Delhi / नई दिल्ली",
    "skills": ["Mason / राजमिस्त्री", "Tile & Marble Worker / टाइल कारीगर"],
    "experience_years": "7",
    "daily_wage": 850
  }'
```

### 2. Login (Obtain JWT Token)
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "password": "password123"
  }'
```

### 3. Search Jobs (with Keywords, Trade & Pagination)
```bash
curl -X GET "http://localhost:8000/api/jobs?q=mason&location=Delhi&min_wage=800&sort=newest&page=1&limit=10"
```

### 4. Post a Job (Employer Only)
```bash
curl -X POST "http://localhost:8000/api/jobs" \
  -H "Authorization: Bearer <EMPLOYER_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Need 4 Masons for RCC Slab Work",
    "category": "Mason / राजमिस्त्री",
    "description": "Slab casting and shuttering support. Lunch provided.",
    "location": "New Delhi / नई दिल्ली",
    "address": "Okhla Phase 2, New Delhi",
    "wage": 900,
    "wage_type": "per_day",
    "workers_needed": 4,
    "duration_type": "multi_day"
  }'
```

### 5. Apply for a Job (Worker Only)
```bash
curl -X POST "http://localhost:8000/api/applications" \
  -H "Authorization: Bearer <WORKER_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": 1
  }'
```

### 6. Shortlist an Applicant (Employer Only)
```bash
curl -X PATCH "http://localhost:8000/api/applications/1/status" \
  -H "Authorization: Bearer <EMPLOYER_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shortlisted"
  }'
```

---

## 🌐 Production Drop-in Configurations

To deploy against a managed cloud MySQL database (e.g. AWS RDS, Google Cloud SQL, PlanetScale, or Railway), only update the `DATABASE_URL` environment variable:
```env
# AWS RDS / Generic MySQL:
DATABASE_URL=mysql+pymysql://<user>:<password>@<rds-endpoint>:3306/<database>?ssl_ca=/path/to/ca-bundle.pem

# PlanetScale / SSL:
DATABASE_URL=mysql+pymysql://<user>:<password>@<host>/<database>?ssl={"ssl_mode":"VERIFY_IDENTITY"}
```
No code modifications are necessary.
