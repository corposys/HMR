"""
Reception routes: rooms rack view, guests, reservations, folios, payments,
charges, uploads, and dashboard.
"""
import os
import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from pydantic import BaseModel

from db import get_connection, release_connection
from middleware.auth import get_current_user, require_permission
from services.invoicing import InternalControlAdapter

router = APIRouter(prefix="/api/reception", tags=["reception"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "payments")
os.makedirs(UPLOAD_DIR, exist_ok=True)

IGTF_METHODS = {"cash_usd", "zelle", "bank_transfer"}


def _get_setting(cur, key: str) -> str:
    cur.execute("SELECT value FROM hotel_settings WHERE key = %s", (key,))
    row = cur.fetchone()
    return row[0] if row else None


def _get_bcv_rate(cur) -> Decimal:
    cur.execute("SELECT rate FROM bcv_rates ORDER BY created_at DESC LIMIT 1")
    row = cur.fetchone()
    return Decimal(str(row[0])) if row else Decimal("36.50")


def _get_igtf_rate(cur) -> Decimal:
    val = _get_setting(cur, "igtf_rate")
    return Decimal(val) if val else Decimal("0.03")


def _get_iva_rate(cur) -> Decimal:
    val = _get_setting(cur, "iva_rate")
    return Decimal(val) if val else Decimal("0")


def _recalculate_folio(cur, folio_id: int):
    cur.execute("SELECT reservation_id FROM folios WHERE id = %s", (folio_id,))
    row = cur.fetchone()
    if not row:
        return
    reservation_id = row[0]

    cur.execute(
        "SELECT COALESCE(SUM(subtotal_base), 0), COALESCE(SUM(tax_iva), 0) "
        "FROM room_charges WHERE reservation_id = %s",
        (reservation_id,),
    )
    charge_row = cur.fetchone()
    subtotal_base = Decimal(str(charge_row[0])) if charge_row else Decimal("0")
    tax_iva = Decimal(str(charge_row[1])) if charge_row else Decimal("0")

    cur.execute(
        "SELECT COALESCE(SUM(igtf_amount_usd), 0) FROM payments "
        "WHERE reservation_id = %s AND status = 'verified'",
        (reservation_id,),
    )
    tax_igtf = Decimal(str(cur.fetchone()[0]))

    cur.execute(
        "SELECT COALESCE(SUM(amount_usd), 0) FROM payments "
        "WHERE reservation_id = %s AND status = 'verified'",
        (reservation_id,),
    )
    total_paid = Decimal(str(cur.fetchone()[0]))

    total_amount = subtotal_base + tax_iva + tax_igtf
    balance = total_amount - total_paid

    cur.execute(
        "UPDATE folios SET subtotal_base = %s, tax_iva = %s, tax_igtf = %s, "
        "total_amount = %s, total_paid = %s, balance = %s, updated_at = CURRENT_TIMESTAMP "
        "WHERE id = %s",
        (subtotal_base, tax_iva, tax_igtf, total_amount, total_paid, balance, folio_id),
    )


def _generate_room_charges(cur, reservation_id: int, room_id: int, plan_id: Optional[int],
                            check_in: date, check_out: date, early_checkin: bool, late_checkout: bool):
    cur.execute("SELECT nightly_rate_usd FROM rooms WHERE id = %s", (room_id,))
    room_row = cur.fetchone()
    if not room_row:
        return
    nightly_rate = Decimal(str(room_row[0]))

    multiplier = Decimal("1.00")
    if plan_id:
        cur.execute("SELECT rate_multiplier FROM reservation_plans WHERE id = %s", (plan_id,))
        plan_row = cur.fetchone()
        if plan_row:
            multiplier = Decimal(str(plan_row[0]))

    unit_price = nightly_rate * multiplier
    iva_rate = _get_iva_rate(cur)
    nights = (check_out - check_in).days if check_out else 1

    if nights < 1:
        nights = 1

    checkin_surcharge = Decimal(_get_setting(cur, "early_checkin_surcharge") or "0.50")
    checkout_surcharge = Decimal(_get_setting(cur, "late_checkout_surcharge") or "0.50")

    for n in range(nights):
        night_date = check_in + timedelta(days=n)
        charge_subtotal = unit_price
        charge_iva = charge_subtotal * iva_rate
        cur.execute(
            "INSERT INTO room_charges (reservation_id, concept, quantity, unit_price_usd, total_usd, "
            "charge_type, subtotal_base, tax_iva) VALUES (%s, %s, 1, %s, %s, 'room_night', %s, %s)",
            (reservation_id, f"Noche {n+1} - {night_date.strftime('%d/%m')}", unit_price, unit_price, charge_subtotal, charge_iva),
        )

    if early_checkin:
        surcharge = nightly_rate * checkin_surcharge
        subtotal = surcharge
        tax = subtotal * iva_rate
        cur.execute(
            "INSERT INTO room_charges (reservation_id, concept, quantity, unit_price_usd, total_usd, "
            "charge_type, subtotal_base, tax_iva) VALUES (%s, %s, 1, %s, %s, 'early_checkin', %s, %s)",
            (reservation_id, "Early Check-in", surcharge, surcharge, subtotal, tax),
        )

    if late_checkout:
        surcharge = nightly_rate * checkout_surcharge
        subtotal = surcharge
        tax = subtotal * iva_rate
        cur.execute(
            "INSERT INTO room_charges (reservation_id, concept, quantity, unit_price_usd, total_usd, "
            "charge_type, subtotal_base, tax_iva) VALUES (%s, %s, 1, %s, %s, 'late_checkout', %s, %s)",
            (reservation_id, "Late Checkout", surcharge, surcharge, subtotal, tax),
        )


# ── Pydantic Models ────────────────────────────────────────────────────────────

class RoomUpdateReception(BaseModel):
    housekeeping_status: Optional[Literal["clean", "dirty", "maintenance", "inspection"]] = None
    is_blocked: Optional[bool] = None
    blocked_reason: Optional[str] = None
    blocked_until: Optional[str] = None
    photo_url: Optional[str] = None


class GuestCreate(BaseModel):
    full_name: str
    id_document_type: str = "V"
    id_document_number: str
    phone: str
    email: Optional[str] = None
    nationality: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    fiscal_name: Optional[str] = None
    fiscal_id: Optional[str] = None
    fiscal_address: Optional[str] = None


class GuestUpdate(BaseModel):
    full_name: Optional[str] = None
    id_document_type: Optional[str] = None
    id_document_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    nationality: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    fiscal_name: Optional[str] = None
    fiscal_id: Optional[str] = None
    fiscal_address: Optional[str] = None


class ReservationCreate(BaseModel):
    guest_id: int
    room_id: int
    plan_id: Optional[int] = None
    check_in_date: str
    check_out_date: Optional[str] = None
    num_guests: int = 1
    source: str = "walk_in"
    bracelet_color: Optional[str] = None
    early_checkin: bool = False
    late_checkout: bool = False
    notes: Optional[str] = None


class ReservationUpdate(BaseModel):
    plan_id: Optional[int] = None
    check_in_date: Optional[str] = None
    check_out_date: Optional[str] = None
    num_guests: Optional[int] = None
    bracelet_color: Optional[str] = None
    early_checkin: Optional[bool] = None
    late_checkout: Optional[bool] = None
    notes: Optional[str] = None
    status: Optional[Literal["reserved", "cancelled"]] = None


class PaymentCreate(BaseModel):
    reservation_id: int
    amount_usd: Decimal
    payment_method: Literal["cash_usd", "cash_ves", "zelle", "pago_movil", "credit_card", "bank_transfer"]
    reference_number: Optional[str] = None
    screenshot_url: Optional[str] = None
    notes: Optional[str] = None


class PaymentVerify(BaseModel):
    status: Literal["verified", "rejected"]
    notes: Optional[str] = None


class ChargeCreate(BaseModel):
    reservation_id: int
    concept: str
    quantity: int = 1
    unit_price_usd: Decimal
    charge_type: Literal["room_night", "early_checkin", "late_checkout", "extra"] = "extra"


class FolioCreate(BaseModel):
    reservation_id: int
    fiscal_name: Optional[str] = None
    fiscal_id: Optional[str] = None
    fiscal_address: Optional[str] = None


class FolioUpdate(BaseModel):
    fiscal_name: Optional[str] = None
    fiscal_id: Optional[str] = None
    fiscal_address: Optional[str] = None
    profit_plus_ref: Optional[str] = None
    status: Optional[Literal["open", "closed", "cancelled"]] = None


# ── Rooms (Rack View) ──────────────────────────────────────────────────────────

@router.get("/rooms")
async def list_rooms_rack(
    module_id: Optional[int] = None,
    status: Optional[str] = None,
    housekeeping_status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Rack view: all rooms with type, rate, occupancy, and active reservation info."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT r.id, r.room_number, r.status, r.category, r.housekeeping_status,
                   r.is_blocked, r.blocked_reason, r.blocked_until, r.photo_url,
                   rt.id, rt.name, rt.max_occupancy, rt.default_rate_usd,
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
                "photo_url": r[8],
                "room_type_id": r[9], "room_type_name": r[10],
                "max_occupancy": r[11], "default_rate_usd": float(r[12]) if r[12] else None,
                "nightly_rate_usd": float(r[13]),
                "floor_id": r[14], "floor_code": r[15], "floor_name": r[16],
                "module_id": r[17], "module_number": r[18], "module_name": r[19],
                "active_reservation_id": r[20],
                "reservation_status": r[21],
                "reservation_check_in": r[22].isoformat() if r[22] else None,
                "reservation_check_out": r[23].isoformat() if r[23] else None,
                "guest_name": r[24],
                "plan_name": r[25],
            }
            for r in rows
        ]
        return {"success": True, "rooms": rooms}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener habitaciones")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/rooms/{room_id}")
