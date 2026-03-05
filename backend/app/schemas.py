"""
Pydantic request/response schemas for DocMind AI API.
"""
import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field


# ─── User ───────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    """Response schema for user info."""
    id: uuid.UUID
    email: str
    name: str
    avatar: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Upload ─────────────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    """Response returned after a successful PDF upload."""
    doc_id: uuid.UUID
    filename: str
    page_count: int
    chunk_count: int
    size: int


# ─── Documents ──────────────────────────────────────────────────────────────

class DocumentResponse(BaseModel):
    """Response schema for a document record."""
    id: uuid.UUID
    filename: str
    size: int
    page_count: int
    pinecone_namespace: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Chat ────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    """Request body for the /chat endpoint."""
    doc_id: uuid.UUID
    session_id: Optional[uuid.UUID] = None
    message: str = Field(..., min_length=1, max_length=4096)


class SourceChunk(BaseModel):
    """A retrieved source chunk with page reference."""
    page: int
    text_snippet: str


# ─── Messages ────────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    """Response schema for a single message."""
    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    content: str
    sources: Optional[list[dict[str, Any]]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Chat Sessions ───────────────────────────────────────────────────────────

class ChatSessionSummary(BaseModel):
    """Summary of a chat session shown in the history list."""
    id: uuid.UUID
    doc_id: uuid.UUID
    doc_filename: str
    title: str
    last_message_preview: Optional[str] = None
    message_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionDetail(BaseModel):
    """Full detail of a chat session including all messages."""
    id: uuid.UUID
    doc_id: uuid.UUID
    title: str
    created_at: datetime
    messages: list[MessageResponse]

    model_config = {"from_attributes": True}


# ─── Health ──────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    environment: str
