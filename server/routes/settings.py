"""
Settings routes: hotel settings CRUD, BCV rates, room types, reservation plans.
"""
import json
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, List

from db import get_connection, release_connection
from middleware.auth import get_current_user, require_permission

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingUpdate(BaseModel):
    value: str
    label: Optional[str] = None
    description: Optional[str] = None


class BatchSettingUpdate(BaseModel):
    settings: Dict[str, str]


class BcvRateCreate(BaseModel):
    rate: Decimal
    source: str = "manual"


class RoomTypeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    max_occupancy: int = 2
    default_rate_usd: Decimal = Decimal("50.00")


class RoomTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    max_occupancy: Optional[int] = None
    default_rate_usd: Optional[Decimal] = None
    is_active: Optional[bool] = None


class ReservationPlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    includes_breakfast: bool = False
    includes_all_meals: bool = False
    includes_drinks: bool = False
    rate_multiplier: Decimal = Decimal("1.00")


class ReservationPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    includes_breakfast: Optional[bool] = None
    includes_all_meals: Optional[bool] = None
    includes_drinks: Optional[bool] = None
    rate_multiplier: Optional[Decimal] = None
    is_active: Optional[bool] = None


# ── Hotel Settings ────────────────────────────────────────────────────────────

@router.get("")
async def list_settings(
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """List hotel settings, optionally filtered by category."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        if category:
            cur.execute(
                "SELECT key, value, value_type, category, label, description, updated_at "
                "FROM hotel_settings WHERE category = %s ORDER BY key",
                (category,),
            )
        else:
            cur.execute(
                "SELECT key, value, value_type, category, label, description, updated_at "
                "FROM hotel_settings ORDER BY category, key"
            )
        rows = cur.fetchall()
        settings = [
            {
                "key": r[0],
                "value": r[1],
                "value_type": r[2],
                "category": r[3],
                "label": r[4],
                "description": r[5],
                "updated_at": r[6].isoformat() if r[6] else None,
            }
            for r in rows
        ]

        if not category:
            grouped = {}
            for s in settings:
                cat = s["category"]
                if cat not in grouped:
                    grouped[cat] = []
                grouped[cat].append(s)
            return {"success": True, "settings": grouped}

        return {"success": True, "settings": settings}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener configuraciones")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/public")
async def get_public_settings():
    """Get public settings for the quote landing page (no auth required)."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT key, value FROM hotel_settings WHERE key IN ("
            "'hotel_name','hotel_address','hotel_phone','hotel_email',"
            "'hotel_logo_url','hotel_rif','hotel_timezone','hotel_category',"
            "'checkin_time','checkout_time','default_currency','igtf_rate',"
            "'iva_rate','early_checkin_surcharge','late_checkout_surcharge',"
            "'bracelet_colors','reservation_sources','payment_methods',"
            "'document_types','allow_partial_payments','max_upload_size_mb',"
            "'whatsapp_number','hotel_slogan','hotel_website'"
            ") ORDER BY key"
        )
        rows = cur.fetchall()
        settings = {r[0]: r[1] for r in rows}

        cur.execute(
            "SELECT id, name, description, max_occupancy, default_rate_usd "
            "FROM room_types WHERE is_active = TRUE ORDER BY id"
        )
        room_types = [
            {"id": r[0], "name": r[1], "description": r[2], "max_occupancy": r[3], "default_rate_usd": float(r[4])}
            for r in cur.fetchall()
        ]

        cur.execute(
            "SELECT id, name, description, includes_breakfast, includes_all_meals, includes_drinks, rate_multiplier "
            "FROM reservation_plans WHERE is_active = TRUE ORDER BY id"
        )
        plans = [
            {
                "id": r[0], "name": r[1], "description": r[2],
                "includes_breakfast": r[3], "includes_all_meals": r[4],
                "includes_drinks": r[5], "rate_multiplier": float(r[6]),
            }
            for r in cur.fetchall()
        ]

        cur.execute("SELECT rate FROM bcv_rates ORDER BY created_at DESC LIMIT 1")
        bcv_row = cur.fetchone()
        bcv_rate = float(bcv_row[0]) if bcv_row else 36.50

        return {
            "success": True,
            "settings": settings,
            "room_types": room_types,
            "plans": plans,
            "bcv_rate": bcv_rate,
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener configuraciones públicas")
    finally:
        cur.close()
        release_connection(conn)


@router.put("/batch")
async def batch_update_settings(
    data: BatchSettingUpdate,
    current_user: dict = Depends(require_permission("settings", "write")),
):
    """Batch update multiple settings at once."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        updated = 0
        for key, value in data.settings.items():
            cur.execute(
                "UPDATE hotel_settings SET value = %s, updated_at = CURRENT_TIMESTAMP WHERE key = %s",
                (value, key),
            )
            if cur.rowcount > 0:
                updated += 1
        conn.commit()

        cur.execute(
            "SELECT key, value, value_type, category, label, description, updated_at "
            "FROM hotel_settings ORDER BY category, key"
        )
        rows = cur.fetchall()
        grouped = {}
        settings_list = [
            {
                "key": r[0], "value": r[1], "value_type": r[2],
                "category": r[3], "label": r[4], "description": r[5],
                "updated_at": r[6].isoformat() if r[6] else None,
            }
            for r in rows
        ]
        for s in settings_list:
            cat = s["category"]
            if cat not in grouped:
                grouped[cat] = []
            grouped[cat].append(s)

        return {"success": True, "updated": updated, "settings": grouped}
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar configuraciones")
    finally:
        cur.close()
        release_connection(conn)


@router.put("/{key}")
async def update_setting(
    key: str,
    data: SettingUpdate,
    current_user: dict = Depends(require_permission("settings", "write")),
):
    """Update a single setting by key."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        updates, params = ["value = %s", "updated_at = CURRENT_TIMESTAMP"], [data.value]
        if data.label is not None:
            updates.append("label = %s")
            params.append(data.label)
        if data.description is not None:
            updates.append("description = %s")
            params.append(data.description)
        params.append(key)
        cur.execute(
            f"UPDATE hotel_settings SET {', '.join(updates)} WHERE key = %s", params
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Configuración no encontrada")
        conn.commit()

        cur.execute(
            "SELECT key, value, value_type, category, label, description, updated_at "
            "FROM hotel_settings WHERE key = %s",
            (key,),
        )
        r = cur.fetchone()
        return {
            "success": True,
            "setting": {
                "key": r[0], "value": r[1], "value_type": r[2],
                "category": r[3], "label": r[4], "description": r[5],
                "updated_at": r[6].isoformat() if r[6] else None,
            },
        }
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar configuración")
    finally:
        cur.close()
        release_connection(conn)


# ── BCV Rate ──────────────────────────────────────────────────────────────────

@router.get("/bcv")
async def get_bcv_rate(current_user: dict = Depends(get_current_user)):
    """Get the latest BCV exchange rate."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, rate, source, created_at FROM bcv_rates ORDER BY created_at DESC LIMIT 1"
        )
        r = cur.fetchone()
        if not r:
            return {"success": True, "rate": None}
        return {
            "success": True,
            "rate": {
                "id": r[0],
                "rate": float(r[1]),
                "source": r[2],
                "created_at": r[3].isoformat() if r[3] else None,
            },
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener tasa BCV")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/bcv")
async def create_bcv_rate(
    data: BcvRateCreate,
    current_user: dict = Depends(require_permission("financial", "write")),
):
    """Register a new BCV exchange rate."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO bcv_rates (rate, source) VALUES (%s, %s) RETURNING id, rate, source, created_at",
            (data.rate, data.source),
        )
        r = cur.fetchone()
        conn.commit()
        return {
            "success": True,
            "rate": {
                "id": r[0],
                "rate": float(r[1]),
                "source": r[2],
                "created_at": r[3].isoformat() if r[3] else None,
            },
        }
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al registrar tasa BCV")
    finally:
        cur.close()
        release_connection(conn)


# ── Room Types ────────────────────────────────────────────────────────────────

@router.get("/room-types")
async def list_room_types(current_user: dict = Depends(get_current_user)):
    """List all room types."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, name, description, max_occupancy, default_rate_usd, is_active "
            "FROM room_types ORDER BY id"
        )
        rows = cur.fetchall()
        room_types = [
            {
                "id": r[0], "name": r[1], "description": r[2],
                "max_occupancy": r[3], "default_rate_usd": float(r[4]),
                "is_active": r[5],
            }
            for r in rows
        ]
        return {"success": True, "room_types": room_types}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener tipos de habitación")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/room-types")
async def create_room_type(
    data: RoomTypeCreate,
    current_user: dict = Depends(require_permission("settings", "write")),
):
    """Create a new room type."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO room_types (name, description, max_occupancy, default_rate_usd) "
            "VALUES (%s, %s, %s, %s) RETURNING id, name, description, max_occupancy, default_rate_usd",
            (data.name, data.description, data.max_occupancy, data.default_rate_usd),
        )
        r = cur.fetchone()
        conn.commit()
        return {
            "success": True,
            "room_type": {
                "id": r[0], "name": r[1], "description": r[2],
                "max_occupancy": r[3], "default_rate_usd": float(r[4]),
            },
        }
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear tipo de habitación")
    finally:
        cur.close()
        release_connection(conn)


