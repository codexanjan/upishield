from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.schemas.income import IncomeCreate, IncomeUpdate, IncomeResponse, FinancialSummaryResponse
from app.services.income_service import IncomeService

router = APIRouter(prefix="/income", tags=["income"])

@router.post("", response_model=IncomeResponse)
def create_income(data: IncomeCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return IncomeService.create_income(db, current_user.id, data)

@router.get("", response_model=List[IncomeResponse])
def get_incomes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return IncomeService.get_incomes(db, current_user.id, skip=skip, limit=limit)

@router.get("/summary", response_model=FinancialSummaryResponse)
def get_financial_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return IncomeService.get_financial_summary(db, current_user.id)

@router.patch("/{income_id}", response_model=IncomeResponse)
def update_income(income_id: int, data: IncomeUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inc = IncomeService.update_income(db, income_id, current_user.id, data)
    if not inc:
        raise HTTPException(status_code=404, detail="Income record not found")
    return inc

@router.delete("/{income_id}")
def delete_income(income_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ok = IncomeService.delete_income(db, income_id, current_user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Income record not found")
    return {"message": "Income record deleted"}
