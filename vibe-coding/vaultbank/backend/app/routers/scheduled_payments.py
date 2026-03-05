from datetime import datetime
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models.user import User
from ..models.account import Account
from ..models.scheduled_payment import ScheduledPayment, RecurrenceType
from .auth import get_current_user

router = APIRouter(prefix="/scheduled-payments", tags=["scheduled-payments"])


class ScheduledPaymentCreate(BaseModel):
    from_account_id: int
    to_account_number: str
    amount: float
    description: Optional[str] = None
    recurrence: RecurrenceType = RecurrenceType.one_time
    scheduled_for: str  # ISO datetime string


class ScheduledPaymentUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    recurrence: Optional[RecurrenceType] = None
    scheduled_for: Optional[str] = None
    is_active: Optional[bool] = None


def _sp_to_dict(sp: ScheduledPayment) -> dict:
    return {
        "id": sp.id,
        "from_account_id": sp.from_account_id,
        "to_account_number": sp.to_account_number,
        "amount": float(sp.amount),
        "description": sp.description,
        "recurrence": sp.recurrence.value,
        "next_run_at": sp.next_run_at.isoformat(),
        "last_run_at": sp.last_run_at.isoformat() if sp.last_run_at else None,
        "is_active": sp.is_active,
        "failure_count": sp.failure_count,
        "last_failure_reason": sp.last_failure_reason,
        "created_at": sp.created_at.isoformat(),
    }


@router.get("/")
def list_scheduled_payments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payments = (
        db.query(ScheduledPayment)
        .filter(ScheduledPayment.user_id == current_user.id)
        .order_by(ScheduledPayment.next_run_at.asc())
        .all()
    )
    return [_sp_to_dict(sp) for sp in payments]


@router.post("/")
def create_scheduled_payment(
    body: ScheduledPaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify account ownership
    account = db.query(Account).filter(
        Account.id == body.from_account_id,
        Account.user_id == current_user.id,
        Account.is_active == True,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Source account not found")

    # Verify destination account exists
    to_account = db.query(Account).filter(
        Account.account_number == body.to_account_number,
    ).first()
    if not to_account:
        raise HTTPException(status_code=404, detail="Destination account not found")

    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    try:
        scheduled_dt = datetime.fromisoformat(body.scheduled_for)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format")

    if scheduled_dt <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Scheduled time must be in the future")

    sp = ScheduledPayment(
        user_id=current_user.id,
        from_account_id=body.from_account_id,
        to_account_number=body.to_account_number,
        amount=Decimal(str(body.amount)),
        description=body.description,
        recurrence=body.recurrence,
        next_run_at=scheduled_dt,
    )
    db.add(sp)
    db.commit()
    db.refresh(sp)
    return _sp_to_dict(sp)


@router.patch("/{payment_id}")
def update_scheduled_payment(
    payment_id: int,
    body: ScheduledPaymentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sp = db.query(ScheduledPayment).filter(
        ScheduledPayment.id == payment_id,
        ScheduledPayment.user_id == current_user.id,
    ).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Scheduled payment not found")

    if body.amount is not None:
        sp.amount = Decimal(str(body.amount))
    if body.description is not None:
        sp.description = body.description
    if body.recurrence is not None:
        sp.recurrence = body.recurrence
    if body.scheduled_for is not None:
        sp.next_run_at = datetime.fromisoformat(body.scheduled_for)
    if body.is_active is not None:
        sp.is_active = body.is_active

    db.commit()
    db.refresh(sp)
    return _sp_to_dict(sp)


@router.delete("/{payment_id}")
def delete_scheduled_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sp = db.query(ScheduledPayment).filter(
        ScheduledPayment.id == payment_id,
        ScheduledPayment.user_id == current_user.id,
    ).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Scheduled payment not found")
    db.delete(sp)
    db.commit()
    return {"detail": "Deleted"}
