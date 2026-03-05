import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, Numeric, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from ..database import Base


class TransactionType(str, enum.Enum):
    transfer = "transfer"
    deposit = "deposit"
    withdrawal = "withdrawal"
    bill_payment = "bill_payment"
    loan_disbursement = "loan_disbursement"
    scheduled_payment = "scheduled_payment"
    fx_conversion = "fx_conversion"


class TransactionStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    pending_approval = "pending_approval"
    rejected = "rejected"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    from_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    to_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    balance_after = Column(Numeric(15, 2), nullable=True)
    description = Column(String(500), nullable=True)
    reference_number = Column(String(50), unique=True, index=True, nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.completed, nullable=False)
    requires_approval = Column(Boolean, default=False, nullable=False)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    # Dual approval fields
    requires_dual_approval = Column(Boolean, default=False, nullable=False)
    first_approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    first_approved_at = Column(DateTime, nullable=True)
    # FX fields
    currency = Column(String(3), default="USD", nullable=False)
    original_amount = Column(Numeric(15, 2), nullable=True)
    exchange_rate_used = Column(Numeric(15, 6), nullable=True)
    is_flagged = Column(Boolean, default=False, nullable=False)
    flag_reason = Column(String(500), nullable=True)
    flagged_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    flagged_at = Column(DateTime, nullable=True)
    processed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    from_account = relationship("Account", foreign_keys=[from_account_id], back_populates="outgoing_transactions")
    to_account = relationship("Account", foreign_keys=[to_account_id], back_populates="incoming_transactions")
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    first_approved_by = relationship("User", foreign_keys=[first_approved_by_id])
    flagged_by = relationship("User", foreign_keys=[flagged_by_id])
    processed_by = relationship("User", foreign_keys=[processed_by_id])
