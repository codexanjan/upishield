from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.report import EvidenceUploadResponse

class CaseMessageCreate(BaseModel):
    message: str = Field(..., min_length=1)
    attachment_url: Optional[str] = None

class CaseMessageResponse(BaseModel):
    id: int
    case_id: int
    sender_type: str # user, admin
    sender_id: int
    sender_name: Optional[str] = None
    message: str
    attachment_url: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CaseNoteCreate(BaseModel):
    note: str = Field(..., min_length=1)

class CaseNoteResponse(BaseModel):
    id: int
    case_id: int
    admin_id: int
    admin_name: Optional[str] = None
    note: str
    created_at: datetime

    class Config:
        from_attributes = True

class CaseStatusHistoryResponse(BaseModel):
    id: int
    case_id: int
    old_status: Optional[str]
    new_status: str
    changed_by_type: str
    changed_by_id: int
    changed_by_name: Optional[str] = None
    note: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class CaseStatusUpdate(BaseModel):
    status: str # Submitted, Pending Review, Under Review, Waiting for User, Escalated, Resolved, Rejected, Closed
    note: Optional[str] = None
    resolution: Optional[str] = None

class CasePriorityUpdate(BaseModel):
    priority: str # Low, Medium, High, Critical

class RequestEvidenceRequest(BaseModel):
    evidence_instructions: str

class FraudCaseResponse(BaseModel):
    id: int
    case_number: str
    report_id: int
    assigned_admin_id: Optional[int] = None
    assigned_admin_name: Optional[str] = None
    status: str
    priority: str
    resolution: Optional[str] = None
    internal_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Nested report details
    fraud_category: Optional[str] = None
    amount: Optional[float] = None
    upi_id: Optional[str] = None
    merchant: Optional[str] = None
    description: Optional[str] = None
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_mobile: Optional[str] = None
    transaction_id: Optional[int] = None
    transaction_reference: Optional[str] = None
    # Relations
    evidence: List[EvidenceUploadResponse] = []
    messages: List[CaseMessageResponse] = []
    notes: List[CaseNoteResponse] = []
    status_history: List[CaseStatusHistoryResponse] = []

    class Config:
        from_attributes = True
