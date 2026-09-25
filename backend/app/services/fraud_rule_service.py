from datetime import datetime, timezone, timedelta
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.rule import FraudRule
from app.models.transaction import Transaction
from app.models.fraud_report import ReportedUPI, ReportedMerchant

class FraudRuleEngine:
    """
    Deterministic rule-based fraud detection engine.
    Strictly NO AI / NO Machine Learning models.
    Evaluates rule conditions based on admin-configured thresholds,
    transaction velocity, reported entity history, and off-hour patterns.
    """

    @staticmethod
    def evaluate_upi_transaction(
        db: Session,
        user_id: int,
        amount: float,
        receiver_upi: str,
        transaction_time: Optional[datetime] = None
    ) -> Tuple[str, List[str]]:
        if not transaction_time:
            transaction_time = datetime.now(timezone.utc)

        flag_reasons: List[str] = []
        rules = db.query(FraudRule).filter(FraudRule.is_enabled == True).all()
        rules_map = {r.rule_code: r for r in rules}

        # 1. High Amount Rule
        high_amt_rule = rules_map.get("HIGH_UPI_AMOUNT")
        if high_amt_rule and high_amt_rule.threshold_value:
            if amount > high_amt_rule.threshold_value:
                flag_reasons.append(
                    f"Configured Rule Alert: Amount ₹{amount:,.2f} exceeds standard UPI threshold limit (₹{high_amt_rule.threshold_value:,.2f})."
                )

        # 2. Night Time / Off-Hour Rule
        night_rule = rules_map.get("NIGHT_TRANSACTION")
        if night_rule:
            config = night_rule.config_json or {}
            start_hour = config.get("start_hour", 23)
            end_hour = config.get("end_hour", 5)
            hour = transaction_time.hour
            is_night = (hour >= start_hour) or (hour < end_hour) if start_hour > end_hour else (start_hour <= hour < end_hour)
            if is_night:
                flag_reasons.append(
                    f"Configured Rule Alert: Transaction initiated during off-hours ({transaction_time.strftime('%I:%M %p')}) outside normal daylight window."
                )

        # 3. Transaction Velocity (Max transactions per 10 minutes)
        velocity_rule = rules_map.get("VELOCITY_10MIN")
        if velocity_rule and velocity_rule.threshold_value:
            ten_mins_ago = transaction_time - timedelta(minutes=10)
            recent_count = db.query(Transaction).filter(
                Transaction.user_id == user_id,
                Transaction.transaction_date >= ten_mins_ago
            ).count()
            if recent_count >= velocity_rule.threshold_value:
                flag_reasons.append(
                    f"Velocity Alert: High transaction frequency detected ({recent_count + 1} transactions in past 10 minutes)."
                )

        # 4. Reported UPI Receiver Warning
        reported_upi_rule = rules_map.get("REPORTED_UPI_WARNING")
        threshold = reported_upi_rule.threshold_value if reported_upi_rule else 1
        rep_record = db.query(ReportedUPI).filter(ReportedUPI.upi_id == receiver_upi.lower().strip()).first()
        if rep_record:
            if rep_record.verified_count > 0:
                flag_reasons.append(
                    f"Reported Entity Warning: Recipient UPI ID '{receiver_upi}' has {rep_record.verified_count} admin-verified fraud report(s) on platform."
                )
            elif rep_record.report_count >= threshold:
                flag_reasons.append(
                    f"Reported Entity Warning: Recipient UPI ID '{receiver_upi}' has {rep_record.report_count} community report(s) under review."
                )

        # 5. New Receiver Flag
        new_rcv_rule = rules_map.get("NEW_RECEIVER")
        if new_rcv_rule:
            has_past = db.query(Transaction).join(Transaction.upi_details).filter(
                Transaction.user_id == user_id,
                Transaction.status == "Completed"
            ).first()
            # If user has past transactions but none to this receiver
            past_to_this = db.query(Transaction).join(Transaction.upi_details).filter(
                Transaction.user_id == user_id,
                Transaction.upi_details.has(receiver_upi=receiver_upi)
            ).first()
            if not past_to_this:
                flag_reasons.append(
                    f"First-Time Recipient: You have not previously sent payments to '{receiver_upi}'."
                )

        # Determine Final Flag Status
        # Suspicious if verified reported entity, high velocity, or multiple severe flags
        has_severe = any("verified" in r or "High transaction frequency" in r or "exceeds" in r for r in flag_reasons)
        if len(flag_reasons) >= 2 or (len(flag_reasons) == 1 and has_severe):
            flag_status = "Suspicious" if has_severe else "Review"
        elif len(flag_reasons) == 1:
            flag_status = "Review"
        else:
            flag_status = "Normal"

        return flag_status, flag_reasons

    @staticmethod
    def evaluate_card_transaction(
        db: Session,
        user_id: int,
        amount: float,
        merchant: str,
        country: str,
        transaction_time: Optional[datetime] = None
    ) -> Tuple[str, List[str]]:
        if not transaction_time:
            transaction_time = datetime.now(timezone.utc)

        flag_reasons: List[str] = []
        rules = db.query(FraudRule).filter(FraudRule.is_enabled == True).all()
        rules_map = {r.rule_code: r for r in rules}

        # 1. High Card Amount Rule
        high_amt_rule = rules_map.get("HIGH_CARD_AMOUNT")
        if high_amt_rule and high_amt_rule.threshold_value:
            if amount > high_amt_rule.threshold_value:
                flag_reasons.append(
                    f"Configured Rule Alert: Card transaction amount ₹{amount:,.2f} exceeds threshold limit (₹{high_amt_rule.threshold_value:,.2f})."
                )

        # 2. International Card Payment Flag
        intl_rule = rules_map.get("INTERNATIONAL_CARD")
        if intl_rule and country.lower() not in ["india", "in"]:
            flag_reasons.append(
                f"Cross-Border Flag: Transaction processed outside domestic origin (Country: {country})."
            )

        # 3. Night Time Rule
        night_rule = rules_map.get("NIGHT_TRANSACTION")
        if night_rule:
            config = night_rule.config_json or {}
            start_hour = config.get("start_hour", 23)
            end_hour = config.get("end_hour", 5)
            hour = transaction_time.hour
            is_night = (hour >= start_hour) or (hour < end_hour) if start_hour > end_hour else (start_hour <= hour < end_hour)
            if is_night:
                flag_reasons.append(
                    f"Off-Hours Activity: Card transaction charged during night window ({transaction_time.strftime('%I:%M %p')})."
                )

        # 4. Reported Merchant Warning
        rep_merchant_rule = rules_map.get("REPORTED_MERCHANT_WARNING")
        threshold = rep_merchant_rule.threshold_value if rep_merchant_rule else 1
        rep_m = db.query(ReportedMerchant).filter(ReportedMerchant.merchant_name.ilike(merchant.strip())).first()
        if rep_m:
            if rep_m.verified_count > 0:
                flag_reasons.append(
                    f"Reported Merchant Warning: '{merchant}' has {rep_m.verified_count} admin-verified fraud report(s)."
                )
            elif rep_m.report_count >= threshold:
                flag_reasons.append(
                    f"Reported Merchant Warning: '{merchant}' has {rep_m.report_count} incident report(s) filed on platform."
                )

        has_severe = any("verified" in r or "Cross-Border" in r or "exceeds" in r for r in flag_reasons)
        if len(flag_reasons) >= 2 or (len(flag_reasons) == 1 and has_severe):
            flag_status = "Suspicious" if has_severe else "Review"
        elif len(flag_reasons) == 1:
            flag_status = "Review"
        else:
            flag_status = "Normal"

        return flag_status, flag_reasons
