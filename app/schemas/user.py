from typing import Optional

from pydantic import EmailStr, Field
from sqlmodel import SQLModel

from app.db.models import UserRole


class UserCreate(SQLModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: Optional[str] = None
    # role no es editable en el registro: todos los usuarios nuevos son attendee por defecto


class UserLogin(SQLModel):
    email: EmailStr
    password: str


class UserRead(SQLModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool
    is_superuser: bool
    role: UserRole


class UserRoleUpdate(SQLModel):
    role: UserRole


class UserActiveUpdate(SQLModel):
    is_active: bool
