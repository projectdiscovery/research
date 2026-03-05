import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class AccountType(str, enum.Enum):
    checking = "checking"
    savings = "savings"


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    account_number = Column(String(20), unique=True, index=True, nullable=False)
    account_type = Column(Enum(AccountType), nullable=False)
    balance = Column(Numeric(15, 2), default=0.00, nullable=False)
    hold_amount = Column(Numeric(15, 2), default=0.00, nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_frozen = Column(Boolean, default=False, nullable=False)
    freeze_reason = Column(String(500), nullable=True)
    frozen_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    frozen_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    owner = relationship("User", foreign_keys=[user_id], back_populates="accounts")
    frozen_by = relationship("User", foreign_keys=[frozen_by_id])
    outgoing_transactions = relationship(
        "Transaction", foreign_keys="Transaction.from_account_id", back_populates="from_account"
    )
    incoming_transactions = relationship(
        "Transaction", foreign_keys="Transaction.to_account_id", back_populates="to_account"
    )
