import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdsNewCampaignForm } from "@/components/dashboard/AdsNewCampaignForm";
import Link from "next/link";

export const metadata = { title: "Nueva Campaña" };

export default async function NuevaCampañaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("ads_access_status, wallet_balance_cents")
    .eq("id", user.id)
    .single();

  if (profile?.ads_access_status !== "approved") redirect("/dashboard/ads");

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, slug")
    .eq("profile_id", user.id)
    .eq("status", "activo")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 sm:p-10 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/ads" className="text-xs text-[#6B7565] hover:text-[#262626] flex items-center gap-1 mb-4">
          ← Volver a Ads
        </Link>
        <h1 className="text-2xl font-serif text-[#262626]">Nueva campaña</h1>
        <p className="text-sm text-[#6B7565] mt-1">
          Completa el brief. Nuestro equipo revisará, optimizará y lanzará tu campaña.
        </p>
      </div>

      <AdsNewCampaignForm
        listings={listings ?? []}
        balanceCents={profile?.wallet_balance_cents ?? 0}
      />
    </div>
  );
}
