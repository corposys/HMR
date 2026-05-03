"""
Authentication routes: register, login, and session verification.
"""
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr

from db import get_connection, release_connection
from middleware.auth import create_token, get_current_user
from middleware.rate_limit import rate_limit

router = APIRouter(prefix="/api/auth", tags=["auth"])


# --- Pydantic Models ---

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# --- Routes ---

@router.post("/register")
@rate_limit(requests=5, window=300)  # 5 requests per 5 minutes
async def register(request: Request, data: RegisterRequest):
    """Register a new user with role 'user'."""
    if not data.full_name or not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Todos los campos son requeridos")

    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")

    # Hash the password
    password_hash = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    conn = get_connection()
    try:
        cur = conn.cursor()

        # Check if email already exists
        cur.execute("SELECT id FROM users WHERE email = %s", (data.email,))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Este correo electrónico ya está registrado")

        # Insert new user
        cur.execute(
            """
            INSERT INTO users (full_name, email, password_hash, role, role_id)
            VALUES (%s, %s, %s, 'user', 3)
            RETURNING id, full_name, email, role, role_id, created_at
            """,
            (data.full_name, data.email, password_hash),
        )
        user_row = cur.fetchone()

        user_data = {
            "id": user_row[0],
            "full_name": user_row[1],
            "email": user_row[2],
            "role": user_row[3],
            "role_id": user_row[4],
        }

        token = create_token(user_data)

        return {
            "success": True,
            "token": token,
            "user": user_data,
        }

    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al registrar usuario")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/login")
@rate_limit(requests=10, window=60)  # 10 requests per minute
async def login(request: Request, data: LoginRequest):
    """Authenticate user with email and password."""
    if not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Correo y contraseña son requeridos")

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, full_name, email, password_hash, role, role_id FROM users WHERE email = %s",
            (data.email,),
        )
        user_row = cur.fetchone()

        if not user_row:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

        # Verify password
        stored_hash = user_row[3]
        if not bcrypt.checkpw(data.password.encode("utf-8"), stored_hash.encode("utf-8")):
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

        user_data = {
            "id": user_row[0],
            "full_name": user_row[1],
            "email": user_row[2],
            "role": user_row[4],
            "role_id": user_row[5],
        }

        token = create_token(user_data)

        return {
            "success": True,
            "token": token,
            "user": user_data,
        }

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error al iniciar sesión")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return current authenticated user data with role and permissions."""
    from db import get_connection, release_connection

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT role_id FROM users WHERE id = %s", (current_user["id"],))
        row = cur.fetchone()
        role_id = row[0] if row else None

        permissions = {}
        if role_id:
            cur.execute("SELECT permissions FROM roles WHERE id = %s", (role_id,))
            perm_row = cur.fetchone()
            if perm_row and isinstance(perm_row[0], dict):
                permissions = perm_row[0]

        return {
            "success": True,
            "user": {
                **current_user,
                "role_id": role_id,
                "permissions": permissions,
            },
        }
    finally:
        cur.close()
        release_connection(conn)
