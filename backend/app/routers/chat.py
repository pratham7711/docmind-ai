"""
POST /chat — Streaming RAG chat via Server-Sent Events.
"""
import logging
import uuid
from typing import Any, AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse
from upstash_redis import Redis

from app.dependencies import get_current_user, get_db, get_pinecone, get_redis
from app.models import ChatSession, Document, Message, User
from app.schemas import ChatRequest
from app.services.rag_service import ResponseCollector, run_rag_and_collect
from app.services.rate_limiter import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/chat")
async def chat(
    request: Request,
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    pinecone_index: Any = Depends(get_pinecone),
    redis: Redis = Depends(get_redis),
) -> EventSourceResponse:
    """
    Stream a RAG-powered chat response as Server-Sent Events.

    Steps:
    1. Rate-limit check (10 req/min per user).
    2. Validate document belongs to current user.
    3. Create or validate ChatSession.
    4. Persist user message.
    5. Fetch conversation history (last 6 messages).
    6. Stream RAG response via SSE.
    7. Persist assistant message + sources after stream.
    """
    # 1. Rate limit
    await check_rate_limit(current_user.id, redis)

    # 2. Validate document ownership
    doc_result = await db.execute(
        select(Document).where(
            Document.id == body.doc_id,
            Document.user_id == current_user.id,
        )
    )
    document = doc_result.scalar_one_or_none()
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )

    # 3. Resolve or create ChatSession
    if body.session_id is not None:
        session_result = await db.execute(
            select(ChatSession).where(
                ChatSession.id == body.session_id,
                ChatSession.user_id == current_user.id,
            )
        )
        session = session_result.scalar_one_or_none()
        if session is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found or access denied.",
            )
    else:
        session = ChatSession(
            user_id=current_user.id,
            doc_id=body.doc_id,
            title=body.message[:50],
        )
        db.add(session)
        await db.flush()

    session_id: uuid.UUID = session.id

    # 4. Persist user message
    user_msg = Message(
        session_id=session_id,
        role="user",
        content=body.message,
    )
    db.add(user_msg)
    await db.commit()
    await db.refresh(session)

    # 5. Fetch conversation history (last 6 messages before current)
    history_result = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.created_at.desc())
        .limit(7)  # +1 to exclude the message we just added
    )
    history_msgs = history_result.scalars().all()
    # Reverse to chronological order; exclude the very last (just-added user msg)
    history = list(reversed(history_msgs))[:-1]

    # 6. Build SSE generator
    namespace = document.pinecone_namespace
    sse_gen, collector = await run_rag_and_collect(
        user_message=body.message,
        namespace=namespace,
        history=history,
        session_id=session_id,
        pinecone_index=pinecone_index,
    )

    async def event_stream() -> AsyncGenerator[str, None]:
        """Wrap the RAG generator and persist after completion."""
        async for event in sse_gen:
            yield event

        # 7. Persist assistant message after stream finishes
        try:
            assistant_msg = Message(
                session_id=session_id,
                role="assistant",
                content=collector.full_text,
                sources=collector.sources if collector.sources else None,
            )
            db.add(assistant_msg)
            await db.commit()
            logger.info(
                "Persisted assistant message for session_id=%s (%d chars)",
                session_id,
                len(collector.full_text),
            )
        except Exception as exc:
            logger.error("Failed to persist assistant message: %s", exc)

    return EventSourceResponse(event_stream())
