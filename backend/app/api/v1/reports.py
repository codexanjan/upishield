import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.fraud_report import FraudReport
from app.models.case import CaseEvidence
from app.schemas.report import FraudReportCreate, FraudReportResponse, EvidenceUploadResponse
from app.services.report_service import ReportService
from app.services.case_service import CaseService

router = APIRouter(prefix="/reports", tags=["reports"])

@router.post("", response_model=FraudReportResponse)
def create_report(
    data: FraudReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rep = ReportService.create_report(db, current_user.id, current_user.name, data)
    res = FraudReportResponse.model_validate(rep)
    if rep.case:
        res.case_id = rep.case.id
        res.case_number = rep.case.case_number
    res.evidence = [EvidenceUploadResponse.model_validate(e) for e in rep.evidence_list]
    return res

@router.get("", response_model=List[FraudReportResponse])
def get_user_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reports = ReportService.get_user_reports(db, current_user.id)
    result = []
    for rep in reports:
        res = FraudReportResponse.model_validate(rep)
        if rep.case:
            res.case_id = rep.case.id
            res.case_number = rep.case.case_number
        res.evidence = [EvidenceUploadResponse.model_validate(e) for e in rep.evidence_list]
        result.append(res)
    return result

@router.get("/{report_id}", response_model=FraudReportResponse)
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rep = ReportService.get_report_by_id(db, report_id)
    if not rep or (rep.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=404, detail="Report not found")
    res = FraudReportResponse.model_validate(rep)
    if rep.case:
        res.case_id = rep.case.id
        res.case_number = rep.case.case_number
    res.evidence = [EvidenceUploadResponse.model_validate(e) for e in rep.evidence_list]
    return res

@router.post("/{report_id}/evidence", response_model=EvidenceUploadResponse)
async def upload_evidence(
    report_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rep = ReportService.get_report_by_id(db, report_id)
    if not rep or (rep.user_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=404, detail="Report not found")

    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP and PDF files are allowed")

    # Read content and save with random safe filename
    content = await file.read()
    if len(content) > 10 * 1024 * 1024: # 10MB limit
        raise HTTPException(status_code=400, detail="File size exceeds maximum 10MB limit")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    safe_filename = f"evidence_{uuid.uuid4().hex[:12]}.{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    case_id = rep.case.id if rep.case else None
    ev = CaseService.add_evidence(
        db=db,
        case_id=case_id,
        uploader=current_user,
        file_name=file.filename,
        file_url=f"/uploads/{safe_filename}",
        file_type=file.content_type,
        file_size=len(content),
        description=description
    )
    return EvidenceUploadResponse.model_validate(ev)
