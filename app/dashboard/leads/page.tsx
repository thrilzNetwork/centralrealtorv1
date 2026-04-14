import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LeadsBoard } from "@/components/dashboard/LeadsBoard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Leads — Dashboard" };

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: leads } = await supabase
    .from("leads")
    .select("*, listings(title, slug, images)")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <span className="label-caps text-[#6B7565]">CRM</span>
        <h1
          className="text-[#262626] mt-1"
          style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "2rem", fontWeight: 500 }}
        >
          Leads — {leads?.length ?? 0} contactos
        </h1>
      </div>
      <LeadsBoard leads={leads ?? []} />
    </div>
  );
}
