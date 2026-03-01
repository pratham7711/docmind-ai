"""
DocMind AI — FastAPI application entry point.

Configures CORS, registers routers, and exposes a health check endpoint.
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import chat, documents, history, upload

# ─── Logging ─────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.DEBUG if settings.ENVIRONMENT == "development" else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger(__name__)

# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="DocMind AI",
    description="AI-powered document intelligence platform. Upload PDFs, ask questions.",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",  # allow all Vercel preview URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────

API_PREFIX = "/api/v1"

app.include_router(upload.router, prefix=API_PREFIX, tags=["Upload"])
app.include_router(chat.router, prefix=API_PREFIX, tags=["Chat"])
app.include_router(history.router, prefix=API_PREFIX, tags=["History"])
app.include_router(documents.router, prefix=API_PREFIX, tags=["Documents"])
app.include_router(test_embed.router, prefix=API_PREFIX, tags=["Test"])


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Liveness probe — returns 200 OK when the service is running."""
    return {"status": "ok", "environment": settings.ENVIRONMENT}


# ─── Startup log ─────────────────────────────────────────────────────────────

@app.on_event("startup")
async def on_startup() -> None:
    logger.info("DocMind AI started — environment=%s", settings.ENVIRONMENT)
