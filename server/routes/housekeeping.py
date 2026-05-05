"""
Housekeeping routes: staff management, room assignments, cleaning workflow.
"""
from datetime import date, datetime
from typing import Optional, List, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from db import get_connection, release_connection
from middleware.auth import get_current_user, require_permission
from routes.rack import broadcast_room_update

router = APIRouter(prefix="/api/housekeeping", tags=["housekeeping"])


async def _notify_room_status(room_id: int, housekeeping_status: str):
    """Broadcast room housekeeping status change to Rack Operativo."""
    await broadcast_room_update(room_id, {"housekeeping_status": housekeeping_status})


# ── Pydantic Models ────────────────────────────────────────────────────────────

class StaffCreate(BaseModel):
    full_name: str
    role: Literal["maid", "supervisor"] = "maid"
    color: Optional[str] = "#009098"


class StaffUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[Literal["maid", "supervisor"]] = None
    is_active: Optional[bool] = None
    color: Optional[str] = None


class AssignmentCreate(BaseModel):
    staff_id: int
    room_ids: List[int]


class AssignmentUpdate(BaseModel):
    status: Literal["assigned", "in_progress", "completed", "inspection"]
    notes: Optional[str] = None


class InspectionRequest(BaseModel):
    approved: bool
    notes: Optional[str] = None


# ── Staff ──────────────────────────────────────────────────────────────────────

@router.get("/staff")
async def list_staff(current_user: dict = Depends(get_current_user)):
    """List all housekeeping staff members."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, full_name, role, is_active, color, created_at
            FROM housekeeping_staff ORDER BY role, full_name
        """)
        rows = cur.fetchall()
        staff = [
            {
                "id": r[0], "full_name": r[1], "role": r[2],
                "is_active": r[3], "color": r[4],
                "created_at": r[5].isoformat() if r[5] else None,
            }
            for r in rows
        ]
        return {"success": True, "staff": staff}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener personal")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/staff")
async def create_staff(
    data: StaffCreate,
    current_user: dict = Depends(require_permission("housekeeping", "update_status")),
):
    """Create a new housekeeping staff member."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO housekeeping_staff (full_name, role, color) VALUES (%s, %s, %s) RETURNING id",
            (data.full_name, data.role, data.color),
        )
        staff_id = cur.fetchone()[0]
        conn.commit()
        return {"success": True, "staff": {"id": staff_id, "full_name": data.full_name, "role": data.role, "color": data.color}}
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear personal")
    finally:
        cur.close()
        release_connection(conn)


@router.patch("/staff/{staff_id}")
async def update_staff(
    staff_id: int,
    data: StaffUpdate,
    current_user: dict = Depends(require_permission("housekeeping", "update_status")),
):
    """Update housekeeping staff member."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        updates, params = [], []
        if data.full_name is not None:
            updates.append("full_name = %s"); params.append(data.full_name)
        if data.role is not None:
            updates.append("role = %s"); params.append(data.role)
        if data.is_active is not None:
            updates.append("is_active = %s"); params.append(data.is_active)
        if data.color is not None:
            updates.append("color = %s"); params.append(data.color)
        if not updates:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")
        params.append(staff_id)
        cur.execute(f"UPDATE housekeeping_staff SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar personal")
    finally:
        cur.close()
        release_connection(conn)


# ── Rooms (Housekeeping View) ──────────────────────────────────────────────────

