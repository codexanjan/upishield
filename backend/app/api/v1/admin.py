from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.permissions import get_current_admin
from app.models.user import User
from app.models.transaction import Transaction, UPITransaction
from app.models.card import CardTransaction
from app.models.fraud_report import FraudReport, ReportedUPI, ReportedMerchant
from app.models.case import FraudCase, CaseMessage, CaseNote, CaseEvidence
from app.models.audit import AuditLog
from app.schemas.user import UserResponse
from app.schemas.transaction import TransactionResponse
from app.schemas.report import FraudReportResponse, ReportedUPIResponse, ReportedMerchantResponse
from app.schemas.case import (
    FraudCaseResponse,
    CaseStatusUpdate,
    CasePriorityUpdate,
    CaseMessageCreate,
    CaseMessageResponse,
    CaseNoteCreate,
    CaseNoteResponse,
    RequestEvidenceRequest,
    CaseStatusHistoryResponse
)
from app.schemas.report import EvidenceUploadResponse
from app.schemas.audit import AuditLogResponse
from app.services.case_service import CaseService
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/dashboard")
def get_admin_dashboard(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).filter(User.role == "user").count()
    total_transactions = db.query(Transaction).count()
    upi_transactions = db.query(Transaction).filter(Transaction.transaction_type == "UPI").count()
    card_transactions = db.query(Transaction).filter(Transaction.transaction_type == "Card").count()
    fraud_reports = db.query(FraudReport).count()
    open_cases = db.query(FraudCase).filter(FraudCase.status.in_(["Submitted", "Pending Review", "Under Review", "Waiting for User", "Escalated"])).count()
    resolved_cases = db.query(FraudCase).filter(FraudCase.status == "Resolved").count()
    suspicious_transactions = db.query(Transaction).filter(Transaction.flag_status == "Suspicious").count()
    
    reported_amounts = db.query(func.sum(FraudReport.amount)).scalar() or 0.0

    # Reports by Month (last 6 months)
    now = datetime.now(timezone.utc)
    reports_by_month = []
    for i in range(5, -1, -1):
        m = (now.month - i - 1) % 12 + 1
        y = now.year if (now.month - i > 0) else (now.year - 1)
        name = datetime(y, m, 1).strftime("%b")
        count = db.query(FraudReport).filter(
            func.extract("month", FraudReport.created_at) == m,
            func.extract("year", FraudReport.created_at) == y
        ).count()
        reports_by_month.append({"month": name, "count": count})

    # Fraud Categories
    cats = db.query(FraudReport.fraud_category, func.count(FraudReport.id)).group_by(FraudReport.fraud_category).all()
    fraud_categories = [{"name": c[0], "value": c[1]} for c in cats]

    # UPI vs Card Reports
    upi_rep_count = db.query(FraudReport).filter(FraudReport.upi_id != None).count()
    card_rep_count = db.query(FraudReport).filter(FraudReport.fraud_category.ilike("%Card%")).count()

    # Case Status Breakdown
    statuses = db.query(FraudCase.status, func.count(FraudCase.id)).group_by(FraudCase.status).all()
    case_status_breakdown = [{"status": s[0], "count": s[1]} for s in statuses]

    # Top Reported UPI IDs
    top_upi = db.query(ReportedUPI).order_by(ReportedUPI.report_count.desc()).limit(5).all()
    top_reported_upis = [
        {"upi_id": u.upi_id, "reports": u.report_count, "verified": u.verified_count, "status": u.status}
        for u in top_upi
    ]

    # Top Reported Merchants
    top_m = db.query(ReportedMerchant).order_by(ReportedMerchant.report_count.desc()).limit(5).all()
    top_reported_merchants = [
        {"merchant": m.merchant_name, "reports": m.report_count, "verified": m.verified_count, "status": m.status}
        for m in top_m
    ]

    return {
        "stats": {
            "total_users": total_users,
            "total_transactions": total_transactions,
            "upi_transactions": upi_transactions,
            "card_transactions": card_transactions,
            "fraud_reports": fraud_reports,
            "open_cases": open_cases,
            "resolved_cases": resolved_cases,
            "suspicious_transactions": suspicious_transactions,
            "reported_amount": round(reported_amounts, 2)
        },
        "charts": {
            "reports_by_month": reports_by_month,
            "fraud_categories": fraud_categories,
            "upi_vs_card": [
                {"name": "UPI Reports", "value": upi_rep_count},
                {"name": "Card Reports", "value": card_rep_count},
                {"name": "Other", "value": max(0, fraud_reports - upi_rep_count - card_rep_count)}
            ],
            "case_status_breakdown": case_status_breakdown,
            "top_reported_upis": top_reported_upis,
            "top_reported_merchants": top_reported_merchants
        }
    }

