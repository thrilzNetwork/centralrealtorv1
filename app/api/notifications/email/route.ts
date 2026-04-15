import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { google } from "googleapis";

// Sends a Gmail notification to a realtor when a new lead comes in.
// Fire-and-forget — caller should not await this if latency matters.
export async function POST(request: NextRequest) {
  try {
    const { profile_id, subject, body } = await request.json();

    if (!profile_id || !subject || !body) {
      return NextResponse.json({ error: "profile_id, subject, body required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("google_refresh_token, email")
      .eq("id", profile_id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!profile.google_refresh_token) {
      return NextResponse.json({ skipped: true, reason: "No Google token" });
    }

    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2.setCredentials({ refresh_token: profile.google_refresh_token });

    const gmail = google.gmail({ version: "v1", auth: oauth2 });

    const toEmail = profile.email;
    const rawMessage = [
      `To: ${toEmail}`,
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

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encoded },
    });

    return NextResponse.json({ sent: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("email notification error:", msg);
    // Return 200 so the leads route doesn't throw — email is best-effort
    return NextResponse.json({ skipped: true, error: msg });
  }
}
