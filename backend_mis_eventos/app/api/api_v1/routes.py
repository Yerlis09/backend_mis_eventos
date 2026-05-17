from fastapi import APIRouter

from app.api.api_v1.endpoints import admin, auth, events, health, registrations, sessions

api_router = APIRouter()
api_router.include_router(health.router, prefix="", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(sessions.router, prefix="/events", tags=["sessions"])
api_router.include_router(registrations.router, prefix="", tags=["registrations"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
