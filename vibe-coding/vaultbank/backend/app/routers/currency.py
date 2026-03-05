from datetime import datetime
from decimal import Decimal
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models.user import User
from ..models.account import Account
from ..models.exchange_rate import ExchangeRate, SUPPORTED_CURRENCIES
from ..models.transaction import Transaction, TransactionType, TransactionStatus
from ..permissions import require_admin
from .auth import get_current_user

router = APIRouter(prefix="/currency", tags=["currency"])


class RateUpdateRequest(BaseModel):
    from_currency: str
    to_currency: str
    rate: float


class ConvertRequest(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: float
    description: Optional[str] = None


def _get_rate(db: Session, from_cur: str, to_cur: str) -> Optional[Decimal]:
    if from_cur == to_cur:
        return Decimal("1")
    er = db.query(ExchangeRate).filter(
        ExchangeRate.from_currency == from_cur,
        ExchangeRate.to_currency == to_cur,
    ).first()
    return Decimal(str(er.rate)) if er else None


@router.get("/rates")
def get_rates(db: Session = Depends(get_db)):
    rates = db.query(ExchangeRate).all()
    return [
        {
            "from_currency": r.from_currency,
            "to_currency": r.to_currency,
            "rate": float(r.rate),
            "updated_at": r.updated_at.isoformat(),
        }
        for r in rates
    ]


@router.get("/supported")
def supported_currencies():
    return SUPPORTED_CURRENCIES


@router.post("/rates")
def upsert_rate(
    body: RateUpdateRequest,
    current_user: User = require_admin,
    db: Session = Depends(get_db),
):
    if body.from_currency not in SUPPORTED_CURRENCIES or body.to_currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail="Unsupported currency")
    if body.from_currency == body.to_currency:
        raise HTTPException(status_code=400, detail="Same currency")
    if body.rate <= 0:
        raise HTTPException(status_code=400, detail="Rate must be positive")

    er = db.query(ExchangeRate).filter(
        ExchangeRate.from_currency == body.from_currency,
        ExchangeRate.to_currency == body.to_currency,
    ).first()

    if er:
        er.rate = Decimal(str(body.rate))
        er.updated_by_id = current_user.id
        er.updated_at = datetime.utcnow()
    else:
        er = ExchangeRate(
            from_currency=body.from_currency,
            to_currency=body.to_currency,
            rate=Decimal(str(body.rate)),
            updated_by_id=current_user.id,
        )
        db.add(er)

    db.commit()
    db.refresh(er)
    return {"from_currency": er.from_currency, "to_currency": er.to_currency, "rate": float(er.rate)}


@router.post("/convert")
def convert_currency(
    body: ConvertRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from_account = db.query(Account).filter(
        Account.id == body.from_account_id,
        Account.user_id == current_user.id,
        Account.is_active == True,
        Account.is_frozen == False,
    ).first()
    if not from_account:
        raise HTTPException(status_code=404, detail="Source account not found")

    to_account = db.query(Account).filter(
        Account.id == body.to_account_id,
        Account.user_id == current_user.id,
        Account.is_active == True,
        Account.is_frozen == False,
    ).first()
    if not to_account:
        raise HTTPException(status_code=404, detail="Destination account not found")

    if from_account.id == to_account.id:
        raise HTTPException(status_code=400, detail="Cannot convert within same account")

    if from_account.currency == to_account.currency:
        raise HTTPException(status_code=400, detail="Accounts already share the same currency")

    amount = Decimal(str(body.amount))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    available = from_account.balance - (from_account.hold_amount or Decimal("0"))
    if available < amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    rate = _get_rate(db, from_account.currency, to_account.currency)
    if not rate:
        raise HTTPException(status_code=400, detail=f"No exchange rate for {from_account.currency} → {to_account.currency}")

    converted = (amount * rate).quantize(Decimal("0.01"))

    from_account.balance -= amount
    to_account.balance += converted

    ref = "FX" + str(uuid.uuid4()).replace("-", "").upper()[:12]
    txn = Transaction(
        from_account_id=from_account.id,
        to_account_id=to_account.id,
        transaction_type=TransactionType.fx_conversion,
        amount=amount,
        original_amount=amount,
        exchange_rate_used=rate,
        currency=from_account.currency,
        balance_after=from_account.balance,
        description=body.description or f"FX: {from_account.currency} → {to_account.currency} @ {float(rate):.4f}",
        reference_number=ref,
        status=TransactionStatus.completed,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)

    return {
        "transaction_id": txn.id,
        "from_currency": from_account.currency,
        "to_currency": to_account.currency,
        "deducted": float(amount),
        "credited": float(converted),
        "rate": float(rate),
        "reference": ref,
    }


@router.get("/quote")
def get_quote(
    from_currency: str,
    to_currency: str,
    amount: float,
    db: Session = Depends(get_db),
):
    rate = _get_rate(db, from_currency, to_currency)
    if not rate:
        raise HTTPException(status_code=404, detail="Exchange rate not found")
    converted = float(Decimal(str(amount)) * rate)
    return {
        "from_currency": from_currency,
        "to_currency": to_currency,
        "amount": amount,
        "converted": round(converted, 2),
        "rate": float(rate),
    }
