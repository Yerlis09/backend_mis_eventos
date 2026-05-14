from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel


class EventSessionCreate(SQLModel):
    title: str
    speaker: str
    start_datetime: datetime
    end_datetime: datetime
    capacity: int


class EventSessionUpdate(SQLModel):
    title: Optional[str] = None
    speaker: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    capacity: Optional[int] = None


class EventSessionRead(SQLModel):
    id: int
    title: str
    speaker: str
    start_datetime: datetime
    end_datetime: datetime
    capacity: int


class EventCreate(SQLModel):
    name: str
    description: Optional[str] = None
    capacity: int
    status: str = "draft"


class EventUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None


class EventRead(SQLModel):
    id: int
    name: str
    description: Optional[str] = None
    capacity: int
    status: str
    sessions: list[EventSessionRead] = []
