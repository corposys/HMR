"""
Linen management routes: types, inventory, transactions.
"""
from typing import Optional, List, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from db import get_connection, release_connection
from middleware.auth import get_current_user, require_permission

router = APIRouter(prefix="/api/housekeeping/linen", tags=["linen"])


# ── Pydantic Models ────────────────────────────────────────────────────────────

class LinenTypeCreate(BaseModel):
    name: str
    category: Literal["bedding", "bathroom", "amenity", "other"]
    par_level: int = 0
    unit: str = "unidad"


class LinenTypeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[Literal["bedding", "bathroom", "amenity", "other"]] = None
    par_level: Optional[int] = None
    unit: Optional[str] = None


class InventoryUpdate(BaseModel):
    floor_id: int
    linen_type_id: int
    quantity: int


class TransactionCreate(BaseModel):
    linen_type_id: int
    transaction_type: Literal["checkout", "return", "loss", "restock"]
    quantity: int
    floor_id: Optional[int] = None
    notes: Optional[str] = None


# ── Linen Types ────────────────────────────────────────────────────────────────

@router.get("/types")
async def list_linen_types(current_user: dict = Depends(get_current_user)):
    """List all linen types."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, name, category, par_level, unit FROM linen_types ORDER BY category, name")
        rows = cur.fetchall()
        types = [
            {"id": r[0], "name": r[1], "category": r[2], "par_level": r[3], "unit": r[4]}
            for r in rows
        ]
        return {"success": True, "types": types}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener tipos de lencería")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/types")
async def create_linen_type(
    data: LinenTypeCreate,
    current_user: dict = Depends(require_permission("housekeeping", "update_status")),
):
    """Create a new linen type."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO linen_types (name, category, par_level, unit) VALUES (%s, %s, %s, %s) RETURNING id",
            (data.name, data.category, data.par_level, data.unit),
        )
        linen_type_id = cur.fetchone()[0]
        conn.commit()
        return {"success": True, "type": {"id": linen_type_id, **data.model_dump()}}
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear tipo de lencería")
    finally:
        cur.close()
        release_connection(conn)


