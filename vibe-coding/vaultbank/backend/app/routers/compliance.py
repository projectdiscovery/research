from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from ..database import get_db
from ..models.user import User
from ..models.account import Account
from ..models.transaction import Transaction, TransactionStatus
from ..permissions import require_compliance_up
from ..schemas.transaction import TransactionResponse
from ..schemas.account import AccountResponse

router = APIRouter(prefix="/compliance", tags=["compliance"])


class FlagRequest(BaseModel):
    reason: str


class HoldRequest(BaseModel):
    reason: str


@router.get("/transactions", response_model=list[TransactionResponse])
def list_transactions(
    flagged: Optional[bool] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    _: User = require_compliance_up,
    db: Session = Depends(get_db),
):
    q = db.query(Transaction)
    if flagged is True:
        q = q.filter(Transaction.is_flagged == True)
    elif flagged is False:
        q = q.filter(Transaction.is_flagged == False)
    return q.order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()


@router.post("/transactions/{txn_id}/flag")
def flag_transaction(
    txn_id: int,
    body: FlagRequest,
    current_user: User = require_compliance_up,
    db: Session = Depends(get_db),
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    txn.is_flagged = True
    txn.flag_reason = body.reason
    txn.flagged_by_id = current_user.id
    txn.flagged_at = datetime.utcnow()
    db.commit()
    return {"id": txn.id, "is_flagged": True, "flag_reason": body.reason}


@router.delete("/transactions/{txn_id}/flag")
def unflag_transaction(
    txn_id: int,
    current_user: User = require_compliance_up,
    db: Session = Depends(get_db),
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    txn.is_flagged = False
    txn.flag_reason = None
    txn.flagged_by_id = None
    txn.flagged_at = None
    db.commit()
    return {"id": txn.id, "is_flagged": False}


@router.post("/accounts/{account_id}/hold")
def place_hold(
    account_id: int,
    body: HoldRequest,
    current_user: User = require_compliance_up,
    db: Session = Depends(get_db),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.is_frozen = True
    account.freeze_reason = f"[Compliance] {body.reason}"
    account.frozen_by_id = current_user.id
    account.frozen_at = datetime.utcnow()
    db.commit()
    return {"id": account.id, "is_frozen": True, "freeze_reason": account.freeze_reason}


@router.delete("/accounts/{account_id}/hold")
def remove_hold(
    account_id: int,
    current_user: User = require_compliance_up,
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


@router.get("/audit-trail", response_model=list[TransactionResponse])
def get_audit_trail(
    account_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    _: User = require_compliance_up,
    db: Session = Depends(get_db),
):
    q = db.query(Transaction)

    if account_id:
        q = q.filter(
            or_(
                Transaction.from_account_id == account_id,
                Transaction.to_account_id == account_id,
            )
        )

    if user_id:
        account_ids = [
            a.id for a in db.query(Account).filter(Account.user_id == user_id).all()
        ]
        q = q.filter(
            or_(
                Transaction.from_account_id.in_(account_ids),
                Transaction.to_account_id.in_(account_ids),
            )
        )

    if from_date:
        try:
            q = q.filter(Transaction.created_at >= datetime.fromisoformat(from_date))
        except ValueError:
            pass

    if to_date:
        try:
            q = q.filter(Transaction.created_at <= datetime.fromisoformat(to_date))
        except ValueError:
            pass

    return q.order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/reports/suspicious")
def suspicious_activity_report(
    _: User = require_compliance_up,
    db: Session = Depends(get_db),
):
    from decimal import Decimal

    large_txns = (
        db.query(Transaction)
        .filter(Transaction.amount > Decimal("10000"))
        .order_by(Transaction.created_at.desc())
        .limit(50)
        .all()
    )

    flagged_txns = (
        db.query(Transaction)
        .filter(Transaction.is_flagged == True)
        .order_by(Transaction.created_at.desc())
        .limit(50)
        .all()
    )

    frozen_accounts = db.query(Account).filter(Account.is_frozen == True).all()

    def txn_to_dict(t):
        return {
            "id": t.id,
            "reference_number": t.reference_number,
            "amount": float(t.amount),
            "status": t.status.value,
            "transaction_type": t.transaction_type.value,
            "description": t.description,
            "is_flagged": t.is_flagged,
            "flag_reason": t.flag_reason,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }

    return {
        "large_transactions": [txn_to_dict(t) for t in large_txns],
        "flagged_transactions": [txn_to_dict(t) for t in flagged_txns],
        "frozen_accounts": [
            {
                "id": a.id,
                "account_number": a.account_number,
                "account_type": a.account_type.value,
                "balance": float(a.balance),
                "freeze_reason": a.freeze_reason,
                "frozen_at": a.frozen_at.isoformat() if a.frozen_at else None,
            }
            for a in frozen_accounts
        ],
    }
