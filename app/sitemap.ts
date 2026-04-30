import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = "https://centralbolivia.com";

  // Gracefully skip DB query if env vars aren't available (e.g. during build)
  let listingUrls: MetadataRoute.Sitemap = [];
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createAdminClient();
      const { data: listings } = await supabase
        .from("listings")
        .select("slug, updated_at")
        .eq("status", "activo");

      listingUrls = (listings ?? []).map((l) => ({
        url: `${siteUrl}/propiedades/${l.slug}`,
        lastModified: l.updated_at ? new Date(l.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch {
    // ignore — return static URLs only
  }

  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/bienvenido`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...listingUrls,
  ];
}
