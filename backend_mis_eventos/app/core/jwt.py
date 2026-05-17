from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import jwt

from app.core.config import settings


def create_access_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Genera un JWT de acceso válido por un periodo de tiempo."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
