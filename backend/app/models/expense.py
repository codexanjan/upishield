from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    amount = Column(Float, nullable=False)
    category = Column(String(50), nullable=False) # Food, Groceries, Transport, Shopping, Entertainment, Bills, Rent, Education, Healthcare, Travel, Fuel, Subscriptions, EMI, Insurance, Personal, Other
    merchant = Column(String(150), nullable=False)
    payment_method = Column(String(50), nullable=False) # UPI, Card, Cash, Bank Transfer, Other
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    description = Column(Text, nullable=True)
    receipt_url = Column(String(255), nullable=True)
    recurring = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="expenses")
    transaction = relationship("Transaction", back_populates="expense")
