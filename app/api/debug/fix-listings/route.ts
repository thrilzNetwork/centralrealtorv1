import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isRealPropertyImage(src: string): boolean {
  const lower = src.toLowerCase();
  if (/google-play|app-store|appstore|disponible.*google|disponible.*app/i.test(lower)) return false;
  if (/flag|bandera|isotipo/i.test(lower)) return false;
  if (/search|magnif|lupa/i.test(lower)) return false;
  if (/th\.(outside)?24x24|th\.(outside)?110x50|th\.(outside)?700x200/i.test(lower)) return false;
  if (/logo|icon|avatar|sprite|banner-top|pixel|tracking|blank|placeholder/i.test(lower)) return false;
  return true;
}

export async function GET() {
  const admin = createAdminClient();
  const results: string[] = [];
  
  // Fix all listings where title starts with "CASA" but property_type is NOT "casa"
  const { data: badListings } = await admin
    .from("listings")
    .select("id, title, property_type, images")
    .ilike("title", "CASA%")
    .neq("property_type", "casa");
    
  for (const listing of (badListings ?? [])) {
    // Fix property type
    await admin.from("listings").update({ property_type: "casa", updated_at: new Date().toISOString() }).eq("id", listing.id);
    
    // Filter images
    const cleanImages = (listing.images ?? []).filter(isRealPropertyImage);
    if (cleanImages.length !== listing.images?.length) {
      await admin.from("listings").update({ images: cleanImages, updated_at: new Date().toISOString() }).eq("id", listing.id);
    }
    
    results.push(`Fixed ${listing.id}: type ${listing.property_type}→casa, ${listing.images?.length ?? 0}→${cleanImages.length} images`);
  }
  
  return NextResponse.json({ fixed: results.length, details: results });
}
