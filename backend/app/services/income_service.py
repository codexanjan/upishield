from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.income import Income
from app.models.expense import Expense
from app.schemas.income import IncomeCreate, IncomeUpdate, FinancialSummaryResponse

class IncomeService:
    @staticmethod
    def create_income(db: Session, user_id: int, data: IncomeCreate) -> Income:
        inc = Income(
            user_id=user_id,
            amount=data.amount,
            source=data.source,
            income_type=data.income_type,
            date=data.date or datetime.now(timezone.utc),
            description=data.description
        )
        db.add(inc)
        db.commit()
        db.refresh(inc)
        return inc

    @staticmethod
    def get_incomes(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Income]:
        return db.query(Income).filter(Income.user_id == user_id).order_by(Income.date.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_income_by_id(db: Session, income_id: int, user_id: int) -> Optional[Income]:
        return db.query(Income).filter(Income.id == income_id, Income.user_id == user_id).first()

    @staticmethod
    def update_income(db: Session, income_id: int, user_id: int, data: IncomeUpdate) -> Optional[Income]:
        inc = IncomeService.get_income_by_id(db, income_id, user_id)
        if not inc:
            return None
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(inc, key, val)
        db.commit()
        db.refresh(inc)
        return inc

    @staticmethod
    def delete_income(db: Session, income_id: int, user_id: int) -> bool:
        inc = IncomeService.get_income_by_id(db, income_id, user_id)
        if not inc:
            return False
        db.delete(inc)
        db.commit()
        return True

    @staticmethod
    def get_financial_summary(db: Session, user_id: int) -> FinancialSummaryResponse:
        incomes = db.query(Income).filter(Income.user_id == user_id).all()
        expenses = db.query(Expense).filter(Expense.user_id == user_id).all()

        total_income = sum(i.amount for i in incomes)
        total_expenses = sum(e.amount for e in expenses)
        net_balance = total_income - total_expenses
        savings = max(0.0, net_balance)
        savings_pct = (savings / total_income * 100.0) if total_income > 0 else 0.0

        return FinancialSummaryResponse(
            total_income=round(total_income, 2),
            total_expenses=round(total_expenses, 2),
            net_balance=round(net_balance, 2),
            savings=round(savings, 2),
            savings_percentage=round(savings_pct, 1)
        )
