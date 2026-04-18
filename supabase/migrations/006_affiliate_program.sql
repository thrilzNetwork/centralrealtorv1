-- ─── 006 Affiliate Program ────────────────────────────────────
-- Tables for affiliate applications, approved affiliates, referrals, and credit ledger.

-- ── affiliate_applications: public form submissions awaiting admin review ──
CREATE TABLE IF NOT EXISTS affiliate_applications (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  phone         TEXT,
  audience_size TEXT,                      -- e.g. "10k Instagram followers"
  channels      TEXT,                      -- where they plan to promote
  message       TEXT,                      -- free-text pitch
  social_links  TEXT,                      -- IG, YouTube, TikTok, web
  status        TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by   UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_apps_status_idx
  ON affiliate_applications (status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS affiliate_apps_email_pending_idx
  ON affiliate_applications (lower(email))
  WHERE status = 'pending';

ALTER TABLE affiliate_applications ENABLE ROW LEVEL SECURITY;
-- Anyone (even anon) can INSERT a new application via the public form.
CREATE POLICY "Anyone can apply"
  ON affiliate_applications FOR INSERT
  WITH CHECK (true);
-- Only service role can read/update/delete applications (admin panel uses admin client).
CREATE POLICY "Service role manages applications"
  ON affiliate_applications FOR ALL
  USING (auth.role() = 'service_role');

-- ── affiliates: approved users with a unique referral code ────────────
CREATE TABLE IF NOT EXISTS affiliates (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id            UUID        UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  application_id        UUID        REFERENCES affiliate_applications(id) ON DELETE SET NULL,
  code                  TEXT        NOT NULL UNIQUE,   -- e.g. "ALEJO20"
  email                 TEXT        NOT NULL,
  full_name             TEXT        NOT NULL,
  tier                  INTEGER     NOT NULL DEFAULT 1   -- 1=10%, 2=20%, 3=30%
                        CHECK (tier IN (1, 2, 3)),
  commission_percent    INTEGER     NOT NULL DEFAULT 10,
  total_referrals       INTEGER     NOT NULL DEFAULT 0,
  total_paid_referrals  INTEGER     NOT NULL DEFAULT 0,
  credit_balance_cents  INTEGER     NOT NULL DEFAULT 0,   -- lifetime credit earned, in cents
  credit_used_cents     INTEGER     NOT NULL DEFAULT 0,   -- credit already applied
  active                BOOLEAN     NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliates_profile_idx ON affiliates (profile_id);
CREATE INDEX IF NOT EXISTS affiliates_code_idx    ON affiliates (code);

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates read own row"
  ON affiliates FOR SELECT
  USING (auth.uid() = profile_id);
CREATE POLICY "Service role manages affiliates"
  ON affiliates FOR ALL
  USING (auth.role() = 'service_role');

-- ── referrals: one row per user who signed up with a code ──────────────
CREATE TABLE IF NOT EXISTS referrals (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id          UUID        NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_profile_id   UUID        UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  referred_email        TEXT,
  plan                  TEXT,                            -- 'profesional' | 'broker' | null while unpaid
  status                TEXT        NOT NULL DEFAULT 'signed_up'
                        CHECK (status IN ('signed_up', 'paid', 'churned')),
  commission_cents      INTEGER     NOT NULL DEFAULT 0,  -- what the affiliate earned from this referral
  first_payment_at      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referrals_affiliate_idx ON referrals (affiliate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS referrals_status_idx    ON referrals (status);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates read own referrals"
  ON referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM affiliates a
      WHERE a.id = referrals.affiliate_id
        AND a.profile_id = auth.uid()
    )
  );
CREATE POLICY "Service role manages referrals"
  ON referrals FOR ALL
  USING (auth.role() = 'service_role');

-- ── affiliate_credits: ledger of every credit issued / redeemed ────────
CREATE TABLE IF NOT EXISTS affiliate_credits (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id   UUID        NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referral_id    UUID        REFERENCES referrals(id) ON DELETE SET NULL,
  amount_cents   INTEGER     NOT NULL,    -- positive = earned, negative = redeemed
  reason         TEXT        NOT NULL,    -- 'commission' | 'redemption' | 'bonus' | 'adjustment'
  description    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS affiliate_credits_affiliate_idx
  ON affiliate_credits (affiliate_id, created_at DESC);

ALTER TABLE affiliate_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliates read own credits"
  ON affiliate_credits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM affiliates a
      WHERE a.id = affiliate_credits.affiliate_id
        AND a.profile_id = auth.uid()
    )
  );
CREATE POLICY "Service role manages credits"
  ON affiliate_credits FOR ALL
  USING (auth.role() = 'service_role');

-- ── Store ref code on profiles so we know who referred whom ────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code_used TEXT,
  ADD COLUMN IF NOT EXISTS referred_by_affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_referred_by_idx ON profiles (referred_by_affiliate_id);

-- ── Helper: recompute tier from total_paid_referrals ──────────────────
-- Tier 1: 0-5 paid referrals → 10%
-- Tier 2: 6-15 paid referrals → 20%
-- Tier 3: 16+ paid referrals → 30%
CREATE OR REPLACE FUNCTION recompute_affiliate_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_paid_referrals >= 16 THEN
    NEW.tier := 3;
    NEW.commission_percent := 30;
  ELSIF NEW.total_paid_referrals >= 6 THEN
    NEW.tier := 2;
    NEW.commission_percent := 20;
  ELSE
    NEW.tier := 1;
    NEW.commission_percent := 10;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS affiliate_tier_trigger ON affiliates;
CREATE TRIGGER affiliate_tier_trigger
  BEFORE UPDATE OF total_paid_referrals ON affiliates
  FOR EACH ROW EXECUTE FUNCTION recompute_affiliate_tier();
