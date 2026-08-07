"""
HMR Backend - FastAPI Application
Main entrypoint for the authentication API.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from db import init_db
from logging_config import logger
from routes.auth import router as auth_router
from routes.signatures import router as signatures_router
from routes.structure import router as structure_router
from routes.maintenance import router as maintenance_router
from routes.settings import router as settings_router
from routes.users import router as users_router
from routes.systems import router as systems_router
from routes.tickets import router as tickets_router
from routes.reports import router as reports_router

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(os.path.join(UPLOADS_DIR, "payments"), exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    logger.info("Starting up HMR API...")
    init_db()
    yield
    logger.info("Shutting down HMR API...")

app = FastAPI(title="HMR API", version="1.0.0", lifespan=lifespan)

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router)
app.include_router(signatures_router)
app.include_router(structure_router)
app.include_router(maintenance_router)
app.include_router(settings_router)
app.include_router(users_router)
app.include_router(systems_router)
app.include_router(tickets_router)
app.include_router(reports_router)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


@app.get("/api/health")
async def health_check():
    logger.debug("Health check requested")
    return {"success": True, "status": "ok", "service": "hmr-backend"}