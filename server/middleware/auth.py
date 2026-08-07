"""
JWT authentication middleware and RBAC for FastAPI.
"""
import os
import sys
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, Request

JWT_SECRET = os.getenv("JWT_SECRET") or "dev_secret"
if not os.getenv("JWT_SECRET"):
    msg = "JWT_SECRET environment variable not set, using insecure dev default"
    print(msg, file=sys.stderr)

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7


def create_token(user_data: dict) -> str:
    """Create a JWT token with user data including role and permissions."""
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {
        "id": user_data["id"],
        "email": user_data["email"],
        "role": user_data["role"],
        "full_name": user_data["full_name"],
        "role_id": user_data.get("role_id"),
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


def require_permission(resource: str, action: str):
    """
    FastAPI dependency that checks if the current user has the specified permission.
    Admin role (role_id=1) bypasses all permission checks.
    """
    async def _check_permission(current_user: dict = Depends(get_current_user)) -> dict:
        from db import get_connection, release_connection

        role_id = current_user.get("role_id")
        if not role_id:
            conn = get_connection()
            try:
                cur = conn.cursor()
                cur.execute("SELECT role_id FROM users WHERE id = %s", (current_user["id"],))
                row = cur.fetchone()
                if not row or not row[0]:
                    raise HTTPException(status_code=403, detail="Sin permisos")
                role_id = row[0]
            finally:
                cur.close()
                release_connection(conn)

        if role_id == 1:
            return {**current_user, "role_id": role_id, "_admin_bypass": True}

        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT permissions FROM roles WHERE id = %s", (role_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=403, detail="Sin permisos")
            permissions = row[0] if isinstance(row[0], dict) else {}
            resource_perms = permissions.get(resource, {})
            if not resource_perms.get(action, False):
                raise HTTPException(status_code=403, detail="Sin permisos para esta acción")
            return {**current_user, "role_id": role_id, "permissions": permissions}
        finally:
            cur.close()
            release_connection(conn)

    return _check_permission