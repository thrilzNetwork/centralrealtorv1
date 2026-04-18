import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Public endpoint: links a just-signed-up visitor to an affiliate.
// Called from the registro page after Supabase auth.signUp succeeds.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, email } = body as { code?: string; email?: string };

    if (!code || !email) {
      return NextResponse.json({ error: "code and email required" }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
    const cleanEmail = email.toLowerCase().slice(0, 255);
    if (!cleanCode) return NextResponse.json({ error: "invalid code" }, { status: 400 });

    const admin = createAdminClient();

    // Find the affiliate
    const { data: affiliate } = await admin
      .from("affiliates")
      .select("id, active")
      .eq("code", cleanCode)
      .maybeSingle();

    if (!affiliate || !affiliate.active) {
      return NextResponse.json({ skipped: true, reason: "Unknown or inactive code" });
    }

    // Record the referral (unique per referred email + affiliate)
    const { error: refErr } = await admin
      .from("referrals")
      .insert({
        affiliate_id:   affiliate.id,
        referred_email: cleanEmail,
        status:         "signed_up",
      });

    // Ignore duplicate (unique constraint on referred_profile_id will catch
    // once the profile is linked; email dupes may also be filtered)
    if (refErr && refErr.code !== "23505") {
      console.error("referral insert error:", refErr);
    }

    // Bump affiliate counter (total_referrals = signed_up count)
    const { count } = await admin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_id", affiliate.id);
    if (count !== null) {
      await admin.from("affiliates").update({ total_referrals: count }).eq("id", affiliate.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("affiliate track error:", err);
    return NextResponse.json({ error: "Track failed" }, { status: 500 });
  }
}
