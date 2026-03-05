import secrets
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..models.user import User
from ..models.refresh_token import RefreshToken
from ..schemas.user import TokenData
from ..config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def get_current_user_from_token(db: Session, token: str) -> Optional[User]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
        token_data = TokenData(user_id=int(user_id))
    except JWTError:
        return None
    return db.query(User).filter(User.id == token_data.user_id).first()


def create_refresh_token(db: Session, user_id: int) -> str:
    raw_token = secrets.token_hex(32)
    token_hash = RefreshToken.hash_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    rt = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(rt)
    db.commit()
    return raw_token


def rotate_refresh_token(db: Session, old_raw_token: str):
    token_hash = RefreshToken.hash_token(old_raw_token)
    old_rt = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.revoked == False,
        RefreshToken.expires_at > datetime.utcnow(),
    ).first()

    if not old_rt:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    old_rt.revoked = True
    db.commit()

    new_raw_refresh = create_refresh_token(db, old_rt.user_id)
    new_access = create_access_token({"sub": str(old_rt.user_id)})

    user = db.query(User).filter(User.id == old_rt.user_id).first()
    return new_access, new_raw_refresh, user


def revoke_refresh_token(db: Session, raw_token: str):
    token_hash = RefreshToken.hash_token(raw_token)
    rt = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
    ).first()
    if rt:
        rt.revoked = True
        db.commit()
