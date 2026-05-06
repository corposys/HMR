# AGENTS.md — HMR (Hotel Margarita Real)

## Stack

React 19 + Vite 7 + Tailwind CSS v4 | FastAPI + PostgreSQL | Docker Compose

## Commands

| Command | What |
|---|---|
| `npm run docker:build` | Build Docker images (sin caché) |
| `npm run docker:up` | Iniciar contenedores (sin build) |
| `npm run docker:verify` | Verificar que todo funciona (salud + dependencias) |
| `npm run docker:logs` | Ver logs en tiempo real |
| `npm run docker:down` | Detener contenedores |
| `docker compose up -d --build` | Dev completo (build + start) |
| `docker compose down` | Stop |
| `docker compose -f docker-compose.prod.yml up -d --build` | Production |
| `npm run lint && npm run build` | Frontend verification (CI runs this) |

**No test framework.** Skip `npm test`, `pytest`.

## Vite proxy

`vite.config.js` proxies `/api` → `http://hmr-backend:8000`. Works inside Docker, fails on host. To run `npm run dev` natively: keep backend containers running, change proxy to `http://localhost:8000`.

## Architecture

### Frontend (`src/`)
- Feature modules: `src/features/<domain>/` (pages + components)
- Routing: `src/app/routes/` — lazy-loaded, protected routes wrap `ProtectedRoute` + `Layout`
- Contexts: `AuthContext.jsx` (JWT), `ToastContext.jsx`
- Hooks: `usePermissions()` (RBAC), `useSettings()` (hotel config)

### Backend (`server/`)
- Entrypoint: `server/main.py` — FastAPI, CORS, mounts routers + `/uploads`
- Routers: `routes/*.py` — 11 routers prefixed `/api`
- Auth: JWT in `middleware/auth.py` — `get_current_user`, `require_permission(resource, action)`
- No ORM: raw psycopg2 via `db.py` connection pool

## Import aliases

```js
'@/' → 'src/'
'@app/' → 'src/app/'
'@features/' → 'src/features/'
'@shared/' → 'src/shared/'
'@context/' → 'src/context/'
'@utils/' → 'src/utils/'
'@hooks/' → 'src/hooks/'
```
**Use these. Never relative paths.**

## Conventions

- **No TypeScript** — `.jsx`/`.js` only
- **No comments** unless explicitly requested
- **Spanish UI strings** — all user-facing text in Spanish
- **Spanish error messages** — backend returns `{ detail: "..." }` in Spanish
- **Tailwind CSS v4** — no `tailwind.config.js`, theme vars in `src/index.css`
- **ESLint** — `no-unused-vars` ignores `^[A-Z_]` (React components fine)
- **No ORM** — raw SQL with psycopg2 connection pool
- **Backend volumes** — `./server:/app` mounted, uvicorn `--reload` active

## RBAC

Frontend: `usePermissions()` returns `{ can, isAdmin }`. Use `can(resource, action)` to gate UI.
Backend: `require_permission(resource, action)` as FastAPI Depends. Admin (role_id=1) bypasses all.

Resources: `settings`, `users`, `reception`, `guests`, `rooms`, `housekeeping`, `maintenance`, `reports`, `financial`
Actions: `read`, `write`, `delete` (+ `block`, `close_folio`, `verify_payment`, `update_status` for some)

## API pattern

Frontend: `apiFetch`/`apiJson` from `@utils/api` — auto-bearer, 401 redirect.

Backend responses:
- `GET` list: `{ items: [...] }` or `{ <resource>: [...] }`
- `GET` single: `{ <resource>: {...} }`
- `POST`: `{ success: True, <resource>: {...} }`
- `PUT`: `{ success: True }` or `{ success: True, <resource>: {...} }`
- `DELETE`: `{ success: True, message: "..." }`
- Errors: `{ detail: "..." }` with HTTP status

## Key env vars

| Var | Default | Purpose |
|---|---|---|
| `DB_HOST` | `postgres` | Container name |
| `DB_PORT` | `5432` | Internal port |
| `DB_USER` | `hmr` | — |
| `DB_PASSWORD` | `hmr_secret` | — |
| `DB_NAME` | `hmr_db` | — |
| `JWT_SECRET` | (required) | CI sets via GitHub secret |
| `CORS_ORIGINS` | `http://localhost:5173,...` | — |

`.env` is gitignored.

## Dev tips

- Logs: `docker compose logs hmr-backend -f`, `docker compose logs hmr-app -f`
- DB from host: `psql -h localhost -p 15432 -U hmr -d hmr_db` (pass: `hmr_secret`)
- Seeded admin: `admin@hmr.com` / `admin1234` (role_id=1)
- Health: `GET /api/health`
- Constants: `src/utils/constants.js` — check before hardcoding

## Docker Workflow

### Flujo recomendado

```bash
# 1. Build (solo cuando hay cambios en package.json o Dockerfile)
npm run docker:build

# 2. Iniciar contenedores
npm run docker:up

# 3. Verificar que todo funciona (obligatorio)
npm run docker:verify

# Ver logs si hay problemas
npm run docker:logs
```

### Por qué esto evita problemas

1. **Volúmenes correctos**: Solo se montan `src/`, `public/`, `index.html`, `vite.config.js`, `components.json`. **NO se monta** `node_modules` desde el host — permanece limpio en el contenedor.

2. **.dockerignore**: Excluye archivos innecesarios del build, evitando que se copie contenido no deseado.

3. **Healthchecks**: Cada servicio verifica su salud. Si el frontend no puede resolver `@radix-ui/react-separator`, el contenedor fallará el healthcheck.

4. **Script de verificación**: `npm run docker:verify` checkea:
   - Contenedores corriendo
   - Health de backend y frontend
   - Dependencias críticas instaladas en el contenedor

### Si ves errores de "Failed to fetch dynamically imported module"

1. Verifica que ejecutaste `npm run docker:build` (no solo `docker:up`)
2. Ejecuta `npm run docker:verify` para ver el estado real
3. Si persisten, ejecuta `docker compose down -v` para eliminar volúmenes y rebuild desde cero
4. luego: `npm run docker:build && npm run docker:up && npm run docker:verify`