import os
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from ..database import get_db
from ..models.user import User, UserRole
from ..models.account import Account
from ..models.transaction import Transaction, TransactionType, TransactionStatus
from ..models.dispute import TransactionDispute, DisputeEvidence, DisputeType, DisputeStatus, DisputeResolution
from ..models.notification import NotificationType
from ..permissions import require_compliance_up
from .auth import get_current_user
from ..services.notifications import notification_manager

router = APIRouter(prefix="/disputes", tags=["disputes"])

UPLOAD_DIR = "uploads/disputes"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class DisputeCreate(BaseModel):
    transaction_id: int
    dispute_type: DisputeType
    description: str


class DisputeResolveRequest(BaseModel):
    resolution: DisputeResolution
    notes: Optional[str] = None
    refund_amount: Optional[float] = None


def _dispute_to_dict(d: TransactionDispute) -> dict:
    return {
        "id": d.id,
        "transaction_id": d.transaction_id,
        "user_id": d.user_id,
        "dispute_type": d.dispute_type.value,
        "description": d.description,
        "status": d.status.value,
        "resolution": d.resolution.value if d.resolution else None,
        "refund_amount": float(d.refund_amount) if d.refund_amount else None,
        "notes": d.notes,
        "reviewer_id": d.reviewer_id,
        "reviewed_at": d.reviewed_at.isoformat() if d.reviewed_at else None,
        "created_at": d.created_at.isoformat(),
        "evidence": [
            {
                "id": e.id,
                "filename": e.filename,
                "file_type": e.file_type,
                "uploaded_at": e.uploaded_at.isoformat(),
            }
            for e in d.evidence
        ],
    }


@router.post("/")
async def file_dispute(
    body: DisputeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify transaction belongs to customer
    user_account_ids = [
        a.id for a in db.query(Account).filter(Account.user_id == current_user.id).all()
    ]
    txn = db.query(Transaction).filter(
        Transaction.id == body.transaction_id,
        or_(
            Transaction.from_account_id.in_(user_account_ids),
            Transaction.to_account_id.in_(user_account_ids),
        ),
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Check no existing open dispute
    existing = db.query(TransactionDispute).filter(
        TransactionDispute.transaction_id == body.transaction_id,
        TransactionDispute.user_id == current_user.id,
        TransactionDispute.status.in_([DisputeStatus.pending, DisputeStatus.under_review]),
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="An open dispute already exists for this transaction")

    dispute = TransactionDispute(
        transaction_id=body.transaction_id,
        user_id=current_user.id,
        dispute_type=body.dispute_type,
        description=body.description,
    )
    db.add(dispute)
    db.commit()
    db.refresh(dispute)

    # Notify compliance
    officers = db.query(User).filter(
        User.role == UserRole.compliance_officer, User.is_active == True
    ).all()
    for officer in officers:
        await notification_manager.create_and_push(
            db=db,
            user_id=officer.id,
            title="New Transaction Dispute",
            message=f"Customer filed a {body.dispute_type.value} dispute on transaction #{body.transaction_id}.",
            notification_type=NotificationType.compliance,
            data={"dispute_id": dispute.id},
        )
    return _dispute_to_dict(dispute)


@router.post("/{dispute_id}/evidence")
async def upload_evidence(
    dispute_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dispute = db.query(TransactionDispute).filter(
        TransactionDispute.id == dispute_id,
        TransactionDispute.user_id == current_user.id,
    ).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    if dispute.status not in (DisputeStatus.pending, DisputeStatus.under_review):
        raise HTTPException(status_code=400, detail="Cannot add evidence to a closed dispute")

    if file.size and file.size > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")

    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    safe_name = str(uuid.uuid4()) + ext
    filepath = os.path.join(UPLOAD_DIR, safe_name)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    evidence = DisputeEvidence(
        dispute_id=dispute.id,
        filename=file.filename or safe_name,
        filepath=filepath,
        file_type=file.content_type,
        file_size=len(content),
    )
    db.add(evidence)
    db.commit()
    return {"id": evidence.id, "filename": evidence.filename, "file_type": evidence.file_type}


@router.get("/my")
def my_disputes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    disputes = (
        db.query(TransactionDispute)
        .filter(TransactionDispute.user_id == current_user.id)
        .order_by(TransactionDispute.created_at.desc())
        .all()
    )
    return [_dispute_to_dict(d) for d in disputes]


@router.get("/")
def all_disputes(
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    current_user: User = require_compliance_up,
    db: Session = Depends(get_db),
):
    q = db.query(TransactionDispute)
    if status:
        try:
            q = q.filter(TransactionDispute.status == DisputeStatus(status))
        except ValueError:
            pass
    disputes = q.order_by(TransactionDispute.created_at.desc()).offset(offset).limit(limit).all()
    return [_dispute_to_dict(d) for d in disputes]


@router.post("/{dispute_id}/review")
async def review_dispute(
    dispute_id: int,
    body: DisputeResolveRequest,
    current_user: User = require_compliance_up,
    db: Session = Depends(get_db),
):
    dispute = db.query(TransactionDispute).filter(TransactionDispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    if dispute.status in (DisputeStatus.resolved, DisputeStatus.denied):
        raise HTTPException(status_code=400, detail="Dispute already closed")

    dispute.status = DisputeStatus.under_review
    dispute.reviewer_id = current_user.id
    dispute.reviewed_at = datetime.utcnow()
    dispute.notes = body.notes
    dispute.resolution = body.resolution

    txn = db.query(Transaction).filter(Transaction.id == dispute.transaction_id).first()

    if body.resolution == DisputeResolution.reversed and txn:
        # Full reversal: return funds to from_account
        if txn.from_account_id:
            from_account = db.query(Account).filter(Account.id == txn.from_account_id).first()
            if from_account:
                from_account.balance += txn.amount
        dispute.refund_amount = txn.amount
        dispute.status = DisputeStatus.resolved

    elif body.resolution == DisputeResolution.partial_refund and txn and body.refund_amount:
        refund = Decimal(str(body.refund_amount))
        if txn.from_account_id:
            from_account = db.query(Account).filter(Account.id == txn.from_account_id).first()
            if from_account:
                from_account.balance += refund
        dispute.refund_amount = refund
        dispute.status = DisputeStatus.resolved

    elif body.resolution == DisputeResolution.denied:
        dispute.status = DisputeStatus.denied

    db.commit()
    db.refresh(dispute)

    msg_map = {
        DisputeResolution.reversed: "Your dispute was resolved. A full refund has been issued.",
        DisputeResolution.partial_refund: f"Your dispute was resolved with a partial refund of ${float(dispute.refund_amount or 0):,.2f}.",
        DisputeResolution.denied: f"Your dispute was reviewed and denied. {body.notes or ''}",
    }
    await notification_manager.create_and_push(
        db=db,
        user_id=dispute.user_id,
        title="Dispute Resolution",
        message=msg_map.get(body.resolution, "Your dispute has been reviewed."),
        notification_type=NotificationType.alert,
        data={"dispute_id": dispute.id},
    )
    return _dispute_to_dict(dispute)
