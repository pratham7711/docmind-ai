"""
LangChain RAG service using Pinecone Integrated Embedding + Gemini Flash.

Flow:
  1. Search Pinecone with raw query text (no separate embed step)
  2. Build context from retrieved chunks
  3. Stream Gemini Flash response as SSE events
"""
import json
import logging
import uuid
from typing import Any, AsyncGenerator

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from app.config import settings
from app.models import Message
from app.services.embedding_service import search_chunks

logger = logging.getLogger(__name__)

CHAT_MODEL = "gemini-2.5-flash"
TOP_K_CHUNKS = 5
MAX_HISTORY_MESSAGES = 6

SYSTEM_PROMPT = (
    "You are DocMind AI, an intelligent document assistant. "
    "Answer the user's questions based solely on the provided document context. "
    "Always cite page numbers when referencing specific content (e.g., 'According to page 3...'). "
    "If the answer is not found in the context, say so honestly — do not hallucinate. "
    "Be concise, accurate, and helpful."
)


def _build_context_string(chunks: list[dict[str, Any]]) -> str:
    """
    Format retrieved chunks into a readable context block with page references.

    Args:
        chunks: List of chunk dicts with keys: page, text, score.

    Returns:
        Formatted context string.
    """
    if not chunks:
        return "No relevant context found in the document."

    parts = []
    for i, chunk in enumerate(chunks, start=1):
        parts.append(f"[Source {i} — Page {chunk['page']}]\n{chunk['text']}")
    return "\n\n---\n\n".join(parts)


def _build_messages(
    context: str,
    history: list[Message],
    user_message: str,
) -> list[Any]:
    """
    Build the LangChain message list: System → History → Augmented Human message.

    Args:
        context:      Formatted retrieved context string.
        history:      Last N Message ORM objects from the DB.
        user_message: The current user question.

    Returns:
        List of LangChain message objects ready for the LLM.
    """
    messages: list[Any] = [SystemMessage(content=SYSTEM_PROMPT)]

    # Inject conversation history (last N messages for multi-turn support)
    for msg in history[-MAX_HISTORY_MESSAGES:]:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            messages.append(AIMessage(content=msg.content))

    # Augmented human message: context + question
    augmented = (
        f"Document context:\n\n{context}\n\n"
        f"---\n\nUser question: {user_message}"
    )
    messages.append(HumanMessage(content=augmented))
    return messages


async def stream_rag_response(
    user_message: str,
    namespace: str,
    history: list[Message],
    session_id: uuid.UUID,
    pinecone_index: Any,
) -> AsyncGenerator[str, None]:
    """
    Full RAG pipeline: Pinecone search → build prompt → stream Gemini response → SSE events.

    Yields SSE-formatted strings:
    - data: {"type": "token",   "content": "..."}   — each streamed token
    - data: {"type": "sources", "sources": [...]}    — after stream completes
    - data: {"type": "done",    "session_id": "..."}
    - data: {"type": "error",   "message": "..."}    — on any failure

    Args:
        user_message:    The user's question (raw text).
        namespace:       Pinecone namespace for the document.
        history:         Previous messages in this session.
        session_id:      Current chat session UUID.
        pinecone_index:  Active Pinecone Index client.

    Yields:
        SSE event strings (already formatted with "data: " prefix + double newline).
    """
    try:
        # 1. Search Pinecone (integrated embedding — no separate embed API call)
        chunks = search_chunks(
            query_text=user_message,
            namespace=namespace,
            pinecone_index=pinecone_index,
            top_k=TOP_K_CHUNKS,
        )

        # 2. Build context string from retrieved chunks
        context = _build_context_string(chunks)

        # 3. Build LangChain message list
        lc_messages = _build_messages(context, history, user_message)

        # 4. Stream via Gemini Flash
        llm = ChatGoogleGenerativeAI(
            model=CHAT_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            streaming=True,
            temperature=0.2,
        )

        full_response = ""
        async for chunk in llm.astream(lc_messages):
            token = chunk.content
            if token:
                full_response += token
                # Yield plain JSON string — sse_starlette adds "data: " prefix automatically
                yield json.dumps({"type": "token", "content": token})

        # 5. Emit sources after stream completes
        sources = [
            {"page": c["page"], "text_snippet": c["text"][:200]}
            for c in chunks
        ]
        yield json.dumps({"type": "sources", "sources": sources})

        # 6. Done event
        yield json.dumps({"type": "done", "session_id": str(session_id)})

        logger.info(
            "RAG stream complete for session_id=%s (%d tokens)",
            session_id,
            len(full_response),
        )

    except Exception as exc:
        logger.error("RAG stream error: %s", exc, exc_info=True)
        yield json.dumps({"type": "error", "message": str(exc)})


async def run_rag_and_collect(
    user_message: str,
    namespace: str,
    history: list[Message],
    session_id: uuid.UUID,
    pinecone_index: Any,
) -> tuple[AsyncGenerator[str, None], "ResponseCollector"]:
    """
    Returns (sse_generator, collector) so the chat router can stream to the client
    while simultaneously accumulating the full response for DB persistence.

    Args:
        user_message:    The user's question.
        namespace:       Pinecone namespace for the document.
        history:         Previous messages in this session.
        session_id:      Current chat session UUID.
        pinecone_index:  Active Pinecone Index client.

    Returns:
        Tuple of (sse_async_generator, ResponseCollector).
    """
    collector = ResponseCollector()

    async def _wrapped() -> AsyncGenerator[str, None]:
        async for event in stream_rag_response(
            user_message, namespace, history, session_id, pinecone_index
        ):
            collector.consume(event)
            yield event

    return _wrapped(), collector


class ResponseCollector:
    """
    Accumulates the full response text and sources from SSE events.
    Used by the chat router to persist the assistant message after streaming ends.
    """

    def __init__(self) -> None:
        self.full_text: str = ""
        self.sources: list[dict[str, Any]] = []

    def consume(self, event: str) -> None:
        """Parse and accumulate a single event (plain JSON string from the generator)."""
        try:
            payload = json.loads(event.strip())
            etype = payload.get("type")
            if etype == "token":
                self.full_text += payload.get("content", "")
            elif etype == "sources":
                self.sources = payload.get("sources", [])
        except (json.JSONDecodeError, KeyError):
            pass
