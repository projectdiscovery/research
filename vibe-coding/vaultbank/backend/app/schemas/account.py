from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel
from ..models.account import AccountType


class AccountCreate(BaseModel):
    account_type: AccountType


class AccountResponse(BaseModel):
    id: int
    user_id: int
    account_number: str
    account_type: AccountType
    balance: Decimal
    hold_amount: Decimal = Decimal("0")
    currency: str
    is_active: bool
    is_frozen: bool = False
    freeze_reason: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
