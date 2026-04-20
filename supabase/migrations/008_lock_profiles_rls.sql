-- ============================================================
-- LOCK DOWN PROFILES RLS — PREVENT PII LEAK
-- ============================================================
-- Before this migration, profiles_public_read_limited allowed SELECT * on
-- every profile row. That exposed email, phone, whatsapp, and
-- stripe_customer_id to anyone holding the anon key.
--
-- After this migration:
--   - Direct SELECT on profiles is owner-only (auth.uid() = id).
--   - A view `public_profiles` exposes the safe subset of columns needed
--     for public-facing pages (agent portal, listings, etc.).
--   - Server-side reads that need more data keep using the service role
--     via createAdminClient(), which bypasses RLS.
-- ============================================================

-- 1. Remove the permissive public read policy.
DROP POLICY IF EXISTS "profiles_public_read_limited" ON profiles;
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;

-- 2. Keep / add owner-only direct read.
DROP POLICY IF EXISTS "profiles_owner_read" ON profiles;
CREATE POLICY "profiles_owner_read" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- 3. Allow brokers to read profiles in their organization (already existed
--    for listings; extend to profiles for team management).
DROP POLICY IF EXISTS "profiles_org_read" ON profiles;
CREATE POLICY "profiles_org_read" ON profiles
    FOR SELECT USING (
        organization_id IS NOT NULL
        AND organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- 4. Public view with only safe columns. Anyone (anon, authenticated,
--    service role) can read these without leaking PII.
CREATE OR REPLACE VIEW public_profiles AS
    SELECT
        id,
        full_name,
        slug,
        custom_domain,
        logo_url,
        primary_color,
        secondary_color,
        theme,
        bio,
        city
    FROM profiles;

-- Grant explicit access so the view works under RLS.
GRANT SELECT ON public_profiles TO anon, authenticated;

-- 5. Audit notice: any frontend code that queries profiles anonymously for
--    another user's data must switch to public_profiles. Server routes
--    using createAdminClient() are unaffected (they bypass RLS).
COMMENT ON VIEW public_profiles IS
    'Safe subset of profiles table for public consumption. Does not expose email, phone, whatsapp, stripe_customer_id, or organization_id.';
