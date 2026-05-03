"""
Signatures routes: create, list, and delete email signatures.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from db import get_connection, release_connection
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/signatures", tags=["signatures"])


# --- Pydantic Models ---

class SignatureCreate(BaseModel):
    full_name: str
    job_title: str
    email: str
    mobile_phone: Optional[str] = None
    extension: Optional[str] = None


# --- Routes ---

@router.get("")
async def list_signatures(current_user: dict = Depends(get_current_user)):
    """Return all saved signatures, newest first."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT s.id, s.full_name, s.job_title, s.email,
                   s.mobile_phone, s.extension, s.created_at,
                   u.full_name AS created_by_name
            FROM signatures s
            LEFT JOIN users u ON s.created_by = u.id
            ORDER BY s.created_at DESC
        """)
        rows = cur.fetchall()
        signatures = [
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
            for r in rows
        ]
        return {"success": True, "signatures": signatures}
    except Exception:
        raise HTTPException(status_code=500, detail="Error al obtener firmas")
    finally:
        cur.close()
        release_connection(conn)


@router.post("")
async def create_signature(
    data: SignatureCreate,
    current_user: dict = Depends(get_current_user),
):
    """Save a new signature record to the database."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO signatures (full_name, job_title, email, mobile_phone, extension, created_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, full_name, job_title, email, mobile_phone, extension, created_at
            """,
            (
                data.full_name,
                data.job_title,
                data.email,
                data.mobile_phone or None,
                data.extension or None,
                current_user["id"],
            ),
        )
        row = cur.fetchone()
        conn.commit()
        return {
            "success": True,
            "signature": {
                "id": row[0],
                "full_name": row[1],
                "job_title": row[2],
                "email": row[3],
                "mobile_phone": row[4],
                "extension": row[5],
                "created_at": row[6].isoformat() if row[6] else None,
            },
        }
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al guardar firma")
    finally:
        cur.close()
        release_connection(conn)


@router.delete("/{signature_id}")
async def delete_signature(
    signature_id: int,
    current_user: dict = Depends(get_current_user),
):
    """Delete a signature by ID. Only the creator can delete."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        # Verify ownership
        cur.execute("SELECT id FROM signatures WHERE id = %s AND created_by = %s", (signature_id, current_user["id"]))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Firma no encontrada o no tienes permiso para eliminarla")

        cur.execute("DELETE FROM signatures WHERE id = %s", (signature_id,))
        conn.commit()
        return {"success": True, "message": "Firma eliminada correctamente"}
    except HTTPException:
        raise
    except Exception:
        conn.rollback()
        raise HTTPException(status_code=500, detail="Error al eliminar firma")
    finally:
        cur.close()
        release_connection(conn)
