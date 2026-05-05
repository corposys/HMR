"""
Hotel structure routes: tree view, CRUD for modules/floors/rooms, and stats.
Provides the shared structure used by all HMR modules (maintenance, housekeeping, etc.).
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal

from db import get_connection, release_connection
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/structure", tags=["structure"])


# ── Pydantic Models ──────────────────────────────────────────────────────────

class ModuleCreate(BaseModel):
    property_id: int
    number: int
    name: Optional[str] = None
    category: Literal["hotel", "owner"] = "hotel"

class ModuleUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[Literal["hotel", "owner"]] = None
    is_active: Optional[bool] = None

class FloorCreate(BaseModel):
    module_id: int
    code: str
    name: Optional[str] = None

class FloorUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None

class RoomCreate(BaseModel):
    floor_id: int
    room_number: str
    category: Literal["hotel", "owner"] = "hotel"

class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    status: Optional[Literal["active", "inactive"]] = None
    category: Optional[Literal["hotel", "owner"]] = None
    room_type_id: Optional[int] = None


# ── Tree ─────────────────────────────────────────────────────────────────────

@router.get("/tree")
async def get_structure_tree(current_user: dict = Depends(get_current_user)):
    """
    Return the full hotel structure as a nested tree:
    property → modules → floors → rooms
    """
    conn = get_connection()
    try:
        cur = conn.cursor()

        # Get property
        cur.execute("SELECT id, name, address, timezone, is_active FROM properties LIMIT 1")
        prop_row = cur.fetchone()
        if not prop_row:
            return {"success": True, "property": None}

        property_data = {
            "id": prop_row[0], "name": prop_row[1], "address": prop_row[2],
            "timezone": prop_row[3], "is_active": prop_row[4], "modules": [],
        }

        # Get all modules
        cur.execute("""
            SELECT id, number, name, category, is_active, sort_order
            FROM modules WHERE property_id = %s ORDER BY sort_order
        """, (prop_row[0],))
        modules = cur.fetchall()

        for mod in modules:
            mod_data = {
                "id": mod[0], "number": mod[1], "name": mod[2],
                "category": mod[3], "is_active": mod[4], "sort_order": mod[5],
                "floors": [],
            }

            # Get floors for this module
            cur.execute("""
                SELECT id, code, name, is_active, sort_order
                FROM floors WHERE module_id = %s ORDER BY sort_order
            """, (mod[0],))
            floors = cur.fetchall()

            for fl in floors:
                fl_data = {
                    "id": fl[0], "code": fl[1], "name": fl[2],
                    "is_active": fl[3], "sort_order": fl[4], "rooms": [],
                }

                # Get rooms for this floor
                cur.execute("""
                    SELECT r.id, r.room_number, r.status, r.category, r.last_battery_change,
                           r.room_type_id, rt.name as room_type_name
                    FROM rooms r
                    LEFT JOIN room_types rt ON rt.id = r.room_type_id
                    WHERE r.floor_id = %s ORDER BY r.room_number
                """, (fl[0],))
                rooms = cur.fetchall()

                for rm in rooms:
                    fl_data["rooms"].append({
                        "id": rm[0], "room_number": rm[1], "status": rm[2],
                        "category": rm[3],
                        "last_battery_change": rm[4].isoformat() if rm[4] else None,
                        "room_type_id": rm[5],
                        "room_type_name": rm[6],
                    })

                mod_data["floors"].append(fl_data)

            property_data["modules"].append(mod_data)

        return {"success": True, "property": property_data}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener estructura")
    finally:
        cur.close()
        release_connection(conn)


# ── Stats ────────────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_structure_stats(current_user: dict = Depends(get_current_user)):
    """Summary counts for the hotel structure."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM modules WHERE is_active = TRUE")
        active_modules = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM modules")
        total_modules = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM floors WHERE is_active = TRUE")
        active_floors = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM rooms WHERE status = 'active'")
        active_rooms = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM rooms")
        total_rooms = cur.fetchone()[0]

        return {
            "success": True,
            "stats": {
                "active_modules": active_modules,
                "total_modules": total_modules,
                "active_floors": active_floors,
                "active_rooms": active_rooms,
                "total_rooms": total_rooms,
            },
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener estadísticas")
    finally:
        cur.close()
        release_connection(conn)


# ── Rooms filtered (internal API for other modules) ──────────────────────────

@router.get("/rooms")
async def list_rooms(
    module_id: Optional[int] = None,
    floor_id: Optional[int] = None,
    status: Optional[str] = None,
    room_type_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    """List rooms with optional filters. Used by maintenance, housekeeping, etc."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT r.id, r.room_number, r.status, r.category, r.last_battery_change,
                   r.room_type_id, rt.name AS room_type_name,
                   f.code AS floor_code, f.name AS floor_name,
                   m.number AS module_number, m.name AS module_name
            FROM rooms r
            JOIN floors f ON r.floor_id = f.id
            JOIN modules m ON f.module_id = m.id
            LEFT JOIN room_types rt ON rt.id = r.room_type_id
            WHERE m.is_active = TRUE AND f.is_active = TRUE
        """
        params = []

        if module_id:
            query += " AND m.id = %s"
            params.append(module_id)
        if floor_id:
            query += " AND f.id = %s"
            params.append(floor_id)
        if status:
            query += " AND r.status = %s"
            params.append(status)
        if room_type_id:
            query += " AND r.room_type_id = %s"
            params.append(room_type_id)

        query += " ORDER BY m.sort_order, f.sort_order, r.room_number"
        cur.execute(query, params)
        rows = cur.fetchall()

        rooms = [
            {
                "id": r[0], "room_number": r[1], "status": r[2], "category": r[3],
                "last_battery_change": r[4].isoformat() if r[4] else None,
                "room_type_id": r[5], "room_type_name": r[6],
                "floor_code": r[7], "floor_name": r[8],
                "module_number": r[9], "module_name": r[10],
            }
            for r in rows
        ]
        return {"success": True, "rooms": rooms}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener habitaciones")
    finally:
        cur.close()
        release_connection(conn)


# ── Modules CRUD ─────────────────────────────────────────────────────────────

@router.post("/modules")
async def create_module(data: ModuleCreate, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO modules (property_id, number, name, category, sort_order)
            VALUES (%s, %s, %s, %s, %s) RETURNING id
        """, (data.property_id, data.number, data.name or f"Módulo {data.number}", data.category, data.number))
        mod_id = cur.fetchone()[0]
        conn.commit()
        return {"success": True, "id": mod_id}
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear módulo")
    finally:
        cur.close()
        release_connection(conn)


@router.patch("/modules/{module_id}")
async def update_module(module_id: int, data: ModuleUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        updates, params = [], []
        if data.name is not None:
            updates.append("name = %s"); params.append(data.name)
        if data.category is not None:
            updates.append("category = %s"); params.append(data.category)
        if data.is_active is not None:
            updates.append("is_active = %s"); params.append(data.is_active)

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        params.append(module_id)
        cur.execute(f"UPDATE modules SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Módulo no encontrado")
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar módulo")
    finally:
        cur.close()
        release_connection(conn)


@router.delete("/modules/{module_id}")
async def delete_module(module_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM modules WHERE id = %s", (module_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Módulo no encontrado")

        # CASCADE will handle floors and rooms automatically
        cur.execute("DELETE FROM modules WHERE id = %s", (module_id,))
        conn.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al eliminar módulo")
    finally:
        cur.close()
        release_connection(conn)


# ── Floors CRUD ──────────────────────────────────────────────────────────────

@router.post("/floors")
async def create_floor(data: FloorCreate, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COALESCE(MAX(sort_order), -1) + 1 FROM floors WHERE module_id = %s", (data.module_id,))
        next_sort = cur.fetchone()[0]
        cur.execute("""
            INSERT INTO floors (module_id, code, name, sort_order)
            VALUES (%s, %s, %s, %s) RETURNING id
        """, (data.module_id, data.code, data.name or data.code, next_sort))
        fl_id = cur.fetchone()[0]
        conn.commit()
        return {"success": True, "id": fl_id}
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear piso")
    finally:
        cur.close()
        release_connection(conn)


@router.patch("/floors/{floor_id}")
async def update_floor(floor_id: int, data: FloorUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        updates, params = [], []
        if data.name is not None:
            updates.append("name = %s"); params.append(data.name)
        if data.is_active is not None:
            updates.append("is_active = %s"); params.append(data.is_active)

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        params.append(floor_id)
        cur.execute(f"UPDATE floors SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Piso no encontrado")
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar piso")
    finally:
        cur.close()
        release_connection(conn)


@router.delete("/floors/{floor_id}")
async def delete_floor(floor_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM floors WHERE id = %s", (floor_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Piso no encontrado")

        # CASCADE will handle rooms automatically
        cur.execute("DELETE FROM floors WHERE id = %s", (floor_id,))
        conn.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al eliminar piso")
    finally:
        cur.close()
        release_connection(conn)


# ── Rooms CRUD ───────────────────────────────────────────────────────────────

@router.get("/rooms/{room_id}")
async def get_room(room_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT r.id, r.room_number, r.status, r.category, r.room_type_id, rt.name as room_type_name,
                   f.code AS floor_code, f.name AS floor_name,
                   m.number AS module_number, m.name AS module_name
            FROM rooms r
            JOIN floors f ON r.floor_id = f.id
            JOIN modules m ON f.module_id = m.id
            LEFT JOIN room_types rt ON rt.id = r.room_type_id
            WHERE r.id = %s
        """, (room_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Habitación no encontrada")
        return {
            "success": True,
            "room": {
                "id": row[0], "room_number": row[1], "status": row[2], "category": row[3],
                "room_type_id": row[4], "room_type_name": row[5],
                "floor_code": row[6], "floor_name": row[7],
                "module_number": row[8], "module_name": row[9],
            },
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener habitación")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/rooms")
async def create_room(data: RoomCreate, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO rooms (floor_id, room_number, category)
            VALUES (%s, %s, %s) RETURNING id
        """, (data.floor_id, data.room_number, data.category))
        room_id = cur.fetchone()[0]
        conn.commit()
        return {"success": True, "id": room_id}
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear habitación")
    finally:
        cur.close()
        release_connection(conn)


@router.patch("/rooms/{room_id}")
async def update_room(room_id: int, data: RoomUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        updates, params = [], []
        if data.room_number is not None:
            updates.append("room_number = %s"); params.append(data.room_number)
        if data.status is not None:
            updates.append("status = %s"); params.append(data.status)
        if data.category is not None:
            updates.append("category = %s"); params.append(data.category)
        if data.room_type_id is not None:
            updates.append("room_type_id = %s"); params.append(data.room_type_id)

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        params.append(room_id)
        cur.execute(f"UPDATE rooms SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Habitación no encontrada")
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar habitación")
    finally:
        cur.close()
        release_connection(conn)


@router.delete("/rooms/{room_id}")
async def delete_room(room_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM rooms WHERE id = %s", (room_id,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Habitación no encontrada")
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al eliminar habitación")
    finally:
        cur.close()
        release_connection(conn)
