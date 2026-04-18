-- ─── 005 Brand Assets + RAG Embeddings + Lead Scoring + Usage Events ──────
-- Adds the tables required by Rounds B.6, C.9, C.10, D.14.

-- ── brand_assets: Brand Manager library persistence ──────────────────────
CREATE TABLE IF NOT EXISTS brand_assets (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL,            -- e.g. 'social_post', 'image_social', 'video_cinematic'
  label        TEXT,
  content      TEXT,
  image_url    TEXT,
  video_url    TEXT,
  platform     TEXT,
  metadata     JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brand_assets_profile_created_idx
  ON brand_assets (profile_id, created_at DESC);

ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own brand assets"
  ON brand_assets FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- ── pgvector + kb_embeddings: real semantic RAG ──────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS kb_embeddings (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doc_id       TEXT,                                      -- opaque identifier grouping chunks of one KB upload
  chunk_index  INTEGER     NOT NULL DEFAULT 0,
  content      TEXT        NOT NULL,
  embedding    VECTOR(768) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kb_embeddings_profile_idx
  ON kb_embeddings (profile_id);

-- ivfflat needs tuning per corpus; lists=100 is a safe default for <100k chunks.
CREATE INDEX IF NOT EXISTS kb_embeddings_vec_idx
  ON kb_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE kb_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own embeddings"
  ON kb_embeddings FOR SELECT
  USING (auth.uid() = profile_id);
CREATE POLICY "Users insert own embeddings"
  ON kb_embeddings FOR INSERT
  WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users delete own embeddings"
  ON kb_embeddings FOR DELETE
  USING (auth.uid() = profile_id);
CREATE POLICY "Service role manages embeddings"
  ON kb_embeddings FOR ALL
  USING (auth.role() = 'service_role');

-- Helper function: returns top-k chunks by cosine similarity for a given profile.
CREATE OR REPLACE FUNCTION match_kb_embeddings(
  query_embedding VECTOR(768),
  match_profile   UUID,
  match_count     INT DEFAULT 6
)
RETURNS TABLE (
  id         UUID,
  content    TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT
    id,
    content,
    1 - (embedding <=> query_embedding) AS similarity
  FROM kb_embeddings
  WHERE profile_id = match_profile
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── chat_conversations + chat_messages: persist chatbot history ──────────
CREATE TABLE IF NOT EXISTS chat_conversations (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visitor_name    TEXT,
  visitor_email   TEXT,
  visitor_phone   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_conversations_profile_idx
  ON chat_conversations (profile_id, created_at DESC);

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own conversations"
  ON chat_conversations FOR SELECT
  USING (auth.uid() = profile_id);
CREATE POLICY "Service role manages conversations"
  ON chat_conversations FOR ALL
  USING (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS chat_messages (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID        NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_conv_idx
  ON chat_messages (conversation_id, created_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own messages via conversation"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations c
      WHERE c.id = chat_messages.conversation_id
        AND c.profile_id = auth.uid()
    )
  );
CREATE POLICY "Service role manages messages"
  ON chat_messages FOR ALL
  USING (auth.role() = 'service_role');

-- ── Lead scoring + nurture tracking ──────────────────────────────────────
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS score             INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_tier        TEXT        CHECK (score_tier IN ('hot', 'warm', 'cold')) DEFAULT 'cold',
  ADD COLUMN IF NOT EXISTS last_nurture_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nurture_count     INTEGER     NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS leads_profile_score_idx ON leads (profile_id, score DESC);
CREATE INDEX IF NOT EXISTS leads_nurture_idx       ON leads (last_nurture_at);

-- ── usage_events: per-route telemetry ───────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_events (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id   UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  route        TEXT        NOT NULL,
  tokens       INTEGER,
  latency_ms   INTEGER,
  status       INTEGER,
  metadata     JSONB       NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS usage_events_profile_idx
  ON usage_events (profile_id, created_at DESC);

ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own usage events"
  ON usage_events FOR SELECT
  USING (auth.uid() = profile_id);
CREATE POLICY "Service role manages usage events"
  ON usage_events FOR ALL
  USING (auth.role() = 'service_role');
