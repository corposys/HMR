"""
JWT authentication middleware for FastAPI.
"""
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Request, HTTPException

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is required")

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7


def create_token(user_data: dict) -> str:
    """Create a JWT token with user data."""
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {
        "id": user_data["id"],
        "email": user_data["email"],
        "role": user_data["role"],
        "full_name": user_data["full_name"],
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    """Verify and decode a JWT token."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


async def get_current_user(request: Request) -> dict:
    """
    FastAPI dependency to extract and verify the current user from the
    Authorization header.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")

    token = auth_header.split(" ")[1]
    return verify_token(token)
