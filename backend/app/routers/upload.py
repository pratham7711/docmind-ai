"""
POST /upload — Accept a PDF, parse it, embed it, and store it in Pinecone + DB.
"""
import logging
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from upstash_redis import Redis

from app.dependencies import get_current_user, get_db, get_pinecone, get_redis
from app.models import Document, User
from app.schemas import UploadResponse
from app.services.embedding_service import upsert_chunks
from app.services.pdf_service import chunk_pages, parse_pdf

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
DOC_CACHE_TTL = 3600  # 1 hour


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    pinecone_index: Any = Depends(get_pinecone),
    redis: Redis = Depends(get_redis),
) -> UploadResponse:
    """
    Upload and process a PDF document.

    1. Validates file type and size.
    2. Parses PDF pages and splits into chunks.
    3. Creates Document record in PostgreSQL.
    4. Generates OpenAI embeddings and upserts to Pinecone.
    5. Caches document metadata in Redis (TTL 1hr).

    Returns document metadata including chunk count.
    """
    # 1. Validate content type
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        # Some clients send application/octet-stream; validate by extension too
        if not (file.filename or "").lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are accepted.",
            )

    # Read file bytes
    file_bytes = await file.read()

    # 2. Validate file size
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # 3. Parse PDF
    try:
        pages_text, page_count = parse_pdf(file_bytes)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    # 4. Chunk the text
    chunks = chunk_pages(pages_text)
    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract any text from the PDF. It may be image-only.",
        )

    # 5. Create Document record in DB (get the ID for the namespace)
    original_filename = file.filename or "document.pdf"
    document = Document(
        user_id=current_user.id,
        filename=original_filename,
        size=len(file_bytes),
        page_count=page_count,
        pinecone_namespace="placeholder",  # updated below after we have the ID
    )
    db.add(document)
    await db.flush()  # flush to get the generated UUID

    namespace = f"user_{current_user.id}_doc_{document.id}"
    document.pinecone_namespace = namespace
    await db.commit()
    await db.refresh(document)

    logger.info(
        "Document created: id=%s filename=%s pages=%d",
        document.id, original_filename, page_count,
    )

    # 6. Embed chunks and upsert to Pinecone
    try:
        chunk_count = await upsert_chunks(
            chunks=chunks,
            namespace=namespace,
            doc_id=document.id,
            filename=original_filename,
            pinecone_index=pinecone_index,
        )
    except Exception as exc:
        logger.error("Embedding/upsert failed for doc_id=%s: %s", document.id, exc)
        # Rollback DB record if Pinecone fails
        await db.delete(document)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to process document embeddings. Please try again.",
        ) from exc

    # 7. Cache doc metadata in Redis
    try:
        cache_key = f"doc:{document.id}"
        import json
        cache_value = json.dumps(
            {
                "id": str(document.id),
                "filename": original_filename,
                "page_count": page_count,
                "namespace": namespace,
                "user_id": str(current_user.id),
            }
        )
        redis.set(cache_key, cache_value, ex=DOC_CACHE_TTL)
    except Exception as exc:
        logger.warning("Redis cache write failed for doc_id=%s: %s", document.id, exc)
        # Non-fatal: cache miss is acceptable

    return UploadResponse(
        doc_id=document.id,
        filename=original_filename,
        page_count=page_count,
        chunk_count=chunk_count,
        size=len(file_bytes),
    )
