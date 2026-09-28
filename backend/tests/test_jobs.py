import pytest


def get_auth_token(client, phone, password, role="employer", name="Test Employer"):
    res = client.post("/api/auth/signup", json={
        "name": name,
        "phone": phone,
        "password": password,
        "role": role,
        "company_name": "Test Co" if role == "employer" else None,
        "location": "New Delhi"
    })
    return res.json()["access_token"]


def test_job_crud_and_search(client):
    emp_token = get_auth_token(client, "9998887710", "pass1234password", "employer")
    worker_token = get_auth_token(client, "9998887711", "pass1234password", "worker", "Worker Ram")

    # 1. Employer creates a job
    job_payload = {
        "title": "Need 2 Masons for Boundary Wall",
        "category": "Mason / राजमिस्त्री",
        "description": "Cement plastering and brick masonry work.",
        "location": "New Delhi",
        "wage": 900,
        "wage_type": "per_day",
        "workers_needed": 2,
        "duration_type": "multi_day"
    }
    create_res = client.post(
        "/api/jobs",
        json=job_payload,
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert create_res.status_code == 201
    job_id = create_res.json()["id"]
    assert job_id

    # 2. Worker trying to post job returns 403 Forbidden
    worker_create = client.post(
        "/api/jobs",
        json=job_payload,
        headers={"Authorization": f"Bearer {worker_token}"}
    )
    assert worker_create.status_code == 403

    # 3. List and search jobs
    list_res = client.get("/api/jobs?q=mason&location=Delhi")
    assert list_res.status_code == 200
    data = list_res.json()
    assert data["total"] >= 1
    assert any(j["id"] == job_id for j in data["items"])

    # 4. Job detail
    detail_res = client.get(f"/api/jobs/{job_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["wage"] == 900

    # 5. Update job by owner
    update_res = client.put(
        f"/api/jobs/{job_id}",
        json={"wage": 950},
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["wage"] == 950

    # 6. Delete job (soft-delete)
    del_res = client.delete(
        f"/api/jobs/{job_id}",
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert del_res.status_code == 204

    # Verify not returned in active list
    list_active = client.get("/api/jobs")
    assert not any(j["id"] == job_id for j in list_active.json()["items"])
