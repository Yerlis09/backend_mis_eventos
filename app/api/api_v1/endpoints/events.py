from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.core.deps import get_current_active_user
from app.core.permissions import require_organizer_or_admin
from app.db.models import Event, User
from app.db.session import get_session
from app.schemas.event import EventCreate, EventRead, EventUpdate

router = APIRouter()


def _check_event_ownership(event: Event, current_user: User) -> None:
    """Raises 403 if the user is not the event creator and not an admin/superuser."""
    is_admin = current_user.is_superuser or current_user.role.value == "admin"
    if is_admin:
        return
    if event.creator_id is not None and event.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )


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
    return session.exec(query.offset(skip).limit(limit)).all()


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
