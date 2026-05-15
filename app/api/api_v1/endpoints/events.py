from math import ceil
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, func, select

from app.core.permissions import require_organizer_or_admin
from app.db.models import Event, User, UserRole
from app.db.session import get_session
from app.schemas.event import EventCreate, EventRead, EventUpdate
from app.schemas.pagination import Page

router = APIRouter()


def _check_event_ownership(event: Event, current_user: User) -> None:
    """Raises 403 if the user is not the event creator and not an admin."""
    if current_user.role == UserRole.admin:
        return
    if event.creator_id is not None and event.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )


@router.get("", response_model=Page[EventRead])
def list_events(
    session: Session = Depends(get_session),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
) -> Page[EventRead]:
    """Lista eventos con paginación y búsqueda opcional."""
    query = select(Event)
    count_query = select(func.count(Event.id))
    if search:
        query = query.where(Event.name.ilike(f"%{search}%"))
        count_query = count_query.where(Event.name.ilike(f"%{search}%"))
    total = session.exec(count_query).one()
    offset = (page - 1) * size
    items = session.exec(query.offset(offset).limit(size)).all()
    pages = ceil(total / size) if total > 0 else 0
    return Page(items=items, total=total, page=page, size=size, pages=pages)


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
    current_user: User = Depends(require_organizer_or_admin),
    session: Session = Depends(get_session),
) -> EventRead:
    """Crea un nuevo evento. Requiere rol organizer o admin."""
    event = Event(**event_create.model_dump(), creator_id=current_user.id)
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@router.put("/{event_id}", response_model=EventRead)
def update_event(
    event_id: int,
    event_update: EventUpdate,
    current_user: User = Depends(require_organizer_or_admin),
    session: Session = Depends(get_session),
) -> EventRead:
    """Actualiza un evento. Solo el creador o un admin puede modificarlo."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    _check_event_ownership(event, current_user)

    update_data = event_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)

    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    current_user: User = Depends(require_organizer_or_admin),
    session: Session = Depends(get_session),
) -> None:
    """Elimina un evento. Solo el creador o un admin puede eliminarlo."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    _check_event_ownership(event, current_user)

    session.delete(event)
    session.commit()
