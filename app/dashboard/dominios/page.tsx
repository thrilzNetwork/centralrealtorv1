import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DomainManager } from "@/components/forms/DomainManagerForm";
import { DomainSearch } from "@/components/forms/DomainSearch";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dominios — Dashboard" };

export default async function DominiosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, domainsRes, orgRes] = await Promise.all([
    supabase.from("profiles").select("custom_domain, slug, primary_color, organization_id").eq("id", user.id).single(),
    supabase.from("domain_mappings").select("*").eq("profile_id", user.id),
    supabase.from("profiles").select("organization_id").eq("id", user.id).single(),
  ]);

  // Check if user is on premium plan
  let isPremium = false;
  if (orgRes.data?.organization_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: org } = await (supabase as any).from("organizations").select("plan").eq("id", orgRes.data.organization_id).single();
    isPremium = org?.plan === "broker" || org?.plan === "profesional";
  }

  return (
    <div className="animate-fade-up max-w-2xl">
      <div className="mb-8">
        <span className="label-caps text-[#6B7565]">Identidad Digital</span>
        <h1
          className="text-[#262626] mt-1"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "2rem", fontWeight: 500 }}
        >
          Gestión de Dominios
        </h1>
        <p className="text-sm text-[#6B7565] mt-2">
          Conecta tu propio dominio para que tu portal sea accesible en
          <strong className="text-[#262626]"> tumarca.com</strong> en lugar de un subdominio.
        </p>
      </div>
      <DomainSearch isPremium={isPremium} />

      <div className="mt-10 pt-8 border-t border-[#EAE7DC]">
        <p className="label-caps text-[#6B7565] mb-6">Ya tienes un dominio — conéctalo aquí ↓</p>
        <DomainManager
          currentSlug={profileRes.data?.slug ?? ""}
          currentCustomDomain={profileRes.data?.custom_domain}
          domains={domainsRes.data ?? []}
        />
      </div>
    </div>
  );
}
