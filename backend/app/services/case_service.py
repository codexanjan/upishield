from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.case import FraudCase, CaseMessage, CaseNote, CaseEvidence, CaseStatusHistory
from app.models.fraud_report import FraudReport, ReportedUPI, ReportedMerchant
from app.models.user import User
from app.services.notification_service import NotificationService
from app.services.audit_service import AuditService

class CaseService:
    @staticmethod
    def get_user_cases(db: Session, user_id: int) -> List[FraudCase]:
        return db.query(FraudCase).join(FraudCase.report).filter(FraudReport.user_id == user_id).order_by(FraudCase.created_at.desc()).all()

    @staticmethod
    def get_all_cases(db: Session, status: Optional[str] = None, priority: Optional[str] = None, skip: int = 0, limit: int = 100) -> List[FraudCase]:
        q = db.query(FraudCase)
        if status and status != "All":
            q = q.filter(FraudCase.status == status)
        if priority and priority != "All":
            q = q.filter(FraudCase.priority == priority)
        return q.order_by(FraudCase.updated_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_case_by_id(db: Session, case_id: int) -> Optional[FraudCase]:
        return db.query(FraudCase).filter(FraudCase.id == case_id).first()

    @staticmethod
    def update_case_status(
        db: Session,
        case_id: int,
        admin: User,
        new_status: str,
        note: Optional[str] = None,
        resolution: Optional[str] = None
    ) -> Optional[FraudCase]:
        case = CaseService.get_case_by_id(db, case_id)
        if not case:
            return None

        old_status = case.status
        case.status = new_status
        if resolution:
            case.resolution = resolution
        case.updated_at = datetime.now(timezone.utc)

        # Also update the parent report status
        if new_status in ["Resolved", "Rejected"]:
            case.report.status = new_status

        # Add to status history
        history = CaseStatusHistory(
            case_id=case.id,
            old_status=old_status,
            new_status=new_status,
            changed_by_type="admin",
            changed_by_id=admin.id,
            note=note or f"Status changed to {new_status}"
        )
        db.add(history)
        db.commit()
        db.refresh(case)

        # Notify user
        NotificationService.create_user_notification(
            db=db,
            user_id=case.report.user_id,
            title=f"Case Status Updated: {new_status}",
            message=f"Case {case.case_number} status changed to {new_status}. {note or ''}",
            notification_type="status_changed",
            reference_id=case.case_number
        )

        # Audit log
        AuditService.log_action(
            db=db,
            admin_id=admin.id,
            admin_email=admin.email,
            action="Case Status Change",
            target_type="Case",
            target_id=case.case_number,
            details={"old_status": old_status, "new_status": new_status, "note": note}
        )

        return case

    @staticmethod
    def update_case_priority(db: Session, case_id: int, admin: User, priority: str) -> Optional[FraudCase]:
        case = CaseService.get_case_by_id(db, case_id)
        if not case:
            return None
        case.priority = priority
        case.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(case)

        AuditService.log_action(
            db=db,
            admin_id=admin.id,
            admin_email=admin.email,
            action="Case Priority Change",
            target_type="Case",
            target_id=case.case_number,
            details={"priority": priority}
        )
        return case

    @staticmethod
    def add_message(
        db: Session,
        case_id: int,
        sender: User,
        message_text: str,
        attachment_url: Optional[str] = None
    ) -> CaseMessage:
        case = CaseService.get_case_by_id(db, case_id)
        if not case:
            raise ValueError("Case not found")

        sender_type = "admin" if sender.role == "admin" else "user"

        msg = CaseMessage(
            case_id=case.id,
            sender_type=sender_type,
            sender_id=sender.id,
            message=message_text,
            attachment_url=attachment_url,
            is_read=False
        )
        db.add(msg)
        case.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(msg)

        # Notify the other party
        if sender_type == "admin":
            NotificationService.create_user_notification(
                db=db,
                user_id=case.report.user_id,
                title=f"New Message on Case {case.case_number}",
                message=f"Administrator: {message_text[:80]}...",
                notification_type="admin_message",
                reference_id=case.case_number
            )
        else:
            NotificationService.create_admin_notification(
                db=db,
                title=f"User Reply on Case {case.case_number}",
                message=f"{sender.name}: {message_text[:80]}...",
                notification_type="user_message",
                reference_id=case.case_number
            )

        return msg

    @staticmethod
    def add_internal_note(db: Session, case_id: int, admin: User, note_text: str) -> CaseNote:
        case = CaseService.get_case_by_id(db, case_id)
        if not case:
            raise ValueError("Case not found")

        note = CaseNote(
            case_id=case.id,
            admin_id=admin.id,
            note=note_text
        )
        db.add(note)
        case.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(note)
        return note

    @staticmethod
    def add_evidence(
        db: Session,
        case_id: int,
        uploader: User,
        file_name: str,
        file_url: str,
        file_type: str,
        file_size: Optional[int] = None,
        description: Optional[str] = None
    ) -> CaseEvidence:
        case = CaseService.get_case_by_id(db, case_id)
        if not case:
            raise ValueError("Case not found")

        uploader_type = "admin" if uploader.role == "admin" else "user"

        ev = CaseEvidence(
            case_id=case.id,
            report_id=case.report_id,
            file_name=file_name,
            file_url=file_url,
            file_type=file_type,
            file_size=file_size,
            description=description,
            uploaded_by_type=uploader_type,
            uploaded_by_id=uploader.id
        )
        db.add(ev)

        # Add to history
        history = CaseStatusHistory(
            case_id=case.id,
            old_status=case.status,
            new_status=case.status,
            changed_by_type=uploader_type,
            changed_by_id=uploader.id,
            note=f"Evidence uploaded: {file_name}"
        )
        db.add(history)
        case.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(ev)

        if uploader_type == "user":
            NotificationService.create_admin_notification(
                db=db,
                title=f"Evidence Uploaded: {case.case_number}",
                message=f"User {uploader.name} uploaded evidence '{file_name}'.",
                notification_type="new_evidence",
                reference_id=case.case_number
            )

        return ev

    @staticmethod
    def verify_report(db: Session, case_id: int, admin: User, verification_status: str) -> bool:
        """
        Classify report as: Verified, Unverified, Rejected, Duplicate
        Updates platform records for ReportedUPI / ReportedMerchant
        """
        case = CaseService.get_case_by_id(db, case_id)
        if not case:
            return False

        report = case.report
        report.verification_status = verification_status

        # If verified, increment verified_count in directory
        if verification_status == "Verified":
            if report.upi_id:
                rep_upi = db.query(ReportedUPI).filter(ReportedUPI.upi_id == report.upi_id).first()
                if rep_upi:
                    rep_upi.verified_count += 1
                    rep_upi.status = "Frequently Reported"
            if report.merchant:
                rep_m = db.query(ReportedMerchant).filter(ReportedMerchant.merchant_name == report.merchant).first()
                if rep_m:
                    rep_m.verified_count += 1
                    rep_m.status = "Frequently Reported"

        db.commit()

        AuditService.log_action(
            db=db,
            admin_id=admin.id,
            admin_email=admin.email,
            action=f"Report {verification_status}",
            target_type="Report",
            target_id=report.report_number,
            details={"verification_status": verification_status, "case": case.case_number}
        )

        return True
