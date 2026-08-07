"""
Database connection and initialization for HMR.
Uses psycopg2 with a connection pool.
"""
import os
import json
import time
from contextlib import contextmanager
import bcrypt
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

_pool = None


def get_pool():
    global _pool
    if _pool is None:
        _pool = psycopg2.pool.SimpleConnectionPool(1, 10, **DB_CONFIG)
    return _pool


def get_connection():
    return get_pool().getconn()


def release_connection(conn):
    get_pool().putconn(conn)


@contextmanager
def get_db():
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
    for attempt in range(10):
        try:
            conn = get_connection()
            cur = conn.cursor()

            _create_tables(cur)
            _run_migrations(cur)

            conn.commit()
            cur.close()
            release_connection(conn)
            logger.info("Database tables initialized successfully")

            _seed_all()
            return
        except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
            logger.warning(f"Waiting for database (attempt {attempt + 1}/10)... {e}")
            time.sleep(2)
        except Exception as e:
            logger.error(f"Database initialization error (attempt {attempt + 1}/10): {type(e).__name__}: {e}")
            time.sleep(2)

    raise Exception("Could not connect to database after 10 attempts")


def _create_tables(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'user' NOT NULL,
            role_id INTEGER,
            is_active BOOLEAN DEFAULT TRUE,
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

    cur.execute("""
        CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            display_name VARCHAR(100) NOT NULL,
            description TEXT,
            permissions JSONB NOT NULL DEFAULT '{}',
            is_system BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS hotel_settings (
            key VARCHAR(100) PRIMARY KEY,
            value TEXT NOT NULL,
            value_type VARCHAR(20) DEFAULT 'string',
            category VARCHAR(50) NOT NULL DEFAULT 'general',
            label VARCHAR(150),
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

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
        CREATE TABLE IF NOT EXISTS room_types (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            max_occupancy INTEGER DEFAULT 2,
            default_rate_usd DECIMAL(10,2),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS reservation_plans (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            includes_breakfast BOOLEAN DEFAULT FALSE,
            includes_all_meals BOOLEAN DEFAULT FALSE,
            includes_drinks BOOLEAN DEFAULT FALSE,
            rate_multiplier DECIMAL(5,2) DEFAULT 1.00,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS rooms (
            id                  SERIAL PRIMARY KEY,
            floor_id            INTEGER NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
            room_number         VARCHAR(20) NOT NULL UNIQUE,
            status              VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
            category            VARCHAR(20) DEFAULT 'hotel' CHECK (category IN ('hotel', 'owner')),
            room_type_id        INTEGER REFERENCES room_types(id) ON DELETE SET NULL,
            nightly_rate_usd    DECIMAL(10,2) DEFAULT 50.00,
            housekeeping_status VARCHAR(20) DEFAULT 'clean'
                CHECK (housekeeping_status IN ('clean', 'dirty', 'maintenance', 'inspection')),
            is_blocked          BOOLEAN DEFAULT FALSE,
            blocked_reason      TEXT,
            blocked_until       DATE,
            photo_url           TEXT,
            last_battery_change DATE,
            created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS part_types (
            id          SERIAL PRIMARY KEY,
            name        VARCHAR(100) NOT NULL UNIQUE,
            category    VARCHAR(20) NOT NULL CHECK (category IN ('battery', 'mecanico', 'interno', 'carcasa', 'consumible', 'electronico')),
            description TEXT,
            stock_min   INTEGER DEFAULT 0,
            is_active   BOOLEAN DEFAULT TRUE,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        ALTER TABLE part_types DROP CONSTRAINT IF EXISTS part_types_category_check
    """)
    cur.execute("""
        DELETE FROM part_types
        WHERE name NOT IN (
            'Batería AA', 'Porta Pilas', 'Cilindro', 'Cara Externa (con lector)',
            'Cara Interna', 'Goma Externa', 'Goma Interna', 'Cuadrante',
            'Cuadrante Doble Lock', 'Pasador Doble Lock', 'Tarjeta Lectora (RFID+LED)',
            'Galleta (Cuerpo Central)'
        )
        OR category NOT IN ('battery', 'mecanico', 'interno', 'carcasa', 'consumible', 'electronico')
    """)
    cur.execute("""
        ALTER TABLE part_types ADD CONSTRAINT part_types_category_check
        CHECK (category IN ('battery', 'mecanico', 'interno', 'carcasa', 'consumible', 'electronico'))
    """)
    cur.execute("ALTER TABLE part_types ADD COLUMN IF NOT EXISTS description TEXT")
    cur.execute("ALTER TABLE part_types ADD COLUMN IF NOT EXISTS stock_min INTEGER DEFAULT 0")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS part_inventory (
            id            SERIAL PRIMARY KEY,
            part_type_id  INTEGER NOT NULL REFERENCES part_types(id) ON DELETE CASCADE,
            quantity      INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
            updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (part_type_id)
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS lock_assets (
            id            SERIAL PRIMARY KEY,
            room_id       INTEGER NOT NULL UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
            code          VARCHAR(40) UNIQUE,
            status        VARCHAR(20) NOT NULL DEFAULT 'operational'
                CHECK (status IN ('operational', 'needs_review', 'out_of_service')),
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
            type          VARCHAR(20) NOT NULL CHECK (type IN ('battery', 'mechanical', 'reprogramming')),
            description   TEXT,
            performed_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
            performed_at  DATE NOT NULL DEFAULT CURRENT_DATE,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS part_transactions (
            id                SERIAL PRIMARY KEY,
            part_type_id      INTEGER NOT NULL REFERENCES part_types(id) ON DELETE CASCADE,
            type              VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
            quantity          INTEGER NOT NULL CHECK (quantity > 0),
            maintenance_log_id INTEGER REFERENCES maintenance_logs(id) ON DELETE SET NULL,
            created_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
            notes             TEXT,
            created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS maintenance_log_parts (
            id                SERIAL PRIMARY KEY,
            maintenance_log_id INTEGER NOT NULL REFERENCES maintenance_logs(id) ON DELETE CASCADE,
            part_type_id      INTEGER NOT NULL REFERENCES part_types(id) ON DELETE RESTRICT,
            quantity          INTEGER NOT NULL CHECK (quantity > 0)
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS guests (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR(150) NOT NULL,
            id_document_type VARCHAR(5) NOT NULL DEFAULT 'V'
                CHECK (id_document_type IN ('V', 'E', 'P', 'J')),
            id_document_number VARCHAR(50) NOT NULL,
            nationality VARCHAR(50) DEFAULT 'Venezolano',
            phone VARCHAR(30) NOT NULL,
            email VARCHAR(255),
            address TEXT,
            notes TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            fiscal_name VARCHAR(200),
            fiscal_id VARCHAR(20),
            fiscal_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_id_document UNIQUE (id_document_type, id_document_number)
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS bcv_rates (
            id SERIAL PRIMARY KEY,
            rate DECIMAL(18,2) NOT NULL,
            source VARCHAR(20) DEFAULT 'manual',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS reservations (
            id SERIAL PRIMARY KEY,
            quote_token VARCHAR(64) UNIQUE,
            guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
            room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
            plan_id INTEGER REFERENCES reservation_plans(id) ON DELETE SET NULL,
            check_in_date DATE NOT NULL,
            check_out_date DATE,
            num_guests INTEGER DEFAULT 1,
            status VARCHAR(20) NOT NULL DEFAULT 'reserved'
                CHECK (status IN ('reserved', 'checked_in', 'checked_out', 'no_show', 'cancelled')),
            source VARCHAR(30) DEFAULT 'walk_in'
                CHECK (source IN ('walk_in', 'whatsapp', 'email', 'online_agency')),
            bracelet_color VARCHAR(20),
            early_checkin BOOLEAN DEFAULT FALSE,
            late_checkout BOOLEAN DEFAULT FALSE,
            notes TEXT,
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in_date, check_out_date)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_reservations_room ON reservations(room_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_reservations_quote_token ON reservations(quote_token)")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS folios (
            id SERIAL PRIMARY KEY,
            reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
            control_number VARCHAR(20) UNIQUE,
            status VARCHAR(20) NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'closed', 'cancelled')),
            subtotal_base DECIMAL(10,2) DEFAULT 0,
            tax_iva DECIMAL(10,2) DEFAULT 0,
            tax_igtf DECIMAL(10,2) DEFAULT 0,
            total_amount DECIMAL(10,2) DEFAULT 0,
            total_paid DECIMAL(10,2) DEFAULT 0,
            balance DECIMAL(10,2) DEFAULT 0,
            fiscal_name VARCHAR(200),
            fiscal_id VARCHAR(20),
            fiscal_address TEXT,
            profit_plus_ref VARCHAR(50),
            fiscal_receipt_number VARCHAR(50),
            fiscal_machine_serial VARCHAR(50),
            closed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id SERIAL PRIMARY KEY,
            reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
            amount_usd DECIMAL(10,2) NOT NULL,
            currency VARCHAR(10) NOT NULL DEFAULT 'USD'
                CHECK (currency IN ('USD', 'VES', 'EUR')),
            exchange_rate DECIMAL(18,2),
            amount_ves DECIMAL(18,2),
            igtf_applied BOOLEAN DEFAULT FALSE,
            igtf_amount_usd DECIMAL(10,2) DEFAULT 0,
            subtotal_base DECIMAL(10,2) DEFAULT 0,
            tax_iva DECIMAL(10,2) DEFAULT 0,
            payment_method VARCHAR(30) NOT NULL
                CHECK (payment_method IN ('cash_usd', 'cash_ves', 'zelle', 'pago_movil', 'credit_card', 'bank_transfer')),
            reference_number VARCHAR(50) UNIQUE,
            screenshot_url TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'verified', 'rejected')),
            verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            verified_at TIMESTAMP,
            notes TEXT,
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS room_charges (
            id SERIAL PRIMARY KEY,
            reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
            concept VARCHAR(100) NOT NULL,
            quantity INTEGER DEFAULT 1,
            unit_price_usd DECIMAL(10,2) NOT NULL,
            total_usd DECIMAL(10,2) NOT NULL,
            charge_type VARCHAR(20) DEFAULT 'extra'
                CHECK (charge_type IN ('room_night', 'early_checkin', 'late_checkout', 'extra')),
            subtotal_base DECIMAL(10,2) DEFAULT 0,
            tax_iva DECIMAL(10,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS housekeeping_staff (
            id SERIAL PRIMARY KEY,
            full_name VARCHAR(100) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'maid' CHECK (role IN ('maid', 'supervisor')),
            is_active BOOLEAN DEFAULT TRUE,
            color VARCHAR(7) DEFAULT '#009098',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS housekeeping_assignments (
            id SERIAL PRIMARY KEY,
            staff_id INTEGER NOT NULL REFERENCES housekeeping_staff(id) ON DELETE CASCADE,
            room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
            assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
            status VARCHAR(20) NOT NULL DEFAULT 'assigned'
                CHECK (status IN ('assigned', 'in_progress', 'completed')),
            notes TEXT,
            started_at TIMESTAMP,
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(staff_id, room_id, assignment_date)
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS housekeeping_incidents (
            id SERIAL PRIMARY KEY,
            assignment_id INTEGER REFERENCES housekeeping_assignments(id) ON DELETE SET NULL,
            room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
            staff_id INTEGER REFERENCES housekeeping_staff(id) ON DELETE SET NULL,
            incident_type VARCHAR(30) NOT NULL
                CHECK (incident_type IN ('broken_item', 'missing_inventory', 'maintenance_needed', 'guest_belongings', 'damage', 'other')),
            description TEXT,
            severity VARCHAR(10) DEFAULT 'low'
                CHECK (severity IN ('low', 'medium', 'high', 'critical')),
            resolved BOOLEAN DEFAULT FALSE,
            maintenance_ticket_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS maintenance_tickets (
            id SERIAL PRIMARY KEY,
            room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
            description TEXT NOT NULL,
            priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent', 'critical')),
            status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            assigned_to INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS seasons (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            type VARCHAR(20) NOT NULL CHECK (type IN ('low', 'high', 'shoulder', 'special')),
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            year INTEGER NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT seasons_date_order CHECK (start_date <= end_date)
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS occupancy_configs (
            id SERIAL PRIMARY KEY,
            code VARCHAR(20) NOT NULL UNIQUE,
            label VARCHAR(50) NOT NULL,
            min_pax INTEGER NOT NULL,
            max_pax INTEGER NOT NULL,
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS rate_plans (
            id SERIAL PRIMARY KEY,
            season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
            room_type_id INTEGER NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
            occupancy_code VARCHAR(20) NOT NULL REFERENCES occupancy_configs(code) ON DELETE RESTRICT,
            nightly_rate_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(season_id, room_type_id, occupancy_code)
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS rate_exceptions (
            id SERIAL PRIMARY KEY,
            exception_date DATE NOT NULL,
            room_type_id INTEGER REFERENCES room_types(id) ON DELETE CASCADE,
            occupancy_code VARCHAR(20) REFERENCES occupancy_configs(code) ON DELETE SET NULL,
            nightly_rate_usd NUMERIC(10,2) NOT NULL,
            reason VARCHAR(200),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS child_rates (
            id SERIAL PRIMARY KEY,
            season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
            age_min INTEGER NOT NULL,
            age_max INTEGER NOT NULL,
            nightly_rate_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
            label VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(season_id, age_min, age_max)
        );
    """)


def _run_migrations(cur):
    cur.execute("ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS lock_asset_id INTEGER REFERENCES lock_assets(id) ON DELETE SET NULL")
    cur.execute("ALTER TABLE lock_assets ADD COLUMN IF NOT EXISTS code VARCHAR(40) UNIQUE")
    cur.execute("ALTER TABLE lock_assets ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'operational'")
    cur.execute("""
        DO $$
        BEGIN
            -- Migrate old statuses to new ones
            UPDATE lock_assets SET status = 'needs_review' WHERE status IN ('preventive', 'failure');

            -- Drop old status CHECK constraint if it exists
            IF EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname LIKE 'lock_assets_status_check%'
                AND conrelid = 'lock_assets'::regclass
            ) THEN
                ALTER TABLE lock_assets DROP CONSTRAINT lock_assets_status_check;
            END IF;

            -- Add new CHECK constraint
            ALTER TABLE lock_assets ADD CONSTRAINT lock_assets_status_check
                CHECK (status IN ('operational', 'needs_review', 'out_of_service'));
        END $$;
    """)
    cur.execute("ALTER TABLE lock_assets ADD COLUMN IF NOT EXISTS installed_at DATE")
    cur.execute("ALTER TABLE lock_assets ADD COLUMN IF NOT EXISTS notes TEXT")
    cur.execute("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_type_id INTEGER REFERENCES room_types(id) ON DELETE SET NULL")
    cur.execute("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS nightly_rate_usd DECIMAL(10,2) DEFAULT 50.00")
    cur.execute("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS housekeeping_status VARCHAR(20) DEFAULT 'clean' CHECK (housekeeping_status IN ('clean', 'dirty', 'maintenance', 'inspection'))")
    cur.execute("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE")
    cur.execute("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS blocked_reason TEXT")
    cur.execute("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS blocked_until DATE")
    cur.execute("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS photo_url TEXT")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL")
    cur.execute("ALTER TABLE housekeeping_assignments ADD COLUMN IF NOT EXISTS inspected_by INTEGER REFERENCES users(id) ON DELETE SET NULL")
    cur.execute("ALTER TABLE housekeeping_assignments ADD COLUMN IF NOT EXISTS inspected_at TIMESTAMP")
    cur.execute("ALTER TABLE housekeeping_assignments ADD COLUMN IF NOT EXISTS inspection_notes TEXT")
    cur.execute("ALTER TABLE part_types ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE")
    cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE")

    cur.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'maintenance_logs'
                AND column_name = 'performed_at'
                AND data_type = 'date'
            ) THEN
                ALTER TABLE maintenance_logs
                ALTER COLUMN performed_at TYPE TIMESTAMP WITHOUT TIME ZONE
                USING performed_at::timestamp;
            END IF;
        END $$;
    """)

    cur.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'maintenance_logs_type_check'
            ) THEN
                ALTER TABLE maintenance_logs DROP CONSTRAINT maintenance_logs_type_check;
            END IF;
            ALTER TABLE maintenance_logs ADD CONSTRAINT maintenance_logs_type_check
                CHECK (type IN ('battery', 'mechanical', 'reprogramming'));
        END $$;
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS operational_reports (
            id              SERIAL PRIMARY KEY,
            report_type     VARCHAR(30) NOT NULL
                CHECK (report_type IN ('lock_failure', 'room_issue', 'equipment_issue', 'other')),
            room_id         INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
            lock_asset_id   INTEGER REFERENCES lock_assets(id) ON DELETE SET NULL,
            reported_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
            source_department VARCHAR(30) NOT NULL
                CHECK (source_department IN ('reception', 'housekeeping', 'maintenance', 'systems')),
            issue_description TEXT NOT NULL,
            status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'resolved', 'duplicate')),
            resolved_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at     TIMESTAMP
        );
    """)
    cur.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_report
        ON operational_reports (room_id, report_type)
        WHERE status = 'pending';
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS housekeeping_incidents (
            id SERIAL PRIMARY KEY,
            assignment_id INTEGER REFERENCES housekeeping_assignments(id) ON DELETE SET NULL,
            room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
            staff_id INTEGER REFERENCES housekeeping_staff(id) ON DELETE SET NULL,
            incident_type VARCHAR(30) NOT NULL
                CHECK (incident_type IN ('broken_item', 'missing_inventory', 'maintenance_needed', 'guest_belongings', 'damage', 'other')),
            description TEXT,
            severity VARCHAR(10) DEFAULT 'low'
                CHECK (severity IN ('low', 'medium', 'high', 'critical')),
            resolved BOOLEAN DEFAULT FALSE,
            maintenance_ticket_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS maintenance_tickets (
            id SERIAL PRIMARY KEY,
            room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
            description TEXT NOT NULL,
            priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent', 'critical')),
            status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            assigned_to INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS linen_types (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            category VARCHAR(30) NOT NULL CHECK (category IN ('bedding', 'bathroom', 'amenity', 'other')),
            par_level INTEGER DEFAULT 0,
            unit VARCHAR(20) DEFAULT 'unidad'
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS linen_inventory (
            id SERIAL PRIMARY KEY,
            linen_type_id INTEGER REFERENCES linen_types(id) ON DELETE CASCADE,
            floor_id INTEGER REFERENCES floors(id) ON DELETE CASCADE,
            quantity INTEGER DEFAULT 0,
            UNIQUE(linen_type_id, floor_id)
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS linen_transactions (
            id SERIAL PRIMARY KEY,
            linen_type_id INTEGER REFERENCES linen_types(id) ON DELETE SET NULL,
            transaction_type VARCHAR(20) CHECK (transaction_type IN ('checkout', 'return', 'loss', 'restock')),
            quantity INTEGER NOT NULL,
            floor_id INTEGER REFERENCES floors(id) ON DELETE SET NULL,
            staff_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'housekeeping_assignments_status_check'
            ) THEN
                ALTER TABLE housekeeping_assignments DROP CONSTRAINT housekeeping_assignments_status_check;
            END IF;
            ALTER TABLE housekeeping_assignments ADD CONSTRAINT housekeeping_assignments_status_check
                CHECK (status IN ('assigned', 'in_progress', 'completed', 'inspection'));
        END $$;
    """)

    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'rooms' AND column_name = 'room_category_id'
    """)
    if cur.fetchone():
        cur.execute("ALTER TABLE rooms RENAME COLUMN room_category_id TO category")
        logger.info("Migrated rooms.room_category_id -> rooms.category")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS linen_types (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            category VARCHAR(30) NOT NULL CHECK (category IN ('bedding', 'bathroom', 'amenity', 'other')),
            par_level INTEGER DEFAULT 0,
            unit VARCHAR(20) DEFAULT 'unidad'
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS linen_inventory (
            id SERIAL PRIMARY KEY,
            linen_type_id INTEGER REFERENCES linen_types(id) ON DELETE CASCADE,
            floor_id INTEGER REFERENCES floors(id) ON DELETE CASCADE,
            quantity INTEGER DEFAULT 0,
            UNIQUE(linen_type_id, floor_id)
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS linen_transactions (
            id SERIAL PRIMARY KEY,
            linen_type_id INTEGER REFERENCES linen_types(id) ON DELETE SET NULL,
            transaction_type VARCHAR(20) CHECK (transaction_type IN ('checkout', 'return', 'loss', 'restock')),
            quantity INTEGER NOT NULL,
            floor_id INTEGER REFERENCES floors(id) ON DELETE SET NULL,
            staff_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS night_audits (
            id SERIAL PRIMARY KEY,
            audit_date DATE NOT NULL UNIQUE,
            executed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
            total_rent_charges NUMERIC(12,2) DEFAULT 0,
            total_occupancy INTEGER DEFAULT 0,
            total_payments NUMERIC(12,2) DEFAULT 0,
            metadata JSONB DEFAULT '{}'
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS logbook_notes (
            id SERIAL PRIMARY KEY,
            shift VARCHAR(20) NOT NULL CHECK (shift IN ('morning', 'afternoon', 'night')),
            note_type VARCHAR(30) NOT NULL DEFAULT 'note' CHECK (note_type IN ('note', 'alert', 'reminder')),
            priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
            content TEXT NOT NULL,
            room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
            is_alert BOOLEAN NOT NULL DEFAULT FALSE,
            is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
            resolved_at TIMESTAMP,
            created_by INTEGER NOT NULL REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS printers (
            id SERIAL PRIMARY KEY,
            segment VARCHAR(20) NOT NULL CHECK (segment IN ('hotel', 'corpo')),
            ownership VARCHAR(20) NOT NULL CHECK (ownership IN ('propia', 'alquilada')),
            brand VARCHAR(100) NOT NULL,
            model VARCHAR(100) NOT NULL,
            serial_number VARCHAR(100) UNIQUE,
            connection_type VARCHAR(20) NOT NULL CHECK (connection_type IN ('red', 'usb')),
            ip_address VARCHAR(50),
            has_scanner BOOLEAN DEFAULT FALSE,
            location VARCHAR(100),
            status VARCHAR(20) DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'out_of_service')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cur.execute("ALTER TABLE printers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS toner_models (
            id SERIAL PRIMARY KEY,
            model_name VARCHAR(100) UNIQUE NOT NULL,
            color VARCHAR(50) NOT NULL,
            compatible_printers TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS toner_inventory (
            id SERIAL PRIMARY KEY,
            toner_model_id INTEGER NOT NULL REFERENCES toner_models(id) ON DELETE CASCADE,
            segment VARCHAR(20) NOT NULL CHECK (segment IN ('hotel', 'corpo')),
            quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
            UNIQUE (toner_model_id, segment)
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS toner_transactions (
            id SERIAL PRIMARY KEY,
            toner_model_id INTEGER NOT NULL REFERENCES toner_models(id) ON DELETE CASCADE,
            segment VARCHAR(20) NOT NULL CHECK (segment IN ('hotel', 'corpo')),
            type VARCHAR(10) NOT NULL CHECK (type IN ('in', 'out')),
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            printer_id INTEGER REFERENCES printers(id) ON DELETE SET NULL,
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id SERIAL PRIMARY KEY,
            ticket_number VARCHAR(20) UNIQUE NOT NULL,
            category VARCHAR(50) NOT NULL CHECK (category IN ('hardware', 'software', 'conectividad', 'otro')),
            title VARCHAR(200) NOT NULL,
            description TEXT NOT NULL,
            priority VARCHAR(20) DEFAULT 'media' CHECK (priority IN ('baja', 'media', 'alta', 'urgente')),
            status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
            submitted_by_name VARCHAR(100) NOT NULL,
            submitted_by_department VARCHAR(100),
            submitted_by_contact VARCHAR(100),
            pc_location VARCHAR(100),
            assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            resolved_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS ticket_comments (
            id SERIAL PRIMARY KEY,
            ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            author_name VARCHAR(100),
            comment_text TEXT NOT NULL,
            is_internal BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        UPDATE roles SET permissions = permissions::jsonb || '{"maintenance": {"read": true, "write": true}}'::jsonb
        WHERE name IN ('receptionist', 'reception_manager')
        AND (permissions->'maintenance'->>'write')::boolean = false
    """)


def _seed_all():
    _seed_roles()
    _seed_users()
    _seed_user_role_migration()
    _seed_hotel_settings()
    _seed_room_types()
    _seed_reservation_plans()
    _seed_bcv_rates()
    _seed_hotel_structure()
    _seed_room_type_assignments()
    _seed_part_types()
    _seed_lock_assets()
    _seed_printers_and_toners()
    _seed_tickets()


def _seed_roles():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM roles")
        if cur.fetchone()[0] > 0:
            logger.info("Roles already seeded, skipping")
            cur.close()
            release_connection(conn)
            return

        admin_perm = json.dumps({
            "settings": {"read": True, "write": True},
            "users": {"read": True, "write": True, "delete": True},
            "reception": {"read": True, "write": True, "close_folio": True, "verify_payment": True},
            "guests": {"read": True, "write": True},
            "rooms": {"read": True, "write": True, "block": True},
            "housekeeping": {"read": True, "update_status": True},
            "maintenance": {"read": True, "write": True},
            "reports": {"read": True},
            "financial": {"read": True, "write": True},
        })
        reception_mgr_perm = json.dumps({
            "settings": {"read": True, "write": False},
            "users": {"read": True, "write": False, "delete": False},
            "reception": {"read": True, "write": True, "close_folio": True, "verify_payment": True},
            "guests": {"read": True, "write": True},
            "rooms": {"read": True, "write": True, "block": True},
            "housekeeping": {"read": True, "update_status": True},
            "maintenance": {"read": True, "write": True},
            "reports": {"read": True},
            "financial": {"read": True, "write": True},
        })
        receptionist_perm = json.dumps({
            "settings": {"read": False, "write": False},
            "users": {"read": False, "write": False, "delete": False},
            "reception": {"read": True, "write": True, "close_folio": False, "verify_payment": False},
            "guests": {"read": True, "write": True},
            "rooms": {"read": True, "write": True, "block": False},
            "housekeeping": {"read": True, "update_status": False},
            "maintenance": {"read": True, "write": True},
            "reports": {"read": False},
            "financial": {"read": False, "write": False},
        })
        housekeeping_perm = json.dumps({
            "settings": {"read": False, "write": False},
            "users": {"read": False, "write": False, "delete": False},
            "reception": {"read": True, "write": False, "close_folio": False, "verify_payment": False},
            "guests": {"read": True, "write": False},
            "rooms": {"read": True, "write": True, "block": False},
            "housekeeping": {"read": True, "update_status": True},
            "maintenance": {"read": True, "write": True},
            "reports": {"read": False},
            "financial": {"read": False, "write": False},
        })
        maintenance_perm = json.dumps({
            "settings": {"read": False, "write": False},
            "users": {"read": False, "write": False, "delete": False},
            "reception": {"read": True, "write": False, "close_folio": False, "verify_payment": False},
            "guests": {"read": False, "write": False},
            "rooms": {"read": True, "write": True, "block": False},
            "housekeeping": {"read": False, "update_status": False},
            "maintenance": {"read": True, "write": True},
            "reports": {"read": False},
            "financial": {"read": False, "write": False},
        })
        viewer_perm = json.dumps({
            "settings": {"read": True, "write": False},
            "users": {"read": True, "write": False, "delete": False},
            "reception": {"read": True, "write": False, "close_folio": False, "verify_payment": False},
            "guests": {"read": True, "write": False},
            "rooms": {"read": True, "write": False, "block": False},
            "housekeeping": {"read": True, "update_status": False},
            "maintenance": {"read": True, "write": False},
            "reports": {"read": True},
            "financial": {"read": True, "write": False},
        })

        roles = [
            ("admin", "Administrador", "Acceso completo al sistema", admin_perm, True),
            ("reception_manager", "Gerente de Recepción", "Gestión completa de recepción y pagos", reception_mgr_perm, True),
            ("receptionist", "Recepcionista", "Check-in/out y gestión básica de reservas", receptionist_perm, True),
            ("housekeeping", "Ama de Llaves", "Gestión de estado de habitaciones y limpieza", housekeeping_perm, True),
            ("maintenance", "Mantenimiento", "Gestión de mantenimiento y cerraduras", maintenance_perm, True),
            ("viewer", "Consultor", "Solo lectura de todos los módulos", viewer_perm, True),
        ]
        for name, display, desc, perm, is_sys in roles:
            cur.execute(
                "INSERT INTO roles (name, display_name, description, permissions, is_system) VALUES (%s, %s, %s, %s::jsonb, %s) ON CONFLICT (name) DO NOTHING",
                (name, display, desc, perm, is_sys),
            )

        conn.commit()
        cur.close()
        release_connection(conn)
        logger.info("Roles seeded (6 roles)")
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        logger.error(f"Error seeding roles: {e}")


def _seed_users():
    conn = get_connection()
    try:
        cur = conn.cursor()
        admin_password = bcrypt.hashpw(b"admin1234", bcrypt.gensalt()).decode("utf-8")
        cur.execute(
            "INSERT INTO users (full_name, email, password_hash, role, role_id) "
            "VALUES (%s, %s, %s, %s, %s) "
            "ON CONFLICT (email) DO NOTHING",
            ("Administrador", "admin@hmr.com", admin_password, "admin", 1),
        )

        conn.commit()
        cur.close()
        release_connection(conn)
        logger.info("Users seeded (admin)")
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        logger.error(f"Error seeding users: {e}")


def _seed_user_role_migration():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM users WHERE role_id IS NULL")
        unmigrated = cur.fetchone()[0]
        if unmigrated == 0:
            cur.close()
            release_connection(conn)
            return

        cur.execute("UPDATE users SET role_id = 1 WHERE role_id IS NULL AND role = 'admin'")
        cur.execute("UPDATE users SET role_id = 3 WHERE role_id IS NULL AND role != 'admin'")
        conn.commit()
        cur.close()
        release_connection(conn)
        logger.info(f"User role migration completed ({unmigrated} users updated)")
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        logger.error(f"Error migrating user roles: {e}")


def _seed_hotel_settings():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM hotel_settings")
        if cur.fetchone()[0] > 0:
            logger.info("Hotel settings already seeded, skipping")
            cur.close()
            release_connection(conn)
            return

        settings = [
            ("hotel_name", "Hotel Margarita Real", "string", "hotel", "Nombre Comercial", "Nombre visible del hotel"),
            ("hotel_address", "Av. Aldonza Manrique, Final Calle Camarón, Pampatar, Edo. Nueva Esparta, Venezuela 6316", "string", "hotel", "Dirección", "Dirección fiscal del hotel"),
            ("hotel_phone", "", "string", "hotel", "Teléfono", "Teléfono principal de recepción"),
            ("hotel_email", "", "string", "hotel", "Email", "Correo electrónico oficial"),
            ("hotel_rif", "J-00000000-0", "string", "hotel", "RIF", "Registro de Información Fiscal"),
            ("hotel_logo_url", "", "string", "hotel", "Logo URL", "URL del logotipo del hotel"),
            ("hotel_timezone", "America/Caracas", "string", "hotel", "Zona Horaria", "Zona horaria del hotel"),
            ("hotel_category", "4", "string", "hotel", "Categoría", "Categoría del hotel (1-5 estrellas, boutique, resort, posada)"),
            ("hotel_slogan", "", "string", "hotel", "Eslogan", "Frase corta que define tu marca"),
            ("hotel_website", "", "string", "hotel", "Sitio Web", "URL del sitio web del hotel"),
            ("igtf_rate", "0.03", "number", "financial", "Tasa IGTF", "Impuesto a las Grandes Transacciones Financieras (3%)"),
            ("iva_rate", "0.00", "number", "financial", "Tasa IVA", "Impuesto al Valor Agregado (0% hasta integración fiscal)"),
            ("early_checkin_surcharge", "0.50", "number", "financial", "Recargo Early Check-in", "Porcentaje de una noche como recargo por check-in temprano (0.50 = 50%)"),
            ("late_checkout_surcharge", "0.50", "number", "financial", "Recargo Late Checkout", "Porcentaje de una noche como recargo por checkout tardío (0.50 = 50%)"),
            ("allow_partial_payments", "true", "boolean", "financial", "Pagos Parciales", "Permitir registrar reservas sin pago completo"),
            ("default_currency", "USD", "string", "financial", "Moneda por Defecto", "Moneda base para cálculos"),
            ("checkin_time", "14:00", "string", "reservations", "Hora Check-in", "Hora estándar de check-in"),
            ("checkout_time", "12:00", "string", "reservations", "Hora Checkout", "Hora estándar de checkout"),
            ("require_phone", "true", "boolean", "reservations", "Teléfono Requerido", "Exigir teléfono al registrar huésped"),
            ("max_upload_size_mb", "2", "number", "reservations", "Tamaño Máx. Upload (MB)", "Tamaño máximo de archivos subidos"),
            ("whatsapp_number", "", "string", "reservations", "Número WhatsApp", "Número de WhatsApp del hotel para enviar cotizaciones"),
            ("reservation_sources", '["walk_in","whatsapp","email","online_agency"]', "json", "reservations", "Orígenes de Reserva", "Lista de orígenes de reserva disponibles"),
            ("payment_methods", '["cash_usd","cash_ves","zelle","pago_movil","credit_card","bank_transfer"]', "json", "reservations", "Métodos de Pago", "Lista de métodos de pago disponibles"),
            ("document_types", '["V","E","P","J"]', "json", "reservations", "Tipos de Documento", "Tipos de documento de identidad disponibles"),
            ("bracelet_colors", '{"red":{"label":"Rojo","description":"Todo Incluido"},"yellow":{"label":"Amarillo","description":"Desayuno Incluido"},"green":{"label":"Verde","description":"Solo Habitación"},"blue":{"label":"Azul","description":"Personalizado"}}', "json", "reservations", "Colores de Brazalete", "Colores de brazalete disponibles por plan"),
            ("session_timeout_minutes", "480", "number", "system", "Timeout de Sesión (min)", "Tiempo de inactividad antes de cerrar sesión"),
            ("date_format", "dd/mm/yyyy", "string", "system", "Formato de Fecha", "Formato de fecha para la interfaz"),
        ]

        for key, value, vtype, cat, label, desc in settings:
            cur.execute(
                "INSERT INTO hotel_settings (key, value, value_type, category, label, description) VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (key) DO NOTHING",
                (key, value, vtype, cat, label, desc),
            )

        conn.commit()
        cur.close()
        release_connection(conn)
        logger.info("Hotel settings seeded (27 keys)")
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        logger.error(f"Error seeding hotel settings: {e}")


def _seed_room_types():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM room_types")
        if cur.fetchone()[0] > 0:
            logger.info("Room types already seeded, skipping")
            cur.close()
            release_connection(conn)
            return

        types = [
            ("Suite", "Suite estándar", 6, 100.00),
            ("Suite A", "Suite Tipo A", 6, 105.00),
            ("Suite PB", "Suite Planta Baja", 6, 155.00),
            ("Suite PB A", "Suite Planta Baja Tipo A", 6, 160.00),
            ("PH Tipo B", "Penthouse con Terraza Privada", 8, 195.00),
            ("PH Tipo A", "Penthouse con Terraza Privada y Jacuzzi", 8, 220.00),
        ]
        for name, desc, max_occ, rate in types:
            cur.execute(
                "INSERT INTO room_types (name, description, max_occupancy, default_rate_usd) VALUES (%s, %s, %s, %s) ON CONFLICT (name) DO NOTHING",
                (name, desc, max_occ, rate),
            )

        conn.commit()
        cur.close()
        release_connection(conn)
        logger.info("Room types seeded (6 types)")
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        logger.error(f"Error seeding room types: {e}")


def _seed_reservation_plans():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM reservation_plans")
        if cur.fetchone()[0] > 0:
            logger.info("Reservation plans already seeded, skipping")
            cur.close()
            release_connection(conn)
            return

        plans = [
            ("Solo Habitación", "Solo alojamiento, sin comidas", False, False, False, 1.00),
            ("Desayuno Incluido", "Alojamiento con desayuno buffet", True, False, False, 1.25),
            ("Todo Incluido", "Alojamiento, comidas y bebidas", True, True, True, 1.60),
        ]
        for name, desc, brk, meals, drinks, mult in plans:
            cur.execute(
                "INSERT INTO reservation_plans (name, description, includes_breakfast, includes_all_meals, includes_drinks, rate_multiplier) VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (name) DO NOTHING",
                (name, desc, brk, meals, drinks, mult),
            )

        conn.commit()
        cur.close()
        release_connection(conn)
        logger.info("Reservation plans seeded (3 plans)")
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        logger.error(f"Error seeding reservation plans: {e}")


def _seed_bcv_rates():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM bcv_rates")
        if cur.fetchone()[0] > 0:
            logger.info("BCV rates already seeded, skipping")
            cur.close()
            release_connection(conn)
            return

        cur.execute("INSERT INTO bcv_rates (rate, source) VALUES (%s, %s)", (36.50, "manual"))

        conn.commit()
        cur.close()
        release_connection(conn)
        logger.info("BCV rate seeded (36.50 Bs/USD)")
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        logger.error(f"Error seeding BCV rate: {e}")


def _seed_hotel_structure():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM properties")
        if cur.fetchone()[0] > 0:
            logger.info("Hotel structure already seeded, skipping")
            cur.close()
            release_connection(conn)
            return

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

        floor_defs = [
            ("PB", "Planta Baja", 0, 1),
            ("P1", "Piso 1", 1, 2),
            ("P2", "Piso 2", 2, 3),
            ("PH", "Penthouse", 3, 4),
        ]

        cur.execute("""
            SELECT id, name, default_rate_usd FROM room_types
            WHERE name IN %s
        """, (('Suite', 'Suite A', 'Suite PB', 'Suite PB A', 'PH Tipo B', 'PH Tipo A'),))
        type_data = {name: (type_id, rate) for type_id, name, rate in cur.fetchall()}

        for mod_num in range(1, 7):
            category = "owner" if mod_num in (1, 6) else "hotel"
            is_active = mod_num not in (1, 6)

            cur.execute("""
                INSERT INTO modules (property_id, number, name, category, is_active, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (property_id, mod_num, f"Módulo {mod_num}", category, is_active, mod_num))
            module_id = cur.fetchone()[0]

            for code, fname, sort_ord, floor_digit in floor_defs:
                cur.execute("""
                    INSERT INTO floors (module_id, code, name, is_active, sort_order)
                    VALUES (%s, %s, %s, TRUE, %s)
                    RETURNING id
                """, (module_id, code, fname, sort_ord))
                floor_id = cur.fetchone()[0]

                rooms_per_floor = 4
                for room_seq in range(1, rooms_per_floor + 1):
                    room_number = f"{mod_num}{floor_digit}{room_seq:02d}"

                    if floor_digit == 0:
                        type_name = "Suite PB A" if room_seq in (1, 4) else "Suite PB"
                    elif floor_digit == 3:
                        type_name = "PH Tipo A" if room_seq in (1, 4) else "PH Tipo B"
                    else:
                        type_name = "Suite A" if room_seq in (1, 4) else "Suite"

                    type_id, rate = type_data.get(type_name, (None, 50.00))
                    cur.execute("""
                        INSERT INTO rooms (floor_id, room_number, status, category, room_type_id, nightly_rate_usd)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (floor_id, room_number, "active", category, type_id, rate))

        conn.commit()
        cur.close()
        release_connection(conn)
        logger.info("Hotel Margarita Real structure seeded (6 modules, 24 floors, 96 rooms)")
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        logger.error(f"Error seeding hotel structure: {e}")


def _seed_room_type_assignments():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT id, name, default_rate_usd FROM room_types
            WHERE name IN %s
        """, (('Suite', 'Suite A', 'Suite PB', 'Suite PB A', 'PH Tipo B', 'PH Tipo A'),))
        type_data = {name: (type_id, rate) for type_id, name, rate in cur.fetchall()}

        if len(type_data) < 6:
            logger.warning("Not all 6 room types found, skipping room type assignment update")
            cur.close()
            release_connection(conn)
            return

        cur.execute("SELECT id, room_number FROM rooms")
        rooms = cur.fetchall()

        updated = 0
        for room_id, room_number in rooms:
            if len(room_number) >= 4:
                room_seq = int(room_number[-2:])
                floor_digit = int(room_number[-3])
            else:
                continue

            if floor_digit == 0:
                type_name = "Suite PB A" if room_seq in (1, 4) else "Suite PB"
            elif floor_digit == 3:
                type_name = "PH Tipo A" if room_seq in (1, 4) else "PH Tipo B"
            else:
                type_name = "Suite A" if room_seq in (1, 4) else "Suite"

            type_id, rate = type_data.get(type_name, (None, None))
            if type_id:
                cur.execute("""
                    UPDATE rooms SET room_type_id = %s, nightly_rate_usd = %s
                    WHERE id = %s
                """, (type_id, rate, room_id))
                updated += 1

        conn.commit()
        cur.close()
        release_connection(conn)
        logger.info(f"Room type assignments updated ({updated} rooms)")
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        logger.error(f"Error assigning room types: {e}")


def _seed_part_types():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM part_types")
        if cur.fetchone()[0] > 0:
            cur.close()
            release_connection(conn)
            return

        parts = [
            ("Batería AA", "consumible", "Pila AA recargable (4 por cerradura)", 20),
            ("Porta Pilas", "interno", "Contenedor de baterías, va en la cara interna", 10),
            ("Cilindro", "mecanico", "Donde se introduce la llave mecánica para apertura de emergencia", 8),
            ("Cara Externa (con lector)", "carcasa", "Cascarón externo con tarjeta lectora RFID y LED", 6),
            ("Cara Interna", "carcasa", "Cascarón interno con porta pilas y cuadrantes", 6),
            ("Goma Externa", "consumible", "Sello amortiguador entre cara externa y puerta", 20),
            ("Goma Interna", "consumible", "Sello amortiguador entre cara interna y puerta", 20),
            ("Cuadrante", "mecanico", "Rectángulo de metal con resorte, conecta manilla con galleta (2 por cerradura)", 30),
            ("Cuadrante Doble Lock", "mecanico", "Cuadrante pequeño para activar el doble lock con pasador", 15),
            ("Pasador Doble Lock", "mecanico", "Pasador de la cara interna que activa el doble lock", 15),
            ("Tarjeta Lectora (RFID+LED)", "electronico", "Placa con lector de tarjetas magnéticas y LED indicador", 8),
            ("Galleta (Cuerpo Central)", "mecanico", "Estructura principal de la cerradura dentro de la puerta", 5),
        ]
        part_ids = []
        for name, category, desc, stock_min in parts:
            cur.execute(
                "INSERT INTO part_types (name, category, description, stock_min) VALUES (%s, %s, %s, %s) RETURNING id",
                (name, category, desc, stock_min),
            )
            part_ids.append(cur.fetchone()[0])

        initial_stock = [
            (part_ids[0], 200),
            (part_ids[1], 10),
            (part_ids[2], 8),
            (part_ids[3], 6),
            (part_ids[4], 6),
            (part_ids[5], 20),
            (part_ids[6], 20),
            (part_ids[7], 30),
            (part_ids[8], 15),
            (part_ids[9], 15),
            (part_ids[10], 8),
            (part_ids[11], 5),
        ]
        for pid, qty in initial_stock:
            cur.execute(
                "INSERT INTO part_inventory (part_type_id, quantity) VALUES (%s, %s)",
                (pid, qty),
            )

        conn.commit()
        cur.close()
        release_connection(conn)
        logger.info(f"Part types seeded ({len(parts)} types with inventory)")
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        logger.error(f"Error seeding part types: {e}")


def _seed_lock_assets():
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


def _seed_printers_and_toners():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM printers")
        if cur.fetchone()[0] > 0:
            logger.info("Printers and toners already seeded, skipping")
            cur.close()
            release_connection(conn)
            return

        printers_data = [
            ("hotel", "propia", "HP", "LaserJet Pro M404dn", "SN-HP-M404-001", "red", "192.168.10.50", False, "Recepción", "operational"),
            ("hotel", "propia", "Epson", "EcoTank L3250", "SN-EP-L3250-002", "usb", None, True, "Oficina Administrativa", "operational"),
            ("corpo", "alquilada", "Brother", "HL-L2350DW", "SN-BR-L2350-001", "red", "192.168.20.30", False, "Corporativo Piso 2", "operational"),
            ("corpo", "propia", "Canon", "imageCLASS MF269dw", "SN-CN-MF269-001", "red", "192.168.20.35", True, "Corporativo Piso 1", "maintenance"),
        ]
        printer_ids = []
        for p in printers_data:
            cur.execute(
                "INSERT INTO printers (segment, ownership, brand, model, serial_number, connection_type, ip_address, has_scanner, location, status) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                p,
            )
            printer_ids.append(cur.fetchone()[0])

        toner_models_data = [
            ("85A (CE285A)", "Negro", "HP LaserJet Pro P1102, P1102w, M1212nf, M1217nfw"),
            ("105A (W1105A)", "Negro", "HP LaserJet Pro M404dn, M404n, M404dw"),
            ("Epson 664 Negro", "Negro", "Epson EcoTank L3250, L3251, L3256, L3260"),
            ("Epson 664 Cian", "Cian", "Epson EcoTank L3250, L3251, L3256, L3260"),
            ("Epson 664 Magenta", "Magenta", "Epson EcoTank L3250, L3251, L3256, L3260"),
            ("Epson 664 Amarillo", "Amarillo", "Epson EcoTank L3250, L3251, L3256, L3260"),
            ("Brother TN-760", "Negro", "Brother HL-L2350DW, HL-L2370DW, DCP-L2550DW"),
        ]
        toner_ids = []
        for t in toner_models_data:
            cur.execute(
                "INSERT INTO toner_models (model_name, color, compatible_printers) VALUES (%s, %s, %s) RETURNING id",
                t,
            )
            toner_ids.append(cur.fetchone()[0])

        inventory_data = [
            (toner_ids[0], "hotel", 4),
            (toner_ids[0], "corpo", 0),
            (toner_ids[1], "hotel", 6),
            (toner_ids[1], "corpo", 0),
            (toner_ids[2], "hotel", 5),
            (toner_ids[2], "corpo", 0),
            (toner_ids[3], "hotel", 3),
            (toner_ids[3], "corpo", 0),
            (toner_ids[4], "hotel", 3),
            (toner_ids[4], "corpo", 0),
            (toner_ids[5], "hotel", 3),
            (toner_ids[5], "corpo", 0),
            (toner_ids[6], "hotel", 0),
            (toner_ids[6], "corpo", 2),
        ]
        for tid, seg, qty in inventory_data:
            cur.execute(
                "INSERT INTO toner_inventory (toner_model_id, segment, quantity) VALUES (%s, %s, %s)",
                (tid, seg, qty),
            )

        admin_id = None
        cur.execute("SELECT id FROM users WHERE role_id = 1 LIMIT 1")
        admin_row = cur.fetchone()
        if admin_row:
            admin_id = admin_row[0]

        transactions_data = [
            (toner_ids[0], "hotel", "in", 5, None, admin_id, "Stock inicial - Compra proveedor"),
            (toner_ids[1], "hotel", "in", 8, None, admin_id, "Stock inicial - Compra proveedor"),
            (toner_ids[2], "hotel", "in", 6, None, admin_id, "Stock inicial - Compra proveedor"),
            (toner_ids[3], "hotel", "in", 4, None, admin_id, "Stock inicial - Compra proveedor"),
            (toner_ids[4], "hotel", "in", 4, None, admin_id, "Stock inicial - Compra proveedor"),
            (toner_ids[5], "hotel", "in", 4, None, admin_id, "Stock inicial - Compra proveedor"),
            (toner_ids[0], "hotel", "out", 1, printer_ids[0], admin_id, "Instalado en HP LaserJet - Recepción"),
            (toner_ids[1], "hotel", "out", 2, printer_ids[0], admin_id, "Cambio programado - LaserJet Recepción"),
            (toner_ids[2], "hotel", "out", 1, printer_ids[1], admin_id, "Recarga Epson EcoTank - Oficina"),
            (toner_ids[6], "corpo", "in", 3, None, admin_id, "Stock inicial corporativo - Compra"),
            (toner_ids[6], "corpo", "out", 1, printer_ids[2], admin_id, "Instalado en Brother HL-L2350DW - Corpo P2"),
        ]
        for tid, seg, ttype, qty, prt_id, user_id, notes in transactions_data:
            cur.execute(
                "INSERT INTO toner_transactions (toner_model_id, segment, type, quantity, printer_id, created_by, notes) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (tid, seg, ttype, qty, prt_id, user_id, notes),
            )

        conn.commit()
        cur.close()
        release_connection(conn)
        logger.info(f"Printers and toners seeded ({len(printer_ids)} printers, {len(toner_ids)} toner models, 11 transactions)")
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        logger.error(f"Error seeding printers and toners: {e}")


def _seed_tickets():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM tickets")
        if cur.fetchone()[0] > 0:
            logger.info("Tickets already seeded, skipping")
            cur.close()
            release_connection(conn)
            return

        admin_id = None
        cur.execute("SELECT id FROM users WHERE role_id = 1 LIMIT 1")
        admin_row = cur.fetchone()
        if admin_row:
            admin_id = admin_row[0]

        cur.execute("SELECT COUNT(*) FROM tickets")
        ticket_count = cur.fetchone()[0] or 0

        tickets_data = [
            ("TK-2026-0001", "hardware", "Impresora HP no enciende", "La impresora HP LaserJet de Recepción no responde al encenderla. Probé cambiar el cable de corriente y sigue sin funcionar.", "alta", "open", "Carlos Rodríguez", "Recepción", "Ext. 1001", "Recepción - Mostrador principal"),
            ("TK-2026-0002", "conectividad", "Sin acceso a internet en Corporativo", "Las PC del área de ventas corporativas (piso 2) no tienen conexión a internet desde las 8am. El WiFi se conecta pero sin acceso a la red.", "urgente", "in_progress", "María Gutiérrez", "Corporativo", "Ext. 2005", "Corpo - Piso 2, escritorio 3"),
            ("TK-2026-0003", "software", "Error al abrir el sistema HMR", "Me sale un error 'Connection refused' cuando intento abrir el sistema en mi PC. Ya reinicié el navegador y la PC.", "media", "in_progress", "Juan Hernández", "Administración", "Ext. 3002", "Oficina Administrativa"),
            ("TK-2026-0004", "hardware", "Teclado no funciona correctamente", "El teclado de la PC de Housekeeping no registra algunas teclas. La letra 'a' y el número '5' fallan constantemente.", "baja", "open", "Ana Díaz", "Housekeeping", "Ext. 4001", "Housekeeping - Oficina central"),
            ("TK-2026-0005", "conectividad", "Teléfono IP sin línea", "El teléfono de la extensión 3005 no tiene tono desde ayer. Ya probé desconectar y reconectar el cable de red.", "alta", "open", "Pedro Martínez", "Administración", "Ext. 3005", "Admin - Contabilidad"),
            ("TK-2026-0006", "software", "Actualización de antivirus pendiente", "Varias PCs del área de Recepción muestran alertas del antivirus desactualizado. Solicito actualización urgente.", "media", "resolved", "Laura Torres", "Recepción", "Ext. 1003", "Recepción - Back office"),
            ("TK-2026-0007", "hardware", "Monitor parpadea constantemente", "El monitor de la PC de Gerencia parpadea cada 5-10 minutos. Probé otro cable de video y persiste el problema.", "media", "resolved", "Diego Ruiz", "Gerencia", "Ext. 5001", "Gerencia General"),
            ("TK-2026-0008", "otro", "Solicitud de nuevo punto de red", "Necesitamos instalar un punto de red adicional en la nueva oficina de RRHH (piso 3). Se requiere cableado y switch.", "baja", "closed", "Camila Vargas", "RRHH", "Ext. 6001", "RRHH - Piso 3"),
        ]

        ticket_ids = []
        for t in tickets_data:
            cur.execute(
                "INSERT INTO tickets (ticket_number, category, title, description, priority, status, submitted_by_name, submitted_by_department, submitted_by_contact, pc_location) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                t,
            )
            ticket_ids.append(cur.fetchone()[0])

        if admin_id:
            cur.execute("UPDATE tickets SET assigned_to = %s WHERE id IN (%s, %s, %s)",
                        (admin_id, ticket_ids[1], ticket_ids[2], ticket_ids[5]))
            cur.execute("UPDATE tickets SET assigned_to = %s, created_by = %s WHERE id = %s",
                        (admin_id, admin_id, ticket_ids[6]))
            cur.execute("UPDATE tickets SET assigned_to = %s, resolved_at = NOW(), created_by = %s WHERE id IN (%s, %s)",
                        (admin_id, admin_id, ticket_ids[5], ticket_ids[6]))
            cur.execute("UPDATE tickets SET assigned_to = %s, resolved_at = NOW(), created_by = %s WHERE id = %s",
                        (admin_id, admin_id, ticket_ids[7]))

        comments_data = [
            (ticket_ids[0], None, "Carlos Rodríguez", "Ya verifiqué el cable de corriente y el enchufe. Sigue sin responder.", False),
            (ticket_ids[1], admin_id, "Admin Sistema", "Recibido. Voy a revisar el switch del piso 2. Mientras tanto, ¿pueden usar los datos móviles?", False),
            (ticket_ids[1], None, "María Gutiérrez", "Sí, estamos con datos móviles por ahora. Gracias.", False),
            (ticket_ids[2], admin_id, "Admin Sistema", "Revisando logs del servidor. El servicio parece estar caído. Voy a reiniciarlo.", False),
            (ticket_ids[2], admin_id, "Admin Sistema", "Nota interna: posible error de memoria en el contenedor de backend.", True),
            (ticket_ids[5], admin_id, "Admin Sistema", "Antivirus actualizado en las 3 PCs de Recepción. Marcando como resuelto.", False),
            (ticket_ids[6], admin_id, "Admin Sistema", "Monitor reemplazado. Era falla del panel. Se instaló monitor de respaldo.", False),
            (ticket_ids[7], admin_id, "Admin Sistema", "Punto de red instalado y verificado. Ticket cerrado.", False),
        ]
        for tid, uid, aname, text, internal in comments_data:
            cur.execute(
                "INSERT INTO ticket_comments (ticket_id, user_id, author_name, comment_text, is_internal) VALUES (%s, %s, %s, %s, %s)",
                (tid, uid, aname, text, internal),
            )

        conn.commit()
        cur.close()
        release_connection(conn)
        logger.info(f"Tickets seeded ({len(ticket_ids)} tickets, {len(comments_data)} comments)")
    except Exception as e:
        conn.rollback()
        release_connection(conn)
        logger.error(f"Error seeding tickets: {e}")


