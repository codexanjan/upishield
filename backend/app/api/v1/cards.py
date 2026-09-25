from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.card import Card, CardTransaction
from app.schemas.card import CardCreate, CardResponse, CardTransactionManualCreate, CardVerificationUpdate
from app.schemas.transaction import TransactionResponse
from app.services.card_service import CardService

router = APIRouter(prefix="/cards", tags=["cards"])

@router.post("", response_model=CardResponse)
def add_card(data: CardCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    card = CardService.create_card(db, current_user.id, data)
    return card

@router.get("", response_model=List[CardResponse])
def get_cards(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return CardService.get_user_cards(db, current_user.id)

@router.post("/transactions", response_model=TransactionResponse)
def add_card_transaction(
    data: CardTransactionManualCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        txn = CardService.add_card_transaction(db, current_user.id, data)
        return txn
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/transactions/{card_txn_id}/verify")
def verify_card_transaction(
    card_txn_id: int,
    data: CardVerificationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    card_tx = db.query(CardTransaction).join(CardTransaction.transaction).filter(
        CardTransaction.id == card_txn_id,
        CardTransaction.transaction.has(user_id=current_user.id)
    ).first()
    if not card_tx:
        raise HTTPException(status_code=404, detail="Card transaction not found")

    card_tx.user_verification = data.verification_status
    if data.verification_status == "Disputed":
        card_tx.transaction.status = "Disputed"
    db.commit()
    return {"message": "Verification status updated", "user_verification": card_tx.user_verification}
