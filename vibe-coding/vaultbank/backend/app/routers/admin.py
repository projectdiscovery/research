from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from ..database import get_db
from ..models.user import User, UserRole
from ..models.account import Account
from ..models.transaction import Transaction, TransactionStatus
from ..models.branch import Branch
from ..models.system_settings import SystemSettings
from ..permissions import require_admin
from ..schemas.user import UserResponse

router = APIRouter(prefix="/admin", tags=["admin"])


class RoleUpdate(BaseModel):
    role: UserRole
    branch_id: Optional[int] = None


class BranchCreate(BaseModel):
    name: str
    code: str
    address: Optional[str] = None


class SettingsUpdate(BaseModel):
    settings: dict


@router.get("/users")
def list_users(
    page: int = Query(1, ge=1),
    search: str = Query(None),
    role: Optional[UserRole] = Query(None),
    _: User = require_admin,
    db: Session = Depends(get_db),
):
    q = db.query(User)
    if search:
        q = q.filter(
            (User.first_name.ilike(f"%{search}%"))
            | (User.last_name.ilike(f"%{search}%"))
            | (User.email.ilike(f"%{search}%"))
        )
    if role:
        q = q.filter(User.role == role)
    total = q.count()
    limit = 20
    users = q.offset((page - 1) * limit).limit(limit).all()
    return {
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
        "users": [UserResponse.model_validate(u) for u in users],
    }


@router.patch("/users/{user_id}/role")
def change_user_role(
    user_id: int,
    body: RoleUpdate,
    _: User = require_admin,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = body.role
    user.branch_id = body.branch_id
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}/activate")
def toggle_user_active(
    user_id: int,
    _: User = require_admin,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"id": user.id, "is_active": user.is_active}


@router.get("/branches")
def list_branches(
    _: User = require_admin,
    db: Session = Depends(get_db),
):
    branches = db.query(Branch).all()
    return [{"id": b.id, "name": b.name, "code": b.code, "address": b.address} for b in branches]


@router.post("/branches", status_code=201)
def create_branch(
    body: BranchCreate,
    _: User = require_admin,
    db: Session = Depends(get_db),
):
    existing = db.query(Branch).filter(Branch.code == body.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Branch code already exists")
    branch = Branch(name=body.name, code=body.code, address=body.address)
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return {"id": branch.id, "name": branch.name, "code": branch.code, "address": branch.address}


@router.get("/settings")
def get_settings(
    _: User = require_admin,
    db: Session = Depends(get_db),
):
    rows = db.query(SystemSettings).all()
    return {r.key: {"value": r.value, "description": r.description} for r in rows}


@router.patch("/settings")
def update_settings(
    body: SettingsUpdate,
    current_user: User = require_admin,
    db: Session = Depends(get_db),
):
    for key, value in body.settings.items():
        row = db.query(SystemSettings).filter(SystemSettings.key == key).first()
        if row:
            row.value = str(value)
            row.updated_by = current_user.id
        else:
            row = SystemSettings(key=key, value=str(value), updated_by=current_user.id)
            db.add(row)
    db.commit()
    rows = db.query(SystemSettings).all()
    return {r.key: r.value for r in rows}


@router.get("/analytics")
def get_analytics(
    _: User = require_admin,
    db: Session = Depends(get_db),
):
    user_counts = {}
    for role in UserRole:
        user_counts[role.value] = db.query(User).filter(User.role == role).count()

    total_accounts = db.query(Account).count()
    pending_approvals = db.query(Transaction).filter(
        Transaction.status == TransactionStatus.pending_approval
    ).count()
    flagged = db.query(Transaction).filter(Transaction.is_flagged == True).count()

    volume_row = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == TransactionStatus.completed
    ).scalar()
    total_volume = float(volume_row or 0)

    return {
        "user_counts": user_counts,
        "total_accounts": total_accounts,
        "total_volume": total_volume,
        "pending_approvals": pending_approvals,
        "flagged_transactions": flagged,
    }
