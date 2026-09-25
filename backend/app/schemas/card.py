from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class CardCreate(BaseModel):
    card_nickname: str
    bank_name: str
    card_network: str # Visa, Mastercard, RuPay, Amex
    card_number: str = Field(..., min_length=12, max_length=19) # Full number sent ONLY for masking, never stored
    expiry_month: Optional[int] = Field(None, ge=1, le=12)
    expiry_year: Optional[int] = Field(None, ge=2024, le=2050)

class CardResponse(BaseModel):
    id: int
    card_nickname: str
    bank_name: str
    card_network: str
    masked_number: str
    last_four: str
    expiry_month: Optional[int]
    expiry_year: Optional[int]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CardTransactionManualCreate(BaseModel):
    card_id: int
    amount: float = Field(..., gt=0)
    merchant: str
    category: Optional[str] = "Shopping"
    channel: str = "Online" # POS, Contactless, Online, ATM, Recurring, Other
    country: Optional[str] = "India"
    transaction_date: Optional[datetime] = None

class CardVerificationUpdate(BaseModel):
    verification_status: str # Safe, Suspicious, Disputed
