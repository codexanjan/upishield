from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class FraudReport(Base):
    __tablename__ = "fraud_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_number = Column(String(50), unique=True, index=True, nullable=False) # e.g. REP-2026-0001
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    fraud_category = Column(String(100), nullable=False) # UPI Scam, QR Scam, Collect Request Scam, Fake Refund, etc.
    amount = Column(Float, nullable=False)
    upi_id = Column(String(150), nullable=True)
    merchant = Column(String(150), nullable=True)
    phone = Column(String(30), nullable=True)
    url = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="Submitted", nullable=False) # Submitted, Pending Review, Under Review, Resolved, Rejected
    verification_status = Column(String(50), default="Unverified", nullable=False) # Unverified, Verified, Rejected, Duplicate
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="reports")
    transaction = relationship("Transaction", back_populates="fraud_report")
    case = relationship("FraudCase", uselist=False, back_populates="report", cascade="all, delete-orphan")
    evidence_list = relationship("CaseEvidence", back_populates="report", cascade="all, delete-orphan")

class ReportedUPI(Base):
    __tablename__ = "reported_upi_ids"

    id = Column(Integer, primary_key=True, index=True)
    upi_id = Column(String(150), unique=True, index=True, nullable=False)
    report_count = Column(Integer, default=1, nullable=False)
    verified_count = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="Under Review", nullable=False) # Normal, Under Review, Frequently Reported
    last_reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class ReportedMerchant(Base):
    __tablename__ = "reported_merchants"

    id = Column(Integer, primary_key=True, index=True)
    merchant_name = Column(String(150), unique=True, index=True, nullable=False)
    report_count = Column(Integer, default=1, nullable=False)
    verified_count = Column(Integer, default=0, nullable=False)
    categories = Column(JSON, default=list)
    status = Column(String(50), default="Under Review", nullable=False) # Normal, Under Review, Frequently Reported
    last_reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
