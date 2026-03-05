from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class BeneficiaryCreate(BaseModel):
    name: str
    account_number: str
    bank_name: str
    routing_number: Optional[str] = None


class BeneficiaryResponse(BaseModel):
    id: int
    name: str
    account_number: str
    bank_name: str
    routing_number: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
