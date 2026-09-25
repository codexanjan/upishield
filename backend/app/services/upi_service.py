import re
import urllib.parse
import io
import base64
import qrcode
from typing import Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.models.fraud_report import ReportedUPI
from app.models.transaction import PaymentAttempt, Transaction, UPITransaction
from app.services.fraud_rule_service import FraudRuleEngine

UPI_PATTERN = re.compile(r"^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$")

class UPIService:
    @staticmethod
    def validate_upi_id(db: Session, upi_id: str) -> Dict[str, Any]:
        cleaned_upi = upi_id.strip().lower()
        is_valid_format = bool(UPI_PATTERN.match(cleaned_upi))
        
        rep_record = db.query(ReportedUPI).filter(ReportedUPI.upi_id == cleaned_upi).first()
        is_reported = bool(rep_record and rep_record.report_count > 0)
        report_count = rep_record.report_count if rep_record else 0
        verified_count = rep_record.verified_count if rep_record else 0

        if verified_count > 0:
            status_label = "Frequently Reported"
            message = f"Warning: {cleaned_upi} has {verified_count} verified fraud report(s) on platform."
        elif report_count > 0:
            status_label = "Under Review"
            message = f"Notice: {cleaned_upi} has {report_count} user report(s) currently under review."
        elif not is_valid_format:
            status_label = "Invalid Format"
            message = "The UPI ID does not match standard UPI formatting (e.g. username@bank)."
        else:
            status_label = "Normal"
            message = "UPI ID format is valid and has no active platform fraud reports."

        return {
            "upi_id": cleaned_upi,
            "is_valid_format": is_valid_format,
            "is_reported": is_reported,
            "report_count": report_count,
            "verified_report_count": verified_count,
            "status_label": status_label,
            "message": message
        }

    @staticmethod
    def generate_upi_uri(receiver_upi: str, receiver_name: str, amount: float, note: str = "Payment") -> str:
        pa = receiver_upi.strip()
        pn = urllib.parse.quote(receiver_name.strip())
        am = f"{amount:.2f}"
        tn = urllib.parse.quote(note.strip())
        return f"upi://pay?pa={pa}&pn={pn}&am={am}&cu=INR&tn={tn}"

    @staticmethod
    def generate_qr_base64(upi_uri: str) -> str:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(upi_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{img_str}"

    @staticmethod
    def parse_qr_data(db: Session, qr_text: str) -> Dict[str, Any]:
        text = qr_text.strip()
        if not text.startswith("upi://pay"):
            return {
                "is_upi": False,
                "raw_data": text,
                "warning_message": "QR does not contain a standard UPI payment URI (upi://pay)."
            }

        try:
            parsed = urllib.parse.urlparse(text)
            query_params = urllib.parse.parse_qs(parsed.query)

            receiver_upi = query_params.get("pa", [None])[0]
            receiver_name = query_params.get("pn", [None])[0]
            amount_str = query_params.get("am", [None])[0]
            note = query_params.get("tn", [None])[0]

            amount = float(amount_str) if amount_str else None

            # Check if reported
            rep_check = UPIService.validate_upi_id(db, receiver_upi) if receiver_upi else None
            is_reported = rep_check["is_reported"] if rep_check else False
            warning = rep_check["message"] if (rep_check and is_reported) else None

            return {
                "is_upi": True,
                "receiver_upi": receiver_upi,
                "receiver_name": receiver_name,
                "amount": amount,
                "note": note,
                "raw_data": text,
                "is_reported": is_reported,
                "warning_message": warning
            }
        except Exception as e:
            return {
                "is_upi": False,
                "raw_data": text,
                "warning_message": f"Failed to parse UPI QR data: {str(e)}"
            }

    @staticmethod
    def create_payment_attempt(
        db: Session,
        user_id: int,
        receiver_upi: str,
        receiver_name: str,
        amount: float,
        note: str = "Payment"
    ) -> PaymentAttempt:
        upi_uri = UPIService.generate_upi_uri(receiver_upi, receiver_name, amount, note)
        attempt = PaymentAttempt(
            user_id=user_id,
            receiver_upi=receiver_upi.strip(),
            receiver_name=receiver_name.strip(),
            amount=amount,
            note=note.strip(),
            upi_uri=upi_uri,
            status="Created"
        )
        db.add(attempt)
        db.commit()
        db.refresh(attempt)
        return attempt
