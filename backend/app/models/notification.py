from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.core.database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_type = Column(String(20), default="user", nullable=False) # user, admin
    recipient_id = Column(Integer, nullable=True) # user_id or None for broadcast
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)
    # Types: report_submitted, case_created, admin_message, evidence_requested, status_changed, budget_warning, transaction_flagged, payment_updated, critical_alert
    reference_id = Column(String(100), nullable=True) # e.g. case_number or transaction_reference
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
