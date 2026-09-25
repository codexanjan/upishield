from typing import List, Optional
from datetime import datetime, timezone
import uuid
from sqlalchemy.orm import Session
from app.models.card import Card, CardTransaction
from app.models.transaction import Transaction
from app.schemas.card import CardCreate, CardTransactionManualCreate
from app.services.fraud_rule_service import FraudRuleEngine

class CardService:
    @staticmethod
    def create_card(db: Session, user_id: int, data: CardCreate) -> Card:
        # Strip spaces and mask
        raw_num = data.card_number.replace(" ", "").replace("-", "")
        last_four = raw_num[-4:]
        masked = f"**** **** **** {last_four}"

        card = Card(
            user_id=user_id,
            card_nickname=data.card_nickname.strip(),
            bank_name=data.bank_name.strip(),
            card_network=data.card_network.strip(),
            masked_number=masked,
            last_four=last_four,
            expiry_month=data.expiry_month,
            expiry_year=data.expiry_year,
            is_active=True
        )
        db.add(card)
        db.commit()
        db.refresh(card)
        return card

    @staticmethod
    def get_user_cards(db: Session, user_id: int) -> List[Card]:
        return db.query(Card).filter(Card.user_id == user_id, Card.is_active == True).all()

    @staticmethod
    def add_card_transaction(db: Session, user_id: int, data: CardTransactionManualCreate) -> Transaction:
        card = db.query(Card).filter(Card.id == data.card_id, Card.user_id == user_id).first()
        if not card:
            raise ValueError("Card not found")

        ref = f"CARD-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        tx_date = data.transaction_date or datetime.now(timezone.utc)

        # Deterministic fraud rules check
        flag_status, flag_reasons = FraudRuleEngine.evaluate_card_transaction(
            db=db,
            user_id=user_id,
            amount=data.amount,
            merchant=data.merchant,
            country=data.country or "India",
            transaction_time=tx_date
        )

        txn = Transaction(
            user_id=user_id,
            transaction_reference=ref,
            transaction_type="Card",
            amount=data.amount,
            currency="INR",
            merchant=data.merchant,
            payment_method=f"{card.card_network} (..{card.last_four})",
            transaction_date=tx_date,
            status="Completed",
            flag_status=flag_status,
            flag_reasons=flag_reasons
        )
        db.add(txn)
        db.flush()

        card_tx = CardTransaction(
            transaction_id=txn.id,
            card_id=card.id,
            masked_card=card.masked_number,
            merchant=data.merchant,
            category=data.category or "Shopping",
            channel=data.channel,
            country=data.country or "India",
            flag_status=flag_status,
            flag_reasons=flag_reasons,
            user_verification="Safe"
        )
        db.add(card_tx)
        db.commit()
        db.refresh(txn)
        return txn
