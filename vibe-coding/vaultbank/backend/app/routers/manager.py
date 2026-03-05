from datetime import datetime
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from pydantic import BaseModel
from ..database import get_db
from ..models.user import User, UserRole
from ..models.account import Account
from ..models.transaction import Transaction, TransactionStatus, TransactionType
from ..models.notification import NotificationType
from ..permissions import require_manager_up
from ..schemas.transaction import TransactionResponse
from ..schemas.account import AccountResponse
from ..services.notifications import notification_manager

router = APIRouter(prefix="/manager", tags=["manager"])


class FreezeRequest(BaseModel):
    reason: str


class RejectRequest(BaseModel):
    reason: Optional[str] = "Rejected by branch manager"


@router.get("/approvals", response_model=list[TransactionResponse])
def get_pending_approvals(
    current_user: User = require_manager_up,
    db: Session = Depends(get_db),
):
    return (
        db.query(Transaction)
        .filter(Transaction.status == TransactionStatus.pending_approval)
        .order_by(Transaction.created_at.desc())
        .all()
    )


@router.post("/approvals/{txn_id}/approve", response_model=TransactionResponse)
async def approve_transaction(
    txn_id: int,
    current_user: User = require_manager_up,
    db: Session = Depends(get_db),
):
    txn = db.query(Transaction).filter(
        Transaction.id == txn_id,
        Transaction.status == TransactionStatus.pending_approval,
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Pending transaction not found")

    # ── Dual-approval logic ────────────────────────────────────────────
    if txn.requires_dual_approval:
        if txn.first_approved_by_id is None:
            # First approval
            txn.first_approved_by_id = current_user.id
            txn.first_approved_at = datetime.utcnow()
            db.commit()
            db.refresh(txn)
            # Notify other managers
            managers = db.query(User).filter(
                User.role.in_([UserRole.branch_manager]),
                User.is_active == True,
                User.id != current_user.id,
            ).all()
            for mgr in managers:
                await notification_manager.create_and_push(
                    db=db,
                    user_id=mgr.id,
                    title="Second Approval Needed",
                    message=f"Transaction #{txn.id} of ${float(txn.amount):,.2f} has one approval and needs a second manager to approve.",
                    notification_type=NotificationType.approval,
                    data={"transaction_id": txn.id},
                )
            return txn
        elif txn.first_approved_by_id == current_user.id:
            raise HTTPException(status_code=400, detail="You already provided the first approval. A different manager must provide the second.")
        # Second approval — fall through to execute transfer

    from_account = db.query(Account).filter(Account.id == txn.from_account_id).first()
    to_account = db.query(Account).filter(Account.id == txn.to_account_id).first()

    if not from_account or not to_account:
        raise HTTPException(status_code=400, detail="Associated accounts not found")

    amount = txn.amount
    if from_account.balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    from_account.balance -= amount
    from_account.hold_amount = max(
        Decimal("0"), (from_account.hold_amount or Decimal("0")) - amount
    )
    to_account.balance += amount

    txn.status = TransactionStatus.completed
    txn.approved_by_id = current_user.id
    txn.approved_at = datetime.utcnow()
    txn.balance_after = from_account.balance
    db.commit()
    db.refresh(txn)

    # Notify account owner
    customer_account = db.query(Account).filter(Account.id == txn.from_account_id).first()
    if customer_account:
        await notification_manager.create_and_push(
            db=db,
            user_id=customer_account.user_id,
            title="Transfer Approved",
            message=f"Your ${float(amount):,.2f} transfer has been approved and processed.",
            notification_type=NotificationType.approval,
            data={"transaction_id": txn.id, "amount": str(amount)},
        )
    return txn


@router.post("/approvals/{txn_id}/reject", response_model=TransactionResponse)
async def reject_transaction(
    txn_id: int,
    body: RejectRequest,
    current_user: User = require_manager_up,
    db: Session = Depends(get_db),
):
    txn = db.query(Transaction).filter(
        Transaction.id == txn_id,
        Transaction.status == TransactionStatus.pending_approval,
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Pending transaction not found")

    from_account = db.query(Account).filter(Account.id == txn.from_account_id).first()
    if from_account:
        from_account.hold_amount = max(
            Decimal("0"), (from_account.hold_amount or Decimal("0")) - txn.amount
        )

    txn.status = TransactionStatus.rejected
    txn.notes = body.reason
    db.commit()
    db.refresh(txn)

    if from_account:
        await notification_manager.create_and_push(
            db=db,
            user_id=from_account.user_id,
            title="Transfer Rejected",
            message=f"Your ${float(txn.amount):,.2f} transfer was rejected. {body.reason}",
            notification_type=NotificationType.alert,
            data={"transaction_id": txn.id},
        )
    return txn


@router.get("/analytics")
def get_analytics(
    current_user: User = require_manager_up,
    db: Session = Depends(get_db),
):
    pending = db.query(Transaction).filter(
        Transaction.status == TransactionStatus.pending_approval
    ).count()

    completed_volume = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == TransactionStatus.completed
    ).scalar()

    tellers = db.query(User).filter(
        User.role.in_([UserRole.teller]),
        User.branch_id == current_user.branch_id,
        User.is_active == True,
    ).all()

    return {
        "pending_approvals": pending,
        "completed_volume": float(completed_volume or 0),
        "tellers": [
            {"id": t.id, "name": f"{t.first_name} {t.last_name}", "email": t.email}
            for t in tellers
        ],
    }


@router.get("/tellers")
def get_branch_tellers(
    current_user: User = require_manager_up,
    db: Session = Depends(get_db),
):
    tellers = db.query(User).filter(
        User.role == UserRole.teller,
        User.branch_id == current_user.branch_id,
        User.is_active == True,
    ).all()
    return [
        {"id": t.id, "name": f"{t.first_name} {t.last_name}", "email": t.email}
        for t in tellers
    ]


@router.get("/accounts/search")
def search_accounts(
    q: str = Query(..., min_length=2),
    current_user: User = require_manager_up,
    db: Session = Depends(get_db),
):
    accounts = (
        db.query(Account)
        .filter(Account.account_number.ilike(f"%{q}%"))
        .limit(20)
        .all()
    )
    return [
        {
            "id": a.id,
            "account_number": a.account_number,
            "account_type": a.account_type.value,
            "balance": float(a.balance),
            "is_frozen": a.is_frozen,
            "freeze_reason": a.freeze_reason,
            "user_id": a.user_id,
        }
        for a in accounts
    ]


@router.post("/accounts/{account_id}/freeze")
def freeze_account(
    account_id: int,
    body: FreezeRequest,
    current_user: User = require_manager_up,
    db: Session = Depends(get_db),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.is_frozen = True
    account.freeze_reason = body.reason
    account.frozen_by_id = current_user.id
    account.frozen_at = datetime.utcnow()
    db.commit()
    return {"id": account.id, "is_frozen": True, "freeze_reason": body.reason}


@router.post("/accounts/{account_id}/unfreeze")
def unfreeze_account(
    account_id: int,
    current_user: User = require_manager_up,
    db: Session = Depends(get_db),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.is_frozen = False
    account.freeze_reason = None
    account.frozen_by_id = None
    account.frozen_at = None
    db.commit()
    return {"id": account.id, "is_frozen": False}
