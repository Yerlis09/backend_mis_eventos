from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check() -> dict:
    """Comprueba si el servicio está disponible."""
    return {"status": "ok", "service": "Mis Eventos Backend"}
