from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.permissions import get_current_user
from app.core.security import verify_password, get_password_hash
from app.models.user import User, Session as UserSession
from app.schemas.user import UserResponse, UserUpdate, ChangePasswordRequest, SessionResponse

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_me(data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.name:
        current_user.name = data.name.strip()
    if data.mobile is not None:
        current_user.mobile = data.mobile.strip() if data.mobile else None
    if data.avatar:
        current_user.avatar = data.avatar
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password")
def change_password(data: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password incorrect")
    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

@router.get("/sessions", response_model=List[SessionResponse])
def get_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(UserSession).filter(UserSession.user_id == current_user.id).order_by(UserSession.created_at.desc()).all()

@router.delete("/sessions/{session_id}")
def terminate_session(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = db.query(UserSession).filter(UserSession.id == session_id, UserSession.user_id == current_user.id).first()
    if s:
        db.delete(s)
        db.commit()
    return {"message": "Session terminated"}
