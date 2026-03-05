import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.account import Account, AccountType
from ..models.user import User
from ..schemas.account import AccountCreate, AccountResponse
from .auth import get_current_user

router = APIRouter(prefix="/accounts", tags=["accounts"])


def generate_account_number() -> str:
    return "VB" + "".join(random.choices(string.digits, k=10))


@router.get("/", response_model=list[AccountResponse])
def get_accounts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Account).filter(
        Account.user_id == current_user.id, Account.is_active == True
    ).all()


@router.post("/", response_model=AccountResponse, status_code=201)
def create_account(
    account_data: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(Account).filter(
        Account.user_id == current_user.id,
        Account.account_type == account_data.account_type,
        Account.is_active == True
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"You already have a {account_data.account_type} account")

    acc_number = generate_account_number()
    while db.query(Account).filter(Account.account_number == acc_number).first():
        acc_number = generate_account_number()

    account = Account(
        user_id=current_user.id,
        account_number=acc_number,
        account_type=account_data.account_type,
        balance=0.00,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.get("/{account_id}", response_model=AccountResponse)
def get_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account
