from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User
from app.models.rule import FraudRule
from app.models.budget import Budget
from app.models.card import Card, CardTransaction
from app.models.transaction import Transaction, UPITransaction
from app.models.expense import Expense
from app.models.income import Income
from app.models.fraud_report import FraudReport, ReportedUPI, ReportedMerchant
from app.models.case import FraudCase, CaseStatusHistory, CaseMessage, CaseNote
from app.models.notification import Notification

def seed_initial_data(db: Session):
    # 1. Create Default Admin if not exists
    admin = db.query(User).filter(User.email == "admin@upishield.com").first()
    if not admin:
        admin = User(
            name="Platform Administrator",
            email="admin@upishield.com",
            mobile="+91 98765 00001",
            password_hash=get_password_hash("admin123"),
            role="admin",
            status="active"
        )
        db.add(admin)
        db.flush()

    # 2. Create Default User if not exists
    user = db.query(User).filter(User.email == "user@upishield.com").first()
    if not user:
        user = User(
            name="Anjan Sharma",
            email="user@upishield.com",
            mobile="+91 98765 43210",
            password_hash=get_password_hash("user123"),
            role="user",
            status="active"
        )
        db.add(user)
        db.flush()

    # 3. Seed Deterministic Fraud Rules if not exists
    default_rules = [
        {
            "rule_code": "HIGH_UPI_AMOUNT",
            "name": "High Value UPI Payment Alert",
            "description": "Flags UPI payments exceeding configured single-transfer amount threshold.",
            "threshold_value": 20000.0,
            "severity": "Medium",
            "config_json": {"currency": "INR"}
        },
        {
            "rule_code": "HIGH_CARD_AMOUNT",
            "name": "High Value Card Payment Alert",
            "description": "Flags credit card charges exceeding normal transaction ceiling.",
            "threshold_value": 50000.0,
            "severity": "High",
            "config_json": {"currency": "INR"}
        },
        {
            "rule_code": "NIGHT_TRANSACTION",
            "name": "Off-Hours Activity Window",
            "description": "Alerts when payment occurs during defined late-night hours.",
            "threshold_value": None,
            "severity": "Medium",
            "config_json": {"start_hour": 23, "end_hour": 5}
        },
        {
            "rule_code": "VELOCITY_10MIN",
            "name": "High Velocity Transaction Rate",
            "description": "Detects rapid-fire payments exceeding threshold count within 10 minutes.",
            "threshold_value": 3.0,
            "severity": "High",
            "config_json": {"window_minutes": 10}
        },
        {
            "rule_code": "REPORTED_UPI_WARNING",
            "name": "Reported UPI Recipient Warning",
            "description": "Flags recipient UPI IDs that have existing complaints or verified cases on platform.",
            "threshold_value": 1.0,
            "severity": "Critical",
            "config_json": {"alert_on_pending": True}
        },
        {
            "rule_code": "REPORTED_MERCHANT_WARNING",
            "name": "Reported Merchant Warning",
            "description": "Alerts user when transacting with a merchant name that has platform fraud records.",
            "threshold_value": 1.0,
            "severity": "Critical",
            "config_json": {}
        },
        {
            "rule_code": "INTERNATIONAL_CARD",
            "name": "Cross-Border Card Payment",
            "description": "Flags card charges processed outside India domestic clearing.",
            "threshold_value": None,
            "severity": "High",
            "config_json": {"allowed_origin": "India"}
        },
        {
            "rule_code": "NEW_RECEIVER",
            "name": "First-Time Recipient Verification",
            "description": "Notifies user when transferring funds to a UPI ID never paid before.",
            "threshold_value": None,
            "severity": "Low",
            "config_json": {}
        }
    ]

    for r_data in default_rules:
        existing_r = db.query(FraudRule).filter(FraudRule.rule_code == r_data["rule_code"]).first()
        if not existing_r:
            rule = FraudRule(
                rule_code=r_data["rule_code"],
                name=r_data["name"],
                description=r_data["description"],
                threshold_value=r_data["threshold_value"],
                severity=r_data["severity"],
                config_json=r_data["config_json"],
                is_enabled=True,
                updated_by="System Default"
            )
            db.add(rule)

    # 4. Seed Known Reported UPI IDs & Merchants for rule testing
    reported_upis = [
        {"upi": "quickcash.refund@fakeicici", "count": 4, "verified": 2, "status": "Frequently Reported"},
        {"upi": "kycupdate.support@paytmscam", "count": 6, "verified": 3, "status": "Frequently Reported"},
        {"upi": "telegram.task.rewards@ybl", "count": 2, "verified": 0, "status": "Under Review"}
    ]
    for ru in reported_upis:
        if not db.query(ReportedUPI).filter(ReportedUPI.upi_id == ru["upi"]).first():
            db.add(ReportedUPI(
                upi_id=ru["upi"],
                report_count=ru["count"],
                verified_count=ru["verified"],
                status=ru["status"]
            ))

    reported_merchants = [
        {"merchant": "CryptoWealth Express", "count": 5, "verified": 2, "cats": ["Investment Scam", "Marketplace Scam"]},
        {"merchant": "QuickLoan Instant Approval", "count": 3, "verified": 1, "cats": ["Loan Scam"]},
        {"merchant": "AirTickets Global Support", "count": 2, "verified": 0, "cats": ["Fake Customer Support"]}
    ]
    for rm in reported_merchants:
        if not db.query(ReportedMerchant).filter(ReportedMerchant.merchant_name == rm["merchant"]).first():
            db.add(ReportedMerchant(
                merchant_name=rm["merchant"],
                report_count=rm["count"],
                verified_count=rm["verified"],
                categories=rm["cats"],
                status="Frequently Reported" if rm["verified"] > 0 else "Under Review"
            ))

    # 5. Seed Initial User Cards, Incomes, Budgets, and Transactions if empty
    if user:
        # Card
        if not db.query(Card).filter(Card.user_id == user.id).first():
            c1 = Card(
                user_id=user.id,
                card_nickname="HDFC Regalia Gold",
                bank_name="HDFC Bank",
                card_network="Visa",
                masked_number="**** **** **** 4892",
                last_four="4892",
                expiry_month=8,
                expiry_year=2028,
                is_active=True
            )
            c2 = Card(
                user_id=user.id,
                card_nickname="ICICI Amazon Pay",
                bank_name="ICICI Bank",
                card_network="RuPay",
                masked_number="**** **** **** 1024",
                last_four="1024",
                expiry_month=11,
                expiry_year=2027,
                is_active=True
            )
            db.add(c1)
            db.add(c2)

        # Incomes
        now = datetime.now(timezone.utc)
        if not db.query(Income).filter(Income.user_id == user.id).first():
            db.add(Income(
                user_id=user.id,
                amount=75000.0,
                source="Tech Corp Bangalore",
                income_type="Salary",
                date=now - timedelta(days=20),
                description="Monthly Salary Deposit"
            ))
            db.add(Income(
                user_id=user.id,
                amount=15000.0,
                source="Freelance Frontend Design",
                income_type="Freelance",
                date=now - timedelta(days=7),
                description="Client Web App Milestone"
            ))

        # Budgets
        if not db.query(Budget).filter(Budget.user_id == user.id).first():
            db.add(Budget(user_id=user.id, category="Food", limit_amount=8000.0, month=now.month, year=now.year))
            db.add(Budget(user_id=user.id, category="Groceries", limit_amount=6000.0, month=now.month, year=now.year))
            db.add(Budget(user_id=user.id, category="Shopping", limit_amount=10000.0, month=now.month, year=now.year))
            db.add(Budget(user_id=user.id, category="Travel", limit_amount=5000.0, month=now.month, year=now.year))
            db.add(Budget(user_id=user.id, category="Bills", limit_amount=7000.0, month=now.month, year=now.year))

        # Sample Transactions
        if not db.query(Transaction).filter(Transaction.user_id == user.id).first():
            # 1. Normal UPI
            t1 = Transaction(
                user_id=user.id,
                transaction_reference=f"TXN-{now.strftime('%Y%m%d')}-A101",
                transaction_type="UPI",
                amount=450.0,
                currency="INR",
                merchant="Blue Tokai Coffee",
                payment_method="UPI",
                transaction_date=now - timedelta(hours=3),
                status="Completed",
                flag_status="Normal",
                flag_reasons=[]
            )
            db.add(t1)
            db.flush()
            db.add(UPITransaction(
                transaction_id=t1.id,
                sender_upi="anjan@oksbi",
                receiver_upi="bluetokai@icici",
                receiver_name="Blue Tokai Coffee",
                note="Espresso and Bagel",
                upi_reference="UPI-BT98124"
            ))
            db.add(Expense(
                user_id=user.id,
                transaction_id=t1.id,
                amount=450.0,
                category="Food",
                merchant="Blue Tokai Coffee",
                payment_method="UPI",
                date=t1.transaction_date,
                description="Morning coffee and breakfast"
            ))

            # 2. Suspicious UPI (reported recipient)
            t2 = Transaction(
                user_id=user.id,
                transaction_reference=f"TXN-{now.strftime('%Y%m%d')}-B202",
                transaction_type="UPI",
                amount=12500.0,
                currency="INR",
                merchant="quickcash.refund@fakeicici",
                payment_method="UPI",
                transaction_date=now - timedelta(days=1),
                status="Completed",
                flag_status="Suspicious",
                flag_reasons=[
                    "Reported Entity Warning: Recipient UPI ID 'quickcash.refund@fakeicici' has 2 admin-verified fraud report(s) on platform.",
                    "First-Time Recipient: You have not previously sent payments to 'quickcash.refund@fakeicici'."
                ]
            )
            db.add(t2)
            db.flush()
            db.add(UPITransaction(
                transaction_id=t2.id,
                sender_upi="anjan@oksbi",
                receiver_upi="quickcash.refund@fakeicici",
                receiver_name="QuickCash Support",
                note="Security deposit refund fee",
                upi_reference="UPI-SCAM772"
            ))
            db.add(Expense(
                user_id=user.id,
                transaction_id=t2.id,
                amount=12500.0,
                category="Other",
                merchant="QuickCash Support",
                payment_method="UPI",
                date=t2.transaction_date,
                description="Disputed deposit transfer"
            ))

            # 3. Create sample fraud report and active case for this suspicious transaction
            rep = FraudReport(
                report_number="REP-2026-000001",
                user_id=user.id,
                transaction_id=t2.id,
                fraud_category="Fake Refund",
                amount=12500.0,
                upi_id="quickcash.refund@fakeicici",
                merchant="QuickCash Support",
                phone="+91 99887 76655",
                url="https://refund-portal-claim.online",
                description="Caller claimed to be ICICI Bank executive processing an automated refund. Instructed to scan QR and approve ₹12,500 collect request with promise of immediate double reversal.",
                status="Under Review",
                verification_status="Verified"
            )
            db.add(rep)
            db.flush()

            case = FraudCase(
                case_number="CASE-2026-000001",
                report_id=rep.id,
                assigned_admin_id=admin.id if admin else None,
                status="Under Review",
                priority="High",
                internal_notes="Recipient UPI ID flagged in 2 previous cases. Matching scam pattern of phone phishing + fake collect request."
            )
            db.add(case)
            db.flush()

            db.add(CaseStatusHistory(
                case_id=case.id,
                old_status=None,
                new_status="Submitted",
                changed_by_type="user",
                changed_by_id=user.id,
                note="Fraud report submitted by user"
            ))
            db.add(CaseStatusHistory(
                case_id=case.id,
                old_status="Submitted",
                new_status="Under Review",
                changed_by_type="admin",
                changed_by_id=admin.id,
                note="Admin opened case for verification"
            ))
            db.add(CaseMessage(
                case_id=case.id,
                sender_type="admin",
                sender_id=admin.id,
                message="Case under review. Please attach any WhatsApp chat screenshots or SMS call records if available.",
                is_read=True
            ))
            db.add(CaseNote(
                case_id=case.id,
                admin_id=admin.id,
                note="Matched with incident recorded in Bangalore cyber crime advisory."
            ))

            # User Notification
            db.add(Notification(
                recipient_type="user",
                recipient_id=user.id,
                title="Investigation Under Review",
                message="Case CASE-2026-000001 has been assigned to an administrator for review.",
                notification_type="status_changed",
                reference_id="CASE-2026-000001"
            ))

            # 4. Normal Card Transaction
            t3 = Transaction(
                user_id=user.id,
                transaction_reference=f"TXN-{now.strftime('%Y%m%d')}-C303",
                transaction_type="Card",
                amount=3420.0,
                currency="INR",
                merchant="Nature's Basket",
                payment_method="Visa (..4892)",
                transaction_date=now - timedelta(days=2),
                status="Completed",
                flag_status="Normal",
                flag_reasons=[]
            )
            db.add(t3)
            db.flush()
            db.add(CardTransaction(
                transaction_id=t3.id,
                masked_card="**** **** **** 4892",
                merchant="Nature's Basket",
                category="Groceries",
                channel="POS",
                country="India",
                flag_status="Normal",
                flag_reasons=[],
                user_verification="Safe"
            ))
            db.add(Expense(
                user_id=user.id,
                transaction_id=t3.id,
                amount=3420.0,
                category="Groceries",
                merchant="Nature's Basket",
                payment_method="Card",
                date=t3.transaction_date,
                description="Organic groceries and pantry restock"
            ))

    db.commit()
