from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.models.user import User
from app.models.transaction import PaymentAttempt
from app.schemas.upi import (
    UPIValidateRequest,
    UPIValidateResponse,
    UPICreateIntentRequest,
    UPICreateIntentResponse,
    UPIPaymentAttemptCreate,
    UPIPaymentAttemptResponse,
    UPIParseQRRequest,
    UPIParseQRResponse,
    UPIGenerateQRRequest,
    UPIGenerateQRResponse,
)
from app.schemas.transaction import TransactionCreate
from app.services.upi_service import UPIService
from app.services.fraud_rule_service import FraudRuleEngine
from app.services.transaction_service import TransactionService

router = APIRouter(prefix="/upi", tags=["upi"])

@router.post("/validate", response_model=UPIValidateResponse)
def validate_upi(data: UPIValidateRequest, db: Session = Depends(get_db)):
    res = UPIService.validate_upi_id(db, data.upi_id)
    return UPIValidateResponse(**res)

@router.post("/create-intent", response_model=UPICreateIntentResponse)
def create_intent(
    data: UPICreateIntentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    val = UPIService.validate_upi_id(db, data.receiver_upi)
    if not val["is_valid_format"]:
        raise HTTPException(status_code=400, detail="Invalid UPI ID format")

    upi_uri = UPIService.generate_upi_uri(
        receiver_upi=data.receiver_upi,
        receiver_name=data.receiver_name or "Merchant",
        amount=data.amount,
        note=data.note or "Payment"
    )
    qr_data_url = UPIService.generate_qr_base64(upi_uri)

    # Evaluate deterministic risk
    flag_status, flag_reasons = FraudRuleEngine.evaluate_upi_transaction(
        db=db,
        user_id=current_user.id,
        amount=data.amount,
        receiver_upi=data.receiver_upi
    )

    return UPICreateIntentResponse(
        upi_uri=upi_uri,
        qr_data_url=qr_data_url,
        receiver_upi=data.receiver_upi,
        receiver_name=data.receiver_name or "Merchant",
        amount=data.amount,
        note=data.note or "Payment",
        risk_assessment={
            "flag_status": flag_status,
            "flag_reasons": flag_reasons,
            "is_reported": val["is_reported"],
            "report_count": val["report_count"]
        }
    )

@router.post("/parse-qr", response_model=UPIParseQRResponse)
def parse_qr(data: UPIParseQRRequest, db: Session = Depends(get_db)):
    res = UPIService.parse_qr_data(db, data.qr_data)
    return UPIParseQRResponse(**res)

@router.post("/generate-qr", response_model=UPIGenerateQRResponse)
def generate_qr(data: UPIGenerateQRRequest):
    val_check = UPIService.generate_upi_uri(
        receiver_upi=data.upi_id,
        receiver_name=data.name or "User",
        amount=data.amount or 0.0,
        note=data.note or "Payment"
    )
    qr_base64 = UPIService.generate_qr_base64(val_check)
    return UPIGenerateQRResponse(
        upi_uri=val_check,
        qr_base64=qr_base64,
        receiver_upi=data.upi_id,
        name=data.name,
        amount=data.amount
    )

@router.post("/payment-attempt", response_model=UPIPaymentAttemptResponse)
def create_payment_attempt(
    data: UPIPaymentAttemptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempt = UPIService.create_payment_attempt(
        db=db,
        user_id=current_user.id,
        receiver_upi=data.receiver_upi,
        receiver_name=data.receiver_name or "Merchant",
        amount=data.amount,
        note=data.note or "Payment"
    )
    return attempt

@router.get("/payment-attempt/{attempt_id}", response_model=UPIPaymentAttemptResponse)
def get_payment_attempt(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempt = db.query(PaymentAttempt).filter(
        PaymentAttempt.id == attempt_id,
        PaymentAttempt.user_id == current_user.id
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Payment attempt not found")
    return attempt

@router.patch("/payment-attempt/{attempt_id}/status")
def update_payment_attempt_status(
    attempt_id: int,
    status_update: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempt = db.query(PaymentAttempt).filter(
        PaymentAttempt.id == attempt_id,
        PaymentAttempt.user_id == current_user.id
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Payment attempt not found")

    new_status = status_update.get("status", attempt.status)
    attempt.status = new_status
    db.commit()

    # If completed in demo mode or confirmation, automatically record transaction
    if new_status == "Completed":
        txn_create = TransactionCreate(
            transaction_type="UPI",
            amount=attempt.amount,
            currency="INR",
            merchant=attempt.receiver_name,
            payment_method="UPI",
            receiver_upi=attempt.receiver_upi,
            receiver_name=attempt.receiver_name,
            upi_note=attempt.note,
            status="Completed"
        )
        txn = TransactionService.create_transaction(db, current_user.id, txn_create)
        return {"status": new_status, "transaction_reference": txn.transaction_reference}

    return {"status": new_status}
