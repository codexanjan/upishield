import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.seed_data import seed_initial_data

@pytest.fixture(scope="session")
def client():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_initial_data(db)
    db.close()
    with TestClient(app) as c:
        yield c

def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "NO AI" in data["engine"]

def test_user_login(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "user@upishield.com",
        "password": "user123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "user"

def test_admin_login(client):
    response = client.post("/api/v1/auth/admin-login", json={
        "email": "admin@upishield.com",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "admin"

def test_upi_validation(client):
    # Valid normal upi
    res = client.post("/api/v1/upi/validate", json={"upi_id": "testuser@icici"})
    assert res.status_code == 200
    assert res.json()["is_valid_format"] is True

    # Known reported upi
    res2 = client.post("/api/v1/upi/validate", json={"upi_id": "quickcash.refund@fakeicici"})
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["is_reported"] is True
    assert data2["verified_report_count"] >= 1

def test_upi_qr_parse(client):
    qr_text = "upi://pay?pa=merchant@upi&pn=MerchantStore&am=500.00&cu=INR&tn=Order123"
    res = client.post("/api/v1/upi/parse-qr", json={"qr_data": qr_text})
    assert res.status_code == 200
    data = res.json()
    assert data["is_upi"] is True
    assert data["receiver_upi"] == "merchant@upi"
    assert data["amount"] == 500.0

def test_verified_merchant_qr(client):
    verified_qr = "upi://pay?pa=starbucks.india@icici&pn=Starbucks+Coffee+India&am=290.00&cu=INR&tn=Order-B7892&mc=5812"
    res = client.post("/api/v1/upi/parse-qr", json={"qr_data": verified_qr})
    assert res.status_code == 200
    data = res.json()
    assert data["is_upi"] is True
    assert data["receiver_upi"] == "starbucks.india@icici"
    assert data["amount"] == 290.0
    assert data["is_reported"] is False

def test_fraudulent_scam_qr_blocked(client):
    scam_qr = "upi://pay?pa=quickcash.refund@fakeicici&pn=Electricity+Bill+Refund+Desk&am=15000.00&cu=INR&tn=Refund+Claim+Disbursement&mc=0000"
    res = client.post("/api/v1/upi/parse-qr", json={"qr_data": scam_qr})
    assert res.status_code == 200
    data = res.json()
    assert data["is_upi"] is True
    assert data["receiver_upi"] == "quickcash.refund@fakeicici"
    assert data["is_reported"] is True
    assert "Warning" in data["warning_message"] or "fraud" in data["warning_message"].lower()

def test_financial_summary_deterministic(client):
    login = client.post("/api/v1/auth/login", json={"email": "user@upishield.com", "password": "user123"}).json()
    token = login["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/income/summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_income" in data
    assert "total_expenses" in data
    assert "net_balance" in data
    assert "savings" in data
    assert "savings_percentage" in data

def test_fraud_report_and_case_lifecycle(client):
    user_login = client.post("/api/v1/auth/login", json={"email": "user@upishield.com", "password": "user123"}).json()
    user_headers = {"Authorization": f"Bearer {user_login['access_token']}"}

    admin_login = client.post("/api/v1/auth/admin-login", json={"email": "admin@upishield.com", "password": "admin123"}).json()
    admin_headers = {"Authorization": f"Bearer {admin_login['access_token']}"}

    # 1. User submits fraud report
    report_res = client.post("/api/v1/reports", headers=user_headers, json={
        "fraud_category": "QR Scam",
        "amount": 25000.0,
        "upi_id": "qr.scammer@paytm",
        "merchant": "Fake Supermart",
        "phone": "+91 91234 56789",
        "description": "Scanned merchant QR at store which was overlaid with fraud sticker"
    })
    assert report_res.status_code == 200
    rep_data = report_res.json()
    assert "report_number" in rep_data
    assert rep_data["case_id"] is not None
    case_id = rep_data["case_id"]

    # 2. Admin retrieves case
    case_res = client.get(f"/api/v1/admin/cases/{case_id}", headers=admin_headers)
    assert case_res.status_code == 200
    case_data = case_res.json()
    assert case_data["priority"] == "High" # 25,000 threshold triggers High priority

    # 3. Admin updates status
    status_res = client.patch(f"/api/v1/admin/cases/{case_id}/status", headers=admin_headers, json={
        "status": "Under Review",
        "note": "Assigned to cyber fraud analyst team"
    })
    assert status_res.status_code == 200

    # 4. Admin sends message to user
    msg_res = client.post(f"/api/v1/admin/cases/{case_id}/message", headers=admin_headers, json={
        "message": "Please attach photo of the QR sticker found at counter."
    })
    assert msg_res.status_code == 200

    # 5. User replies to case
    user_reply = client.post(f"/api/v1/cases/{case_id}/messages", headers=user_headers, json={
        "message": "I will upload the photo receipt shortly."
    })
    assert user_reply.status_code == 200

    # 6. Admin verifies report
    verify_res = client.post(f"/api/v1/admin/cases/{case_id}/verify", headers=admin_headers, json={
        "verification_status": "Verified"
    })
    assert verify_res.status_code == 200

    # 7. Check audit logs
    audit_res = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert audit_res.status_code == 200
    assert len(audit_res.json()) >= 1
