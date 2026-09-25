from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class FlagResult(BaseModel):
    flag_status: str # Normal, Review, Suspicious
    flag_reasons: List[str]

class TransactionBase(BaseModel):
    transaction_type: str # UPI, Card, Cash, Bank Transfer, Other
    amount: float = Field(..., gt=0)
    currency: str = "INR"
    merchant: Optional[str] = None
    payment_method: str
    transaction_date: Optional[datetime] = None
    status: Optional[str] = "Completed"

class TransactionCreate(TransactionBase):
    # Optional UPI fields
    sender_upi: Optional[str] = None
    receiver_upi: Optional[str] = None
    receiver_name: Optional[str] = None
    upi_note: Optional[str] = None
    # Optional Card fields
    card_id: Optional[int] = None
    masked_card: Optional[str] = None
    card_channel: Optional[str] = None # POS, Online, Contactless, ATM
    country: Optional[str] = "India"
    category: Optional[str] = None

class UPITransactionResponse(BaseModel):
    id: int
    sender_upi: Optional[str]
    receiver_upi: str
    receiver_name: Optional[str]
    note: Optional[str]
    upi_reference: Optional[str]

    class Config:
        from_attributes = True

class CardTransactionResponse(BaseModel):
    id: int
    card_id: Optional[int]
    masked_card: str
    merchant: str
    category: Optional[str]
    channel: str
    country: str
    flag_status: str
    flag_reasons: List[str]
    user_verification: str

    class Config:
        from_attributes = True

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    transaction_reference: str
    transaction_type: str
    amount: float
    currency: str
    merchant: Optional[str]
    payment_method: str
    transaction_date: datetime
    status: str
    flag_status: str
    flag_reasons: List[str]
    created_at: datetime
    upi_details: Optional[UPITransactionResponse] = None
    card_details: Optional[CardTransactionResponse] = None
    has_report: Optional[bool] = False

    class Config:
        from_attributes = True
