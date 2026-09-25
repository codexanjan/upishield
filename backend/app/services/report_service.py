from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.fraud_report import FraudReport, ReportedUPI, ReportedMerchant
from app.models.case import FraudCase, CaseStatusHistory
from app.schemas.report import FraudReportCreate
from app.services.notification_service import NotificationService

class ReportService:
    @staticmethod
    def create_report(db: Session, user_id: int, user_name: str, data: FraudReportCreate) -> FraudReport:
        # Generate sequential report number
        rep_count = db.query(FraudReport).count() + 1
        rep_number = f"REP-{datetime.now().year}-{rep_count:06d}"

        report = FraudReport(
            report_number=rep_number,
            user_id=user_id,
            transaction_id=data.transaction_id,
            fraud_category=data.fraud_category,
            amount=data.amount,
            upi_id=data.upi_id.strip().lower() if data.upi_id else None,
            merchant=data.merchant.strip() if data.merchant else None,
            phone=data.phone,
            url=data.url,
            description=data.description,
            status="Submitted",
            verification_status="Unverified"
        )
        db.add(report)
        db.flush()

        # Update ReportedUPI directory if provided
        if report.upi_id:
            rep_upi = db.query(ReportedUPI).filter(ReportedUPI.upi_id == report.upi_id).first()
            if rep_upi:
                rep_upi.report_count += 1
                rep_upi.last_reported_at = datetime.now(timezone.utc)
                if rep_upi.report_count >= 3:
                    rep_upi.status = "Frequently Reported"
            else:
                rep_upi = ReportedUPI(
                    upi_id=report.upi_id,
                    report_count=1,
                    verified_count=0,
                    status="Under Review",
                    last_reported_at=datetime.now(timezone.utc)
                )
                db.add(rep_upi)

        # Update ReportedMerchant directory if provided
        if report.merchant:
            rep_m = db.query(ReportedMerchant).filter(ReportedMerchant.merchant_name == report.merchant).first()
            if rep_m:
                rep_m.report_count += 1
                rep_m.last_reported_at = datetime.now(timezone.utc)
                if rep_m.report_count >= 3:
                    rep_m.status = "Frequently Reported"
                if data.fraud_category not in (rep_m.categories or []):
                    rep_m.categories = (rep_m.categories or []) + [data.fraud_category]
            else:
                rep_m = ReportedMerchant(
                    merchant_name=report.merchant,
                    report_count=1,
                    verified_count=0,
                    categories=[data.fraud_category],
                    status="Under Review",
                    last_reported_at=datetime.now(timezone.utc)
                )
                db.add(rep_m)

        # Deterministic Case Priority calculation based on amount
        if data.amount >= 50000:
            priority = "Critical"
        elif data.amount >= 20000:
            priority = "High"
        elif data.amount >= 5000:
            priority = "Medium"
        else:
            priority = "Low"

        # Generate unique case number
        case_count = db.query(FraudCase).count() + 1
        case_number = f"CASE-{datetime.now().year}-{case_count:06d}"

        case = FraudCase(
            case_number=case_number,
            report_id=report.id,
            status="Submitted",
            priority=priority,
            internal_notes=f"Auto-initialized case for report {rep_number} with priority {priority}."
        )
        db.add(case)
        db.flush()

        # Add initial timeline history
        history = CaseStatusHistory(
            case_id=case.id,
            old_status=None,
            new_status="Submitted",
            changed_by_type="user",
            changed_by_id=user_id,
            note="Fraud report submitted by user"
        )
        db.add(history)

        db.commit()
        db.refresh(report)
        db.refresh(case)

        # Notifications
        NotificationService.create_user_notification(
            db=db,
            user_id=user_id,
            title="Fraud Report Submitted",
            message=f"Report {rep_number} submitted successfully. Investigation Case {case_number} has been opened.",
            notification_type="report_submitted",
            reference_id=case_number
        )

        NotificationService.create_admin_notification(
            db=db,
            title=f"New {priority} Fraud Report",
            message=f"Report {rep_number} for ₹{data.amount:,.2f} ({data.fraud_category}) submitted by {user_name}.",
            notification_type="report_submitted",
            reference_id=case_number
        )

        return report

    @staticmethod
    def get_user_reports(db: Session, user_id: int) -> List[FraudReport]:
        return db.query(FraudReport).filter(FraudReport.user_id == user_id).order_by(FraudReport.created_at.desc()).all()

    @staticmethod
    def get_all_reports(db: Session, skip: int = 0, limit: int = 100) -> List[FraudReport]:
        return db.query(FraudReport).order_by(FraudReport.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_report_by_id(db: Session, report_id: int) -> Optional[FraudReport]:
        return db.query(FraudReport).filter(FraudReport.id == report_id).first()
