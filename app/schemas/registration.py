from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel


class RegistrationCreate(SQLModel):
    event_id: int


class RegistrationRead(SQLModel):
    id: int
    user_id: int
    event_id: int
    registered_at: datetime
