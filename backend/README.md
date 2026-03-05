# DocMind AI — Backend

FastAPI backend for DocMind AI: upload PDFs, ask questions, get AI-powered answers with source citations — streamed in real time.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client (Next.js)                           │
│                    NextAuth Google OAuth → JWT                      │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  HTTPS  Bearer JWT
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                                │
│                                                                     │
│  POST /api/v1/upload   ──► PDF Parser (PyPDF2)                      │
│                             └► Chunker (LangChain TextSplitter)     │
│                             └► OpenAI Embeddings (text-emb-3-small) │
│                             └► Pinecone Upsert (per-doc namespace)  │
│                             └► PostgreSQL (Document record)         │
│                             └► Redis Cache (doc metadata, TTL 1hr)  │
│                                                                     │
│  POST /api/v1/chat     ──► Redis Rate Limiter (10 req/min)          │
│      SSE Streaming          └► Pinecone Query (top-5 chunks)        │
│                             └► LangChain RAG Chain                  │
│                             └► GPT-4o-mini (streaming)              │
│                             └► SSE Events → Client                  │
│                             └► PostgreSQL (Message record)          │
│                                                                     │
│  GET  /api/v1/documents                                             │
│  DEL  /api/v1/documents/{id}  ──► Pinecone delete namespace         │
│  GET  /api/v1/history                                               │
│  GET  /api/v1/history/{id}                                          │
└──────────────┬─────────────────┬──────────────┬──────────────┬──────┘
               │                 │              │              │
               ▼                 ▼              ▼              ▼
        PostgreSQL           Pinecone        OpenAI         Redis
        (Supabase)         Vector Store       API          (Upstash)
        ap-south-1          1536 dims     gpt-4o-mini    Rate limiting
                             cosine      text-emb-3-sm   + doc cache
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/health` | — | Liveness probe |
| `POST` | `/api/v1/upload` | ✅ JWT | Upload PDF (multipart, max 10MB) |
| `POST` | `/api/v1/chat` | ✅ JWT | SSE streaming RAG chat |
| `GET`  | `/api/v1/documents` | ✅ JWT | List user's documents |
| `DELETE` | `/api/v1/documents/{id}` | ✅ JWT | Delete document + vectors |
| `GET`  | `/api/v1/history` | ✅ JWT | List all chat sessions |
| `GET`  | `/api/v1/history/{session_id}` | ✅ JWT | Full message history for session |

### SSE Event Types (POST /chat)
```json
{"type": "token",   "content": "..."}          // streamed token
{"type": "sources", "sources": [{...}]}         // after stream completes
{"type": "done",    "session_id": "..."}        // session UUID
{"type": "error",   "message": "..."}           // on failure
```

---

## Local Setup

### Prerequisites
- Python 3.11+
- PostgreSQL 16 (or use Docker / Supabase)
- All API keys (see **What You Need to Set Up** below)

### 1 — Clone & virtualenv
```bash
git clone https://github.com/your-username/docmind-ai.git
cd docmind-ai/backend

python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2 — Configure environment
```bash
cp .env.example .env
# Edit .env — fill in OPENAI_API_KEY, PINECONE_*, UPSTASH_* placeholders
```

### 3 — Run database migrations

**Option A — Alembic (local Postgres)**
```bash
alembic upgrade head
```

**Option B — Supabase (already provisioned)**
```bash
supabase db push --project-ref owueeocfjmhihkahqnsm
```

### 4 — Start the server
```bash
uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI, development only)
```

---

## Docker Setup (local dev with local Postgres)

```bash
cd backend
docker compose up --build
```

This starts:
- `docmind-api` — FastAPI on port 8000
- `docmind-db`  — PostgreSQL 16 on port 5432

> **Note:** The Docker setup uses a local Postgres. For production use Supabase (set `DATABASE_URL` in your env).

Run migrations against the Docker Postgres:
```bash
docker compose exec api alembic upgrade head
```

---

## Supabase Setup ✅ Already Provisioned

The Supabase project is already created. No action needed here.

- **Project:** docmind-ai
- **Ref:** `owueeocfjmhihkahqnsm`
- **Region:** ap-south-1 (Mumbai)
- **Dashboard:** https://supabase.com/dashboard/project/owueeocfjmhihkahqnsm

### Push schema to Supabase
```bash
# From the repo root (docmind-ai/)
supabase db push --project-ref owueeocfjmhihkahqnsm
```

This runs `supabase/migrations/20260301000000_init.sql` which creates all 4 tables.

> The `DATABASE_URL` is already pre-filled in `backend/.env`.

