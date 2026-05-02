import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sendEmail, getAdminEmails } from "@/lib/email/send";
import { contactFormAdmin } from "@/lib/email/templates";

export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { key: "contact", limit: 5, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl);

  try {
    const body = await request.json();
    const { name, phone, role, properties, challenge, score, source } = body;

    if (!name && !phone) {
      return NextResponse.json({ error: "Missing contact info" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Store in contact_leads table (service-level, no profile_id required)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).from("contact_leads").insert({
      name: name ?? null,
      phone: phone ?? null,
      role: role ?? null,
      properties_count: properties ?? null,
      main_challenge: challenge ?? null,
      score: score ?? "medio",
      source: source ?? "landing_chatbot",
    });

    // If table doesn't exist yet, fall back silently — operator can add it via migration
    if (error && error.code !== "42P01") {
      console.error("contact lead insert error:", error.message);
    }

    const admins = getAdminEmails();
    if (admins.length > 0) {
      const tpl = contactFormAdmin({
        name: name ?? null,
        phone: phone ?? null,
        role: role ?? null,
        properties: properties ?? null,
        challenge: challenge ?? null,
        source: source ?? null,
        score: score ?? null,
      });
      sendEmail({
        to: admins,
        subject: tpl.subject,
        text: tpl.text,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("contact route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
