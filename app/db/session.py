from sqlmodel import create_engine, Session

from app.core.config import settings

engine = create_engine(settings.database_url, echo=False)


def get_session():
    """Devuelve una sesión de base de datos para dependencias de FastAPI."""
    with Session(engine) as session:
        yield session
