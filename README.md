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

### Desarrollo

```bash
docker-compose up -d --build
```

Servicios:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000 (Swagger en /docs)
- Postgres: localhost:15432

```bash
docker-compose down
```

### Producción

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Frontend disponible en http://localhost

---

## Credenciales de Prueba

- **Usuario:** admin@hmr.com
- **Contraseña:** admin1234