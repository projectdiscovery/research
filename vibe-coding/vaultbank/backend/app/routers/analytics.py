"""
Spending Analytics — category breakdown, monthly trends, budgets.
Customer sees their own; staff can view system-wide stats.
"""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from ..database import get_db
from ..models.user import User, UserRole
from ..models.account import Account
from ..models.transaction import Transaction, TransactionType, TransactionStatus
from ..permissions import require_staff
from .auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])

# Map transaction types to spending categories
CATEGORY_MAP = {
    TransactionType.bill_payment: "Bills & Utilities",
    TransactionType.transfer: "Transfers",
    TransactionType.withdrawal: "Cash & ATM",
    TransactionType.deposit: "Income",
    TransactionType.loan_disbursement: "Loan",
    TransactionType.scheduled_payment: "Scheduled",
    TransactionType.fx_conversion: "FX Conversion",
}


def _get_user_account_ids(db: Session, user_id: int):
    return [a.id for a in db.query(Account).filter(Account.user_id == user_id).all()]


@router.get("/spending")
def spending_breakdown(
    months: int = Query(3, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Category breakdown for customer's spending over N months."""
    account_ids = _get_user_account_ids(db, current_user.id)
    since = datetime.utcnow() - timedelta(days=30 * months)

    txns = db.query(Transaction).filter(
        Transaction.from_account_id.in_(account_ids),
        Transaction.status == TransactionStatus.completed,
        Transaction.created_at >= since,
    ).all()

    categories: dict = {}
    for txn in txns:
        cat = CATEGORY_MAP.get(txn.transaction_type, "Other")
        if cat not in categories:
            categories[cat] = {"category": cat, "total": 0.0, "count": 0}
        categories[cat]["total"] += float(txn.amount)
        categories[cat]["count"] += 1

    return sorted(categories.values(), key=lambda x: x["total"], reverse=True)


@router.get("/monthly-trends")
def monthly_trends(
    months: int = Query(6, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Monthly income vs spending trend."""
    account_ids = _get_user_account_ids(db, current_user.id)
    since = datetime.utcnow() - timedelta(days=30 * months)

    # Outgoing (spending)
    outgoing = (
        db.query(
            extract("year", Transaction.created_at).label("year"),
            extract("month", Transaction.created_at).label("month"),
            func.sum(Transaction.amount).label("total"),
        )
        .filter(
            Transaction.from_account_id.in_(account_ids),
            Transaction.status == TransactionStatus.completed,
            Transaction.transaction_type != TransactionType.fx_conversion,
            Transaction.created_at >= since,
        )
        .group_by("year", "month")
        .all()
    )

    # Incoming (income)
    incoming = (
        db.query(
            extract("year", Transaction.created_at).label("year"),
            extract("month", Transaction.created_at).label("month"),
            func.sum(Transaction.amount).label("total"),
        )
        .filter(
            Transaction.to_account_id.in_(account_ids),
            Transaction.status == TransactionStatus.completed,
            Transaction.transaction_type.in_([TransactionType.deposit, TransactionType.loan_disbursement]),
            Transaction.created_at >= since,
        )
        .group_by("year", "month")
        .all()
    )

    out_map = {(int(r.year), int(r.month)): float(r.total) for r in outgoing}
    in_map = {(int(r.year), int(r.month)): float(r.total) for r in incoming}

    # Build list for last N months
    result = []
    now = datetime.utcnow()
    for i in range(months - 1, -1, -1):
        target = now - timedelta(days=30 * i)
        key = (target.year, target.month)
        month_label = target.strftime("%b %Y")
        result.append({
            "month": month_label,
            "year": target.year,
            "month_num": target.month,
            "spent": round(out_map.get(key, 0.0), 2),
            "income": round(in_map.get(key, 0.0), 2),
        })

    return result


@router.get("/summary")
def account_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Quick financial summary for the customer."""
    account_ids = _get_user_account_ids(db, current_user.id)
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_balance = db.query(func.sum(Account.balance)).filter(
        Account.user_id == current_user.id, Account.is_active == True
    ).scalar() or Decimal("0")

    this_month_spent = db.query(func.sum(Transaction.amount)).filter(
        Transaction.from_account_id.in_(account_ids),
        Transaction.status == TransactionStatus.completed,
        Transaction.created_at >= month_start,
    ).scalar() or Decimal("0")

    this_month_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.to_account_id.in_(account_ids),
        Transaction.status == TransactionStatus.completed,
        Transaction.transaction_type == TransactionType.deposit,
        Transaction.created_at >= month_start,
    ).scalar() or Decimal("0")

    txn_count = db.query(func.count(Transaction.id)).filter(
        Transaction.from_account_id.in_(account_ids),
        Transaction.status == TransactionStatus.completed,
        Transaction.created_at >= month_start,
    ).scalar() or 0

    return {
        "total_balance": float(total_balance),
        "this_month_spent": float(this_month_spent),
        "this_month_income": float(this_month_income),
        "this_month_transactions": txn_count,
        "net_this_month": float(this_month_income) - float(this_month_spent),
    }


@router.get("/system")
def system_analytics(
    current_user: User = require_staff,
    db: Session = Depends(get_db),
):
    """System-wide analytics for staff."""
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_users = db.query(func.count(User.id)).filter(User.role == UserRole.customer).scalar()
    total_accounts = db.query(func.count(Account.id)).filter(Account.is_active == True).scalar()
    total_balance = db.query(func.sum(Account.balance)).filter(Account.is_active == True).scalar() or 0
    monthly_volume = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == TransactionStatus.completed,
        Transaction.created_at >= month_start,
    ).scalar() or 0
    monthly_txns = db.query(func.count(Transaction.id)).filter(
        Transaction.status == TransactionStatus.completed,
        Transaction.created_at >= month_start,
    ).scalar() or 0
    pending_approvals = db.query(func.count(Transaction.id)).filter(
        Transaction.status.in_(["pending_approval"])
    ).scalar() or 0
    flagged_count = db.query(func.count(Transaction.id)).filter(
        Transaction.is_flagged == True
    ).scalar() or 0
    frozen_accounts = db.query(func.count(Account.id)).filter(
        Account.is_frozen == True
    ).scalar() or 0

    return {
        "total_customers": total_users,
        "total_accounts": total_accounts,
        "total_deposits": float(total_balance),
        "monthly_volume": float(monthly_volume),
        "monthly_transactions": monthly_txns,
        "pending_approvals": pending_approvals,
        "flagged_transactions": flagged_count,
        "frozen_accounts": frozen_accounts,
    }
