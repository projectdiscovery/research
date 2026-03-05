from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel
from ..models.transaction import TransactionType, TransactionStatus


class TransactionCreate(BaseModel):
    transaction_type: TransactionType
    amount: Decimal
    description: Optional[str] = None
    to_account_number: Optional[str] = None


class TransferRequest(BaseModel):
    from_account_id: int
    to_account_number: str
    amount: Decimal
    description: Optional[str] = None


class BillPayRequest(BaseModel):
    from_account_id: int
    biller_name: str
    biller_category: str
    account_number: str
    amount: Decimal
    due_date: Optional[str] = None
    reference: Optional[str] = None


class DepositRequest(BaseModel):
    account_id: int
    amount: Decimal
    description: Optional[str] = "Deposit"


class WithdrawalRequest(BaseModel):
    account_id: int
    amount: Decimal
    description: Optional[str] = "Withdrawal"


class TransactionResponse(BaseModel):
    id: int
    from_account_id: Optional[int] = None
    to_account_id: Optional[int] = None
    transaction_type: TransactionType
    amount: Decimal
    balance_after: Optional[Decimal] = None
    description: Optional[str] = None
    reference_number: str
    status: TransactionStatus
    requires_approval: bool = False
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    requires_dual_approval: bool = False
    first_approved_by_id: Optional[int] = None
    first_approved_at: Optional[datetime] = None
    currency: str = "USD"
    original_amount: Optional[Decimal] = None
    exchange_rate_used: Optional[Decimal] = None
    is_flagged: bool = False
    flag_reason: Optional[str] = None
    flagged_by_id: Optional[int] = None
    flagged_at: Optional[datetime] = None
    processed_by_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
