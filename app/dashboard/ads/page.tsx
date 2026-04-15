import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Megaphone, Wallet, Play, TrendingUp, Zap } from "lucide-react";

export default async function AdsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, slug")
    .eq("id", user.id)
    .single();

  const { data: credits } = await supabase
    .from("ad_credits")
    .select("credits_remaining")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const balance = credits?.credits_remaining ?? 0;

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-10 h-10 rounded-sm bg-[#FF7F11]/10 flex items-center justify-center flex-shrink-0">
          <Megaphone className="w-5 h-5 text-[#FF7F11]" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif text-[#262626]">Ads Accelerator</h1>
            <span className="label-caps text-[10px] bg-[#262626] text-white px-2 py-1 rounded-sm">Beta</span>
          </div>
          <p className="text-sm text-[#6B7565] mt-1">Lanza campañas en Meta y TikTok directamente desde tus propiedades</p>
        </div>
      </div>

      {/* Ad Wallet */}
      <div className="bg-white border border-[#EAE7DC] rounded-sm p-6 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-sm bg-[#F7F5EE] flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#6B7565]" />
          </div>
          <div>
            <p className="label-caps text-[#6B7565] text-[10px]">Saldo en Monedero</p>
            <p className="text-2xl font-light text-[#262626]">${balance.toFixed(2)} <span className="text-sm text-[#6B7565]">USD</span></p>
          </div>
        </div>
        <button
          disabled
          className="label-caps px-5 py-2.5 bg-[#FF7F11] text-white rounded-sm opacity-60 cursor-not-allowed text-xs"
        >
          Recargar créditos — Próximamente
        </button>
      </div>

      {/* Connect platforms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-[#EAE7DC] rounded-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Play className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#262626]">Meta Business Suite</p>
              <p className="text-xs text-[#6B7565]">Facebook + Instagram Ads</p>
            </div>
          </div>
          <button disabled className="w-full label-caps text-xs py-2 border border-[#D8D3C8] rounded-sm text-[#6B7565] cursor-not-allowed opacity-60">
            Conectar cuenta — Próximamente
          </button>
        </div>

        <div className="bg-white border border-[#EAE7DC] rounded-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#262626]">TikTok Business</p>
              <p className="text-xs text-[#6B7565]">TikTok Ads Manager</p>
            </div>
          </div>
          <button disabled className="w-full label-caps text-xs py-2 border border-[#D8D3C8] rounded-sm text-[#6B7565] cursor-not-allowed opacity-60">
            Conectar cuenta — Próximamente
          </button>
        </div>
      </div>

      {/* Coming soon — AI creatives preview */}
      <div className="border border-dashed border-[#D8D3C8] rounded-sm p-8 text-center">
        <div className="w-10 h-10 rounded-full bg-[#FF7F11]/10 flex items-center justify-center mx-auto mb-3">
          <Zap className="w-5 h-5 text-[#FF7F11]" />
        </div>
        <h3 className="font-serif text-lg text-[#262626] mb-1">Creativos IA de Alto Click</h3>
        <p className="text-sm text-[#6B7565] max-w-sm mx-auto">
          Selecciona una propiedad y genera automáticamente el copy y el diseño de tu anuncio usando tu voz de marca y las fotos de la propiedad.
        </p>
        <p className="mt-4 label-caps text-[10px] text-[#ACBFA4]">Disponible en la próxima actualización</p>
      </div>
    </div>
  );
}
