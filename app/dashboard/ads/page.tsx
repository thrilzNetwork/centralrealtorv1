import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Megaphone } from "lucide-react";
import { AdsAccelerator } from "@/components/dashboard/AdsAccelerator";

export const metadata = { title: "Ads Accelerator" };

export default async function AdsPage({
  searchParams,
}: {
  searchParams: Promise<{ topup?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("ads_access_status, wallet_balance_cents")
    .eq("id", user.id)
    .single();

  const sp = await searchParams;

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto">
      <div className="flex items-start gap-4 mb-8">
        <div className="w-10 h-10 rounded-sm bg-[#FF7F11]/10 flex items-center justify-center flex-shrink-0">
          <Megaphone className="w-5 h-5 text-[#FF7F11]" />
        </div>
        <div>
          <h1 className="text-2xl font-serif text-[#262626]">Ads Accelerator</h1>
          <p className="text-sm text-[#6B7565] mt-1">
            Un equipo americano-boliviano lanza tus anuncios en Meta, TikTok y Google.
          </p>
        </div>
      </div>

      <AdsAccelerator
        initialStatus={profile?.ads_access_status ?? "none"}
        initialBalance={profile?.wallet_balance_cents ?? 0}
        topupParam={sp.topup ?? null}
      />
    </div>
  );
}
