"""
Loan Application System — multi-step workflow:
  Customer → submitted
  Auto-scoring → auto_scored
  Manager review → under_review / compliance_review
  Compliance → approved / rejected
  Disburse → disbursed
"""
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models.user import User, UserRole
from ..models.account import Account
from ..models.transaction import Transaction, TransactionType, TransactionStatus
from ..models.loan_application import LoanApplication, LoanApplicationStatus, LoanPurpose
from ..models.notification import NotificationType
from ..permissions import require_manager_up, require_compliance_up
from .auth import get_current_user
from ..services.notifications import notification_manager

router = APIRouter(prefix="/loan-applications", tags=["loan-applications"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class LoanApplyRequest(BaseModel):
    amount: float
    term_months: int
    purpose: LoanPurpose
    description: Optional[str] = None
    annual_income: Optional[float] = None
    employment_status: Optional[str] = None
    disburse_to_account_id: Optional[int] = None


class ManagerReviewRequest(BaseModel):
    action: str  # "approve" | "send_compliance" | "reject"
    notes: Optional[str] = None


class ComplianceReviewRequest(BaseModel):
    action: str  # "approve" | "reject"
    notes: Optional[str] = None


class DisburseRequest(BaseModel):
    account_id: int


# ── Auto-scoring ──────────────────────────────────────────────────────────────

def _auto_score(db: Session, user: User, amount: float, annual_income: Optional[float]) -> dict:
    """Simple credit scoring: returns score 300–850, risk, rate."""
    score = 600  # baseline

    # Account history: how many accounts, avg balance
    accounts = db.query(Account).filter(Account.user_id == user.id, Account.is_active == True).all()
    if accounts:
        avg_bal = sum(float(a.balance) for a in accounts) / len(accounts)
        if avg_bal > 10000:
            score += 80
        elif avg_bal > 2000:
            score += 40
        elif avg_bal < 100:
            score -= 50
        score += min(len(accounts) * 10, 30)

    # Tier bonus
    tier_bonus = {"basic": 0, "silver": 30, "gold": 60, "platinum": 100}
    score += tier_bonus.get(user.account_tier.value, 0)

    # DTI estimate
    if annual_income and annual_income > 0:
        monthly_income = annual_income / 12
        loan_monthly = amount / max(1, 24)  # rough 24-month estimate
        dti = loan_monthly / monthly_income
        if dti < 0.2:
            score += 60
        elif dti < 0.35:
            score += 20
        elif dti > 0.5:
            score -= 60

    # Clamp
    score = max(300, min(850, score))

    if score >= 720:
        risk = "low"
        rate = 5.9
    elif score >= 620:
        risk = "medium"
        rate = 9.9
    else:
        risk = "high"
        rate = 15.9

    # Calculate monthly payment (simple amortization)
    monthly_rate = rate / 100 / 12
    term = 24  # default estimate — real term used later
    if monthly_rate > 0:
        mp = amount * monthly_rate * (1 + monthly_rate) ** term / ((1 + monthly_rate) ** term - 1)
    else:
        mp = amount / term

    return {"score": score, "risk": risk, "rate": round(rate, 2), "monthly_payment": round(mp, 2)}


def _monthly_payment(principal: float, annual_rate: float, term_months: int) -> float:
    monthly_rate = annual_rate / 100 / 12
    if monthly_rate == 0:
        return principal / term_months
    return principal * monthly_rate * (1 + monthly_rate) ** term_months / ((1 + monthly_rate) ** term_months - 1)


def _app_to_dict(app: LoanApplication) -> dict:
    return {
        "id": app.id,
        "user_id": app.user_id,
        "amount": float(app.amount),
        "term_months": app.term_months,
        "purpose": app.purpose.value,
        "description": app.description,
        "annual_income": float(app.annual_income) if app.annual_income else None,
        "employment_status": app.employment_status,
        "status": app.status.value,
        "credit_score": app.credit_score,
        "risk_level": app.risk_level,
        "interest_rate": float(app.interest_rate) if app.interest_rate else None,
        "monthly_payment": float(app.monthly_payment) if app.monthly_payment else None,
        "manager_notes": app.manager_notes,
        "compliance_notes": app.compliance_notes,
        "rejection_reason": app.rejection_reason,
        "disbursed_at": app.disbursed_at.isoformat() if app.disbursed_at else None,
        "created_at": app.created_at.isoformat(),
        "reviewed_at": app.reviewed_at.isoformat() if app.reviewed_at else None,
        "compliance_at": app.compliance_at.isoformat() if app.compliance_at else None,
    }


# ── Customer endpoints ────────────────────────────────────────────────────────

@router.post("/")
async def apply_for_loan(
    body: LoanApplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.customer:
        raise HTTPException(status_code=403, detail="Only customers can apply for loans")

    if body.amount <= 0 or body.term_months <= 0:
        raise HTTPException(status_code=400, detail="Invalid loan parameters")

    # Auto-score
    scoring = _auto_score(db, current_user, body.amount, body.annual_income)
    monthly = _monthly_payment(body.amount, scoring["rate"], body.term_months)

    app = LoanApplication(
        user_id=current_user.id,
        disburse_to_account_id=body.disburse_to_account_id,
        amount=Decimal(str(body.amount)),
        term_months=body.term_months,
        purpose=body.purpose,
        description=body.description,
        annual_income=Decimal(str(body.annual_income)) if body.annual_income else None,
        employment_status=body.employment_status,
        status=LoanApplicationStatus.auto_scored,
        credit_score=scoring["score"],
        risk_level=scoring["risk"],
        interest_rate=Decimal(str(scoring["rate"])),
        monthly_payment=Decimal(str(round(monthly, 2))),
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    # Notify managers
    managers = db.query(User).filter(
        User.role == UserRole.branch_manager, User.is_active == True
    ).all()
    for mgr in managers:
        await notification_manager.create_and_push(
            db=db,
            user_id=mgr.id,
            title="New Loan Application",
            message=f"${body.amount:,.2f} {body.purpose.value} loan application from {current_user.full_name}. Score: {scoring['score']}",
            notification_type=NotificationType.approval,
            data={"loan_application_id": app.id},
        )
    return _app_to_dict(app)


@router.get("/my")
def my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    apps = (
        db.query(LoanApplication)
        .filter(LoanApplication.user_id == current_user.id)
        .order_by(LoanApplication.created_at.desc())
        .all()
    )
    return [_app_to_dict(a) for a in apps]


# ── Manager endpoints ─────────────────────────────────────────────────────────

@router.get("/pending")
def get_pending_applications(
    current_user: User = require_manager_up,
    db: Session = Depends(get_db),
):
    apps = (
        db.query(LoanApplication)
        .filter(LoanApplication.status.in_([
            LoanApplicationStatus.auto_scored,
            LoanApplicationStatus.under_review,
        ]))
        .order_by(LoanApplication.created_at.asc())
        .all()
    )
    return [_app_to_dict(a) for a in apps]


@router.post("/{app_id}/manager-review")
async def manager_review(
    app_id: int,
    body: ManagerReviewRequest,
    current_user: User = require_manager_up,
    db: Session = Depends(get_db),
):
    app = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status not in (LoanApplicationStatus.auto_scored, LoanApplicationStatus.under_review):
        raise HTTPException(status_code=400, detail="Application not in reviewable state")

    app.reviewed_by_id = current_user.id
    app.reviewed_at = datetime.utcnow()
    app.manager_notes = body.notes

    if body.action == "send_compliance":
        app.status = LoanApplicationStatus.compliance_review
        msg = "Your loan application has been forwarded for compliance review."
        # Notify compliance
        officers = db.query(User).filter(
            User.role == UserRole.compliance_officer, User.is_active == True
        ).all()
        for officer in officers:
            await notification_manager.create_and_push(
                db=db,
                user_id=officer.id,
                title="Loan Application for Compliance Review",
                message=f"${float(app.amount):,.2f} loan application requires compliance review.",
                notification_type=NotificationType.compliance,
                data={"loan_application_id": app.id},
            )
    elif body.action == "approve":
        app.status = LoanApplicationStatus.approved
        msg = "Congratulations! Your loan application has been approved."
    elif body.action == "reject":
        app.status = LoanApplicationStatus.rejected
        app.rejection_reason = body.notes
        msg = f"Your loan application was rejected. {body.notes or ''}"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    db.commit()
    db.refresh(app)

    await notification_manager.create_and_push(
        db=db,
        user_id=app.user_id,
        title="Loan Application Update",
        message=msg,
        notification_type=NotificationType.approval,
        data={"loan_application_id": app.id},
    )
    return _app_to_dict(app)


@router.post("/{app_id}/disburse")
async def disburse_loan(
    app_id: int,
    body: DisburseRequest,
    current_user: User = require_manager_up,
    db: Session = Depends(get_db),
):
    app = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status != LoanApplicationStatus.approved:
        raise HTTPException(status_code=400, detail="Application must be approved before disbursement")

    account = db.query(Account).filter(
        Account.id == body.account_id,
        Account.user_id == app.user_id,
        Account.is_active == True,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Target account not found")

    amount = app.amount
    account.balance += amount

    txn = Transaction(
        to_account_id=account.id,
        transaction_type=TransactionType.loan_disbursement,
        amount=amount,
        balance_after=account.balance,
        description=f"Loan disbursement – {app.purpose.value}",
        reference_number="LNS" + str(uuid.uuid4()).replace("-", "").upper()[:12],
        status=TransactionStatus.completed,
        processed_by_id=current_user.id,
    )
    db.add(txn)
    db.flush()

    app.status = LoanApplicationStatus.disbursed
    app.disbursed_at = datetime.utcnow()
    app.disbursed_transaction_id = txn.id
    db.commit()
    db.refresh(app)

    await notification_manager.create_and_push(
        db=db,
        user_id=app.user_id,
        title="Loan Disbursed",
        message=f"${float(amount):,.2f} has been deposited to your account.",
        notification_type=NotificationType.transaction,
        data={"loan_application_id": app.id, "transaction_id": txn.id},
    )
    return _app_to_dict(app)


# ── Compliance endpoints ──────────────────────────────────────────────────────

@router.get("/compliance-queue")
def compliance_queue(
    current_user: User = require_compliance_up,
    db: Session = Depends(get_db),
):
    apps = (
        db.query(LoanApplication)
        .filter(LoanApplication.status == LoanApplicationStatus.compliance_review)
        .order_by(LoanApplication.created_at.asc())
        .all()
    )
    return [_app_to_dict(a) for a in apps]


@router.post("/{app_id}/compliance-review")
async def compliance_review(
    app_id: int,
    body: ComplianceReviewRequest,
    current_user: User = require_compliance_up,
    db: Session = Depends(get_db),
):
    app = db.query(LoanApplication).filter(LoanApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status != LoanApplicationStatus.compliance_review:
        raise HTTPException(status_code=400, detail="Application not in compliance review")

    app.compliance_by_id = current_user.id
    app.compliance_at = datetime.utcnow()
    app.compliance_notes = body.notes

    if body.action == "approve":
        app.status = LoanApplicationStatus.approved
        msg = "Congratulations! Your loan application has been approved after compliance review."
    elif body.action == "reject":
        app.status = LoanApplicationStatus.rejected
        app.rejection_reason = body.notes
        msg = f"Your loan application was rejected by compliance. {body.notes or ''}"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    db.commit()
    db.refresh(app)

    await notification_manager.create_and_push(
        db=db,
        user_id=app.user_id,
        title="Loan Application Decision",
        message=msg,
        notification_type=NotificationType.approval,
        data={"loan_application_id": app.id},
    )
    return _app_to_dict(app)


# ── All applications (admin) ──────────────────────────────────────────────────

@router.get("/all")
def all_applications(
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    current_user: User = require_manager_up,
    db: Session = Depends(get_db),
):
    q = db.query(LoanApplication)
    if status:
        try:
            q = q.filter(LoanApplication.status == LoanApplicationStatus(status))
        except ValueError:
            pass
    apps = q.order_by(LoanApplication.created_at.desc()).offset(offset).limit(limit).all()
    return [_app_to_dict(a) for a in apps]
