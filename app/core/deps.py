from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlmodel import Session, select

from app.core.config import settings
from app.db.models import User, UserRole
from app.db.session import get_session

_http_scheme = HTTPBearer()


async def _oauth2_scheme(auth: HTTPAuthorizationCredentials = Depends(_http_scheme)) -> str:
    """Extrae el token Bearer del header Authorization."""
    return auth.credentials


async def get_current_user(
    token: str = Depends(_oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    """Decodifica y valida el JWT; retorna el usuario asociado desde la BD."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        email: str = payload.get("sub")
        user_id: Optional[int] = payload.get("user_id")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = session.exec(select(User).where(User.id == user_id)).first()
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Verifica que el usuario autenticado esté activo."""
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Verifica que el usuario tenga role=admin en el sistema RBAC."""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user
