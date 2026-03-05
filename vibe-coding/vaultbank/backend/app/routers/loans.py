from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.loan import Loan, LoanStatus
from ..models.user import User
from ..schemas.loan import LoanCreate, LoanResponse
from .auth import get_current_user

router = APIRouter(prefix="/loans", tags=["loans"])

INTEREST_RATES = {
    "personal": Decimal("12.5"),
    "mortgage": Decimal("6.5"),
    "auto": Decimal("8.9"),
    "business": Decimal("10.0"),
}


def calculate_monthly_payment(principal: Decimal, annual_rate: Decimal, months: int) -> Decimal:
    if annual_rate == 0:
        return principal / months
    monthly_rate = annual_rate / 100 / 12
    payment = principal * monthly_rate * (1 + monthly_rate) ** months / ((1 + monthly_rate) ** months - 1)
    return round(payment, 2)


@router.get("/", response_model=list[LoanResponse])
def get_loans(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Loan).filter(Loan.user_id == current_user.id).all()


@router.post("/", response_model=LoanResponse, status_code=201)
def apply_loan(
    loan_data: LoanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rate = INTEREST_RATES.get(loan_data.loan_type.value, Decimal("10.0"))
    monthly = calculate_monthly_payment(loan_data.principal_amount, rate, loan_data.term_months)

    loan = Loan(
        user_id=current_user.id,
        loan_type=loan_data.loan_type,
        principal_amount=loan_data.principal_amount,
        outstanding_balance=loan_data.principal_amount,
        interest_rate=rate,
        term_months=loan_data.term_months,
        monthly_payment=monthly,
        status=LoanStatus.pending,
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan
