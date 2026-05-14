from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func

from app.core.deps import get_current_active_user
from app.db.models import Event, User
from app.db.session import get_session
from app.schemas.event import EventCreate, EventRead, EventUpdate

router = APIRouter()


@router.get("", response_model=list[EventRead])
def list_events(
    session: Session = Depends(get_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
) -> list[EventRead]:
    """Lista eventos con paginación y búsqueda opcional."""
    query = select(Event)
    if search:
        query = query.where(Event.name.ilike(f"%{search}%"))
    events = session.exec(query.offset(skip).limit(limit)).all()
    return events


@router.get("/{event_id}", response_model=EventRead)
def get_event(event_id: int, session: Session = Depends(get_session)) -> EventRead:
    """Obtiene los detalles de un evento."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


@router.post("", response_model=EventRead, status_code=status.HTTP_201_CREATED)
def create_event(
    event_create: EventCreate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
) -> EventRead:
    """Crea un nuevo evento. Solo usuarios autenticados."""
    if event_create.capacity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Capacity must be non-negative",
        )
    event = Event(**event_create.dict())
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@router.put("/{event_id}", response_model=EventRead)
def update_event(
    event_id: int,
    event_update: EventUpdate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
) -> EventRead:
    """Actualiza un evento. Solo usuarios autenticados."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    update_data = event_update.dict(exclude_unset=True)
    if "capacity" in update_data and update_data["capacity"] < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Capacity must be non-negative",
        )

    for field, value in update_data.items():
        setattr(event, field, value)

    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
) -> None:
    """Elimina un evento. Solo usuarios autenticados."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    session.delete(event)
    session.commit()
