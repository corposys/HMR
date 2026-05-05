"""
Rack Operativo routes: real-time room status WebSocket + optimized REST endpoint.
"""
from datetime import date
import json
from typing import Set

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState

from db import get_connection, release_connection
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/rack", tags=["rack"])

# ── WebSocket Connection Manager ───────────────────────────────────────────────

class RackConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        disconnected = set()
        for ws in self.active_connections:
            try:
                if ws.client_state == WebSocketState.CONNECTED:
                    await ws.send_json(message)
            except Exception:
                disconnected.add(ws)
        for ws in disconnected:
            self.active_connections.discard(ws)

rack_manager = RackConnectionManager()

# ── Broadcast Helper ───────────────────────────────────────────────────────────

async def broadcast_room_update(room_id: int, changes: dict):
    """Broadcast a room status change to all connected Rack Operativo clients."""
    await rack_manager.broadcast({
        "event": "room_update",
        "room_id": room_id,
        "changes": changes,
    })


async def broadcast_full_sync():
    """Broadcast a full sync event (triggered after significant changes)."""
    await rack_manager.broadcast({
        "event": "full_sync",
    })


# ── REST Endpoint ──────────────────────────────────────────────────────────────

@router.get("/rooms")
async def list_rooms_rack(
    module_id: int = Query(default=None),
    status: str = Query(default=None),
    housekeeping_status: str = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    """Optimized room list for Rack Operativo. Same query as reception but explicit."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT r.id, r.room_number, r.status, r.category, r.housekeeping_status,
                   r.is_blocked, r.blocked_reason, r.blocked_until,
                   rt.id, rt.name, rt.max_occupancy,
                   r.nightly_rate_usd,
                   f.id, f.code AS floor_code, f.name AS floor_name,
                   m.id, m.number AS module_number, m.name AS module_name,
                   res.id, res.status, res.check_in_date, res.check_out_date,
                   g.full_name, rp.name AS plan_name
            FROM rooms r
            JOIN floors f ON r.floor_id = f.id
            JOIN modules m ON f.module_id = m.id
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            LEFT JOIN reservations res ON res.room_id = r.id
                AND res.status IN ('reserved', 'checked_in')
            LEFT JOIN guests g ON res.guest_id = g.id
            LEFT JOIN reservation_plans rp ON res.plan_id = rp.id
            WHERE m.is_active = TRUE AND f.is_active = TRUE
        """
        params = []
        if module_id:
            query += " AND m.id = %s"
            params.append(module_id)
        if status:
            query += " AND r.status = %s"
            params.append(status)
        if housekeeping_status:
            query += " AND r.housekeeping_status = %s"
            params.append(housekeeping_status)
        query += " ORDER BY m.sort_order, f.sort_order, r.room_number"

        cur.execute(query, params)
        rows = cur.fetchall()
        rooms = [
            {
                "id": r[0], "room_number": r[1], "status": r[2], "category": r[3],
                "housekeeping_status": r[4], "is_blocked": r[5],
                "blocked_reason": r[6],
                "blocked_until": r[7].isoformat() if r[7] else None,
                "room_type_id": r[8], "room_type_name": r[9],
                "max_occupancy": r[10],
                "nightly_rate_usd": float(r[11]),
                "floor_id": r[12], "floor_code": r[13], "floor_name": r[14],
                "module_id": r[15], "module_number": r[16], "module_name": r[17],
                "active_reservation_id": r[18],
                "reservation_status": r[19],
                "reservation_check_in": r[20].isoformat() if r[20] else None,
                "reservation_check_out": r[21].isoformat() if r[21] else None,
                "guest_name": r[22],
                "plan_name": r[23],
            }
            for r in rows
        ]
        return {"success": True, "rooms": rooms}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener habitaciones")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/arrivals")
