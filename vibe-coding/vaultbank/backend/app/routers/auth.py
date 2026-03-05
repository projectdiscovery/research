import random
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.account import Account, AccountType
from ..models.session import UserSession
from ..schemas.user import (
    UserCreate, UserLogin, UserResponse, UserUpdate, Token,
    RefreshRequest, LogoutRequest,
)
from ..services.auth import (
    get_password_hash, authenticate_user, create_access_token,
    get_current_user_from_token, get_user_by_email,
    create_refresh_token, rotate_refresh_token, revoke_refresh_token,
)
from ..models.refresh_token import RefreshToken

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()
limiter = Limiter(key_func=get_remote_address)


def generate_account_number(prefix="VB"):
    return prefix + "".join([str(random.randint(0, 9)) for _ in range(10)])


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    user = get_current_user_from_token(db, credentials.credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def register(request: Request, user_data: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        date_of_birth=user_data.date_of_birth,
        address=user_data.address,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Auto-create checking and savings accounts
    for acc_type in [AccountType.checking, AccountType.savings]:
        acc = Account(
            user_id=user.id,
            account_number=generate_account_number(),
            account_type=acc_type,
            balance=0,
        )
        db.add(acc)
    db.commit()

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token(db, user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


def _create_session(db: Session, user_id: int, refresh_token_raw: str, request: Request = None):
    """Create a UserSession record linked to the refresh token."""
    from ..models.refresh_token import RefreshToken as RT
    token_hash = RT.hash_token(refresh_token_raw)
    ip = request.client.host if request and request.client else None
    ua = request.headers.get("user-agent") if request else None
    session = UserSession(
        user_id=user_id,
        refresh_token_hash=token_hash,
        ip_address=ip,
        user_agent=ua,
        device_info=ua[:200] if ua else None,
    )
    db.add(session)
    db.commit()


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, login_data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token(db, user.id)
    _create_session(db, user.id, refresh_token, request)
    return Token(
        access_token=access_token,
        token_type="bearer",
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=Token)
def refresh_tokens(body: RefreshRequest, db: Session = Depends(get_db)):
    new_access, new_refresh, user = rotate_refresh_token(db, body.refresh_token)
    return Token(
        access_token=new_access,
        token_type="bearer",
        refresh_token=new_refresh,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout", status_code=204)
def logout(body: LogoutRequest, db: Session = Depends(get_db)):
    revoke_refresh_token(db, body.refresh_token)
    return None


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user
