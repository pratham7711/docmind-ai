"""
GET    /documents           — List all documents for the current user.
DELETE /documents/{doc_id}  — Delete a document from DB + Pinecone + Redis cache.
"""
import json
import logging
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from upstash_redis import Redis

from app.dependencies import get_current_user, get_db, get_pinecone, get_redis
from app.models import Document, User
from app.schemas import DocumentResponse
from app.services.embedding_service import delete_namespace

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/documents", response_model=list[DocumentResponse])
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[DocumentResponse]:
    """
    Return all documents uploaded by the current user, ordered by most recent first.
    """
    result = await db.execute(
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
    )
    documents = result.scalars().all()
    return [DocumentResponse.model_validate(doc) for doc in documents]


@router.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    pinecone_index: Any = Depends(get_pinecone),
    redis: Redis = Depends(get_redis),
) -> None:
    """
    Delete a document and all associated data.

    Steps:
    1. Verify document ownership.
    2. Delete all vectors from Pinecone namespace.
    3. Invalidate Redis cache entry.
    4. Delete document from PostgreSQL (cascades to chat_sessions + messages).
    """
    # 1. Verify ownership
    result = await db.execute(
        select(Document).where(
            Document.id == doc_id,
            Document.user_id == current_user.id,
        )
    )
    document = result.scalar_one_or_none()

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )

    namespace = document.pinecone_namespace

    # 2. Delete Pinecone namespace (best-effort)
    try:
        delete_namespace(namespace, pinecone_index)
    except Exception as exc:
        logger.error("Failed to delete Pinecone namespace=%s: %s", namespace, exc)
        # Continue — we still want to remove the DB record

    # 3. Invalidate Redis cache (best-effort)
    try:
        redis.delete(f"doc:{doc_id}")
    except Exception as exc:
        logger.warning("Failed to invalidate Redis cache for doc_id=%s: %s", doc_id, exc)

    # 4. Delete from DB (cascades to chat_sessions + messages via FK)
    await db.delete(document)
    await db.commit()

    logger.info(
        "Deleted document id=%s filename=%s for user_id=%s",
        doc_id, document.filename, current_user.id,
    )
