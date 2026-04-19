import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("is_staff").eq("id", user.id).single();
  if (!me?.is_staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const admin = createAdminClient();

  await admin
    .from("ad_requests")
    .update({ assigned_staff_id: user.id })
    .eq("id", id);

  await admin.from("ad_request_updates").insert({
    request_id: id,
    author_id:  user.id,
    message:    "Solicitud asignada.",
  });

  return NextResponse.json({ success: true });
}
