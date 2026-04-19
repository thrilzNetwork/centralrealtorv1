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

  const { id } = await params;

  const { data: req, error: fetchErr } = await supabase
    .from("ad_requests")
    .select("*")
    .eq("id", id)
    .eq("profile_id", user.id)
    .single();

  if (fetchErr || !req) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (req.status !== "draft") return NextResponse.json({ error: "Solo borradores pueden enviarse" }, { status: 409 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_balance_cents")
    .eq("id", user.id)
    .single();

  if ((profile?.wallet_balance_cents ?? 0) < req.total_budget_cents) {
    return NextResponse.json({
      error: "Saldo insuficiente. Recarga tu wallet.",
      balance_cents: profile?.wallet_balance_cents ?? 0,
      required_cents: req.total_budget_cents,
    }, { status: 402 });
  }

  const admin = createAdminClient();
  await admin.from("ad_requests").update({ status: "queued" }).eq("id", id);

  // Notify staff (fire-and-forget)
  const staffWa = process.env.STAFF_WHATSAPP;
  if (staffWa) {
    const platforms = (req.platforms as string[]).join(", ");
    const budget = `$${(req.total_budget_cents / 100).toFixed(2)}`;
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/notifications/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: staffWa,
        message: `🚀 Nueva campaña en cola\nPlataformas: ${platforms} · Presupuesto: ${budget}\nRevisa en /dashboard/ads-admin`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
