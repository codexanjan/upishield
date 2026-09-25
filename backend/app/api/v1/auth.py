from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.models.user import User, Session as UserSession
from app.schemas.auth import (
    Token,
    LoginRequest,
    AdminLoginRequest,
    RegisterRequest,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.services.audit_service import AuditService

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=Token)
def register(data: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    existing = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    new_user = User(
        name=data.name.strip(),
        email=data.email.lower().strip(),
        mobile=data.mobile.strip() if data.mobile else None,
        password_hash=get_password_hash(data.password),
        role="user",
        status="active"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})
    refresh_token = create_refresh_token(data={"sub": str(new_user.id), "role": new_user.role})

    # Record session
    session = UserSession(
        user_id=new_user.id,
        token_hash=get_password_hash(refresh_token[:20]),
        ip_address=request.client.host if request.client else "127.0.0.1",
        user_agent=request.headers.get("user-agent", "Unknown"),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    db.add(session)
    db.commit()

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        role=new_user.role,
        user_name=new_user.name,
        user_email=new_user.email,
        user_id=new_user.id
    )

@router.post("/login", response_model=Token)
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled. Please contact administrator.")

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "role": user.role})

    # Track session
    session = UserSession(
        user_id=user.id,
        token_hash=get_password_hash(refresh_token[:20]),
        ip_address=request.client.host if request.client else "127.0.0.1",
        user_agent=request.headers.get("user-agent", "Unknown"),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7 if data.remember_me else 1)
    )
    db.add(session)
    db.commit()

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
        user_name=user.name,
        user_email=user.email,
        user_id=user.id
    )

@router.post("/admin-login", response_model=Token)
def admin_login(data: AdminLoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid administrator credentials")

    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Authorized admin credentials required.")

    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin account is disabled.")

    access_token = create_access_token(data={"sub": str(user.id), "role": "admin"})
    refresh_token = create_refresh_token(data={"sub": str(user.id), "role": "admin"})

    client_ip = request.client.host if request.client else "127.0.0.1"

    # Audit log admin login
    AuditService.log_action(
        db=db,
        admin_id=user.id,
        admin_email=user.email,
        action="Admin Login",
        target_type="Auth",
        target_id=str(user.id),
        ip_address=client_ip,
        details={"security_code_used": bool(data.security_code)}
    )

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        role="admin",
        user_name=user.name,
        user_email=user.email,
        user_id=user.id
    )

@router.post("/refresh", response_model=Token)
def refresh(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or user.status != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    new_access = create_access_token(data={"sub": str(user.id), "role": user.role})
    new_refresh = create_refresh_token(data={"sub": str(user.id), "role": user.role})

    return Token(
        access_token=new_access,
        refresh_token=new_refresh,
        role=user.role,
        user_name=user.name,
        user_email=user.email,
        user_id=user.id
    )

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    # Always return success message to prevent user enumeration
    return {"message": "If an account exists with this email, password reset instructions have been generated."}

@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset request")
    user.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password reset successful. You can now login with your new password."}
