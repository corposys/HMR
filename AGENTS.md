# AGENTS.md — HMR (Hotel Margarita Real)

## Stack

React 19 + Vite 7 frontend, FastAPI (Python) backend, PostgreSQL 15. Docker Compose runs all three services.

## Commands

| Command | What it does |
|---|---|
| `docker compose up -d --build` | Dev environment (Vite :5173, FastAPI :8000, Postgres :15432) |
| `docker compose down` | Stop dev environment |
| `docker compose -f docker-compose.prod.yml up -d --build` | Production build (Nginx :80) |
| `npm run lint` | ESLint check |
| `npm run build` | Vite production build (verify before claiming work is done) |

**No test framework.** Do not run `npm test` or `pytest`.

After any frontend change, run `npm run lint` then `npm run build` to verify. The CI pipeline does `npm ci && npm run lint && npm run build` before deploying.

## Vite proxy gotcha

`vite.config.js` proxies `/api` to `http://hmr-backend:8000`. This hostname resolves inside Docker but **not** on the host. When running `npm run dev` natively, either:
- Run `docker compose up -d postgres hmr-backend` for the backend containers, then change the proxy target to `http://localhost:8000`, or
- Work exclusively inside Docker (`docker compose up`)

## Architecture

### Frontend (`src/`)

- **Feature modules** in `src/features/<domain>/` — each has `pages/` and `components/` subdirectories
- Domains: `auth`, `dashboard`, `housekeeping`, `maintenance`, `security`, `reception`, `settings`, `signatures`
- **Shared** in `src/shared/` — `common/` and `layout/`
  - `common/`: `Alert`, `Badge`, `Button`, `Card`, `CustomDropdown`, `DataTable`, `EmptyState`, `ErrorBoundary`, `ErrorState`, `Input`, `LoadingSpinner`, `Modal`, `PageWrapper`, `ProtectedRoute`, `StatCard`, `Tabs`, `ToggleSwitch`
  - `layout/`: `Layout`, `Sidebar`, `Navbar`, `Footer`
- **Routes** defined in `src/app/routes/` — lazy-loaded via `React.lazy()`, protected routes nested under `ProtectedRoute` + `Layout`
- **Contexts** in `src/context/` — `AuthContext.jsx` (JWT auth, `useAuth()` hook, exported `AuthContext`), `ToastContext.jsx`
- **Hooks** in `src/hooks/` — `usePermissions()` (RBAC from `AuthContext`), `useSettings()` (hotel settings from API + `DEFAULT_SETTINGS` fallback)
- **Utils** in `src/utils/` — `api.js` (auth-aware fetch wrapper), `constants.js` (all domain constants), `formatters.js` (date/currency), `imageCompressor.js`

### Backend (`server/`)

- **Entrypoint**: `server/main.py` — FastAPI app with CORS, lifespan calls `init_db()`, mounts 7 routers + `/uploads` static files
- **Routers** in `server/routes/`: `auth`, `signatures`, `structure`, `maintenance`, `reception`, `settings`, `roles` — all prefixed with `/api`
- **Auth**: JWT via `middleware/auth.py` — `create_token()`, `verify_token()`, `get_current_user` (Depends), `require_permission(resource, action)` (Depends). Admin (role_id=1) bypasses all permission checks.
- **Services**: `services/invoicing.py` — `InternalControlAdapter` generates `CTRL-XXXXX` control numbers; adapter pattern for future fiscal integration
- **DB access pattern** (no ORM):
  ```python
  conn = get_connection()
  try:
      cur = conn.cursor()
      cur.execute("SELECT ...")
      conn.commit()  # or rollback on error
  finally:
      cur.close()
      release_connection(conn)
  ```
  There's also a `get_db()` context manager that auto-rollbacks on exception.
- **DB init**: `db.py` `init_db()` runs on startup — `CREATE TABLE IF NOT EXISTS` + inline `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` migrations + seeds (property, 6 modules, 24 floors, 96 rooms, 5 part types, lock assets, roles, hotel_settings)
- **Error messages are in Spanish** (e.g., `"Credenciales inválidas"`, `"Sin permisos para esta acción"`)
- **Uploads**: Payment proof images go to `server/uploads/payments/`, served at `/uploads/`

### DB schema highlights

- `hotel_settings`: key-value with `category`, `value_type`, `label` — avoids schema migrations for config
- `guests`: has nullable `fiscal_name`, `fiscal_id`, `fiscal_address` for guest≠fiscal entity separation
- `folios`: `control_number` (CTRL-XXXXX), `profit_plus_ref`, nullable `fiscal_receipt_number`/`fiscal_machine_serial`
- `payments`: desgregated amounts — `subtotal_base`, `tax_iva`, `igtf_applied`, `igtf_amount_usd`
- `bcv_rates`: manual rate entry with `source` field; `reception.py` reads latest rate via `_get_bcv_rate()`
- `roles.permissions`: JSONB column; `require_permission()` checks it at runtime

