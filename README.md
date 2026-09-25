# UPI SHIELD

> **Secure Payments. Smarter Tracking. Safer Transactions.**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015%20App%20Router-000000?style=flat-square&logo=next.js)](https://nextjs.org)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel%20Production-000000?style=flat-square&logo=vercel)](https://upi-shield-ai-design.vercel.app)
[![Zero AI](https://img.shields.io/badge/AI--Free-100%25%20Deterministic-22C55E?style=flat-square)](#strict-zero-ai-architecture)

### 🌐 Live Production URL
**[https://upi-shield-ai-design.vercel.app](https://upi-shield-ai-design.vercel.app)**

---

## 1. Project Overview

**UPI SHIELD** is a production-style, full-stack financial platform designed for UPI and Credit Card transaction supervision, expense management, deterministic fraud rule monitoring, and end-to-end incident case resolution.

The platform provides **two completely segregated portals**:
1. **User Portal (`/dashboard`)**: Personal financial tracking, expense categorisation, deterministic budget monitors, live QR camera scanner, UPI payment intent handoff, and formal fraud incident reporting.
2. **Admin Portal (`/admin`)**: Operations and security desk for investigating reported payments, auditing platform-wide transactions, configuring deterministic rule thresholds, updating case timelines, managing user portal access, and maintaining an immutable audit ledger.

---

## 2. Strict Zero-AI Architecture

> [!IMPORTANT]
> **UPI SHIELD contains NO Artificial Intelligence, Machine Learning models, LLMs, heuristic probabilistic engines, or external AI APIs.**
>
> The system operates exclusively on:
> - User-entered transactional and financial records.
> - Exact mathematical and deterministic formulas.
> - Configurable administrator threshold rules.
> - Historical community report frequency.
> - Manual human admin case investigation and certification.
> - Immutable append-only audit trail logs.

### Deterministic Rule Engine Matrix
| Rule Code | Trigger Evaluation | Default Threshold | Assigned Severity |
|---|---|---|---|
| `HIGH_UPI_AMOUNT` | Transaction Amount > Limit | ₹50,000 | `Review` |
| `HIGH_CARD_AMOUNT` | Card Charge > Limit | ₹25,000 | `Review` |
| `NIGHT_TRANSACTION` | Time within 23:00 to 05:00 window | Hour ≥ 23 or Hour < 5 | `Review` |
| `VELOCITY_10MIN` | Transactions count in last 10 minutes > Limit | > 5 transactions | `Suspicious` |
| `REPORTED_UPI_WARNING` | Recipient VPA platform complaints count ≥ Threshold | ≥ 3 reports | `Suspicious` |
| `REPORTED_MERCHANT_WARNING` | Merchant entity platform complaints count ≥ Threshold | ≥ 5 reports | `Suspicious` |
| `INTERNATIONAL_CARD` | Foreign acquiring bank / Cross-border channel | Country ≠ India | `Suspicious` |
| `NEW_RECEIVER` | Recipient VPA never previously transacted with user | Count = 0 | `Review` |

---

## 3. System Architecture & Portal Segregation

```mermaid
graph TD
    subgraph Public Portal
        A[Landing Page /]
        B[User Auth /login, /register]
        C[Admin Auth /admin/login]
    end

    subgraph User Portal (/dashboard)
        D[Dashboard Overview]
        E[Expense Tracker & Budgets]
        F[Live QR Scanner & UPI Intent Pay]
        G[Incident Reporting /dashboard/report]
        H[My Cases & Timeline Tracking]
    end

    subgraph Core Platform Database
        DB[(Database: SQLite / PostgreSQL)]
        AUDIT[(Immutable Audit Ledger)]
    end

    subgraph Admin Portal (/admin)
        I[Admin Dashboard & Operations KPI]
        J[Case Management & Timeline Desk]
        K[Deterministic Rule Configurator]
        L[Reported VPAs & Merchants Directory]
        M[User Account Management]
        N[Audit Trail Inspector]
    end

    A --> B
    A --> C
    B --> D
    C --> I
    
    D --> E
    D --> F
    D --> G
    G -->|Inserts Report| DB
    DB -->|Generates Case| H
    DB -->|Alerts Admin Desk| I
    
    I --> J
    J -->|Status Update / Request Evidence| DB
    DB -->|Real-time Notification| H
    
    K -->|Updates Rule Thresholds| DB
    K -->|Logs Action| AUDIT
    J -->|Logs Action| AUDIT
    M -->|Logs Action| AUDIT
```

---

## 4. Key Modules & Features

### 👤 User Portal (`/dashboard`)
- **Dashboard Overview**: 6 Key Metric Cards, 4 Recharts visualisations (Income vs. Expense, Monthly Expenses, Categories, UPI vs. Card Breakdown).
- **Transactions Ledger (`/dashboard/transactions`)**: Comprehensive historical transactions with search, date filters, payment methods, and rule evaluation flags (`Normal`, `Review`, `Suspicious`).
- **Send UPI Intent (`/dashboard/pay`)**: Generates valid `upi://pay?pa=...` URIs with encoded parameters and triggers UPI app handoff on mobile devices.
- **Live QR Scanner (`/dashboard/scan`)**: Browser camera stream with corner brackets and animated beam; automatically decodes UPI payment strings or supports image upload fallback.
- **QR Generator (`/dashboard/qr-generator`)**: Generate instant compliant UPI QR codes with download and share capabilities.
- **Expense & Budget Tracker (`/dashboard/expenses`, `/dashboard/budgets`)**:
  - 16 financial categories.
  - 4-tier color budget thresholds: `0-60% (Green)`, `61-85% (Amber)`, `86-100% (Orange)`, `>100% (Red)`.
- **Income Tracker (`/dashboard/income`)**: Deterministic savings formulas:
  $$\text{Net Balance} = \text{Total Income} - \text{Total Expenses}$$
  $$\text{Savings Rate} = \left(\frac{\text{Net Balance}}{\text{Total Income}}\right) \times 100\%$$
- **Cards Management (`/dashboard/cards`)**: Stores only masked card digits (`•••• 4242`). Sensitive elements (CVV, Card PIN) are never requested or stored.
- **Fraud Incident Filing (`/dashboard/report`)**: 14 distinct scam categories, transaction linkage, suspect VPA/merchant capture, evidence document upload (JPG, PNG, WEBP, PDF up to 10MB), and automatic sequential `CASE-2026-XXXXXX` initialization.
- **Case Tracking (`/dashboard/cases`)**: Interactive vertical chronology animated with Framer Motion, evidence viewer, and direct intra-case communication channel with the assigned administrator.

### 🛡️ Admin Portal (`/admin`)
- **Admin Dashboard (`/admin/dashboard`)**: 9 Real-time KPIs, monthly intake charts, incident categorization breakdown, and directory counters.
- **Case Management (`/admin/cases`)**: Filter by workflow status and priority, update status, adjust priority (`Low`, `Medium`, `High`, `Critical`), request follow-up evidence, send user messages, and log confidential internal notes.
- **Rule Engine Management (`/admin/fraud-rules`)**: Configure thresholds, nighttime windows, velocity rates, and enable/disable rules in real time.
- **Reported VPA Directory (`/admin/reported-upi`)**: Internal directory of VPAs reported across the platform with report counts, verification metrics, and clear disclaimer boundaries.
- **Reported Merchants Directory (`/admin/reported-merchants`)**: Catalog of merchant complaint volumes and incident categories.
- **User Directory (`/admin/users`)**: Search registered users, inspect activity volume, and toggle application access permissions.
- **Audit Logs (`/admin/audit-logs`)**: Append-only log of every administrative decision, rule adjustment, user status change, and status transition with JSON payload inspection.

---

## 5. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Recharts, Zustand, Lucide Icons, html5-qrcode, qrcode |
| **Backend** | FastAPI, Python 3.12, SQLAlchemy 2.0 ORM, Pydantic V2, Python-Jose (JWT), Bcrypt |
| **Database** | SQLite (Default Zero-Config Dev) / PostgreSQL 16 (Production Ready) |
| **Testing** | Pytest, HTTPX TestClient |
| **Containerization** | Docker, Multi-Stage Dockerfile, Docker Compose |

---

## 6. Directory Structure

```
upi-shield/
├── app/                           # Next.js App Router (35 Pages)
│   ├── (auth)/                    # User & Admin Authentication
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── admin/                     # Dedicated Admin Portal
│   │   ├── audit-logs/
│   │   ├── card-transactions/
│   │   ├── cases/
│   │   ├── dashboard/
│   │   ├── fraud-rules/
│   │   ├── login/
│   │   ├── notifications/
│   │   ├── reported-merchants/
│   │   ├── reported-upi/
│   │   ├── reports/
│   │   ├── settings/
│   │   ├── transactions/
│   │   ├── upi-transactions/
│   │   └── users/
│   ├── dashboard/                 # Dedicated User Portal
│   │   ├── budgets/
│   │   ├── cards/
│   │   ├── cases/
│   │   ├── expenses/
│   │   ├── income/
│   │   ├── notifications/
│   │   ├── pay/
│   │   ├── profile/
│   │   ├── qr-generator/
│   │   ├── report/
│   │   ├── reports/
│   │   ├── scan/
│   │   ├── settings/
│   │   └── transactions/
│   └── page.tsx                   # Minimal Fintech Landing Page
├── backend/                       # FastAPI Application
│   ├── app/
│   │   ├── api/v1/                # 13 REST API Routers
│   │   ├── core/                  # Security, Database & Config
│   │   ├── models/                # SQLAlchemy ORM Models
│   │   ├── schemas/               # Pydantic Schemas
│   │   ├── services/              # Deterministic Business Logic
│   │   ├── seed_data.py           # Preloaded Demo Accounts & Rules
│   │   └── main.py                # FastAPI Entrypoint
│   ├── tests/                     # Pytest Automated Test Suite
│   └── requirements.txt
├── components/                    # UI & Motion Components
│   ├── layout/                    # User & Admin Shell Layouts
│   └── motion/                    # Framer Motion Presets
├── lib/                           # Zustand Stores & Fetch Clients
├── docker-compose.yml             # Orchestration Spec
├── Dockerfile                     # Frontend Production Container
├── .env.example                   # Environment Template
└── README.md
```

---

## 7. Getting Started

### Prerequisites
- Node.js 18+ & `npm`
- Python 3.10+ (Python 3.12 recommended)

### Option A: Local Development Setup

#### 1. Start the Backend API
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server (starts on http://127.0.0.1:8000)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The database automatically creates and seeds `backend/upi_shield.db` on first boot.*

#### 2. Start the Frontend Application
```bash
# From project root
npm install

# Start Next.js development server (starts on http://localhost:3000)
npm run dev
```

---

### Option B: Docker Compose Setup

Run the full stack (Next.js, FastAPI, and PostgreSQL 16) with a single command:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

---

## 8. Default Credentials for Evaluation

The database is pre-seeded with sample records for rapid demonstration:

| Portal | Role | Email | Password |
|---|---|---|---|
| **Admin Portal** (`/admin/login`) | System Administrator | `admin@upishield.com` | `admin123` |
| **User Portal** (`/login`) | Standard Verified User | `user@upishield.com` | `user123` |

---

## 9. Automated Testing

Run the automated backend test suite covering authentication, RBAC, deterministic calculations, case workflows, and audit logging:

```bash
cd backend
python -m pytest tests/test_api.py -v
```

---

## 10. Security & Regulatory Boundaries

1. **Zero Sensitive Card Data**: The platform never stores or accepts Card CVVs, ATM PINs, or banking NetBanking passwords. Only masked numbers (`•••• 4242`) are retained for personal expense reference.
2. **Zero UPI PIN Capture**: In accordance with NPCI security standards, UPI PINs are entered strictly inside certified mobile UPI PSP apps (GPay, PhonePe, Paytm, BHIM) triggered via the `upi://pay` protocol intent.
3. **Application Account Boundaries**: The administrator "Disable Account" action halts session authentication within the UPI Shield application; it does not claim or fabricate authority to freeze real Indian banking accounts.
4. **Platform-Only Directories**: Reported UPI and merchant catalogues are internal community indices with explicit disclaimers and do not constitute official banking blacklists.

---

## 11. Viva & Demonstration Walkthrough

When presenting or demonstrating this project for academic viva, capstone evaluation, or portfolio review:

1. **Step 1 - Landing Page (`/`)**: Show the dark fintech aesthetic, feature cards, and 4-step workflow.
2. **Step 2 - User Login (`/login`)**: Log in as `user@upishield.com`. Show financial overview cards and Recharts analytics.
3. **Step 3 - QR Scan & Intent Pay (`/dashboard/scan`, `/dashboard/pay`)**: Demonstrate live camera scanner and UPI intent construction.
4. **Step 4 - Incident Reporting (`/dashboard/report`)**: File an incident report for an unauthorized charge. Observe immediate `CASE-2026-XXXXXX` assignment.
5. **Step 5 - Admin Investigation (`/admin/login`)**: Open a separate tab, log in as `admin@upishield.com`.
6. **Step 6 - Case Action**: Open the newly filed case in `/admin/cases`, adjust priority to `Critical`, send an investigator message, request evidence, and classify report as `Verified`.
7. **Step 7 - Verify User Sync**: Switch back to User tab (`/dashboard/cases`); notice real-time vertical timeline progression and incoming investigator message.
8. **Step 8 - Audit Trail (`/admin/audit-logs`)**: Show that all administrative operations were cryptographically recorded with operator email and timestamp.

---

## 12. License

Developed for educational demonstration, major project submission, and fintech security evaluation. Free for non-commercial academic use.
