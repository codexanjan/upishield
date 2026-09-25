from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class FraudRuleBase(BaseModel):
    rule_code: str
    name: str
    description: str
    is_enabled: bool = True
    threshold_value: Optional[float] = None
    severity: str = "Medium" # Low, Medium, High, Critical
    config_json: Optional[Dict[str, Any]] = {}

class FraudRuleCreate(FraudRuleBase):
    pass

class FraudRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_enabled: Optional[bool] = None
    threshold_value: Optional[float] = None
    severity: Optional[str] = None
    config_json: Optional[Dict[str, Any]] = None

class FraudRuleResponse(FraudRuleBase):
    id: int
    updated_by: str
    updated_at: datetime

    class Config:
        from_attributes = True
