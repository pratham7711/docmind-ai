"""
PDF parsing and text chunking service.

Uses PyPDF2 to extract text per page, then LangChain's
RecursiveCharacterTextSplitter to chunk the text for embedding.
"""
import io
import logging
from dataclasses import dataclass

import PyPDF2
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

# Chunking config
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


@dataclass
class PageChunk:
    """A text chunk with its source page number."""
    text: str
    page: int  # 1-indexed


def parse_pdf(file_bytes: bytes) -> tuple[list[str], int]:
    """
    Extract text from each page of a PDF.

    Args:
        file_bytes: Raw PDF file bytes.

    Returns:
        A tuple of (pages_text, page_count) where pages_text is a list of
        per-page text strings (may be empty for image-only pages).

    Raises:
        ValueError: If the file cannot be read as a PDF.
    """
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    except Exception as exc:
        raise ValueError(f"Could not read PDF: {exc}") from exc

    page_count = len(reader.pages)
    pages_text: list[str] = []

    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        pages_text.append(text)

    logger.debug("Parsed PDF: %d pages", page_count)
    return pages_text, page_count


def chunk_pages(pages_text: list[str]) -> list[PageChunk]:
    """
    Split per-page text into overlapping chunks.

    Each chunk retains its source page number (1-indexed).
    Pages with no extractable text are skipped.

    Args:
        pages_text: List of per-page text strings from parse_pdf().

    Returns:
        List of PageChunk objects ready for embedding.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", " ", ""],
    )

    chunks: list[PageChunk] = []

    for page_idx, text in enumerate(pages_text, start=1):
        if not text.strip():
            continue
        page_chunks = splitter.split_text(text)
        for chunk_text in page_chunks:
            stripped = chunk_text.strip()
            if stripped:
                chunks.append(PageChunk(text=stripped, page=page_idx))

    logger.debug("Produced %d chunks from %d pages", len(chunks), len(pages_text))
    return chunks
