"""
Reports routes: aggregated analytics endpoints for the Reports module
and the consolidated Dashboard overview.

All endpoints require reports.read permission (admin bypass applies).
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query

from db import get_connection, release_connection
from middleware.auth import require_permission

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _parse_date(date_str: str | None, default: datetime) -> str:
    if not date_str:
        return default.strftime("%Y-%m-%d")
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").strftime("%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Fecha inválida. Use formato YYYY-MM-DD")


def _rowcount(cur) -> int:
    return cur.rowcount if cur.rowcount is not None else 0


@router.get("/overview")
async def reports_overview(
    current_user: dict = Depends(require_permission("reports", "read")),
):
    """Consolidated KPIs for the Dashboard and Reports header."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        data = {}

        cur.execute("""
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'operational') AS operational,
                COUNT(*) FILTER (WHERE status = 'needs_review') AS needs_review,
                COUNT(*) FILTER (WHERE status = 'out_of_service') AS out_of_service
            FROM lock_assets
        """)
        row = cur.fetchone()
        data["locks"] = {
            "total": row[0] or 0,
            "operational": row[1] or 0,
            "needs_review": row[2] or 0,
            "out_of_service": row[3] or 0,
        }

        cur.execute("SELECT COUNT(*) FROM signatures")
        data["signatures"] = {"total": cur.fetchone()[0] or 0}

        cur.execute("""
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'operational') AS operational,
                COUNT(*) FILTER (WHERE status = 'maintenance') AS maintenance,
                COUNT(*) FILTER (WHERE status = 'out_of_service') AS out_of_service,
                COUNT(*) FILTER (WHERE segment = 'hotel') AS hotel,
                COUNT(*) FILTER (WHERE segment = 'corpo') AS corpo
            FROM printers
        """)
        row = cur.fetchone()
        data["printers"] = {
            "total": row[0] or 0,
            "operational": row[1] or 0,
            "maintenance": row[2] or 0,
            "out_of_service": row[3] or 0,
            "hotel": row[4] or 0,
            "corpo": row[5] or 0,
        }

        cur.execute("""
            SELECT
                COALESCE(SUM(quantity), 0) AS total_stock,
                COUNT(*) FILTER (WHERE quantity <= 2) AS low_stock_items
            FROM toner_inventory
        """)
        row = cur.fetchone()
        data["toners"] = {
            "total_stock": int(row[0] or 0),
            "low_stock_items": row[1] or 0,
        }

        cur.execute("""
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'open') AS open,
                COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
                COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
                COUNT(*) FILTER (WHERE status = 'closed') AS closed
            FROM tickets
        """)
        row = cur.fetchone()
        data["tickets"] = {
            "total": row[0] or 0,
            "open": row[1] or 0,
            "in_progress": row[2] or 0,
            "resolved": row[3] or 0,
            "closed": row[4] or 0,
            "backlog": (row[1] or 0) + (row[2] or 0),
        }

        cur.execute("""
            SELECT
                COUNT(*) FILTER (WHERE performed_at >= CURRENT_DATE - INTERVAL '15 days') AS recent_total,
                COUNT(*) FILTER (WHERE performed_at >= CURRENT_DATE - INTERVAL '15 days' AND type = 'battery') AS recent_battery
            FROM maintenance_logs
        """)
        row = cur.fetchone()
        data["maintenance_recent"] = {
            "total_15d": row[0] or 0,
            "battery_15d": row[1] or 0,
        }

        return {"success": True, "data": data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener resumen: {str(e)}")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/locks")
