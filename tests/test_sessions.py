import pytest
from datetime import datetime, timedelta
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


def test_create_session(client: TestClient, test_event: Event, auth_token: str):
    """Verifica crear una sesión en un evento."""
    now = datetime.utcnow()
    response = client.post(
        f"/api/v1/events/{test_event.id}/sessions",
        json={
            "title": "Opening Keynote",
            "speaker": "John Doe",
            "start_datetime": now.isoformat(),
            "end_datetime": (now + timedelta(hours=1)).isoformat(),
            "capacity": 50,
        },
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Opening Keynote"
    assert data["capacity"] == 50


def test_create_session_invalid_times(client: TestClient, test_event: Event, auth_token: str):
    """Verifica validación de horarios (start >= end)."""
    now = datetime.utcnow()
    response = client.post(
        f"/api/v1/events/{test_event.id}/sessions",
        json={
            "title": "Bad Session",
            "speaker": "Jane Doe",
            "start_datetime": (now + timedelta(hours=1)).isoformat(),
            "end_datetime": now.isoformat(),
            "capacity": 30,
        },
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 400
    assert "Start time must be before end time" in response.json()["detail"]


def test_session_overlap_validation(client: TestClient, test_event: Event, session: Session, auth_token: str):
    """Verifica que no se permiten sesiones solapadas."""
    now = datetime.utcnow()
    
    # Crear primera sesión
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
    
    # Intentar crear sesión que se solapa
    response = client.post(
        f"/api/v1/events/{test_event.id}/sessions",
        json={
            "title": "Overlapping Session",
            "speaker": "Speaker 2",
            "start_datetime": (now + timedelta(minutes=30)).isoformat(),
            "end_datetime": (now + timedelta(hours=1, minutes=30)).isoformat(),
            "capacity": 30,
        },
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 400
    assert "overlaps" in response.json()["detail"].lower()


def test_list_sessions(client: TestClient, test_event: Event, session: Session):
    """Verifica listar sesiones de un evento."""
    now = datetime.utcnow()
    for i in range(3):
        s = EventSession(
            event_id=test_event.id,
            title=f"Session {i}",
            speaker=f"Speaker {i}",
            start_datetime=now + timedelta(hours=i*2),
            end_datetime=now + timedelta(hours=i*2+1),
            capacity=50,
        )
        session.add(s)
    session.commit()
    
    response = client.get(f"/api/v1/events/{test_event.id}/sessions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3


def test_update_session(client: TestClient, test_event: Event, session: Session, auth_token: str):
    """Verifica actualizar una sesión."""
    now = datetime.utcnow()
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
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["speaker"] == "Updated Speaker"


def test_delete_session(client: TestClient, test_event: Event, session: Session, auth_token: str):
    """Verifica eliminar una sesión."""
    now = datetime.utcnow()
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
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 204
    assert session.get(EventSession, session_id) is None
