-- ─── 009 Audit Log ─────────────────────────────────────────────────────────
-- Append-only log of privileged actions. Service-role writes only.
-- Staff can read everything; clients can read their own entries (subject_id).

CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,           -- e.g. 'ads.application.review', 'ads.campaign.launch'
  subject_id  UUID,                           -- profile_id affected (client whose wallet changed, etc.)
  resource    TEXT,                           -- free-form resource descriptor (e.g. 'ad_request:<id>')
  metadata    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_actor_idx   ON audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_subject_idx ON audit_log (subject_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_action_idx  ON audit_log (action, created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Staff read all
CREATE POLICY "Staff read all audit entries"
  ON audit_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_staff = true));

-- Subject (affected client) reads own entries
CREATE POLICY "Clients read own audit entries"
  ON audit_log FOR SELECT
  USING (auth.uid() = subject_id);

-- No client writes; inserts only via service role (admin client).