@router.get("/users")
def get_admin_users(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(User).filter(User.role == "user").all()
    result = []
    for u in users:
        txn_count = len(u.transactions)
        rep_count = len(u.reports)
        case_count = sum(1 for r in u.reports if r.case)
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "mobile": u.mobile,
            "joined": u.created_at,
            "status": u.status,
            "transactions_count": txn_count,
            "reports_count": rep_count,
            "cases_count": case_count
        })
    return result

@router.patch("/users/{user_id}/status")
def toggle_user_status(user_id: int, payload: dict, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    new_status = payload.get("status", "disabled" if target_user.status == "active" else "active")
    old_status = target_user.status
    target_user.status = new_status
    db.commit()

    AuditService.log_action(
        db=db,
        admin_id=admin.id,
        admin_email=admin.email,
        action=f"User {new_status.capitalize()}",
        target_type="User",
        target_id=str(target_user.id),
        details={"email": target_user.email, "old_status": old_status, "new_status": new_status}
    )

    return {"message": f"User application account {new_status}", "status": target_user.status}

@router.get("/transactions", response_model=List[TransactionResponse])
def get_admin_transactions(
    search: Optional[str] = None,
    tx_type: Optional[str] = None,
    status: Optional[str] = None,
    flag_status: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    q = db.query(Transaction)
    if search:
        s = f"%{search.strip()}%"
        q = q.filter((Transaction.merchant.ilike(s)) | (Transaction.transaction_reference.ilike(s)))
    if tx_type:
        q = q.filter(Transaction.transaction_type == tx_type)
    if status:
        q = q.filter(Transaction.status == status)
    if flag_status:
        q = q.filter(Transaction.flag_status == flag_status)
    
    txns = q.order_by(Transaction.transaction_date.desc()).offset(skip).limit(limit).all()
    result = []
    for t in txns:
        r = TransactionResponse.model_validate(t)
        r.has_report = bool(t.fraud_report)
        result.append(r)
    return result

@router.get("/reports", response_model=List[FraudReportResponse])
def get_admin_reports(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    reports = db.query(FraudReport).order_by(FraudReport.created_at.desc()).all()
    result = []
    for rep in reports:
        res = FraudReportResponse.model_validate(rep)
        if rep.case:
            res.case_id = rep.case.id
            res.case_number = rep.case.case_number
        res.evidence = [EvidenceUploadResponse.model_validate(e) for e in rep.evidence_list]
        result.append(res)
    return result

@router.get("/cases", response_model=List[FraudCaseResponse])
def get_admin_cases(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    cases = CaseService.get_all_cases(db, status=status, priority=priority)
    result = []
    for c in cases:
        rep = c.report
        res = FraudCaseResponse(
            id=c.id,
            case_number=c.case_number,
            report_id=c.report_id,
            assigned_admin_id=c.assigned_admin_id,
            assigned_admin_name=c.assigned_admin.name if c.assigned_admin else None,
            status=c.status,
            priority=c.priority,
            resolution=c.resolution,
            internal_notes=c.internal_notes,
            created_at=c.created_at,
            updated_at=c.updated_at,
            fraud_category=rep.fraud_category if rep else None,
            amount=rep.amount if rep else None,
            upi_id=rep.upi_id if rep else None,
            merchant=rep.merchant if rep else None,
            description=rep.description if rep else None,
            user_id=rep.user_id if rep else None,
            user_name=rep.user.name if rep and rep.user else None,
            user_email=rep.user.email if rep and rep.user else None,
            user_mobile=rep.user.mobile if rep and rep.user else None,
            transaction_id=rep.transaction_id if rep else None,
            transaction_reference=rep.transaction.transaction_reference if rep and rep.transaction else None,
            evidence=[EvidenceUploadResponse.model_validate(e) for e in c.evidence],
            messages=[
                CaseMessageResponse(
                    id=m.id,
                    case_id=m.case_id,
                    sender_type=m.sender_type,
                    sender_id=m.sender_id,
                    sender_name=m.sender.name if m.sender else None,
                    message=m.message,
                    attachment_url=m.attachment_url,
                    is_read=m.is_read,
                    created_at=m.created_at
                )
                for m in c.messages
            ],
            notes=[
                CaseNoteResponse(
                    id=n.id,
                    case_id=n.case_id,
                    admin_id=n.admin_id,
                    admin_name=n.admin.name if n.admin else None,
                    note=n.note,
                    created_at=n.created_at
                )
                for n in c.notes
            ],
            status_history=[
                CaseStatusHistoryResponse(
                    id=h.id,
                    case_id=h.case_id,
                    old_status=h.old_status,
                    new_status=h.new_status,
                    changed_by_type=h.changed_by_type,
                    changed_by_id=h.changed_by_id,
                    changed_by_name=h.changer.name if h.changer else None,
                    note=h.note,
                    created_at=h.created_at
                )
                for h in c.status_history
            ]
        )
        result.append(res)
    return result

@router.get("/cases/{case_id}", response_model=FraudCaseResponse)
def get_admin_case(case_id: int, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    c = CaseService.get_case_by_id(db, case_id)
    if not c:
        raise HTTPException(status_code=404, detail="Case not found")
    rep = c.report
    return FraudCaseResponse(
        id=c.id,
        case_number=c.case_number,
        report_id=c.report_id,
        assigned_admin_id=c.assigned_admin_id,
        assigned_admin_name=c.assigned_admin.name if c.assigned_admin else None,
        status=c.status,
        priority=c.priority,
        resolution=c.resolution,
        internal_notes=c.internal_notes,
        created_at=c.created_at,
        updated_at=c.updated_at,
        fraud_category=rep.fraud_category if rep else None,
        amount=rep.amount if rep else None,
        upi_id=rep.upi_id if rep else None,
        merchant=rep.merchant if rep else None,
        description=rep.description if rep else None,
        user_id=rep.user_id if rep else None,
        user_name=rep.user.name if rep and rep.user else None,
        user_email=rep.user.email if rep and rep.user else None,
        user_mobile=rep.user.mobile if rep and rep.user else None,
        transaction_id=rep.transaction_id if rep else None,
        transaction_reference=rep.transaction.transaction_reference if rep and rep.transaction else None,
        evidence=[EvidenceUploadResponse.model_validate(e) for e in c.evidence],
        messages=[
            CaseMessageResponse(
                id=m.id,
                case_id=m.case_id,
                sender_type=m.sender_type,
                sender_id=m.sender_id,
                sender_name=m.sender.name if m.sender else None,
                message=m.message,
                attachment_url=m.attachment_url,
                is_read=m.is_read,
                created_at=m.created_at
            )
            for m in c.messages
        ],
        notes=[
            CaseNoteResponse(
                id=n.id,
                case_id=n.case_id,
                admin_id=n.admin_id,
                admin_name=n.admin.name if n.admin else None,
                note=n.note,
                created_at=n.created_at
            )
            for n in c.notes
        ],
        status_history=[
            CaseStatusHistoryResponse(
                id=h.id,
                case_id=h.case_id,
                old_status=h.old_status,
                new_status=h.new_status,
                changed_by_type=h.changed_by_type,
                changed_by_id=h.changed_by_id,
                changed_by_name=h.changer.name if h.changer else None,
                note=h.note,
                created_at=h.created_at
            )
            for h in c.status_history
        ]
    )

@router.patch("/cases/{case_id}/status")
def update_case_status(
    case_id: int,
    data: CaseStatusUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    case = CaseService.update_case_status(
        db=db,
        case_id=case_id,
        admin=admin,
        new_status=data.status,
        note=data.note,
        resolution=data.resolution
    )
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"message": "Status updated successfully", "status": case.status}

@router.patch("/cases/{case_id}/priority")
def update_case_priority(
    case_id: int,
    data: CasePriorityUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    case = CaseService.update_case_priority(db, case_id, admin, data.priority)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"message": "Priority updated successfully", "priority": case.priority}

@router.post("/cases/{case_id}/message")
def send_admin_case_message(
    case_id: int,
    data: CaseMessageCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    msg = CaseService.add_message(db, case_id, admin, data.message, data.attachment_url)
    return {"message": "Message sent to user", "id": msg.id}

@router.post("/cases/{case_id}/note")
def add_admin_case_note(
    case_id: int,
    data: CaseNoteCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    note = CaseService.add_internal_note(db, case_id, admin, data.note)
    return {"message": "Internal note saved", "id": note.id}

@router.post("/cases/{case_id}/request-evidence")
def request_evidence(
    case_id: int,
    data: RequestEvidenceRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    case = CaseService.get_case_by_id(db, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Update status to Waiting for User
    CaseService.update_case_status(
        db=db,
        case_id=case.id,
        admin=admin,
        new_status="Waiting for User",
        note=f"Evidence requested: {data.evidence_instructions}"
    )

    # Post message
    CaseService.add_message(
        db=db,
        case_id=case.id,
        sender=admin,
        message_text=f"EVIDENCE REQUEST: {data.evidence_instructions}"
    )

    return {"message": "Evidence request sent to user"}

@router.post("/cases/{case_id}/verify")
def verify_report_status(
    case_id: int,
    payload: dict,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    v_status = payload.get("verification_status", "Verified")
    ok = CaseService.verify_report(db, case_id, admin, v_status)
    if not ok:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"message": f"Report classified as {v_status}"}

@router.get("/reported-upi", response_model=List[ReportedUPIResponse])
def get_reported_upi_directory(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(ReportedUPI).order_by(ReportedUPI.report_count.desc()).all()

@router.get("/reported-merchants", response_model=List[ReportedMerchantResponse])
def get_reported_merchants_directory(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(ReportedMerchant).order_by(ReportedMerchant.report_count.desc()).all()

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return AuditService.get_logs(db, skip=skip, limit=limit)
