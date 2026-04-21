import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BrandManager } from "@/components/dashboard/BrandManager";
import { SocialAccountsCard } from "@/components/dashboard/SocialAccountsCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Brand Manager — Dashboard" };

export default async function MarcaPage({
  searchParams,
}: {
  searchParams: Promise<{ social?: string }>;
}) {
  const { social } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, brand_voice, primary_color, secondary_color, logo_url, city, instagram_user_id, facebook_page_id, tiktok_open_id")
    .eq("id", user.id)
    .single();

  const { data: listingsData } = await supabase
    .from("listings")
    .select("id, title, city, price, currency")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const listings = (listingsData ?? []) as Array<{
    id: string;
    title: string | null;
    city: string | null;
    price: number | null;
    currency: string | null;
  }>;

  const fbAvailable = !!process.env.FACEBOOK_APP_ID;
  const tiktokAvailable = !!process.env.TIKTOK_CLIENT_KEY;

  return (
    <div className="animate-fade-up max-w-3xl">
      <div className="mb-8">
        <span className="label-caps text-[#6B7565]">Identidad</span>
        <h1
          className="text-[#262626] mt-1"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "2rem", fontWeight: 500 }}
        >
          Brand Manager
        </h1>
        <p className="text-sm text-[#6B7565] mt-2">
          Genera creativos con IA, gestiona tu identidad de marca y construye tu kit de voz.
        </p>
      </div>
      <BrandManager profile={profile} listings={listings} />
      <SocialAccountsCard
        instagram={!!profile?.instagram_user_id}
        facebook={!!profile?.facebook_page_id}
        tiktok={!!profile?.tiktok_open_id}
        fbAvailable={fbAvailable}
        tiktokAvailable={tiktokAvailable}
        justConnected={social === "connected"}
        error={social === "error" || social === "unavailable"}
      />
    </div>
  );
}
