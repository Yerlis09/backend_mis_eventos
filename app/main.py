from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api_v1.routes import api_router

app = FastAPI(
    title="Mis Eventos Backend",
    version="0.1.0",
    description="Backend MVP for Mis Eventos, focused on events, auth, sessions and registrations.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
