from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.expense import Expense
from app.models.budget import Budget
from app.schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseSummaryResponse

class ExpenseService:
    @staticmethod
    def create_expense(db: Session, user_id: int, data: ExpenseCreate) -> Expense:
        expense = Expense(
            user_id=user_id,
            transaction_id=data.transaction_id,
            amount=data.amount,
            category=data.category,
            merchant=data.merchant,
            payment_method=data.payment_method,
            date=data.date or datetime.now(timezone.utc),
            description=data.description,
            receipt_url=data.receipt_url,
            recurring=data.recurring or False
        )
        db.add(expense)
        db.commit()
        db.refresh(expense)
        return expense

    @staticmethod
    def get_expenses(
        db: Session,
        user_id: int,
        category: Optional[str] = None,
        payment_method: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[Expense]:
        q = db.query(Expense).filter(Expense.user_id == user_id)
        if category:
            q = q.filter(Expense.category == category)
        if payment_method:
            q = q.filter(Expense.payment_method == payment_method)
        if search:
            s = f"%{search.strip()}%"
            q = q.filter((Expense.merchant.ilike(s)) | (Expense.description.ilike(s)))
        return q.order_by(Expense.date.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_expense_by_id(db: Session, expense_id: int, user_id: int) -> Optional[Expense]:
        return db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user_id).first()

    @staticmethod
    def update_expense(db: Session, expense_id: int, user_id: int, data: ExpenseUpdate) -> Optional[Expense]:
        exp = ExpenseService.get_expense_by_id(db, expense_id, user_id)
        if not exp:
            return None
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(exp, key, val)
        db.commit()
        db.refresh(exp)
        return exp

    @staticmethod
    def delete_expense(db: Session, expense_id: int, user_id: int) -> bool:
        exp = ExpenseService.get_expense_by_id(db, expense_id, user_id)
        if not exp:
            return False
        db.delete(exp)
        db.commit()
        return True

    @staticmethod
    def get_summary(db: Session, user_id: int) -> ExpenseSummaryResponse:
        now = datetime.now(timezone.utc)
        start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        start_of_today = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

        # All expenses for user
        all_expenses = db.query(Expense).filter(Expense.user_id == user_id).all()
        total_expenses = sum(e.amount for e in all_expenses)

        # Current month expenses
        month_expenses = [e for e in all_expenses if e.date.replace(tzinfo=timezone.utc) >= start_of_month]
        month_spend = sum(e.amount for e in month_expenses)

        # Today spend
        today_spend = sum(e.amount for e in all_expenses if e.date.replace(tzinfo=timezone.utc) >= start_of_today)

        # Days in month elapsed
        days_elapsed = max(1, now.day)
        avg_daily = month_spend / days_elapsed

        # Category distribution
        cat_dist: Dict[str, float] = {}
        pay_dist: Dict[str, float] = {}
        for e in all_expenses:
            cat_dist[e.category] = cat_dist.get(e.category, 0.0) + e.amount
            pay_dist[e.payment_method] = pay_dist.get(e.payment_method, 0.0) + e.amount

        highest_cat = max(cat_dist.items(), key=lambda x: x[1])[0] if cat_dist else "None"

        # Monthly Budget from budgets table
        budgets = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.month == now.month,
            Budget.year == now.year
        ).all()
        monthly_budget = sum(b.limit_amount for b in budgets)
        if monthly_budget == 0:
            monthly_budget = 30000.0 # Default base threshold if none set

        remaining_budget = max(0.0, monthly_budget - month_spend)

        # Monthly Trend (last 6 months)
        monthly_trend = []
        for i in range(5, -1, -1):
            m_target = (now.month - i - 1) % 12 + 1
            y_target = now.year if (now.month - i > 0) else (now.year - 1)
            m_name = datetime(y_target, m_target, 1).strftime("%b")
            m_total = sum(e.amount for e in all_expenses if e.date.month == m_target and e.date.year == y_target)
            monthly_trend.append({"month": m_name, "amount": round(m_total, 2)})

        return ExpenseSummaryResponse(
            total_expenses=round(total_expenses, 2),
            monthly_budget=round(monthly_budget, 2),
            remaining_budget=round(remaining_budget, 2),
            today_spend=round(today_spend, 2),
            avg_daily_expense=round(avg_daily, 2),
            highest_category=highest_cat,
            category_distribution={k: round(v, 2) for k, v in cat_dist.items()},
            monthly_trend=monthly_trend,
            payment_method_distribution={k: round(v, 2) for k, v in pay_dist.items()}
        )
