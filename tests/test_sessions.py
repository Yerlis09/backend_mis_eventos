import pytest
from datetime import datetime, timedelta, timezone

# SQLite stores datetimes as naive; strip tzinfo so comparisons are consistent in tests.
# In production (PostgreSQL), timezone-aware datetimes work natively.
def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.db.models import Event, EventSession


@pytest.fixture
def test_event(session: Session):
    """Crea un evento de prueba."""
    event = Event(name="Test Event", capacity=100, status="published")
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


def test_create_session(client: TestClient, test_event: Event, organizer_token: str):
    """Verifica crear una sesión en un evento."""
    now = _utcnow()
    response = client.post(
        f"/api/v1/events/{test_event.id}/sessions",
        json={
            "title": "Opening Keynote",
            "speaker": "John Doe",
            "start_datetime": now.isoformat(),
            "end_datetime": (now + timedelta(hours=1)).isoformat(),
            "capacity": 50,
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Opening Keynote"
    assert data["capacity"] == 50


def test_create_session_invalid_times(client: TestClient, test_event: Event, organizer_token: str):
    """Verifica validación de horarios (start >= end)."""
    now = _utcnow()
    response = client.post(
        f"/api/v1/events/{test_event.id}/sessions",
        json={
            "title": "Bad Session",
            "speaker": "Jane Doe",
            "start_datetime": (now + timedelta(hours=1)).isoformat(),
            "end_datetime": now.isoformat(),
            "capacity": 30,
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 400
    assert "Start time must be before end time" in response.json()["detail"]


def test_session_overlap_validation(client: TestClient, test_event: Event, session: Session, organizer_token: str):
    """Verifica que no se permiten sesiones solapadas."""
    now = _utcnow()

    session_1 = EventSession(
        event_id=test_event.id,
        title="Session 1",
        speaker="Speaker 1",
        start_datetime=now,
        end_datetime=now + timedelta(hours=1),
        capacity=50,
    )
    session.add(session_1)
    session.commit()

    response = client.post(
        f"/api/v1/events/{test_event.id}/sessions",
        json={
            "title": "Overlapping Session",
            "speaker": "Speaker 2",
            "start_datetime": (now + timedelta(minutes=30)).isoformat(),
            "end_datetime": (now + timedelta(hours=1, minutes=30)).isoformat(),
            "capacity": 30,
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 400
    assert "overlaps" in response.json()["detail"].lower()


def test_list_sessions(client: TestClient, test_event: Event, session: Session):
    """Verifica listar sesiones de un evento."""
    now = _utcnow()
    for i in range(3):
        s = EventSession(
            event_id=test_event.id,
            title=f"Session {i}",
            speaker=f"Speaker {i}",
            start_datetime=now + timedelta(hours=i * 2),
            end_datetime=now + timedelta(hours=i * 2 + 1),
            capacity=50,
        )
        session.add(s)
    session.commit()

    response = client.get(f"/api/v1/events/{test_event.id}/sessions")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3


def test_update_session(client: TestClient, test_event: Event, session: Session, organizer_token: str):
    """Verifica actualizar una sesión."""
    now = _utcnow()
    s = EventSession(
        event_id=test_event.id,
        title="Original Title",
        speaker="Original Speaker",
        start_datetime=now,
        end_datetime=now + timedelta(hours=1),
        capacity=50,
    )
    session.add(s)
    session.commit()
    session.refresh(s)

    response = client.put(
        f"/api/v1/events/{test_event.id}/sessions/{s.id}",
        json={"title": "Updated Title", "speaker": "Updated Speaker"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["speaker"] == "Updated Speaker"


def test_update_session_times(client: TestClient, test_event: Event, session: Session, organizer_token: str):
    """Verifica actualizar los horarios de una sesión (cubre validación de tiempos en update)."""
    now = _utcnow()
    s = EventSession(
        event_id=test_event.id,
        title="Time Session",
        speaker="Speaker",
        start_datetime=now,
        end_datetime=now + timedelta(hours=1),
        capacity=30,
    )
    session.add(s)
    session.commit()
    session.refresh(s)

    response = client.put(
        f"/api/v1/events/{test_event.id}/sessions/{s.id}",
        json={
            "start_datetime": (now + timedelta(hours=2)).isoformat(),
            "end_datetime": (now + timedelta(hours=3)).isoformat(),
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 200


def test_update_session_invalid_times(client: TestClient, test_event: Event, session: Session, organizer_token: str):
    """Verifica 400 al actualizar sesión con start >= end."""
    now = _utcnow()
    s = EventSession(
        event_id=test_event.id,
        title="Bad Time",
        speaker="Speaker",
        start_datetime=now,
        end_datetime=now + timedelta(hours=1),
        capacity=30,
    )
    session.add(s)
    session.commit()
    session.refresh(s)

    response = client.put(
        f"/api/v1/events/{test_event.id}/sessions/{s.id}",
        json={
            "start_datetime": (now + timedelta(hours=2)).isoformat(),
            "end_datetime": now.isoformat(),
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 400


def test_create_session_nonexistent_event(client: TestClient, organizer_token: str):
    """Verifica 404 al crear sesión en evento inexistente."""
    now = _utcnow()
    response = client.post(
        "/api/v1/events/99999/sessions",
        json={
            "title": "Ghost Session",
            "speaker": "Nobody",
            "start_datetime": now.isoformat(),
            "end_datetime": (now + timedelta(hours=1)).isoformat(),
            "capacity": 10,
        },
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 404


def test_list_sessions_nonexistent_event(client: TestClient):
    """Verifica 404 al listar sesiones de evento inexistente."""
    response = client.get("/api/v1/events/99999/sessions")
    assert response.status_code == 404


def test_update_session_nonexistent_event(client: TestClient, organizer_token: str):
    """Verifica 404 al actualizar sesión de evento inexistente."""
    response = client.put(
        "/api/v1/events/99999/sessions/1",
        json={"title": "Ghost"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 404


def test_update_nonexistent_session(client: TestClient, test_event: Event, organizer_token: str):
    """Verifica 404 al actualizar sesión inexistente."""
    response = client.put(
        f"/api/v1/events/{test_event.id}/sessions/99999",
        json={"title": "Ghost"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 404


def test_delete_session_nonexistent_event(client: TestClient, organizer_token: str):
    """Verifica 404 al eliminar sesión de evento inexistente."""
    response = client.delete(
        "/api/v1/events/99999/sessions/1",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 404


def test_delete_nonexistent_session(client: TestClient, test_event: Event, organizer_token: str):
    """Verifica 404 al eliminar sesión inexistente."""
    response = client.delete(
        f"/api/v1/events/{test_event.id}/sessions/99999",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 404


def test_delete_session(client: TestClient, test_event: Event, session: Session, organizer_token: str):
    """Verifica eliminar una sesión."""
    now = _utcnow()
    s = EventSession(
        event_id=test_event.id,
        title="To Delete",
        speaker="Speaker",
        start_datetime=now,
        end_datetime=now + timedelta(hours=1),
        capacity=50,
    )
    session.add(s)
    session.commit()
    session.refresh(s)
    session_id = s.id

    response = client.delete(
        f"/api/v1/events/{test_event.id}/sessions/{session_id}",
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 204
    assert session.get(EventSession, session_id) is None
