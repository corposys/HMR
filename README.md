# Hotel Margarita Real

Sistema de gestión integral para operaciones internas del hotel (frontdesk, habitaciones, mantenimiento, reportes).

**Stack:** React 19 + Vite + Tailwind CSS v4 · FastAPI + PostgreSQL · Docker

---

## Inicio rápido (Docker)

Requerimientos: Docker y Docker Compose.

```bash
# 1. Configura tus credenciales (opcional, hay valores por defecto)
cp .env.example .env

# 2. Levanta todo (Postgres + Backend + Frontend)
docker compose up -d --build

# 3. Abre el navegador
http://localhost:5173
```

La base de datos (tablas y datos de demo) se crea automáticamente al iniciar.

### Servicios

| Servicio         | URL                          |
|------------------|------------------------------|
| Frontend (Vite)  | http://localhost:5173        |
| Backend (FastAPI)| http://localhost:8000        |
| Swagger Doc      | http://localhost:8000/docs   |
| PostgreSQL       | localhost:5432               |

### Credenciales de prueba

| Rol  | Email         | Contraseña |
|------|---------------|------------|
| Admin| admin@hmr.com | admin1234  |

---

## Uso diario

```bash
docker compose up -d          # iniciar
docker compose logs -f        # ver logs
docker compose down           # detener
docker compose down -v        # detener y borrar datos (reinicio limpio)
```

Con `npm run dev`, `npm run lint`, `npm run build` trabajas sobre el frontend nativo.

---

## Producción

```bash
# Requiere .env con JWT_SECRET real
cp .env.example .env

docker compose -f docker-compose.prod.yml up -d --build
```

Frontend en http://localhost (puerto 80), se sirve con Nginx y redirige `/api` al backend.

---

## Desarrollo nativo (solo frontend)

Mantén los contenedores del backend corriendo y ejecuta:

```bash
npm install
npm run dev
```

Nota: cambiar el target del proxy en `vite.config.js` de `http://backend:8000` a `http://localhost:8000`.

---

## Estructura

- `src/` · Frontend React (features por dominio)
- `server/` · Backend FastAPI con routers y esquema SQL en `db.py`
- `docker-compose.yml` · Entorno desarrollo
- `docker-compose.prod.yml` · Entorno producción (Nginx)