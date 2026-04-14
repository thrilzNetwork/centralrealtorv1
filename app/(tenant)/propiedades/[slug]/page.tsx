import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { PropertyDetail } from "@/components/themes/realtor-v1/PropertyDetail";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("listings")
    .select("title, description, city")
    .eq("slug", slug)
    .single();

  return {
    title: data?.title ?? "Propiedad",
    description: data?.description?.slice(0, 160) ?? "",
  };
}

export default async function PropertyPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "activo")
    .single();

  if (!listing) return notFound();

  // Increment views async (fire and forget)
  supabase.rpc("increment_listing_views", { listing_slug: slug });

  return <PropertyDetail listing={listing} />;
}
