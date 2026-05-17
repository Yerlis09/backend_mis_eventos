from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.deps import get_current_active_user
from app.core.jwt import create_access_token
from app.core.security import get_password_hash, verify_password
from app.db.models import User
from app.db.session import get_session
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserLogin, UserRead

router = APIRouter()


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_active_user)) -> UserRead:
    """Retorna el perfil del usuario autenticado."""
    return current_user


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_create: UserCreate, session: Session = Depends(get_session)) -> UserRead:
    """Registra un nuevo usuario con credenciales seguras."""
    existing_user = session.exec(select(User).where(User.email == user_create.email)).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=user_create.email,
        full_name=user_create.full_name,
        hashed_password=get_password_hash(user_create.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(user_login: UserLogin, session: Session = Depends(get_session)) -> Token:
    """Autentica un usuario y devuelve un token JWT."""
    user = session.exec(select(User).where(User.email == user_login.email)).first()
    if not user or not verify_password(user_login.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token({"sub": user.email, "user_id": user.id, "role": user.role})
    return Token(access_token=access_token, token_type="bearer")
