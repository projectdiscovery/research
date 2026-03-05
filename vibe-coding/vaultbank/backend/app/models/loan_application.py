import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, Numeric, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from ..database import Base


class LoanApplicationStatus(str, enum.Enum):
    submitted = "submitted"
    auto_scored = "auto_scored"
    under_review = "under_review"
    compliance_review = "compliance_review"
    approved = "approved"
    rejected = "rejected"
    disbursed = "disbursed"


class LoanPurpose(str, enum.Enum):
    personal = "personal"
    home = "home"
    auto = "auto"
    business = "business"
    education = "education"
    medical = "medical"
    other = "other"


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    disburse_to_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)

    amount = Column(Numeric(15, 2), nullable=False)
    term_months = Column(Integer, nullable=False)
    purpose = Column(Enum(LoanPurpose), nullable=False)
    description = Column(Text, nullable=True)
    annual_income = Column(Numeric(15, 2), nullable=True)
    employment_status = Column(String(50), nullable=True)

    status = Column(Enum(LoanApplicationStatus), default=LoanApplicationStatus.submitted, nullable=False)
    credit_score = Column(Integer, nullable=True)       # auto-calculated 300–850
    risk_level = Column(String(20), nullable=True)      # low / medium / high
    interest_rate = Column(Numeric(5, 2), nullable=True)
    monthly_payment = Column(Numeric(15, 2), nullable=True)

    # Manager review
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    manager_notes = Column(Text, nullable=True)

    # Compliance review
    compliance_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    compliance_at = Column(DateTime, nullable=True)
    compliance_notes = Column(Text, nullable=True)

    # Rejection
    rejection_reason = Column(Text, nullable=True)

    # Disbursement
    disbursed_at = Column(DateTime, nullable=True)
    disbursed_transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    applicant = relationship("User", foreign_keys=[user_id], back_populates="loan_applications")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
    compliance_by = relationship("User", foreign_keys=[compliance_by_id])
    disburse_to_account = relationship("Account", foreign_keys=[disburse_to_account_id])
