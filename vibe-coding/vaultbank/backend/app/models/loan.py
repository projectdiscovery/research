import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class LoanType(str, enum.Enum):
    personal = "personal"
    mortgage = "mortgage"
    auto = "auto"
    business = "business"


class LoanStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    active = "active"
    paid_off = "paid_off"
    rejected = "rejected"


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    loan_type = Column(Enum(LoanType), nullable=False)
    principal_amount = Column(Numeric(15, 2), nullable=False)
    outstanding_balance = Column(Numeric(15, 2), nullable=False)
    interest_rate = Column(Numeric(5, 2), nullable=False)
    term_months = Column(Integer, nullable=False)
    monthly_payment = Column(Numeric(15, 2), nullable=False)
    status = Column(Enum(LoanStatus), default=LoanStatus.pending, nullable=False)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    borrower = relationship("User", back_populates="loans")
