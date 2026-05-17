from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, func, select

from app.core.deps import get_current_superuser
from app.db.models import User
from app.db.session import get_session
from app.schemas.pagination import Page
from app.schemas.user import UserActiveUpdate, UserRead, UserRoleUpdate

router = APIRouter()


@router.get("/users", response_model=Page[UserRead])
def list_users(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_superuser),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
) -> Page[UserRead]:
    """Lista todos los usuarios registrados. Requiere privilegios de superusuario."""
    total = session.exec(select(func.count(User.id))).one()
    offset = (page - 1) * size
    items = session.exec(select(User).offset(offset).limit(size)).all()
    pages = ceil(total / size) if total > 0 else 0
    return Page(items=items, total=total, page=page, size=size, pages=pages)


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
