import { createAdminClient } from "@/lib/supabase/admin";
import type { TenantProfile } from "@/types/tenant";

// In-memory LRU-style cache with TTL
const cache = new Map<string, { data: TenantProfile | null; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 60 seconds

function getCached(key: string): TenantProfile | null | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.data;
}

function setCached(key: string, data: TenantProfile | null): void {
  // Evict oldest if cache is large
  if (cache.size > 500) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function resolveBySlug(
  slug: string
): Promise<TenantProfile | null> {
  const cached = getCached(`slug:${slug}`);
  if (cached !== undefined) return cached;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, whatsapp, slug, custom_domain, logo_url, primary_color, secondary_color, theme, bio, city"
    )
    .eq("slug", slug)
    .single();

  const profile = data as TenantProfile | null;
  setCached(`slug:${slug}`, profile);
  return profile;
}

export async function resolveByCustomDomain(
  domain: string
): Promise<TenantProfile | null> {
  const cached = getCached(`domain:${domain}`);
  if (cached !== undefined) return cached;

  const supabase = createAdminClient();

  // Check domain_mappings first
  const { data: mapping } = await supabase
    .from("domain_mappings")
    .select("profile_id")
    .eq("domain", domain)
    .eq("verified", true)
    .single();

  if (!mapping) {
    // Also check profiles.custom_domain directly
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, whatsapp, slug, custom_domain, logo_url, primary_color, secondary_color, theme, bio, city"
      )
      .eq("custom_domain", domain)
      .single();

    const result = profile as TenantProfile | null;
    setCached(`domain:${domain}`, result);
    return result;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, whatsapp, slug, custom_domain, logo_url, primary_color, secondary_color, theme, bio, city"
    )
    .eq("id", mapping.profile_id)
    .single();

  const result = profile as TenantProfile | null;
  setCached(`domain:${domain}`, result);
  return result;
}

export function invalidateCache(key: string): void {
  cache.delete(`slug:${key}`);
  cache.delete(`domain:${key}`);
}
