"""
Maintenance routes: CRUD for maintenance logs, stats, predictions, alerts,
operational reports, and part types.
Handles battery, mechanical, and reprogramming maintenance tracking for hotel room locks.
"""
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Literal

from db import get_connection, release_connection
from middleware.auth import get_current_user, require_permission

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])


# ── Pydantic Models ──────────────────────────────────────────────────────────

class MaintenanceCreate(BaseModel):
    room_id: int
    part_type_id: Optional[int] = None
    type: Literal["battery", "mechanical", "reprogramming"]
    description: Optional[str] = None
    performed_at: Optional[str] = None  # ISO datetime string (YYYY-MM-DDTHH:MM)


class LockUpdate(BaseModel):
    status: Optional[Literal["operational", "needs_review", "out_of_service"]] = None
    notes: Optional[str] = None


class ReportCreate(BaseModel):
    report_type: Literal["lock_failure", "room_issue", "equipment_issue", "other"]
    room_id: int
    issue_description: str
    source_department: Literal["reception", "housekeeping", "maintenance", "systems"]


class ReportUpdate(BaseModel):
    status: Literal["resolved", "duplicate"]


class PartTypeCreate(BaseModel):
    name: str
    category: Literal["battery", "mechanical"]


class PartTypeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[Literal["battery", "mechanical"]] = None
    is_active: Optional[bool] = None


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
    current_user: dict = Depends(require_permission("maintenance", "write")),
):
    """Create a maintenance log entry. If type=battery, also updates rooms.last_battery_change."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        lock_asset_id = _ensure_lock_asset(cur, data.room_id)

        perf_date = data.performed_at or datetime.now().isoformat()

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

        # Update lock status to operational after reprogramming or mechanical repair
        if data.type in ("reprogramming", "mechanical"):
            cur.execute(
                "UPDATE lock_assets SET status = 'operational' WHERE id = %s AND status = 'needs_review'",
                (lock_asset_id,),
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
async def delete_maintenance(
    log_id: int,
    current_user: dict = Depends(require_permission("maintenance", "write")),
):
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

        # Reports summary
        cur.execute("""
            SELECT status, COUNT(*) FROM operational_reports
            WHERE status = 'pending'
            GROUP BY status
        """)
        pending_reports = 0
        for r in cur.fetchall():
            pending_reports = r[1]

        # Lock status counts
        cur.execute("""
            SELECT status, COUNT(*) FROM lock_assets GROUP BY status
        """)
        by_lock_status = {r[0]: r[1] for r in cur.fetchall()}

        return {
            "success": True,
            "stats": {
                "total": total,
                "this_month": this_month,
                "battery_changes": by_type.get("battery", 0),
                "mechanical_repairs": by_type.get("mechanical", 0),
                "reprogrammings": by_type.get("reprogramming", 0),
                "pending_reports": pending_reports,
                "locks_operational": by_lock_status.get("operational", 0),
                "locks_needs_review": by_lock_status.get("needs_review", 0),
                "locks_out_of_service": by_lock_status.get("out_of_service", 0),
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
        cur.execute("SELECT id, name, category, is_active FROM part_types ORDER BY category, name")
        parts = [{"id": r[0], "name": r[1], "category": r[2], "is_active": r[3]} for r in cur.fetchall()]
        return {"success": True, "part_types": parts}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener tipos de piezas")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/part-types")
async def create_part_type(
    data: PartTypeCreate,
    current_user: dict = Depends(require_permission("maintenance", "write")),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO part_types (name, category) VALUES (%s, %s) RETURNING id",
            (data.name, data.category),
        )
        pt_id = cur.fetchone()[0]
        conn.commit()
        return {"success": True, "id": pt_id}
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear tipo de pieza")
    finally:
        cur.close()
        release_connection(conn)


@router.put("/part-types/{pt_id}")
async def update_part_type(
    pt_id: int,
    data: PartTypeUpdate,
    current_user: dict = Depends(require_permission("maintenance", "write")),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        updates, params = [], []

        if data.name is not None:
            updates.append("name = %s")
            params.append(data.name)
        if data.category is not None:
            updates.append("category = %s")
            params.append(data.category)
        if data.is_active is not None:
            updates.append("is_active = %s")
            params.append(data.is_active)

        if not updates:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")

        params.append(pt_id)
        cur.execute(f"UPDATE part_types SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()

        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Tipo de pieza no encontrado")

        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar tipo de pieza")
    finally:
        cur.close()
        release_connection(conn)


@router.delete("/part-types/{pt_id}")
async def delete_part_type(
    pt_id: int,
    current_user: dict = Depends(require_permission("maintenance", "write")),
):
    """Soft-delete a part type."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE part_types SET is_active = FALSE WHERE id = %s", (pt_id,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Tipo de pieza no encontrado")
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al desactivar tipo de pieza")
    finally:
        cur.close()
        release_connection(conn)


# ── Operational Reports ──────────────────────────────────────────────────────

@router.get("/reports")
async def list_reports(
    room_id: Optional[int] = None,
    status: Optional[str] = None,
    report_type: Optional[str] = None,
    source_department: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
):
    """List operational reports with optional filters."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT
                opr.id, opr.report_type, opr.room_id, opr.lock_asset_id,
                opr.source_department, opr.issue_description, opr.status,
                opr.created_at, opr.resolved_at,
                r.room_number,
                f.code AS floor_code,
                m.name AS module_name,
                u.full_name AS reported_by_name,
                ru.full_name AS resolved_by_name,
                la.status AS lock_status
            FROM operational_reports opr
            JOIN rooms r ON opr.room_id = r.id
            JOIN floors f ON r.floor_id = f.id
            JOIN modules m ON f.module_id = m.id
            LEFT JOIN users u ON opr.reported_by = u.id
            LEFT JOIN users ru ON opr.resolved_by = ru.id
            LEFT JOIN lock_assets la ON opr.lock_asset_id = la.id
            WHERE 1=1
        """
        params = []

        if room_id:
            query += " AND opr.room_id = %s"
            params.append(room_id)
        if status:
            query += " AND opr.status = %s"
            params.append(status)
        if report_type:
            query += " AND opr.report_type = %s"
            params.append(report_type)
        if source_department:
            query += " AND opr.source_department = %s"
            params.append(source_department)

        query += " ORDER BY opr.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cur.execute(query, params)
        rows = cur.fetchall()

        reports = [
            {
                "id": r[0], "report_type": r[1], "room_id": r[2], "lock_asset_id": r[3],
                "source_department": r[4], "issue_description": r[5], "status": r[6],
                "created_at": r[7].isoformat() if r[7] else None,
                "resolved_at": r[8].isoformat() if r[8] else None,
                "room_number": r[9], "floor_code": r[10], "module_name": r[11],
                "reported_by_name": r[12], "resolved_by_name": r[13], "lock_status": r[14],
            }
            for r in rows
        ]
        return {"success": True, "reports": reports}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener reportes")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/reports")
