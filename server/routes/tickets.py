"""
Tickets routes: support ticket system.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from db import get_connection, release_connection
from middleware.auth import get_current_user, require_permission

router = APIRouter(tags=["tickets"])


class TicketPublicCreate(BaseModel):
    category: str
    title: str
    description: str
    priority: str = "media"
    submitted_by_name: str
    submitted_by_department: Optional[str] = None
    submitted_by_contact: Optional[str] = None
    pc_location: Optional[str] = None


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    assigned_to: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    submitted_by_name: Optional[str] = None
    submitted_by_department: Optional[str] = None
    submitted_by_contact: Optional[str] = None
    pc_location: Optional[str] = None


class TicketCommentCreate(BaseModel):
    comment_text: str
    is_internal: bool = False


@router.post("/api/tickets/public")
async def create_public_ticket(ticket: TicketPublicCreate):
    if not ticket.category or ticket.category not in ("hardware", "software", "conectividad", "otro"):
        raise HTTPException(status_code=400, detail="Categoría inválida")
    if not ticket.title or not ticket.description:
        raise HTTPException(status_code=400, detail="Título y descripción son requeridos")
    if not ticket.submitted_by_name:
        raise HTTPException(status_code=400, detail="El nombre es requerido")

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM tickets")
        count = cur.fetchone()[0] + 1
        ticket_number = f"TK-{datetime.now().year}-{count:04d}"

        cur.execute(
            """INSERT INTO tickets (ticket_number, category, title, description, priority,
               submitted_by_name, submitted_by_department, submitted_by_contact, pc_location)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id, ticket_number, created_at""",
            (ticket_number, ticket.category, ticket.title, ticket.description, ticket.priority,
             ticket.submitted_by_name, ticket.submitted_by_department, ticket.submitted_by_contact, ticket.pc_location),
        )
        row = cur.fetchone()
        conn.commit()

        ticket_data = {
            "id": row[0],
            "ticket_number": row[1],
            "created_at": row[2].isoformat() if row[2] else None,
        }
        cur.close()
        release_connection(conn)
        return {"success": True, "ticket": ticket_data}
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/tickets")
async def list_tickets(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    assigned_to: Optional[int] = Query(None),
    current_user: dict = Depends(require_permission("maintenance", "read")),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        query = """
            SELECT t.id, t.ticket_number, t.category, t.title, t.description,
                   t.priority, t.status, t.submitted_by_name, t.submitted_by_department,
                   t.submitted_by_contact, t.pc_location,
                   t.assigned_to, t.created_by, t.resolved_at, t.created_at, t.updated_at,
                   u.full_name as assigned_name,
                   COALESCE((
                       SELECT COUNT(*) FROM ticket_comments WHERE ticket_id = t.id
                   ), 0) as comment_count
            FROM tickets t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE 1=1
        """
        params = []

        if status:
            query += " AND t.status = %s"
            params.append(status)
        if priority:
            query += " AND t.priority = %s"
            params.append(priority)
        if category:
            query += " AND t.category = %s"
            params.append(category)
        if assigned_to is not None:
            query += " AND t.assigned_to = %s"
            params.append(assigned_to)
        if search:
            query += """ AND (
                t.title ILIKE %s OR t.description ILIKE %s OR
                t.submitted_by_name ILIKE %s OR t.ticket_number ILIKE %s OR
                t.submitted_by_department ILIKE %s
            )"""
            like = f"%{search}%"
            params.extend([like, like, like, like, like])

        query += " ORDER BY t.created_at DESC"
        cur.execute(query, params)
        rows = cur.fetchall()

        tickets = []
        for r in rows:
            tickets.append({
                "id": r[0],
                "ticket_number": r[1],
                "category": r[2],
                "title": r[3],
                "description": r[4],
                "priority": r[5],
                "status": r[6],
                "submitted_by_name": r[7],
                "submitted_by_department": r[8],
                "submitted_by_contact": r[9],
                "pc_location": r[10],
                "assigned_to": r[11],
                "created_by": r[12],
                "resolved_at": r[13].isoformat() if r[13] else None,
                "created_at": r[14].isoformat() if r[14] else None,
                "updated_at": r[15].isoformat() if r[15] else None,
                "assigned_name": r[16],
                "comment_count": r[17],
            })

        cur.close()
        release_connection(conn)
        return {"success": True, "tickets": tickets}
    except Exception as e:
        release_connection(conn)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/tickets/{ticket_id}")
async def get_ticket(
    ticket_id: int,
    current_user: dict = Depends(require_permission("maintenance", "read")),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """SELECT t.id, t.ticket_number, t.category, t.title, t.description,
                      t.priority, t.status, t.submitted_by_name, t.submitted_by_department,
                      t.submitted_by_contact, t.pc_location,
                      t.assigned_to, t.created_by, t.resolved_at, t.created_at, t.updated_at,
                      u.full_name as assigned_name
               FROM tickets t LEFT JOIN users u ON t.assigned_to = u.id
               WHERE t.id = %s""",
            (ticket_id,),
        )
        r = cur.fetchone()
        if not r:
            cur.close()
            release_connection(conn)
            raise HTTPException(status_code=404, detail="Ticket no encontrado")

        ticket = {
            "id": r[0],
            "ticket_number": r[1],
            "category": r[2],
            "title": r[3],
            "description": r[4],
            "priority": r[5],
            "status": r[6],
            "submitted_by_name": r[7],
            "submitted_by_department": r[8],
            "submitted_by_contact": r[9],
            "pc_location": r[10],
            "assigned_to": r[11],
            "created_by": r[12],
            "resolved_at": r[13].isoformat() if r[13] else None,
            "created_at": r[14].isoformat() if r[14] else None,
            "updated_at": r[15].isoformat() if r[15] else None,
            "assigned_name": r[16],
        }

        cur.execute(
            """SELECT tc.id, tc.ticket_id, tc.user_id, tc.author_name,
                      tc.comment_text, tc.is_internal, tc.created_at,
                      u.full_name as user_full_name
               FROM ticket_comments tc
               LEFT JOIN users u ON tc.user_id = u.id
               WHERE tc.ticket_id = %s
               ORDER BY tc.created_at ASC""",
            (ticket_id,),
        )
        comments = []
        for c in cur.fetchall():
            comments.append({
                "id": c[0],
                "ticket_id": c[1],
                "user_id": c[2],
                "author_name": c[3],
                "comment_text": c[4],
                "is_internal": c[5],
                "created_at": c[6].isoformat() if c[6] else None,
                "user_full_name": c[7],
            })

        ticket["comments"] = comments
        cur.close()
        release_connection(conn)
        return {"success": True, "ticket": ticket}
    except HTTPException:
        raise
    except Exception as e:
        release_connection(conn)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/api/tickets/{ticket_id}")
async def update_ticket(
    ticket_id: int,
    data: TicketUpdate,
    current_user: dict = Depends(require_permission("maintenance", "write")),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, status FROM tickets WHERE id = %s", (ticket_id,))
        existing = cur.fetchone()
        if not existing:
            cur.close()
            release_connection(conn)
            raise HTTPException(status_code=404, detail="Ticket no encontrado")

        updates = []
        params = []

        if data.status is not None:
            if data.status not in ("open", "in_progress", "resolved", "closed"):
                raise HTTPException(status_code=400, detail="Estado inválido")
            updates.append("status = %s")
            params.append(data.status)
            if data.status in ("resolved", "closed") and existing[1] not in ("resolved", "closed"):
                updates.append("resolved_at = NOW()")
            elif data.status not in ("resolved", "closed"):
                updates.append("resolved_at = NULL")

        if data.priority is not None:
            if data.priority not in ("baja", "media", "alta", "urgente"):
                raise HTTPException(status_code=400, detail="Prioridad inválida")
            updates.append("priority = %s")
            params.append(data.priority)

        if data.category is not None:
            updates.append("category = %s")
            params.append(data.category)

        if data.assigned_to is not None:
            updates.append("assigned_to = %s")
            params.append(data.assigned_to)

        if data.title is not None:
            updates.append("title = %s")
            params.append(data.title)

        if data.description is not None:
            updates.append("description = %s")
            params.append(data.description)

        if data.submitted_by_name is not None:
            updates.append("submitted_by_name = %s")
            params.append(data.submitted_by_name)

        if data.submitted_by_department is not None:
            updates.append("submitted_by_department = %s")
            params.append(data.submitted_by_department)

        if data.submitted_by_contact is not None:
            updates.append("submitted_by_contact = %s")
            params.append(data.submitted_by_contact)

        if data.pc_location is not None:
            updates.append("pc_location = %s")
            params.append(data.pc_location)

        if updates:
            updates.append("updated_at = NOW()")
            params.append(ticket_id)
            cur.execute(f"UPDATE tickets SET {', '.join(updates)} WHERE id = %s", params)

        conn.commit()
        cur.close()
        release_connection(conn)
        return {"success": True, "message": "Ticket actualizado"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/tickets/{ticket_id}/comments")
async def add_comment(
    ticket_id: int,
    data: TicketCommentCreate,
    current_user: dict = Depends(require_permission("maintenance", "write")),
):
    if not data.comment_text:
        raise HTTPException(status_code=400, detail="El comentario no puede estar vacío")

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM tickets WHERE id = %s", (ticket_id,))
        if not cur.fetchone():
            cur.close()
            release_connection(conn)
            raise HTTPException(status_code=404, detail="Ticket no encontrado")

        author_name = current_user.get("full_name", "Sistema")
        cur.execute(
            """INSERT INTO ticket_comments (ticket_id, user_id, author_name, comment_text, is_internal)
               VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at""",
            (ticket_id, current_user["id"], author_name, data.comment_text, data.is_internal),
        )
        row = cur.fetchone()
        cur.execute("UPDATE tickets SET updated_at = NOW() WHERE id = %s", (ticket_id,))
        conn.commit()

        comment_data = {
            "id": row[0],
            "ticket_id": ticket_id,
            "user_id": current_user["id"],
            "author_name": author_name,
            "comment_text": data.comment_text,
            "is_internal": data.is_internal,
            "created_at": row[1].isoformat() if row[1] else None,
        }
        cur.close()
        release_connection(conn)
        return {"success": True, "comment": comment_data}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        raise HTTPException(status_code=500, detail=str(e))
