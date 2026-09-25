from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_reference = Column(String(100), unique=True, index=True, nullable=False)
    transaction_type = Column(String(50), nullable=False) # UPI, Card, Cash, Bank Transfer, Other
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    merchant = Column(String(150), nullable=True)
    payment_method = Column(String(50), nullable=False)
    transaction_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    status = Column(String(50), default="Completed", nullable=False) # Pending, Completed, Failed, Cancelled, Refunded, Disputed
    flag_status = Column(String(50), default="Normal", nullable=False) # Normal, Review, Suspicious
    flag_reasons = Column(JSON, default=list) # List of deterministic reasons
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="transactions")
    upi_details = relationship("UPITransaction", uselist=False, back_populates="transaction", cascade="all, delete-orphan")
    card_details = relationship("CardTransaction", uselist=False, back_populates="transaction", cascade="all, delete-orphan")
    expense = relationship("Expense", uselist=False, back_populates="transaction")
    fraud_report = relationship("FraudReport", uselist=False, back_populates="transaction")

class UPITransaction(Base):
    __tablename__ = "upi_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), unique=True, nullable=False)
    sender_upi = Column(String(150), nullable=True)
    receiver_upi = Column(String(150), index=True, nullable=False)
    receiver_name = Column(String(150), nullable=True)
    note = Column(String(255), nullable=True)
    upi_reference = Column(String(100), nullable=True)
    payment_attempt_id = Column(Integer, ForeignKey("payment_attempts.id"), nullable=True)

    transaction = relationship("Transaction", back_populates="upi_details")
    payment_attempt = relationship("PaymentAttempt", back_populates="upi_transaction")

class PaymentAttempt(Base):
    __tablename__ = "payment_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_upi = Column(String(150), nullable=False)
    receiver_name = Column(String(150), nullable=True)
    amount = Column(Float, nullable=False)
    note = Column(String(255), nullable=True)
    upi_uri = Column(Text, nullable=False)
    status = Column(String(50), default="Created", nullable=False) # Created, Initiated, Completed, Failed, Cancelled, Unknown
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    upi_transaction = relationship("UPITransaction", uselist=False, back_populates="payment_attempt")

class QRScan(Base):
    __tablename__ = "qr_scans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    raw_qr_data = Column(Text, nullable=False)
    parsed_upi = Column(String(150), nullable=True)
    parsed_name = Column(String(150), nullable=True)
    parsed_amount = Column(Float, nullable=True)
    status = Column(String(50), default="Valid", nullable=False) # Valid, Invalid
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
