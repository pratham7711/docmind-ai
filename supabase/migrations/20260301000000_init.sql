-- ─────────────────────────────────────────────────────────────────────────────
-- DocMind AI — Initial Schema
-- Project: docmind-ai (ref: owueeocfjmhihkahqnsm)
-- Region: ap-south-1 (Mumbai)
--
-- Run via:  supabase db push --project-ref owueeocfjmhihkahqnsm
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    avatar      VARCHAR(1024),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON users (email);

-- ─── documents ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename            VARCHAR(512) NOT NULL,
    size                INTEGER     NOT NULL,          -- bytes
    page_count          INTEGER     NOT NULL,
    pinecone_namespace  VARCHAR(512) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_documents_user_id ON documents (user_id);

-- ─── chat_sessions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_id      UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_chat_sessions_user_id ON chat_sessions (user_id);
CREATE INDEX IF NOT EXISTS ix_chat_sessions_doc_id  ON chat_sessions (doc_id);

-- ─── messages ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID        NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT        NOT NULL,
    sources     JSONB,                                 -- [{page, text_snippet}]
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_messages_session_id ON messages (session_id);

-- ─── Row Level Security (optional, recommended for Supabase) ──────────────────
-- Uncomment if you use Supabase Auth directly (not needed for JWT-only backend)
-- ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE documents    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;
