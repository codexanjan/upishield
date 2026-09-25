from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel, Field

class ExpenseBase(BaseModel):
    amount: float = Field(..., gt=0)
    category: str # Food, Groceries, Transport, Shopping, Entertainment, Bills, Rent, Education, Healthcare, Travel, Fuel, Subscriptions, EMI, Insurance, Personal, Other
    merchant: str
    payment_method: str = "UPI" # UPI, Card, Cash, Bank Transfer, Other
    date: Optional[datetime] = None
    description: Optional[str] = None
    receipt_url: Optional[str] = None
    recurring: Optional[bool] = False

class ExpenseCreate(ExpenseBase):
    transaction_id: Optional[int] = None

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    merchant: Optional[str] = None
    payment_method: Optional[str] = None
    date: Optional[datetime] = None
    description: Optional[str] = None
    receipt_url: Optional[str] = None
    recurring: Optional[bool] = None

class ExpenseResponse(ExpenseBase):
    id: int
    user_id: int
    transaction_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class ExpenseSummaryResponse(BaseModel):
    total_expenses: float
    monthly_budget: float
    remaining_budget: float
    today_spend: float
    avg_daily_expense: float
    highest_category: Optional[str]
    category_distribution: Dict[str, float]
    monthly_trend: List[Dict[str, float]]
    payment_method_distribution: Dict[str, float]
