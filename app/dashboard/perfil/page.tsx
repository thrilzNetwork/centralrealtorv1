import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/forms/ProfileBrandingForm";
import { GoogleConnectionCard } from "@/components/dashboard/GoogleConnectionCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mi Perfil — Dashboard" };

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  const { google } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  let isPaid = false;
  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("subscription_status")
      .eq("id", profile.organization_id)
      .single();
    isPaid = org?.subscription_status === "active";
  }

  return (
    <div className="animate-fade-up max-w-2xl">
      <div className="mb-8">
        <span className="label-caps text-[#6B7565]">Configuración</span>
        <h1
          className="text-[#262626] mt-1"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "2rem", fontWeight: 500 }}
        >
          Mi Perfil y Marca
        </h1>
      </div>
      <ProfileEditor profile={profile} />
      {isPaid ? (
        <GoogleConnectionCard
          connected={!!profile?.google_refresh_token}
          justConnected={google === "connected"}
          error={google === "error"}
        />
      ) : (
        <div className="mt-6 flex items-center gap-3 px-4 py-3 border border-[#EAE7DC] rounded-sm bg-[#F7F5EE]">
          <svg className="w-5 h-5 text-[#6B7565] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="text-xs font-medium text-[#262626]">Google Calendar + Gmail</p>
            <p className="text-xs text-[#6B7565] mt-0.5">
              Disponible en plan Pro — activa tu suscripción para sincronizar citas y enviar confirmaciones automáticas.
            </p>
          </div>
          <a
            href="/dashboard/facturacion"
            className="ml-auto shrink-0 px-3 py-1.5 text-xs font-medium bg-[#FF7F11] text-white rounded-sm hover:bg-[#e06e0e] transition-colors"
          >
            Ver planes
          </a>
        </div>
      )}
    </div>
  );
}
