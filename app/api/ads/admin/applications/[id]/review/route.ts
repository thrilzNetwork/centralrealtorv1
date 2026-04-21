import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("is_staff").eq("id", user.id).single();
  if (!me?.is_staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { decision, notes } = body as {
    decision?: "approved" | "rejected" | "suspended";
    notes?: string;
  };

  if (!decision || !["approved", "rejected", "suspended"].includes(decision)) {
    return NextResponse.json({ error: "decision must be approved|rejected|suspended" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: app, error: fetchErr } = await admin
    .from("ads_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await admin
    .from("ads_applications")
    .update({
      status:       decision,
      review_notes: notes ?? null,
      reviewed_by:  user.id,
      reviewed_at:  new Date().toISOString(),
    })
    .eq("id", id);

  await admin
    .from("profiles")
    .update({ ads_access_status: decision })
    .eq("id", app.profile_id);

  await logAudit({
    actor_id:   user.id,
    action:     "ads.application.review",
    subject_id: app.profile_id,
    resource:   `ads_application:${id}`,
    metadata:   { decision, notes: notes ?? null },
  });

  // Notify client (fire-and-forget)
  const { data: clientProfile } = await admin
    .from("profiles")
    .select("whatsapp")
    .eq("id", app.profile_id)
    .single();

  if (clientProfile?.whatsapp) {
    const msg = decision === "approved"
      ? `✅ Tu solicitud de Ads Accelerator fue *aprobada*. Ya puedes recargar tu wallet y lanzar campañas en /dashboard/ads`
      : `❌ Tu solicitud de Ads Accelerator fue ${decision === "rejected" ? "rechazada" : "suspendida"}.${notes ? `\nMotivo: ${notes}` : ""} Escríbenos para más info.`;

    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/notifications/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: `whatsapp:${clientProfile.whatsapp}`, message: msg }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, decision });
}
