# AGENTS.md — HMR (Hotel Margarita Real)

## Project overview

Full-stack hotel management system: **React 19 + Vite 7** frontend, **FastAPI (Python)** backend, **PostgreSQL 15** database. All three services run via Docker Compose.

## Developer commands

| Command | What it does |
|---|---|
| `docker compose up -d --build` | Start dev environment (Vite hot-reload on :5173, FastAPI on :8000, Postgres on :15432) |
| `docker compose down` | Stop dev environment |
| `docker compose -f docker-compose.prod.yml up -d --build` | Production mode (Nginx serves frontend on :80) |
| `docker compose -f docker-compose.prod.yml down` | Stop production environment |
| `npm run dev` | Frontend only (requires backend running separately via Docker) |
| `npm run build` | Production Vite build → `dist/` |
| `npm run lint` | ESLint (flat config) |
| `npm run preview` | Preview production build locally |

**There is no test framework configured.** Do not try to run `npm test` or `pytest`.

## Architecture boundaries

### Frontend (`src/`)

| Directory | Purpose |
|---|---|
| `src/features/<domain>/` | Feature modules (auth, dashboard, housekeeping, maintenance, reception, security, settings, signatures) |
| `src/shared/` | Reusable components (`common/`) and shell layout (`layout/`) |
| `src/app/routes/` | Route definitions — `publicRoutes.jsx`, `protectedRoutes.jsx`, `fallbackRoute.jsx`, barrel `index.jsx` |
| `src/context/` | `AuthContext.jsx` (JWT state), `ToastContext.jsx` |
| `src/utils/` | `formatters.js` |
| `src/main.jsx` | React entrypoint |
| `src/App.jsx` | Router root — wraps protected routes in `Layout` and `ProtectedRoute` |

### Backend (`server/`)

| File/Directory | Purpose |
|---|---|
| `server/main.py` | FastAPI entrypoint, mounts 4 routers |
| `server/db.py` | psycopg2 connection pool, `init_db()` creates tables + seeds data on startup |
| `server/routes/` | `auth.py`, `signatures.py`, `structure.py`, `maintenance.py` |
| `server/requirements.txt` | Python deps (no ORM — raw SQL with psycopg2) |

## Import aliases

Configured in both `vite.config.js` and `jsconfig.json`:

- `@/` → `src/`
- `@app/` → `src/app/`
- `@features/` → `src/features/`
- `@shared/` → `src/shared/`
- `@context/` → `src/context/`
- `@utils/` → `src/utils/`

Use these aliases — do not write relative imports like `../../../components`.

## Key conventions

- **No TypeScript** — `.jsx`/`.js` only, validated via ESLint (flat config)
- **Tailwind CSS v4** — uses `@tailwindcss/vite` plugin (no separate `tailwind.config.js`)
- **No ORM** — backend uses raw SQL via psycopg2 with a connection pool
- **DB auto-initializes** — tables created + seed data (property, modules, floors, rooms, part types, lock assets) on FastAPI startup
- **Vite dev proxy** — `/api` requests proxied to `http://hmr-backend:8000` inside Docker. Running `npm run dev` natively requires backend containers for API calls
- **ESLint rule** — unused vars starting with uppercase (`^[A-Z_]`) are ignored (e.g. unused React component names)

## CI / Deploy

- Self-hosted GitHub Actions runner
- Triggered on push to `main`
- Deploys via `docker-compose.prod.yml` (production build, Nginx on port 80)
- Prunes old Docker images after deploy
