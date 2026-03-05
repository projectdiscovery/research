"""
Background scheduler for processing scheduled/recurring payments.
Runs every 60 seconds via asyncio.
"""
import asyncio
import uuid
from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models.scheduled_payment import ScheduledPayment, RecurrenceType
from ..models.account import Account
from ..models.transaction import Transaction, TransactionType, TransactionStatus
from ..models.notification import NotificationType
from .notifications import notification_manager


def _generate_reference() -> str:
    return "SCH" + str(uuid.uuid4()).replace("-", "").upper()[:12]


def _next_run(recurrence: RecurrenceType, from_dt: datetime) -> datetime:
    if recurrence == RecurrenceType.daily:
        return from_dt + timedelta(days=1)
    elif recurrence == RecurrenceType.weekly:
        return from_dt + timedelta(weeks=1)
    elif recurrence == RecurrenceType.biweekly:
        return from_dt + timedelta(weeks=2)
    elif recurrence == RecurrenceType.monthly:
        # Advance by 1 month (same day, next month)
        month = from_dt.month + 1
        year = from_dt.year + (month - 1) // 12
        month = ((month - 1) % 12) + 1
        try:
            return from_dt.replace(year=year, month=month)
        except ValueError:
            # Handle end-of-month edge cases (e.g., Jan 31 → Feb 28)
            import calendar
            last_day = calendar.monthrange(year, month)[1]
            return from_dt.replace(year=year, month=month, day=last_day)
    return None  # one_time — no next run


async def process_scheduled_payments():
    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()
        due = (
            db.query(ScheduledPayment)
            .filter(
                ScheduledPayment.is_active == True,
                ScheduledPayment.next_run_at <= now,
            )
            .all()
        )

        for sp in due:
            try:
                from_account = db.query(Account).filter(
                    Account.id == sp.from_account_id,
                    Account.is_active == True,
                    Account.is_frozen == False,
                ).first()

                to_account = db.query(Account).filter(
                    Account.account_number == sp.to_account_number,
                    Account.is_active == True,
                ).first()

                if not from_account or not to_account:
                    raise ValueError("Account not found or inactive")

                amount = Decimal(str(sp.amount))
                available = from_account.balance - (from_account.hold_amount or Decimal("0"))
                if available < amount:
                    raise ValueError("Insufficient funds")

                from_account.balance -= amount
                to_account.balance += amount

                txn = Transaction(
                    from_account_id=from_account.id,
                    to_account_id=to_account.id,
                    transaction_type=TransactionType.scheduled_payment,
                    amount=amount,
                    balance_after=from_account.balance,
                    description=sp.description or f"Scheduled payment to {sp.to_account_number}",
                    reference_number=_generate_reference(),
                    status=TransactionStatus.completed,
                )
                db.add(txn)

                sp.last_run_at = now
                sp.failure_count = 0
                sp.last_failure_reason = None

                # Advance to next run or deactivate
                if sp.recurrence == RecurrenceType.one_time:
                    sp.is_active = False
                else:
                    sp.next_run_at = _next_run(sp.recurrence, now)

                db.commit()

                await notification_manager.create_and_push(
                    db=db,
                    user_id=sp.user_id,
                    title="Scheduled Payment Sent",
                    message=f"${float(amount):,.2f} scheduled payment to {sp.to_account_number} was processed.",
                    notification_type=NotificationType.transaction,
                    data={"scheduled_payment_id": sp.id},
                )

            except Exception as e:
                db.rollback()
                sp.failure_count = (sp.failure_count or 0) + 1
                sp.last_failure_reason = str(e)
                # Deactivate after 3 failures
                if sp.failure_count >= 3:
                    sp.is_active = False
                    try:
                        db.commit()
                        await notification_manager.create_and_push(
                            db=db,
                            user_id=sp.user_id,
                            title="Scheduled Payment Failed",
                            message=f"Your scheduled payment of ${float(sp.amount):,.2f} failed 3 times and has been cancelled. Reason: {e}",
                            notification_type=NotificationType.alert,
                            data={"scheduled_payment_id": sp.id},
                        )
                    except Exception:
                        db.rollback()
                else:
                    try:
                        db.commit()
                    except Exception:
                        db.rollback()
    finally:
        db.close()


async def scheduler_loop():
    """Run forever, processing scheduled payments every 60 seconds."""
    while True:
        try:
            await process_scheduled_payments()
        except Exception:
            pass
        await asyncio.sleep(60)
