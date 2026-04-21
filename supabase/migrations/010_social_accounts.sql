-- Social account tokens for Instagram, Facebook, TikTok publishing
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS instagram_user_id      TEXT,
  ADD COLUMN IF NOT EXISTS instagram_access_token TEXT,
  ADD COLUMN IF NOT EXISTS facebook_page_id       TEXT,
  ADD COLUMN IF NOT EXISTS facebook_page_token    TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_open_id         TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_access_token    TEXT;
