# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo with two independently deployable apps:

```
docmind-ai/
├── backend/        # FastAPI (Python 3.11+) — deployed to Railway
├── frontend/       # Next.js 14 App Router — deployed to Vercel
└── supabase/       # DB migration SQL
```

The root contains the **original Vite/React prototype** (pre-backend). The production app lives in `backend/` and `frontend/`.

---

## Backend (FastAPI)

### Dev commands

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in required keys

# Run migrations (required before first boot)
alembic upgrade head

# Start server (Swagger UI at /docs in development)
uvicorn app.main:app --reload

# Docker (FastAPI + local Postgres)
docker compose up --build
docker compose exec api alembic upgrade head
```

### Architecture

API prefix: `/api/v1`. All routes require `Authorization: Bearer <JWT>` except `/health`.

| Router | File | Responsibility |
|--------|------|----------------|
| Upload | `routers/upload.py` | Parse PDF → chunk → Pinecone upsert → DB record |
| Chat | `routers/chat.py` | SSE streaming RAG chat |
| History | `routers/history.py` | List/fetch chat sessions + messages |
| Documents | `routers/documents.py` | List/delete documents |

**Services layer** (`app/services/`):
- `pdf_service.py` — PyPDF2 parsing + LangChain `RecursiveCharacterTextSplitter`
- `embedding_service.py` — Pinecone integrated embedding (`multilingual-e5-large`, 1024-dim). No external embed API; Pinecone handles text→vector automatically on both upsert (`upsert_records`) and search (`index.search`).
- `rag_service.py` — Pinecone search → LangChain message building → Gemini 1.5 Flash streaming → SSE events. `ResponseCollector` accumulates streamed tokens for DB persistence.
- `rate_limiter.py` — Upstash Redis sliding-window, 10 req/min per user; fails open.

**Dependency injection** (`app/dependencies.py`):
- `get_current_user()` — decodes NextAuth-issued JWT (HS256, `JWT_SECRET`), upserts User in DB
- `get_pinecone()` / `get_redis()` — lazily initialized module-level singletons
- `DISABLE_AUTH=true` env var bypasses JWT for local testing (never in production)

**DB**: SQLAlchemy async (`asyncpg`) + Alembic migrations. Models: `User`, `Document`, `ChatSession`, `Message`.

**Pinecone namespace scheme**: `user_{user_id}_doc_{doc_id}` — one namespace per document per user.

### Required env vars (`backend/.env`)

```
DATABASE_URL        # postgresql+asyncpg://...
GEMINI_API_KEY      # from aistudio.google.com
PINECONE_API_KEY
PINECONE_INDEX_HOST
PINECONE_INDEX_NAME # default: docmind
JWT_SECRET          # must match NEXTAUTH_SECRET in frontend
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
FRONTEND_URL        # for CORS
ENVIRONMENT         # development | production
```

---

## Frontend (Next.js 14 App Router)

### Dev commands

```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in keys

npm run dev     # http://localhost:3000
npm run build
npm run lint
```

### Architecture

**Auth flow**: NextAuth (Google OAuth) issues a session. The `jwt` callback in `src/lib/auth.ts` mints a separate HS256 `backendToken` (signed with `NEXTAUTH_SECRET` = backend's `JWT_SECRET`) that the FastAPI backend validates. Frontend fetches this token via `/api/auth/backend-token` and caches it in-memory (55-min TTL).

**API client** (`src/lib/api.ts`): axios instance with a request interceptor that auto-attaches the backend JWT. SSE streaming for chat is done with raw `fetch` + `ReadableStream` parsing.

**Pages** (App Router):
- `/` — landing/marketing page
- `/login` — Google sign-in
- `/upload` — drag-and-drop PDF upload with progress
- `/dashboard` — list documents + chat history
- `/chat/[session_id]` — active chat interface

**Styling**: Tailwind CSS v3. Custom `@pratham/ui` design system package bundled at `src/lib/ui/`.

### Required env vars (`frontend/.env.local`)

```
NEXTAUTH_SECRET         # same value as backend JWT_SECRET
NEXTAUTH_URL            # e.g. http://localhost:3000
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXT_PUBLIC_API_URL     # FastAPI base URL (default: Railway prod URL)
```

---

## Key Architectural Decisions

- **No OpenAI embeddings**: Pinecone integrated embedding handles vectorization server-side. `embedding_service.py` uses `upsert_records` (not `upsert`) and `index.search` with `inputs.text`.
- **JWT bridge**: NextAuth manages sessions; a custom HS256 token bridges to FastAPI. The frontend never sends the NextAuth session token directly to FastAPI.
- **SSE not WebSocket**: Chat streaming uses Server-Sent Events. The backend yields `data: {...}\n\n` strings; the frontend parses them with a `TextDecoder` + line buffer.
- **Supabase for prod DB**: Connection via `DATABASE_URL` (asyncpg). Migrations live in `supabase/migrations/` (pushed with `supabase db push`) and also in `backend/alembic/`.
