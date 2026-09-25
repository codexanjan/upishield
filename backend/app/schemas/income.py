from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class IncomeBase(BaseModel):
    amount: float = Field(..., gt=0)
    source: str
    income_type: str = "Salary" # Salary, Freelance, Business, Refund, Interest, Investment, Other
    date: Optional[datetime] = None
    description: Optional[str] = None

class IncomeCreate(IncomeBase):
    pass

class IncomeUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    source: Optional[str] = None
    income_type: Optional[str] = None
    date: Optional[datetime] = None
    description: Optional[str] = None

class IncomeResponse(IncomeBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class FinancialSummaryResponse(BaseModel):
    total_income: float
    total_expenses: float
    net_balance: float
    savings: float
    savings_percentage: float
