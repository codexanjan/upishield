import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.case import FraudCase, CaseMessage, CaseEvidence
from app.schemas.case import (
    FraudCaseResponse,
    CaseMessageCreate,
    CaseMessageResponse,
    CaseStatusHistoryResponse,
    CaseNoteResponse
)
from app.schemas.report import EvidenceUploadResponse
from app.services.case_service import CaseService

router = APIRouter(prefix="/cases", tags=["cases"])

def serialize_case(case: FraudCase) -> FraudCaseResponse:
    rep = case.report
    return FraudCaseResponse(
        id=case.id,
        case_number=case.case_number,
        report_id=case.report_id,
        assigned_admin_id=case.assigned_admin_id,
        assigned_admin_name=case.assigned_admin.name if case.assigned_admin else None,
        status=case.status,
        priority=case.priority,
        resolution=case.resolution,
        internal_notes=case.internal_notes,
        created_at=case.created_at,
        updated_at=case.updated_at,
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
        evidence=[EvidenceUploadResponse.model_validate(e) for e in case.evidence],
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
            for m in case.messages
        ],
        notes=[], # Hidden from normal user
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
            for h in case.status_history
        ]
    )

@router.get("", response_model=List[FraudCaseResponse])
def get_user_cases(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cases = CaseService.get_user_cases(db, current_user.id)
    return [serialize_case(c) for c in cases]

@router.get("/{case_id}", response_model=FraudCaseResponse)
def get_case(case_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = CaseService.get_case_by_id(db, case_id)
    if not case or (case.report.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=404, detail="Case not found")
    return serialize_case(case)

@router.post("/{case_id}/messages", response_model=CaseMessageResponse)
def add_case_message(
    case_id: int,
    data: CaseMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case = CaseService.get_case_by_id(db, case_id)
    if not case or (case.report.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=404, detail="Case not found")

    msg = CaseService.add_message(db, case.id, current_user, data.message, data.attachment_url)
    return CaseMessageResponse(
        id=msg.id,
        case_id=msg.case_id,
        sender_type=msg.sender_type,
        sender_id=msg.sender_id,
        sender_name=current_user.name,
        message=msg.message,
        attachment_url=msg.attachment_url,
        is_read=msg.is_read,
        created_at=msg.created_at
    )

@router.get("/{case_id}/messages", response_model=List[CaseMessageResponse])
def get_case_messages(case_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = CaseService.get_case_by_id(db, case_id)
    if not case or (case.report.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=404, detail="Case not found")

    return [
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
        for m in case.messages
    ]

@router.post("/{case_id}/evidence", response_model=EvidenceUploadResponse)
async def upload_case_evidence(
    case_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case = CaseService.get_case_by_id(db, case_id)
    if not case or (case.report.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=404, detail="Case not found")

    allowed_types = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP and PDF files are allowed")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum 10MB limit")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    safe_filename = f"evidence_{uuid.uuid4().hex[:12]}.{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    ev = CaseService.add_evidence(
        db=db,
        case_id=case.id,
        uploader=current_user,
        file_name=file.filename,
        file_url=f"/uploads/{safe_filename}",
        file_type=file.content_type,
        file_size=len(content),
        description=description
    )
    return EvidenceUploadResponse.model_validate(ev)
