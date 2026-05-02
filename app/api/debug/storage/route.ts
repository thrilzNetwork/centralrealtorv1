import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = createAdminClient();
  
  // List buckets
  const { data: buckets, error: bucketError } = await admin.storage.listBuckets();
  
  // Check if 'listings' bucket exists and its policy
  const listingsBucket = buckets?.find(b => b.name === "listings");
  
  // Get first few listings to see image URLs
  const { data: listings } = await admin.from("listings").select("id, title, images").limit(3);
  
  return NextResponse.json({
    buckets: buckets?.map(b => ({ name: b.name, public: b.public })) ?? [],
    listings_bucket_exists: !!listingsBucket,
    listings_bucket_public: listingsBucket?.public ?? false,
    sample_listings: listings ?? [],
    bucket_error: bucketError?.message ?? null,
  });
}
