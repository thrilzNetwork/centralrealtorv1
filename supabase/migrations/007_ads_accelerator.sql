-- ─── 007 Ads Accelerator ────────────────────────────────────────────────────
-- Approval-gated managed ad service: clients apply, get vetted, top-up a
-- USD wallet via Stripe, submit campaign requests; Central staff launches
-- the ads from its own Meta/TikTok/Google accounts and deducts a 3% fee.

-- ── Profile additions ─────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_staff              BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ads_access_status     TEXT        NOT NULL DEFAULT 'none'
    CHECK (ads_access_status IN ('none','pending','approved','rejected','suspended')),
  ADD COLUMN IF NOT EXISTS wallet_balance_cents  BIGINT      NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS profiles_ads_access_idx ON profiles (ads_access_status);
CREATE INDEX IF NOT EXISTS profiles_is_staff_idx   ON profiles (is_staff) WHERE is_staff = true;

-- ── ads_applications ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ads_applications (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name           TEXT        NOT NULL,
  document_id         TEXT        NOT NULL,           -- CI number only, no image
  phone               TEXT        NOT NULL,
  city                TEXT        NOT NULL,
  social_links        TEXT        NOT NULL,           -- IG/FB/TikTok URLs
  meta_business_url   TEXT,                           -- Meta Business Manager URL
  meta_account_status TEXT        NOT NULL DEFAULT 'good'
    CHECK (meta_account_status IN ('good','restricted','none')),
  property_types      TEXT        NOT NULL,
  experience          TEXT        NOT NULL,
  referral_code       TEXT,
  accepted_terms_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  status              TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','suspended')),
  review_notes        TEXT,
  reviewed_by         UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ads_apps_profile_idx ON ads_applications (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ads_apps_status_idx  ON ads_applications (status, created_at DESC);

ALTER TABLE ads_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients read own applications"
  ON ads_applications FOR SELECT
  USING (auth.uid() = profile_id);
CREATE POLICY "Clients insert own application"
  ON ads_applications FOR INSERT
  WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Staff full access to applications"
  ON ads_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_staff = true));

-- ── wallet_transactions ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_cents        BIGINT      NOT NULL,           -- positive = credit, negative = debit
  type                TEXT        NOT NULL
    CHECK (type IN ('topup','fee','ad_spend','refund','adjustment')),
  stripe_session_id   TEXT,
  request_id          UUID,                           -- FK added after ad_requests table exists
  description         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wallet_tx_profile_idx ON wallet_transactions (profile_id, created_at DESC);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients read own transactions"
  ON wallet_transactions FOR SELECT
  USING (auth.uid() = profile_id);
CREATE POLICY "Staff full access to transactions"
  ON wallet_transactions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_staff = true));
CREATE POLICY "Service role manages transactions"
  ON wallet_transactions FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger: keep profiles.wallet_balance_cents in sync
CREATE OR REPLACE FUNCTION sync_wallet_balance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  target_profile_id UUID;
  new_balance BIGINT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_profile_id := OLD.profile_id;
  ELSE
    target_profile_id := NEW.profile_id;
  END IF;

  SELECT COALESCE(SUM(amount_cents), 0)
    INTO new_balance
    FROM wallet_transactions
   WHERE profile_id = target_profile_id;

  UPDATE profiles SET wallet_balance_cents = new_balance WHERE id = target_profile_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER wallet_balance_sync
  AFTER INSERT OR UPDATE OR DELETE ON wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION sync_wallet_balance();

-- ── ad_requests ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ad_requests (
  id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id              UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id              UUID        REFERENCES listings(id) ON DELETE SET NULL,
  platforms               TEXT[]      NOT NULL DEFAULT '{}',
  objective               TEXT        NOT NULL DEFAULT 'leads'
    CHECK (objective IN ('leads','views','messages','traffic')),
  total_budget_cents      BIGINT      NOT NULL,
  management_fee_cents    BIGINT      NOT NULL,
  ad_spend_budget_cents   BIGINT      NOT NULL,
  duration_days           INTEGER     NOT NULL DEFAULT 7,
  audience_notes          TEXT,
  creative_brief          TEXT,
  creative_assets         JSONB       NOT NULL DEFAULT '[]'::jsonb,
  status                  TEXT        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','queued','in_review','approved','launching','active','paused','completed','cancelled')),
  assigned_staff_id       UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  external_campaign_ids   JSONB       NOT NULL DEFAULT '{}'::jsonb,
  spend_reported_cents    BIGINT      NOT NULL DEFAULT 0,
  results                 JSONB       NOT NULL DEFAULT '{}'::jsonb,
  launched_at             TIMESTAMPTZ,
  completed_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_requests_profile_idx ON ad_requests (profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ad_requests_status_idx  ON ad_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS ad_requests_staff_idx   ON ad_requests (assigned_staff_id) WHERE assigned_staff_id IS NOT NULL;

ALTER TABLE ad_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients read own requests"
  ON ad_requests FOR SELECT
  USING (auth.uid() = profile_id);
CREATE POLICY "Clients insert own requests"
  ON ad_requests FOR INSERT
  WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Clients update own draft requests"
  ON ad_requests FOR UPDATE
  USING (auth.uid() = profile_id AND status = 'draft');
CREATE POLICY "Staff full access to requests"
  ON ad_requests FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_staff = true));
CREATE POLICY "Service role manages requests"
  ON ad_requests FOR ALL
  USING (auth.role() = 'service_role');

-- Add FK from wallet_transactions.request_id now that ad_requests exists
ALTER TABLE wallet_transactions
  ADD CONSTRAINT wallet_tx_request_fk
  FOREIGN KEY (request_id) REFERENCES ad_requests(id) ON DELETE SET NULL;

-- ── ad_request_updates (timeline / audit log) ─────────────────────────────

CREATE TABLE IF NOT EXISTS ad_request_updates (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id    UUID        NOT NULL REFERENCES ad_requests(id) ON DELETE CASCADE,
  author_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message       TEXT        NOT NULL,
  status_change TEXT,                   -- new status value, if this update changed the status
  attachments   JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_updates_request_idx ON ad_request_updates (request_id, created_at ASC);

ALTER TABLE ad_request_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients read updates on own requests"
  ON ad_request_updates FOR SELECT
  USING (EXISTS (SELECT 1 FROM ad_requests WHERE id = request_id AND profile_id = auth.uid()));
CREATE POLICY "Staff full access to updates"
  ON ad_request_updates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_staff = true));
CREATE POLICY "Service role manages updates"
  ON ad_request_updates FOR ALL
  USING (auth.role() = 'service_role');