async def get_room_detail(room_id: int, current_user: dict = Depends(get_current_user)):
    """Room detail with active reservation, folio summary, and housekeeping info."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT r.id, r.room_number, r.status, r.category, r.housekeeping_status,
                   r.is_blocked, r.blocked_reason, r.blocked_until, r.photo_url,
                   r.nightly_rate_usd, r.last_battery_change,
                   rt.id, rt.name, rt.max_occupancy, rt.default_rate_usd,
                   f.id, f.code, f.name,
                   m.id, m.number, m.name
            FROM rooms r
            JOIN floors f ON r.floor_id = f.id
            JOIN modules m ON f.module_id = m.id
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            WHERE r.id = %s
        """, (room_id,))
        r = cur.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Habitación no encontrada")

        room_data = {
            "id": r[0], "room_number": r[1], "status": r[2], "category": r[3],
            "housekeeping_status": r[4], "is_blocked": r[5],
            "blocked_reason": r[6],
            "blocked_until": r[7].isoformat() if r[7] else None,
            "photo_url": r[8],
            "nightly_rate_usd": float(r[9]),
            "last_battery_change": r[10].isoformat() if r[10] else None,
            "room_type_id": r[11], "room_type_name": r[12],
            "max_occupancy": r[13], "default_rate_usd": float(r[14]) if r[14] else None,
            "floor_id": r[15], "floor_code": r[16], "floor_name": r[17],
            "module_id": r[18], "module_number": r[19], "module_name": r[20],
        }

        cur.execute("""
            SELECT res.id, res.status, res.check_in_date, res.check_out_date,
                   res.num_guests, res.source, res.bracelet_color, res.early_checkin,
                   res.late_checkout, res.notes, res.created_at,
                   g.id, g.full_name, g.id_document_type, g.id_document_number, g.phone,
                   rp.id, rp.name, rp.rate_multiplier,
                   fol.id, fol.control_number, fol.status, fol.total_amount, fol.balance
            FROM reservations res
            JOIN guests g ON res.guest_id = g.id
            LEFT JOIN reservation_plans rp ON res.plan_id = rp.id
            LEFT JOIN folios fol ON fol.reservation_id = res.id
            WHERE res.room_id = %s AND res.status IN ('reserved', 'checked_in')
            ORDER BY res.check_in_date DESC LIMIT 1
        """, (room_id,))
        res_row = cur.fetchone()

        reservation = None
        if res_row:
            reservation = {
                "id": res_row[0], "status": res_row[1],
                "check_in_date": res_row[2].isoformat() if res_row[2] else None,
                "check_out_date": res_row[3].isoformat() if res_row[3] else None,
                "num_guests": res_row[4], "source": res_row[5],
                "bracelet_color": res_row[6], "early_checkin": res_row[7],
                "late_checkout": res_row[8], "notes": res_row[9],
                "created_at": res_row[10].isoformat() if res_row[10] else None,
                "guest_id": res_row[11], "guest_name": res_row[12],
                "guest_document_type": res_row[13], "guest_document_number": res_row[14],
                "guest_phone": res_row[15],
                "plan_id": res_row[16], "plan_name": res_row[17],
                "plan_multiplier": float(res_row[18]) if res_row[18] else 1.0,
                "folio_id": res_row[19], "control_number": res_row[20],
                "folio_status": res_row[21],
                "folio_total": float(res_row[22]) if res_row[22] else 0,
                "folio_balance": float(res_row[23]) if res_row[23] else 0,
            }

        return {"success": True, "room": room_data, "reservation": reservation}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener habitación")
    finally:
        cur.close()
        release_connection(conn)


