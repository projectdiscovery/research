import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class KYCStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class AccountTier(str, enum.Enum):
    basic = "basic"
    silver = "silver"
    gold = "gold"
    platinum = "platinum"


class UserRole(str, enum.Enum):
    customer = "customer"
    teller = "teller"
    branch_manager = "branch_manager"
    compliance_officer = "compliance_officer"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    kyc_status = Column(Enum(KYCStatus), default=KYCStatus.pending, nullable=False)
    account_tier = Column(Enum(AccountTier), default=AccountTier.basic, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.customer, nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    accounts = relationship(
        "Account", back_populates="owner",
        foreign_keys="[Account.user_id]", lazy="dynamic"
    )
    loans = relationship("Loan", back_populates="borrower", lazy="dynamic")
    loan_applications = relationship("LoanApplication", back_populates="applicant", foreign_keys="[LoanApplication.user_id]", lazy="dynamic")
    beneficiaries = relationship("Beneficiary", back_populates="owner", lazy="dynamic")
    notifications = relationship("Notification", back_populates="user", lazy="dynamic")
    refresh_tokens = relationship("RefreshToken", back_populates="user", lazy="dynamic")
    branch = relationship("Branch", back_populates="staff", foreign_keys=[branch_id])

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
