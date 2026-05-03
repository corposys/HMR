"""
Maintenance routes: CRUD for maintenance logs, stats, predictions, and alerts.
Handles both battery and mechanical maintenance tracking for hotel room locks.
"""
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from db import get_connection, release_connection
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])


# ── Pydantic Models ──────────────────────────────────────────────────────────

class MaintenanceCreate(BaseModel):
    room_id: int
    part_type_id: Optional[int] = None
    type: str  # 'battery' | 'mechanical'
    description: Optional[str] = None
    performed_at: Optional[str] = None  # ISO date string


class LockUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


def _ensure_lock_asset(cur, room_id: int) -> int:
    """Return lock_asset id for a room, creating it if missing."""
    cur.execute("SELECT id FROM lock_assets WHERE room_id = %s", (room_id,))
    found = cur.fetchone()
    if found:
        return found[0]

    cur.execute(
        """
        INSERT INTO lock_assets (room_id, code, status)
        VALUES (%s, %s, 'operational')
        RETURNING id
        """,
        (room_id, f"LOCK-{room_id}"),
    )
    return cur.fetchone()[0]


# ── List maintenance logs ────────────────────────────────────────────────────

@router.get("")
async def list_maintenance(
    room_id: Optional[int] = None,
    module_id: Optional[int] = None,
    type: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
):
    """List maintenance logs with optional filters, newest first."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
             SELECT ml.id, ml.room_id, ml.lock_asset_id, ml.part_type_id, ml.type, ml.description,
                   ml.performed_by, ml.performed_at, ml.created_at,
                   r.room_number,
                   f.code AS floor_code,
                   m.number AS module_number, m.name AS module_name,
                   pt.name AS part_name,
                 u.full_name AS user_name,
                 COALESCE(la.status, 'operational') AS lock_status,
                 la.code AS lock_code
            FROM maintenance_logs ml
            JOIN rooms r ON ml.room_id = r.id
            JOIN floors f ON r.floor_id = f.id
            JOIN modules m ON f.module_id = m.id
            LEFT JOIN part_types pt ON ml.part_type_id = pt.id
            LEFT JOIN users u ON ml.performed_by = u.id
             LEFT JOIN lock_assets la ON la.id = ml.lock_asset_id
            WHERE 1=1
        """
        params = []

        if room_id:
            query += " AND ml.room_id = %s"
            params.append(room_id)
        if module_id:
            query += " AND m.id = %s"
            params.append(module_id)
        if type:
            query += " AND ml.type = %s"
            params.append(type)

        query += " ORDER BY ml.performed_at DESC, ml.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cur.execute(query, params)
        rows = cur.fetchall()

        logs = [
            {
                "id": r[0], "room_id": r[1], "lock_asset_id": r[2], "part_type_id": r[3], "type": r[4],
                "description": r[5], "performed_by": r[6],
                "performed_at": r[7].isoformat() if r[7] else None,
                "created_at": r[8].isoformat() if r[8] else None,
                "room_number": r[9], "floor_code": r[10],
                "module_number": r[11], "module_name": r[12],
                "part_name": r[13], "user_name": r[14],
                "lock_status": r[15], "lock_code": r[16],
            }
            for r in rows
        ]
        return {"success": True, "logs": logs}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener registros de mantenimiento")
    finally:
        cur.close()
        release_connection(conn)


# ── Create maintenance log ───────────────────────────────────────────────────

