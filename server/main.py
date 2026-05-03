"""
HMR Backend - FastAPI Application
Main entrypoint for the authentication API.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import init_db
from logging_config import logger
from routes.auth import router as auth_router
from routes.signatures import router as signatures_router
from routes.structure import router as structure_router
from routes.maintenance import router as maintenance_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup
    logger.info("Starting up HMR API...")
    init_db()
    yield
    # Shutdown
    logger.info("Shutting down HMR API...")

app = FastAPI(title="HMR API", version="1.0.0", lifespan=lifespan)

# CORS middleware configuration
# Allow origins from environment or default to localhost for dev
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Mount routes
app.include_router(auth_router)
app.include_router(signatures_router)
app.include_router(structure_router)
app.include_router(maintenance_router)


@app.get("/api/health")
async def health_check():
    logger.debug("Health check requested")
    return {"success": True, "status": "ok", "service": "hmr-backend"}
