"""
Database connection and initialization for HMR.
Uses psycopg2 with a connection pool.
"""
import os
import time
from contextlib import contextmanager
import psycopg2
from psycopg2 import pool
from logging_config import logger

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "postgres"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "user": os.getenv("DB_USER", "hmr"),
    "password": os.getenv("DB_PASSWORD", "hmr_secret"),
    "database": os.getenv("DB_NAME", "hmr_db"),
}

# Connection pool (initialized lazily)
_pool = None


def get_pool():
    global _pool
    if _pool is None:
        _pool = psycopg2.pool.SimpleConnectionPool(1, 10, **DB_CONFIG)
    return _pool


def get_connection():
    """Get a connection from the pool."""
    return get_pool().getconn()


def release_connection(conn):
    """Return a connection to the pool."""
    get_pool().putconn(conn)


@contextmanager
def get_db():
    """
    Context manager for database connections.
    Handles connection acquisition, commit/rollback, and cleanup automatically.
    
    Usage:
        with get_db() as (conn, cur):
            cur.execute("SELECT ...")
            conn.commit()
    """
    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        yield conn, cur
    except Exception:
        if conn:
            conn.rollback()
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            release_connection(conn)


def init_db():
    """
    Create tables if they don't exist.
    Retries connection up to 10 times (postgres might not be ready yet).
    """
    for attempt in range(10):
        try:
            conn = get_connection()
            cur = conn.cursor()
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    full_name VARCHAR(100) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'user' NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS signatures (
                    id          SERIAL PRIMARY KEY,
                    full_name   VARCHAR(100) NOT NULL,
                    job_title   VARCHAR(100) NOT NULL,
                    email       VARCHAR(255) NOT NULL,
                    mobile_phone VARCHAR(20),
                    extension   VARCHAR(20),
                    created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # === Hotel Structure Tables ===
            cur.execute("""
                CREATE TABLE IF NOT EXISTS properties (
                    id          SERIAL PRIMARY KEY,
                    name        VARCHAR(150) NOT NULL,
                    address     TEXT,
                    timezone    VARCHAR(50) DEFAULT 'America/Caracas',
                    is_active   BOOLEAN DEFAULT TRUE,
                    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS modules (
                    id          SERIAL PRIMARY KEY,
                    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
                    number      INTEGER NOT NULL,
                    name        VARCHAR(100),
                    category    VARCHAR(20) DEFAULT 'hotel' CHECK (category IN ('hotel', 'owner')),
                    is_active   BOOLEAN DEFAULT TRUE,
                    sort_order  INTEGER DEFAULT 0,
                    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(property_id, number)
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS floors (
                    id          SERIAL PRIMARY KEY,
                    module_id   INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
                    code        VARCHAR(10) NOT NULL,
                    name        VARCHAR(100),
                    is_active   BOOLEAN DEFAULT TRUE,
                    sort_order  INTEGER DEFAULT 0,
                    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(module_id, code)
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS rooms (
                    id                  SERIAL PRIMARY KEY,
                    floor_id            INTEGER NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
                    room_number         VARCHAR(20) NOT NULL UNIQUE,
                    status              VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
                    category            VARCHAR(20) DEFAULT 'hotel' CHECK (category IN ('hotel', 'owner')),
                    last_battery_change DATE,
                    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # === Maintenance Tables ===
            cur.execute("""
                CREATE TABLE IF NOT EXISTS part_types (
                    id          SERIAL PRIMARY KEY,
                    name        VARCHAR(100) NOT NULL UNIQUE,
                    category    VARCHAR(20) NOT NULL CHECK (category IN ('battery', 'mechanical')),
                    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS lock_assets (
                    id            SERIAL PRIMARY KEY,
                    room_id       INTEGER NOT NULL UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
                    code          VARCHAR(40) UNIQUE,
                    status        VARCHAR(20) NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'preventive', 'failure', 'out_of_service')),
                    installed_at  DATE,
                    notes         TEXT,
                    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            cur.execute("""
                CREATE TABLE IF NOT EXISTS maintenance_logs (
                    id            SERIAL PRIMARY KEY,
                    room_id       INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
                    lock_asset_id INTEGER REFERENCES lock_assets(id) ON DELETE SET NULL,
                    part_type_id  INTEGER REFERENCES part_types(id) ON DELETE SET NULL,
                    type          VARCHAR(20) NOT NULL CHECK (type IN ('battery', 'mechanical')),
                    description   TEXT,
                    performed_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    performed_at  DATE NOT NULL DEFAULT CURRENT_DATE,
                    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # Backward-compatible migrations for existing databases.
            cur.execute("ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS lock_asset_id INTEGER REFERENCES lock_assets(id) ON DELETE SET NULL")
            cur.execute("ALTER TABLE lock_assets ADD COLUMN IF NOT EXISTS code VARCHAR(40) UNIQUE")
            cur.execute("ALTER TABLE lock_assets ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'preventive', 'failure', 'out_of_service'))")
            cur.execute("ALTER TABLE lock_assets ADD COLUMN IF NOT EXISTS installed_at DATE")
            cur.execute("ALTER TABLE lock_assets ADD COLUMN IF NOT EXISTS notes TEXT")

            # Migrate room_category_id -> category if the old column exists
            cur.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'rooms' AND column_name = 'room_category_id'
            """)
            if cur.fetchone():
                cur.execute("ALTER TABLE rooms RENAME COLUMN room_category_id TO category")
                logger.info("Migrated rooms.room_category_id -> rooms.category")

            conn.commit()
            cur.close()
            release_connection(conn)
            logger.info("Database tables initialized successfully")

            # Seed defaults
            _seed_hotel_structure()
            _seed_part_types()
            _seed_lock_assets()
            return
        except psycopg2.OperationalError as e:
            logger.warning(f"Waiting for database (attempt {attempt + 1}/10)... {e}")
            time.sleep(2)

    raise Exception("Could not connect to database after 10 attempts")


def _seed_hotel_structure():
    """
    Seed the Hotel Margarita Real structure if no properties exist yet.
    6 modules, 4 floors each, rooms with logical numbering.
    Modules 1 & 6 are 'owner' category.
    """
    conn = get_connection()
    try:
        cur = conn.cursor()

        # Only seed if no properties exist
        cur.execute("SELECT COUNT(*) FROM properties")
        if cur.fetchone()[0] > 0:
            logger.info("Hotel structure already seeded, skipping")
            cur.close()
            release_connection(conn)
            return

        # Create property
        cur.execute("""
            INSERT INTO properties (name, address, timezone)
            VALUES (%s, %s, %s)
            RETURNING id
        """, (
            "Hotel Margarita Real",
            "Av. Aldonza Manrique, Final Calle Camarón, Pampatar, Edo. Nueva Esparta, Venezuela 6316",
            "America/Caracas",
        ))
        property_id = cur.fetchone()[0]

        # Floor definitions: (code, name, sort_order, floor_digit)
        floor_defs = [
            ("PB", "Planta Baja", 0, 1),
            ("P1", "Piso 1", 1, 2),
            ("P2", "Piso 2", 2, 3),
            ("PH", "Penthouse", 3, 4),
        ]

        # Create 6 modules
        for mod_num in range(1, 7):
            category = "owner" if mod_num in (1, 6) else "hotel"
            is_active = mod_num not in (1, 6)  # Owner modules hidden by default

            cur.execute("""
                INSERT INTO modules (property_id, number, name, category, is_active, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (property_id, mod_num, f"Módulo {mod_num}", category, is_active, mod_num))
            module_id = cur.fetchone()[0]

            # Create 4 floors per module
            for code, fname, sort_ord, floor_digit in floor_defs:
                cur.execute("""
                    INSERT INTO floors (module_id, code, name, is_active, sort_order)
                    VALUES (%s, %s, %s, TRUE, %s)
                    RETURNING id
                """, (module_id, code, fname, sort_ord))
                floor_id = cur.fetchone()[0]

                # Create rooms: e.g. Module 2, Floor PB (digit 1) => 2101, 2102, ...
                rooms_per_floor = 4
                for room_seq in range(1, rooms_per_floor + 1):
                    room_number = f"{mod_num}{floor_digit}{room_seq:02d}"
                    cur.execute("""
                        INSERT INTO rooms (floor_id, room_number, status, category)
                        VALUES (%s, %s, %s, %s)
                    """, (floor_id, room_number, "active", category))

        conn.commit()
        cur.close()
        release_connection(conn)
        logger.info("Hotel Margarita Real structure seeded (6 modules, 24 floors, 96 rooms)")
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        logger.error(f"Error seeding hotel structure: {e}")


def _seed_part_types():
    """Seed the default part types if none exist."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM part_types")
        if cur.fetchone()[0] > 0:
            cur.close()
            release_connection(conn)
            return

        parts = [
            ("Batería", "battery"),
            ("Motor", "mechanical"),
            ("Cilindro", "mechanical"),
            ("Embutido", "mechanical"),
            ("Galleta", "mechanical"),
        ]
        for name, category in parts:
            cur.execute("INSERT INTO part_types (name, category) VALUES (%s, %s)", (name, category))

        conn.commit()
        cur.close()
        release_connection(conn)
        logger.info("Part types seeded (5 types)")
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        logger.error(f"Error seeding part types: {e}")


def _seed_lock_assets():
    """Ensure every room has one lock asset record for lock-centric tracking."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO lock_assets (room_id, code, status)
            SELECT r.id, CONCAT('LOCK-', r.id::text), 'operational'
            FROM rooms r
            WHERE NOT EXISTS (
                SELECT 1 FROM lock_assets la WHERE la.room_id = r.id
            )
        """)
        inserted = cur.rowcount
        conn.commit()
        cur.close()
        release_connection(conn)
        if inserted > 0:
            logger.info(f"Lock assets seeded ({inserted} created)")
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        logger.error(f"Error seeding lock assets: {e}")

