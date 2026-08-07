# AGENTS.md — HMR (Hotel Margarita Real)

## Stack

React 19 + Vite 7 + Tailwind CSS v4 + React Router v7 | FastAPI + PostgreSQL | Docker Compose

## Commands

| Command | What |
|---|---|
| `docker compose up -d` | Start dev containers (postgres + backend + app) |
| `docker compose up -d --build` | Rebuild + start dev |
| `docker compose logs -f` | Live logs |
| `docker compose down` | Stop containers |
| `docker compose -f docker-compose.prod.yml up -d --build` | Start production |
| `npm run lint && npm run build` | CI frontend verification |
| `npm run dev` | Native Vite dev (see proxy note) |

**No test framework.** Skip all `npm test`, `pytest`.

**Dev compose service names:** `postgres`, `backend`, `app` (used for internal DNS). No npm docker scripts.

## Vite proxy

`vite.config.js` proxies `/api` → `http://backend:8000` (works inside Docker only). To run `npm run dev` natively: keep backend containers running, change proxy target to `http://localhost:8000`.

## Architecture

### Frontend (`src/`)
- 14 feature modules: `src/features/<domain>/` — pages + components per domain
- Routing: `src/app/routes/` — lazy-loaded, `ProtectedRoute` + `Layout`
- Contexts: `AuthContext.jsx` (JWT in localStorage), `ToastContext.jsx`, `ThemeContext.jsx`
- Shared components: `src/shared/common/` — `PageWrapper`, `Button`, `Modal`, `DataTable`, `LoadingSpinner`, `EmptyState`, `ErrorState`, `Card`, `Tabs`, `CustomDropdown`, `Input`, `Alert`, `Badge`, `StatCard`, `ToggleSwitch`, `WhatsAppButton`, `ProtectedRoute`, `ErrorBoundary`. **Use these before creating new ones.**
- Hooks: `usePermissions()` (RBAC), `useSettings()` (hotel config), `useSeasons()`, `useRates()`, `useQuote()`, `useOccupancyConfigs()`
- shadcn configured via `components.json` — 8 generated UI primitives in `src/components/ui/` (button, badge, card, dialog, separator, table, tabs, tooltip). Uses `@/lib/utils` (`cn()` helper) which is a `.ts` file (Vite transpiles it, project is otherwise `.jsx`/`.js`).
- Constants: `src/utils/constants.js` — check before hardcoding
- API client: `apiFetch`/`apiJson` from `@utils/api` — auto-attaches Bearer token, 401 redirects to `/login`

### Backend (`server/`)
- Entrypoint: `server/main.py` — FastAPI, CORS, mounts 13 routers under `/api` + `/uploads`
- No ORM: raw psycopg2, `SimpleConnectionPool(1, 10)` in `db.py`. Schema + seed data in same file.
- On startup `init_db()` creates tables and seeds: roles (6), settings (27), room types (6), hotel structure (96 rooms), demo data (25 guests, ~33 reservations)
- Rate limiting: **in-memory only** (resets on restart). Login: 10/min, register: 5/5min.
- Dev hot reload enabled via `./server:/app` volume + uvicorn `--reload`

## Import aliases

```js
'@/' → 'src/'     '@app/' → 'src/app/'     '@features/' → 'src/features/'
'@shared/' → 'src/shared/'   '@context/' → 'src/context/'
'@utils/' → 'src/utils/'     '@hooks/' → 'src/hooks/'
'@components/' → 'src/components/'
```
**Always use these. Never relative paths.**

## Conventions

- **No TypeScript** — `.jsx`/`.js` only (exception: `src/lib/utils.ts` is TypeScript, used by shadcn components; Vite handles it)
- **No comments** in code unless explicitly asked
- **Spanish everywhere** — UI strings and backend `{ detail: "..." }` errors
- **Tailwind CSS v4** — no `tailwind.config.js`, theme variables in `src/index.css` via `@theme {}` directive; CSS custom properties under `:root` (light) / `.dark` (dark)
- **ESLint flat config** — `eslint.config.js`, `no-unused-vars` ignores `^[A-Z_]`
- **No ORM/migrations** — raw SQL, all schema in `server/db.py` with `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`

## RBAC

Frontend: `usePermissions()` returns `{ can, isAdmin }`. Gate UI with `can(resource, action)`. 9 resources: settings, users, reception, guests, rooms, housekeeping, maintenance, reports, financial.
Backend: `require_permission(resource, action)` FastAPI dependency. Admin (`role_id=1`) bypasses all checks. Permissions stored as JSON in `roles.permissions`.

## API patterns

Frontend: `apiFetch`/`apiJson` from `@utils/api` — native `fetch` wrapper (not axios despite axios being a dependency).

Backend responses:
- `GET` list: `{ items: [...] }` or `{ <resource>: [...] }`
- `GET` single: `{ <resource>: {...} }`
- `POST`/`PUT`: `{ success: True, ... }`
- `DELETE`: `{ success: True, message: "..." }`
- Errors: `{ detail: "..." }` with HTTP status

## Key env vars

`.env` is gitignored. Copy from `.env.example`. Note: `DB_HOST` and `DB_PORT` are not in `.env.example`; they default to `postgres` / `5432` in `server/db.py`.

| Var | Default | Notes |
|---|---|---|
| `DB_HOST` | `postgres` | Docker container name |
| `DB_PORT` | `5432` | Internal |
| `DB_USER` | `hmr` | — |
| `DB_PASSWORD` | `hmr_secret` | — |
| `DB_NAME` | `hmr_db` | — |
| `JWT_SECRET` | (required) | CI injects via GitHub secret |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | — |

## Dev tips

- Docker health: `GET /api/health` returns `{ success: True, status: "ok", service: "hmr-backend" }`
- Seeded admin: `admin@hmr.com` / `admin1234` (`role_id=1`)
- PG from host: `psql -h localhost -p 5432 -U hmr -d hmr_db` (pass: `hmr_secret`); port is `127.0.0.1` only
- Logs: `docker compose logs backend -f`, `docker compose logs app -f`
- Docker dev: code is volume-mounted (hot reload). `node_modules`/Python deps stay in containers.
- Dockerfiles: `Dockerfile` (Vite dev) / `Dockerfile.prod` (nginx) for frontend; `server/Dockerfile` (uvicorn `--reload`) / `server/Dockerfile.prod` for backend
- Windows Docker: `CHOKIDAR_USEPOLLING=true` is set in `docker-compose.yml` for file watching
- Prod Nginx listens on `8080` internally, mapped to host `80` (lets it run as non-root)

## Theme (Dark/Light Mode)

Toggle button in `Navbar.jsx` (Sun/Moon icons). Preference persisted in `localStorage` key `theme`. Detects system preference on first load. Implementation:
- `ThemeContext` (`src/context/ThemeContext.jsx`) adds/removes `.dark` class on `<html>`
- CSS variables in `src/index.css` use `:root` for light, `.dark` override for dark

## Locks Module (`/systems/rooms`)

- Frontend routes: `/systems/rooms` (rack), `/systems/room/:id` (detail/timeline)
- Backend API: endpoints are under `/api/maintenance/locks/*` (not `/api/systems/`)
- `LocksRackPage` uses tabs navigation (like RackOperativo); `LockSummaryCard` mirrors `RackRoomCard` styling
- Data via `useLocksOverview` hook → `useLockRackData` for grouping
