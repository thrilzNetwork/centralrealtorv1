-- ─── 003 Usage Metrics & Extended Profile Columns ───────────────────────────
-- Adds: usage_metrics table, kb_documents, brand_voice, chatbot_config,
--       google_refresh_token, google_calendar_id to profiles

-- ── usage_metrics ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_metrics (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start        DATE        NOT NULL,
  period_end          DATE        NOT NULL,
  ai_tokens_used      INTEGER     NOT NULL DEFAULT 0,
  kb_storage_mb       NUMERIC(10,2) NOT NULL DEFAULT 0,
  video_credits_used  INTEGER     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, period_start)
);

ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own metrics"
  ON usage_metrics FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Service role manages metrics"
  ON usage_metrics FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_usage_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER usage_metrics_updated_at
  BEFORE UPDATE ON usage_metrics
  FOR EACH ROW EXECUTE FUNCTION update_usage_metrics_updated_at();

-- ── Extended profile columns ──────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS kb_documents         JSONB       NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS brand_voice          TEXT,
  ADD COLUMN IF NOT EXISTS chatbot_config       JSONB       NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_id   TEXT;

-- ── ad_campaigns & ad_credits (Phase 7 — Ads Accelerator foundation) ─────────
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id            UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id            UUID        REFERENCES listings(id) ON DELETE SET NULL,
  platform              TEXT        CHECK (platform IN ('meta', 'tiktok')),
  status                TEXT        NOT NULL DEFAULT 'draft',
  budget_usd            NUMERIC(10,2),
  ad_copy               TEXT,
  creative_url          TEXT,
  external_campaign_id  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own campaigns"
  ON ad_campaigns FOR ALL
  USING (auth.uid() = profile_id);

CREATE TABLE IF NOT EXISTS ad_credits (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id            UUID        REFERENCES profiles(id) ON DELETE CASCADE,
  amount_usd            NUMERIC(10,2) NOT NULL,
  credits_remaining     NUMERIC(10,2) NOT NULL,
  stripe_payment_intent TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ad_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own credits"
  ON ad_credits FOR SELECT
  USING (auth.uid() = profile_id);
CREATE POLICY "Service role manages credits"
  ON ad_credits FOR ALL
  USING (auth.role() = 'service_role');
