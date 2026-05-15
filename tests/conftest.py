import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.core.security import get_password_hash
from app.db.models import User, UserRole
from app.db.session import get_session
from app.main import app


@pytest.fixture(name="session")
def session_fixture():
    """Crea una sesión de BD SQLite en memoria para tests."""
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Crea un cliente de prueba con BD en memoria."""
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override

    with TestClient(app) as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
def test_user(session: Session):
    """Crea un usuario activo con rol attendee para los tests."""
    user = User(
        email="test@example.com",
        full_name="Test User",
        hashed_password=get_password_hash("testpass123"),
        is_active=True,
        role=UserRole.attendee,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
def inactive_user(session: Session):
    """Crea un usuario inactivo para los tests."""
    user = User(
        email="inactive@example.com",
        full_name="Inactive User",
        hashed_password=get_password_hash("testpass123"),
        is_active=False,
        role=UserRole.attendee,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
def superuser(session: Session):
    """Crea un usuario administrador con role=admin para los tests de admin."""
    user = User(
        email="admin@example.com",
        full_name="Admin User",
        hashed_password=get_password_hash("adminpass123"),
        is_active=True,
        role=UserRole.admin,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
def auth_token(client: TestClient, test_user: User):
    """Obtiene un token JWT válido para el usuario de prueba."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "testpass123"},
    )
    return response.json()["access_token"]


@pytest.fixture
def superuser_token(client: TestClient, superuser: User):
    """Obtiene un token JWT válido para el superusuario."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "adminpass123"},
    )
    return response.json()["access_token"]


@pytest.fixture
def organizer_user(session: Session):
    """Crea un usuario con rol organizer para los tests de eventos y sesiones."""
    user = User(
        email="organizer@example.com",
        full_name="Organizer User",
        hashed_password=get_password_hash("organizerpass123"),
        is_active=True,
        role=UserRole.organizer,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
def organizer_token(client: TestClient, organizer_user: User):
    """Obtiene un token JWT válido para el usuario organizer."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "organizer@example.com", "password": "organizerpass123"},
    )
    return response.json()["access_token"]
