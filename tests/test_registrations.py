import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

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
    # Primer registro
    response = client.post(
        f"/api/v1/events/{test_event.id}/register",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 201
    
    # Intento duplicado
    response = client.post(
        f"/api/v1/events/{test_event.id}/register",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_register_full_event(client: TestClient, test_event: Event, session: Session, auth_token: str):
    """Verifica que no se puede registrar cuando el evento está lleno."""
    # Crear dos usuarios y registrarlos
    for i in range(test_event.capacity):
        user = User(
            email=f"user{i}@example.com",
            hashed_password="hashed",
            is_active=True,
        )
        session.add(user)
    session.commit()
    
    # Obtener usuarios y registrarlos
    users = session.query(User).limit(test_event.capacity).all()
    for user in users:
        reg = Registration(user_id=user.id, event_id=test_event.id)
        session.add(reg)
    session.commit()
    
    # Intentar registrar al usuario de prueba (evento lleno)
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
    # Obtener el usuario actual desde la BD
    user = session.query(User).first()
    
    # Crear varios eventos y registrar al usuario
    for i in range(3):
        event = Event(name=f"Event {i}", capacity=100, status="published")
        session.add(event)
    session.commit()
    
    events = session.query(Event).all()
    for event in events:
        reg = Registration(user_id=user.id, event_id=event.id)
        session.add(reg)
    session.commit()
    
    response = client.get(
        "/api/v1/my-registrations",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3


def test_unregister_from_event(client: TestClient, test_event: Event, auth_token: str):
    """Verifica desregistrarse de un evento."""
    # Registrar primero
    response = client.post(
        f"/api/v1/events/{test_event.id}/register",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 201
    
    # Desregistrarse
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
    response = client.post(
        f"/api/v1/events/{test_event.id}/register",
    )
    assert response.status_code == 403



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
    # Primer registro
    response = client.post(
        f"/api/v1/events/{test_event.id}/register",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 201
    
    # Intento duplicado
    response = client.post(
        f"/api/v1/events/{test_event.id}/register",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_register_full_event(client: TestClient, test_event: Event, session: Session, auth_token: str):
    """Verifica que no se puede registrar cuando el evento está lleno."""
    # Crear dos usuarios y registrarlos
    for i in range(test_event.capacity):
        user = User(
            email=f"user{i}@example.com",
            hashed_password=get_password_hash("password"),
            is_active=True,
        )
        session.add(user)
    session.commit()
    
    # Obtener usuarios y registrarlos
    users = session.query(User).limit(test_event.capacity).all()
    for user in users:
        reg = Registration(user_id=user.id, event_id=test_event.id)
        session.add(reg)
    session.commit()
    
    # Intentar registrar al usuario de prueba (evento lleno)
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
    # Obtener el usuario actual desde la BD
    user = session.query(User).first()
    
    # Crear varios eventos y registrar al usuario
    for i in range(3):
        event = Event(name=f"Event {i}", capacity=100, status="published")
        session.add(event)
    session.commit()
    
    events = session.query(Event).all()
    for event in events:
        reg = Registration(user_id=user.id, event_id=event.id)
        session.add(reg)
    session.commit()
    
    response = client.get(
        "/api/v1/my-registrations",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3


def test_unregister_from_event(client: TestClient, test_event: Event, auth_token: str):
    """Verifica desregistrarse de un evento."""
    # Registrar primero
    response = client.post(
        f"/api/v1/events/{test_event.id}/register",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 201
    
    # Desregistrarse
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
    response = client.post(
        f"/api/v1/events/{test_event.id}/register",
    )
    assert response.status_code == 403
