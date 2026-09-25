from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class NotificationResponse(BaseModel):
    id: int
    recipient_type: str
    recipient_id: Optional[int]
    title: str
    message: str
    notification_type: str
    reference_id: Optional[str]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationMarkReadRequest(BaseModel):
    notification_ids: Optional[list[int]] = None
