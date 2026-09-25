from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON
from app.core.database import Base

class FraudRule(Base):
    __tablename__ = "fraud_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    threshold_value = Column(Float, nullable=True)
    severity = Column(String(20), default="Medium", nullable=False) # Low, Medium, High, Critical
    config_json = Column(JSON, default=dict)
    updated_by = Column(String(100), default="System", nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