@router.patch("/types/{linen_type_id}")
async def update_linen_type(
    linen_type_id: int,
    data: LinenTypeUpdate,
    current_user: dict = Depends(require_permission("housekeeping", "update_status")),
):
    """Update a linen type."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        updates, params = [], []
        if data.name is not None:
            updates.append("name = %s"); params.append(data.name)
        if data.category is not None:
            updates.append("category = %s"); params.append(data.category)
        if data.par_level is not None:
            updates.append("par_level = %s"); params.append(data.par_level)
        if data.unit is not None:
            updates.append("unit = %s"); params.append(data.unit)
        if not updates:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")
        params.append(linen_type_id)
        cur.execute(f"UPDATE linen_types SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()
        return {"success": True}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar tipo de lencería")
    finally:
        cur.close()
        release_connection(conn)


# ── Inventory ──────────────────────────────────────────────────────────────────

@router.get("/inventory")
async def get_inventory(
    floor_id: Optional[int] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    """Get linen inventory by floor with par level alerts."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT lt.id AS linen_type_id, lt.name, lt.category, lt.par_level, lt.unit,
                   li.floor_id, li.quantity,
                   f.code AS floor_code, f.name AS floor_name
            FROM linen_types lt
            LEFT JOIN linen_inventory li ON lt.id = li.linen_type_id
            LEFT JOIN floors f ON li.floor_id = f.id
        """
        params = []
        if floor_id:
            query += " WHERE li.floor_id = %s"; params.append(floor_id)
        query += " ORDER BY lt.category, lt.name, f.sort_order"

        cur.execute(query, params)
        rows = cur.fetchall()
        inventory = [
            {
                "linen_type_id": r[0], "name": r[1], "category": r[2],
                "par_level": r[3], "unit": r[4],
                "floor_id": r[5], "quantity": r[6] or 0,
                "floor_code": r[7], "floor_name": r[8],
                "below_par": (r[6] or 0) < r[3] if r[5] else False,
            }
            for r in rows
        ]
        return {"success": True, "inventory": inventory}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener inventario")
    finally:
        cur.close()
        release_connection(conn)


@router.patch("/inventory")
async def update_inventory(
    data: InventoryUpdate,
    current_user: dict = Depends(require_permission("housekeeping", "update_status")),
):
    """Update inventory quantity for a linen type on a floor."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO linen_inventory (linen_type_id, floor_id, quantity)
               VALUES (%s, %s, %s)
               ON CONFLICT (linen_type_id, floor_id)
               DO UPDATE SET quantity = EXCLUDED.quantity""",
            (data.linen_type_id, data.floor_id, data.quantity),
        )
        conn.commit()
        return {"success": True}
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar inventario")
    finally:
        cur.close()
        release_connection(conn)


# ── Transactions ───────────────────────────────────────────────────────────────

@router.get("/transactions")
async def list_transactions(
    date_param: Optional[str] = Query(default=None, alias="date"),
    type_filter: Optional[str] = Query(default=None),
    floor_id: Optional[int] = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    """List linen transactions with filters."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT lt.id, lt.linen_type_id, lt.transaction_type, lt.quantity,
                   lt.floor_id, lt.staff_id, lt.notes, lt.created_at,
                   ln.name AS linen_name,
                   f.code AS floor_code, f.name AS floor_name,
                   u.full_name AS staff_name
            FROM linen_transactions lt
            LEFT JOIN linen_types ln ON lt.linen_type_id = ln.id
            LEFT JOIN floors f ON lt.floor_id = f.id
            LEFT JOIN users u ON lt.staff_id = u.id
            WHERE 1=1
        """
        params = []
        if date_param:
            query += " AND DATE(lt.created_at) = %s"; params.append(date_param)
        else:
            query += " AND DATE(lt.created_at) = CURRENT_DATE"
        if type_filter:
            query += " AND lt.transaction_type = %s"; params.append(type_filter)
        if floor_id:
            query += " AND lt.floor_id = %s"; params.append(floor_id)
        query += " ORDER BY lt.created_at DESC"

        cur.execute(query, params)
        rows = cur.fetchall()
        transactions = [
            {
                "id": r[0], "linen_type_id": r[1], "transaction_type": r[2],
                "quantity": r[3], "floor_id": r[4], "staff_id": r[5],
                "notes": r[6], "created_at": r[7].isoformat() if r[7] else None,
                "linen_name": r[8], "floor_code": r[9], "floor_name": r[10],
                "staff_name": r[11],
            }
            for r in rows
        ]
        return {"success": True, "transactions": transactions}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener transacciones")
    finally:
        cur.close()
        release_connection(conn)


@router.post("/transactions")
async def create_transaction(
    data: TransactionCreate,
    current_user: dict = Depends(require_permission("housekeeping", "update_status")),
):
    """Create a linen transaction (checkout/return/loss/restock)."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO linen_transactions (linen_type_id, transaction_type, quantity, floor_id, staff_id, notes)
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
            (data.linen_type_id, data.transaction_type, data.quantity, data.floor_id, current_user.get("id"), data.notes),
        )
        transaction_id = cur.fetchone()[0]

        if data.transaction_type in ("restock", "return") and data.floor_id:
            cur.execute(
                """INSERT INTO linen_inventory (linen_type_id, floor_id, quantity)
                   VALUES (%s, %s, %s)
                   ON CONFLICT (linen_type_id, floor_id)
                   DO UPDATE SET quantity = linen_inventory.quantity + EXCLUDED.quantity""",
                (data.linen_type_id, data.floor_id, data.quantity),
            )
        elif data.transaction_type in ("checkout", "loss") and data.floor_id:
            cur.execute(
                "UPDATE linen_inventory SET quantity = GREATEST(quantity - %s, 0) WHERE linen_type_id = %s AND floor_id = %s",
                (data.quantity, data.linen_type_id, data.floor_id),
            )

        conn.commit()
        return {"success": True, "transaction": {"id": transaction_id}}
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al crear transacción")
    finally:
        cur.close()
        release_connection(conn)
