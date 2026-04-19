import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isStaffGuard(isStaff: boolean) {
  return !isStaff
    ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
    : null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("is_staff").eq("id", user.id).single();
  const guard = isStaffGuard(!!me?.is_staff);
  if (guard) return guard;

  const admin = createAdminClient();
  const { data } = await admin
    .from("ads_applications")
    .select("*, profiles(full_name, email, slug)")
    .order("created_at", { ascending: false });

  return NextResponse.json({ applications: data ?? [] });
}