async def create_report(
    data: ReportCreate,
    current_user: dict = Depends(require_permission("maintenance", "write")),
):
    """Create an operational report. If lock_failure, updates lock_assets.status to 'needs_review'."""
    conn = get_connection()
    try:
        cur = conn.cursor()

        # Check for active duplicate
        cur.execute(
            """
            SELECT id FROM operational_reports
            WHERE room_id = %s AND report_type = %s AND status = 'pending'
            LIMIT 1
            """,
            (data.room_id, data.report_type),
        )
        if cur.fetchone():
            raise HTTPException(
                status_code=409,
                detail="Ya existe un reporte activo de este tipo para esta habitación"
            )

        # Get lock_asset_id if report_type is lock_failure
        lock_asset_id = None
        if data.report_type == "lock_failure":
            cur.execute("SELECT id FROM lock_assets WHERE room_id = %s", (data.room_id,))
            row = cur.fetchone()
            lock_asset_id = row[0] if row else None

        cur.execute("""
            INSERT INTO operational_reports
            (report_type, room_id, lock_asset_id, source_department, issue_description, reported_by, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending')
            RETURNING id
        """, (
            data.report_type, data.room_id, lock_asset_id,
            data.source_department, data.issue_description, current_user["id"],
        ))
        report_id = cur.fetchone()[0]

        # Update lock status to needs_review
        if data.report_type == "lock_failure" and lock_asset_id:
            cur.execute(
                "UPDATE lock_assets SET status = 'needs_review' WHERE id = %s",
                (lock_asset_id,),
            )

        conn.commit()
        return {"success": True, "id": report_id}
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear reporte")
    finally:
        cur.close()
        release_connection(conn)


