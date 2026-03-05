import uuid
from decimal import Decimal
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models.account import Account
from ..models.transaction import Transaction, TransactionType, TransactionStatus
from ..models.system_settings import SystemSettings
from ..models.user import User, UserRole
from ..models.notification import NotificationType
from ..schemas.transaction import TransactionResponse, TransferRequest, BillPayRequest
from .auth import get_current_user
from ..services.notifications import notification_manager

router = APIRouter(prefix="/transactions", tags=["transactions"])


def generate_reference() -> str:
    return "TXN" + str(uuid.uuid4()).replace("-", "").upper()[:12]


def get_setting_value(db: Session, key: str, default: str = "0") -> str:
    s = db.query(SystemSettings).filter(SystemSettings.key == key).first()
    return s.value if s else default


@router.get("/", response_model=list[TransactionResponse])
def get_transactions(
    account_id: int = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    search: str = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_account_ids = [
        a.id for a in db.query(Account).filter(Account.user_id == current_user.id).all()
    ]

    query = db.query(Transaction).filter(
        or_(
            Transaction.from_account_id.in_(user_account_ids),
            Transaction.to_account_id.in_(user_account_ids),
        )
    )

    if account_id:
        if account_id not in user_account_ids:
            raise HTTPException(status_code=403, detail="Access denied")
        query = query.filter(
            or_(
                Transaction.from_account_id == account_id,
                Transaction.to_account_id == account_id,
            )
        )

    if search:
        query = query.filter(
            or_(
                Transaction.description.ilike(f"%{search}%"),
                Transaction.reference_number.ilike(f"%{search}%"),
            )
        )

    return query.order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()


@router.post("/transfer", response_model=TransactionResponse)
async def transfer_money(
    transfer: TransferRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from_account = db.query(Account).filter(
        Account.id == transfer.from_account_id,
        Account.user_id == current_user.id,
        Account.is_active == True,
    ).first()
    if not from_account:
        raise HTTPException(status_code=404, detail="Source account not found")
    if from_account.is_frozen:
        raise HTTPException(status_code=400, detail="Source account is frozen")

    to_account = db.query(Account).filter(
        Account.account_number == transfer.to_account_number,
        Account.is_active == True,
    ).first()
    if not to_account:
        raise HTTPException(status_code=404, detail="Destination account not found")

    if from_account.id == to_account.id:
        raise HTTPException(status_code=400, detail="Cannot transfer to the same account")

    amount = Decimal(str(transfer.amount))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Transfer amount must be positive")

    available = from_account.balance - (from_account.hold_amount or Decimal("0"))
    if available < amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    max_auto = Decimal(get_setting_value(db, "max_auto_approve_amount", "10000"))
    dual_threshold = Decimal(get_setting_value(db, "dual_approval_threshold", "50000"))

    if amount > max_auto and current_user.role == UserRole.customer:
        # Place on hold and queue for approval
        from_account.hold_amount = (from_account.hold_amount or Decimal("0")) + amount
        needs_dual = amount >= dual_threshold

        txn = Transaction(
            from_account_id=from_account.id,
            to_account_id=to_account.id,
            transaction_type=TransactionType.transfer,
            amount=amount,
            description=transfer.description or f"Transfer to {to_account.account_number}",
            reference_number=generate_reference(),
            status=TransactionStatus.pending_approval,
            requires_approval=True,
            requires_dual_approval=needs_dual,
        )
        db.add(txn)
        db.commit()
        db.refresh(txn)

        # Notify branch managers
        managers = db.query(User).filter(
            User.role == UserRole.branch_manager,
            User.is_active == True,
        ).all()
        title = "Large Transfer — Dual Approval Required" if needs_dual else "Large Transfer Pending Approval"
        msg = f"${amount:,.2f} transfer requires {'TWO manager approvals' if needs_dual else 'approval'}."
        for mgr in managers:
            await notification_manager.create_and_push(
                db=db,
                user_id=mgr.id,
                title=title,
                message=msg,
                notification_type=NotificationType.approval,
                data={"transaction_id": txn.id, "amount": str(amount)},
            )
        return txn

    # Normal transfer
    from_account.balance -= amount
    to_account.balance += amount

    txn = Transaction(
        from_account_id=from_account.id,
        to_account_id=to_account.id,
        transaction_type=TransactionType.transfer,
        amount=amount,
        balance_after=from_account.balance,
        description=transfer.description or f"Transfer to {to_account.account_number}",
        reference_number=generate_reference(),
        status=TransactionStatus.completed,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


@router.post("/deposit/{account_id}", response_model=TransactionResponse)
def deposit(
    account_id: int,
    amount: Decimal,
    description: str = "Deposit",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id,
        Account.is_active == True,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.is_frozen:
        raise HTTPException(status_code=400, detail="Account is frozen")

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive")

    account.balance += amount
    txn = Transaction(
        to_account_id=account.id,
        transaction_type=TransactionType.deposit,
        amount=amount,
        balance_after=account.balance,
        description=description,
        reference_number=generate_reference(),
        status=TransactionStatus.completed,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


@router.post("/bill-pay", response_model=TransactionResponse)
def bill_pay(
    data: BillPayRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    account = db.query(Account).filter(
        Account.id == data.from_account_id,
        Account.user_id == current_user.id,
        Account.is_active == True,
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
    desc = f"{data.biller_name} ({data.biller_category}) - Acct: {data.account_number}"
    if data.reference:
        desc += f" Ref: {data.reference}"

    txn = Transaction(
        from_account_id=account.id,
        transaction_type=TransactionType.bill_payment,
        amount=amount,
        balance_after=account.balance,
        description=desc,
        reference_number=generate_reference(),
        status=TransactionStatus.completed,
        notes=f"Due: {data.due_date}" if data.due_date else None,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn
