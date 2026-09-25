from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_admin
from app.models.user import User
from app.models.rule import FraudRule
from app.schemas.rule import FraudRuleCreate, FraudRuleUpdate, FraudRuleResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/admin/rules", tags=["admin-rules"])

@router.get("", response_model=List[FraudRuleResponse])
def get_rules(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(FraudRule).all()

@router.post("", response_model=FraudRuleResponse)
def create_rule(data: FraudRuleCreate, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    existing = db.query(FraudRule).filter(FraudRule.rule_code == data.rule_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Rule code already exists")

    rule = FraudRule(
        rule_code=data.rule_code,
        name=data.name,
        description=data.description,
        is_enabled=data.is_enabled,
        threshold_value=data.threshold_value,
        severity=data.severity,
        config_json=data.config_json or {},
        updated_by=admin.name
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    AuditService.log_action(
        db=db,
        admin_id=admin.id,
        admin_email=admin.email,
        action="Rule Created",
        target_type="Rule",
        target_id=rule.rule_code,
        details={"name": rule.name, "threshold": rule.threshold_value}
    )

    return rule

@router.patch("/{rule_id}", response_model=FraudRuleResponse)
def update_rule(rule_id: int, data: FraudRuleUpdate, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    rule = db.query(FraudRule).filter(FraudRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    old_vals = {"enabled": rule.is_enabled, "threshold": rule.threshold_value}

    if data.name is not None:
        rule.name = data.name
    if data.description is not None:
        rule.description = data.description
    if data.is_enabled is not None:
        rule.is_enabled = data.is_enabled
    if data.threshold_value is not None:
        rule.threshold_value = data.threshold_value
    if data.severity is not None:
        rule.severity = data.severity
    if data.config_json is not None:
        rule.config_json = data.config_json
    rule.updated_by = admin.name
    db.commit()
    db.refresh(rule)

    AuditService.log_action(
        db=db,
        admin_id=admin.id,
        admin_email=admin.email,
        action="Rule Updated",
        target_type="Rule",
        target_id=rule.rule_code,
        details={"old": old_vals, "new": {"enabled": rule.is_enabled, "threshold": rule.threshold_value}}
    )

    return rule

@router.delete("/{rule_id}")
def delete_rule(rule_id: int, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    rule = db.query(FraudRule).filter(FraudRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    code = rule.rule_code
    db.delete(rule)
    db.commit()

    AuditService.log_action(
        db=db,
        admin_id=admin.id,
        admin_email=admin.email,
        action="Rule Deleted",
        target_type="Rule",
        target_id=code
    )

    return {"message": "Rule removed"}
