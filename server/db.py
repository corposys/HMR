"""
Database connection and initialization for HMR.
Uses psycopg2 with a connection pool.
"""
import os
import json
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
            category    VARCHAR(20) NOT NULL CHECK (category IN ('battery', 'mechanical')),
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS lock_assets (
            id            SERIAL PRIMARY KEY,
            room_id       INTEGER NOT NULL UNIQUE REFERENCES rooms(id) ON DELETE CASCADE,
            code          VARCHAR(40) UNIQUE,
            status        VARCHAR(20) NOT NULL DEFAULT 'operational'
                CHECK (status IN ('operational', 'preventive', 'failure', 'out_of_service')),
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


def _run_migrations(cur):
    cur.execute("ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS lock_asset_id INTEGER REFERENCES lock_assets(id) ON DELETE SET NULL")
    cur.execute("ALTER TABLE lock_assets ADD COLUMN IF NOT EXISTS code VARCHAR(40) UNIQUE")
    cur.execute("ALTER TABLE lock_assets ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'preventive', 'failure', 'out_of_service'))")
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

    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'rooms' AND column_name = 'room_category_id'
    """)
    if cur.fetchone():
        cur.execute("ALTER TABLE rooms RENAME COLUMN room_category_id TO category")
        logger.info("Migrated rooms.room_category_id -> rooms.category")


def _seed_all():
    _seed_roles()
    _seed_user_role_migration()
    _seed_hotel_settings()
    _seed_room_types()
    _seed_reservation_plans()
    _seed_bcv_rates()
    _seed_hotel_structure()
    _seed_room_type_assignments()
    _seed_part_types()
    _seed_lock_assets()


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
            "maintenance": {"read": True, "write": False},
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
            "maintenance": {"read": True, "write": False},
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
            ("Individual", "Habitación para 1 huésped", 1, 35.00),
            ("Doble", "Habitación para 2 huéspedes", 2, 50.00),
            ("Triple", "Habitación para 3 huéspedes", 3, 65.00),
            ("Suite", "Suite con sala y vista", 4, 90.00),
        ]
        for name, desc, max_occ, rate in types:
            cur.execute(
                "INSERT INTO room_types (name, description, max_occupancy, default_rate_usd) VALUES (%s, %s, %s, %s) ON CONFLICT (name) DO NOTHING",
                (name, desc, max_occ, rate),
            )

        conn.commit()
        cur.close()
        release_connection(conn)
        logger.info("Room types seeded (4 types)")
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

        type_map = {0: (2, 50.00), 1: (1, 35.00), 2: (3, 65.00), 3: (4, 90.00)}

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
                    type_id, rate = type_map[room_seq - 1]
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
        cur.execute("SELECT COUNT(*) FROM rooms WHERE room_type_id IS NULL")
        null_count = cur.fetchone()[0]
        if null_count == 0:
            cur.close()
            release_connection(conn)
            return

        type_assignments = {
            "Individual": (1, 35.00),
            "Doble": (2, 50.00),
            "Triple": (3, 65.00),
            "Suite": (4, 90.00),
        }

        cur.execute("SELECT id, name FROM room_types")
        types_in_db = {name: type_id for type_id, name in cur.fetchall()}

        for type_name, (expected_id, rate) in type_assignments.items():
            type_id = types_in_db.get(type_name, expected_id)

        cur.execute("""
            UPDATE rooms SET room_type_id = %s, nightly_rate_usd = %s
            WHERE room_type_id IS NULL AND id %% 4 = 1
        """, (types_in_db.get("Individual", 1), 35.00))
        cur.execute("""
            UPDATE rooms SET room_type_id = %s, nightly_rate_usd = %s
            WHERE room_type_id IS NULL AND id %% 4 = 2
        """, (types_in_db.get("Doble", 2), 50.00))
        cur.execute("""
            UPDATE rooms SET room_type_id = %s, nightly_rate_usd = %s
            WHERE room_type_id IS NULL AND id %% 4 = 3
        """, (types_in_db.get("Triple", 3), 65.00))
        cur.execute("""
            UPDATE rooms SET room_type_id = %s, nightly_rate_usd = %s
            WHERE room_type_id IS NULL AND id %% 4 = 0
        """, (types_in_db.get("Suite", 4), 90.00))

        remaining = cur.execute("""
            UPDATE rooms SET room_type_id = 2, nightly_rate_usd = 50.00
            WHERE room_type_id IS NULL
        """)

        conn.commit()
        cur.close()
        release_connection(conn)
        logger.info("Room type assignments updated")
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