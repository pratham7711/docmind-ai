"""
POST /api/v1/test-embed — Auth-free, DB-free endpoint for testing
PDF parsing + Pinecone integrated embedding end-to-end.

ONLY active when DISABLE_AUTH=true. Removed from prod once auth works.
"""
import logging
import os
import uuid
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.services.embedding_service import upsert_chunks
from app.services.pdf_service import chunk_pages, parse_pdf
from app.dependencies import get_pinecone

logger = logging.getLogger(__name__)
router = APIRouter()

DISABLE_AUTH = os.environ.get("DISABLE_AUTH", "false").lower() == "true"


@router.post("/test-embed")
async def test_embed(file: UploadFile = File(...)) -> dict:
    """
    Test-only endpoint: parse PDF → embed to Pinecone → return stats.
    No auth, no DB. Active only when DISABLE_AUTH=true.
    """
    if not DISABLE_AUTH:
        raise HTTPException(status_code=404, detail="Not found")

    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF files only.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file.")

    # 1. Parse PDF
    try:
        pages_text, page_count = parse_pdf(file_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    # 2. Chunk
    chunks = chunk_pages(pages_text)
    if not chunks:
        raise HTTPException(status_code=422, detail="No extractable text found in PDF.")

    # 3. Embed → Pinecone (test namespace, auto-cleaned)
    test_doc_id = uuid.uuid4()
    namespace = f"test_{test_doc_id}"
    pinecone_index = get_pinecone()

    try:
        chunk_count = await upsert_chunks(
            chunks=chunks,
            namespace=namespace,
            doc_id=test_doc_id,
            filename=file.filename or "test.pdf",
            pinecone_index=pinecone_index,
        )
    except Exception as exc:
        logger.error("Pinecone upsert failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=502,
            detail=f"Pinecone upsert failed: {exc}",
        ) from exc

    logger.info("test-embed OK: pages=%d chunks=%d namespace=%s", page_count, chunk_count, namespace)

    return {
        "ok": True,
        "filename": file.filename,
        "pages": page_count,
        "chunks_embedded": chunk_count,
        "pinecone_namespace": namespace,
        "message": "PDF parsed and embedded successfully ✅",
    }
