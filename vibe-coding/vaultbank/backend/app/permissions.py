from fastapi import Depends, HTTPException, status
from .routers.auth import get_current_user
from .models.user import User, UserRole


def require_roles(*roles: UserRole):
    def _check(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in roles]}",
            )
        return current_user
    return Depends(_check)


require_staff = require_roles(
    UserRole.teller, UserRole.branch_manager, UserRole.compliance_officer, UserRole.admin
)
require_teller_up = require_roles(UserRole.teller, UserRole.branch_manager, UserRole.admin)
require_manager_up = require_roles(UserRole.branch_manager, UserRole.admin)
require_compliance_up = require_roles(UserRole.compliance_officer, UserRole.admin)
require_admin = require_roles(UserRole.admin)
