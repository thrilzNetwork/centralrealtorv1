import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const { data: affiliate } = await admin
    .from("affiliates")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!affiliate) {
    return NextResponse.json({ affiliate: null });
  }

  const [{ data: referrals }, { data: credits }] = await Promise.all([
    admin
      .from("referrals")
      .select("id, referred_email, plan, status, commission_cents, created_at, first_payment_at")
      .eq("affiliate_id", affiliate.id)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("affiliate_credits")
      .select("id, amount_cents, reason, description, created_at")
      .eq("affiliate_id", affiliate.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const balanceCents = affiliate.credit_balance_cents - affiliate.credit_used_cents;

  return NextResponse.json({
    affiliate: {
      ...affiliate,
      available_credit_cents: balanceCents,
    },
    referrals: referrals ?? [],
    credits: credits ?? [],
  });
}
