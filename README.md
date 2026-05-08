# Hotel Margarita Real (HMR)

Sistema de gestión integral para operaciones internas del Hotel Margarita Real. Enfocado en minimalismo, rendimiento y experiencia de usuario.

---

## Tech Stack

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 19 + Vite + Tailwind CSS v4 + Lucide React + Recharts + React Router v7 |
| **Backend** | FastAPI (Python) + PostgreSQL + Uvicorn + PyJWT + Pydantic |
| **Infraestructura** | Docker / Docker Compose |

---

## Guía de Instalación

### Requisitos

- Node.js 20+
- Docker & Docker Compose (para entorno completo)
- PostgreSQL (solo para desarrollo nativo)

### Instalación con Docker (recomendado)

```bash
# Construir imágenes (sin caché)
npm run docker:build

# Iniciar contenedores
npm run docker:up

# Verificar estado de salud
npm run docker:verify

# Ver logs en vivo
npm run docker:logs

# Detener contenedores
npm run docker:down
```

Servicios:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000 (Swagger en /docs)
- Postgres: localhost:15432 (solo 127.0.0.1)

### Desarrollo nativo (solo frontend)

Requiere mantener los contenedores del backend corriendo:

```bash
# Instalar dependencias
npm install

# Iniciar Vite dev (cambiar proxy en vite.config.js a localhost:8000)
npm run dev

# Verificar código
npm run lint && npm run build
```

### Producción

```bash
npm run docker:build
npm run docker:up -- -f docker-compose.prod.yml
```

Frontend disponible en http://localhost

---

## Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@hmr.com | admin1234 |

---

## Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia Vite en modo desarrollo |
| `npm run lint` | Ejecuta ESLint |
| `npm run build` | Compila para producción |
| `npm run docker:build` | Construye imágenes Docker |
| `npm run docker:up` | Inicia contenedores |
| `npm run docker:down` | Detiene contenedores |
| `npm run docker:logs` | Logs en vivo de todos los servicios |
| `npm run docker:verify` | Health check de los servicios |

---

## Base de Datos

```bash
# Conexión desde el host
psql -h localhost -p 15432 -U hmr -d hmr_db
# Contraseña: hmr_secret
```

El esquema y datos de prueba se crean automáticamente al iniciar el backend (`init_db()` en `server/db.py`).
