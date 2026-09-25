from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, JSON
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, nullable=True)
    admin_email = Column(String(150), nullable=False)
    action = Column(String(100), nullable=False)
    # Actions: Admin Login, Admin Logout, Case Status Change, Case Assignment, User Disabled, User Enabled, Rule Changed, Report Verified, Report Rejected, Evidence Requested, Settings Changed
    target_type = Column(String(50), nullable=True) # User, Case, Report, Rule, Transaction
    target_id = Column(String(100), nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    details_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
