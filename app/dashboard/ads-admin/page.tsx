import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdsAdminQueue } from "@/components/dashboard/AdsAdminQueue";

export const metadata = { title: "Ads Admin" };

export default async function AdsAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_staff, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_staff) redirect("/dashboard");

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-[#262626]">Ads Admin</h1>
        <p className="text-sm text-[#6B7565] mt-1">Gestiona aplicaciones y campañas del Ads Accelerator.</p>
      </div>
      <AdsAdminQueue />
    </div>
  );
}
