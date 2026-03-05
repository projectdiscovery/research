import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, Numeric, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from ..database import Base


class DisputeType(str, enum.Enum):
    unauthorized = "unauthorized"
    duplicate = "duplicate"
    merchant_error = "merchant_error"
    wrong_amount = "wrong_amount"
    other = "other"


class DisputeStatus(str, enum.Enum):
    pending = "pending"
    under_review = "under_review"
    resolved = "resolved"
    denied = "denied"


class DisputeResolution(str, enum.Enum):
    reversed = "reversed"
    partial_refund = "partial_refund"
    denied = "denied"


class TransactionDispute(Base):
    __tablename__ = "transaction_disputes"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dispute_type = Column(Enum(DisputeType), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(DisputeStatus), default=DisputeStatus.pending, nullable=False)
    resolution = Column(Enum(DisputeResolution), nullable=True)
    refund_amount = Column(Numeric(15, 2), nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    transaction = relationship("Transaction", foreign_keys=[transaction_id])
    user = relationship("User", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    evidence = relationship("DisputeEvidence", back_populates="dispute", cascade="all, delete-orphan")


class DisputeEvidence(Base):
    __tablename__ = "dispute_evidence"

    id = Column(Integer, primary_key=True, index=True)
    dispute_id = Column(Integer, ForeignKey("transaction_disputes.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=True)
    file_size = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    dispute = relationship("TransactionDispute", back_populates="evidence")
