from datetime import datetime

from sqlmodel import SQLModel


class RegistrationRead(SQLModel):
    id: int
    user_id: int
    event_id: int
    registered_at: datetime
