"""
Upstash Redis sliding-window rate limiter.

Pattern: INCR key → set TTL on first hit → check count.
Window: 60 seconds, max 10 requests per user.
"""
import logging
import uuid

from fastapi import HTTPException, status
from upstash_redis import Redis

logger = logging.getLogger(__name__)

RATE_LIMIT_WINDOW = 60   # seconds
RATE_LIMIT_MAX = 10      # requests per window


async def check_rate_limit(user_id: uuid.UUID, redis: Redis) -> None:
    """
    Check and increment the rate-limit counter for a user.

    Uses an INCR + EXPIRE pattern:
    1. INCR `rate_limit:{user_id}` (atomic counter increment).
    2. On first increment (count == 1), set TTL = RATE_LIMIT_WINDOW.
    3. If count > RATE_LIMIT_MAX, raise HTTP 429 with Retry-After header.

    Args:
        user_id: UUID of the authenticated user.
        redis:   Upstash Redis client.

    Raises:
        HTTPException 429: When the rate limit is exceeded.
    """
    key = f"rate_limit:{user_id}"

    try:
        count = redis.incr(key)

        # Set TTL only on the first request in the window
        if count == 1:
            redis.expire(key, RATE_LIMIT_WINDOW)

        if count > RATE_LIMIT_MAX:
            # Get remaining TTL for Retry-After header
            ttl = redis.ttl(key)
            retry_after = max(ttl, 1)
            logger.warning("Rate limit exceeded for user_id=%s (count=%d)", user_id, count)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)},
            )
    except HTTPException:
        raise
    except Exception as exc:
        # If Redis is unavailable, fail open (don't block requests)
        logger.error("Rate limiter Redis error: %s", exc)
