from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


class UserBase(SQLModel):
    email: str = Field(index=True, unique=True)
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    registrations: List["Registration"] = Relationship(back_populates="user")


class EventBase(SQLModel):
    name: str
    description: Optional[str] = None
    capacity: int = Field(default=0, ge=0)
    status: str = Field(default="draft", max_length=20)


class Event(EventBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sessions: List["EventSession"] = Relationship(back_populates="event")
    registrations: List["Registration"] = Relationship(back_populates="event")


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
    registered_at: datetime = Field(default_factory=datetime.utcnow)


class Registration(RegistrationBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user: Optional[User] = Relationship(back_populates="registrations")
    event: Optional[Event] = Relationship(back_populates="registrations")
