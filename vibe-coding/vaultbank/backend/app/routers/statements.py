from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models.account import Account
from ..models.transaction import Transaction
from ..models.user import User
from ..services.pdf import generate_statement_pdf
from .auth import get_current_user

router = APIRouter(prefix="/statements", tags=["statements"])


@router.get("/{account_id}/pdf")
def download_statement(
    account_id: int,
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
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

    q = db.query(Transaction).filter(
        or_(
            Transaction.from_account_id == account_id,
            Transaction.to_account_id == account_id,
        )
    )

    from_label = from_date or "Beginning"
    to_label = to_date or datetime.utcnow().strftime("%Y-%m-%d")

    if from_date:
        try:
            q = q.filter(Transaction.created_at >= datetime.fromisoformat(from_date))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid from_date format")

    if to_date:
        try:
            q = q.filter(Transaction.created_at <= datetime.fromisoformat(to_date))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid to_date format")

    transactions = q.order_by(Transaction.created_at.asc()).all()

    pdf_buffer = generate_statement_pdf(account, transactions, from_label, to_label)
    filename = f"statement_{account.account_number}_{to_label}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )
