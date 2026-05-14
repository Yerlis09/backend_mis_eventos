from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.deps import get_current_active_user
from app.db.models import Event, EventSession, User
from app.db.session import get_session
from app.schemas.event import EventSessionCreate, EventSessionRead, EventSessionUpdate

router = APIRouter()


def _validate_session_times(start: datetime, end: datetime, event_id: int, session: Session, exclude_id: int = None) -> None:
    """Valida que los horarios de una sesión no se superpongan con otras del mismo evento."""
    query = select(EventSession).where(EventSession.event_id == event_id)
    if exclude_id:
        query = query.where(EventSession.id != exclude_id)
    
    existing_sessions = session.exec(query).all()
    for existing in existing_sessions:
        # Detectar sobreposición: start < other.end AND end > other.start
        if start < existing.end_datetime and end > existing.start_datetime:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session time overlaps with another session in the same event",
            )


@router.post("/{event_id}/sessions", response_model=EventSessionRead, status_code=status.HTTP_201_CREATED)
def create_session(
    event_id: int,
    session_create: EventSessionCreate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
) -> EventSessionRead:
    """Crea una nueva sesión en un evento con validación de horarios."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if session_create.start_datetime >= session_create.end_datetime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start time must be before end time",
        )

    if session_create.capacity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Capacity must be non-negative",
        )

    _validate_session_times(session_create.start_datetime, session_create.end_datetime, event_id, session)

    new_session = EventSession(event_id=event_id, **session_create.dict())
    session.add(new_session)
    session.commit()
    session.refresh(new_session)
    return new_session


@router.get("/{event_id}/sessions", response_model=list[EventSessionRead])
def list_sessions(
    event_id: int,
    session: Session = Depends(get_session),
) -> list[EventSessionRead]:
    """Lista todas las sesiones de un evento."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    sessions = session.exec(select(EventSession).where(EventSession.event_id == event_id)).all()
    return sessions


@router.put("/{event_id}/sessions/{session_id}", response_model=EventSessionRead)
def update_session(
    event_id: int,
    session_id: int,
    session_update: EventSessionUpdate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
) -> EventSessionRead:
    """Actualiza una sesión con validación de horarios."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    db_session = session.get(EventSession, session_id)
    if not db_session or db_session.event_id != event_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    update_data = session_update.dict(exclude_unset=True)

    if "start_datetime" in update_data or "end_datetime" in update_data:
        start = update_data.get("start_datetime", db_session.start_datetime)
        end = update_data.get("end_datetime", db_session.end_datetime)
        if start >= end:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start time must be before end time",
            )
        _validate_session_times(start, end, event_id, session, exclude_id=session_id)

    for field, value in update_data.items():
        setattr(db_session, field, value)

    session.add(db_session)
    session.commit()
    session.refresh(db_session)
    return db_session


@router.delete("/{event_id}/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    event_id: int,
    session_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
) -> None:
    """Elimina una sesión de un evento."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    db_session = session.get(EventSession, session_id)
    if not db_session or db_session.event_id != event_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    session.delete(db_session)
    session.commit()
