"""
Users routes: list, create, update, delete users.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import bcrypt

from db import get_connection, release_connection
from middleware.auth import get_current_user, require_permission

router = APIRouter(prefix="/api/users", tags=["users"])


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role_id: int


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None


@router.get("")
async def list_users(current_user: dict = Depends(get_current_user)):
    """List all users."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, full_name, email, role, role_id, created_at FROM users ORDER BY full_name"
        )
        rows = cur.fetchall()
        users = [
            {
                "id": r[0],
                "full_name": r[1],
                "email": r[2],
                "role": r[3],
                "role_id": r[4],
                "created_at": r[5].isoformat() if r[5] else None,
            }
            for r in rows
        ]
        return {"success": True, "users": users}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener usuarios")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/{user_id}")
async def get_user(user_id: int, current_user: dict = Depends(get_current_user)):
    """Get a single user."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, full_name, email, role, role_id, created_at FROM users WHERE id = %s",
            (user_id,),
        )
        r = cur.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return {
            "success": True,
            "user": {
                "id": r[0],
                "full_name": r[1],
                "email": r[2],
                "role": r[3],
                "role_id": r[4],
                "created_at": r[5].isoformat() if r[5] else None,
            },
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener usuario")
    finally:
        cur.close()
        release_connection(conn)


@router.post("")
async def create_user(data: UserCreate, current_user: dict = Depends(require_permission("users", "write"))):
    """Create a new user."""
    if not data.full_name or not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Todos los campos son requeridos")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")

    password_hash = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s", (data.email,))
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Este correo ya está registrado")

        cur.execute(
            "INSERT INTO users (full_name, email, password_hash, role, role_id) "
            "VALUES (%s, %s, %s, 'user', %s) RETURNING id, full_name, email, role, role_id, created_at",
            (data.full_name, data.email, password_hash, data.role_id),
        )
        r = cur.fetchone()
        conn.commit()
        return {
            "success": True,
            "user": {
                "id": r[0],
                "full_name": r[1],
                "email": r[2],
                "role": r[3],
                "role_id": r[4],
                "created_at": r[5].isoformat() if r[5] else None,
            },
        }
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear usuario")
    finally:
        cur.close()
        release_connection(conn)


@router.put("/{user_id}")
async def update_user(user_id: int, data: UserUpdate, current_user: dict = Depends(require_permission("users", "write"))):
    """Update a user."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        updates, params = [], []
        if data.full_name is not None:
            updates.append("full_name = %s"); params.append(data.full_name)
        if data.email is not None:
            updates.append("email = %s"); params.append(data.email)
        if data.role_id is not None:
            updates.append("role_id = %s"); params.append(data.role_id)
        if data.is_active is not None:
            updates.append("is_active = %s"); params.append(data.is_active)

        if not updates:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")

        params.append(user_id)
        cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()

        cur.execute(
            "SELECT id, full_name, email, role, role_id, created_at FROM users WHERE id = %s",
            (user_id,),
        )
        r = cur.fetchone()
        return {
            "success": True,
            "user": {
                "id": r[0],
                "full_name": r[1],
                "email": r[2],
                "role": r[3],
                "role_id": r[4],
                "created_at": r[5].isoformat() if r[5] else None,
            },
        }
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar usuario")
    finally:
        cur.close()
        release_connection(conn)


@router.delete("/{user_id}")
async def delete_user(user_id: int, current_user: dict = Depends(require_permission("users", "write"))):
    """Deactivate a user."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        cur.execute("UPDATE users SET is_active = FALSE WHERE id = %s", (user_id,))
        conn.commit()
        return {"success": True, "message": "Usuario desactivado"}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al desactivar usuario")
    finally:
        cur.close()
        release_connection(conn)