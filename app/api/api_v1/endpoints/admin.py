from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.core.deps import get_current_superuser
from app.db.models import User
from app.db.session import get_session
from app.schemas.user import UserActiveUpdate, UserRead, UserRoleUpdate

router = APIRouter()


@router.get("/users", response_model=list[UserRead])
def list_users(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_superuser),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
) -> list[UserRead]:
    """Lista todos los usuarios registrados. Requiere privilegios de superusuario."""
    return session.exec(select(User).offset(skip).limit(limit)).all()


@router.get("/users/{user_id}", response_model=UserRead)
def get_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_superuser),
) -> UserRead:
    """Obtiene el perfil de un usuario por ID. Solo admin."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.patch("/users/{user_id}/role", response_model=UserRead)
def update_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_superuser),
) -> UserRead:
    """Cambia el rol de un usuario. Solo admin."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.role = role_update.role
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.patch("/users/{user_id}/active", response_model=UserRead)
def update_user_active(
    user_id: int,
    active_update: UserActiveUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_superuser),
) -> UserRead:
    """Activa o desactiva un usuario. Solo admin."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = active_update.is_active
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
