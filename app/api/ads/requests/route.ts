import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calcFee } from "@/lib/ads/constants";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("ad_requests")
    .select("*, listings(title, slug)")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ requests: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("ads_access_status, wallet_balance_cents")
    .eq("id", user.id)
    .single();

  if (profile?.ads_access_status !== "approved") {
    return NextResponse.json({ error: "Ads access not approved" }, { status: 403 });
  }

  const body = await request.json();
  const {
    listing_id, platforms, objective, total_budget_cents,
    duration_days, audience_notes, creative_brief,
  } = body as {
    listing_id?: string;
    platforms?: string[];
    objective?: string;
    total_budget_cents?: number;
    duration_days?: number;
    audience_notes?: string;
    creative_brief?: string;
  };

  if (!platforms?.length || !objective || !total_budget_cents || !duration_days) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }
  if (total_budget_cents < 2000) {
    return NextResponse.json({ error: "Presupuesto mínimo $20" }, { status: 400 });
  }

  const { feeCents, spendCents } = calcFee(total_budget_cents);
  const admin = createAdminClient();

  const { data: req, error } = await admin
    .from("ad_requests")
    .insert({
      profile_id:             user.id,
      listing_id:             listing_id ?? null,
      platforms,
      objective,
      total_budget_cents,
      management_fee_cents:   feeCents,
      ad_spend_budget_cents:  spendCents,
      duration_days,
      audience_notes:         audience_notes ?? null,
      creative_brief:         creative_brief ?? null,
    })
    .select("id, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, request: req });
}
