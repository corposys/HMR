"""
Rates router: seasons, rate plans, occupancy configs, exceptions,
child rates, and quote engine.
"""
from datetime import date, timedelta
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from db import get_connection, release_connection
from middleware.auth import get_current_user, require_permission

router = APIRouter(prefix="/api/rates", tags=["rates"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class SeasonCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., pattern=r"^(low|high|shoulder|special)$")
    start_date: date
    end_date: date
    year: int
    is_active: bool = True


class SeasonUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[str] = Field(None, pattern=r"^(low|high|shoulder|special)$")
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    year: Optional[int] = None
    is_active: Optional[bool] = None


class RatePlanCreate(BaseModel):
    season_id: int
    room_type_id: int
    occupancy_code: str = Field(..., min_length=1, max_length=20)
    nightly_rate_usd: Decimal = Field(..., ge=0, decimal_places=2)


class RatePlanUpdate(BaseModel):
    season_id: Optional[int] = None
    room_type_id: Optional[int] = None
    occupancy_code: Optional[str] = Field(None, min_length=1, max_length=20)
    nightly_rate_usd: Optional[Decimal] = Field(None, ge=0, decimal_places=2)


class OccupancyConfigCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=20)
    label: str = Field(..., min_length=1, max_length=50)
    min_pax: int = Field(..., ge=1)
    max_pax: int = Field(..., ge=1)
    sort_order: int = 0
    is_active: bool = True


class OccupancyConfigUpdate(BaseModel):
    label: Optional[str] = Field(None, min_length=1, max_length=50)
    min_pax: Optional[int] = Field(None, ge=1)
    max_pax: Optional[int] = Field(None, ge=1)
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class RateBatchItem(BaseModel):
    season_id: int
    room_type_id: int
    occupancy_code: str
    nightly_rate_usd: Decimal = Field(..., ge=0, decimal_places=2)


class RateBatchUpdate(BaseModel):
    rates: List[RateBatchItem]


class RateMultiplierPayload(BaseModel):
    season_id: int
    multiplier: Decimal = Field(..., gt=0, decimal_places=4)
    room_type_id: Optional[int] = None


class ChildRateCreate(BaseModel):
    season_id: int
    age_min: int = Field(..., ge=0)
    age_max: int = Field(..., ge=0)
    nightly_rate_usd: Decimal = Field(..., ge=0, decimal_places=2)
    label: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _season_overlaps(cur, start: date, end: date, year: int, exclude_id: Optional[int] = None) -> bool:
    sql = """
        SELECT 1 FROM seasons
        WHERE year = %s AND is_active = TRUE
          AND start_date <= %s AND end_date >= %s
    """
    params = [year, end, start]
    if exclude_id:
        sql += " AND id != %s"
        params.append(exclude_id)
    sql += " LIMIT 1"
    cur.execute(sql, params)
    return cur.fetchone() is not None


def _get_season_for_date(cur, d: date):
    cur.execute(
        "SELECT id FROM seasons WHERE is_active = TRUE AND start_date <= %s AND end_date >= %s ORDER BY start_date LIMIT 1",
        (d, d),
    )
    row = cur.fetchone()
    return row[0] if row else None


def _get_rate_for_night(cur, night: date, room_type_id: int, occupancy_code: str):
    # 1. exception
    cur.execute(
        """
        SELECT nightly_rate_usd FROM rate_exceptions
        WHERE exception_date = %s AND is_active = TRUE
          AND (room_type_id = %s OR room_type_id IS NULL)
          AND (occupancy_code = %s OR occupancy_code IS NULL)
        ORDER BY room_type_id NULLS LAST, occupancy_code NULLS LAST
        LIMIT 1
        """,
        (night, room_type_id, occupancy_code),
    )
    row = cur.fetchone()
    if row:
        return Decimal(str(row[0]))

    # 2. season rate plan
    season_id = _get_season_for_date(cur, night)
    if season_id:
        cur.execute(
            """
            SELECT nightly_rate_usd FROM rate_plans
            WHERE season_id = %s AND room_type_id = %s AND occupancy_code = %s
            LIMIT 1
            """,
            (season_id, room_type_id, occupancy_code),
        )
        row = cur.fetchone()
        if row:
            return Decimal(str(row[0]))

    # 3. room type default
    cur.execute("SELECT default_rate_usd FROM room_types WHERE id = %s", (room_type_id,))
    row = cur.fetchone()
    if row and row[0]:
        return Decimal(str(row[0]))

    return Decimal("0")


# ---------------------------------------------------------------------------
# Seasons
# ---------------------------------------------------------------------------

