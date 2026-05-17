from datetime import datetime
from typing import Literal, Optional

from sqlmodel import Field, SQLModel

EventStatus = Literal["draft", "published", "cancelled"]


class EventSessionCreate(SQLModel):
    title: str
    speaker: str
    start_datetime: datetime
    end_datetime: datetime
    capacity: int = Field(ge=0)


class EventSessionUpdate(SQLModel):
    title: Optional[str] = None
    speaker: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    capacity: Optional[int] = Field(None, ge=0)


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
    capacity: int = Field(ge=0)
    status: EventStatus = "draft"


class EventUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = Field(None, ge=0)
    status: Optional[EventStatus] = None


class EventRead(SQLModel):
    id: int
    name: str
    description: Optional[str] = None
    capacity: int
    status: str
    creator_id: Optional[int] = None
    sessions: list[EventSessionRead] = []
