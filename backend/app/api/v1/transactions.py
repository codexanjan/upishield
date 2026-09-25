from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.post("", response_model=TransactionResponse)
def create_transaction(
    data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    txn = TransactionService.create_transaction(db, current_user.id, data)
    res = TransactionResponse.model_validate(txn)
    res.has_report = bool(txn.fraud_report)
    return res

@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    search: Optional[str] = None,
    tx_type: Optional[str] = None,
    payment_method: Optional[str] = None,
    status: Optional[str] = None,
    flag_status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    txns = TransactionService.get_user_transactions(
        db=db,
        user_id=current_user.id,
        search=search,
        tx_type=tx_type,
        payment_method=payment_method,
        status=status,
        flag_status=flag_status,
        limit=limit,
        skip=skip
    )
    result = []
    for t in txns:
        r = TransactionResponse.model_validate(t)
        r.has_report = bool(t.fraud_report)
        result.append(r)
    return result

@router.get("/{txn_id}", response_model=TransactionResponse)
def get_transaction(
    txn_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id, Transaction.user_id == current_user.id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    r = TransactionResponse.model_validate(txn)
    r.has_report = bool(txn.fraud_report)
    return r