---

## Railway Deployment

1. **Create a Railway project** → New Project → Deploy from GitHub repo
2. **Set root directory** → `backend` (Railway auto-detects Dockerfile)
3. **Add environment variables** in Railway dashboard — copy from your `.env` but use production values:
   - `DATABASE_URL` — your Supabase URL (already in `.env`)
   - `OPENAI_API_KEY`
   - `PINECONE_API_KEY`, `PINECONE_INDEX_HOST`, `PINECONE_INDEX_NAME`
   - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
   - `JWT_SECRET` — same value as `NEXTAUTH_SECRET` in your Next.js app
   - `FRONTEND_URL` — your Vercel deployment URL (e.g. `https://docmind-ai.vercel.app`)
   - `ENVIRONMENT=production`
4. Railway will build the Dockerfile and expose the service on a `.railway.app` URL
5. Use that URL as the API base URL in your Next.js `.env.local`

---

## What You Need to Set Up Manually

The following external services are **not yet configured**. Create accounts and add the keys to `backend/.env`:

### 1. OpenAI
- Go to https://platform.openai.com/api-keys
- Create an API key
- Set `OPENAI_API_KEY=sk-...`

### 2. Pinecone (Vector DB)
- Go to https://app.pinecone.io
- Create a **Serverless** index:
  - Name: `docmind`
  - Dimensions: `1536`
  - Metric: `cosine`
  - Cloud: AWS, Region: ap-south-1 (or nearest to you)
- Copy the **API key** → `PINECONE_API_KEY`
- Copy the **Index Host** URL → `PINECONE_INDEX_HOST`

### 3. Upstash Redis (Rate Limiting + Cache)
- Go to https://console.upstash.com
- Create a **Redis** database (serverless)
- Copy **REST URL** → `UPSTASH_REDIS_REST_URL`
- Copy **REST Token** → `UPSTASH_REDIS_REST_TOKEN`

### 4. JWT Secret (already generated ✅)
- `JWT_SECRET` is pre-filled in `backend/.env`
- Use the **same value** as `NEXTAUTH_SECRET` in your Next.js `frontend/.env.local`

---

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, router registration
│   ├── config.py            # Pydantic Settings (loads from .env)
│   ├── database.py          # SQLAlchemy async engine + session
│   ├── dependencies.py      # Auth middleware, DB/Redis/Pinecone DI
│   ├── models.py            # ORM models: User, Document, ChatSession, Message
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── routers/
│   │   ├── upload.py        # POST /upload
│   │   ├── chat.py          # POST /chat (SSE streaming)
│   │   ├── history.py       # GET /history, GET /history/{id}
│   │   └── documents.py     # GET /documents, DELETE /documents/{id}
│   └── services/
│       ├── pdf_service.py        # PyPDF2 parsing + LangChain chunking
│       ├── embedding_service.py  # OpenAI embeddings + Pinecone upsert
│       ├── rag_service.py        # LangChain RAG chain + SSE streaming
│       └── rate_limiter.py       # Upstash Redis sliding-window limiter
├── alembic/                 # DB migrations (Alembic)
│   ├── env.py
│   └── versions/0001_init_schema.py
├── alembic.ini
├── Dockerfile
├── docker-compose.yml       # Local dev (FastAPI + local Postgres)
├── requirements.txt
├── .env                     # Real credentials (pre-filled, gitignore this!)
├── .env.example             # Template for new environments
└── README.md
```

---

## Rate Limiting

- **10 requests per minute** per authenticated user
- Uses Upstash Redis INCR + EXPIRE pattern
- Returns `HTTP 429` with `Retry-After` header when exceeded
- Fails open if Redis is unavailable (requests are not blocked)

---

## Auth Flow

This backend does **not** issue JWTs — that's the Next.js + NextAuth frontend's job.

1. User signs in via Google OAuth on the Next.js frontend
2. NextAuth issues a signed JWT (`NEXTAUTH_SECRET` = `JWT_SECRET` in this backend)
3. Frontend sends `Authorization: Bearer <token>` with every API request
4. This backend decodes + validates the JWT, then upserts the User record

---

## Known Limitations / TODOs

- Image-only PDFs (scanned without OCR) will fail with a 422 — consider adding Tesseract OCR
- No pagination on `/history` or `/documents` (add `limit`/`offset` when lists grow large)
- Pinecone namespace deletion is synchronous; for very large docs this may be slow
- No file deduplication — uploading the same PDF twice creates two separate documents
- `alembic upgrade head` must be run manually before first boot; no auto-migration on startup
