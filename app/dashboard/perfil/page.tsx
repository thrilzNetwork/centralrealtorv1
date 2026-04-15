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
      {/* <GoogleConnectionCard
        connected={!!profile?.google_refresh_token}
        justConnected={google === "connected"}
        error={google === "error"}
      /> */}
    </div>
  );
}
