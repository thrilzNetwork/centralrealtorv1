import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

// Called daily by Vercel Cron (see vercel.json).
// Sends a follow-up WhatsApp message to the realtor for warm/hot leads
// that haven't been nurtured in the last 48 hours.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("Authorization");
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // Find warm/hot leads not nurtured recently
  const { data: leads, error } = await admin
    .from("leads")
    .select("id, profile_id, visitor_name, visitor_phone, visitor_email, score_tier, nurture_count, listing_id, listings(title)")
    .in("score_tier", ["hot", "warm"])
    .or(`last_nurture_at.is.null,last_nurture_at.lt.${cutoff}`)
    .lt("nurture_count", 3)
    .order("score", { ascending: false })
    .limit(50);

  if (error) {
    console.error("nurture cron query error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://centralbolivia.com";
  let sent = 0;

  for (const lead of leads ?? []) {
    const listingTitle = (lead.listings as { title?: string } | null)?.title ?? "una propiedad";
    const tierEmoji = lead.score_tier === "hot" ? "🔥" : "☀️";
    const msg = `${tierEmoji} Recordatorio: *${lead.visitor_name ?? "Visitante"}* está interesado en "${listingTitle}". Seguimiento #${(lead.nurture_count ?? 0) + 1}. Revisa: ${siteUrl}/dashboard/leads`;

    await fetch(`${siteUrl}/api/notifications/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: lead.profile_id, message: msg }),
    }).catch((err) => {
      console.error("nurture whatsapp send failed:", lead.id, err);
    });

    await admin
      .from("leads")
      .update({
        last_nurture_at: new Date().toISOString(),
        nurture_count: (lead.nurture_count ?? 0) + 1,
      })
      .eq("id", lead.id);

    sent++;
  }

  return NextResponse.json({ ok: true, processed: sent, total: leads?.length ?? 0 });
}
