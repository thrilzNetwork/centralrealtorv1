import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_balance_cents, ads_access_status")
    .eq("id", user.id)
    .single();

  if (profile?.ads_access_status !== "approved") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: transactions } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    balance_cents: profile.wallet_balance_cents,
    transactions: transactions ?? [],
  });
}
