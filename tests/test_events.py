import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.db.models import Event


def test_list_events_empty(client: TestClient):
    """Verifica que lista de eventos está vacía al inicio."""
    response = client.get("/api/v1/events")
    assert response.status_code == 200
    assert response.json() == []


def test_create_event(client: TestClient, auth_token: str):
    """Verifica crear un evento con autenticación."""
    response = client.post(
        "/api/v1/events",
        json={"name": "Test Event", "description": "Test", "capacity": 100, "status": "draft"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Event"
    assert data["capacity"] == 100
    assert "id" in data


def test_create_event_without_auth(client: TestClient):
    """Verifica que no se puede crear evento sin autenticación."""
    response = client.post(
        "/api/v1/events",
        json={"name": "Test Event", "description": "Test", "capacity": 100},
    )
    assert response.status_code == 403


def test_create_event_invalid_capacity(client: TestClient, auth_token: str):
    """Verifica validación de capacidad negativa."""
    response = client.post(
        "/api/v1/events",
        json={"name": "Test Event", "capacity": -5},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 400
    assert "Capacity must be non-negative" in response.json()["detail"]


def test_get_event(client: TestClient, session: Session, auth_token: str):
    """Verifica obtener un evento por ID."""
    event = Event(name="Test", capacity=50, status="draft")
    session.add(event)
    session.commit()
    session.refresh(event)
    
    response = client.get(f"/api/v1/events/{event.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test"
    assert data["capacity"] == 50


def test_get_nonexistent_event(client: TestClient):
    """Verifica que error 404 para evento inexistente."""
    response = client.get("/api/v1/events/999")
    assert response.status_code == 404


def test_update_event(client: TestClient, session: Session, auth_token: str):
    """Verifica actualizar un evento."""
    event = Event(name="Original", capacity=50, status="draft")
    session.add(event)
    session.commit()
    session.refresh(event)
    
    response = client.put(
        f"/api/v1/events/{event.id}",
        json={"name": "Updated", "capacity": 100},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated"
    assert data["capacity"] == 100


def test_delete_event(client: TestClient, session: Session, auth_token: str):
    """Verifica eliminar un evento."""
    event = Event(name="To Delete", capacity=50, status="draft")
    session.add(event)
    session.commit()
    session.refresh(event)
    event_id = event.id
    
    response = client.delete(
        f"/api/v1/events/{event_id}",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 204
    
    # Verificar que fue eliminado
    assert session.get(Event, event_id) is None


def test_search_events(client: TestClient, session: Session):
    """Verifica búsqueda de eventos por nombre."""
    event1 = Event(name="Python Conference", capacity=100, status="draft")
    event2 = Event(name="Web Development Summit", capacity=50, status="draft")
    session.add(event1)
    session.add(event2)
    session.commit()
    
    response = client.get("/api/v1/events?search=Python")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Python Conference"


def test_pagination(client: TestClient, session: Session):
    """Verifica paginación de eventos."""
    for i in range(15):
        event = Event(name=f"Event {i}", capacity=50, status="draft")
        session.add(event)
    session.commit()
    
    response = client.get("/api/v1/events?skip=0&limit=10")
    assert response.status_code == 200
    assert len(response.json()) == 10
    
    response = client.get("/api/v1/events?skip=10&limit=10")
    assert response.status_code == 200
    assert len(response.json()) == 5
