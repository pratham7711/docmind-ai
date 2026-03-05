"""
Pinecone Integrated Embedding service.

Uses Pinecone's built-in multilingual-e5-large model (1024-dim, cosine).
No external embedding API required — Pinecone handles text → vector conversion
automatically on both upsert and search.

Field map: "text" (configured in the Pinecone index settings).
"""
import logging
import uuid
from typing import Any

from app.services.pdf_service import PageChunk

logger = logging.getLogger(__name__)

BATCH_SIZE = 96  # Safe batch size for Pinecone integrated embedding upsert


async def upsert_chunks(
    chunks: list[PageChunk],
    namespace: str,
    doc_id: uuid.UUID,
    filename: str,
    pinecone_index: Any,
) -> int:
    """
    Upsert text chunks into Pinecone using integrated embedding.

    Pinecone automatically embeds the "text" field using multilingual-e5-large.
    No external embedding API call is made.

    Record format:
        _id:      unique chunk identifier
        text:     chunk content (embedded by Pinecone)
        page:     source page number (metadata)
        doc_id:   document UUID string (metadata)
        filename: original filename (metadata)

    Args:
        chunks:          List of PageChunk objects from pdf_service.
        namespace:       Pinecone namespace (e.g. "user_<uid>_doc_<did>").
        doc_id:          Document UUID for metadata.
        filename:        Original filename for metadata.
        pinecone_index:  Active Pinecone Index client.

    Returns:
        Number of records upserted.
    """
    if not chunks:
        logger.warning("No chunks to upsert for namespace=%s", namespace)
        return 0

    records = [
        {
            "_id": f"{doc_id}_chunk_{i}",
            "text": chunk.text,
            "page": chunk.page,
            "doc_id": str(doc_id),
            "filename": filename,
        }
        for i, chunk in enumerate(chunks)
    ]

    # Upsert in batches
    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i : i + BATCH_SIZE]
        pinecone_index.upsert_records(namespace=namespace, records=batch)
        logger.debug(
            "Upserted records %d-%d to namespace=%s", i, i + len(batch), namespace
        )

    logger.info("Upserted %d records to namespace=%s", len(records), namespace)
    return len(records)


def search_chunks(
    query_text: str,
    namespace: str,
    pinecone_index: Any,
    top_k: int = 5,
) -> list[dict[str, Any]]:
    """
    Search Pinecone for the most relevant chunks using integrated embedding.

    Pinecone embeds the query text automatically — no separate embedding step.

    Args:
        query_text:      Raw query string from the user.
        namespace:       Pinecone namespace for the document.
        pinecone_index:  Active Pinecone Index client.
        top_k:           Number of results to return.

    Returns:
        List of dicts with keys: page, text, score.
    """
    results = pinecone_index.search(
        namespace=namespace,
        query={
            "inputs": {"text": query_text},
            "top_k": top_k,
        },
        fields=["text", "page", "doc_id", "filename"],
    )

    chunks = []
    for match in results.get("result", {}).get("hits", []):
        fields = match.get("fields", {})
        chunks.append(
            {
                "page": int(fields.get("page", 0)),
                "text": fields.get("text", ""),
                "score": match.get("_score", 0.0),
            }
        )

    logger.debug("Retrieved %d chunks from namespace=%s", len(chunks), namespace)
    return chunks


def delete_namespace(namespace: str, pinecone_index: Any) -> None:
    """
    Delete all vectors in a Pinecone namespace (called on document deletion).

    Args:
        namespace:       Namespace to delete.
        pinecone_index:  Active Pinecone Index client.
    """
    try:
        pinecone_index.delete(delete_all=True, namespace=namespace)
        logger.info("Deleted Pinecone namespace=%s", namespace)
    except Exception as exc:
        logger.error("Failed to delete namespace=%s: %s", namespace, exc)