## Import aliases

Configured in `vite.config.js` and `jsconfig.json`:

- `@/` → `src/`
- `@app/` → `src/app/`
- `@features/` → `src/features/`
- `@shared/` → `src/shared/`
- `@context/` → `src/context/`
- `@utils/` → `src/utils/`
- `@hooks/` → `src/hooks/`

**Always use aliases.** Never write relative imports like `../../../components`.

## Conventions

- **No TypeScript** — `.jsx`/`.js` only
- **No comments** unless explicitly requested
- **Tailwind CSS v4** — `@tailwindcss/vite` plugin, no `tailwind.config.js`. Theme vars in `src/index.css` `@theme` block
- **Design system**: Use existing utility classes (`.card`, `.card-elevated`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.input`, `.table`, `.badge-*`, `.stat-card`) before creating new ones. All CSS custom properties use `var(--color-*)`, `var(--radius-*)`, etc.
- **Shared component API patterns**:
  - `Button`: `variant` (`primary`/`secondary`/`ghost`/`danger`), `size` (`sm`/`md`/`lg`), `icon` (Lucide component), `loading` (bool)
  - `Modal`: `isOpen`, `onClose`, `title`, `icon` (Lucide), `size` (`sm`/`md`/`lg`/`xl`), `footer`
  - `Badge`: `variant` (`primary`/`success`/`warning`/`danger`/`info`) — not raw Tailwind classes
  - `DataTable`: `columns` (array of `{key, header, render?}`), `data`, `loading`, `emptyText`, `onRowClick`
  - `CustomDropdown`: `value`, `onChange`, `options` (array of `{value, label}`), `placeholder`
  - `Input`: `label`, `icon` (Lucide), `error`; uses `forwardRef`
- **RBAC on frontend**: `usePermissions()` returns `{ can, isAdmin, permissions, ... }`. Use `can(resource, action)` to gate UI. Backend uses `require_permission(resource, action)` as FastAPI Depends.
- **Permission resources**: `settings`, `users`, `reception`, `guests`, `rooms`, `housekeeping`, `maintenance`, `reports`, `financial`
- **Permission actions**: `read`, `write`, `delete` (some resources have `block`, `close_folio`, `verify_payment`, `update_status`)
- **No ORM** — raw SQL via psycopg2 connection pool (`db.py`)
- **ESLint** — `no-unused-vars` rule ignores vars matching `^[A-Z_]` (unused React component names are fine)
- **Backend volumes** — `docker-compose.yml` mounts `./server:/app` so backend code edits trigger uvicorn `--reload`
- **All user-facing strings in Spanish**

## API patterns

Frontend uses `apiFetch` / `apiJson` from `@utils/api` — auto-adds Bearer token, auto-redirects on 401.

Backend endpoints return:
- `GET` list: `{ items: [...], total: N }` or `{ <resource>: [...] }`
- `GET` single: `{ <resource>: {...} }`
- `POST` create: `{ success: True, <resource>: {...} }`
- `PUT` update: `{ success: True }` or `{ success: True, <resource>: {...} }`
- `DELETE`: `{ success: True, message: "..." }`
- Errors: `{ detail: "Spanish error message" }` with appropriate HTTP status

## Environment variables

Defaults in `docker-compose.yml` / `docker-compose.prod.yml`:

| Variable | Default | Purpose |
|---|---|---|
| `DB_HOST` | `postgres` | Postgres host (container name) |
| `DB_PORT` | `5432` | Postgres port (internal) |
| `DB_USER` | `hmr` | Postgres user |
| `DB_PASSWORD` | `hmr_secret` | Postgres password |
| `DB_NAME` | `hmr_db` | Database name |
| `JWT_SECRET` | (required, no default) | JWT signing key (CI uses GitHub secret) |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed origins |

`.env` is gitignored. Override via `.env` file or environment.

## CI / Deploy

- Self-hosted GitHub Actions runner on `main` branch push
- CI pipeline: `npm ci` → `npm run lint` → `npm run build` → verify `dist/` exists
- Deploy: `docker compose -f docker-compose.prod.yml up -d --build --remove-orphans`
- Production: Nginx serves frontend on :80, proxies `/api` to FastAPI backend, `try_files` SPA fallback
- Rollback on failure: `docker compose -f docker-compose.prod.yml down`
- Working branch: `feature/reception-module`

## Dev workflow

- `docker compose up -d --build` brings up all services
- Backend logs: `docker compose logs hmr-backend -f`
- Frontend logs: `docker compose logs hmr-app -f`
- DB access from host: `psql -h localhost -p 15432 -U hmr -d hmr_db` (password: `hmr_secret`)
- Admin user seeded: `admin@hmr.com` / `admin1234` (role_id=1, full permissions)
- Health check: `GET /api/health`
- `src/utils/constants.js` holds all domain enums/defaults — check it before hardcoding values