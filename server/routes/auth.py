"""
Authentication routes: register, login, and session verification.
"""
import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from db import get_connection, release_connection
from middleware.auth import create_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


# --- Pydantic Models ---

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


# --- Routes ---

@router.post("/register")
async def register(data: RegisterRequest):
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
            INSERT INTO users (full_name, email, password_hash, role)
            VALUES (%s, %s, %s, 'user')
            RETURNING id, full_name, email, role, created_at
            """,
            (data.full_name, data.email, password_hash),
        )
        user_row = cur.fetchone()
        conn.commit()

        user_data = {
            "id": user_row[0],
            "full_name": user_row[1],
            "email": user_row[2],
            "role": user_row[3],
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
async def login(data: LoginRequest):
    """Authenticate user with email and password."""
    if not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Correo y contraseña son requeridos")

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, full_name, email, password_hash, role FROM users WHERE email = %s",
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
    """Return current authenticated user data from the JWT."""
    return {
        "success": True,
        "user": current_user,
    }