@router.patch("/reports/{report_id}")
async def resolve_report(
    report_id: int,
    data: ReportUpdate,
    current_user: dict = Depends(require_permission("maintenance", "write")),
):
    """Resolve or mark a report as duplicate. If lock_failure, restores lock status to operational."""
    conn = get_connection()
    try:
        cur = conn.cursor()

        cur.execute(
            """
            SELECT report_type, room_id, lock_asset_id, status
            FROM operational_reports WHERE id = %s
            """,
            (report_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Reporte no encontrado")

        report_type, room_id, lock_asset_id, current_status = row
        if current_status != "pending":
            raise HTTPException(status_code=400, detail="El reporte ya fue cerrado")

        resolved_at = date.today().isoformat()
        cur.execute("""
            UPDATE operational_reports
            SET status = %s, resolved_by = %s, resolved_at = %s
            WHERE id = %s
        """, (data.status, current_user["id"], resolved_at, report_id))

        # If resolving a lock_failure, check if there are other pending lock failures for this room
        if report_type == "lock_failure" and lock_asset_id:
            cur.execute(
                """
                SELECT COUNT(*) FROM operational_reports
                WHERE room_id = %s AND report_type = 'lock_failure' AND status = 'pending'
                """,
                (room_id,),
            )
            remaining = cur.fetchone()[0]
            if remaining == 0:
                cur.execute(
                    "UPDATE lock_assets SET status = 'operational' WHERE id = %s",
                    (lock_asset_id,),
                )

        conn.commit()
        return {"success": True}
    except HTTPException:
        conn.rollback()
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar reporte")
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


# ── Locks inventory ──────────────────────────────────────────────────────────

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
                   f.id AS floor_id, f.code AS floor_code, f.is_active AS floor_is_active,
                   m.id AS module_id, m.name AS module_name, m.number AS module_number, m.is_active AS module_is_active,
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
                    ) AS events_count,
                    la.notes
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
            current_lock_status = r[2] if lock_id else "operational"
            room_id_val = r[3]

            locks.append({
                "id": lock_id,
                "code": r[1] if lock_id else None,
                "status": current_lock_status,
                "room_id": room_id_val,
                "room_number": r[4],
                "room_status": r[5],
                "floor_id": r[6],
                "floor_code": r[7],
                "floor_is_active": r[8] if r[8] is not None else True,
                "module_id": r[9],
                "module_name": r[10],
                "module_number": r[11],
                "module_is_active": r[12] if r[12] is not None else True,
                "last_battery_change": r[13].isoformat() if r[13] else None,
                "last_maintenance_at": r[14].isoformat() if r[14] else None,
                "last_maintenance_type": r[15],
                "events_count": r[16],
                "notes": r[17] if len(r) > 17 else None,
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
            SELECT la.id, la.code, la.status, la.notes, r.id, r.room_number,
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
                "notes": lock_row[3],
                "room_id": lock_row[4],
                "room_number": lock_row[5],
                "floor_code": lock_row[6],
                "module_name": lock_row[7],
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
    current_user: dict = Depends(require_permission("maintenance", "write")),
):
    """Update lock status/notes for operational tracking."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        updates, params = [], []

        if data.status is not None:
            if data.status not in ("operational", "needs_review", "out_of_service"):
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
