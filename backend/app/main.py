import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, SessionLocal, Base
from app.models import *  # Ensure all models are loaded
from app.seed_data import seed_initial_data

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.upi import router as upi_router
from app.api.v1.cards import router as cards_router
from app.api.v1.expenses import router as expenses_router
from app.api.v1.income import router as income_router
from app.api.v1.budgets import router as budgets_router
from app.api.v1.reports import router as reports_router
from app.api.v1.cases import router as cases_router
from app.api.v1.admin import router as admin_router
from app.api.v1.rules import router as rules_router
from app.api.v1.notifications import router as notifications_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed demo data
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()
    yield
    # Shutdown logic if any

app = FastAPI(
    title="UPI Shield API",
    description="Deterministic UPI & Credit Card Fraud Reporting, Expense Tracking and Payment Management Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(transactions_router, prefix=settings.API_V1_STR)
app.include_router(upi_router, prefix=settings.API_V1_STR)
app.include_router(cards_router, prefix=settings.API_V1_STR)
app.include_router(expenses_router, prefix=settings.API_V1_STR)
app.include_router(income_router, prefix=settings.API_V1_STR)
app.include_router(budgets_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(cases_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(rules_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)

@app.get("/health")
@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {
        "status": "healthy",
        "service": "UPI Shield Backend",
        "demo_mode": settings.DEMO_MODE,
        "engine": "Deterministic Rule Engine (NO AI)"
    }
