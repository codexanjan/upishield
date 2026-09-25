from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse, ExpenseSummaryResponse
from app.services.expense_service import ExpenseService

router = APIRouter(prefix="/expenses", tags=["expenses"])

@router.post("", response_model=ExpenseResponse)
def create_expense(
    data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ExpenseService.create_expense(db, current_user.id, data)

@router.get("", response_model=List[ExpenseResponse])
def get_expenses(
    category: Optional[str] = None,
    payment_method: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ExpenseService.get_expenses(
        db=db,
        user_id=current_user.id,
        category=category,
        payment_method=payment_method,
        search=search,
        limit=limit,
        skip=skip
    )

@router.get("/summary", response_model=ExpenseSummaryResponse)
def get_expense_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ExpenseService.get_summary(db, current_user.id)

@router.patch("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exp = ExpenseService.update_expense(db, expense_id, current_user.id, data)
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    return exp

@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ok = ExpenseService.delete_expense(db, expense_id, current_user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted"}