@router.get("/rooms")
async def list_rooms_housekeeping(
    status: Optional[str] = Query(default=None),
    floor_id: Optional[int] = Query(default=None),
    staff_id: Optional[int] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    """List rooms with cleaning status, guest info, and staff assignment."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT r.id, r.room_number, r.housekeeping_status, r.nightly_rate_usd,
                   rt.name AS room_type_name, rt.max_occupancy,
                   f.id AS floor_id, f.code AS floor_code, f.name AS floor_name,
                   m.id AS module_id, m.number AS module_number, m.name AS module_name,
                   res.status AS reservation_status,
                   res.check_in_date, res.check_out_date,
                   g.full_name AS guest_name,
                   ha.id AS assignment_id, ha.status AS assignment_status,
                   ha.notes AS assignment_notes, ha.started_at,
                   hs.id AS staff_id, hs.full_name AS staff_name, hs.color AS staff_color
            FROM rooms r
            JOIN floors f ON r.floor_id = f.id
            JOIN modules m ON f.module_id = m.id
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            LEFT JOIN reservations res ON res.room_id = r.id
                AND res.status IN ('reserved', 'checked_in')
            LEFT JOIN guests g ON res.guest_id = g.id
            LEFT JOIN housekeeping_assignments ha ON ha.room_id = r.id
                AND ha.assignment_date = CURRENT_DATE
            LEFT JOIN housekeeping_staff hs ON ha.staff_id = hs.id
            WHERE m.is_active = TRUE AND f.is_active = TRUE AND r.status = 'active'
        """
        params = []
        if status:
            query += " AND r.housekeeping_status = %s"; params.append(status)
        if floor_id:
            query += " AND f.id = %s"; params.append(floor_id)
        if staff_id:
            query += " AND hs.id = %s"; params.append(staff_id)
        query += " ORDER BY m.sort_order, f.sort_order, r.room_number"

        cur.execute(query, params)
        rows = cur.fetchall()
        rooms = [
            {
                "id": r[0], "room_number": r[1], "housekeeping_status": r[2],
                "nightly_rate_usd": float(r[3]) if r[3] else 0,
                "room_type_name": r[4], "max_occupancy": r[5],
                "floor_id": r[6], "floor_code": r[7], "floor_name": r[8],
                "module_id": r[9], "module_number": r[10], "module_name": r[11],
                "reservation_status": r[12],
                "check_in_date": r[13].isoformat() if r[13] else None,
                "check_out_date": r[14].isoformat() if r[14] else None,
                "guest_name": r[15],
                "assignment_id": r[16], "assignment_status": r[17],
                "assignment_notes": r[18], "started_at": r[19].isoformat() if r[19] else None,
                "staff_id": r[20], "staff_name": r[21], "staff_color": r[22],
            }
            for r in rows
        ]
        return {"success": True, "rooms": rooms}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener habitaciones")
    finally:
        cur.close()
        release_connection(conn)


# ── Assignments ────────────────────────────────────────────────────────────────

@router.get("/assignments")
async def list_assignments(
    date_param: Optional[str] = Query(default=None, alias="date"),
    staff_id: Optional[int] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    """List assignments for a given date (defaults to today)."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        assign_date = date_param or date.today().isoformat()
        query = """
            SELECT ha.id, ha.staff_id, ha.room_id, ha.assignment_date, ha.status,
                   ha.notes, ha.started_at, ha.completed_at, ha.created_at,
                   hs.full_name AS staff_name, hs.color AS staff_color,
                   r.room_number, r.housekeeping_status
            FROM housekeeping_assignments ha
            JOIN housekeeping_staff hs ON ha.staff_id = hs.id
            JOIN rooms r ON ha.room_id = r.id
            WHERE ha.assignment_date = %s
        """
        params = [assign_date]
        if staff_id:
            query += " AND ha.staff_id = %s"; params.append(staff_id)
        query += " ORDER BY hs.full_name, r.room_number"

        cur.execute(query, params)
        rows = cur.fetchall()
        assignments = [
            {
                "id": r[0], "staff_id": r[1], "room_id": r[2],
                "assignment_date": r[3].isoformat() if r[3] else None,
                "status": r[4], "notes": r[5],
                "started_at": r[6].isoformat() if r[6] else None,
                "completed_at": r[7].isoformat() if r[7] else None,
                "created_at": r[8].isoformat() if r[8] else None,
                "staff_name": r[9], "staff_color": r[10],
                "room_number": r[11], "housekeeping_status": r[12],
            }
            for r in rows
        ]
        return {"success": True, "assignments": assignments}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener asignaciones")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/assignments/pending-inspection")
async def list_pending_inspection(
    current_user: dict = Depends(get_current_user),
):
    """List assignments pending inspection (completed status, not yet inspected)."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT ha.id, ha.staff_id, ha.room_id, ha.assignment_date, ha.status,
                   ha.notes, ha.started_at, ha.completed_at, ha.created_at,
                   hs.full_name AS staff_name, hs.color AS staff_color,
                   r.room_number, r.housekeeping_status, rt.name AS room_type_name
            FROM housekeeping_assignments ha
            JOIN housekeeping_staff hs ON ha.staff_id = hs.id
            JOIN rooms r ON ha.room_id = r.id
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE ha.status = 'completed'
              AND ha.inspected_by IS NULL
              AND ha.assignment_date = CURRENT_DATE
            ORDER BY ha.completed_at ASC
        """
        cur.execute(query)
        rows = cur.fetchall()
        assignments = [
            {
                "id": r[0], "staff_id": r[1], "room_id": r[2],
                "assignment_date": r[3].isoformat() if r[3] else None,
                "status": r[4], "notes": r[5],
                "started_at": r[6].isoformat() if r[6] else None,
                "completed_at": r[7].isoformat() if r[7] else None,
                "created_at": r[8].isoformat() if r[8] else None,
                "staff_name": r[9], "staff_color": r[10],
                "room_number": r[11], "housekeeping_status": r[12],
                "room_type_name": r[13],
            }
            for r in rows
        ]
        return {"success": True, "assignments": assignments}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener inspecciones pendientes")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/assignments")
async def create_assignments(
    data: AssignmentCreate,
    current_user: dict = Depends(require_permission("housekeeping", "update_status")),
):
    """Assign staff to one or more rooms."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        today = date.today()

        cur.execute("SELECT id FROM housekeeping_staff WHERE id = %s AND is_active = TRUE", (data.staff_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Personal no encontrado o inactivo")

        created = []
        for room_id in data.room_ids:
            cur.execute(
                "SELECT id, housekeeping_status FROM rooms WHERE id = %s AND status = 'active'",
                (room_id,),
            )
            room = cur.fetchone()
            if not room:
                continue

            cur.execute(
                "SELECT id FROM housekeeping_assignments WHERE staff_id = %s AND room_id = %s AND assignment_date = %s",
                (data.staff_id, room_id, today),
            )
            if cur.fetchone():
                continue

            cur.execute(
                "INSERT INTO housekeeping_assignments (staff_id, room_id, assignment_date, status) "
                "VALUES (%s, %s, %s, 'assigned') RETURNING id",
                (data.staff_id, room_id, today),
            )
            created.append(cur.fetchone()[0])

            cur.execute("UPDATE rooms SET housekeeping_status = 'dirty' WHERE id = %s AND housekeeping_status = 'clean'", (room_id,))
            await _notify_room_status(room_id, "dirty")

        conn.commit()
        return {"success": True, "assignment_ids": created, "count": len(created)}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear asignaciones")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/assignments/auto-assign")
async def auto_assign_rooms(
    current_user: dict = Depends(require_permission("housekeeping", "update_status")),
):
    """Auto-assign dirty rooms evenly among active staff."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        today = date.today()

        cur.execute("""
            SELECT r.id, r.room_number, f.sort_order AS floor_sort, r.room_number
            FROM rooms r
            JOIN floors f ON r.floor_id = f.id
            JOIN modules m ON f.module_id = m.id
            WHERE r.housekeeping_status = 'dirty'
              AND m.is_active = TRUE AND f.is_active = TRUE AND r.status = 'active'
              AND NOT EXISTS (
                  SELECT 1 FROM housekeeping_assignments ha
                  WHERE ha.room_id = r.id AND ha.assignment_date = %s
              )
            ORDER BY f.sort_order, r.room_number
        """, (today,))
        dirty_rooms = cur.fetchall()

        if not dirty_rooms:
            return {"success": True, "message": "No hay habitaciones sucias sin asignar", "assignments": []}

        cur.execute("""
            SELECT hs.id, hs.full_name, hs.color,
                   COUNT(ha.id) AS current_load
            FROM housekeeping_staff hs
            LEFT JOIN housekeeping_assignments ha ON ha.staff_id = hs.id AND ha.assignment_date = %s
            WHERE hs.is_active = TRUE
            GROUP BY hs.id, hs.full_name, hs.color
            ORDER BY current_load ASC, hs.full_name
        """, (today,))
        active_staff = cur.fetchall()

        if not active_staff:
            raise HTTPException(status_code=400, detail="No hay personal activo disponible")

        assignments = []
        room_idx = 0
        while room_idx < len(dirty_rooms):
            for staff in active_staff:
                if room_idx >= len(dirty_rooms):
                    break
                room = dirty_rooms[room_idx]
                staff_id = staff[0]

                cur.execute(
                    "INSERT INTO housekeeping_assignments (staff_id, room_id, assignment_date, status) "
                    "VALUES (%s, %s, %s, 'assigned') RETURNING id",
                    (staff_id, room[0], today),
                )
                assignment_id = cur.fetchone()[0]
                assignments.append({
                    "assignment_id": assignment_id,
                    "staff_id": staff_id,
                    "staff_name": staff[1],
                    "room_id": room[0],
                    "room_number": room[1],
                })
                room_idx += 1

        conn.commit()
        return {"success": True, "message": f"{len(assignments)} habitaciones asignadas", "assignments": assignments}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error en auto-asignación")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/dashboard")
async def get_housekeeping_dashboard(
    current_user: dict = Depends(get_current_user),
):
    """Get consolidated housekeeping dashboard metrics."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        today = date.today()

        cur.execute("""
            SELECT housekeeping_status, COUNT(*)
            FROM rooms r
            JOIN floors f ON r.floor_id = f.id
            JOIN modules m ON f.module_id = m.id
            WHERE m.is_active = TRUE AND f.is_active = TRUE AND r.status = 'active'
            GROUP BY housekeeping_status
        """)
        status_counts = {row[0]: row[1] for row in cur.fetchall()}

        total_rooms = sum(status_counts.values())
        clean_pct = round(status_counts.get("clean", 0) / total_rooms * 100, 1) if total_rooms > 0 else 0

        cur.execute("""
            SELECT status, COUNT(*) FROM housekeeping_assignments
            WHERE assignment_date = %s GROUP BY status
        """, (today,))
        assignment_counts = {row[0]: row[1] for row in cur.fetchall()}

        cur.execute("""
            SELECT hs.id, hs.full_name, hs.color, hs.role,
                   COUNT(ha.id) AS total_assigned,
                   COUNT(CASE WHEN ha.status = 'completed' THEN 1 END) AS completed,
                   COUNT(CASE WHEN ha.status = 'in_progress' THEN 1 END) AS in_progress,
                   AVG(CASE WHEN ha.status = 'completed' AND ha.completed_at IS NOT NULL AND ha.started_at IS NOT NULL
                       THEN EXTRACT(EPOCH FROM (ha.completed_at - ha.started_at)) / 60 END) AS avg_minutes
            FROM housekeeping_staff hs
            LEFT JOIN housekeeping_assignments ha ON ha.staff_id = hs.id AND ha.assignment_date = %s
            WHERE hs.is_active = TRUE
            GROUP BY hs.id, hs.full_name, hs.color, hs.role
            ORDER BY completed DESC
        """, (today,))
        staff_performance = [
            {
                "id": r[0], "full_name": r[1], "color": r[2], "role": r[3],
                "total_assigned": r[4], "completed": r[5], "in_progress": r[6],
                "avg_minutes": round(r[7], 1) if r[7] else None,
            }
            for r in cur.fetchall()
        ]

        cur.execute("""
            SELECT severity, COUNT(*) FROM housekeeping_incidents
            WHERE DATE(created_at) = CURRENT_DATE AND resolved = FALSE
            GROUP BY severity
        """)
        open_incidents = {row[0]: row[1] for row in cur.fetchall()}

        cur.execute("""
            SELECT COUNT(*) FROM housekeeping_assignments
            WHERE assignment_date = %s AND status = 'completed' AND inspected_by IS NULL
        """, (today,))
        pending_inspection = cur.fetchone()[0]

        return {
            "success": True,
            "dashboard": {
                "rooms": {
                    "total": total_rooms,
                    "clean": status_counts.get("clean", 0),
                    "dirty": status_counts.get("dirty", 0),
                    "maintenance": status_counts.get("maintenance", 0),
                    "inspection": status_counts.get("inspection", 0),
                    "clean_percentage": clean_pct,
                },
                "assignments": {
                    "total": sum(assignment_counts.values()),
                    "assigned": assignment_counts.get("assigned", 0),
                    "in_progress": assignment_counts.get("in_progress", 0),
                    "completed": assignment_counts.get("completed", 0),
                    "pending_inspection": pending_inspection,
                },
                "incidents": {
                    "open": sum(open_incidents.values()),
                    "critical": open_incidents.get("critical", 0),
                    "high": open_incidents.get("high", 0),
                    "medium": open_incidents.get("medium", 0),
                    "low": open_incidents.get("low", 0),
                },
                "staff_performance": staff_performance,
            },
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener dashboard")
    finally:
        cur.close()
        release_connection(conn)


@router.patch("/assignments/{assignment_id}")
async def update_assignment(
    assignment_id: int,
    data: AssignmentUpdate,
    current_user: dict = Depends(require_permission("housekeeping", "update_status")),
):
    """Update assignment status (start or complete cleaning)."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT ha.id, ha.room_id, ha.status, r.housekeeping_status FROM housekeeping_assignments ha "
            "JOIN rooms r ON ha.room_id = r.id WHERE ha.id = %s",
            (assignment_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Asignación no encontrada")

        room_id = row[1]
        new_status = data.status
        notes = data.notes

        if new_status == "in_progress":
            cur.execute(
                "UPDATE housekeeping_assignments SET status = %s, started_at = CURRENT_TIMESTAMP, notes = COALESCE(%s, notes) WHERE id = %s",
                (new_status, notes, assignment_id),
            )
            room_status = "dirty"
        elif new_status == "completed":
            cur.execute(
                "UPDATE housekeeping_assignments SET status = %s, completed_at = CURRENT_TIMESTAMP, notes = COALESCE(%s, notes) WHERE id = %s",
                (new_status, notes, assignment_id),
            )
            room_status = "inspection"
            cur.execute("UPDATE rooms SET housekeeping_status = 'inspection' WHERE id = %s", (room_id,))
        elif new_status == "inspection":
            cur.execute(
                "UPDATE housekeeping_assignments SET status = %s WHERE id = %s",
                (new_status, assignment_id),
            )
            room_status = "inspection"
        else:
            cur.execute(
                "UPDATE housekeeping_assignments SET status = %s, notes = COALESCE(%s, notes) WHERE id = %s",
                (new_status, notes, assignment_id),
            )
            room_status = row[3]

        conn.commit()
        await _notify_room_status(room_id, room_status)
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar asignación")
    finally:
        cur.close()
        release_connection(conn)


@router.patch("/assignments/{assignment_id}/inspect")
async def inspect_assignment(
    assignment_id: int,
    data: InspectionRequest,
    current_user: dict = Depends(require_permission("housekeeping", "update_status")),
):
    """Approve or reject a completed cleaning assignment."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT ha.id, ha.room_id, ha.status, ha.staff_id, r.housekeeping_status FROM housekeeping_assignments ha "
            "JOIN rooms r ON ha.room_id = r.id WHERE ha.id = %s",
            (assignment_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Asignación no encontrada")

        if row[2] != "completed":
            raise HTTPException(status_code=400, detail="Solo se pueden inspeccionar asignaciones completadas")

        room_id = row[1]
        staff_id = row[3]
        user_id = current_user.get("id")

        cur.execute(
            "UPDATE housekeeping_assignments SET inspected_by = %s, inspected_at = CURRENT_TIMESTAMP, inspection_notes = %s WHERE id = %s",
            (user_id, data.notes, assignment_id),
        )

        if data.approved:
            cur.execute("UPDATE rooms SET housekeeping_status = 'clean' WHERE id = %s", (room_id,))
            room_status = "clean"
        else:
            cur.execute("UPDATE housekeeping_assignments SET status = 'in_progress' WHERE id = %s", (assignment_id,))
            cur.execute("UPDATE rooms SET housekeeping_status = 'dirty' WHERE id = %s", (room_id,))
            room_status = "dirty"

        conn.commit()
        await _notify_room_status(room_id, room_status)
        return {"success": True, "approved": data.approved}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al inspeccionar asignación")
    finally:
        cur.close()
        release_connection(conn)


@router.delete("/assignments/{assignment_id}")
async def delete_assignment(
    assignment_id: int,
    current_user: dict = Depends(require_permission("housekeeping", "update_status")),
):
    """Remove an assignment (unassign staff from room)."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT room_id FROM housekeeping_assignments WHERE id = %s", (assignment_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Asignación no encontrada")

        cur.execute("DELETE FROM housekeeping_assignments WHERE id = %s", (assignment_id,))
        conn.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al eliminar asignación")
    finally:
        cur.close()
        release_connection(conn)


# ── Stats ──────────────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_housekeeping_stats(current_user: dict = Depends(get_current_user)):
    """Get daily housekeeping statistics."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        today = date.today()

        cur.execute("""
            SELECT housekeeping_status, COUNT(*)
            FROM rooms r
            JOIN floors f ON r.floor_id = f.id
            JOIN modules m ON f.module_id = m.id
            WHERE m.is_active = TRUE AND f.is_active = TRUE AND r.status = 'active'
            GROUP BY housekeeping_status
        """)
        status_counts = {row[0]: row[1] for row in cur.fetchall()}

        cur.execute("""
            SELECT status, COUNT(*)
            FROM housekeeping_assignments
            WHERE assignment_date = %s
            GROUP BY status
        """, (today,))
        assignment_counts = {row[0]: row[1] for row in cur.fetchall()}

        cur.execute("""
            SELECT hs.id, hs.full_name, hs.color, COUNT(ha.id) AS assigned_count
            FROM housekeeping_staff hs
            LEFT JOIN housekeeping_assignments ha ON ha.staff_id = hs.id AND ha.assignment_date = %s
            WHERE hs.is_active = TRUE
            GROUP BY hs.id, hs.full_name, hs.color
            ORDER BY hs.full_name
        """, (today,))
        staff_load = [
            {"id": r[0], "full_name": r[1], "color": r[2], "assigned_count": r[3]}
            for r in cur.fetchall()
        ]

        cur.execute("""
            SELECT COUNT(*) FROM housekeeping_assignments
            WHERE assignment_date = %s AND status = 'completed' AND inspected_by IS NULL
        """, (today,))
        pending_inspection = cur.fetchone()[0]

        cur.execute("""
            SELECT COUNT(*) FROM housekeeping_assignments
            WHERE assignment_date = %s AND inspected_by IS NOT NULL AND inspection_notes IS NOT NULL
        """, (today,))
        rejected_count = cur.fetchone()[0]

        cur.execute("""
            SELECT COUNT(*) FROM housekeeping_assignments
            WHERE assignment_date = %s AND inspected_by IS NOT NULL
        """, (today,))
        approved_count = cur.fetchone()[0] - rejected_count

        return {
            "success": True,
            "stats": {
                "room_statuses": {
                    "clean": status_counts.get("clean", 0),
                    "dirty": status_counts.get("dirty", 0),
                    "maintenance": status_counts.get("maintenance", 0),
                    "inspection": status_counts.get("inspection", 0),
                },
                "assignments": {
                    "assigned": assignment_counts.get("assigned", 0),
                    "in_progress": assignment_counts.get("in_progress", 0),
                    "completed": assignment_counts.get("completed", 0),
                    "inspection": assignment_counts.get("inspection", 0),
                },
                "inspection": {
                    "pending": pending_inspection,
                    "approved": approved_count,
                    "rejected": rejected_count,
                },
                "staff_load": staff_load,
            },
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener estadísticas")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/staff/{staff_id}/performance")
async def get_staff_performance(
    staff_id: int,
    date_param: Optional[str] = Query(default=None, alias="date"),
    current_user: dict = Depends(get_current_user),
):
    """Get performance metrics for a specific staff member."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, full_name, role, is_active, color FROM housekeeping_staff WHERE id = %s", (staff_id,))
        staff_row = cur.fetchone()
        if not staff_row:
            raise HTTPException(status_code=404, detail="Personal no encontrado")

        staff = {"id": staff_row[0], "full_name": staff_row[1], "role": staff_row[2], "is_active": staff_row[3], "color": staff_row[4]}

        days = 7
        if date_param:
            days = 1

        cur.execute("""
            SELECT COUNT(*) FROM housekeeping_assignments ha
            WHERE ha.staff_id = %s AND ha.status = 'completed'
              AND ha.assignment_date >= CURRENT_DATE - INTERVAL '%s days'
        """, (staff_id, days))
        completed = cur.fetchone()[0]

        cur.execute("""
            SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)))
            FROM housekeeping_assignments
            WHERE staff_id = %s AND status = 'completed' AND completed_at IS NOT NULL AND started_at IS NOT NULL
              AND assignment_date >= CURRENT_DATE - INTERVAL '%s days'
        """, (staff_id, days))
        avg_seconds = cur.fetchone()[0]
        avg_minutes = round(avg_seconds / 60, 1) if avg_seconds else None

        cur.execute("""
            SELECT COUNT(*) FROM housekeeping_assignments ha
            JOIN housekeeping_incidents hi ON ha.id = hi.assignment_id
            WHERE ha.staff_id = %s AND ha.assignment_date >= CURRENT_DATE - INTERVAL '%s days'
        """, (staff_id, days))
        incidents = cur.fetchone()[0]

        cur.execute("""
            SELECT COUNT(*) FROM housekeeping_assignments
            WHERE staff_id = %s AND inspected_by IS NOT NULL AND inspection_notes IS NOT NULL
              AND assignment_date >= CURRENT_DATE - INTERVAL '%s days'
        """, (staff_id, days))
        rejected = cur.fetchone()[0]

        approval_rate = round(((completed - rejected) / completed * 100), 1) if completed > 0 else None

        return {
            "success": True,
            "staff": staff,
            "performance": {
                "period_days": days,
                "completed": completed,
                "avg_minutes": avg_minutes,
                "incidents": incidents,
                "rejected": rejected,
                "approval_rate": approval_rate,
            },
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener rendimiento")
    finally:
        cur.close()
        release_connection(conn)


# ── Incidents ──────────────────────────────────────────────────────────────────

class IncidentCreate(BaseModel):
    room_id: int
    assignment_id: Optional[int] = None
    staff_id: Optional[int] = None
    incident_type: Literal["broken_item", "missing_inventory", "maintenance_needed", "guest_belongings", "damage", "other"]
    description: Optional[str] = None
    severity: Literal["low", "medium", "high", "critical"] = "low"


class IncidentUpdate(BaseModel):
    resolved: Optional[bool] = None
    description: Optional[str] = None


@router.get("/incidents")
async def list_incidents(
    date_param: Optional[str] = Query(default=None, alias="date"),
    type_filter: Optional[str] = Query(default=None),
    severity_filter: Optional[str] = Query(default=None),
    resolved_filter: Optional[bool] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    """List housekeeping incidents with filters."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT hi.id, hi.assignment_id, hi.room_id, hi.staff_id, hi.incident_type,
                   hi.description, hi.severity, hi.resolved, hi.maintenance_ticket_id,
                   hi.created_at, hi.resolved_at,
                   r.room_number,
                   hs.full_name AS staff_name, hs.color AS staff_color
            FROM housekeeping_incidents hi
            JOIN rooms r ON hi.room_id = r.id
            LEFT JOIN housekeeping_staff hs ON hi.staff_id = hs.id
            WHERE 1=1
        """
        params = []
        if date_param:
            query += " AND DATE(hi.created_at) = %s"; params.append(date_param)
        else:
            query += " AND DATE(hi.created_at) = CURRENT_DATE"
        if type_filter:
            query += " AND hi.incident_type = %s"; params.append(type_filter)
        if severity_filter:
            query += " AND hi.severity = %s"; params.append(severity_filter)
        if resolved_filter is not None:
            query += " AND hi.resolved = %s"; params.append(resolved_filter)
        query += " ORDER BY hi.created_at DESC"

        cur.execute(query, params)
        rows = cur.fetchall()
        incidents = [
            {
                "id": r[0], "assignment_id": r[1], "room_id": r[2], "staff_id": r[3],
                "incident_type": r[4], "description": r[5], "severity": r[6],
                "resolved": r[7], "maintenance_ticket_id": r[8],
                "created_at": r[9].isoformat() if r[9] else None,
                "resolved_at": r[10].isoformat() if r[10] else None,
                "room_number": r[11], "staff_name": r[12], "staff_color": r[13],
            }
            for r in rows
        ]
        return {"success": True, "incidents": incidents}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener incidencias")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/incidents")
async def create_incident(
    data: IncidentCreate,
    current_user: dict = Depends(require_permission("housekeeping", "update_status")),
):
    """Create a new housekeeping incident."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO housekeeping_incidents (assignment_id, room_id, staff_id, incident_type, description, severity)
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
            (data.assignment_id, data.room_id, data.staff_id, data.incident_type, data.description, data.severity),
        )
        incident_id = cur.fetchone()[0]

        maintenance_ticket_id = None
        if data.incident_type == "maintenance_needed" and data.severity in ("medium", "high", "critical"):
            severity_map = {"medium": "normal", "high": "urgent", "critical": "critical"}
            priority = severity_map.get(data.severity, "normal")
            desc = data.description or f"Incidencia de mantenimiento reportada en habitación"
            cur.execute(
                "INSERT INTO maintenance_tickets (room_id, description, priority, status, created_by) VALUES (%s, %s, %s, 'open', %s) RETURNING id",
                (data.room_id, desc, priority, current_user.get("id")),
            )
            maintenance_ticket_id = cur.fetchone()[0]
            cur.execute(
                "UPDATE housekeeping_incidents SET maintenance_ticket_id = %s WHERE id = %s",
                (maintenance_ticket_id, incident_id),
            )

        conn.commit()
        return {"success": True, "incident": {"id": incident_id, "maintenance_ticket_id": maintenance_ticket_id}}
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear incidencia")
    finally:
        cur.close()
        release_connection(conn)


@router.patch("/incidents/{incident_id}")
async def update_incident(
    incident_id: int,
    data: IncidentUpdate,
    current_user: dict = Depends(require_permission("housekeeping", "update_status")),
):
    """Update incident (mark as resolved, edit description)."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        updates, params = [], []
        if data.resolved is not None:
            updates.append("resolved = %s"); params.append(data.resolved)
            if data.resolved:
                updates.append("resolved_at = CURRENT_TIMESTAMP")
        if data.description is not None:
            updates.append("description = %s"); params.append(data.description)
        if not updates:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")
        params.append(incident_id)
        cur.execute(f"UPDATE housekeeping_incidents SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar incidencia")
    finally:
        cur.close()
        release_connection(conn)


@router.delete("/incidents/{incident_id}")
async def delete_incident(
    incident_id: int,
    current_user: dict = Depends(require_permission("housekeeping", "update_status")),
):
    """Delete an incident."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM housekeeping_incidents WHERE id = %s", (incident_id,))
        conn.commit()
        return {"success": True}
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al eliminar incidencia")
    finally:
        cur.close()
        release_connection(conn)
