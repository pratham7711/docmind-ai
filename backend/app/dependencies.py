"""
FastAPI dependencies:
- get_db()           — async SQLAlchemy session
- get_current_user() — JWT validation → upsert User → return User
- get_pinecone()     — Pinecone Index client (singleton)
- get_redis()        — Upstash Redis client (singleton)
"""
import logging
import os
from typing import AsyncGenerator

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pinecone import Pinecone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from upstash_redis import Redis

from app.config import settings
from app.database import get_db_session
from app.models import User

logger = logging.getLogger(__name__)

# Security scheme — auto_error=False so we can handle missing token gracefully in test mode
bearer_scheme = HTTPBearer(auto_error=False)

# ─── Test mode ───────────────────────────────────────────────────────────────
DISABLE_AUTH = os.environ.get("DISABLE_AUTH", "false").lower() == "true"
TEST_USER_EMAIL = "test@docmind.local"

# ─── Pinecone singleton ──────────────────────────────────────────────────────

_pinecone_index = None


def get_pinecone():
    """Return a Pinecone Index client (lazily initialised singleton)."""
    global _pinecone_index
    if _pinecone_index is None:
        pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        _pinecone_index = pc.Index(
            name=settings.PINECONE_INDEX_NAME,
            host=settings.PINECONE_INDEX_HOST,
        )
    return _pinecone_index


# ─── Redis singleton ─────────────────────────────────────────────────────────

_redis_client = None


def get_redis() -> Redis:
    """Return an Upstash Redis client (lazily initialised singleton)."""
    global _redis_client
    if _redis_client is None:
        _redis_client = Redis(
            url=settings.UPSTASH_REDIS_REST_URL,
            token=settings.UPSTASH_REDIS_REST_TOKEN,
        )
    return _redis_client


# ─── DB session ──────────────────────────────────────────────────────────────

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session."""
    async for session in get_db_session():
        yield session


# ─── Auth ─────────────────────────────────────────────────────────────────────

async def _upsert_user(db: AsyncSession, email: str, name: str, avatar: str | None) -> User:
    """Upsert a user by email and return the ORM object."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(email=email, name=name, avatar=avatar)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        logger.info("Created new user: %s", email)
    else:
        changed = False
        if user.name != name:
            user.name = name
            changed = True
        if avatar and user.avatar != avatar:
            user.avatar = avatar
            changed = True
        if changed:
            await db.commit()
            await db.refresh(user)
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Validate the Bearer JWT issued by NextAuth, then upsert the User record.

    When DISABLE_AUTH=true (local testing only), skips JWT and returns a
    hardcoded test user — never set this in production.
    """
    # ── TEST MODE (local only) ────────────────────────────────────────────────
    if DISABLE_AUTH:
        logger.warning("⚠️  DISABLE_AUTH=true — skipping JWT validation (test mode)")
        return await _upsert_user(db, TEST_USER_EMAIL, "Test User", None)

    # ── Normal JWT auth ───────────────────────────────────────────────────────
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials:
        raise credentials_exception

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"],
        )
    except JWTError as exc:
        logger.warning("JWT decode failed: %s", exc)
        raise credentials_exception from exc

    email: str | None = payload.get("email")
    if not email:
        raise credentials_exception

    name: str = payload.get("name") or email.split("@")[0]
    avatar: str | None = payload.get("picture")

    return await _upsert_user(db, email, name, avatar)
