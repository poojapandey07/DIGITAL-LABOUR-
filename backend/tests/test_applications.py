import pytest


def test_application_lifecycle_and_duplicate_prevention(client):
    # 1. Setup employer and a job
    emp_res = client.post("/api/auth/signup", json={
        "name": "Builder Suresh",
        "phone": "9991112220",
        "password": "pass1234password",
        "role": "employer",
        "company_name": "Suresh Buildcon",
        "location": "Noida"
    })
    emp_token = emp_res.json()["access_token"]
    emp_id = emp_res.json()["user"]["id"]

    job_res = client.post(
        "/api/jobs",
        json={
            "title": "Need 3 Painters for Apartment",
            "category": "Painter / पेंटर",
            "location": "Noida",
            "wage": 800,
            "workers_needed": 3
        },
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    job_id = job_res.json()["id"]

    # 2. Setup worker
    worker_res = client.post("/api/auth/signup", json={
        "name": "Painter Mohan",
        "phone": "9991112221",
        "password": "pass1234password",
        "role": "worker",
        "location": "Noida",
        "skills": ["Painter / पेंटर"]
    })
    worker_token = worker_res.json()["access_token"]
    worker_id = worker_res.json()["user"]["id"]

    # 3. Worker applies to job
    apply_res = client.post(
        "/api/applications",
        json={"job_id": job_id},
        headers={"Authorization": f"Bearer {worker_token}"}
    )
    assert apply_res.status_code == 201
    app_id = apply_res.json()["id"]
    assert apply_res.json()["status"] == "applied"

    # 4. Duplicate application returns 409 Conflict
    dup_res = client.post(
        "/api/applications",
        json={"job_id": job_id},
        headers={"Authorization": f"Bearer {worker_token}"}
    )
    assert dup_res.status_code == 409
    assert "already applied" in dup_res.json()["detail"].lower()

    # 5. Worker checks their applications list
    worker_apps_res = client.get(
        f"/api/workers/{worker_id}/applications",
        headers={"Authorization": f"Bearer {worker_token}"}
    )
    assert worker_apps_res.status_code == 200
    assert len(worker_apps_res.json()) >= 1

    # 6. Employer checks applicants for the job
    applicants_res = client.get(
        f"/api/employers/{emp_id}/jobs/{job_id}/applicants",
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert applicants_res.status_code == 200
    assert len(applicants_res.json()) >= 1
    assert applicants_res.json()[0]["worker"]["name"] == "Painter Mohan"

    # 7. Employer shortlists the applicant
    patch_res = client.patch(
        f"/api/applications/{app_id}/status",
        json={"status": "shortlisted"},
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "shortlisted"

    # 8. Unrelated user attempting to change status gets 403 Forbidden
    other_worker_res = client.post("/api/auth/signup", json={
        "name": "Random Person",
        "phone": "9991112222",
        "password": "pass1234password",
        "role": "worker"
    })
    other_token = other_worker_res.json()["access_token"]
    forbidden_patch = client.patch(
        f"/api/applications/{app_id}/status",
        json={"status": "rejected"},
        headers={"Authorization": f"Bearer {other_token}"}
    )
    assert forbidden_patch.status_code == 403