async def reports_locks(
    from_date: str | None = Query(None, alias="from"),
    to_date: str | None = Query(None, alias="to"),
    current_user: dict = Depends(require_permission("reports", "read")),
):
    """Locks analytics: status distribution, maintenance events, alerts, parts consumption."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        default_to = datetime.now()
        default_from = default_to - timedelta(days=30)
        from_d = _parse_date(from_date, default_from)
        to_d = _parse_date(to_date, default_to)

        data = {"period": {"from": from_d, "to": to_d}}

        cur.execute("""
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'operational') AS operational,
                COUNT(*) FILTER (WHERE status = 'needs_review') AS needs_review,
                COUNT(*) FILTER (WHERE status = 'out_of_service') AS out_of_service
            FROM lock_assets
        """)
        row = cur.fetchone()
        data["status_distribution"] = {
            "operational": row[1] or 0,
            "needs_review": row[2] or 0,
            "out_of_service": row[3] or 0,
            "total": row[0] or 0,
        }

        cur.execute("""
            SELECT type, COUNT(*) AS count
            FROM maintenance_logs
            WHERE performed_at BETWEEN %s AND %s
            GROUP BY type
            ORDER BY count DESC
        """, (from_d, to_d))
        data["events_by_type"] = [
            {"type": r[0], "count": r[1]} for r in cur.fetchall()
        ]

        cur.execute("""
            SELECT
                TO_CHAR(performed_at, 'YYYY-MM-DD') AS day,
                COUNT(*) AS count
            FROM maintenance_logs
            WHERE performed_at BETWEEN %s AND %s
            GROUP BY day
            ORDER BY day
        """, (from_d, to_d))
        data["events_by_day"] = [
            {"day": r[0], "count": r[1]} for r in cur.fetchall()
        ]

        cur.execute("""
            SELECT pt.name, COALESCE(SUM(mlp.quantity), 0) AS used
            FROM part_types pt
            LEFT JOIN maintenance_log_parts mlp ON mlp.part_type_id = pt.id
            LEFT JOIN maintenance_logs ml ON ml.id = mlp.maintenance_log_id
                AND ml.performed_at BETWEEN %s AND %s
            GROUP BY pt.id, pt.name
            HAVING COALESCE(SUM(mlp.quantity), 0) > 0
            ORDER BY used DESC
            LIMIT 10
        """, (from_d, to_d))
        data["parts_consumption"] = [
            {"part": r[0], "used": int(r[1])} for r in cur.fetchall()
        ]

        cur.execute("""
            SELECT
                r.id, r.room_id, ro.room_number, f.code AS floor_code,
                m.number AS module_number, r.report_type, r.issue_description,
                r.source_department, r.status, r.created_at
            FROM operational_reports r
            JOIN rooms ro ON ro.id = r.room_id
            JOIN floors f ON f.id = ro.floor_id
            JOIN modules m ON m.id = f.module_id
            WHERE r.status = 'pending'
            ORDER BY r.created_at DESC
            LIMIT 20
        """)
        data["open_reports"] = [
            {
                "id": r[0],
                "room_id": r[1],
                "room_number": r[2],
                "floor_code": r[3],
                "module_number": r[4],
                "report_type": r[5],
                "issue_description": r[6],
                "source_department": r[7],
                "status": r[8],
                "created_at": r[9].isoformat() if r[9] else None,
            }
            for r in cur.fetchall()
        ]

        cur.execute("""
            SELECT
                COUNT(*) FILTER (WHERE days_remaining < 0) AS overdue,
                COUNT(*) FILTER (WHERE days_remaining BETWEEN 0 AND 15) AS upcoming
            FROM (
                SELECT la.id,
                    CASE
                        WHEN ml.avg_days IS NULL OR ml.avg_days = 0 THEN 90
                        ELSE GREATEST(0, ml.avg_days - EXTRACT(EPOCH FROM (CURRENT_DATE - ml.last_change)) / 86400.0)
                    END AS days_remaining
                FROM lock_assets la
                LEFT JOIN LATERAL (
                    SELECT
                        COALESCE(AVG(diff_days), 0) AS avg_days,
                        MAX(performed_at) AS last_change
                    FROM (
                        SELECT
                            performed_at,
                            EXTRACT(EPOCH FROM (performed_at - LAG(performed_at) OVER (PARTITION BY lock_asset_id ORDER BY performed_at))) / 86400.0 AS diff_days
                        FROM maintenance_logs
                        WHERE lock_asset_id = la.id AND type = 'battery'
                    ) sub
                ) ml ON TRUE
                WHERE la.status = 'operational'
            ) sub
        """)
        row = cur.fetchone()
        data["battery_alerts"] = {
            "overdue": row[0] or 0,
            "upcoming_15d": row[1] or 0,
        }

        return {"success": True, "data": data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener reporte de cerraduras: {str(e)}")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/printers")
async def reports_printers(
    from_date: str | None = Query(None, alias="from"),
    to_date: str | None = Query(None, alias="to"),
    current_user: dict = Depends(require_permission("reports", "read")),
):
    """Printers & toners analytics: inventory, stock, transactions."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        default_to = datetime.now()
        default_from = default_to - timedelta(days=30)
        from_d = _parse_date(from_date, default_from)
        to_d = _parse_date(to_date, default_to)

        data = {"period": {"from": from_d, "to": to_d}}

        cur.execute("""
            SELECT
                segment,
                status,
                COUNT(*) AS count
            FROM printers
            GROUP BY segment, status
            ORDER BY segment, status
        """)
        rows = cur.fetchall()
        data["by_segment_status"] = [
            {"segment": r[0], "status": r[1], "count": r[2]} for r in rows
        ]

        cur.execute("""
            SELECT ownership, COUNT(*) FROM printers GROUP BY ownership
        """)
        data["by_ownership"] = [
            {"ownership": r[0], "count": r[1]} for r in cur.fetchall()
        ]

        cur.execute("""
            SELECT
                tm.id, tm.model_name, tm.color,
                COALESCE(SUM(ti.quantity) FILTER (WHERE ti.segment = 'hotel'), 0) AS stock_hotel,
                COALESCE(SUM(ti.quantity) FILTER (WHERE ti.segment = 'corpo'), 0) AS stock_corpo,
                COALESCE(SUM(ti.quantity), 0) AS total_stock
            FROM toner_models tm
            LEFT JOIN toner_inventory ti ON ti.toner_model_id = tm.id
            GROUP BY tm.id, tm.model_name, tm.color
            ORDER BY total_stock ASC
        """)
        toners = []
        for r in cur.fetchall():
            total = int(r[5] or 0)
            toners.append({
                "id": r[0],
                "model_name": r[1],
                "color": r[2],
                "stock_hotel": int(r[3] or 0),
                "stock_corpo": int(r[4] or 0),
                "total_stock": total,
                "low_stock": total <= 2,
            })
        data["toners"] = toners
        data["toner_low_stock_count"] = sum(1 for t in toners if t["low_stock"])

        cur.execute("""
            SELECT type, segment, COUNT(*) AS count, COALESCE(SUM(quantity), 0) AS total_qty
            FROM toner_transactions
            WHERE created_at::date BETWEEN %s AND %s
            GROUP BY type, segment
            ORDER BY type, segment
        """, (from_d, to_d))
        data["transactions_summary"] = [
            {
                "type": r[0],
                "segment": r[1],
                "count": r[2],
                "total_qty": int(r[3] or 0),
            }
            for r in cur.fetchall()
        ]

        cur.execute("""
            SELECT
                tt.id, tt.type, tt.segment, tt.quantity, tt.notes, tt.created_at,
                tm.model_name, tm.color,
                p.brand, p.model, p.location,
                u.full_name
            FROM toner_transactions tt
            LEFT JOIN toner_models tm ON tm.id = tt.toner_model_id
            LEFT JOIN printers p ON p.id = tt.printer_id
            LEFT JOIN users u ON u.id = tt.created_by
            WHERE tt.created_at::date BETWEEN %s AND %s
            ORDER BY tt.created_at DESC
            LIMIT 50
        """, (from_d, to_d))
        data["transactions_recent"] = [
            {
                "id": r[0],
                "type": r[1],
                "segment": r[2],
                "quantity": r[3],
                "notes": r[4],
                "created_at": r[5].isoformat() if r[5] else None,
                "toner_model": r[6],
                "color": r[7],
                "printer_brand": r[8],
                "printer_model": r[9],
                "printer_location": r[10],
                "user_name": r[11],
            }
            for r in cur.fetchall()
        ]

        return {"success": True, "data": data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener reporte de impresoras: {str(e)}")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/tickets")