@router.patch("/rooms/{room_id}")
async def update_room_reception(
    room_id: int,
    data: RoomUpdateReception,
    current_user: dict = Depends(require_permission("rooms", "write")),
):
    """Update room housekeeping status or block/unblock."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        updates, params = [], []
        if data.housekeeping_status is not None:
            updates.append("housekeeping_status = %s"); params.append(data.housekeeping_status)
        if data.is_blocked is not None:
            updates.append("is_blocked = %s"); params.append(data.is_blocked)
            if not data.is_blocked:
                updates.append("blocked_reason = NULL")
                updates.append("blocked_until = NULL")
        if data.blocked_reason is not None:
            updates.append("blocked_reason = %s"); params.append(data.blocked_reason)
        if data.blocked_until is not None:
            updates.append("blocked_until = %s"); params.append(data.blocked_until if data.blocked_until else None)
        if data.photo_url is not None:
            updates.append("photo_url = %s"); params.append(data.photo_url)

        if not updates:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")

        params.append(room_id)
        cur.execute(f"UPDATE rooms SET {', '.join(updates)} WHERE id = %s", params)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Habitación no encontrada")
        conn.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar habitación")
    finally:
        cur.close()
        release_connection(conn)


# ── Guests ─────────────────────────────────────────────────────────────────────

@router.get("/guests")
async def list_guests(
    q: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    current_user: dict = Depends(require_permission("guests", "read")),
):
    """Search/list guests with pagination."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = "SELECT id, full_name, id_document_type, id_document_number, phone, email, is_active, created_at FROM guests WHERE 1=1"
        params = []
        if q:
            query += " AND (full_name ILIKE %s OR id_document_number ILIKE %s OR phone ILIKE %s)"
            term = f"%{q}%"
            params.extend([term, term, term])

        query += " ORDER BY full_name LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        cur.execute(query, params)
        rows = cur.fetchall()

        cur.execute("SELECT COUNT(*) FROM guests WHERE 1=1" + (" AND (full_name ILIKE %s OR id_document_number ILIKE %s OR phone ILIKE %s)" if q else ""), params[:3] if q else [])
        total = cur.fetchone()[0]

        guests = [
            {
                "id": r[0], "full_name": r[1], "id_document_type": r[2],
                "id_document_number": r[3], "phone": r[4], "email": r[5],
                "is_active": r[6], "created_at": r[7].isoformat() if r[7] else None,
            }
            for r in rows
        ]
        return {"success": True, "guests": guests, "total": total}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener huéspedes")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/guests")
