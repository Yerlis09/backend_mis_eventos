from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func

from app.core.deps import get_current_active_user
from app.db.models import Event, Registration, User
from app.db.session import get_session
from app.schemas.registration import RegistrationCreate, RegistrationRead

router = APIRouter()


@router.post("/events/{event_id}/register", response_model=RegistrationRead, status_code=status.HTTP_201_CREATED)
def register_to_event(
    event_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
) -> RegistrationRead:
    """Registra al usuario actual a un evento con validación de capacidad y duplicados."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Verificar que el usuario no esté ya registrado
    existing = session.exec(
        select(Registration).where(
            (Registration.user_id == current_user.id) & (Registration.event_id == event_id)
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already registered to this event",
        )

    # Verificar capacidad
    current_registrations = session.exec(
        select(func.count(Registration.id)).where(Registration.event_id == event_id)
    ).one()
    if current_registrations >= event.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event is at full capacity",
        )

    registration = Registration(user_id=current_user.id, event_id=event_id)
    session.add(registration)
    session.commit()
    session.refresh(registration)
    return registration


@router.get("/my-registrations", response_model=list[RegistrationRead])
def list_my_registrations(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
) -> list[RegistrationRead]:
    """Lista los eventos a los que el usuario está registrado."""
    registrations = session.exec(
        select(Registration).where(Registration.user_id == current_user.id)
    ).all()
    return registrations


@router.delete("/events/{event_id}/unregister", status_code=status.HTTP_204_NO_CONTENT)
def unregister_from_event(
    event_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
) -> None:
    """Desregistra al usuario actual de un evento."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    registration = session.exec(
        select(Registration).where(
            (Registration.user_id == current_user.id) & (Registration.event_id == event_id)
        )
    ).first()
    if not registration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not registered to this event",
        )

    session.delete(registration)
    session.commit()
