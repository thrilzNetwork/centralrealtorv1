import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BrandManager } from "@/components/dashboard/BrandManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Brand Manager — Dashboard" };

export default async function MarcaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, brand_voice, primary_color, secondary_color, logo_url, city")
    .eq("id", user.id)
    .single();

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
      <BrandManager profile={profile} />
    </div>
  );
}
