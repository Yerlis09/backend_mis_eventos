from fastapi import FastAPI
from app.api.api_v1.routes import api_router

app = FastAPI(
    title="Mis Eventos Backend",
    version="0.1.0",
    description="Backend MVP for Mis Eventos, focused on events, auth, sessions and registrations.",
)

app.include_router(api_router, prefix="/api/v1")
