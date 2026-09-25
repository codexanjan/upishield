from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.notification import Notification

class NotificationService:
    @staticmethod
    def create_user_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        notification_type: str,
        reference_id: Optional[str] = None
    ) -> Notification:
        notif = Notification(
            recipient_type="user",
            recipient_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            reference_id=reference_id,
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def create_admin_notification(
        db: Session,
        title: str,
        message: str,
        notification_type: str,
        reference_id: Optional[str] = None
    ) -> Notification:
        notif = Notification(
            recipient_type="admin",
            recipient_id=None, # For all admins
            title=title,
            message=message,
            notification_type=notification_type,
            reference_id=reference_id,
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @staticmethod
    def get_user_notifications(db: Session, user_id: int, limit: int = 50) -> List[Notification]:
        return db.query(Notification).filter(
            Notification.recipient_type == "user",
            Notification.recipient_id == user_id
        ).order_by(Notification.created_at.desc()).limit(limit).all()

    @staticmethod
    def get_admin_notifications(db: Session, limit: int = 50) -> List[Notification]:
        return db.query(Notification).filter(
            Notification.recipient_type == "admin"
        ).order_by(Notification.created_at.desc()).limit(limit).all()

    @staticmethod
    def mark_all_as_read(db: Session, recipient_type: str, user_id: Optional[int] = None) -> int:
        q = db.query(Notification).filter(Notification.recipient_type == recipient_type, Notification.is_read == False)
        if recipient_type == "user" and user_id:
            q = q.filter(Notification.recipient_id == user_id)
        updated = q.update({"is_read": True}, synchronize_session=False)
        db.commit()
        return updated
