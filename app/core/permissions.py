from fastapi import Depends, HTTPException, status

from app.core.deps import get_current_active_user
from app.db.models import User, UserRole


def require_roles(*roles: UserRole):
    """Factory: dependency that passes only if the user has one of the given roles (or is_superuser)."""
    async def checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.is_superuser or current_user.role in roles:
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return checker


require_organizer_or_admin = require_roles(UserRole.organizer, UserRole.admin)