@router.put("/room-types/{type_id}")
async def update_room_type(
    type_id: int,
    data: RoomTypeUpdate,
    current_user: dict = Depends(require_permission("settings", "write")),
):
    """Update a room type."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        updates, params = [], []
        if data.name is not None:
            updates.append("name = %s"); params.append(data.name)
        if data.description is not None:
            updates.append("description = %s"); params.append(data.description)
        if data.max_occupancy is not None:
            updates.append("max_occupancy = %s"); params.append(data.max_occupancy)
        if data.default_rate_usd is not None:
            updates.append("default_rate_usd = %s"); params.append(data.default_rate_usd)
        if data.is_active is not None:
            updates.append("is_active = %s"); params.append(data.is_active)

        if not updates:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")

        params.append(type_id)
        cur.execute(f"UPDATE room_types SET {', '.join(updates)} WHERE id = %s", params)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Tipo de habitación no encontrado")
        conn.commit()

        cur.execute(
            "SELECT id, name, description, max_occupancy, default_rate_usd, is_active FROM room_types WHERE id = %s",
            (type_id,),
        )
        r = cur.fetchone()
        return {
            "success": True,
            "room_type": {
                "id": r[0], "name": r[1], "description": r[2],
                "max_occupancy": r[3], "default_rate_usd": float(r[4]),
                "is_active": r[5],
            },
        }
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar tipo de habitación")
    finally:
        cur.close()
        release_connection(conn)


# ── Reservation Plans ─────────────────────────────────────────────────────────

@router.get("/reservation-plans")
async def list_reservation_plans(current_user: dict = Depends(get_current_user)):
    """List all reservation plans."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, name, description, includes_breakfast, includes_all_meals, "
            "includes_drinks, rate_multiplier, is_active FROM reservation_plans ORDER BY id"
        )
        rows = cur.fetchall()
        plans = [
            {
                "id": r[0], "name": r[1], "description": r[2],
                "includes_breakfast": r[3], "includes_all_meals": r[4],
                "includes_drinks": r[5], "rate_multiplier": float(r[6]),
                "is_active": r[7],
            }
            for r in rows
        ]
        return {"success": True, "plans": plans}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener planes de reserva")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/reservation-plans")