async def create_guest(
    data: GuestCreate,
    current_user: dict = Depends(require_permission("guests", "write")),
):
    """Create a new guest. Walk-in express requires only name, document, and phone."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id FROM guests WHERE id_document_type = %s AND id_document_number = %s",
            (data.id_document_type, data.id_document_number),
        )
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Ya existe un huésped con este documento de identidad")

        cur.execute(
            "INSERT INTO guests (full_name, id_document_type, id_document_number, phone, email, "
            "nationality, address, notes, fiscal_name, fiscal_id, fiscal_address) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "RETURNING id, full_name, id_document_type, id_document_number, phone, email, is_active, created_at",
            (data.full_name, data.id_document_type, data.id_document_number, data.phone, data.email,
             data.nationality, data.address, data.notes, data.fiscal_name, data.fiscal_id, data.fiscal_address),
        )
        r = cur.fetchone()
        conn.commit()
        return {
            "success": True,
            "guest": {
                "id": r[0], "full_name": r[1], "id_document_type": r[2],
                "id_document_number": r[3], "phone": r[4], "email": r[5],
                "is_active": r[6], "created_at": r[7].isoformat() if r[7] else None,
            },
        }
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear huésped")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/guests/{guest_id}")
async def get_guest(guest_id: int, current_user: dict = Depends(require_permission("guests", "read"))):
    """Get guest detail with reservation count."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, full_name, id_document_type, id_document_number, nationality, phone, email, "
            "address, notes, fiscal_name, fiscal_id, fiscal_address, is_active, created_at, updated_at "
            "FROM guests WHERE id = %s",
            (guest_id,),
        )
        r = cur.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Huésped no encontrado")

        cur.execute(
            "SELECT COUNT(*) FROM reservations WHERE guest_id = %s", (guest_id,)
        )
        res_count = cur.fetchone()[0]

        return {
            "success": True,
            "guest": {
                "id": r[0], "full_name": r[1], "id_document_type": r[2],
                "id_document_number": r[3], "nationality": r[4], "phone": r[5],
                "email": r[6], "address": r[7], "notes": r[8],
                "fiscal_name": r[9], "fiscal_id": r[10], "fiscal_address": r[11],
                "is_active": r[12],
                "created_at": r[13].isoformat() if r[13] else None,
                "updated_at": r[14].isoformat() if r[14] else None,
                "reservation_count": res_count,
            },
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener huésped")
    finally:
        cur.close()
        release_connection(conn)


@router.put("/guests/{guest_id}")
async def update_guest(
    guest_id: int,
    data: GuestUpdate,
    current_user: dict = Depends(require_permission("guests", "write")),
):
    """Update guest information."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM guests WHERE id = %s", (guest_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Huésped no encontrado")

        if data.id_document_type is not None and data.id_document_number is not None:
            cur.execute(
                "SELECT id FROM guests WHERE id_document_type = %s AND id_document_number = %s AND id != %s",
                (data.id_document_type, data.id_document_number, guest_id),
            )
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="Ya existe un huésped con este documento de identidad")

        updates, params = [], []
        fields = [
            ("full_name", data.full_name), ("id_document_type", data.id_document_type),
            ("id_document_number", data.id_document_number), ("phone", data.phone),
            ("email", data.email), ("nationality", data.nationality),
            ("address", data.address), ("notes", data.notes),
            ("fiscal_name", data.fiscal_name), ("fiscal_id", data.fiscal_id),
            ("fiscal_address", data.fiscal_address),
        ]
        for col, val in fields:
            if val is not None:
                updates.append(f"{col} = %s"); params.append(val)

        if not updates:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")

        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(guest_id)
        cur.execute(f"UPDATE guests SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar huésped")
    finally:
        cur.close()
        release_connection(conn)


# ── Reservations ───────────────────────────────────────────────────────────────

@router.get("/reservations")
async def list_reservations(
    status: Optional[str] = None,
    room_id: Optional[int] = None,
    guest_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    current_user: dict = Depends(require_permission("reception", "read")),
):
    """List reservations with filters."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT res.id, res.status, res.check_in_date, res.check_out_date,
                   res.num_guests, res.source, res.bracelet_color, res.early_checkin,
                   res.late_checkout, res.notes, res.created_at,
                   g.id, g.full_name, g.id_document_number, g.phone,
                   r.id, r.room_number, rt.name,
                   rp.id, rp.name, rp.rate_multiplier,
                   fol.id, fol.control_number, fol.total_amount, fol.balance
            FROM reservations res
            JOIN guests g ON res.guest_id = g.id
            JOIN rooms r ON res.room_id = r.id
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            LEFT JOIN reservation_plans rp ON res.plan_id = rp.id
            LEFT JOIN folios fol ON fol.reservation_id = res.id
            WHERE 1=1
        """
        params = []
        if status:
            query += " AND res.status = %s"; params.append(status)
        if room_id:
            query += " AND res.room_id = %s"; params.append(room_id)
        if guest_id:
            query += " AND res.guest_id = %s"; params.append(guest_id)
        if date_from:
            query += " AND res.check_in_date >= %s"; params.append(date_from)
        if date_to:
            query += " AND res.check_out_date <= %s"; params.append(date_to)
        query += " ORDER BY res.check_in_date DESC, res.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cur.execute(query, params)
        rows = cur.fetchall()
        reservations = [
            {
                "id": r[0], "status": r[1],
                "check_in_date": r[2].isoformat() if r[2] else None,
                "check_out_date": r[3].isoformat() if r[3] else None,
                "num_guests": r[4], "source": r[5], "bracelet_color": r[6],
                "early_checkin": r[7], "late_checkout": r[8], "notes": r[9],
                "created_at": r[10].isoformat() if r[10] else None,
                "guest_id": r[11], "guest_name": r[12],
                "guest_document": r[13], "guest_phone": r[14],
                "room_id": r[15], "room_number": r[16], "room_type_name": r[17],
                "plan_id": r[18], "plan_name": r[19],
                "plan_multiplier": float(r[20]) if r[20] else 1.0,
                "folio_id": r[21], "control_number": r[22],
                "folio_total": float(r[23]) if r[23] else 0,
                "folio_balance": float(r[24]) if r[24] else 0,
            }
            for r in rows
        ]
        return {"success": True, "reservations": reservations}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener reservas")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/reservations")
async def create_reservation(
    data: ReservationCreate,
    current_user: dict = Depends(require_permission("reception", "write")),
):
    """Create a new reservation. Validates room availability."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        check_in = date.fromisoformat(data.check_in_date)
        check_out = date.fromisoformat(data.check_out_date) if data.check_out_date else check_in + timedelta(days=1)
        if check_out <= check_in:
            raise HTTPException(status_code=400, detail="La fecha de salida debe ser posterior a la de entrada")

        cur.execute(
            "SELECT id FROM reservations WHERE room_id = %s AND status IN ('reserved','checked_in') "
            "AND NOT (check_out_date <= %s OR check_in_date >= %s)",
            (data.room_id, check_in, check_out),
        )
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="La habitación no está disponible para esas fechas")

        cur.execute("SELECT id FROM guests WHERE id = %s", (data.guest_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Huésped no encontrado")

        cur.execute("SELECT id, nightly_rate_usd FROM rooms WHERE id = %s", (data.room_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Habitación no encontrada")

        import secrets
        quote_token = secrets.token_urlsafe(32)

        cur.execute(
            "INSERT INTO reservations (quote_token, guest_id, room_id, plan_id, check_in_date, check_out_date, "
            "num_guests, source, bracelet_color, early_checkin, late_checkout, notes, created_by) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "RETURNING id, status, created_at",
            (quote_token, data.guest_id, data.room_id, data.plan_id, check_in, check_out,
             data.num_guests, data.source, data.bracelet_color, data.early_checkin,
             data.late_checkout, data.notes, current_user["id"]),
        )
        row = cur.fetchone()
        reservation_id = row[0]

        folio = None
        if data.source != "walk_in" or data.early_checkin or data.late_checkout:
            pass  # folio created on check-in

        conn.commit()

        cur.execute(
            "SELECT res.id, res.status, res.check_in_date, res.check_out_date, res.quote_token "
            "FROM reservations res WHERE res.id = %s",
            (reservation_id,),
        )
        r = cur.fetchone()
        return {
            "success": True,
            "reservation": {
                "id": r[0], "status": r[1],
                "check_in_date": r[2].isoformat() if r[2] else None,
                "check_out_date": r[3].isoformat() if r[3] else None,
                "quote_token": r[4],
            },
        }
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear reserva")
    finally:
        cur.close()
        release_connection(conn)


@router.get("/reservations/{reservation_id}")
async def get_reservation(reservation_id: int, current_user: dict = Depends(get_current_user)):
    """Full reservation detail with guest, room, folio, payments, and charges."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT res.id, res.quote_token, res.status, res.check_in_date, res.check_out_date,
                   res.num_guests, res.source, res.bracelet_color, res.early_checkin,
                   res.late_checkout, res.notes, res.created_at, res.updated_at,
                   g.id, g.full_name, g.id_document_type, g.id_document_number,
                   g.phone, g.email, g.nationality,
                   g.fiscal_name, g.fiscal_id, g.fiscal_address,
                   r.id, r.room_number, r.nightly_rate_usd,
                   rt.id, rt.name, rt.max_occupancy,
                   rp.id, rp.name, rp.rate_multiplier,
                   fol.id, fol.control_number, fol.status, fol.subtotal_base, fol.tax_iva,
                   fol.tax_igtf, fol.total_amount, fol.total_paid, fol.balance,
                   fol.profit_plus_ref, fol.fiscal_receipt_number, fol.fiscal_machine_serial
            FROM reservations res
            JOIN guests g ON res.guest_id = g.id
            JOIN rooms r ON res.room_id = r.id
            LEFT JOIN room_types rt ON r.room_type_id = rt.id
            LEFT JOIN reservation_plans rp ON res.plan_id = rp.id
            LEFT JOIN folios fol ON fol.reservation_id = res.id
            WHERE res.id = %s
        """, (reservation_id,))
        r = cur.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")

        folio_data = None
        if r[32]:
            folio_data = {
                "id": r[32], "control_number": r[33], "status": r[34],
                "subtotal_base": float(r[35]), "tax_iva": float(r[36]),
                "tax_igtf": float(r[37]), "total_amount": float(r[38]),
                "total_paid": float(r[39]), "balance": float(r[40]),
                "profit_plus_ref": r[41], "fiscal_receipt_number": r[42],
                "fiscal_machine_serial": r[43],
            }

        cur.execute(
            "SELECT id, amount_usd, currency, amount_ves, exchange_rate, payment_method, "
            "reference_number, screenshot_url, igtf_applied, igtf_amount_usd, subtotal_base, "
            "tax_iva, status, verified_by, verified_at, notes, created_by, created_at "
            "FROM payments WHERE reservation_id = %s ORDER BY created_at",
            (reservation_id,),
        )
        payments = [
            {
                "id": p[0], "amount_usd": float(p[1]), "currency": p[2],
                "amount_ves": float(p[3]) if p[3] else None,
                "exchange_rate": float(p[4]) if p[4] else None,
                "payment_method": p[5], "reference_number": p[6],
                "screenshot_url": p[7], "igtf_applied": p[8],
                "igtf_amount_usd": float(p[9]) if p[9] else 0,
                "subtotal_base": float(p[10]) if p[10] else 0,
                "tax_iva": float(p[11]) if p[11] else 0,
                "status": p[12], "verified_by": p[13],
                "verified_at": p[14].isoformat() if p[14] else None,
                "notes": p[15], "created_by": p[16],
                "created_at": p[17].isoformat() if p[17] else None,
            }
            for p in cur.fetchall()
        ]

        cur.execute(
            "SELECT id, concept, quantity, unit_price_usd, total_usd, charge_type, "
            "subtotal_base, tax_iva, created_at FROM room_charges WHERE reservation_id = %s ORDER BY created_at",
            (reservation_id,),
        )
        charges = [
            {
                "id": c[0], "concept": c[1], "quantity": c[2],
                "unit_price_usd": float(c[3]), "total_usd": float(c[4]),
                "charge_type": c[5], "subtotal_base": float(c[6]),
                "tax_iva": float(c[7]),
                "created_at": c[8].isoformat() if c[8] else None,
            }
            for c in cur.fetchall()
        ]

        return {
            "success": True,
            "reservation": {
                "id": r[0], "quote_token": r[1], "status": r[2],
                "check_in_date": r[3].isoformat() if r[3] else None,
                "check_out_date": r[4].isoformat() if r[4] else None,
                "num_guests": r[5], "source": r[6], "bracelet_color": r[7],
                "early_checkin": r[8], "late_checkout": r[9], "notes": r[10],
                "created_at": r[11].isoformat() if r[11] else None,
                "updated_at": r[12].isoformat() if r[12] else None,
                "guest_id": r[13], "guest_name": r[14],
                "guest_document_type": r[15], "guest_document_number": r[16],
                "guest_phone": r[17], "guest_email": r[18],
                "guest_nationality": r[19],
                "guest_fiscal_name": r[20], "guest_fiscal_id": r[21],
                "guest_fiscal_address": r[22],
                "room_id": r[23], "room_number": r[24],
                "nightly_rate_usd": float(r[25]),
                "room_type_id": r[26], "room_type_name": r[27],
                "max_occupancy": r[28],
                "plan_id": r[29], "plan_name": r[30],
                "plan_multiplier": float(r[31]) if r[31] else 1.0,
            },
            "folio": folio_data,
            "payments": payments,
            "charges": charges,
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener reserva")
    finally:
        cur.close()
        release_connection(conn)


@router.patch("/reservations/{reservation_id}")
async def update_reservation(
    reservation_id: int,
    data: ReservationUpdate,
    current_user: dict = Depends(require_permission("reception", "write")),
):
    """Update reservation details. Use status='cancelled' to cancel."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT status FROM reservations WHERE id = %s", (reservation_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Reserva no encontrada")

        updates, params = [], []
        if data.plan_id is not None:
            updates.append("plan_id = %s"); params.append(data.plan_id)
        if data.check_in_date is not None:
            updates.append("check_in_date = %s"); params.append(data.check_in_date)
        if data.check_out_date is not None:
            updates.append("check_out_date = %s"); params.append(data.check_out_date)
        if data.num_guests is not None:
            updates.append("num_guests = %s"); params.append(data.num_guests)
        if data.bracelet_color is not None:
            updates.append("bracelet_color = %s"); params.append(data.bracelet_color)
        if data.early_checkin is not None:
            updates.append("early_checkin = %s"); params.append(data.early_checkin)
        if data.late_checkout is not None:
            updates.append("late_checkout = %s"); params.append(data.late_checkout)
        if data.notes is not None:
            updates.append("notes = %s"); params.append(data.notes)
        if data.status is not None:
            if data.status == "cancelled":
                updates.append("status = 'cancelled'")
            else:
                updates.append("status = %s"); params.append(data.status)

        if not updates:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")

        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(reservation_id)
        cur.execute(f"UPDATE reservations SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar reserva")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/reservations/{reservation_id}/checkin")
async def checkin_reservation(
    reservation_id: int,
    current_user: dict = Depends(require_permission("reception", "write")),
):
    """Check in a reservation. Creates folio and room charges."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT res.id, res.status, res.guest_id, res.room_id, res.plan_id, "
            "res.check_in_date, res.check_out_date, res.early_checkin, res.late_checkout, "
            "r.nightly_rate_usd FROM reservations res "
            "JOIN rooms r ON res.room_id = r.id "
            "WHERE res.id = %s", (reservation_id,),
        )
        r = cur.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")
        if r[1] != "reserved":
            raise HTTPException(status_code=400, detail="La reserva debe estar en estado 'reserved' para hacer check-in")

        guest_id, room_id, plan_id = r[2], r[3], r[4]
        check_in, check_out = r[5], r[6]
        early, late = r[7], r[8]
        nightly_rate = Decimal(str(r[9]))

        cur.execute("SELECT id FROM folios WHERE reservation_id = %s", (reservation_id,))
        folio_row = cur.fetchone()

        if not folio_row:
            control_number = InternalControlAdapter.generate_control_number()
            cur.execute(
                "SELECT fiscal_name, fiscal_id, fiscal_address FROM guests WHERE id = %s",
                (guest_id,),
            )
            guest_row = cur.fetchone()
            fiscal_name = guest_row[0] if guest_row and guest_row[0] else None
            fiscal_id = guest_row[1] if guest_row and guest_row[1] else None
            fiscal_address = guest_row[2] if guest_row and guest_row[2] else None

            cur.execute(
                "INSERT INTO folios (reservation_id, control_number, fiscal_name, fiscal_id, fiscal_address) "
                "VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (reservation_id, control_number, fiscal_name, fiscal_id, fiscal_address),
            )
            folio_id = cur.fetchone()[0]
        else:
            folio_id = folio_row[0]

        cur.execute(
            "SELECT COUNT(*) FROM room_charges WHERE reservation_id = %s AND charge_type = 'room_night'",
            (reservation_id,),
        )
        if cur.fetchone()[0] == 0:
            _generate_room_charges(cur, reservation_id, room_id, plan_id, check_in, check_out, early, late)

        _recalculate_folio(cur, folio_id)

        cur.execute(
            "UPDATE reservations SET status = 'checked_in', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (reservation_id,),
        )
        conn.commit()
        return {"success": True, "folio_id": folio_id}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al hacer check-in")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/reservations/{reservation_id}/checkout")
async def checkout_reservation(
    reservation_id: int,
    current_user: dict = Depends(require_permission("reception", "write")),
):
    """Check out a reservation. Closes the folio."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT status FROM reservations WHERE id = %s", (reservation_id,))
        r = cur.fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")
        if r[0] != "checked_in":
            raise HTTPException(status_code=400, detail="La reserva debe estar en estado 'checked_in' para hacer checkout")

        cur.execute("SELECT id FROM folios WHERE reservation_id = %s", (reservation_id,))
        folio_row = cur.fetchone()
        if folio_row:
            _recalculate_folio(cur, folio_row[0])
            cur.execute(
                "UPDATE folios SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE id = %s",
                (folio_row[0],),
            )

        cur.execute(
            "UPDATE reservations SET status = 'checked_out', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (reservation_id,),
        )
        conn.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al hacer checkout")
    finally:
        cur.close()
        release_connection(conn)


# ── Folios ─────────────────────────────────────────────────────────────────────

@router.get("/folios/{reservation_id}")
async def get_folio(reservation_id: int, current_user: dict = Depends(get_current_user)):
    """Get folio with all financial details for a reservation."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, control_number, status, subtotal_base, tax_iva, tax_igtf, "
            "total_amount, total_paid, balance, fiscal_name, fiscal_id, fiscal_address, "
            "profit_plus_ref, fiscal_receipt_number, fiscal_machine_serial, "
            "closed_at, created_at, updated_at "
            "FROM folios WHERE reservation_id = %s",
            (reservation_id,),
        )
        r = cur.fetchone()
        if not r:
            return {"success": True, "folio": None}
        return {
            "success": True,
            "folio": {
                "id": r[0], "control_number": r[1], "status": r[2],
                "subtotal_base": float(r[3]), "tax_iva": float(r[4]),
                "tax_igtf": float(r[5]), "total_amount": float(r[6]),
                "total_paid": float(r[7]), "balance": float(r[8]),
                "fiscal_name": r[9], "fiscal_id": r[10], "fiscal_address": r[11],
                "profit_plus_ref": r[12], "fiscal_receipt_number": r[13],
                "fiscal_machine_serial": r[14],
                "closed_at": r[15].isoformat() if r[15] else None,
                "created_at": r[16].isoformat() if r[16] else None,
                "updated_at": r[17].isoformat() if r[17] else None,
            },
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener folio")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/folios")
async def create_folio(
    data: FolioCreate,
    current_user: dict = Depends(require_permission("reception", "write")),
):
    """Manually create a folio (usually auto-created on check-in)."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id FROM folios WHERE reservation_id = %s",
            (data.reservation_id,),
        )
        if cur.fetchone():
            raise HTTPException(status_code=409, detail="Ya existe un folio para esta reserva")

        control_number = InternalControlAdapter.generate_control_number()
        cur.execute(
            "INSERT INTO folios (reservation_id, control_number, fiscal_name, fiscal_id, fiscal_address) "
            "VALUES (%s, %s, %s, %s, %s) RETURNING id, control_number, status",
            (data.reservation_id, control_number, data.fiscal_name, data.fiscal_id, data.fiscal_address),
        )
        row = cur.fetchone()
        conn.commit()
        return {
            "success": True,
            "folio": {"id": row[0], "control_number": row[1], "status": row[2]},
        }
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear folio")
    finally:
        cur.close()
        release_connection(conn)


@router.patch("/folios/{folio_id}")
async def update_folio(
    folio_id: int,
    data: FolioUpdate,
    current_user: dict = Depends(require_permission("reception", "close_folio")),
):
    """Update folio fiscal info or close it."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT status FROM folios WHERE id = %s", (folio_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Folio no encontrado")
        if row[0] == "closed":
            raise HTTPException(status_code=400, detail="El folio ya está cerrado")

        updates, params = [], []
        if data.fiscal_name is not None:
            updates.append("fiscal_name = %s"); params.append(data.fiscal_name)
        if data.fiscal_id is not None:
            updates.append("fiscal_id = %s"); params.append(data.fiscal_id)
        if data.fiscal_address is not None:
            updates.append("fiscal_address = %s"); params.append(data.fiscal_address)
        if data.profit_plus_ref is not None:
            updates.append("profit_plus_ref = %s"); params.append(data.profit_plus_ref)
        if data.status is not None:
            updates.append("status = %s"); params.append(data.status)
            if data.status == "closed":
                updates.append("closed_at = CURRENT_TIMESTAMP")

        if not updates:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")

        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(folio_id)
        cur.execute(f"UPDATE folios SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar folio")
    finally:
        cur.close()
        release_connection(conn)


# ── Payments ───────────────────────────────────────────────────────────────────

@router.get("/payments")
async def list_payments(
    reservation_id: Optional[int] = None,
    status: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
):
    """List payments with optional filters."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT p.id, p.reservation_id, p.amount_usd, p.currency, p.amount_ves,
                   p.exchange_rate, p.payment_method, p.reference_number, p.screenshot_url,
                   p.igtf_applied, p.igtf_amount_usd, p.subtotal_base, p.tax_iva,
                   p.status, p.verified_by, p.verified_at, p.notes, p.created_by, p.created_at
            FROM payments p WHERE 1=1
        """
        params = []
        if reservation_id:
            query += " AND p.reservation_id = %s"; params.append(reservation_id)
        if status:
            query += " AND p.status = %s"; params.append(status)
        query += " ORDER BY p.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cur.execute(query, params)
        rows = cur.fetchall()
        payments = [
            {
                "id": p[0], "reservation_id": p[1], "amount_usd": float(p[2]),
                "currency": p[3],
                "amount_ves": float(p[4]) if p[4] else None,
                "exchange_rate": float(p[5]) if p[5] else None,
                "payment_method": p[6], "reference_number": p[7],
                "screenshot_url": p[8], "igtf_applied": p[9],
                "igtf_amount_usd": float(p[10]) if p[10] else 0,
                "subtotal_base": float(p[11]) if p[11] else 0,
                "tax_iva": float(p[12]) if p[12] else 0,
                "status": p[13], "verified_by": p[14],
                "verified_at": p[15].isoformat() if p[15] else None,
                "notes": p[16], "created_by": p[17],
                "created_at": p[18].isoformat() if p[18] else None,
            }
            for p in rows
        ]
        return {"success": True, "payments": payments}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener pagos")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/payments")
async def create_payment(
    data: PaymentCreate,
    current_user: dict = Depends(require_permission("reception", "write")),
):
    """Register a payment. IGTF is auto-calculated based on payment method."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM reservations WHERE id = %s", (data.reservation_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Reserva no encontrada")

        igtf_rate = _get_igtf_rate(cur)
        iva_rate = _get_iva_rate(cur)

        amount_usd = Decimal(str(data.amount_usd))
        igtf_applied = data.payment_method in IGTF_METHODS
        igtf_amount = (amount_usd * igtf_rate).quantize(Decimal("0.01")) if igtf_applied else Decimal("0")
        subtotal_base = amount_usd
        tax_iva = (subtotal_base * iva_rate).quantize(Decimal("0.01"))
        total_amount_usd = subtotal_base + tax_iva + igtf_amount

        amount_ves = None
        exchange_rate = None
        if data.payment_method == "cash_ves":
            bcv_rate = _get_bcv_rate(cur)
            exchange_rate = bcv_rate
            amount_ves = (total_amount_usd * bcv_rate).quantize(Decimal("0.01"))

        cur.execute(
            "INSERT INTO payments (reservation_id, amount_usd, currency, exchange_rate, amount_ves, "
            "igtf_applied, igtf_amount_usd, subtotal_base, tax_iva, payment_method, "
            "reference_number, screenshot_url, notes, created_by) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "RETURNING id, status, created_at",
            (data.reservation_id, total_amount_usd, "USD", exchange_rate, amount_ves,
             igtf_applied, igtf_amount, subtotal_base, tax_iva, data.payment_method,
             data.reference_number, data.screenshot_url, data.notes, current_user["id"]),
        )
        row = cur.fetchone()
        payment_id = row[0]

        cur.execute("SELECT id FROM folios WHERE reservation_id = %s", (data.reservation_id,))
        folio_row = cur.fetchone()
        if folio_row:
            _recalculate_folio(cur, folio_row[0])

        conn.commit()
        return {
            "success": True,
            "payment": {
                "id": payment_id, "status": row[1],
                "amount_usd": float(total_amount_usd),
                "subtotal_base": float(subtotal_base),
                "tax_iva": float(tax_iva),
                "igtf_applied": igtf_applied,
                "igtf_amount_usd": float(igtf_amount),
                "exchange_rate": float(exchange_rate) if exchange_rate else None,
                "amount_ves": float(amount_ves) if amount_ves else None,
                "created_at": row[2].isoformat() if row[2] else None,
            },
        }
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al registrar pago")
    finally:
        cur.close()
        release_connection(conn)


@router.patch("/payments/{payment_id}/verify")
async def verify_payment(
    payment_id: int,
    data: PaymentVerify,
    current_user: dict = Depends(require_permission("reception", "verify_payment")),
):
    """Verify or reject a payment. Recalculates folio on verification."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, reservation_id, status FROM payments WHERE id = %s", (payment_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Pago no encontrado")
        if row[2] != "pending":
            raise HTTPException(status_code=400, detail="Solo se pueden verificar pagos pendientes")

        cur.execute(
            "UPDATE payments SET status = %s, verified_by = %s, verified_at = CURRENT_TIMESTAMP WHERE id = %s",
            (data.status, current_user["id"], payment_id),
        )

        cur.execute("SELECT id FROM folios WHERE reservation_id = %s", (row[1],))
        folio_row = cur.fetchone()
        if folio_row:
            _recalculate_folio(cur, folio_row[0])

        conn.commit()
        return {"success": True, "status": data.status}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al verificar pago")
    finally:
        cur.close()
        release_connection(conn)


# ── Charges ────────────────────────────────────────────────────────────────────

@router.get("/charges")
async def list_charges(
    reservation_id: Optional[int] = None,
    charge_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """List room charges for a reservation."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = "SELECT id, reservation_id, concept, quantity, unit_price_usd, total_usd, " \
                "charge_type, subtotal_base, tax_iva, created_at FROM room_charges WHERE 1=1"
        params = []
        if reservation_id:
            query += " AND reservation_id = %s"; params.append(reservation_id)
        if charge_type:
            query += " AND charge_type = %s"; params.append(charge_type)
        query += " ORDER BY created_at"
        cur.execute(query, params)
        rows = cur.fetchall()
        charges = [
            {
                "id": c[0], "reservation_id": c[1], "concept": c[2],
                "quantity": c[3], "unit_price_usd": float(c[4]),
                "total_usd": float(c[5]), "charge_type": c[6],
                "subtotal_base": float(c[6]), "tax_iva": float(c[7]),
                "created_at": c[8].isoformat() if c[8] else None,
            }
            for c in rows
        ]
        return {"success": True, "charges": charges}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener cargos")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/charges")
async def create_charge(
    data: ChargeCreate,
    current_user: dict = Depends(require_permission("reception", "write")),
):
    """Add a charge to a reservation. Auto-calculates subtotal and tax."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM reservations WHERE id = %s", (data.reservation_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Reserva no encontrada")

        iva_rate = _get_iva_rate(cur)
        total_usd = data.unit_price_usd * data.quantity
        subtotal_base = total_usd
        tax_iva = (subtotal_base * iva_rate).quantize(Decimal("0.01"))

        cur.execute(
            "INSERT INTO room_charges (reservation_id, concept, quantity, unit_price_usd, total_usd, "
            "charge_type, subtotal_base, tax_iva) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) "
            "RETURNING id, created_at",
            (data.reservation_id, data.concept, data.quantity, data.unit_price_usd,
             total_usd, data.charge_type, subtotal_base, tax_iva),
        )
        row = cur.fetchone()

        cur.execute("SELECT id FROM folios WHERE reservation_id = %s", (data.reservation_id,))
        folio_row = cur.fetchone()
        if folio_row:
            _recalculate_folio(cur, folio_row[0])

        conn.commit()
        return {
            "success": True,
            "charge": {
                "id": row[0], "concept": data.concept, "quantity": data.quantity,
                "unit_price_usd": float(data.unit_price_usd),
                "total_usd": float(total_usd), "charge_type": data.charge_type,
                "subtotal_base": float(subtotal_base), "tax_iva": float(tax_iva),
                "created_at": row[1].isoformat() if row[1] else None,
            },
        }
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear cargo")
    finally:
        cur.close()
        release_connection(conn)


@router.delete("/charges/{charge_id}")
async def delete_charge(
    charge_id: int,
    current_user: dict = Depends(require_permission("reception", "write")),
):
    """Remove a charge from a reservation. Recalculates folio."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT reservation_id FROM room_charges WHERE id = %s", (charge_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Cargo no encontrado")

        reservation_id = row[0]
        cur.execute("DELETE FROM room_charges WHERE id = %s", (charge_id,))

        cur.execute("SELECT id FROM folios WHERE reservation_id = %s", (reservation_id,))
        folio_row = cur.fetchone()
        if folio_row:
            _recalculate_folio(cur, folio_row[0])

        conn.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al eliminar cargo")
    finally:
        cur.close()
        release_connection(conn)


# ── Uploads ────────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_permission("reception", "write")),
):
    """Upload a file (payment screenshot). Returns the URL path."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".pdf"}:
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido")

    max_size = int(_get_setting_val("max_upload_size_mb", "2")) * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail=f"El archivo excede el tamaño máximo ({max_size // 1024 // 1024}MB)")

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)

    return {"success": True, "url": f"/uploads/payments/{filename}"}


def _get_setting_val(key: str, default: str = "") -> str:
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT value FROM hotel_settings WHERE key = %s", (key,))
        row = cur.fetchone()
        return row[0] if row else default
    finally:
        cur.close()
        release_connection(conn)


# ── Dashboard ──────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """Reception dashboard stats."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        today = date.today()

        cur.execute("SELECT COUNT(*) FROM rooms WHERE status = 'active'")
        total_rooms = cur.fetchone()[0]

        cur.execute("""
            SELECT COUNT(*) FROM rooms r
            JOIN reservations res ON res.room_id = r.id
            WHERE res.status = 'checked_in'
        """)
        occupied = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM rooms WHERE is_blocked = TRUE AND status = 'active'")
        blocked = cur.fetchone()[0]

        available = total_rooms - occupied - blocked

        cur.execute("""
            SELECT COUNT(*) FROM reservations
            WHERE check_in_date = %s AND status IN ('reserved', 'checked_in')
        """, (today,))
        arrivals_today = cur.fetchone()[0]

        cur.execute("""
            SELECT COUNT(*) FROM reservations
            WHERE check_out_date = %s AND status = 'checked_in'
        """, (today,))
        departures_today = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM reservations WHERE status = 'checked_in'")
        in_house = cur.fetchone()[0]

        cur.execute("""
            SELECT COALESCE(SUM(f.total_amount), 0) FROM folios f
            JOIN reservations res ON f.reservation_id = res.id
            WHERE DATE(res.check_in_date) >= DATE_TRUNC('month', CURRENT_DATE)
            AND res.status IN ('checked_in', 'checked_out')
        """)
        month_revenue = float(cur.fetchone()[0])

        bcv_rate = float(_get_bcv_rate(cur))

        return {
            "success": True,
            "dashboard": {
                "total_rooms": total_rooms,
                "occupied": occupied,
                "available": available,
                "blocked": blocked,
                "arrivals_today": arrivals_today,
                "departures_today": departures_today,
                "in_house": in_house,
                "month_revenue": month_revenue,
                "bcv_rate": bcv_rate,
            },
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener dashboard")
    finally:
        cur.close()
        release_connection(conn)