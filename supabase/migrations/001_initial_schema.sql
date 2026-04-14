-- ============================================================
-- CENTRAL BOLIVIA — Initial Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Enums ──────────────────────────────────────────────────
CREATE TYPE theme_type AS ENUM ('modern', 'luxury', 'classic', 'realtor-v1');
CREATE TYPE listing_status AS ENUM ('borrador', 'activo', 'vendido', 'alquilado', 'inactivo');
CREATE TYPE property_type AS ENUM ('casa', 'departamento', 'terreno', 'oficina', 'local_comercial', 'otro');
CREATE TYPE plan_type AS ENUM ('basico', 'profesional', 'broker');
CREATE TYPE lead_status AS ENUM ('nuevo', 'contactado', 'en_seguimiento', 'cerrado');
CREATE TYPE payment_method AS ENUM ('stripe', 'manual_qr', 'manual_transfer');

-- ─── Organizations (Broker Agencies) ────────────────────────
CREATE TABLE organizations (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                  TEXT NOT NULL,
    slug                  TEXT UNIQUE NOT NULL,
    plan                  plan_type NOT NULL DEFAULT 'basico',
    stripe_customer_id    TEXT UNIQUE,
    stripe_subscription_id TEXT,
    payment_method        payment_method DEFAULT 'stripe',
    subscription_status   TEXT DEFAULT 'trialing',
    trial_started_at      TIMESTAMPTZ DEFAULT NOW(),
    trial_expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 days'),
    is_active             BOOLEAN DEFAULT TRUE,
    feature_flags         JSONB DEFAULT '{}'::jsonb,
    max_agents            INTEGER DEFAULT 1,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Profiles (Realtors) ─────────────────────────────────────
CREATE TABLE profiles (
    id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id       UUID REFERENCES organizations(id) ON DELETE SET NULL,
    full_name             TEXT NOT NULL DEFAULT '',
    email                 TEXT NOT NULL DEFAULT '',
    phone                 TEXT,
    whatsapp              TEXT,
    slug                  TEXT UNIQUE NOT NULL,
    custom_domain         TEXT UNIQUE,
    logo_url              TEXT,
    primary_color         TEXT DEFAULT '#FF7F11',
    secondary_color       TEXT DEFAULT '#ACBFA4',
    theme                 theme_type DEFAULT 'realtor-v1',
    bio                   TEXT,
    city                  TEXT DEFAULT 'Santa Cruz',
    is_broker_admin       BOOLEAN DEFAULT FALSE,
    onboarding_completed  BOOLEAN DEFAULT FALSE,
    stripe_customer_id    TEXT UNIQUE,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Listings (Properties) ───────────────────────────────────
CREATE TABLE listings (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id       UUID REFERENCES organizations(id) ON DELETE SET NULL,
    slug                  TEXT UNIQUE NOT NULL,
    title                 TEXT NOT NULL,
    description           TEXT,
    ai_generated          BOOLEAN DEFAULT FALSE,
    property_type         property_type NOT NULL DEFAULT 'casa',
    status                listing_status NOT NULL DEFAULT 'borrador',

    -- Location
    address               TEXT,
    neighborhood          TEXT,
    city                  TEXT,
    department            TEXT,
    lat                   DECIMAL(9,6),
    lng                   DECIMAL(9,6),
    place_id              TEXT,

    -- Specs
    price                 DECIMAL(12,2),
    currency              TEXT DEFAULT 'USD',
    area_m2               DECIMAL(8,2),
    bedrooms              INTEGER,
    bathrooms             INTEGER,
    parking               INTEGER,
    floor                 INTEGER,
    total_floors          INTEGER,

    -- Media
    images                TEXT[] DEFAULT '{}',
    video_url             TEXT,
    virtual_tour_url      TEXT,

    -- AI metadata
    neighborhood_summary  TEXT,
    ai_prompt_used        TEXT,
    source_pdf_url        TEXT,

    views                 INTEGER DEFAULT 0,
    hearts                INTEGER DEFAULT 0,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX listings_profile_id_idx ON listings(profile_id);
CREATE INDEX listings_status_idx ON listings(status);
CREATE INDEX listings_fts_idx ON listings
    USING GIN(to_tsvector('spanish', COALESCE(title,'') || ' ' || COALESCE(description,'') || ' ' || COALESCE(neighborhood,'')));

-- ─── Members (Buyers) ────────────────────────────────────────
CREATE TABLE members (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email                 TEXT NOT NULL,
    full_name             TEXT,
    phone                 TEXT,
    auth_user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    profile_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX members_email_profile_idx ON members(email, profile_id);

-- ─── Leads (Heart / Favorite actions) ───────────────────────
CREATE TABLE leads (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id            UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    profile_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    member_id             UUID REFERENCES members(id) ON DELETE SET NULL,
    visitor_email         TEXT,
    visitor_name          TEXT,
    visitor_phone         TEXT,
    status                lead_status DEFAULT 'nuevo',
    notes                 TEXT,
    notified_at           TIMESTAMPTZ,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX leads_profile_id_idx ON leads(profile_id);
CREATE INDEX leads_listing_id_idx ON leads(listing_id);

-- ─── Notifications ───────────────────────────────────────────
CREATE TABLE notifications (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lead_id               UUID REFERENCES leads(id) ON DELETE CASCADE,
    type                  TEXT NOT NULL,
    title                 TEXT NOT NULL,
    body                  TEXT,
    read                  BOOLEAN DEFAULT FALSE,
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notifications_profile_id_idx ON notifications(profile_id);

-- ─── Domain Mappings ─────────────────────────────────────────
CREATE TABLE domain_mappings (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    domain                TEXT NOT NULL UNIQUE,
    verified              BOOLEAN DEFAULT FALSE,
    vercel_domain_id      TEXT,
    dns_instructions      JSONB,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    verified_at           TIMESTAMPTZ
);

-- ─── updated_at Trigger ──────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_listings
    BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_leads
    BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_organizations
    BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ─── Auto-create profile on signup ───────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter   INTEGER := 0;
BEGIN
    base_slug := LOWER(REGEXP_REPLACE(
        COALESCE(NEW.raw_user_meta_data->>'slug', SPLIT_PART(NEW.email, '@', 1)),
        '[^a-z0-9]', '-', 'g'
    ));
    base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
    base_slug := TRIM(BOTH '-' FROM base_slug);
    final_slug := base_slug;

    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM profiles WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;

    INSERT INTO profiles (id, email, full_name, slug)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        final_slug
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Increment listing views ──────────────────────────────────
CREATE OR REPLACE FUNCTION increment_listing_views(listing_slug TEXT)
RETURNS VOID AS $$
    UPDATE listings SET views = views + 1 WHERE slug = listing_slug;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ─── Increment listing hearts ────────────────────────────────
CREATE OR REPLACE FUNCTION increment_listing_hearts(listing_id UUID)
RETURNS VOID AS $$
    UPDATE listings SET hearts = hearts + 1 WHERE id = listing_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ─── Row Level Security ───────────────────────────────────────
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations  ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_public_read"   ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_owner_write"   ON profiles FOR UPDATE USING (auth.uid() = id);

-- LISTINGS
CREATE POLICY "listings_public_active" ON listings FOR SELECT USING (status = 'activo');
CREATE POLICY "listings_owner_all"     ON listings FOR ALL   USING (auth.uid() = profile_id);
CREATE POLICY "listings_broker_read"   ON listings FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.organization_id = listings.organization_id
        AND p.is_broker_admin = TRUE
    )
);

-- LEADS
CREATE POLICY "leads_owner_read"       ON leads FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "leads_public_insert"    ON leads FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "leads_owner_update"     ON leads FOR UPDATE USING (auth.uid() = profile_id);

-- MEMBERS
CREATE POLICY "members_owner_read"     ON members FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "members_self_read"      ON members FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY "members_public_insert"  ON members FOR INSERT WITH CHECK (TRUE);

-- NOTIFICATIONS
CREATE POLICY "notifications_owner"    ON notifications FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "notifications_update"   ON notifications FOR UPDATE USING (auth.uid() = profile_id);

-- DOMAIN MAPPINGS
CREATE POLICY "domains_owner"          ON domain_mappings FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "domains_public_read"    ON domain_mappings FOR SELECT USING (verified = TRUE);

-- ORGANIZATIONS
CREATE POLICY "orgs_member_read"       ON organizations FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.organization_id = organizations.id AND profiles.id = auth.uid())
);
CREATE POLICY "orgs_public_read"       ON organizations FOR SELECT USING (TRUE);
CREATE POLICY "orgs_admin_update"      ON organizations FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.organization_id = organizations.id
        AND profiles.id = auth.uid()
        AND profiles.is_broker_admin = TRUE
    )
);

-- ─── 3-Day Trial Expiration Cron Job ─────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
    'expire_trials_job',
    '0 * * * *',
    $$
    UPDATE organizations
    SET is_active = FALSE,
        subscription_status = 'expired'
    WHERE plan = 'basico'
      AND trial_expires_at < NOW()
      AND is_active = TRUE;
    $$
);
