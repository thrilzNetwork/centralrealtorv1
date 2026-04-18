import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { google } from "googleapis";

// Sends a "we got your enquiry" auto-reply to the visitor, using the
// realtor's Gmail OAuth token so the reply comes from their address.
export async function POST(request: NextRequest) {
  try {
    const { profile_id, to_email, to_name, subject, body } = await request.json();
    if (!profile_id || !to_email || !subject || !body) {
      return NextResponse.json({ error: "profile_id, to_email, subject, body required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("google_refresh_token, full_name")
      .eq("id", profile_id)
      .single();

    if (!profile?.google_refresh_token) {
      return NextResponse.json({ skipped: true, reason: "No Google token" });
    }

    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2.setCredentials({ refresh_token: profile.google_refresh_token });
    const gmail = google.gmail({ version: "v1", auth: oauth2 });

    const fromName = profile.full_name ?? "Central Bolivia";
    const rawMessage = [
      `To: "${to_name}" <${to_email}>`,
      `From: ${fromName}`,
      "Content-Type: text/plain; charset=utf-8",
      "MIME-Version: 1.0",
      `Subject: ${subject}`,
      "",
      body,
    ].join("\n");

    const encoded = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({ userId: "me", requestBody: { raw: encoded } });
    return NextResponse.json({ sent: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("visitor auto-reply error:", msg);
    return NextResponse.json({ skipped: true, error: msg });
  }
}
