import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.core.security import get_password_hash
from app.db.models import Event, Registration, User


@pytest.fixture
def test_event(session: Session):
    """Crea un evento con capacidad limitada."""
    event = Event(name="Limited Event", capacity=2, status="published")
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


def test_register_to_event(client: TestClient, test_event: Event, auth_token: str):
    """Verifica registrar a un usuario a un evento."""
    response = client.post(
        f"/api/v1/events/{test_event.id}/register",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["event_id"] == test_event.id
    assert "registered_at" in data


def test_register_duplicate(client: TestClient, test_event: Event, auth_token: str):
    """Verifica que un usuario no puede registrarse dos veces al mismo evento."""
    client.post(
        f"/api/v1/events/{test_event.id}/register",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    response = client.post(
        f"/api/v1/events/{test_event.id}/register",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 409
    assert "already registered" in response.json()["detail"].lower()


def test_register_full_event(client: TestClient, test_event: Event, session: Session, auth_token: str):
    """Verifica que no se puede registrar cuando el evento está lleno."""
    filler_users = []
    for i in range(test_event.capacity):
        user = User(
            email=f"filler{i}@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
        )
        session.add(user)
        filler_users.append(user)
    session.commit()

    for user in filler_users:
        session.refresh(user)
        session.add(Registration(user_id=user.id, event_id=test_event.id))
    session.commit()

    response = client.post(
        f"/api/v1/events/{test_event.id}/register",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 400
    assert "full capacity" in response.json()["detail"].lower()


def test_register_nonexistent_event(client: TestClient, auth_token: str):
    """Verifica error 404 al registrarse a evento inexistente."""
    response = client.post(
        "/api/v1/events/999/register",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 404


def test_list_my_registrations(client: TestClient, session: Session, auth_token: str):
    """Verifica listar registros del usuario actual."""
    user = session.exec(select(User)).first()

    for i in range(3):
        event = Event(name=f"RegEvent {i}", capacity=100, status="published")
        session.add(event)
    session.commit()

    events = session.exec(select(Event)).all()
    for event in events:
        session.add(Registration(user_id=user.id, event_id=event.id))
    session.commit()

    response = client.get(
        "/api/v1/my-registrations",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 200
    assert len(response.json()) == 3


def test_unregister_from_event(client: TestClient, test_event: Event, auth_token: str):
    """Verifica desregistrarse de un evento."""
    client.post(
        f"/api/v1/events/{test_event.id}/register",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    response = client.delete(
        f"/api/v1/events/{test_event.id}/unregister",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 204


def test_unregister_not_registered(client: TestClient, test_event: Event, auth_token: str):
    """Verifica error cuando se intenta desregistrarse sin estar registrado."""
    response = client.delete(
        f"/api/v1/events/{test_event.id}/unregister",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 404
    assert "not registered" in response.json()["detail"].lower()


def test_register_requires_auth(client: TestClient, test_event: Event):
    """Verifica que es necesario autenticarse para registrarse."""
    response = client.post(f"/api/v1/events/{test_event.id}/register")
    assert response.status_code == 403
