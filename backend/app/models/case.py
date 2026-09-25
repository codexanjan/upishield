from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, BigInteger
from sqlalchemy.orm import relationship
from app.core.database import Base

class FraudCase(Base):
    __tablename__ = "fraud_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, index=True, nullable=False) # CASE-2026-000001
    report_id = Column(Integer, ForeignKey("fraud_reports.id"), unique=True, nullable=False)
    assigned_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="Submitted", nullable=False)
    # Statuses: Submitted, Pending Review, Under Review, Waiting for User, Escalated, Resolved, Rejected, Closed
    priority = Column(String(30), default="Medium", nullable=False) # Low, Medium, High, Critical
    resolution = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    report = relationship("FraudReport", back_populates="case")
    assigned_admin = relationship("User", foreign_keys=[assigned_admin_id])
    messages = relationship("CaseMessage", back_populates="case", cascade="all, delete-orphan", order_by="CaseMessage.created_at")
    notes = relationship("CaseNote", back_populates="case", cascade="all, delete-orphan", order_by="CaseNote.created_at.desc()")
    evidence = relationship("CaseEvidence", back_populates="case", cascade="all, delete-orphan")
    status_history = relationship("CaseStatusHistory", back_populates="case", cascade="all, delete-orphan", order_by="CaseStatusHistory.created_at")

class CaseMessage(Base):
    __tablename__ = "case_messages"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("fraud_cases.id"), nullable=False)
    sender_type = Column(String(20), nullable=False) # user, admin
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    attachment_url = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("FraudCase", back_populates="messages")
    sender = relationship("User")

class CaseNote(Base):
    __tablename__ = "case_notes"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("fraud_cases.id"), nullable=False)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("FraudCase", back_populates="notes")
    admin = relationship("User")

class CaseEvidence(Base):
    __tablename__ = "case_evidence"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("fraud_cases.id"), nullable=True)
    report_id = Column(Integer, ForeignKey("fraud_reports.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=True)
    description = Column(String(255), nullable=True)
    uploaded_by_type = Column(String(20), default="user", nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("FraudCase", back_populates="evidence")
    report = relationship("FraudReport", back_populates="evidence_list")
    uploader = relationship("User")

class CaseStatusHistory(Base):
    __tablename__ = "case_status_history"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("fraud_cases.id"), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by_type = Column(String(20), default="admin", nullable=False)
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("FraudCase", back_populates="status_history")
    changer = relationship("User")
