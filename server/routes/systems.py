"""
Systems routes: printers and toners management.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from db import get_connection, release_connection
from middleware.auth import get_current_user, require_permission

router = APIRouter(prefix="/api/systems", tags=["systems"])

# Pydantic schemas
class PrinterCreate(BaseModel):
    segment: str # 'hotel' | 'corpo'
    ownership: str # 'propia' | 'alquilada'
    brand: str
    model: str
    serial_number: Optional[str] = None
    connection_type: str # 'red' | 'usb'
    ip_address: Optional[str] = None
    has_scanner: Optional[bool] = False
    location: Optional[str] = None
    status: Optional[str] = "operational"

class PrinterUpdate(BaseModel):
    segment: Optional[str] = None
    ownership: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    connection_type: Optional[str] = None
    ip_address: Optional[str] = None
    has_scanner: Optional[bool] = None
    location: Optional[str] = None
    status: Optional[str] = None

class TonerModelCreate(BaseModel):
    model_name: str
    color: str
    compatible_printers: Optional[str] = None

class TonerModelUpdate(BaseModel):
    model_name: Optional[str] = None
    color: Optional[str] = None
    compatible_printers: Optional[str] = None

class TonerTransactionCreate(BaseModel):
    toner_model_id: int
    segment: str # 'hotel' | 'corpo'
    type: str # 'in' | 'out'
    quantity: int = Field(..., gt=0)
    printer_id: Optional[int] = None
    notes: Optional[str] = None

# --- Printers Endpoints ---

@router.get("/printers")
async def list_printers(
    segment: Optional[str] = None,
    ownership: Optional[str] = None,
    current_user: dict = Depends(require_permission("maintenance", "read"))
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT id, segment, ownership, brand, model, serial_number, 
                   connection_type, ip_address, has_scanner, location, status, created_at 
            FROM printers
        """
        where_clauses = []
        params = []
        if segment:
            where_clauses.append("segment = %s")
            params.append(segment)
        if ownership:
            where_clauses.append("ownership = %s")
            params.append(ownership)
            
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)
            
        query += " ORDER BY brand, model"
        
        cur.execute(query, params)
        rows = cur.fetchall()
        printers = [
            {
                "id": r[0],
                "segment": r[1],
                "ownership": r[2],
                "brand": r[3],
                "model": r[4],
                "serial_number": r[5],
                "connection_type": r[6],
                "ip_address": r[7],
                "has_scanner": r[8],
                "location": r[9],
                "status": r[10],
                "created_at": r[11].isoformat() if r[11] else None
            }
            for r in rows
        ]
        return {"success": True, "printers": printers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener impresoras: {str(e)}")
    finally:
        cur.close()
        release_connection(conn)

@router.post("/printers")
async def create_printer(
    data: PrinterCreate,
    current_user: dict = Depends(require_permission("maintenance", "write"))
):
    if data.segment not in ("hotel", "corpo"):
        raise HTTPException(status_code=400, detail="Segmento inválido. Debe ser 'hotel' o 'corpo'")
    if data.ownership not in ("propia", "alquilada"):
        raise HTTPException(status_code=400, detail="Propiedad inválida. Debe ser 'propia' o 'alquilada'")
    if data.connection_type not in ("red", "usb"):
        raise HTTPException(status_code=400, detail="Tipo de conexión inválido. Debe ser 'red' o 'usb'")
    if data.ip_address and data.ip_address.strip():
        import re
        if not re.match(r"^(\d{1,3}\.){3}\d{1,3}$", data.ip_address.strip()):
            raise HTTPException(status_code=400, detail="Dirección IP inválida")

    conn = get_connection()
    try:
        cur = conn.cursor()
        if data.serial_number:
            cur.execute("SELECT id FROM printers WHERE serial_number = %s", (data.serial_number,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="El número de serie ya está registrado")
                
        cur.execute("""
            INSERT INTO printers (segment, ownership, brand, model, serial_number, connection_type, ip_address, has_scanner, location, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (data.segment, data.ownership, data.brand, data.model, data.serial_number, data.connection_type, data.ip_address, data.has_scanner, data.location, data.status))
        printer_id = cur.fetchone()[0]
        conn.commit()
        return {"success": True, "printer_id": printer_id, "message": "Impresora registrada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar impresora: {str(e)}")
    finally:
        cur.close()
        release_connection(conn)

@router.put("/printers/{printer_id}")
async def update_printer(
    printer_id: int,
    data: PrinterUpdate,
    current_user: dict = Depends(require_permission("maintenance", "write"))
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM printers WHERE id = %s", (printer_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Impresora no encontrada")
            
        updates = []
        params = []
        
        if data.segment is not None:
            if data.segment not in ("hotel", "corpo"):
                raise HTTPException(status_code=400, detail="Segmento inválido")
            updates.append("segment = %s")
            params.append(data.segment)
            
        if data.ownership is not None:
            if data.ownership not in ("propia", "alquilada"):
                raise HTTPException(status_code=400, detail="Propiedad inválida")
            updates.append("ownership = %s")
            params.append(data.ownership)
            
        if data.brand is not None:
            updates.append("brand = %s")
            params.append(data.brand)
            
        if data.model is not None:
            updates.append("model = %s")
            params.append(data.model)
            
        if data.serial_number is not None:
            cur.execute("SELECT id FROM printers WHERE serial_number = %s AND id != %s", (data.serial_number, printer_id))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="El número de serie ya está registrado en otra impresora")
            updates.append("serial_number = %s")
            params.append(data.serial_number)
            
        if data.connection_type is not None:
            if data.connection_type not in ("red", "usb"):
                raise HTTPException(status_code=400, detail="Tipo de conexión inválido")
            updates.append("connection_type = %s")
            params.append(data.connection_type)
            
        if data.ip_address is not None:
            if data.ip_address.strip():
                import re
                if not re.match(r"^(\d{1,3}\.){3}\d{1,3}$", data.ip_address.strip()):
                    raise HTTPException(status_code=400, detail="Dirección IP inválida")
            updates.append("ip_address = %s")
            params.append(data.ip_address or None)
            
        if data.has_scanner is not None:
            updates.append("has_scanner = %s")
            params.append(data.has_scanner)
            
        if data.location is not None:
            updates.append("location = %s")
            params.append(data.location)
            
        if data.status is not None:
            if data.status not in ("operational", "maintenance", "out_of_service"):
                raise HTTPException(status_code=400, detail="Estado inválido")
            updates.append("status = %s")
            params.append(data.status)
            
        if not updates:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")

        updates.append("updated_at = NOW()")
        params.append(printer_id)
        cur.execute(f"UPDATE printers SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()
        return {"success": True, "message": "Impresora actualizada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar impresora: {str(e)}")
    finally:
        cur.close()
        release_connection(conn)

@router.delete("/printers/{printer_id}")
async def delete_printer(
    printer_id: int,
    current_user: dict = Depends(require_permission("maintenance", "write"))
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM printers WHERE id = %s", (printer_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Impresora no encontrada")
            
        cur.execute("DELETE FROM printers WHERE id = %s", (printer_id,))
        conn.commit()
        return {"success": True, "message": "Impresora eliminada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar impresora: {str(e)}")
    finally:
        cur.close()
        release_connection(conn)

# --- Toner Models & Inventory Endpoints ---

@router.get("/toners")
async def list_toners(
    current_user: dict = Depends(require_permission("maintenance", "read"))
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT tm.id, tm.model_name, tm.color, tm.compatible_printers, tm.created_at,
                   COALESCE(i_hotel.quantity, 0) AS stock_hotel,
                   COALESCE(i_corpo.quantity, 0) AS stock_corpo
            FROM toner_models tm
            LEFT JOIN toner_inventory i_hotel ON tm.id = i_hotel.toner_model_id AND i_hotel.segment = 'hotel'
            LEFT JOIN toner_inventory i_corpo ON tm.id = i_corpo.toner_model_id AND i_corpo.segment = 'corpo'
            ORDER BY tm.model_name
        """
        cur.execute(query)
        rows = cur.fetchall()
        toners = [
            {
                "id": r[0],
                "model_name": r[1],
                "color": r[2],
                "compatible_printers": r[3],
                "created_at": r[4].isoformat() if r[4] else None,
                "stock_hotel": r[5],
                "stock_corpo": r[6]
            }
            for r in rows
        ]
        return {"success": True, "toners": toners}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener catálogo de toners: {str(e)}")
    finally:
        cur.close()
        release_connection(conn)

@router.post("/toners")
async def create_toner_model(
    data: TonerModelCreate,
    current_user: dict = Depends(require_permission("maintenance", "write"))
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM toner_models WHERE model_name = %s", (data.model_name,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="El modelo de toner ya existe")
            
        cur.execute("""
            INSERT INTO toner_models (model_name, color, compatible_printers)
            VALUES (%s, %s, %s)
            RETURNING id
        """, (data.model_name, data.color, data.compatible_printers))
        toner_id = cur.fetchone()[0]
        
        cur.execute("INSERT INTO toner_inventory (toner_model_id, segment, quantity) VALUES (%s, 'hotel', 0)", (toner_id,))
        cur.execute("INSERT INTO toner_inventory (toner_model_id, segment, quantity) VALUES (%s, 'corpo', 0)", (toner_id,))
        
        conn.commit()
        return {"success": True, "toner_id": toner_id, "message": "Modelo de toner creado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear modelo de toner: {str(e)}")
    finally:
        cur.close()
        release_connection(conn)

@router.put("/toners/{toner_id}")
async def update_toner_model(
    toner_id: int,
    data: TonerModelUpdate,
    current_user: dict = Depends(require_permission("maintenance", "write"))
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM toner_models WHERE id = %s", (toner_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Modelo de toner no encontrado")
            
        updates = []
        params = []
        
        if data.model_name is not None:
            cur.execute("SELECT id FROM toner_models WHERE model_name = %s AND id != %s", (data.model_name, toner_id))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Otro modelo de toner ya tiene este nombre")
            updates.append("model_name = %s")
            params.append(data.model_name)
            
        if data.color is not None:
            updates.append("color = %s")
            params.append(data.color)
            
        if data.compatible_printers is not None:
            updates.append("compatible_printers = %s")
            params.append(data.compatible_printers)
            
        if not updates:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")
            
        params.append(toner_id)
        cur.execute(f"UPDATE toner_models SET {', '.join(updates)} WHERE id = %s", params)
        conn.commit()
        return {"success": True, "message": "Modelo de toner actualizado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar modelo de toner: {str(e)}")
    finally:
        cur.close()
        release_connection(conn)

@router.delete("/toners/{toner_id}")
async def delete_toner_model(
    toner_id: int,
    current_user: dict = Depends(require_permission("maintenance", "write"))
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM toner_models WHERE id = %s", (toner_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Modelo de toner no encontrado")
            
        cur.execute("DELETE FROM toner_models WHERE id = %s", (toner_id,))
        conn.commit()
        return {"success": True, "message": "Modelo de toner eliminado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar modelo de toner: {str(e)}")
    finally:
        cur.close()
        release_connection(conn)

# --- Toner Transactions (Entries & Exits) ---

@router.post("/toners/transaction")
async def create_toner_transaction(
    data: TonerTransactionCreate,
    current_user: dict = Depends(require_permission("maintenance", "write"))
):
    if data.segment not in ("hotel", "corpo"):
        raise HTTPException(status_code=400, detail="Segmento inválido. Debe ser 'hotel' o 'corpo'")
    if data.type not in ("in", "out"):
        raise HTTPException(status_code=400, detail="Tipo de transacción inválido. Debe ser 'in' o 'out'")
        
    conn = get_connection()
    try:
        cur = conn.cursor()
        
        cur.execute("SELECT id FROM toner_models WHERE id = %s", (data.toner_model_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Modelo de toner no encontrado")
            
        cur.execute("""
            SELECT quantity FROM toner_inventory 
            WHERE toner_model_id = %s AND segment = %s
        """, (data.toner_model_id, data.segment))
        row = cur.fetchone()
        
        current_stock = row[0] if row else 0
        
        if data.type == "in":
            new_stock = current_stock + data.quantity
        else: # "out"
            if current_stock < data.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Stock insuficiente en {data.segment}. Stock actual: {current_stock}, solicitado: {data.quantity}"
                )
            new_stock = current_stock - data.quantity
            
            if data.printer_id:
                cur.execute("SELECT id, segment FROM printers WHERE id = %s", (data.printer_id,))
                printer_row = cur.fetchone()
                if not printer_row:
                    raise HTTPException(status_code=404, detail="La impresora seleccionada no existe")
                
        cur.execute("""
            INSERT INTO toner_transactions (toner_model_id, segment, type, quantity, printer_id, created_by, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (data.toner_model_id, data.segment, data.type, data.quantity, data.printer_id, current_user.get("id"), data.notes))
        
        if row:
            cur.execute("""
                UPDATE toner_inventory SET quantity = %s 
                WHERE toner_model_id = %s AND segment = %s
            """, (new_stock, data.toner_model_id, data.segment))
        else:
            cur.execute("""
                INSERT INTO toner_inventory (toner_model_id, segment, quantity)
                VALUES (%s, %s, %s)
            """, (data.toner_model_id, data.segment, new_stock))
            
        conn.commit()
        return {
            "success": True, 
            "message": f"Transacción registrada exitosamente. Nuevo stock para {data.segment}: {new_stock}"
        }
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar transacción: {str(e)}")
    finally:
        cur.close()
        release_connection(conn)

@router.get("/toners/transactions")
async def list_toner_transactions(
    segment: Optional[str] = None,
    toner_model_id: Optional[int] = None,
    current_user: dict = Depends(require_permission("maintenance", "read"))
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT t.id, t.segment, t.type, t.quantity, t.notes, t.created_at,
                   tm.model_name, tm.color,
                   p.brand AS printer_brand, p.model AS printer_model, p.location AS printer_location,
                   u.full_name AS user_name
            FROM toner_transactions t
            JOIN toner_models tm ON t.toner_model_id = tm.id
            LEFT JOIN printers p ON t.printer_id = p.id
            LEFT JOIN users u ON t.created_by = u.id
        """
        where_clauses = []
        params = []
        
        if segment:
            where_clauses.append("t.segment = %s")
            params.append(segment)
        if toner_model_id:
            where_clauses.append("t.toner_model_id = %s")
            params.append(toner_model_id)
            
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)
            
        query += " ORDER BY t.created_at DESC"
        
        cur.execute(query, params)
        rows = cur.fetchall()
        
        transactions = [
            {
                "id": r[0],
                "segment": r[1],
                "type": r[2],
                "quantity": r[3],
                "notes": r[4],
                "created_at": r[5].isoformat() if r[5] else None,
                "model_name": r[6],
                "color": r[7],
                "printer_name": f"{r[8]} {r[9]} ({r[10]})" if r[8] else None,
                "user_name": r[11]
            }
            for r in rows
        ]
        return {"success": True, "transactions": transactions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener historial de transacciones: {str(e)}")
    finally:
        cur.close()
        release_connection(conn)
