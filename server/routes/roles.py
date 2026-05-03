"""
Roles routes: list roles, update role permissions.
Admin-only access for write operations.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict

from db import get_connection, release_connection
from middleware.auth import get_current_user, require_permission

router = APIRouter(prefix="/api/roles", tags=["roles"])


class RoleUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[Dict] = None


@router.get("")
async def list_roles(current_user: dict = Depends(get_current_user)):
    """List all roles with their permissions."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, name, display_name, description, permissions, is_system, created_at "
            "FROM roles ORDER BY id"
        )
        rows = cur.fetchall()
        roles = [
            {
                "id": r[0],
                "name": r[1],
                "display_name": r[2],
                "description": r[3],
                "permissions": r[4] if isinstance(r[4], dict) else {},
                "is_system": r[5],
                "created_at": r[6].isoformat() if r[6] else None,
            }
            for r in rows
        ]
        return {"success": True, "roles": roles}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener roles")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/{role_id}")
async def get_role(role_id: int, current_user: dict = Depends(get_current_user)):
    """Get a single role by ID."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, name, display_name, description, permissions, is_system "
            "FROM roles WHERE id = %s",
            (role_id,),
        )
        r = cur.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Rol no encontrado")
        return {
            "success": True,
            "role": {
                "id": r[0],
                "name": r[1],
                "display_name": r[2],
                "description": r[3],
                "permissions": r[4] if isinstance(r[4], dict) else {},
                "is_system": r[5],
            },
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener rol")
    finally:
        cur.close()
        release_connection(conn)


@router.put("/{role_id}")
async def update_role(
    role_id: int,
    data: RoleUpdate,
    current_user: dict = Depends(require_permission("users", "write")),
):
    """Update role display name, description, or permissions. System roles cannot be renamed."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT is_system FROM roles WHERE id = %s", (role_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Rol no encontrado")

        updates, params = [], []
        if data.display_name is not None:
            updates.append("display_name = %s")
            params.append(data.display_name)
        if data.description is not None:
            updates.append("description = %s")
            params.append(data.description)
        if data.permissions is not None:
            import json
            updates.append("permissions = %s::jsonb")
            params.append(json.dumps(data.permissions))

        if not updates:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")

        params.append(role_id)
        cur.execute(
            f"UPDATE roles SET {', '.join(updates)} WHERE id = %s", params
        )
        conn.commit()

        cur.execute(
            "SELECT id, name, display_name, description, permissions FROM roles WHERE id = %s",
            (role_id,),
        )
        r = cur.fetchone()
        return {
            "success": True,
            "role": {
                "id": r[0],
                "name": r[1],
                "display_name": r[2],
                "description": r[3],
                "permissions": r[4] if isinstance(r[4], dict) else {},
            },
        }
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar rol")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/{role_id}/users")
async def get_role_users(
    role_id: int,
    current_user: dict = Depends(require_permission("users", "read")),
):
    """List users assigned to a specific role."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, full_name, email, role, role_id, created_at "
            "FROM users WHERE role_id = %s ORDER BY full_name",
            (role_id,),
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
        raise HTTPException(status_code=500, detail="Error al obtener usuarios del rol")
    finally:
        cur.close()
        release_connection(conn)