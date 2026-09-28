import pytest


def test_worker_signup_and_login(client):
    # 1. Signup a worker
    signup_data = {
        "name": "Raju Mistri",
        "phone": "9998887771",
        "password": "pass1234password",
        "role": "worker",
        "location": "New Delhi / नई दिल्ली",
        "skills": ["Mason / राजमिस्त्री"],
        "daily_wage": 850
    }
    res = client.post("/api/auth/signup", json=signup_data)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["phone"] == "9998887771"
    assert data["user"]["role"] == "worker"

    # 2. Duplicate phone signup returns 409
    res_dup = client.post("/api/auth/signup", json=signup_data)
    assert res_dup.status_code == 409
    assert "already registered" in res_dup.json()["detail"].lower()

    # 3. Login with correct credentials
    login_res = client.post("/api/auth/login", json={
        "phone": "9998887771",
        "password": "pass1234password"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token

    # 4. Login with wrong password returns 401
    wrong_login = client.post("/api/auth/login", json={
        "phone": "9998887771",
        "password": "wrongpassword"
    })
    assert wrong_login.status_code == 401

    # 5. Access /api/auth/me with Bearer token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Raju Mistri"


def test_employer_signup(client):
    emp_data = {
        "name": "Anil Gupta",
        "phone": "9998887772",
        "password": "pass1234password",
        "role": "employer",
        "location": "Noida / नोएडा",
        "company_name": "Gupta Builders",
        "business_type": "Construction"
    }
    res = client.post("/api/auth/signup", json=emp_data)
    assert res.status_code == 201
    data = res.json()
    assert data["user"]["role"] == "employer"
    assert data["user"]["company_name"] == "Gupta Builders"