async def list_today_arrivals(current_user: dict = Depends(get_current_user)):
    """Today's arrivals: reservations checking in today."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        today = date.today().isoformat()
        cur.execute("""
            SELECT res.id, res.status, res.check_in_date, res.check_out_date,
                   g.full_name, r.room_number, rp.name AS plan_name,
                   fol.balance
            FROM reservations res
            JOIN guests g ON res.guest_id = g.id
            JOIN rooms r ON res.room_id = r.id
            LEFT JOIN reservation_plans rp ON res.plan_id = rp.id
            LEFT JOIN folios fol ON fol.reservation_id = res.id
            WHERE res.check_in_date = %s AND res.status IN ('reserved', 'checked_in')
            ORDER BY res.check_in_date, r.room_number
        """, (today,))
        rows = cur.fetchall()
        arrivals = [
            {
                "id": r[0], "status": r[1],
                "check_in_date": r[2].isoformat() if r[2] else None,
                "check_out_date": r[3].isoformat() if r[3] else None,
                "guest_name": r[4],
                "room_number": r[5],
                "plan_name": r[6],
                "balance": float(r[7]) if r[7] else 0,
            }
            for r in rows
        ]
        return {"success": True, "arrivals": arrivals}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener llegadas del día")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/departures")
async def list_today_departures(current_user: dict = Depends(get_current_user)):
    """Today's departures: checked_in reservations checking out today."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        today = date.today().isoformat()
        cur.execute("""
            SELECT res.id, res.status, res.check_in_date, res.check_out_date,
                   g.full_name, r.room_number, rp.name AS plan_name,
                   fol.balance
            FROM reservations res
            JOIN guests g ON res.guest_id = g.id
            JOIN rooms r ON res.room_id = r.id
            LEFT JOIN reservation_plans rp ON res.plan_id = rp.id
            LEFT JOIN folios fol ON fol.reservation_id = res.id
            WHERE res.check_out_date = %s AND res.status = 'checked_in'
            ORDER BY res.check_out_date, r.room_number
        """, (today,))
        rows = cur.fetchall()
        departures = [
            {
                "id": r[0], "status": r[1],
                "check_in_date": r[2].isoformat() if r[2] else None,
                "check_out_date": r[3].isoformat() if r[3] else None,
                "guest_name": r[4],
                "room_number": r[5],
                "plan_name": r[6],
                "balance": float(r[7]) if r[7] else 0,
            }
            for r in rows
        ]
        return {"success": True, "departures": departures}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener salidas del día")
    finally:
        cur.close()
        release_connection(conn)


# ── WebSocket Endpoint ─────────────────────────────────────────────────────────

@router.websocket("/ws")
async def rack_websocket(websocket: WebSocket):
    """WebSocket for real-time room status updates."""
    await rack_manager.connect(websocket)
    try:
        # Send initial snapshot
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute("""
                SELECT r.id, r.room_number, r.status, r.category, r.housekeeping_status,
                       r.is_blocked, r.blocked_reason, r.blocked_until,
                       rt.id, rt.name, rt.max_occupancy,
                       r.nightly_rate_usd,
                       f.id, f.code AS floor_code, f.name AS floor_name,
                       m.id, m.number AS module_number, m.name AS module_name,
                       res.id, res.status, res.check_in_date, res.check_out_date,
                       g.full_name, rp.name AS plan_name
                FROM rooms r
                JOIN floors f ON r.floor_id = f.id
                JOIN modules m ON f.module_id = m.id
                LEFT JOIN room_types rt ON r.room_type_id = rt.id
                LEFT JOIN reservations res ON res.room_id = r.id
                    AND res.status IN ('reserved', 'checked_in')
                LEFT JOIN guests g ON res.guest_id = g.id
                LEFT JOIN reservation_plans rp ON res.plan_id = rp.id
                WHERE m.is_active = TRUE AND f.is_active = TRUE
                ORDER BY m.sort_order, f.sort_order, r.room_number
            """)
            rows = cur.fetchall()
            rooms = [
                {
                    "id": r[0], "room_number": r[1], "status": r[2], "category": r[3],
                    "housekeeping_status": r[4], "is_blocked": r[5],
                    "blocked_reason": r[6],
                    "blocked_until": r[7].isoformat() if r[7] else None,
                    "room_type_id": r[8], "room_type_name": r[9],
                    "max_occupancy": r[10],
                    "nightly_rate_usd": float(r[11]),
                    "floor_id": r[12], "floor_code": r[13], "floor_name": r[14],
                    "module_id": r[15], "module_number": r[16], "module_name": r[17],
                    "active_reservation_id": r[18],
                    "reservation_status": r[19],
                    "reservation_check_in": r[20].isoformat() if r[20] else None,
                    "reservation_check_out": r[21].isoformat() if r[21] else None,
                    "guest_name": r[22],
                    "plan_name": r[23],
                }
                for r in rows
            ]
            await websocket.send_json({"event": "snapshot", "rooms": rooms})
        except Exception:
            await websocket.send_json({"event": "error", "message": "Error cargando snapshot"})
        finally:
            cur.close()
            release_connection(conn)

        # Keep connection alive, handle client pings
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("action") == "ping":
                    await websocket.send_json({"event": "pong"})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        rack_manager.disconnect(websocket)