@router.get("/seasons")
def list_seasons(
    year: Optional[int] = Query(None),
    type: Optional[str] = Query(None),
    current_user=Depends(get_current_user),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        sql = "SELECT id, name, type, start_date, end_date, year, is_active, created_at, updated_at FROM seasons WHERE 1=1"
        params = []
        if year:
            sql += " AND year = %s"
            params.append(year)
        if type:
            sql += " AND type = %s"
            params.append(type)
        sql += " ORDER BY year DESC, start_date"
        cur.execute(sql, params)
        rows = cur.fetchall()
        items = []
        for r in rows:
            items.append({
                "id": r[0], "name": r[1], "type": r[2], "start_date": str(r[3]),
                "end_date": str(r[4]), "year": r[5], "is_active": r[6],
                "created_at": r[7].isoformat() if r[7] else None,
                "updated_at": r[8].isoformat() if r[8] else None,
            })
        return {"items": items, "total": len(items)}
    finally:
        cur.close()
        release_connection(conn)


@router.post("/seasons")
def create_season(
    payload: SeasonCreate,
    current_user=Depends(require_permission("settings", "write")),
):
    if payload.start_date > payload.end_date:
        raise HTTPException(status_code=400, detail="La fecha de inicio no puede ser posterior a la fecha de fin")

    conn = get_connection()
    try:
        cur = conn.cursor()
        if _season_overlaps(cur, payload.start_date, payload.end_date, payload.year):
            raise HTTPException(status_code=409, detail="La temporada se solapa con otra existente para el mismo año")

        cur.execute(
            """
            INSERT INTO seasons (name, type, start_date, end_date, year, is_active)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (payload.name, payload.type, payload.start_date, payload.end_date, payload.year, payload.is_active),
        )
        season_id = cur.fetchone()[0]
        conn.commit()
        return {"success": True, "season": {"id": season_id, **payload.model_dump()}}
    finally:
        cur.close()
        release_connection(conn)


@router.put("/seasons/{season_id}")
def update_season(
    season_id: int,
    payload: SeasonUpdate,
    current_user=Depends(require_permission("settings", "write")),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT start_date, end_date, year FROM seasons WHERE id = %s", (season_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Temporada no encontrada")

        old_start, old_end, old_year = row
        start = payload.start_date or old_start
        end = payload.end_date or old_end
        year = payload.year or old_year

        if start > end:
            raise HTTPException(status_code=400, detail="La fecha de inicio no puede ser posterior a la fecha de fin")

        if _season_overlaps(cur, start, end, year, exclude_id=season_id):
            raise HTTPException(status_code=409, detail="La temporada se solapa con otra existente para el mismo año")

        fields = []
        params = []
        if payload.name is not None:
            fields.append("name = %s")
            params.append(payload.name)
        if payload.type is not None:
            fields.append("type = %s")
            params.append(payload.type)
        if payload.start_date is not None:
            fields.append("start_date = %s")
            params.append(payload.start_date)
        if payload.end_date is not None:
            fields.append("end_date = %s")
            params.append(payload.end_date)
        if payload.year is not None:
            fields.append("year = %s")
            params.append(payload.year)
        if payload.is_active is not None:
            fields.append("is_active = %s")
            params.append(payload.is_active)
        if not fields:
            return {"success": True}

        fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(season_id)
        cur.execute(f"UPDATE seasons SET {', '.join(fields)} WHERE id = %s", params)
        conn.commit()
        return {"success": True}
    finally:
        cur.close()
        release_connection(conn)


@router.delete("/seasons/{season_id}")
def delete_season(
    season_id: int,
    current_user=Depends(require_permission("settings", "write")),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM seasons WHERE id = %s", (season_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Temporada no encontrada")
        conn.commit()
        return {"success": True, "message": "Temporada eliminada"}
    finally:
        cur.close()
        release_connection(conn)


@router.post("/seasons/{season_id}/clone")
def clone_season(
    season_id: int,
    target_year: int = Query(...),
    current_user=Depends(require_permission("settings", "write")),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT name, type, start_date, end_date, year FROM seasons WHERE id = %s",
            (season_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Temporada no encontrada")
        name, stype, start, end, year = row

        # shift dates to target_year
        delta_years = target_year - year
        new_start = date(start.year + delta_years, start.month, start.day)
        new_end = date(end.year + delta_years, end.month, end.day)

        if _season_overlaps(cur, new_start, new_end, target_year):
            raise HTTPException(status_code=409, detail="La temporada clonada se solaparía con otra existente")

        cur.execute(
            """
            INSERT INTO seasons (name, type, start_date, end_date, year, is_active)
            VALUES (%s, %s, %s, %s, %s, TRUE)
            RETURNING id
            """,
            (f"{name} {target_year}", stype, new_start, new_end, target_year),
        )
        new_season_id = cur.fetchone()[0]

        # clone rate plans
        cur.execute(
            """
            INSERT INTO rate_plans (season_id, room_type_id, occupancy_code, nightly_rate_usd)
            SELECT %s, room_type_id, occupancy_code, nightly_rate_usd
            FROM rate_plans WHERE season_id = %s
            """,
            (new_season_id, season_id),
        )

        # clone child rates
        cur.execute(
            """
            INSERT INTO child_rates (season_id, age_min, age_max, nightly_rate_usd, label)
            SELECT %s, age_min, age_max, nightly_rate_usd, label
            FROM child_rates WHERE season_id = %s
            """,
            (new_season_id, season_id),
        )

        conn.commit()
        return {"success": True, "season": {"id": new_season_id, "year": target_year}}
    finally:
        cur.close()
        release_connection(conn)


# ---------------------------------------------------------------------------
# Rate Plans
# ---------------------------------------------------------------------------

@router.get("/rates")
def list_rates(
    season_id: Optional[int] = Query(None),
    room_type_id: Optional[int] = Query(None),
    occupancy_code: Optional[str] = Query(None),
    current_user=Depends(get_current_user),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        sql = """
            SELECT rp.id, rp.season_id, rp.room_type_id, rp.occupancy_code, rp.nightly_rate_usd,
                   s.name as season_name, rt.name as room_type_name, rp.created_at, rp.updated_at
            FROM rate_plans rp
            JOIN seasons s ON s.id = rp.season_id
            JOIN room_types rt ON rt.id = rp.room_type_id
            WHERE 1=1
        """
        params = []
        if season_id:
            sql += " AND rp.season_id = %s"
            params.append(season_id)
        if room_type_id:
            sql += " AND rp.room_type_id = %s"
            params.append(room_type_id)
        if occupancy_code:
            sql += " AND rp.occupancy_code = %s"
            params.append(occupancy_code)
        sql += " ORDER BY s.year DESC, s.start_date, rt.name, rp.occupancy_code"
        cur.execute(sql, params)
        rows = cur.fetchall()
        items = []
        for r in rows:
            items.append({
                "id": r[0], "season_id": r[1], "room_type_id": r[2], "occupancy_code": r[3],
                "nightly_rate_usd": float(r[4]), "season_name": r[5], "room_type_name": r[6],
                "created_at": r[7].isoformat() if r[7] else None,
                "updated_at": r[8].isoformat() if r[8] else None,
            })
        return {"items": items, "total": len(items)}
    finally:
        cur.close()
        release_connection(conn)


@router.post("/rates")
def create_rate(
    payload: RatePlanCreate,
    current_user=Depends(require_permission("settings", "write")),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO rate_plans (season_id, room_type_id, occupancy_code, nightly_rate_usd)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (season_id, room_type_id, occupancy_code)
            DO UPDATE SET nightly_rate_usd = EXCLUDED.nightly_rate_usd, updated_at = CURRENT_TIMESTAMP
            RETURNING id
            """,
            (payload.season_id, payload.room_type_id, payload.occupancy_code, payload.nightly_rate_usd),
        )
        rate_id = cur.fetchone()[0]
        conn.commit()
        return {"success": True, "rate": {"id": rate_id, **payload.model_dump()}}
    finally:
        cur.close()
        release_connection(conn)


@router.put("/rates/{rate_id}")
def update_rate(
    rate_id: int,
    payload: RatePlanUpdate,
    current_user=Depends(require_permission("settings", "write")),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        fields = []
        params = []
        if payload.season_id is not None:
            fields.append("season_id = %s")
            params.append(payload.season_id)
        if payload.room_type_id is not None:
            fields.append("room_type_id = %s")
            params.append(payload.room_type_id)
        if payload.occupancy_code is not None:
            fields.append("occupancy_code = %s")
            params.append(payload.occupancy_code)
        if payload.nightly_rate_usd is not None:
            fields.append("nightly_rate_usd = %s")
            params.append(payload.nightly_rate_usd)
        if not fields:
            return {"success": True}
        fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(rate_id)
        cur.execute(f"UPDATE rate_plans SET {', '.join(fields)} WHERE id = %s", params)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Tarifa no encontrada")
        conn.commit()
        return {"success": True}
    finally:
        cur.close()
        release_connection(conn)


@router.post("/rates/batch")
def batch_update_rates(
    payload: RateBatchUpdate,
    current_user=Depends(require_permission("settings", "write")),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        for item in payload.rates:
            cur.execute(
                """
                INSERT INTO rate_plans (season_id, room_type_id, occupancy_code, nightly_rate_usd)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (season_id, room_type_id, occupancy_code)
                DO UPDATE SET nightly_rate_usd = EXCLUDED.nightly_rate_usd, updated_at = CURRENT_TIMESTAMP
                """,
                (item.season_id, item.room_type_id, item.occupancy_code, item.nightly_rate_usd),
            )
        conn.commit()
        return {"success": True, "updated": len(payload.rates)}
    finally:
        cur.close()
        release_connection(conn)


@router.post("/rates/apply-multiplier")
def apply_multiplier(
    payload: RateMultiplierPayload,
    current_user=Depends(require_permission("settings", "write")),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        sql = "UPDATE rate_plans SET nightly_rate_usd = ROUND(nightly_rate_usd * %s, 2), updated_at = CURRENT_TIMESTAMP WHERE season_id = %s"
        params = [payload.multiplier, payload.season_id]
        if payload.room_type_id:
            sql += " AND room_type_id = %s"
            params.append(payload.room_type_id)
        cur.execute(sql, params)
        conn.commit()
        return {"success": True, "affected": cur.rowcount}
    finally:
        cur.close()
        release_connection(conn)


# ---------------------------------------------------------------------------
# Occupancy Configs
# ---------------------------------------------------------------------------

@router.get("/occupancy-configs")
def list_occupancy_configs(current_user=Depends(get_current_user)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, code, label, min_pax, max_pax, sort_order, is_active, created_at
            FROM occupancy_configs
            ORDER BY sort_order, id
            """
        )
        rows = cur.fetchall()
        items = []
        for r in rows:
            items.append({
                "id": r[0], "code": r[1], "label": r[2], "min_pax": r[3], "max_pax": r[4],
                "sort_order": r[5], "is_active": r[6],
                "created_at": r[7].isoformat() if r[7] else None,
            })
        return {"items": items, "total": len(items)}
    finally:
        cur.close()
        release_connection(conn)


@router.post("/occupancy-configs")
def create_occupancy_config(
    payload: OccupancyConfigCreate,
    current_user=Depends(require_permission("settings", "write")),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO occupancy_configs (code, label, min_pax, max_pax, sort_order, is_active)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (payload.code, payload.label, payload.min_pax, payload.max_pax, payload.sort_order, payload.is_active),
        )
        config_id = cur.fetchone()[0]
        conn.commit()
        return {"success": True, "config": {"id": config_id, **payload.model_dump()}}
    finally:
        cur.close()
        release_connection(conn)


@router.put("/occupancy-configs/{config_id}")
def update_occupancy_config(
    config_id: int,
    payload: OccupancyConfigUpdate,
    current_user=Depends(require_permission("settings", "write")),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        fields = []
        params = []
        if payload.label is not None:
            fields.append("label = %s")
            params.append(payload.label)
        if payload.min_pax is not None:
            fields.append("min_pax = %s")
            params.append(payload.min_pax)
        if payload.max_pax is not None:
            fields.append("max_pax = %s")
            params.append(payload.max_pax)
        if payload.sort_order is not None:
            fields.append("sort_order = %s")
            params.append(payload.sort_order)
        if payload.is_active is not None:
            fields.append("is_active = %s")
            params.append(payload.is_active)
        if not fields:
            return {"success": True}
        params.append(config_id)
        cur.execute(f"UPDATE occupancy_configs SET {', '.join(fields)} WHERE id = %s", params)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Configuración no encontrada")
        conn.commit()
        return {"success": True}
    finally:
        cur.close()
        release_connection(conn)


@router.delete("/occupancy-configs/{config_id}")
def delete_occupancy_config(
    config_id: int,
    current_user=Depends(require_permission("settings", "write")),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM occupancy_configs WHERE id = %s", (config_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Configuración no encontrada")
        conn.commit()
        return {"success": True, "message": "Configuración eliminada"}
    finally:
        cur.close()
        release_connection(conn)


# ---------------------------------------------------------------------------
# Quote engine
# ---------------------------------------------------------------------------

@router.get("/quote")
def quote(
    room_type_id: int = Query(...),
    check_in: date = Query(...),
    check_out: date = Query(...),
    occupancy_code: str = Query("SGL_DBL"),
    num_adults: int = Query(2, ge=1),
    num_children: int = Query(0, ge=0),
    children_ages: Optional[str] = Query(None),
    plan_id: Optional[int] = Query(None),
    current_user=Depends(get_current_user),
):
    if check_in >= check_out:
        raise HTTPException(status_code=400, detail="La fecha de check-out debe ser posterior a la de check-in")

    conn = get_connection()
    try:
        cur = conn.cursor()

        # plan multiplier
        multiplier = Decimal("1")
        if plan_id:
            cur.execute("SELECT rate_multiplier FROM reservation_plans WHERE id = %s", (plan_id,))
            row = cur.fetchone()
            if row and row[0]:
                multiplier = Decimal(str(row[0]))

        nights = []
        total_nightly = Decimal("0")
        night = check_in
        while night < check_out:
            rate = _get_rate_for_night(cur, night, room_type_id, occupancy_code)
            nights.append({"date": str(night), "rate_usd": float(rate)})
            total_nightly += rate
            night += timedelta(days=1)

        subtotal = total_nightly * multiplier

        # child rates
        child_total = Decimal("0")
        child_breakdown = []
        if num_children > 0 and children_ages:
            ages = [int(a.strip()) for a in children_ages.split(",") if a.strip().isdigit()]
            for age in ages[:num_children]:
                season_id = _get_season_for_date(cur, check_in)
                if season_id:
                    cur.execute(
                        """
                        SELECT nightly_rate_usd, label FROM child_rates
                        WHERE season_id = %s AND age_min <= %s AND age_max >= %s
                        ORDER BY nightly_rate_usd DESC LIMIT 1
                        """,
                        (season_id, age, age),
                    )
                    row = cur.fetchone()
                    if row:
                        rate = Decimal(str(row[0]))
                        label = row[1]
                        nights_count = (check_out - check_in).days
                        total_child = rate * nights_count
                        child_total += total_child
                        child_breakdown.append({
                            "age": age, "label": label, "nightly_rate_usd": float(rate),
                            "nights": nights_count, "total_usd": float(total_child),
                        })

        grand_total = subtotal + child_total

        return {
            "success": True,
            "quote": {
                "room_type_id": room_type_id,
                "check_in": str(check_in),
                "check_out": str(check_out),
                "occupancy_code": occupancy_code,
                "nights": len(nights),
                "nightly_breakdown": nights,
                "total_nightly_usd": float(total_nightly),
                "plan_multiplier": float(multiplier),
                "subtotal_usd": float(subtotal),
                "children_total_usd": float(child_total),
                "children_breakdown": child_breakdown,
                "grand_total_usd": float(grand_total),
            },
        }
    finally:
        cur.close()
        release_connection(conn)


# ---------------------------------------------------------------------------
# Child Rates
# ---------------------------------------------------------------------------

@router.get("/child-rates")
def list_child_rates(
    season_id: Optional[int] = Query(None),
    current_user=Depends(get_current_user),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        sql = """
            SELECT cr.id, cr.season_id, cr.age_min, cr.age_max, cr.nightly_rate_usd, cr.label, cr.created_at,
                   s.name as season_name
            FROM child_rates cr
            JOIN seasons s ON s.id = cr.season_id
            WHERE 1=1
        """
        params = []
        if season_id:
            sql += " AND cr.season_id = %s"
            params.append(season_id)
        sql += " ORDER BY cr.season_id, cr.age_min"
        cur.execute(sql, params)
        rows = cur.fetchall()
        items = []
        for r in rows:
            items.append({
                "id": r[0], "season_id": r[1], "age_min": r[2], "age_max": r[3],
                "nightly_rate_usd": float(r[4]), "label": r[5],
                "created_at": r[6].isoformat() if r[6] else None,
                "season_name": r[7],
            })
        return {"items": items, "total": len(items)}
    finally:
        cur.close()
        release_connection(conn)


@router.post("/child-rates")
def create_child_rate(
    payload: ChildRateCreate,
    current_user=Depends(require_permission("settings", "write")),
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO child_rates (season_id, age_min, age_max, nightly_rate_usd, label)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (season_id, age_min, age_max)
            DO UPDATE SET nightly_rate_usd = EXCLUDED.nightly_rate_usd, label = EXCLUDED.label
            RETURNING id
            """,
            (payload.season_id, payload.age_min, payload.age_max, payload.nightly_rate_usd, payload.label),
        )
        rate_id = cur.fetchone()[0]
        conn.commit()
        return {"success": True, "child_rate": {"id": rate_id, **payload.model_dump()}}
    finally:
        cur.close()
        release_connection(conn)
