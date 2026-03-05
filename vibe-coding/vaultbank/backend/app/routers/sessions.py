from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.session import UserSession
from ..models.refresh_token import RefreshToken
from .auth import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _session_to_dict(s: UserSession) -> dict:
    return {
        "id": s.id,
        "ip_address": s.ip_address,
        "user_agent": s.user_agent,
        "device_info": s.device_info,
        "created_at": s.created_at.isoformat(),
        "last_active": s.last_active.isoformat(),
        "is_active": s.is_active,
    }


@router.get("/")
def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(UserSession)
        .filter(UserSession.user_id == current_user.id, UserSession.is_active == True)
        .order_by(UserSession.last_active.desc())
        .all()
    )
    return [_session_to_dict(s) for s in sessions]


@router.delete("/{session_id}")
def revoke_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.is_active = False

    # Also revoke the associated refresh token if present
    if session.refresh_token_hash:
        rt = db.query(RefreshToken).filter(
            RefreshToken.token_hash == session.refresh_token_hash,
            RefreshToken.user_id == current_user.id,
        ).first()
        if rt:
            rt.revoked = True

    db.commit()
    return {"detail": "Session revoked"}


@router.delete("/")
def revoke_all_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke all sessions except current — useful for 'logout everywhere'."""
    db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_active == True,
    ).update({"is_active": False})

    # Revoke all refresh tokens
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.revoked == False,
    ).update({"revoked": True})

    db.commit()
    return {"detail": "All sessions revoked"}