async def reports_tickets(
    from_date: str | None = Query(None, alias="from"),
    to_date: str | None = Query(None, alias="to"),
    current_user: dict = Depends(require_permission("reports", "read")),
):
    """Tickets analytics: status/priority/category distribution, resolution time, backlog."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        default_to = datetime.now()
        default_from = default_to - timedelta(days=30)
        from_d = _parse_date(from_date, default_from)
        to_d = _parse_date(to_date, default_to)

        data = {"period": {"from": from_d, "to": to_d}}

        cur.execute("""
            SELECT status, COUNT(*) AS count
            FROM tickets
            WHERE created_at::date BETWEEN %s AND %s
            GROUP BY status
        """, (from_d, to_d))
        data["by_status"] = [
            {"status": r[0], "count": r[1]} for r in cur.fetchall()
        ]

        cur.execute("""
            SELECT priority, COUNT(*) AS count
            FROM tickets
            WHERE created_at::date BETWEEN %s AND %s
            GROUP BY priority
            ORDER BY count DESC
        """, (from_d, to_d))
        data["by_priority"] = [
            {"priority": r[0], "count": r[1]} for r in cur.fetchall()
        ]

        cur.execute("""
            SELECT category, COUNT(*) AS count
            FROM tickets
            WHERE created_at::date BETWEEN %s AND %s
            GROUP BY category
            ORDER BY count DESC
        """, (from_d, to_d))
        data["by_category"] = [
            {"category": r[0], "count": r[1]} for r in cur.fetchall()
        ]

        cur.execute("""
            SELECT
                TO_CHAR(created_at::date, 'YYYY-MM-DD') AS day,
                COUNT(*) FILTER (WHERE TRUE) AS created,
                COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) AS resolved
            FROM tickets
            WHERE created_at::date BETWEEN %s AND %s
            GROUP BY day
            ORDER BY day
        """, (from_d, to_d))
        data["created_vs_resolved_by_day"] = [
            {"day": r[0], "created": r[1], "resolved": r[2]} for r in cur.fetchall()
        ]

        cur.execute("""
            SELECT
                COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0), 0) AS avg_hours,
                COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) AS resolved_count
            FROM tickets
            WHERE created_at::date BETWEEN %s AND %s
              AND resolved_at IS NOT NULL
        """, (from_d, to_d))
        row = cur.fetchone()
        avg_hours = float(row[0] or 0)
        data["avg_resolution_hours"] = round(avg_hours, 1)
        data["resolved_count_in_period"] = row[1] or 0

        cur.execute("""
            SELECT
                t.id, t.ticket_number, t.title, t.status, t.priority, t.category,
                t.created_at, t.updated_at, t.resolved_at,
                u.full_name AS assigned_name,
                (SELECT COUNT(*) FROM ticket_comments tc WHERE tc.ticket_id = t.id) AS comment_count
            FROM tickets t
            LEFT JOIN users u ON u.id = t.assigned_to
            WHERE t.status IN ('open', 'in_progress')
            ORDER BY
                CASE t.priority
                    WHEN 'urgente' THEN 1
                    WHEN 'alta' THEN 2
                    WHEN 'media' THEN 3
                    WHEN 'baja' THEN 4
                END,
                t.created_at ASC
            LIMIT 50
        """)
        data["backlog"] = [
            {
                "id": r[0],
                "ticket_number": r[1],
                "title": r[2],
                "status": r[3],
                "priority": r[4],
                "category": r[5],
                "created_at": r[6].isoformat() if r[6] else None,
                "updated_at": r[7].isoformat() if r[7] else None,
                "resolved_at": r[8].isoformat() if r[8] else None,
                "assigned_name": r[9],
                "comment_count": r[10] or 0,
            }
            for r in cur.fetchall()
        ]

        cur.execute("""
            SELECT
                u.id, u.full_name,
                COUNT(t.id) AS total,
                COUNT(*) FILTER (WHERE t.status IN ('open', 'in_progress')) AS active,
                COUNT(*) FILTER (WHERE t.resolved_at IS NOT NULL) AS resolved
            FROM users u
            LEFT JOIN tickets t ON t.assigned_to = u.id
            WHERE u.is_active = TRUE
            GROUP BY u.id, u.full_name
            HAVING COUNT(t.id) > 0
            ORDER BY total DESC
        """)
        data["by_assignee"] = [
            {
                "user_id": r[0],
                "full_name": r[1],
                "total": r[2] or 0,
                "active": r[3] or 0,
                "resolved": r[4] or 0,
            }
            for r in cur.fetchall()
        ]

        return {"success": True, "data": data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener reporte de tickets: {str(e)}")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/signatures")
async def reports_signatures(
    from_date: str | None = Query(None, alias="from"),
    to_date: str | None = Query(None, alias="to"),
    current_user: dict = Depends(require_permission("reports", "read")),
):
    """Signatures analytics: generated over time, list of employees with signatures."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        default_to = datetime.now()
        default_from = default_to - timedelta(days=90)
        from_d = _parse_date(from_date, default_from)
        to_d = _parse_date(to_date, default_to)

        data = {"period": {"from": from_d, "to": to_d}}

        cur.execute("SELECT COUNT(*) FROM signatures")
        data["total"] = cur.fetchone()[0] or 0

        cur.execute("""
            SELECT
                COUNT(*) FILTER (WHERE created_at::date BETWEEN %s AND %s) AS in_period
            FROM signatures
        """, (from_d, to_d))
        data["in_period"] = cur.fetchone()[0] or 0

        cur.execute("""
            SELECT
                TO_CHAR(created_at::date, 'YYYY-MM-DD') AS day,
                COUNT(*) AS count
            FROM signatures
            WHERE created_at::date BETWEEN %s AND %s
            GROUP BY day
            ORDER BY day
        """, (from_d, to_d))
        data["by_day"] = [
            {"day": r[0], "count": r[1]} for r in cur.fetchall()
        ]

        cur.execute("""
            SELECT
                TO_CHAR(created_at, 'YYYY-MM') AS month,
                COUNT(*) AS count
            FROM signatures
            WHERE created_at::date BETWEEN %s AND %s
            GROUP BY month
            ORDER BY month
        """, (from_d, to_d))
        data["by_month"] = [
            {"month": r[0], "count": r[1]} for r in cur.fetchall()
        ]

        cur.execute("""
            SELECT s.id, s.full_name, s.job_title, s.email,
                   s.mobile_phone, s.extension, s.created_at,
                   u.full_name AS created_by_name
            FROM signatures s
            LEFT JOIN users u ON u.id = s.created_by
            ORDER BY s.created_at DESC
        """)
        data["list"] = [
            {
                "id": r[0],
                "full_name": r[1],
                "job_title": r[2],
                "email": r[3],
                "mobile_phone": r[4],
                "extension": r[5],
                "created_at": r[6].isoformat() if r[6] else None,
                "created_by_name": r[7],
            }
            for r in cur.fetchall()
        ]

        return {"success": True, "data": data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener reporte de firmas: {str(e)}")
    finally:
        cur.close()
        release_connection(conn)
