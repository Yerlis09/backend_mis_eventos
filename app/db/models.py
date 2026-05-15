import enum
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel


class UserRole(str, enum.Enum):
    """Roles disponibles en el sistema.

    - attendee:  usuario estándar, puede registrarse a eventos
    - organizer: puede crear y gestionar eventos y sesiones
    - admin:     acceso completo, equivalente a superusuario
    """
    attendee = "attendee"
    organizer = "organizer"
    admin = "admin"


class UserBase(SQLModel):
    email: str = Field(index=True, unique=True)
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    role: UserRole = Field(default=UserRole.attendee)


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    events: list["Event"] = Relationship(back_populates="creator")
    registrations: list["Registration"] = Relationship(back_populates="user")


class EventBase(SQLModel):
    name: str
    description: Optional[str] = None
    capacity: int = Field(default=0, ge=0)
    status: str = Field(default="draft", max_length=20)
    creator_id: Optional[int] = Field(default=None, foreign_key="user.id")


class Event(EventBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    creator: Optional["User"] = Relationship(back_populates="events")
    sessions: list["EventSession"] = Relationship(back_populates="event")
    registrations: list["Registration"] = Relationship(back_populates="event")


class EventSessionBase(SQLModel):
    title: str
    speaker: str
    start_datetime: datetime
    end_datetime: datetime
    capacity: int = Field(default=0, ge=0)
    event_id: int = Field(foreign_key="event.id")


class EventSession(EventSessionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    event: Optional[Event] = Relationship(back_populates="sessions")


class RegistrationBase(SQLModel):
    user_id: int = Field(foreign_key="user.id")
    event_id: int = Field(foreign_key="event.id")
    registered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Registration(RegistrationBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user: Optional[User] = Relationship(back_populates="registrations")
    event: Optional[Event] = Relationship(back_populates="registrations")

    __table_args__ = (
        UniqueConstraint("user_id", "event_id", name="uq_registration_user_event"),
    )
