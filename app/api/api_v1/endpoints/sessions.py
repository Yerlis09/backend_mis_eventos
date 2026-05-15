from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.core.permissions import require_organizer_or_admin
from app.db.models import Event, EventSession, User
from app.db.session import get_session
from app.schemas.event import EventSessionCreate, EventSessionRead, EventSessionUpdate

router = APIRouter()


def _validate_session_times(
    start: datetime,
    end: datetime,
    event_id: int,
    session: Session,
    exclude_id: Optional[int] = None,
) -> None:
    """Valida que los horarios de una sesión no se superpongan con otras del mismo evento."""
    query = select(EventSession).where(EventSession.event_id == event_id)
    if exclude_id is not None:
        query = query.where(EventSession.id != exclude_id)

    existing_sessions = session.exec(query).all()
    for existing in existing_sessions:
        if start < existing.end_datetime and end > existing.start_datetime:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session time overlaps with another session in the same event",
            )


@router.post("/{event_id}/sessions", response_model=EventSessionRead, status_code=status.HTTP_201_CREATED)
def create_session(
    event_id: int,
    session_create: EventSessionCreate,
    current_user: User = Depends(require_organizer_or_admin),
    session: Session = Depends(get_session),
) -> EventSessionRead:
    """Crea una nueva sesión en un evento. Requiere rol organizer o admin."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if session_create.start_datetime >= session_create.end_datetime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start time must be before end time",
        )

    _validate_session_times(session_create.start_datetime, session_create.end_datetime, event_id, session)

    new_session = EventSession(event_id=event_id, **session_create.model_dump())
    session.add(new_session)
    session.commit()
    session.refresh(new_session)
    return new_session


@router.get("/{event_id}/sessions", response_model=list[EventSessionRead])
def list_sessions(
    event_id: int,
    session: Session = Depends(get_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
) -> list[EventSessionRead]:
    """Lista las sesiones de un evento con paginación opcional."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    return session.exec(
        select(EventSession).where(EventSession.event_id == event_id).offset(skip).limit(limit)
    ).all()


@router.put("/{event_id}/sessions/{session_id}", response_model=EventSessionRead)
def update_session(
    event_id: int,
    session_id: int,
    session_update: EventSessionUpdate,
    current_user: User = Depends(require_organizer_or_admin),
    session: Session = Depends(get_session),
) -> EventSessionRead:
    """Actualiza una sesión. Requiere rol organizer o admin."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    db_session = session.get(EventSession, session_id)
    if not db_session or db_session.event_id != event_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    update_data = session_update.model_dump(exclude_unset=True)

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
    current_user: User = Depends(require_organizer_or_admin),
    session: Session = Depends(get_session),
) -> None:
    """Elimina una sesión de un evento. Requiere rol organizer o admin."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    db_session = session.get(EventSession, session_id)
    if not db_session or db_session.event_id != event_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    session.delete(db_session)
    session.commit()
