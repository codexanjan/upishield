from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetStatusResponse
from app.services.budget_service import BudgetService

router = APIRouter(prefix="/budgets", tags=["budgets"])

@router.post("", response_model=BudgetResponse)
def set_budget(data: BudgetCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return BudgetService.set_budget(db, current_user.id, data)

@router.get("", response_model=List[BudgetResponse])
def get_budgets(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return BudgetService.get_budgets(db, current_user.id, month, year)

@router.get("/status", response_model=BudgetStatusResponse)
def get_budget_status(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return BudgetService.get_budget_status(db, current_user.id, month, year)

@router.delete("/{budget_id}")
def delete_budget(budget_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ok = BudgetService.delete_budget(db, budget_id, current_user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Budget deleted"}
