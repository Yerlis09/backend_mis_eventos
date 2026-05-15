from fastapi.testclient import TestClient
from sqlmodel import Session

from app.db.models import Event


def test_list_events_empty(client: TestClient):
    """Verifica que lista de eventos está vacía al inicio."""
    response = client.get("/api/v1/events")
    assert response.status_code == 200
    assert response.json() == []


def test_create_event(client: TestClient, organizer_token: str):
    """Verifica crear un evento con autenticación de organizer."""
    response = client.post(
        "/api/v1/events",
        json={"name": "Test Event", "description": "Test", "capacity": 100, "status": "draft"},
        headers={"Authorization": f"Bearer {organizer_token}"},
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


def test_create_event_invalid_capacity(client: TestClient, organizer_token: str):
    """Verifica que se rechaza capacidad negativa (validación Pydantic)."""
    response = client.post(
        "/api/v1/events",
        json={"name": "Test Event", "capacity": -5},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 422


def test_create_event_invalid_status(client: TestClient, organizer_token: str):
    """Verifica que se rechaza un estado de evento inválido."""
    response = client.post(
        "/api/v1/events",
        json={"name": "Test Event", "capacity": 10, "status": "invalid_status"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 422


def test_get_event(client: TestClient, session: Session):
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
    """Verifica error 404 para evento inexistente."""
    response = client.get("/api/v1/events/999")
    assert response.status_code == 404


def test_update_event(client: TestClient, session: Session, organizer_token: str):
    """Verifica actualizar un evento propio."""
    # El organizer crea el evento via API para que creator_id quede asignado
    create_response = client.post(
        "/api/v1/events",
        json={"name": "Original", "capacity": 50, "status": "draft"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    event_id = create_response.json()["id"]

    response = client.put(
        f"/api/v1/events/{event_id}",
        json={"name": "Updated", "capacity": 100},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated"
    assert data["capacity"] == 100


def test_delete_event(client: TestClient, session: Session, organizer_token: str):
    """Verifica eliminar un evento propio."""
    create_response = client.post(
        "/api/v1/events",
        json={"name": "To Delete", "capacity": 50, "status": "draft"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    event_id = create_response.json()["id"]

    response = client.delete(
        f"/api/v1/events/{event_id}",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 204


def test_search_events(client: TestClient, session: Session):
    """Verifica búsqueda de eventos por nombre."""
    session.add(Event(name="Python Conference", capacity=100, status="draft"))
    session.add(Event(name="Web Development Summit", capacity=50, status="draft"))
    session.commit()

    response = client.get("/api/v1/events?search=Python")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Python Conference"


def test_pagination(client: TestClient, session: Session):
    """Verifica paginación de eventos."""
    for i in range(15):
        session.add(Event(name=f"Event {i}", capacity=50, status="draft"))
    session.commit()

    response = client.get("/api/v1/events?skip=0&limit=10")
    assert response.status_code == 200
    assert len(response.json()) == 10

    response = client.get("/api/v1/events?skip=10&limit=10")
    assert response.status_code == 200
    assert len(response.json()) == 5
