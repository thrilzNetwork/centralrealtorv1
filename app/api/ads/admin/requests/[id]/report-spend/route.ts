import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const { spend_reported_cents, results, mark_completed } = body as {
    spend_reported_cents?: number;
    results?: Record<string, unknown>;
    mark_completed?: boolean;
  };

  const admin = createAdminClient();

  const updates: Record<string, unknown> = {};
  if (spend_reported_cents !== undefined) updates.spend_reported_cents = spend_reported_cents;
  if (results !== undefined) updates.results = results;
  if (mark_completed) {
    updates.status = "completed";
    updates.completed_at = new Date().toISOString();
  }

  await admin.from("ad_requests").update(updates).eq("id", id);

  if (mark_completed) {
    const { data: req } = await admin.from("ad_requests").select("profile_id, results").eq("id", id).single();
    if (req) {
      const { data: profile } = await admin.from("profiles").select("whatsapp").eq("id", req.profile_id).single();
      if (profile?.whatsapp) {
        const r = results ?? {};
        const summary = Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(" · ");
        fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/notifications/whatsapp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: `whatsapp:${profile.whatsapp}`,
            message: `✅ Tu campaña ha *finalizado*.\nResultados: ${summary || "ver dashboard"}\n/dashboard/ads`,
          }),
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json({ success: true });
}
