import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DomainManager } from "@/components/forms/DomainManagerForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dominios — Dashboard" };

export default async function DominiosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, domainsRes] = await Promise.all([
    supabase.from("profiles").select("custom_domain, slug, primary_color").eq("id", user.id).single(),
    supabase.from("domain_mappings").select("*").eq("profile_id", user.id),
  ]);

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
      <DomainManager
        currentSlug={profileRes.data?.slug ?? ""}
        currentCustomDomain={profileRes.data?.custom_domain}
        domains={domainsRes.data ?? []}
      />
    </div>
  );
}
