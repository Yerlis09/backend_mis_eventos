from fastapi.testclient import TestClient
from sqlmodel import Session

from app.db.models import User


def test_health_check(client: TestClient):
    """Verifica que el endpoint de salud funciona."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_register_user(client: TestClient):
    """Verifica el registro de un nuevo usuario."""
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "new@example.com", "password": "password123", "full_name": "New User"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "new@example.com"
    assert data["full_name"] == "New User"
    assert "hashed_password" not in data


def test_register_duplicate_email(client: TestClient, test_user: User):
    """Verifica que no se permita registrar el mismo email dos veces."""
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]


def test_register_short_password(client: TestClient):
    """Verifica que se rechacen contraseñas menores a 8 caracteres."""
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "new@example.com", "password": "short"},
    )
    assert response.status_code == 422


def test_login_success(client: TestClient, test_user: User):
    """Verifica el login exitoso."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpass123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_password(client: TestClient, test_user: User):
    """Verifica que login falla con contraseña incorrecta."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]


def test_login_invalid_email(client: TestClient):
    """Verifica que login falla con email inexistente."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "password123"},
    )
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]


def test_inactive_user_blocked(client: TestClient, inactive_user: User):
    """Verifica que usuarios inactivos no pueden acceder a rutas protegidas."""
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "inactive@example.com", "password": "testpass123"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    response = client.post(
        "/api/v1/events",
        json={"name": "Test Event", "capacity": 10, "status": "draft"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 400
    assert "Inactive user" in response.json()["detail"]