async def create_reservation_plan(
    data: ReservationPlanCreate,
    current_user: dict = Depends(require_permission("settings", "write")),
):
    """Create a new reservation plan."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO reservation_plans (name, description, includes_breakfast, includes_all_meals, includes_drinks, rate_multiplier) "
            "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, name, rate_multiplier",
            (data.name, data.description, data.includes_breakfast, data.includes_all_meals,
             data.includes_drinks, data.rate_multiplier),
        )
        r = cur.fetchone()
        conn.commit()
        return {
            "success": True,
            "plan": {"id": r[0], "name": r[1], "rate_multiplier": float(r[2])},
        }
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear plan de reserva")
    finally:
        cur.close()
        release_connection(conn)


@router.put("/reservation-plans/{plan_id}")
async def update_reservation_plan(
    plan_id: int,
    data: ReservationPlanUpdate,
    current_user: dict = Depends(require_permission("settings", "write")),
):
    """Update a reservation plan."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        updates, params = [], []
        if data.name is not None:
            updates.append("name = %s"); params.append(data.name)
        if data.description is not None:
            updates.append("description = %s"); params.append(data.description)
        if data.includes_breakfast is not None:
            updates.append("includes_breakfast = %s"); params.append(data.includes_breakfast)
        if data.includes_all_meals is not None:
            updates.append("includes_all_meals = %s"); params.append(data.includes_all_meals)
        if data.includes_drinks is not None:
            updates.append("includes_drinks = %s"); params.append(data.includes_drinks)
        if data.rate_multiplier is not None:
            updates.append("rate_multiplier = %s"); params.append(data.rate_multiplier)
        if data.is_active is not None:
            updates.append("is_active = %s"); params.append(data.is_active)

        if not updates:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")

        params.append(plan_id)
        cur.execute(f"UPDATE reservation_plans SET {', '.join(updates)} WHERE id = %s", params)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Plan de reserva no encontrado")
        conn.commit()

        cur.execute(
            "SELECT id, name, description, includes_breakfast, includes_all_meals, "
            "includes_drinks, rate_multiplier, is_active FROM reservation_plans WHERE id = %s",
            (plan_id,),
        )
        r = cur.fetchone()
        return {
            "success": True,
            "plan": {
                "id": r[0], "name": r[1], "description": r[2],
                "includes_breakfast": r[3], "includes_all_meals": r[4],
                "includes_drinks": r[5], "rate_multiplier": float(r[6]),
                "is_active": r[7],
            },
        }
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar plan de reserva")
    finally:
        cur.close()
        release_connection(conn)