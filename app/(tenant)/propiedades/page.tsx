import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { PropertiesGrid } from "@/components/themes/realtor-v1/PropertiesGrid";

export const metadata = { title: "Propiedades" };

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; orden?: string; q?: string }>;
}) {
  const params = await searchParams;
  const headerStore = await headers();
  const tenantSlug = headerStore.get("x-tenant-slug") ?? "";

  const supabase = createAdminClient();

  let query = supabase
    .from("listings")
    .select("id, slug, title, description, property_type, price, currency, area_m2, bedrooms, bathrooms, images, neighborhood, city, lat, lng, hearts, views")
    .eq("status", "activo")
    .order("created_at", { ascending: false });

  // Get profile to filter by realtor
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("slug", tenantSlug)
    .single();

  if (profile) {
    query = query.eq("profile_id", profile.id);
  }

  if (params.tipo) {
    query = query.eq("property_type", params.tipo as import("@/types/database").PropertyType);
  }

  const { data: listings } = await query;

  return (
    <PropertiesGrid
      listings={listings ?? []}
      selectedType={params.tipo}
      searchQuery={params.q}
    />
  );
}
