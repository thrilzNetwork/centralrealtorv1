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
  const { external_campaign_ids } = body as { external_campaign_ids?: Record<string, string> };

  const admin = createAdminClient();

  const { data: req, error: fetchErr } = await admin
    .from("ad_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !req) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Re-check wallet balance atomically
  const { data: profile } = await admin
    .from("profiles")
    .select("wallet_balance_cents, whatsapp")
    .eq("id", req.profile_id)
    .single();

  if ((profile?.wallet_balance_cents ?? 0) < req.total_budget_cents) {
    return NextResponse.json({ error: "Saldo insuficiente para lanzar" }, { status: 402 });
  }

  // Deduct fee + ad spend (two separate transactions for transparency)
  const now = new Date().toISOString();

  await admin.from("wallet_transactions").insert([
    {
      profile_id:   req.profile_id,
      amount_cents: -req.management_fee_cents,
      type:         "fee",
      request_id:   id,
      description:  `Comisión de gestión (3%) — campaña ${id.slice(0, 8)}`,
    },
    {
      profile_id:   req.profile_id,
      amount_cents: -req.ad_spend_budget_cents,
      type:         "ad_spend",
      request_id:   id,
      description:  `Presupuesto publicitario — campaña ${id.slice(0, 8)}`,
    },
  ]);

  await admin.from("ad_requests").update({
    status:               "active",
    launched_at:          now,
    external_campaign_ids: external_campaign_ids ?? {},
    assigned_staff_id:    user.id,
  }).eq("id", id);

  await admin.from("ad_request_updates").insert({
    request_id:    id,
    author_id:     user.id,
    message:       `Campaña lanzada. IDs: ${JSON.stringify(external_campaign_ids ?? {})}`,
    status_change: "active",
  });

  await logAudit({
    actor_id:   user.id,
    action:     "ads.campaign.launch",
    subject_id: req.profile_id,
    resource:   `ad_request:${id}`,
    metadata: {
      total_budget_cents:     req.total_budget_cents,
      management_fee_cents:   req.management_fee_cents,
      ad_spend_budget_cents:  req.ad_spend_budget_cents,
      external_campaign_ids:  external_campaign_ids ?? {},
      platforms:              req.platforms,
    },
  });

  // Notify client
  if (profile?.whatsapp) {
    const budget = `$${(req.ad_spend_budget_cents / 100).toFixed(2)}`;
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/notifications/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: `whatsapp:${profile.whatsapp}`,
        message: `🚀 Tu campaña está *activa*!\nPresupuesto: ${budget} USD en ${(req.platforms as string[]).join(", ")}.\nSigue el progreso en /dashboard/ads`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
