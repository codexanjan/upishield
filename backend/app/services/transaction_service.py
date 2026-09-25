import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.transaction import Transaction, UPITransaction, PaymentAttempt
from app.models.card import Card, CardTransaction
from app.models.expense import Expense
from app.schemas.transaction import TransactionCreate
from app.services.fraud_rule_service import FraudRuleEngine
from app.services.notification_service import NotificationService

class TransactionService:
    @staticmethod
    def create_transaction(db: Session, user_id: int, data: TransactionCreate) -> Transaction:
        # Generate clean transaction reference
        ref = f"TXN-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        txn_time = data.transaction_date or datetime.now(timezone.utc)

        flag_status = "Normal"
        flag_reasons = []

        # 1. UPI Transaction Evaluation
        if data.transaction_type == "UPI" and data.receiver_upi:
            flag_status, flag_reasons = FraudRuleEngine.evaluate_upi_transaction(
                db=db,
                user_id=user_id,
                amount=data.amount,
                receiver_upi=data.receiver_upi,
                transaction_time=txn_time
            )
        # 2. Card Transaction Evaluation
        elif data.transaction_type == "Card":
            merchant_name = data.merchant or "Merchant"
            country = data.country or "India"
            flag_status, flag_reasons = FraudRuleEngine.evaluate_card_transaction(
                db=db,
                user_id=user_id,
                amount=data.amount,
                merchant=merchant_name,
                country=country,
                transaction_time=txn_time
            )

        txn = Transaction(
            user_id=user_id,
            transaction_reference=ref,
            transaction_type=data.transaction_type,
            amount=data.amount,
            currency=data.currency,
            merchant=data.merchant or (data.receiver_name if data.transaction_type == "UPI" else "Merchant"),
            payment_method=data.payment_method,
            transaction_date=txn_time,
            status=data.status or "Completed",
            flag_status=flag_status,
            flag_reasons=flag_reasons
        )
        db.add(txn)
        db.flush()

        # Add UPI details if UPI
        if data.transaction_type == "UPI" and data.receiver_upi:
            upi_record = UPITransaction(
                transaction_id=txn.id,
                sender_upi=data.sender_upi or "user@upishield",
                receiver_upi=data.receiver_upi,
                receiver_name=data.receiver_name or "Merchant",
                note=data.upi_note or "Payment",
                upi_reference=f"UPI-{uuid.uuid4().hex[:12].upper()}"
            )
            db.add(upi_record)

        # Add Card details if Card
        if data.transaction_type == "Card":
            card_record = CardTransaction(
                transaction_id=txn.id,
                card_id=data.card_id,
                masked_card=data.masked_card or "**** **** **** 0000",
                merchant=data.merchant or "Merchant",
                category=data.category or "Shopping",
                channel=data.card_channel or "Online",
                country=data.country or "India",
                flag_status=flag_status,
                flag_reasons=flag_reasons,
                user_verification="Safe"
            )
            db.add(card_record)

        # Automatically create matching expense entry for financial tracking
        expense = Expense(
            user_id=user_id,
            transaction_id=txn.id,
            amount=data.amount,
            category=data.category or ("Shopping" if data.transaction_type == "Card" else "Personal"),
            merchant=data.merchant or (data.receiver_name if data.transaction_type == "UPI" else "Direct Payment"),
            payment_method=data.payment_method,
            date=txn_time,
            description=f"Auto-logged from {data.transaction_type} payment: {ref}",
            recurring=False
        )
        db.add(expense)

        db.commit()
        db.refresh(txn)

        # If flagged as Suspicious or Review, create notification for user
        if flag_status in ["Suspicious", "Review"]:
            NotificationService.create_user_notification(
                db=db,
                user_id=user_id,
                title=f"Transaction Flagged: {flag_status}",
                message=f"Transaction of ₹{data.amount:,.2f} to {txn.merchant} has rule alerts: {'; '.join(flag_reasons[:2])}",
                notification_type="transaction_flagged",
                reference_id=ref
            )

        return txn

    @staticmethod
    def get_user_transactions(
        db: Session,
        user_id: int,
        search: Optional[str] = None,
        tx_type: Optional[str] = None,
        payment_method: Optional[str] = None,
        status: Optional[str] = None,
        flag_status: Optional[str] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[Transaction]:
        q = db.query(Transaction).filter(Transaction.user_id == user_id)
        if search:
            s = f"%{search.strip()}%"
            q = q.filter((Transaction.merchant.ilike(s)) | (Transaction.transaction_reference.ilike(s)))
        if tx_type:
            q = q.filter(Transaction.transaction_type == tx_type)
        if payment_method:
            q = q.filter(Transaction.payment_method == payment_method)
        if status:
            q = q.filter(Transaction.status == status)
        if flag_status:
            q = q.filter(Transaction.flag_status == flag_status)
        return q.order_by(Transaction.transaction_date.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_all_transactions(
        db: Session,
        search: Optional[str] = None,
        tx_type: Optional[str] = None,
        status: Optional[str] = None,
        flag_status: Optional[str] = None,
        limit: int = 100,
        skip: int = 0
    ) -> List[Transaction]:
        q = db.query(Transaction)
        if search:
            s = f"%{search.strip()}%"
            q = q.filter((Transaction.merchant.ilike(s)) | (Transaction.transaction_reference.ilike(s)))
        if tx_type:
            q = q.filter(Transaction.transaction_type == tx_type)
        if status:
            q = q.filter(Transaction.status == status)
        if flag_status:
            q = q.filter(Transaction.flag_status == flag_status)
        return q.order_by(Transaction.transaction_date.desc()).offset(skip).limit(limit).all()
