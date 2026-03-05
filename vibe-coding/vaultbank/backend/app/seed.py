"""
Seed script for VaultBank demo data.
Run: python -m app.seed
Run with reset: python -m app.seed --reset
"""
import sys
import random
import uuid
import json
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .database import SessionLocal, Base, engine
from .models.branch import Branch
from .models.user import User, KYCStatus, AccountTier, UserRole
from .models.account import Account, AccountType
from .models.transaction import Transaction, TransactionType, TransactionStatus
from .models.loan import Loan, LoanType, LoanStatus
from .models.loan_application import LoanApplication, LoanApplicationStatus, LoanPurpose
from .models.beneficiary import Beneficiary
from .models.system_settings import SystemSettings
from .models.notification import Notification, NotificationType
from .models.exchange_rate import ExchangeRate
from .models.scheduled_payment import ScheduledPayment, RecurrenceType
from .services.auth import get_password_hash


def generate_account_number(prefix="VB"):
    return prefix + "".join([str(random.randint(0, 9)) for _ in range(10)])


def generate_reference():
    return "TXN" + str(uuid.uuid4()).replace("-", "").upper()[:12]


def seed():
    db: Session = SessionLocal()
    try:
        print("Seeding VaultBank database...")

        # --- Branch ---
        branch = Branch(name="Main Branch", code="MB001", address="100 Financial District, New York, NY 10005")
        db.add(branch)
        db.commit()
        db.refresh(branch)

        # --- Staff Users ---
        admin_user = User(
            email="admin@vaultbank.com",
            hashed_password=get_password_hash("admin1234"),
            first_name="System",
            last_name="Admin",
            phone="+1 (555) 000-0100",
            date_of_birth="1980-01-01",
            kyc_status=KYCStatus.verified,
            account_tier=AccountTier.platinum,
            role=UserRole.admin,
        )
        db.add(admin_user)

        compliance_user = User(
            email="compliance@vaultbank.com",
            hashed_password=get_password_hash("demo1234"),
            first_name="Carol",
            last_name="Compliance",
            phone="+1 (555) 000-0200",
            date_of_birth="1978-03-15",
            kyc_status=KYCStatus.verified,
            account_tier=AccountTier.gold,
            role=UserRole.compliance_officer,
            branch_id=branch.id,
        )
        db.add(compliance_user)

        manager_user = User(
            email="manager@vaultbank.com",
            hashed_password=get_password_hash("demo1234"),
            first_name="Mike",
            last_name="Manager",
            phone="+1 (555) 000-0300",
            date_of_birth="1982-07-20",
            kyc_status=KYCStatus.verified,
            account_tier=AccountTier.gold,
            role=UserRole.branch_manager,
            branch_id=branch.id,
        )
        db.add(manager_user)

        teller1 = User(
            email="teller1@vaultbank.com",
            hashed_password=get_password_hash("demo1234"),
            first_name="Tanya",
            last_name="Teller",
            phone="+1 (555) 000-0401",
            date_of_birth="1995-05-10",
            kyc_status=KYCStatus.verified,
            account_tier=AccountTier.basic,
            role=UserRole.teller,
            branch_id=branch.id,
        )
        db.add(teller1)

        teller2 = User(
            email="teller2@vaultbank.com",
            hashed_password=get_password_hash("demo1234"),
            first_name="Tom",
            last_name="Teller",
            phone="+1 (555) 000-0402",
            date_of_birth="1997-11-22",
            kyc_status=KYCStatus.verified,
            account_tier=AccountTier.basic,
            role=UserRole.teller,
            branch_id=branch.id,
        )
        db.add(teller2)

        db.commit()
        for u in [admin_user, compliance_user, manager_user, teller1, teller2]:
            db.refresh(u)

        # --- Customer Users ---
        customers_data = [
            {
                "email": "alex.morgan@example.com",
                "password": "demo1234",
                "first_name": "Alex",
                "last_name": "Morgan",
                "phone": "+1 (555) 123-4567",
                "date_of_birth": "1990-04-15",
                "address": "742 Evergreen Terrace, Springfield, IL 62701",
                "kyc_status": KYCStatus.verified,
                "account_tier": AccountTier.platinum,
            },
            {
                "email": "sarah.chen@example.com",
                "password": "demo1234",
                "first_name": "Sarah",
                "last_name": "Chen",
                "phone": "+1 (555) 987-6543",
                "date_of_birth": "1988-09-22",
                "address": "1600 Pennsylvania Ave, Washington, DC 20500",
                "kyc_status": KYCStatus.verified,
                "account_tier": AccountTier.gold,
            },
            {
                "email": "demo@vaultbank.com",
                "password": "demo1234",
                "first_name": "Demo",
                "last_name": "User",
                "phone": "+1 (555) 000-0001",
                "date_of_birth": "1995-01-01",
                "address": "100 Main Street, New York, NY 10001",
                "kyc_status": KYCStatus.verified,
                "account_tier": AccountTier.silver,
            },
        ]

        customers = []
        for cd in customers_data:
            user = User(
                email=cd["email"],
                hashed_password=get_password_hash(cd["password"]),
                first_name=cd["first_name"],
                last_name=cd["last_name"],
                phone=cd["phone"],
                date_of_birth=cd["date_of_birth"],
                address=cd["address"],
                kyc_status=cd["kyc_status"],
                account_tier=cd["account_tier"],
                role=UserRole.customer,
            )
            db.add(user)
            customers.append(user)

        db.commit()
        for c in customers:
            db.refresh(c)

        # --- Accounts for Customers ---
        accounts = []
        balances = [
            (Decimal("48250.75"), Decimal("125000.00")),  # Alex
            (Decimal("12500.50"), Decimal("35000.00")),   # Sarah
            (Decimal("3200.00"), Decimal("8500.00")),     # Demo
        ]

        for i, customer in enumerate(customers):
            checking = Account(
                user_id=customer.id,
                account_number=generate_account_number(),
                account_type=AccountType.checking,
                balance=balances[i][0],
            )
            savings = Account(
                user_id=customer.id,
                account_number=generate_account_number(),
                account_type=AccountType.savings,
                balance=balances[i][1],
            )
            db.add(checking)
            db.add(savings)
            accounts.append((checking, savings))

        db.commit()
        for pair in accounts:
            for acc in pair:
                db.refresh(acc)

        demo_checking = accounts[2][0]
        demo_savings = accounts[2][1]
        alex_checking = accounts[0][0]
        sarah_checking = accounts[1][0]

        # --- Transactions for Demo User ---
        transaction_templates = [
            (TransactionType.deposit, Decimal("5000.00"), "Salary deposit - VaultCorp Inc.", None, demo_checking.id),
            (TransactionType.deposit, Decimal("2500.00"), "Salary deposit - VaultCorp Inc.", None, demo_checking.id),
            (TransactionType.bill_payment, Decimal("150.00"), "Netflix subscription", demo_checking.id, None),
            (TransactionType.bill_payment, Decimal("89.99"), "Internet bill - FiberNet", demo_checking.id, None),
            (TransactionType.transfer, Decimal("500.00"), "Transfer to savings", demo_checking.id, demo_savings.id),
            (TransactionType.bill_payment, Decimal("220.00"), "Electricity bill", demo_checking.id, None),
            (TransactionType.deposit, Decimal("300.00"), "Freelance payment", None, demo_checking.id),
            (TransactionType.transfer, Decimal("1000.00"), "Transfer to savings", demo_checking.id, demo_savings.id),
            (TransactionType.bill_payment, Decimal("45.00"), "Spotify + Apple Music", demo_checking.id, None),
            (TransactionType.transfer, Decimal("200.00"), "Transfer to Alex", demo_checking.id, alex_checking.id),
            (TransactionType.deposit, Decimal("5000.00"), "Salary deposit - VaultCorp Inc.", None, demo_checking.id),
            (TransactionType.bill_payment, Decimal("1200.00"), "Rent payment", demo_checking.id, None),
            (TransactionType.bill_payment, Decimal("85.00"), "Phone bill", demo_checking.id, None),
            (TransactionType.deposit, Decimal("150.00"), "Cashback reward", None, demo_savings.id),
            (TransactionType.bill_payment, Decimal("55.00"), "Gym membership", demo_checking.id, None),
        ]

        now = datetime.utcnow()
        all_txns = []
        for i, (txn_type, amount, desc, from_id, to_id) in enumerate(transaction_templates):
            days_ago = i * 2 + random.randint(0, 1)
            txn = Transaction(
                from_account_id=from_id,
                to_account_id=to_id,
                transaction_type=txn_type,
                amount=amount,
                balance_after=demo_checking.balance,
                description=desc,
                reference_number=generate_reference(),
                status=TransactionStatus.completed,
                created_at=now - timedelta(days=days_ago),
            )
            db.add(txn)
            all_txns.append(txn)

        db.commit()
        for t in all_txns:
            db.refresh(t)

        # --- 2 Pending Approval Transactions ---
        pending_txn1 = Transaction(
            from_account_id=demo_checking.id,
            to_account_id=alex_checking.id,
            transaction_type=TransactionType.transfer,
            amount=Decimal("15000.00"),
            description="Large transfer to Alex Morgan",
            reference_number=generate_reference(),
            status=TransactionStatus.pending_approval,
            requires_approval=True,
            created_at=now - timedelta(hours=3),
        )
        demo_checking.hold_amount = Decimal("15000.00")

        pending_txn2 = Transaction(
            from_account_id=accounts[1][0].id,  # Sarah's checking
            to_account_id=alex_checking.id,
            transaction_type=TransactionType.transfer,
            amount=Decimal("25000.00"),
            description="Business payment to Alex Morgan",
            reference_number=generate_reference(),
            status=TransactionStatus.pending_approval,
            requires_approval=True,
            created_at=now - timedelta(hours=1),
        )
        accounts[1][0].hold_amount = Decimal("25000.00")

        db.add(pending_txn1)
        db.add(pending_txn2)
        db.commit()
        db.refresh(pending_txn1)
        db.refresh(pending_txn2)

        # --- 3 Flagged Transactions ---
        flagged_txn1 = Transaction(
            from_account_id=alex_checking.id,
            transaction_type=TransactionType.withdrawal,
            amount=Decimal("12500.00"),
            description="Cash withdrawal",
            reference_number=generate_reference(),
            status=TransactionStatus.completed,
            is_flagged=True,
            flag_reason="Large cash withdrawal - requires review",
            flagged_by_id=compliance_user.id,
            flagged_at=now - timedelta(days=2),
            created_at=now - timedelta(days=3),
        )
        flagged_txn2 = Transaction(
            from_account_id=sarah_checking.id,
            to_account_id=alex_checking.id,
            transaction_type=TransactionType.transfer,
            amount=Decimal("9999.00"),
            description="Transfer - just under reporting threshold",
            reference_number=generate_reference(),
            status=TransactionStatus.completed,
            is_flagged=True,
            flag_reason="Structuring - transfer just under $10k threshold",
            flagged_by_id=compliance_user.id,
            flagged_at=now - timedelta(days=1),
            created_at=now - timedelta(days=2),
        )
        flagged_txn3 = Transaction(
            from_account_id=demo_checking.id,
            transaction_type=TransactionType.bill_payment,
            amount=Decimal("5000.00"),
            description="International wire transfer",
            reference_number=generate_reference(),
            status=TransactionStatus.completed,
            is_flagged=True,
            flag_reason="Unusual international payment pattern",
            flagged_by_id=compliance_user.id,
            flagged_at=now - timedelta(hours=6),
            created_at=now - timedelta(hours=12),
        )
        db.add_all([flagged_txn1, flagged_txn2, flagged_txn3])

        # --- Loan for Demo User ---
        loan = Loan(
            user_id=customers[2].id,
            loan_type=LoanType.personal,
            principal_amount=Decimal("15000.00"),
            outstanding_balance=Decimal("12450.00"),
            interest_rate=Decimal("12.5"),
            term_months=36,
            monthly_payment=Decimal("501.96"),
            status=LoanStatus.active,
            start_date=now - timedelta(days=180),
            end_date=now + timedelta(days=900),
        )
        db.add(loan)

        # --- Beneficiaries for Demo User ---
        beneficiaries_data = [
            ("Alex Morgan", alex_checking.account_number, "VaultBank", "021000021"),
            ("Jane Smith", "VB" + "8273645910", "Chase Bank", "021000089"),
            ("Bob Johnson", "VB" + "3948576201", "Bank of America", "026009593"),
        ]
        for name, acc_num, bank, routing in beneficiaries_data:
            b = Beneficiary(
                user_id=customers[2].id,
                name=name,
                account_number=acc_num,
                bank_name=bank,
                routing_number=routing,
            )
            db.add(b)

        # --- System Settings ---
        settings_defaults = [
            ("max_auto_approve_amount", "10000", "Maximum transfer amount that auto-approves (no manager review)"),
            ("daily_transfer_limit_customer", "50000", "Daily transfer limit per customer"),
            ("withdrawal_fee_pct", "0", "Withdrawal fee percentage"),
            ("international_wire_fee", "25", "International wire transfer fee in USD"),
            ("savings_apy", "4.5", "Savings account annual percentage yield"),
            ("dual_approval_threshold", "50000", "Transfers above this amount require two manager approvals"),
        ]
        for key, value, desc in settings_defaults:
            s = SystemSettings(key=key, value=value, description=desc)
            db.add(s)

        db.commit()

        # --- Exchange Rates ---
        rates = [
            ("USD", "EUR", "0.919500"),
            ("EUR", "USD", "1.087500"),
            ("USD", "GBP", "0.788500"),
            ("GBP", "USD", "1.268200"),
            ("EUR", "GBP", "0.857300"),
            ("GBP", "EUR", "1.166500"),
            ("USD", "CAD", "1.368000"),
            ("CAD", "USD", "0.731000"),
            ("USD", "AUD", "1.532000"),
            ("AUD", "USD", "0.653000"),
        ]
        for from_cur, to_cur, rate in rates:
            er = ExchangeRate(
                from_currency=from_cur,
                to_currency=to_cur,
                rate=Decimal(rate),
                updated_by_id=admin_user.id,
            )
            db.add(er)

        # --- Loan Applications ---
        loan_app1 = LoanApplication(
            user_id=customers[2].id,  # Demo user
            disburse_to_account_id=demo_checking.id,
            amount=Decimal("20000.00"),
            term_months=36,
            purpose=LoanPurpose.personal,
            description="Home renovation project",
            annual_income=Decimal("75000.00"),
            employment_status="employed",
            status=LoanApplicationStatus.auto_scored,
            credit_score=720,
            risk_level="low",
            interest_rate=Decimal("5.9"),
            monthly_payment=Decimal("607.93"),
            created_at=now - timedelta(days=2),
        )
        loan_app2 = LoanApplication(
            user_id=customers[0].id,  # Alex
            disburse_to_account_id=alex_checking.id,
            amount=Decimal("50000.00"),
            term_months=60,
            purpose=LoanPurpose.business,
            description="Small business expansion",
            annual_income=Decimal("120000.00"),
            employment_status="self_employed",
            status=LoanApplicationStatus.compliance_review,
            credit_score=780,
            risk_level="low",
            interest_rate=Decimal("6.5"),
            monthly_payment=Decimal("966.64"),
            created_at=now - timedelta(days=5),
        )
        db.add_all([loan_app1, loan_app2])

        # --- Scheduled Payments for Demo User ---
        sp1 = ScheduledPayment(
            user_id=customers[2].id,
            from_account_id=demo_checking.id,
            to_account_number=sarah_checking.account_number,
            amount=Decimal("500.00"),
            description="Monthly rent contribution",
            recurrence=RecurrenceType.monthly,
            next_run_at=now + timedelta(days=10),
            is_active=True,
        )
        sp2 = ScheduledPayment(
            user_id=customers[2].id,
            from_account_id=demo_checking.id,
            to_account_number=alex_checking.account_number,
            amount=Decimal("100.00"),
            description="Weekly savings transfer",
            recurrence=RecurrenceType.weekly,
            next_run_at=now + timedelta(days=3),
            is_active=True,
        )
        db.add_all([sp1, sp2])

        db.commit()

        # --- Seed Notifications (10) ---
        demo_user = customers[2]
        notifications_data = [
            (demo_user.id, "Welcome to VaultBank!", "Your account has been successfully created.", NotificationType.system, True),
            (demo_user.id, "KYC Verified", "Your identity has been verified. All features are now available.", NotificationType.system, True),
            (demo_user.id, "Deposit Received", "Salary deposit of $5,000.00 has been credited.", NotificationType.transaction, True),
            (demo_user.id, "Transfer Pending", "Your $15,000 transfer requires manager approval.", NotificationType.approval, False),
            (demo_user.id, "Security Alert", "New login detected from New York, NY.", NotificationType.alert, False),
            (manager_user.id, "Approval Required", "A $15,000 transfer from Demo User requires your approval.", NotificationType.approval, False),
            (manager_user.id, "Approval Required", "A $25,000 transfer from Sarah Chen requires your approval.", NotificationType.approval, False),
            (compliance_user.id, "Suspicious Activity", "3 transactions have been flagged for review.", NotificationType.compliance, False),
            (compliance_user.id, "Account Monitoring", "Large withdrawal pattern detected on account.", NotificationType.compliance, True),
            (admin_user.id, "System Health", "All systems operational. 6 active users.", NotificationType.system, True),
        ]

        for user_id, title, message, n_type, is_read in notifications_data:
            n = Notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=n_type,
                is_read=is_read,
                created_at=now - timedelta(hours=random.randint(1, 48)),
            )
            db.add(n)

        db.commit()

        print("\nSeed complete!")
        print("\n=== Demo Accounts ===")
        print(f"  Admin:      admin@vaultbank.com   / admin1234")
        print(f"  Compliance: compliance@vaultbank.com / demo1234")
        print(f"  Manager:    manager@vaultbank.com  / demo1234")
        print(f"  Teller 1:   teller1@vaultbank.com  / demo1234")
        print(f"  Teller 2:   teller2@vaultbank.com  / demo1234")
        print(f"  Customer:   demo@vaultbank.com     / demo1234")
        print(f"  Customer:   alex.morgan@example.com / demo1234")
        print(f"  Customer:   sarah.chen@example.com  / demo1234")

    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


def reset_and_seed():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Recreating tables...")
    Base.metadata.create_all(bind=engine)
    seed()


if __name__ == "__main__":
    if "--reset" in sys.argv:
        reset_and_seed()
    else:
        db = SessionLocal()
        count = db.query(User).count()
        db.close()
        if count > 0:
            print("Database already has data. Use --reset to reseed.")
        else:
            seed()
