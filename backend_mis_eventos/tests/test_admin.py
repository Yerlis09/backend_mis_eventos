from fastapi.testclient import TestClient
from sqlmodel import Session

from app.db.models import User


def test_list_users_as_superuser(client: TestClient, test_user: User, superuser_token: str):
    """Verifica que un superusuario puede listar todos los usuarios registrados."""
    response = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {superuser_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 1
    assert all("hashed_password" not in u for u in data["items"])


def test_list_users_as_regular_user(client: TestClient, test_user: User, auth_token: str):
    """Verifica que un usuario sin privilegios recibe 403."""
    response = client.get(
        "/api/v1/admin/users",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 403
    assert "Not enough permissions" in response.json()["detail"]


def test_list_users_without_auth(client: TestClient):
    """Verifica que el endpoint admin requiere autenticación."""
    response = client.get("/api/v1/admin/users")
    assert response.status_code == 403


def test_update_role_nonexistent_user(client: TestClient, superuser_token: str):
    """Verifica 404 al cambiar el rol de un usuario inexistente."""
    response = client.patch(
        "/api/v1/admin/users/99999/role",
        json={"role": "organizer"},
        headers={"Authorization": f"Bearer {superuser_token}"},
    )
    assert response.status_code == 404


def test_update_active_nonexistent_user(client: TestClient, superuser_token: str):
    """Verifica 404 al activar/desactivar un usuario inexistente."""
    response = client.patch(
        "/api/v1/admin/users/99999/active",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {superuser_token}"},
    )
    assert response.status_code == 404


def test_list_users_pagination(client: TestClient, session: Session, superuser_token: str):
    """Verifica paginación en el listado de usuarios con page/size."""
    for i in range(5):
        session.add(User(
            email=f"extra{i}@example.com",
            hashed_password="hashed",
            is_active=True,
        ))
    session.commit()

    response = client.get(
        "/api/v1/admin/users?page=1&size=3",
        headers={"Authorization": f"Bearer {superuser_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 3
    assert data["total"] >= 5
    assert data["page"] == 1
