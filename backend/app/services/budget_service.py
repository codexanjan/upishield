from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.budget import Budget
from app.models.expense import Expense
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetStatusResponse, BudgetStatusItem
from app.services.notification_service import NotificationService

class BudgetService:
    @staticmethod
    def set_budget(db: Session, user_id: int, data: BudgetCreate) -> Budget:
        # Check if already exists for this category/month/year
        existing = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.category == data.category,
            Budget.month == data.month,
            Budget.year == data.year
        ).first()

        if existing:
            existing.limit_amount = data.limit_amount
            db.commit()
            db.refresh(existing)
            return existing

        b = Budget(
            user_id=user_id,
            category=data.category,
            limit_amount=data.limit_amount,
            month=data.month,
            year=data.year
        )
        db.add(b)
        db.commit()
        db.refresh(b)
        return b

    @staticmethod
    def get_budgets(db: Session, user_id: int, month: Optional[int] = None, year: Optional[int] = None) -> List[Budget]:
        now = datetime.now(timezone.utc)
        m = month or now.month
        y = year or now.year
        return db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.month == m,
            Budget.year == y
        ).all()

    @staticmethod
    def delete_budget(db: Session, budget_id: int, user_id: int) -> bool:
        b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()
        if not b:
            return False
        db.delete(b)
        db.commit()
        return True

    @staticmethod
    def get_budget_status(db: Session, user_id: int, month: Optional[int] = None, year: Optional[int] = None) -> BudgetStatusResponse:
        now = datetime.now(timezone.utc)
        m = month or now.month
        y = year or now.year

        budgets = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.month == m,
            Budget.year == y
        ).all()

        start_date = datetime(y, m, 1, tzinfo=timezone.utc)
        end_date = datetime(y + 1 if m == 12 else y, 1 if m == 12 else m + 1, 1, tzinfo=timezone.utc)

        expenses = db.query(Expense).filter(
            Expense.user_id == user_id,
            Expense.date >= start_date,
            Expense.date < end_date
        ).all()

        # Spent by category
        spent_map = {}
        for e in expenses:
            spent_map[e.category] = spent_map.get(e.category, 0.0) + e.amount

        items = []
        total_budget = 0.0
        total_spent = sum(expenses[i].amount for i in range(len(expenses)))

        for b in budgets:
            total_budget += b.limit_amount
            spent = spent_map.get(b.category, 0.0)
            pct = (spent / b.limit_amount * 100.0) if b.limit_amount > 0 else 0.0

            if pct <= 60.0:
                color = "green"
            elif pct <= 85.0:
                color = "amber"
            elif pct <= 100.0:
                color = "orange"
            else:
                color = "red"

            items.append(BudgetStatusItem(
                id=b.id,
                category=b.category,
                limit_amount=round(b.limit_amount, 2),
                spent_amount=round(spent, 2),
                percentage=round(pct, 1),
                status_color=color,
                month=b.month,
                year=b.year
            ))

        overall_pct = (total_spent / total_budget * 100.0) if total_budget > 0 else 0.0

        return BudgetStatusResponse(
            total_budget=round(total_budget, 2),
            total_spent=round(total_spent, 2),
            overall_percentage=round(overall_pct, 1),
            budgets=items
        )
