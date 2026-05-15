from fastapi.testclient import TestClient
from sqlmodel import Session

from app.db.models import User


# ---------------------------------------------------------------------------
# Permisos por rol — creación de eventos
# ---------------------------------------------------------------------------

def test_attendee_cannot_create_event(client: TestClient, auth_token: str):
    """Attendee no puede crear eventos (403)."""
    response = client.post(
        "/api/v1/events",
        json={"name": "Attendee Event", "capacity": 10, "status": "draft"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 403


def test_organizer_can_create_event(client: TestClient, organizer_token: str):
    """Organizer puede crear eventos."""
    response = client.post(
        "/api/v1/events",
        json={"name": "Organizer Event", "capacity": 50, "status": "draft"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Organizer Event"


def test_admin_can_create_event(client: TestClient, superuser_token: str):
    """Admin puede crear eventos."""
    response = client.post(
        "/api/v1/events",
        json={"name": "Admin Event", "capacity": 200, "status": "published"},
        headers={"Authorization": f"Bearer {superuser_token}"},
    )
    assert response.status_code == 201


# ---------------------------------------------------------------------------
# Ownership de eventos
# ---------------------------------------------------------------------------

def test_organizer_cannot_edit_others_event(
    client: TestClient, organizer_token: str, superuser_token: str
):
    """Organizer no puede editar un evento que no creó."""
    create = client.post(
        "/api/v1/events",
        json={"name": "Admin's Event", "capacity": 100, "status": "draft"},
        headers={"Authorization": f"Bearer {superuser_token}"},
    )
    event_id = create.json()["id"]

    response = client.put(
        f"/api/v1/events/{event_id}",
        json={"name": "Hijacked"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 403


def test_organizer_can_edit_own_event(client: TestClient, organizer_token: str):
    """Organizer puede editar su propio evento."""
    create = client.post(
        "/api/v1/events",
        json={"name": "My Event", "capacity": 30, "status": "draft"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    event_id = create.json()["id"]

    response = client.put(
        f"/api/v1/events/{event_id}",
        json={"name": "My Updated Event"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "My Updated Event"


def test_admin_can_edit_any_event(
    client: TestClient, organizer_token: str, superuser_token: str
):
    """Admin puede editar cualquier evento sin importar el creador."""
    create = client.post(
        "/api/v1/events",
        json={"name": "Organizer's Event", "capacity": 30, "status": "draft"},
        headers={"Authorization": f"Bearer {organizer_token}"},
    )
    event_id = create.json()["id"]

    response = client.put(
        f"/api/v1/events/{event_id}",
        json={"name": "Admin Override"},
        headers={"Authorization": f"Bearer {superuser_token}"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Admin Override"


# ---------------------------------------------------------------------------
# Gestión de perfiles — admin
# ---------------------------------------------------------------------------

def test_admin_can_view_user_profile(client: TestClient, test_user: User, superuser_token: str):
    """Admin puede ver el perfil de cualquier usuario."""
    response = client.get(
        f"/api/v1/admin/users/{test_user.id}",
        headers={"Authorization": f"Bearer {superuser_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_user.id
    assert data["email"] == test_user.email
    assert "hashed_password" not in data


def test_admin_can_update_user_role(client: TestClient, test_user: User, superuser_token: str):
    """Admin puede cambiar el rol de un usuario."""
    response = client.patch(
        f"/api/v1/admin/users/{test_user.id}/role",
        json={"role": "organizer"},
        headers={"Authorization": f"Bearer {superuser_token}"},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "organizer"


def test_admin_can_deactivate_user(client: TestClient, test_user: User, superuser_token: str):
    """Admin puede desactivar un usuario."""
    response = client.patch(
        f"/api/v1/admin/users/{test_user.id}/active",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {superuser_token}"},
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_admin_can_reactivate_user(client: TestClient, test_user: User, superuser_token: str):
    """Admin puede reactivar un usuario previamente desactivado."""
    client.patch(
        f"/api/v1/admin/users/{test_user.id}/active",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {superuser_token}"},
    )
    response = client.patch(
        f"/api/v1/admin/users/{test_user.id}/active",
        json={"is_active": True},
        headers={"Authorization": f"Bearer {superuser_token}"},
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is True


def test_regular_user_cannot_access_admin_profile(
    client: TestClient, test_user: User, auth_token: str
):
    """Usuario sin privilegios recibe 403 al intentar ver perfiles."""
    response = client.get(
        f"/api/v1/admin/users/{test_user.id}",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 403


def test_admin_get_nonexistent_user(client: TestClient, superuser_token: str):
    """Admin recibe 404 al buscar un usuario inexistente."""
    response = client.get(
        "/api/v1/admin/users/99999",
        headers={"Authorization": f"Bearer {superuser_token}"},
    )
    assert response.status_code == 404
