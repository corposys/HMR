# AGENTS.md — HMR (Hotel Margarita Real)

## Stack

React 19 + Vite 7 + Tailwind CSS v4 | FastAPI + PostgreSQL | Docker Compose

## Commands

| Command | What |
|---|---|
| `npm run docker:build` | Build images (no cache) |
| `npm run docker:up` | Start containers |
| `npm run docker:verify` | Health check (requires bash — fails on Windows) |
| `npm run docker:logs` | Live logs |
| `npm run docker:down` | Stop containers |
| `npm run lint && npm run build` | CI frontend verification |
| `npm run dev` | Native Vite dev (see proxy note) |

**No test framework.** Skip all `npm test`, `pytest`.

## Vite proxy

`vite.config.js` proxies `/api` → `http://hmr-backend:8000` (works inside Docker only). To run `npm run dev` natively: keep backend containers running, change proxy target to `http://localhost:8000`.

## Architecture

### Frontend (`src/`)
- Feature modules: `src/features/<domain>/` (pages + components)
- Routing: `src/app/routes/` — lazy-loaded, `ProtectedRoute` + `Layout`
- Contexts: `AuthContext.jsx` (JWT in localStorage), `ToastContext.jsx`
- Hooks: `usePermissions()` (RBAC), `useSettings()` (hotel config)
- shadcn configured via `components.json` but **no generated shadcn files** — custom components only
- Constants: `src/utils/constants.js` — check before hardcoding

### Backend (`server/`)
- Entrypoint: `server/main.py` — FastAPI, CORS, mounts 11 routers under `/api` + `/uploads`
- No ORM: raw psycopg2, `SimpleConnectionPool(1, 10)` in `db.py`. Schema + seed data in same file.
- On startup `init_db()` creates tables and seeds: roles (6), settings (27), room types (6), hotel structure (96 rooms), demo data (25 guests, ~33 reservations)
- Rate limiting: **in-memory only** (resets on restart). Login: 10/min, register: 5/5min.
- Dev hot reload enabled via `./server:/app` volume + uvicorn `--reload`

## Import aliases

```js
'@/' → 'src/'     '@app/' → 'src/app/'     '@features/' → 'src/features/'
'@shared/' → 'src/shared/'   '@context/' → 'src/context/'
'@utils/' → 'src/utils/'     '@hooks/' → 'src/hooks/'
```
**Always use these. Never relative paths.**

## Conventions

- **No TypeScript** — `.jsx`/`.js` only (despite `ts` files in `src/lib/`)
- **No comments** in code unless explicitly asked
- **Spanish everywhere** — UI strings and backend `{ detail: "..." }` errors
- **Tailwind CSS v4** — no `tailwind.config.js`, theme variables in `src/index.css` `@theme` directive
- **ESLint flat config** — `eslint.config.js`, `no-unused-vars` ignores `^[A-Z_]`
- **No ORM/migrations** — raw SQL, all schema in `server/db.py` with `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`

## RBAC

Frontend: `usePermissions()` returns `{ can, isAdmin }`. Gate UI with `can(resource, action)`.
Backend: `require_permission(resource, action)` FastAPI dependency. Admin (`role_id=1`) bypasses all checks.
6 seeded roles mapped to 9 resources with read/write/delete + action-specific permissions.

## API patterns

Frontend: `apiFetch`/`apiJson` from `@utils/api` — auto-attaches Bearer token, 401 redirects to `/login`.

Backend responses:
- `GET` list: `{ items: [...] }` or `{ <resource>: [...] }`
- `GET` single: `{ <resource>: {...} }`
- `POST`/`PUT`: `{ success: True, ... }`
- `DELETE`: `{ success: True, message: "..." }`
- Errors: `{ detail: "..." }` with HTTP status

## Key env vars

`.env` is gitignored. Copy from `.env.example`.

| Var | Default | Notes |
|---|---|---|
| `DB_HOST` | `postgres` | Docker container name |
| `DB_PORT` | `5432` | Internal |
| `DB_USER` | `hmr` | — |
| `DB_PASSWORD` | `hmr_secret` | — |
| `DB_NAME` | `hmr_db` | — |
| `JWT_SECRET` | (required) | CI injects via GitHub secret |
| `CORS_ORIGINS` | `http://localhost:5173,...` | —

## Dev tips

- Docker health: `GET /api/health` returns `{ success: True, status: "ok" }`
- Seeded admin: `admin@hmr.com` / `admin1234` (`role_id=1`)
- PG from host: `psql -h localhost -p 15432 -U hmr -d hmr_db` (pass: `hmr_secret`); port is `127.0.0.1` only
- Logs: `docker compose logs hmr-backend -f`, `docker compose logs hmr-app -f`
- JWT: HS256, 7-day expiry, stored in `localStorage` key `token`
- Docker volumes (frontend dev): only `src/`, `public/`, `index.html`, `vite.config.js`, `components.json` mounted. `node_modules` stays in container.
- Dockerfiles: `Dockerfile` (Vite dev) / `Dockerfile.prod` (nginx) for frontend; `server/Dockerfile` (uvicorn `--reload`) / `server/Dockerfile.prod` for backend

## CI/CD

Self-hosted runner. Push to `main`: `npm ci` → `npm run lint` → `npm run build` → verify `dist/` → `.env` from secrets → `docker compose -f docker-compose.prod.yml up -d --build` → health check → cleanup. On failure: `docker compose down`.