@router.post("")
async def create_maintenance(
    data: MaintenanceCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a maintenance log entry. If type=battery, also updates rooms.last_battery_change."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        lock_asset_id = _ensure_lock_asset(cur, data.room_id)

        perf_date = data.performed_at or date.today().isoformat()

        cur.execute("""
            INSERT INTO maintenance_logs (room_id, lock_asset_id, part_type_id, type, description, performed_by, performed_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            data.room_id, lock_asset_id, data.part_type_id, data.type,
            data.description, current_user["id"], perf_date,
        ))
        log_id = cur.fetchone()[0]

        # Update room's last_battery_change if this is a battery change
        if data.type == "battery":
            cur.execute(
                "UPDATE rooms SET last_battery_change = %s WHERE id = %s",
                (perf_date, data.room_id),
            )

        conn.commit()
        return {"success": True, "id": log_id}
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear registro de mantenimiento")
    finally:
        cur.close()
        release_connection(conn)


# ── Delete a maintenance log ─────────────────────────────────────────────────

@router.delete("/{log_id}")
async def delete_maintenance(log_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM maintenance_logs WHERE id = %s", (log_id,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al eliminar registro")
    finally:
        cur.close()
        release_connection(conn)


# ── Stats ────────────────────────────────────────────────────────────────────

@router.get("/stats")
async def maintenance_stats(current_user: dict = Depends(get_current_user)):
    """Summary stats for the maintenance dashboard."""
    conn = get_connection()
    try:
        cur = conn.cursor()

        # Total logs
        cur.execute("SELECT COUNT(*) FROM maintenance_logs")
        total = cur.fetchone()[0]

        # This month
        cur.execute("""
            SELECT COUNT(*) FROM maintenance_logs
            WHERE DATE_TRUNC('month', performed_at) = DATE_TRUNC('month', CURRENT_DATE)
        """)
        this_month = cur.fetchone()[0]

        # By type
        cur.execute("""
            SELECT type, COUNT(*) FROM maintenance_logs GROUP BY type
        """)
        by_type = {r[0]: r[1] for r in cur.fetchall()}

        # By module (for chart)
        cur.execute("""
            SELECT m.name, COUNT(ml.id)
            FROM maintenance_logs ml
            JOIN rooms r ON ml.room_id = r.id
            JOIN floors f ON r.floor_id = f.id
            JOIN modules m ON f.module_id = m.id
            GROUP BY m.name, m.sort_order
            ORDER BY m.sort_order
        """)
        by_module = [{"module": r[0], "count": r[1]} for r in cur.fetchall()]

        return {
            "success": True,
            "stats": {
                "total": total,
                "this_month": this_month,
                "battery_changes": by_type.get("battery", 0),
                "mechanical_repairs": by_type.get("mechanical", 0),
                "by_module": by_module,
            },
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener estadísticas")
    finally:
        cur.close()
        release_connection(conn)


# ── Part types ───────────────────────────────────────────────────────────────

@router.get("/part-types")
async def list_part_types(current_user: dict = Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, name, category FROM part_types ORDER BY category, name")
        parts = [{"id": r[0], "name": r[1], "category": r[2]} for r in cur.fetchall()]
        return {"success": True, "part_types": parts}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener tipos de piezas")
    finally:
        cur.close()
        release_connection(conn)


# ── Predictions ──────────────────────────────────────────────────────────────

@router.get("/predictions")
async def get_predictions(
    module_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    """
    For each room, calculate battery prediction based on the average interval
    between the last 3 battery changes.
    Returns: room info, last change, avg days, estimated next change, health score.
    """
    conn = get_connection()
    try:
        cur = conn.cursor()

        # Get rooms with at least 1 battery log
        room_filter = ""
        params = []
        if module_id:
            room_filter = "AND m.id = %s"
            params.append(module_id)

        cur.execute(f"""
            SELECT r.id, r.room_number, r.last_battery_change,
                   f.code AS floor_code, m.number AS module_number, m.name AS module_name
            FROM rooms r
            JOIN floors f ON r.floor_id = f.id
            JOIN modules m ON f.module_id = m.id
            WHERE r.status = 'active'
              AND r.last_battery_change IS NOT NULL
              {room_filter}
            ORDER BY m.sort_order, f.sort_order, r.room_number
        """, params)
        rooms = cur.fetchall()

        predictions = []
        today = date.today()

        for room in rooms:
            room_id = room[0]

            # Get last 4 battery changes to calculate 3 intervals
            cur.execute("""
                SELECT performed_at FROM maintenance_logs
                WHERE room_id = %s AND type = 'battery'
                ORDER BY performed_at DESC LIMIT 4
            """, (room_id,))
            dates = [r[0] for r in cur.fetchall()]

            if len(dates) < 2:
                # Not enough data for prediction, use default (90 days)
                avg_days = 90
            else:
                # Calculate intervals between consecutive changes
                intervals = []
                for i in range(len(dates) - 1):
                    delta = (dates[i] - dates[i + 1]).days
                    if delta > 0:
                        intervals.append(delta)
                avg_days = int(sum(intervals) / len(intervals)) if intervals else 90

            last_change = room[2]
            days_since = (today - last_change).days
            estimated_next = last_change + timedelta(days=avg_days)
            days_remaining = (estimated_next - today).days

            # Health score: 100 = just changed, 0 = overdue
            health = max(0, min(100, int(100 - (days_since / max(avg_days, 1)) * 100)))

            predictions.append({
                "room_id": room_id,
                "room_number": room[1],
                "floor_code": room[3],
                "module_number": room[4],
                "module_name": room[5],
                "last_battery_change": last_change.isoformat(),
                "avg_days_between_changes": avg_days,
                "estimated_next_change": estimated_next.isoformat(),
                "days_remaining": days_remaining,
                "health_score": health,
            })

        return {"success": True, "predictions": predictions}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al calcular predicciones")
    finally:
        cur.close()
        release_connection(conn)


# ── Alerts (rooms at risk) ───────────────────────────────────────────────────

@router.get("/alerts")
async def get_alerts(
    threshold: int = Query(default=10, description="Days threshold for alerts"),
    current_user: dict = Depends(get_current_user),
):
    """Return rooms where the predicted next battery change is within `threshold` days."""
    result = await get_predictions(current_user=current_user)
    alerts = [
        p for p in result["predictions"]
        if p["days_remaining"] <= threshold
    ]
    # Sort by urgency (most urgent first)
    alerts.sort(key=lambda x: x["days_remaining"])

    return {
        "success": True,
        "threshold": threshold,
        "alerts": alerts,
        "count": len(alerts),
    }


# ── Locks inventory (phase 1) ───────────────────────────────────────────────

@router.get("/locks")
async def list_locks(
    module_id: Optional[int] = None,
    floor_id: Optional[int] = None,
    room_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """List lock assets mapped to rooms with latest maintenance context."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT la.id, la.code, la.status,
                   r.id AS room_id, r.room_number, r.status AS room_status,
                   f.id AS floor_id, f.code AS floor_code,
                   m.id AS module_id, m.name AS module_name, m.number AS module_number,
                   r.last_battery_change,
                   (
                       SELECT ml.performed_at FROM maintenance_logs ml
                       WHERE ml.room_id = r.id
                       ORDER BY ml.performed_at DESC, ml.created_at DESC
                       LIMIT 1
                   ) AS last_maintenance_at,
                   (
                       SELECT ml.type FROM maintenance_logs ml
                       WHERE ml.room_id = r.id
                       ORDER BY ml.performed_at DESC, ml.created_at DESC
                       LIMIT 1
                   ) AS last_maintenance_type,
                   (
                       SELECT COUNT(*) FROM maintenance_logs ml
                       WHERE ml.room_id = r.id
                   ) AS events_count
            FROM rooms r
            JOIN floors f ON r.floor_id = f.id
            JOIN modules m ON f.module_id = m.id
            LEFT JOIN lock_assets la ON la.room_id = r.id
            WHERE 1=1
        """
        params = []

        if module_id:
            query += " AND m.id = %s"
            params.append(module_id)
        if floor_id:
            query += " AND f.id = %s"
            params.append(floor_id)
        if room_id:
            query += " AND r.id = %s"
            params.append(room_id)
        if status:
            query += " AND COALESCE(la.status, 'operational') = %s"
            params.append(status)

        query += " ORDER BY m.sort_order, f.sort_order, r.room_number"
        cur.execute(query, params)
        rows = cur.fetchall()

        locks = []
        for r in rows:
            lock_id = r[0]
            if lock_id is None:
                lock_id = _ensure_lock_asset(cur, r[3])

            locks.append({
                "id": lock_id,
                "code": r[1] or f"LOCK-{r[3]}",
                "status": r[2] or "operational",
                "room_id": r[3],
                "room_number": r[4],
                "room_status": r[5],
                "floor_id": r[6],
                "floor_code": r[7],
                "module_id": r[8],
                "module_name": r[9],
                "module_number": r[10],
                "last_battery_change": r[11].isoformat() if r[11] else None,
                "last_maintenance_at": r[12].isoformat() if r[12] else None,
                "last_maintenance_type": r[13],
                "events_count": r[14],
            })

        conn.commit()
        return {"success": True, "locks": locks}
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al obtener cerraduras")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/locks/{lock_id}/events")
async def list_lock_events(lock_id: int, current_user: dict = Depends(get_current_user)):
    """Return chronological events for a lock asset."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT la.id, la.code, la.status, r.id, r.room_number,
                   f.code AS floor_code, m.name AS module_name
            FROM lock_assets la
            JOIN rooms r ON la.room_id = r.id
            JOIN floors f ON r.floor_id = f.id
            JOIN modules m ON f.module_id = m.id
            WHERE la.id = %s
        """, (lock_id,))
        lock_row = cur.fetchone()
        if not lock_row:
            raise HTTPException(status_code=404, detail="Cerradura no encontrada")

        cur.execute("""
            SELECT ml.performed_at, ml.type
            FROM maintenance_logs ml
            WHERE ml.lock_asset_id = %s
            ORDER BY ml.performed_at DESC, ml.created_at DESC
            LIMIT 1
        """, (lock_id,))
        last_row = cur.fetchone()

        cur.execute("""
            SELECT ml.id, ml.type, ml.description, ml.performed_at,
                   pt.name AS part_name, u.full_name AS user_name
            FROM maintenance_logs ml
            LEFT JOIN part_types pt ON ml.part_type_id = pt.id
            LEFT JOIN users u ON ml.performed_by = u.id
            WHERE ml.lock_asset_id = %s
            ORDER BY ml.performed_at DESC, ml.created_at DESC
        """, (lock_id,))
        events_rows = cur.fetchall()

        events = [
            {
                "id": r[0],
                "type": r[1],
                "description": r[2],
                "performed_at": r[3].isoformat() if r[3] else None,
                "part_name": r[4],
                "user_name": r[5],
            }
            for r in events_rows
        ]

        return {
            "success": True,
            "lock": {
                "id": lock_row[0],
                "code": lock_row[1],
                "status": lock_row[2],
                "room_id": lock_row[3],
                "room_number": lock_row[4],
                "floor_code": lock_row[5],
                "module_name": lock_row[6],
                "last_maintenance_at": last_row[0].isoformat() if last_row and last_row[0] else None,
                "last_maintenance_type": last_row[1] if last_row else None,
            },
            "events": events,
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener eventos de cerradura")
    finally:
        cur.close()
        release_connection(conn)


@router.patch("/locks/{lock_id}")
async def update_lock_asset(
    lock_id: int,
    data: LockUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update lock status/notes for operational tracking."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        updates, params = [], []

        if data.status is not None:
            if data.status not in ("operational", "preventive", "failure", "out_of_service"):
                raise HTTPException(status_code=400, detail="Estado de cerradura inválido")
            updates.append("status = %s")
            params.append(data.status)

        if data.notes is not None:
            updates.append("notes = %s")
            params.append(data.notes)

        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        params.append(lock_id)
        cur.execute(f"UPDATE lock_assets SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Cerradura no encontrada")

        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar cerradura")
    finally:
        cur.close()
        release_connection(conn)
