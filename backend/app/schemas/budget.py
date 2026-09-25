from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class BudgetBase(BaseModel):
    category: str
    limit_amount: float = Field(..., gt=0)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020, le=2050)

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    limit_amount: float = Field(..., gt=0)

class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class BudgetStatusItem(BaseModel):
    id: int
    category: str
    limit_amount: float
    spent_amount: float
    percentage: float
    status_color: str # green, amber, orange, red
    month: int
    year: int

class BudgetStatusResponse(BaseModel):
    total_budget: float
    total_spent: float
    overall_percentage: float
    budgets: List[BudgetStatusItem]
