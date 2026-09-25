from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class AuditLogResponse(BaseModel):
    id: int
    admin_id: Optional[int]
    admin_email: str
    action: str
    target_type: Optional[str]
    target_id: Optional[str]
    ip_address: str
    details_json: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
