from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    card_nickname = Column(String(100), nullable=False)
    bank_name = Column(String(100), nullable=False)
    card_network = Column(String(50), nullable=False) # Visa, Mastercard, RuPay, Amex
    masked_number = Column(String(30), nullable=False) # e.g. **** **** **** 4892
    last_four = Column(String(4), nullable=False)
    expiry_month = Column(Integer, nullable=True)
    expiry_year = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="cards")
    transactions = relationship("CardTransaction", back_populates="card", cascade="all, delete-orphan")

class CardTransaction(Base):
    __tablename__ = "card_transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), unique=True, nullable=False)
    card_id = Column(Integer, ForeignKey("cards.id"), nullable=True)
    masked_card = Column(String(30), nullable=False)
    merchant = Column(String(150), nullable=False)
    category = Column(String(50), nullable=True)
    channel = Column(String(50), nullable=False) # POS, Contactless, Online, ATM, Recurring, Other
    country = Column(String(50), default="India", nullable=False)
    flag_status = Column(String(50), default="Normal", nullable=False)
    flag_reasons = Column(JSON, default=list)
    user_verification = Column(String(50), default="Safe", nullable=False) # Safe, Suspicious, Disputed

    transaction = relationship("Transaction", back_populates="card_details")
    card = relationship("Card", back_populates="transactions")
