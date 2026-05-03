# AGENTS.md — HMR (Hotel Margarita Real)

## Stack

React 19 + Vite 7 frontend, FastAPI (Python) backend, PostgreSQL 15. Docker Compose runs all three services.

## Commands

| Command | What it does |
|---|---|
| `docker compose up -d --build` | Dev environment (Vite :5173, FastAPI :8000, Postgres :15432) |
| `docker compose down` | Stop dev environment |
| `docker compose -f docker-compose.prod.yml up -d --build` | Production build (Nginx :80) |

**No test framework.** Do not run `npm test` or `pytest`.

## Vite proxy gotcha

`vite.config.js` proxies `/api` to `http://hmr-backend:8000`. This hostname resolves inside Docker but **not** on the host. When running `npm run dev` natively, either:
- Run `docker compose up -d postgres hmr-backend` for the backend containers, then change the proxy target to `http://localhost:8000`, or
- Work exclusively inside Docker (`docker compose up`)

## Architecture

### Frontend (`src/`)

- **Feature modules** in `src/features/<domain>/` — each has `pages/` and `components/` subdirectories
- Domains: `auth`, `dashboard`, `housekeeping`, `maintenance`, `reception`, `security`, `settings`, `signatures`
- **Shared** in `src/shared/` — `common/` (Button, Card, CustomDropdown, ProtectedRoute, StatCard) and `layout/` (Layout, Sidebar, Navbar, Footer)
- **Routes** defined in `src/app/routes/` — `publicRoutes.jsx`, `protectedRoutes.jsx`, `fallbackRoute.jsx`, barrel `index.jsx`
  - All page components are **lazy-loaded** with `React.lazy()`
  - Protected routes are nested under `ProtectedRoute` + `Layout`
- **Contexts** in `src/context/` — `AuthContext.jsx` (JWT auth state + `useAuth()` hook), `ToastContext.jsx`
- **Design system** — dark theme with CSS custom properties defined via Tailwind v4 `@theme` block in `src/index.css`. Utility classes: `.card`, `.card-elevated`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.input`, `.table`, `.badge-*`, `.stat-card`. Use these before creating new ones.

### Backend (`server/`)

- **Entrypoint**: `server/main.py` — FastAPI app, CORS for localhost:5173, 4 routers mounted at startup
- **Routers**: `routes/auth.py` (`/api/auth`), `routes/signatures.py`, `routes/structure.py`, `routes/maintenance.py` — all prefixed with `/api`
- **Auth**: JWT via `middleware/auth.py` — `create_token()`, `verify_token()`, `get_current_user` (FastAPI Depends). Bearer token in Authorization header. Token stored in localStorage on frontend.
- **DB access pattern** (no ORM):
  ```python
  conn = get_connection()
  try:
      cur = conn.cursor()
      cur.execute("SELECT ...")
      # manual commit/rollback
      conn.commit()
  finally:
      cur.close()
      release_connection(conn)
  ```
- **DB init**: `db.py` `init_db()` runs on startup — `CREATE TABLE IF NOT EXISTS` + inline `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` migrations. Also seeds: property, 6 modules, 24 floors, 96 rooms, 5 part types, lock assets.
- **Error messages are in Spanish** (e.g., `"Credenciales inválidas"`, `"Todos los campos son requeridos"`)

## Import aliases

Configured in `vite.config.js` and `jsconfig.json`:

- `@/` → `src/`
- `@app/` → `src/app/`
- `@features/` → `src/features/`
- `@shared/` → `src/shared/`
- `@context/` → `src/context/`
- `@utils/` → `src/utils/`

**Always use aliases.** Never write relative imports like `../../../components`.

## Conventions

- **No TypeScript** — `.jsx`/`.js` only
- **Tailwind CSS v4** — `@tailwindcss/vite` plugin, no `tailwind.config.js`. Theme vars in `src/index.css` `@theme` block
- **No ORM** — raw SQL via psycopg2 connection pool (`db.py`)
- **ESLint** — `no-unused-vars` rule ignores vars matching `^[A-Z_]` (unused React component names are fine)
- **Backend volumes** — `docker-compose.yml` mounts `./server:/app` so backend code edits trigger uvicorn `--reload`

## Environment variables

Defaults are in `docker-compose.yml` / `docker-compose.prod.yml`:

| Variable | Default | Purpose |
|---|---|---|
| `DB_HOST` | `postgres` | Postgres host (container name) |
| `DB_PORT` | `5432` | Postgres port (internal) |
| `DB_USER` | `hmr` | Postgres user |
| `DB_PASSWORD` | `hmr_secret` | Postgres password |
| `DB_NAME` | `hmr_db` | Database name |
| `JWT_SECRET` | `hmr-jwt-secret-change-in-production` | JWT signing key |
| `VITE_PORT` | `5173` | Vite dev server port |

`.env` is gitignored. Override defaults via `.env` file or environment.

## CI / Deploy

- Self-hosted GitHub Actions runner, triggers on push to `main`
- Runs `docker compose -f docker-compose.prod.yml up -d --build --remove-orphans`
- Prunes old Docker images after deploy
- Production: Nginx serves frontend on :80, proxies `/api` to FastAPI backend