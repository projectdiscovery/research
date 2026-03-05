import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from ..database import get_db
from ..models.user import User, UserRole
from ..models.account import Account
from ..models.transaction import Transaction, TransactionType, TransactionStatus
from ..permissions import require_teller_up
from ..schemas.transaction import TransactionResponse
from ..schemas.account import AccountResponse

router = APIRouter(prefix="/teller", tags=["teller"])


def generate_reference() -> str:
    return "TXN" + str(uuid.uuid4()).replace("-", "").upper()[:12]


class TellerDepositRequest(BaseModel):
    account_id: int
    amount: Decimal
    description: str = "Teller deposit"


class TellerWithdrawalRequest(BaseModel):
    account_id: int
    amount: Decimal
    description: str = "Teller withdrawal"


class TellerTransferRequest(BaseModel):
    from_account_id: int
    to_account_number: str
    amount: Decimal
    description: str = "Teller transfer"


@router.get("/customers/search")
def search_customers(
    q: str = Query(..., min_length=2),
    current_user: User = require_teller_up,
    db: Session = Depends(get_db),
):
    users = db.query(User).filter(
        User.role == UserRole.customer,
        User.is_active == True,
        or_(
            User.first_name.ilike(f"%{q}%"),
            User.last_name.ilike(f"%{q}%"),
            User.email.ilike(f"%{q}%"),
        ),
    ).limit(20).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "account_tier": u.account_tier.value,
        }
        for u in users
    ]


@router.get("/customers/{user_id}/accounts", response_model=list[AccountResponse])
def get_customer_accounts(
    user_id: int,
    current_user: User = require_teller_up,
    db: Session = Depends(get_db),
):
    customer = db.query(User).filter(
        User.id == user_id, User.role == UserRole.customer
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db.query(Account).filter(Account.user_id == user_id, Account.is_active == True).all()


@router.get("/customers/{user_id}/transactions", response_model=list[TransactionResponse])
def get_customer_transactions(
    user_id: int,
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    current_user: User = require_teller_up,
    db: Session = Depends(get_db),
):
    customer = db.query(User).filter(
        User.id == user_id, User.role == UserRole.customer
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    account_ids = [a.id for a in db.query(Account).filter(Account.user_id == user_id).all()]
    return (
        db.query(Transaction)
        .filter(
            or_(
                Transaction.from_account_id.in_(account_ids),
                Transaction.to_account_id.in_(account_ids),
            )
        )
        .order_by(Transaction.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.post("/deposit", response_model=TransactionResponse)
def teller_deposit(
    data: TellerDepositRequest,
    current_user: User = require_teller_up,
    db: Session = Depends(get_db),
):
    account = db.query(Account).filter(
        Account.id == data.account_id, Account.is_active == True
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.is_frozen:
        raise HTTPException(status_code=400, detail="Account is frozen")

    amount = Decimal(str(data.amount))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    account.balance += amount
    txn = Transaction(
        to_account_id=account.id,
        transaction_type=TransactionType.deposit,
        amount=amount,
        balance_after=account.balance,
        description=data.description,
        reference_number=generate_reference(),
        status=TransactionStatus.completed,
        processed_by_id=current_user.id,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


@router.post("/withdrawal", response_model=TransactionResponse)
def teller_withdrawal(
    data: TellerWithdrawalRequest,
    current_user: User = require_teller_up,
    db: Session = Depends(get_db),
):
    account = db.query(Account).filter(
        Account.id == data.account_id, Account.is_active == True
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.is_frozen:
        raise HTTPException(status_code=400, detail="Account is frozen")

    amount = Decimal(str(data.amount))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    available = account.balance - (account.hold_amount or Decimal("0"))
    if available < amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    account.balance -= amount
    txn = Transaction(
        from_account_id=account.id,
        transaction_type=TransactionType.withdrawal,
        amount=amount,
        balance_after=account.balance,
        description=data.description,
        reference_number=generate_reference(),
        status=TransactionStatus.completed,
        processed_by_id=current_user.id,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


@router.post("/transfer", response_model=TransactionResponse)
def teller_transfer(
    data: TellerTransferRequest,
    current_user: User = require_teller_up,
    db: Session = Depends(get_db),
):
    from_account = db.query(Account).filter(
        Account.id == data.from_account_id, Account.is_active == True
    ).first()
    if not from_account:
        raise HTTPException(status_code=404, detail="Source account not found")
    if from_account.is_frozen:
        raise HTTPException(status_code=400, detail="Source account is frozen")

    to_account = db.query(Account).filter(
        Account.account_number == data.to_account_number, Account.is_active == True
    ).first()
    if not to_account:
        raise HTTPException(status_code=404, detail="Destination account not found")

    amount = Decimal(str(data.amount))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    available = from_account.balance - (from_account.hold_amount or Decimal("0"))
    if available < amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    from_account.balance -= amount
    to_account.balance += amount

    txn = Transaction(
        from_account_id=from_account.id,
        to_account_id=to_account.id,
        transaction_type=TransactionType.transfer,
        amount=amount,
        balance_after=from_account.balance,
        description=data.description,
        reference_number=generate_reference(),
        status=TransactionStatus.completed,
        processed_by_id=current_user.id,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn
