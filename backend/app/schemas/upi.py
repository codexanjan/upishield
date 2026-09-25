from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class UPIValidateRequest(BaseModel):
    upi_id: str

class UPIValidateResponse(BaseModel):
    upi_id: str
    is_valid_format: bool
    is_reported: bool
    report_count: int = 0
    verified_report_count: int = 0
    status_label: str # Normal, Under Review, Frequently Reported
    message: str

class UPICreateIntentRequest(BaseModel):
    receiver_upi: str
    receiver_name: Optional[str] = "Merchant"
    amount: float = Field(..., gt=0)
    note: Optional[str] = "Payment"

class UPICreateIntentResponse(BaseModel):
    upi_uri: str
    qr_data_url: Optional[str] = None
    receiver_upi: str
    receiver_name: str
    amount: float
    note: str
    risk_assessment: dict

class UPIPaymentAttemptCreate(BaseModel):
    receiver_upi: str
    receiver_name: Optional[str] = "Merchant"
    amount: float = Field(..., gt=0)
    note: Optional[str] = "Payment"

class UPIPaymentAttemptResponse(BaseModel):
    id: int
    receiver_upi: str
    receiver_name: str
    amount: float
    note: Optional[str]
    upi_uri: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class UPIParseQRRequest(BaseModel):
    qr_data: str

class UPIParseQRResponse(BaseModel):
    is_upi: bool
    receiver_upi: Optional[str] = None
    receiver_name: Optional[str] = None
    amount: Optional[float] = None
    note: Optional[str] = None
    raw_data: str
    is_reported: bool = False
    warning_message: Optional[str] = None

class UPIGenerateQRRequest(BaseModel):
    upi_id: str
    name: Optional[str] = None
    amount: Optional[float] = None
    note: Optional[str] = None

class UPIGenerateQRResponse(BaseModel):
    upi_uri: str
    qr_base64: str
    receiver_upi: str
    name: Optional[str]
    amount: Optional[float]
