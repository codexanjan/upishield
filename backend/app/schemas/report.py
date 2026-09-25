from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class FraudReportCreate(BaseModel):
    fraud_category: str
    amount: float = Field(..., gt=0)
    upi_id: Optional[str] = None
    merchant: Optional[str] = None
    phone: Optional[str] = None
    url: Optional[str] = None
    description: str = Field(..., min_length=10)
    transaction_id: Optional[int] = None

class EvidenceUploadResponse(BaseModel):
    id: int
    file_name: str
    file_url: str
    file_type: str
    file_size: Optional[int]
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class FraudReportResponse(BaseModel):
    id: int
    report_number: str
    user_id: int
    user_name: Optional[str] = None
    transaction_id: Optional[int] = None
    fraud_category: str
    amount: float
    upi_id: Optional[str] = None
    merchant: Optional[str] = None
    phone: Optional[str] = None
    url: Optional[str] = None
    description: str
    status: str
    verification_status: str
    created_at: datetime
    case_id: Optional[int] = None
    case_number: Optional[str] = None
    evidence: List[EvidenceUploadResponse] = []

    class Config:
        from_attributes = True

class ReportedUPIResponse(BaseModel):
    id: int
    upi_id: str
    report_count: int
    verified_count: int
    status: str
    last_reported_at: datetime

    class Config:
        from_attributes = True

class ReportedMerchantResponse(BaseModel):
    id: int
    merchant_name: str
    report_count: int
    verified_count: int
    categories: List[str]
    status: str
    last_reported_at: datetime

    class Config:
        from_attributes = True
