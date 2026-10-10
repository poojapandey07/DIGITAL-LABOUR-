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


def test_email_signup_and_login(client):
    # 1. Signup with Email
    worker_email_data = {
        "name": "Karan Electrician",
        "email": "karan.electric@example.com",
        "phone": "9998887775",
        "password": "mypassword123",
        "role": "worker",
        "location": "Jaipur / जयपुर",
        "skills": ["Electrician / इलेक्ट्रीशियन"]
    }
    signup_res = client.post("/api/auth/signup", json=worker_email_data)
    assert signup_res.status_code == 201
    data = signup_res.json()
    assert data["user"]["email"] == "karan.electric@example.com"
    assert data["user"]["role"] == "worker"

    # 2. Duplicate email returns 409 Conflict
    dup_res = client.post("/api/auth/signup", json=worker_email_data)
    assert dup_res.status_code == 409
    assert "already registered" in dup_res.json()["detail"].lower()

    # 3. Login with email
    login_res = client.post("/api/auth/login", json={
        "email": "karan.electric@example.com",
        "password": "mypassword123"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()
    assert login_res.json()["user"]["name"] == "Karan Electrician"


def test_google_auth(client):
    import base64
    import json

    # Mock Google JWT ID token payload
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256"}).encode()).decode().rstrip("=")
    claims = base64.urlsafe_b64encode(json.dumps({
        "sub": "google-user-987654",
        "email": "google.user@example.com",
        "name": "Sunil Google",
        "picture": "https://example.com/sunil.jpg"
    }).encode()).decode().rstrip("=")
    fake_token = f"{header}.{claims}.fake_signature"

    # Google auth creates new user
    res = client.post("/api/auth/google", json={
        "credential": fake_token,
        "role": "worker",
        "expected_role": "worker"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "google.user@example.com"
    assert data["user"]["name"] == "Sunil Google"
    assert data["user"]["role"] == "worker"

    # Second google auth with same token logs in existing user
    res2 = client.post("/api/auth/google", json={
        "credential": fake_token,
        "expected_role": "worker"
    })
    assert res2.status_code == 200
    assert res2.json()["user"]["id"] == data["user"]["id"]
