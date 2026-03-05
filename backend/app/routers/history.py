"""
GET /history        — List all chat sessions for the current user.
GET /history/{id}   — Full message list for a specific session.
"""
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_current_user, get_db
from app.models import ChatSession, Document, Message, User
from app.schemas import ChatSessionDetail, ChatSessionSummary, MessageResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/history", response_model=list[ChatSessionSummary])
async def list_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ChatSessionSummary]:
    """
    Return all chat sessions for the current user, ordered by most recent first.

    Each session includes:
    - The document filename
    - A preview of the last message
    - Total message count
    """
    # Subquery: count messages per session
    msg_count_subq = (
        select(Message.session_id, func.count(Message.id).label("msg_count"))
        .group_by(Message.session_id)
        .subquery()
    )

    # Subquery: last message content per session
    last_msg_subq = (
        select(
            Message.session_id,
            Message.content.label("last_content"),
        )
        .where(
            Message.id == (
                select(Message.id)
                .where(Message.session_id == Message.session_id)
                .order_by(Message.created_at.desc())
                .limit(1)
                .correlate(Message)
                .scalar_subquery()
            )
        )
        .subquery()
    )

    # Main query
    sessions_result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .options(selectinload(ChatSession.document))
        .order_by(ChatSession.created_at.desc())
    )
    sessions = sessions_result.scalars().all()

    summaries: list[ChatSessionSummary] = []
    for session in sessions:
        # Get message count + last message preview via separate queries (simpler + correct)
        count_result = await db.execute(
            select(func.count(Message.id)).where(Message.session_id == session.id)
        )
        msg_count = count_result.scalar_one_or_none() or 0

        last_msg_result = await db.execute(
            select(Message.content)
            .where(Message.session_id == session.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        last_content = last_msg_result.scalar_one_or_none()

        summaries.append(
            ChatSessionSummary(
                id=session.id,
                doc_id=session.doc_id,
                doc_filename=session.document.filename if session.document else "Unknown",
                title=session.title,
                last_message_preview=last_content[:100] if last_content else None,
                message_count=msg_count,
                created_at=session.created_at,
            )
        )

    return summaries


@router.get("/history/{session_id}", response_model=ChatSessionDetail)
async def get_session_detail(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatSessionDetail:
    """
    Return full message history for a specific chat session.

    Raises 404 if the session does not exist or belongs to another user.
    """
    result = await db.execute(
        select(ChatSession)
        .where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
        .options(selectinload(ChatSession.messages))
    )
    session = result.scalar_one_or_none()

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or access denied.",
        )

    messages = [
        MessageResponse(
            id=msg.id,
            session_id=msg.session_id,
            role=msg.role,
            content=msg.content,
            sources=msg.sources,
            created_at=msg.created_at,
        )
        for msg in sorted(session.messages, key=lambda m: m.created_at)
    ]

    return ChatSessionDetail(
        id=session.id,
        doc_id=session.doc_id,
        title=session.title,
        created_at=session.created_at,
        messages=messages,
    )
