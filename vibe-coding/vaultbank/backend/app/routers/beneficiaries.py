from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.beneficiary import Beneficiary
from ..models.user import User
from ..schemas.beneficiary import BeneficiaryCreate, BeneficiaryResponse
from .auth import get_current_user

router = APIRouter(prefix="/beneficiaries", tags=["beneficiaries"])


@router.get("/", response_model=list[BeneficiaryResponse])
def get_beneficiaries(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Beneficiary).filter(
        Beneficiary.user_id == current_user.id, Beneficiary.is_active == True
    ).all()


@router.post("/", response_model=BeneficiaryResponse, status_code=201)
def create_beneficiary(
    data: BeneficiaryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    beneficiary = Beneficiary(
        user_id=current_user.id,
        name=data.name,
        account_number=data.account_number,
        bank_name=data.bank_name,
        routing_number=data.routing_number,
    )
    db.add(beneficiary)
    db.commit()
    db.refresh(beneficiary)
    return beneficiary


@router.delete("/{beneficiary_id}", status_code=204)
def delete_beneficiary(
    beneficiary_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    b = db.query(Beneficiary).filter(
        Beneficiary.id == beneficiary_id, Beneficiary.user_id == current_user.id
    ).first()
    if not b:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    b.is_active = False
    db.commit()
