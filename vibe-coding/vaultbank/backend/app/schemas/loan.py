from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel
from ..models.loan import LoanType, LoanStatus


class LoanCreate(BaseModel):
    loan_type: LoanType
    principal_amount: Decimal
    term_months: int


class LoanResponse(BaseModel):
    id: int
    loan_type: LoanType
    principal_amount: Decimal
    outstanding_balance: Decimal
    interest_rate: Decimal
    term_months: int
    monthly_payment: Decimal
    status: LoanStatus
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
