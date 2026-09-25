from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(50), nullable=False) # Food, Shopping, Travel, Entertainment, etc. or 'Overall'
    limit_amount = Column(Float, nullable=False)
    month = Column(Integer, nullable=False) # 1 - 12
    year = Column(Integer, nullable=False) # e.g. 2026
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="budgets")
